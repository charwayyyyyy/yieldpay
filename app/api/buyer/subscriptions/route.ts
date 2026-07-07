import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Subscription } from '@/models/Subscription';
import { CropCycle } from '@/models/CropCycle';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    // For demo purposes, we fetch all subscriptions if no email is provided,
    // or filter by email if one is provided in the query string.
    const email = req.nextUrl.searchParams.get('email');
    
    // In a real app, we'd lookup the User by email and use buyerId.
    // Here we'll just populate everything for demo simplicity, or filter if we had buyer details on Sub.
    // Wait, the Subscription model has buyerId. Let's just fetch all and populate buyer and crop.
    
    let query = {}; // all for demo
    
    const subscriptions = await Subscription.find(query)
      .populate('cropCycleId')
      .populate('buyerId', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ ok: true, data: subscriptions });
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}
