import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Farmer } from '@/models/Farmer';
import { CropCycle } from '@/models/CropCycle';
import { SMSLog } from '@/models/SMSLog';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    
    const farmersCount = await Farmer.countDocuments();
    
    const cropStats = await CropCycle.aggregate([
      {
        $group: {
          _id: null,
          totalAcres: { $sum: '$acres' },
          totalFunded: { $sum: '$fundedAmount' },
          totalCycles: { $sum: 1 }
        }
      }
    ]);
    
    const smsCount = await SMSLog.countDocuments();
    
    const stats = cropStats[0] || { totalAcres: 0, totalFunded: 0, totalCycles: 0 };
    
    return NextResponse.json({
      farmers: farmersCount,
      acres: stats.totalAcres,
      funded: stats.totalFunded,
      cycles: stats.totalCycles,
      sms: smsCount
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json({ farmers: 0, acres: 0, funded: 0, cycles: 0, sms: 0 }, { status: 500 });
  }
}
