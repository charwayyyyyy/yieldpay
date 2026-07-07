import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { USSDSession } from '@/models/USSDSession';
import { Farmer } from '@/models/Farmer';
import { CropCycle } from '@/models/CropCycle';
import { InsuranceClaim } from '@/models/InsuranceClaim';
import { sendSMS } from '@/lib/moolre';

// Calculate required funding based on crop and acres (Simplified transparent table)
function calculateFunding(crop: string, acres: number): number {
  const rates: Record<string, number> = {
    'Maize': 1500,
    'Yam': 2500,
    'Cassava': 1200,
    'Tomato': 3000,
    'Rice': 2000,
  };
  const rate = rates[crop] || 1500;
  return rate * acres;
}

const regions = ['Ashanti', 'Northern', 'Bono East', 'Volta', 'Eastern'];
const crops = ['Maize', 'Yam', 'Cassava', 'Tomato', 'Rice'];
const stages = ['Land prepared', 'Planted', 'Germinating', 'Growing', 'Ready for harvest'];

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    // Moolre might send JSON or URL-encoded form data
    const contentType = req.headers.get('content-type') || '';
    let body: any = {};
    
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    }

    const sessionId = body.sessionId || body.session_id;
    const phoneNumber = body.phoneNumber || body.phone || body.msisdn;
    const serviceCode = body.serviceCode || body.service_code;
    const rawText = body.text || body.message || '';

    if (!sessionId || !phoneNumber) {
      return new NextResponse('END Invalid request', { status: 400 });
    }

    // Standard USSD parsing: "1*2*3" -> current input is "3"
    const textArray = rawText.split('*');
    const currentInput = textArray.length > 0 ? textArray[textArray.length - 1].trim() : '';

    let session = await USSDSession.findOne({ sessionId });
    
    if (!session) {
      session = new USSDSession({
        sessionId,
        phoneNumber,
        serviceCode,
        text: rawText,
        currentMenu: 'main',
        step: 0,
        data: {},
        expiresAt: new Date(Date.now() + 5 * 60000) // 5 mins expiry
      });
    }

    let response = '';

    if (session.currentMenu === 'main') {
      if (currentInput === '') {
        response = `CON Welcome to YieldPay AI
1. Register crop
2. Update crop progress
3. File insurance claim
4. Check funded status`;
      } else if (currentInput === '1') {
        session.currentMenu = 'register_crop';
        session.step = 1;
        response = `CON What are you planting?
1. Maize
2. Yam
3. Cassava
4. Tomato
5. Rice`;
      } else if (currentInput === '2') {
        session.currentMenu = 'update_progress';
        session.step = 1;
        // Fetch active crops
        const farmer = await Farmer.findOne({ phone: phoneNumber });
        if (!farmer) {
          response = 'END You are not registered. Please register a crop first.';
          session.isActive = false;
        } else {
          const activeCrops = await CropCycle.find({ farmerId: farmer._id, status: { $in: ['open', 'partially_funded', 'funded'] } });
          if (activeCrops.length === 0) {
             response = 'END You have no active crops to update.';
             session.isActive = false;
          } else {
             session.data.activeCrops = activeCrops.map(c => c._id.toString());
             response = `CON Select crop to update:\n` + activeCrops.map((c, i) => `${i + 1}. ${c.cropType} (${c.acres} acres)`).join('\n');
          }
        }
      } else if (currentInput === '3') {
        session.currentMenu = 'insurance_claim';
        session.step = 1;
        const farmer = await Farmer.findOne({ phone: phoneNumber });
        if (!farmer) {
          response = 'END You are not registered.';
          session.isActive = false;
        } else {
          const fundedCrops = await CropCycle.find({ farmerId: farmer._id, status: 'funded' });
          if (fundedCrops.length === 0) {
            response = 'END You have no fully funded crops eligible for insurance.';
            session.isActive = false;
          } else {
            session.data.fundedCrops = fundedCrops.map(c => c._id.toString());
            response = `CON Select crop for claim:\n` + fundedCrops.map((c, i) => `${i + 1}. ${c.cropType} (${c.acres} acres)`).join('\n');
          }
        }
      } else if (currentInput === '4') {
        const farmer = await Farmer.findOne({ phone: phoneNumber });
        if (!farmer) {
          response = 'END You are not registered.';
        } else {
          const activeCrops = await CropCycle.find({ farmerId: farmer._id, status: { $in: ['open', 'partially_funded', 'funded'] } });
          if (activeCrops.length === 0) {
             response = 'END No active crops.';
          } else {
             response = 'END ' + activeCrops.map(c => `${c.cropType}: ${c.status === 'funded' ? 'Fully Funded' : 'GHS ' + c.fundedAmount + ' / ' + c.fundingRequired}`).join('\n');
          }
        }
        session.isActive = false;
      } else {
        response = 'END Invalid option. Try again.';
        session.isActive = false;
      }
    } else if (session.currentMenu === 'register_crop') {
      if (session.step === 1) {
        const cropIndex = parseInt(currentInput) - 1;
        if (cropIndex >= 0 && cropIndex < crops.length) {
          session.data.cropType = crops[cropIndex];
          session.step = 2;
          response = 'CON Enter number of acres:';
        } else {
          response = 'END Invalid crop selection.';
          session.isActive = false;
        }
      } else if (session.step === 2) {
        const acres = parseFloat(currentInput);
        if (acres > 0) {
          session.data.acres = acres;
          session.step = 3;
          response = `CON Select region:
1. Ashanti
2. Northern
3. Bono East
4. Volta
5. Eastern`;
        } else {
          response = 'END Invalid acres.';
          session.isActive = false;
        }
      } else if (session.step === 3) {
        const regionIndex = parseInt(currentInput) - 1;
        if (regionIndex >= 0 && regionIndex < regions.length) {
          session.data.region = regions[regionIndex];
          
          // Complete Registration
          let farmer = await Farmer.findOne({ phone: phoneNumber });
          if (!farmer) {
             // For USSD, we mock basic user details if missing
             farmer = new Farmer({
               userId: new mongoose.Types.ObjectId(), // Orphaned for now, in a real app would link to User
               name: `Farmer ${phoneNumber}`,
               phone: phoneNumber,
               region: session.data.region,
               district: 'Default District',
               community: 'Default Community',
               mobileMoneyNumber: phoneNumber,
               farmSizeAcres: session.data.acres,
             });
             await farmer.save();
          }

          const fundingRequired = calculateFunding(session.data.cropType, session.data.acres);
          
          const cropCycle = new CropCycle({
             farmerId: farmer._id,
             cropType: session.data.cropType,
             acres: session.data.acres,
             region: session.data.region,
             district: farmer.district,
             expectedYieldKg: session.data.acres * 1000, // mock yield
             fundingRequired,
             pricePerShare: 100, // GHS 100 per share
             sharesAvailable: Math.ceil(fundingRequired / 100),
             expectedHarvestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
             createdBy: 'ussd'
          });
          
          await cropCycle.save();

          // Try to send SMS async (don't await to not block USSD)
          sendSMS({
            to: phoneNumber,
            message: `YieldPay: Your ${session.data.acres} acres of ${session.data.cropType} is registered. We will notify you when an urban buyer funds your farm.`
          }).catch(console.error);

          response = 'END Crop registered. We will notify you by SMS when an urban buyer funds your farm.';
          session.isActive = false;
        } else {
          response = 'END Invalid region.';
          session.isActive = false;
        }
      }
    } else if (session.currentMenu === 'update_progress') {
       if (session.step === 1) {
          const cropIndex = parseInt(currentInput) - 1;
          if (cropIndex >= 0 && cropIndex < session.data.activeCrops.length) {
             session.data.selectedCropId = session.data.activeCrops[cropIndex];
             session.step = 2;
             response = `CON Select current stage:\n` + stages.map((s, i) => `${i + 1}. ${s}`).join('\n');
          } else {
             response = 'END Invalid selection.';
             session.isActive = false;
          }
       } else if (session.step === 2) {
          const stageIndex = parseInt(currentInput) - 1;
          if (stageIndex >= 0 && stageIndex < stages.length) {
             const stageMap: any = {
                0: 'planting',
                1: 'planting',
                2: 'growing',
                3: 'growing',
                4: 'harvesting'
             };
             const percentMap = [10, 25, 50, 75, 95];
             
             await CropCycle.findByIdAndUpdate(session.data.selectedCropId, {
                stage: stageMap[stageIndex],
                progressPercent: percentMap[stageIndex]
             });

             sendSMS({
               to: phoneNumber,
               message: `YieldPay: Your crop progress has been updated to "${stages[stageIndex]}". Buyers will be notified.`
             }).catch(console.error);

             response = 'END Progress updated. Thank you.';
             session.isActive = false;
          } else {
             response = 'END Invalid stage.';
             session.isActive = false;
          }
       }
    } else if (session.currentMenu === 'insurance_claim') {
      if (session.step === 1) {
          const cropIndex = parseInt(currentInput) - 1;
          if (cropIndex >= 0 && cropIndex < session.data.fundedCrops.length) {
             session.data.selectedCropId = session.data.fundedCrops[cropIndex];
             session.step = 2;
             response = 'CON Describe the damage briefly (e.g. Flood washed away crops):';
          } else {
             response = 'END Invalid selection.';
             session.isActive = false;
          }
      } else if (session.step === 2) {
          const description = currentInput;
          if (description.length > 3) {
             const farmer = await Farmer.findOne({ phone: phoneNumber });
             
             const claim = new InsuranceClaim({
                farmerId: farmer!._id,
                cropCycleId: session.data.selectedCropId,
                source: 'ussd',
                description: description,
                severity: 'low', // default until AI processes
             });
             await claim.save();
             
             // Trigger AI async
             fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/insurance/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ claimId: claim._id })
             }).catch(console.error);

             response = 'END Claim received. YieldPay AI will notify you by SMS after review.';
             session.isActive = false;
          } else {
             response = 'END Description too short.';
             session.isActive = false;
          }
      }
    }

    session.text = rawText;
    session.lastResponse = response;
    await session.save();

    return new NextResponse(response, {
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('USSD Error:', error);
    return new NextResponse('END System Error', { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }
}
