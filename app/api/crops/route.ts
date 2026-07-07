import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { CropCycle } from '@/models/CropCycle';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    // Only return open or partially funded crops for the marketplace
    const crops = await CropCycle.find({
      status: { $in: ['open', 'partially_funded'] }
    }).sort({ createdAt: -1 });

    return NextResponse.json({ ok: true, data: crops });
  } catch (error: any) {
    console.error('Error fetching crops:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch crops' }, { status: 500 });
  }
}
