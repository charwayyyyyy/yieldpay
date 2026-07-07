import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { InsuranceClaim } from '@/models/InsuranceClaim';
import { CropCycle } from '@/models/CropCycle';
import { Farmer } from '@/models/Farmer';
import { Transaction } from '@/models/Transaction';
import { DisbursementLog } from '@/models/DisbursementLog';
import { initiateDisbursement, sendSMS } from '@/lib/moolre';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { claimId } = await req.json();
    if (!claimId) return NextResponse.json({ ok: false, error: 'Missing claimId' }, { status: 400 });

    await dbConnect();

    const claim = await InsuranceClaim.findById(claimId);
    if (!claim) return NextResponse.json({ ok: false, error: 'Claim not found' }, { status: 404 });

    const crop = await CropCycle.findById(claim.cropCycleId);
    const farmer = await Farmer.findById(claim.farmerId);

    if (!crop || !farmer) return NextResponse.json({ ok: false, error: 'Invalid claim context' }, { status: 400 });

    let decisionData = {
      intent: 'insurance_claim',
      cause: 'other',
      severity: 'low',
      decision: 'manual_review',
      confidence: 0,
      reason: 'AI service unavailable',
      recommendedPayoutPercentage: 0
    };

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
          Analyze the following agricultural insurance claim from a Ghanaian farmer.
          Crop: ${crop.acres} acres of ${crop.cropType} in ${crop.region} Region.
          Farmer's Description: "${claim.description}"
          
          Respond strictly in the following JSON format without any markdown wrappers or extra text:
          {
            "intent": "insurance_claim",
            "cause": "drought|flood|pests|disease|other",
            "severity": "low|medium|high",
            "decision": "approve|manual_review|reject",
            "confidence": 0.0 to 1.0,
            "reason": "short explanation",
            "recommendedPayoutPercentage": 0 to 100
          }
        `;

        const result = await model.generateContent(prompt);
        let text = result.response.text();
        
        // Strip markdown if AI included it
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        decisionData = JSON.parse(text);

      } catch (aiError) {
        console.error('AI Processing Error:', aiError);
      }
    }

    claim.aiDecision = decisionData;
    claim.severity = decisionData.severity as any;
    claim.confidence = decisionData.confidence;
    
    // Backend decision engine
    if (decisionData.decision === 'approve' && decisionData.confidence >= 0.8) {
      // Calculate payout: min(fundingRequired * percentage, max limit e.g. fundingRequired)
      const maxPayout = crop.fundingRequired;
      const proposedPayout = maxPayout * (decisionData.recommendedPayoutPercentage / 100);
      claim.payoutAmount = Math.min(proposedPayout, maxPayout);
      claim.status = 'approved';
      await claim.save();

      // Trigger disbursement
      const disbRef = `YP-INS-${Date.now()}`;
      const tx = new Transaction({
         reference: disbRef,
         cropCycleId: crop._id,
         farmerId: farmer._id,
         type: 'insurance_payout',
         amount: claim.payoutAmount,
         status: 'pending'
      });
      await tx.save();

      claim.transactionId = tx._id;
      await claim.save();

      const disbResult = await initiateDisbursement({
         amount: claim.payoutAmount,
         recipientPhone: farmer.mobileMoneyNumber,
         recipientName: farmer.name,
         reference: disbRef,
         narration: `YieldPay Insurance Payout for ${crop.cropType}`
      });

      const log = new DisbursementLog({
         transactionId: tx._id,
         farmerId: farmer._id,
         amount: claim.payoutAmount,
         phoneNumber: farmer.mobileMoneyNumber,
         attempts: 1,
         status: disbResult.ok ? 'success' : 'failed',
         providerReference: disbResult.providerReference,
         rawProviderResponse: disbResult.raw
      });
      await log.save();

      tx.status = disbResult.ok ? 'success' : 'failed';
      tx.moolreReference = disbResult.providerReference;
      tx.rawProviderResponse = disbResult.raw;
      await tx.save();

      if (disbResult.ok) {
         claim.status = 'paid';
         await claim.save();
         await sendSMS({
           to: farmer.phone,
           message: `YieldPay AI Insurance: Your claim was approved. GHS ${claim.payoutAmount} has been disbursed to your mobile money. Reason: ${decisionData.reason}`
         });
      } else {
         await sendSMS({
           to: farmer.phone,
           message: `YieldPay AI Insurance: Your claim was approved, but payment failed. We are investigating.`
         });
      }

    } else {
      claim.status = decisionData.decision === 'reject' ? 'rejected' : 'pending';
      await claim.save();
      
      const msgStatus = claim.status === 'rejected' ? 'rejected' : 'under manual review';
      await sendSMS({
        to: farmer.phone,
        message: `YieldPay AI Insurance: Your claim is ${msgStatus}. Reason: ${decisionData.reason}`
      });
    }

    return NextResponse.json({ ok: true, data: claim });
  } catch (error: any) {
    console.error('Insurance process error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
