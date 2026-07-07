import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/db';
import { Farmer } from '@/models/Farmer';
import { CropCycle } from '@/models/CropCycle';
import { Transaction } from '@/models/Transaction';
import { Subscription } from '@/models/Subscription';
import { WebhookEvent } from '@/models/WebhookEvent';
import { DisbursementLog } from '@/models/DisbursementLog';
import { SMSLog } from '@/models/SMSLog';
import { USSDSession } from '@/models/USSDSession';
import { InsuranceClaim } from '@/models/InsuranceClaim';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const query = searchParams.get('q');

    if (key !== process.env.ADMIN_DEMO_KEY) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let crop;

    if (query) {
      // Try to find by crop cycle ID directly
      if (query.length === 24) {
        crop = await CropCycle.findById(query).catch(() => null);
      }

      // If not found, try farmer phone
      if (!crop) {
        const farmer = await Farmer.findOne({ phone: query });
        if (farmer) {
          crop = await CropCycle.findOne({ farmerId: farmer._id }).sort({ createdAt: -1 });
        }
      }

      // If not found, try transaction reference
      if (!crop) {
        const tx = await Transaction.findOne({ reference: query });
        if (tx) {
          crop = await CropCycle.findById(tx.cropCycleId);
        }
      }
    }

    // Default to the most recent crop if no query or not found
    if (!crop) {
      crop = await CropCycle.findOne().sort({ createdAt: -1 });
    }

    if (!crop) {
      return NextResponse.json({ ok: false, error: 'No trace data found' }, { status: 404 });
    }

    // Now gather all related lifecycle events for this crop cycle
    const farmer = await Farmer.findById(crop.farmerId);
    const transactions = await Transaction.find({ cropCycleId: crop._id }).lean();
    const subscriptions = await Subscription.find({ cropCycleId: crop._id }).lean();
    
    // Webhooks related to the transactions
    const txRefs = transactions.map(t => t.reference);
    const webhooks = await WebhookEvent.find({ reference: { $in: txRefs } }).lean();
    
    // Disbursements related to the farmer/crop (only those mapping to this crop's transactions, or all recent for farmer)
    // We filter disbursements linked to the transactions of this crop
    const txIds = transactions.map(t => t._id);
    const disbursements = await DisbursementLog.find({ transactionId: { $in: txIds } }).lean();
    
    // SMS Logs for the farmer
    let smsLogs: any[] = [];
    if (farmer) {
      smsLogs = await SMSLog.find({ phoneNumber: farmer.phone }).lean();
    }
    
    // Insurance Claims for the crop
    const claims = await InsuranceClaim.find({ cropCycleId: crop._id }).lean();

    // Compile Timeline
    const timeline = [];

    // 1. Farmer Registration (USSD)
    if (farmer) {
      timeline.push({
        id: `farmer-${farmer._id}`,
        timestamp: farmer.createdAt,
        type: 'FARMER_REGISTERED',
        status: 'success',
        source: 'USSD',
        reference: farmer.phone,
        message: `Farmer registered profile.`
      });
    }

    // 2. Crop Cycle Created
    timeline.push({
      id: `crop-${crop._id}`,
      timestamp: crop.createdAt,
      type: 'CROP_CREATED',
      status: 'success',
      source: 'MongoDB',
      reference: crop._id.toString(),
      message: `${crop.acres} acres of ${crop.cropType} listed for funding.`
    });

    // 3. Transactions & Webhooks
    for (const tx of transactions) {
      timeline.push({
        id: `tx-${tx._id}`,
        timestamp: tx.createdAt,
        type: tx.type === 'collection' ? 'BUYER_PAYMENT_INITIATED' : 'DISBURSEMENT_INITIATED',
        status: tx.status,
        source: tx.type === 'collection' ? 'Web' : 'Backend',
        reference: tx.reference,
        message: `Transaction for GHS ${tx.amount} initiated.`
      });

      const relatedWebhook = webhooks.find(w => w.reference === tx.reference);
      if (relatedWebhook) {
        timeline.push({
          id: `webhook-${relatedWebhook._id}`,
          timestamp: relatedWebhook.createdAt,
          type: 'MOOLRE_WEBHOOK_RECEIVED',
          status: 'success',
          source: 'Moolre',
          reference: relatedWebhook.reference,
          message: `Webhook confirmed transaction status: ${relatedWebhook.eventType}`
        });
      }
    }

    // 4. Subscriptions
    for (const sub of subscriptions) {
      timeline.push({
        id: `sub-${sub._id}`,
        timestamp: sub.createdAt,
        type: 'SUBSCRIPTION_CREATED',
        status: 'success',
        source: 'MongoDB',
        reference: sub._id.toString(),
        message: `Buyer funded ${sub.shares} shares (GHS ${sub.amount}).`
      });
    }

    // 5. Disbursements
    for (const disb of disbursements) {
      timeline.push({
        id: `disb-${disb._id}`,
        timestamp: disb.createdAt,
        type: 'FARMER_DISBURSEMENT',
        status: disb.status,
        source: 'Moolre',
        reference: disb.providerReference || 'N/A',
        message: `Disbursement of GHS ${disb.amount} to farmer mobile money.`
      });
    }

    // 6. Insurance Claims
    for (const claim of claims) {
      timeline.push({
        id: `claim-${claim._id}`,
        timestamp: claim.createdAt,
        type: 'INSURANCE_CLAIM_FILED',
        status: claim.status,
        source: 'USSD',
        reference: claim._id.toString(),
        message: `Farmer reported: "${claim.description}"`
      });

      if (claim.aiDecision) {
        timeline.push({
          id: `ai-${claim._id}`,
          timestamp: claim.updatedAt,
          type: 'GEMINI_AI_DECISION',
          status: claim.status === 'approved' ? 'success' : claim.status === 'rejected' ? 'failed' : 'pending',
          source: 'Gemini',
          reference: `Confidence: ${(claim.confidence * 100).toFixed(0)}%`,
          message: `AI decided: ${claim.aiDecision.decision}. Reason: ${claim.aiDecision.reason}`
        });
      }
    }

    // 7. SMS Logs
    // Filter SMS logs to those that occurred after crop creation
    for (const sms of smsLogs) {
      if (new Date(sms.createdAt) >= new Date(crop.createdAt)) {
        timeline.push({
          id: `sms-${sms._id}`,
          timestamp: sms.createdAt,
          type: 'SMS_SENT',
          status: sms.status,
          source: 'Moolre',
          reference: sms.providerReference || 'N/A',
          message: `Sent to ${sms.phoneNumber}: "${sms.message}"`
        });
      }
    }

    // Sort timeline chronologically
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return NextResponse.json({
      ok: true,
      data: {
        crop,
        farmer,
        timeline
      }
    });

  } catch (error: any) {
    console.error('Trace API Error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
