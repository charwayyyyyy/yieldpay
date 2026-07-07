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
    const signature = req.headers.get('x-moolre-signature') || ''; // Adjust header based on Moolre docs
    
    // Verify signature
    const isValid = verifyWebhookSignature({ rawBody, signatureHeader: signature });
    if (!isValid) {
       console.error('Webhook signature verification failed');
       return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    await dbConnect();

    // Idempotency check: use Moolre's transaction ID or a generated hash as key
    const eventId = payload.id || payload.transaction_id || payload.reference;
    const eventType = payload.event || payload.status || 'unknown';

    if (!eventId) {
       return new NextResponse('Bad Request: Missing reference', { status: 400 });
    }

    const existingEvent = await WebhookEvent.findOne({ idempotencyKey: eventId });
    if (existingEvent) {
       return new NextResponse('Already processed', { status: 200 });
    }

    const webhookEvent = new WebhookEvent({
       eventType,
       reference: eventId,
       idempotencyKey: eventId,
       payload,
    });
    await webhookEvent.save();

    // We only process successful collections for this demo
    if (eventType === 'successful' || eventType === 'payment.success') {
       const reference = payload.reference || payload.data?.reference;
       
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
                message: `YieldPay Alert: You have received GHS ${crop.fundedAmount} operating capital. Your ${crop.acres} acres of ${crop.cropType} have been funded by an urban subscriber. Start planting.`
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
