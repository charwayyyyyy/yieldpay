import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/db';
import { CropCycle } from '@/models/CropCycle';
import { Farmer } from '@/models/Farmer';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    const crop = await CropCycle.findById(params.id).lean();
    if (!crop) {
      return NextResponse.json({ ok: false, error: 'Crop not found' }, { status: 404 });
    }

    const farmer = await Farmer.findById(crop.farmerId).lean();

    return NextResponse.json({
      ok: true,
      data: {
        crop,
        farmer: farmer ? { name: farmer.name.split(' ')[0] } : { name: 'A farmer' } // Anonymize farmer name
      }
    });

  } catch (error) {
    console.error('Fetch crop error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
