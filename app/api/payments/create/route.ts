import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { CropCycle } from '@/models/CropCycle';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';
import { createCollectionPayment } from '@/lib/moolre';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const formData = await req.formData();
    const cropCycleId = formData.get('cropCycleId') as string;
    const buyerName = formData.get('buyerName') as string;
    const buyerPhone = formData.get('buyerPhone') as string;
    const buyerEmail = formData.get('buyerEmail') as string;
    const amountStr = formData.get('amount') as string;
    
    if (!cropCycleId || !buyerName || (!buyerPhone && !buyerEmail) || !amountStr) {
       return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
       return NextResponse.json({ ok: false, error: 'Invalid amount' }, { status: 400 });
    }

    const crop = await CropCycle.findById(cropCycleId);
    if (!crop) {
       return NextResponse.json({ ok: false, error: 'Crop cycle not found' }, { status: 404 });
    }

    if (crop.status !== 'open' && crop.status !== 'partially_funded') {
       return NextResponse.json({ ok: false, error: 'Crop cycle is no longer accepting funds' }, { status: 400 });
    }

    // Find or create buyer
    let buyer = await User.findOne({ $or: [{ email: buyerEmail }, { phone: buyerPhone }] });
    if (!buyer) {
       buyer = new User({
          role: 'buyer',
          name: buyerName,
          email: buyerEmail,
          phone: buyerPhone,
       });
       await buyer.save();
    }

    const reference = `YP-COL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const transaction = new Transaction({
       reference,
       buyerId: buyer._id,
       cropCycleId: crop._id,
       farmerId: crop.farmerId,
       type: 'collection',
       amount,
       status: 'pending'
    });
    await transaction.save();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const paymentResult = await createCollectionPayment({
       amount,
       reference,
       customerName: buyer.name,
       customerPhone: buyer.phone || '',
       customerEmail: buyer.email || '',
       callbackUrl: `${appUrl}/api/webhooks/moolre`,
       redirectUrl: `${appUrl}/dashboard`,
       description: `Funding ${crop.acres} acres of ${crop.cropType}`
    });

    if (!paymentResult.ok) {
       transaction.status = 'failed';
       transaction.rawProviderResponse = paymentResult.raw;
       await transaction.save();
       return NextResponse.json({ ok: false, error: paymentResult.error }, { status: 400 });
    }

    transaction.moolreReference = paymentResult.providerReference;
    transaction.paymentUrl = paymentResult.paymentUrl;
    transaction.rawProviderResponse = paymentResult.raw;
    await transaction.save();

    if (paymentResult.paymentUrl) {
       return NextResponse.redirect(paymentResult.paymentUrl, 303);
    } else {
       // Fallback if no URL is returned (e.g. USSD prompt initiated directly)
       return NextResponse.redirect(`${appUrl}/dashboard?msg=payment_initiated`, 303);
    }

  } catch (error: any) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
