import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { WebhookEvent } from '@/models/WebhookEvent';
import { Transaction } from '@/models/Transaction';
import { Subscription } from '@/models/Subscription';
import { CropCycle } from '@/models/CropCycle';
import { Farmer } from '@/models/Farmer';
import { DisbursementLog } from '@/models/DisbursementLog';
import { initiateDisbursement, sendSMS, verifyWebhookSignature } from '@/lib/moolre';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-moolre-signature') || ''; 
    
    // Signature verification is optional unless strictly required by ENV, per instructions.
    const isValid = verifyWebhookSignature({ rawBody, signatureHeader: signature });
    if (process.env.MOOLRE_WEBHOOK_REQUIRE_SIGNATURE === 'true') {
       if (!isValid) {
          return new NextResponse('Bad Request: Invalid signature', { status: 400 });
       }
    } else {
       if (!isValid) {
          console.warn('Webhook signature verification failed or missing - proceeding since it is allowed in demo mode');
       }
    }

    const payload = JSON.parse(rawBody);
    await dbConnect();

    // Map according to Moolre specs
    const reference = payload.data?.externalref || payload.data?.reference || payload.reference;
    const providerReference = payload.id || payload.transaction_id || payload.data?.reference;
    const status = payload.status || payload.event;
    const code = payload.code || payload.data?.code;
    
    // Idempotency key: combination of reference and status
    const idempotencyKey = providerReference || `${reference}-${status}`;

    if (!reference) {
       return new NextResponse('Bad Request: Missing reference', { status: 400 });
    }

    const existingEvent = await WebhookEvent.findOne({ idempotencyKey });
    if (existingEvent) {
       return new NextResponse('Already processed', { status: 200 });
    }

    const webhookEvent = new WebhookEvent({
       eventType: status,
       reference: reference,
       idempotencyKey,
       payload,
    });
    await webhookEvent.save();

    // Success in Moolre collections: status 1 and code 'P01', or legacy 'successful'
    const isSuccess = (status === 1 || status === '1') && (code === 'P01') || status === 'successful' || status === 'payment.success';

    if (isSuccess) {
       const transaction = await Transaction.findOne({ reference });
       if (!transaction) {
          return new NextResponse('Transaction not found', { status: 404 });
       }

       if (transaction.status === 'success') {
          return new NextResponse('Transaction already marked success', { status: 200 });
       }

       transaction.status = 'success';
       transaction.rawProviderResponse = payload;
       await transaction.save();

       // Create subscription
       const crop = await CropCycle.findById(transaction.cropCycleId);
       if (!crop) return new NextResponse('Crop not found', { status: 404 });

       const shares = Math.floor(transaction.amount / crop.pricePerShare);
       
       const subscription = new Subscription({
          buyerId: transaction.buyerId,
          cropCycleId: transaction.cropCycleId,
          farmerId: transaction.farmerId,
          transactionId: transaction._id,
          amount: transaction.amount,
          shares
       });
       await subscription.save();

       // Update Crop
       crop.fundedAmount += transaction.amount;
       crop.sharesFunded += shares;
       
       if (crop.fundedAmount >= crop.fundingRequired) {
          crop.status = 'funded';
          crop.stage = 'funded';
          await crop.save();

          // Trigger farmer disbursement
          const farmer = await Farmer.findById(crop.farmerId);
          if (farmer) {
             const disbRef = `YP-DISB-${Date.now()}`;
             const disbTx = new Transaction({
                reference: disbRef,
                cropCycleId: crop._id,
                farmerId: farmer._id,
                type: 'disbursement',
                amount: crop.fundedAmount,
                status: 'pending'
             });
             await disbTx.save();

             const disbLog = new DisbursementLog({
                transactionId: disbTx._id,
                farmerId: farmer._id,
                amount: crop.fundedAmount,
                phoneNumber: farmer.mobileMoneyNumber,
                attempts: 1
             });
             await disbLog.save();

             const disbResult = await initiateDisbursement({
                amount: crop.fundedAmount,
                recipientPhone: farmer.mobileMoneyNumber,
                recipientName: farmer.name,
                reference: disbRef,
                narration: `YieldPay capital for ${crop.acres} acres of ${crop.cropType}`
             });

             if (disbResult.ok) {
                disbTx.status = 'success';
                disbTx.moolreReference = disbResult.providerReference;
                disbLog.status = 'success';
                disbLog.providerReference = disbResult.providerReference;
             } else {
                disbTx.status = 'failed';
                disbLog.status = 'failed';
             }
             
             disbTx.rawProviderResponse = disbResult.raw;
             disbLog.rawProviderResponse = disbResult.raw;
             
             await disbTx.save();
             await disbLog.save();

             // Send SMS
             await sendSMS({
                to: farmer.phone,
                message: `YieldPay: GHS ${crop.fundedAmount} operating capital disbursed. ${crop.acres} acres of ${crop.cropType} funded. Start planting.`
             });
          }
       } else {
          crop.status = 'partially_funded';
          await crop.save();
       }

       webhookEvent.processed = true;
       await webhookEvent.save();
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
