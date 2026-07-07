const mongoose = require('mongoose');
const { Farmer } = require('../models/Farmer');
const { CropCycle } = require('../models/CropCycle');
const { User } = require('../models/User');
const { Transaction } = require('../models/Transaction');
const { WebhookEvent } = require('../models/WebhookEvent');
const { DisbursementLog } = require('../models/DisbursementLog');
const { SMSLog } = require('../models/SMSLog');
const { USSDSession } = require('../models/USSDSession');
const { InsuranceClaim } = require('../models/InsuranceClaim');

require('dotenv').config({ path: '.env' });

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  try {
    // Demo Buyer
    let buyer = await User.findOne({ email: 'demo@buyer.com' });
    if (!buyer) {
      buyer = await User.create({
        role: 'buyer',
        name: 'Demo Urban Investor',
        email: 'demo@buyer.com',
        phone: '0201234567'
      });
      console.log('Created Demo Buyer');
    }

    // Farmers
    const farmersData = [
      {
        name: 'Kwame Mensah',
        phone: '0244111222',
        region: 'Ashanti',
        district: 'Ejura',
        community: 'Nkoranza',
        mobileMoneyNumber: '0244111222',
        farmSizeAcres: 10
      },
      {
        name: 'Abena Osei',
        phone: '0502223333',
        region: 'Bono East',
        district: 'Techiman',
        community: 'Kintampo',
        mobileMoneyNumber: '0502223333',
        farmSizeAcres: 5
      },
      {
        name: 'Kofi Annan',
        phone: '0263334444',
        region: 'Northern',
        district: 'Tamale',
        community: 'Savelugu',
        mobileMoneyNumber: '0263334444',
        farmSizeAcres: 20
      },
      {
        name: 'Yaa Asantewaa',
        phone: '0544445555',
        region: 'Eastern',
        district: 'Koforidua',
        community: 'Suhum',
        mobileMoneyNumber: '0544445555',
        farmSizeAcres: 8
      }
    ];

    for (let fData of farmersData) {
      let farmer = await Farmer.findOne({ phone: fData.phone });
      if (!farmer) {
        // Need to create dummy user for farmer first if required, but farmer schema requires userId
        let fUser = await User.findOne({ phone: fData.phone });
        if (!fUser) {
           fUser = await User.create({
             role: 'farmer',
             name: fData.name,
             phone: fData.phone
           });
        }
        fData.userId = fUser._id;
        farmer = await Farmer.create(fData);
        console.log(`Created Farmer ${fData.name}`);
      }

      // Create CropCycles
      const cropExists = await CropCycle.findOne({ farmerId: farmer._id });
      if (!cropExists) {
        if (fData.name === 'Kwame Mensah') {
           await CropCycle.create({
              farmerId: farmer._id,
              cropType: 'Maize',
              acres: 5,
              fundingRequired: 5000,
              fundedAmount: 0,
              sharesTotal: 10,
              sharesFunded: 0,
              pricePerShare: 500,
              status: 'open',
              stage: 'registered',
              location: 'Ashanti Region'
           });
           console.log(`Created Open Maize Crop for Kwame`);
        }
        else if (fData.name === 'Abena Osei') {
           await CropCycle.create({
              farmerId: farmer._id,
              cropType: 'Tomatoes',
              acres: 2,
              fundingRequired: 2000,
              fundedAmount: 1000,
              sharesTotal: 4,
              sharesFunded: 2,
              pricePerShare: 500,
              status: 'partially_funded',
              stage: 'registered',
              location: 'Bono East'
           });
           console.log(`Created Partially Funded Tomato Crop for Abena`);
        }
        else if (fData.name === 'Kofi Annan') {
           const fundedCrop = await CropCycle.create({
              farmerId: farmer._id,
              cropType: 'Rice',
              acres: 10,
              fundingRequired: 10000,
              fundedAmount: 10000,
              sharesTotal: 20,
              sharesFunded: 20,
              pricePerShare: 500,
              status: 'funded',
              stage: 'funded',
              location: 'Northern Region'
           });
           console.log(`Created Funded Rice Crop for Kofi`);

           // Add Webhook, Transaction, Disbursement for this crop
           const tx = await Transaction.create({
              reference: `YP-COL-DEMO-${Date.now()}`,
              buyerId: buyer._id,
              cropCycleId: fundedCrop._id,
              farmerId: farmer._id,
              type: 'collection',
              amount: 10000,
              status: 'success'
           });
           
           await WebhookEvent.create({
              eventType: 'payment.success',
              reference: tx.reference,
              idempotencyKey: `webhook-${tx.reference}`,
              processed: true,
              payload: { demo: true }
           });

           await DisbursementLog.create({
              transactionId: tx._id,
              farmerId: farmer._id,
              amount: 10000,
              phoneNumber: farmer.mobileMoneyNumber,
              attempts: 1,
              status: 'success'
           });

           await SMSLog.create({
              phoneNumber: farmer.phone,
              recipientType: 'farmer',
              message: 'YieldPay: GHS 10000 operating capital disbursed.',
              status: 'sent'
           });

           await InsuranceClaim.create({
              farmerId: farmer._id,
              cropCycleId: fundedCrop._id,
              claimText: 'Flood destroyed my rice farm',
              severity: 'high',
              confidence: 0.95,
              decision: 'approved',
              proposedPayoutAmount: 5000,
              status: 'processed'
           });
           console.log('Created trace events for Kofi (Disbursement, Claim, Webhook, SMS)');
        }
        else {
           await CropCycle.create({
              farmerId: farmer._id,
              cropType: 'Yam',
              acres: 4,
              fundingRequired: 4000,
              fundedAmount: 0,
              sharesTotal: 8,
              sharesFunded: 0,
              pricePerShare: 500,
              status: 'open',
              stage: 'registered',
              location: 'Eastern Region'
           });
        }
      }
    }

    // Add a USSD Session
    const ussdExists = await USSDSession.findOne({ phoneNumber: '0244111222' });
    if (!ussdExists) {
       await USSDSession.create({
          sessionId: `sess-${Date.now()}`,
          phoneNumber: '0244111222',
          serviceCode: '*919*4018#',
          currentStep: 'main_menu',
          sessionData: {},
          isActive: false
       });
       console.log('Created Demo USSD Session');
    }

    console.log('✅ Seeding complete');
    process.exit(0);

  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
