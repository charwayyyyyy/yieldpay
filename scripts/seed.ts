import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback

import { User } from '../models/User';
import { Farmer } from '../models/Farmer';
import { CropCycle } from '../models/CropCycle';

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI. Cannot seed.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Clear existing
  await User.deleteMany({});
  await Farmer.deleteMany({});
  await CropCycle.deleteMany({});

  console.log('Cleared existing data');

  // 1 Demo Buyer
  const buyer = new User({
    role: 'buyer',
    name: 'Demo Urban Buyer',
    email: 'buyer@yieldpay.com',
    phone: '0550000001'
  });
  await buyer.save();

  // 3 Farmers
  const farmersData = [
    { name: 'Kofi Mensah', phone: '0240000001', region: 'Ashanti', district: 'Ejura', community: 'Anyinasu', acres: 10 },
    { name: 'Ama Serwaa', phone: '0200000002', region: 'Bono East', district: 'Techiman', community: 'Tuobodom', acres: 5 },
    { name: 'Kwame Osei', phone: '0270000003', region: 'Northern', district: 'Tamale', community: 'Savelugu', acres: 15 },
  ];

  const cropsData = [
    { cropType: 'Maize', rate: 1500 },
    { cropType: 'Yam', rate: 2500 },
    { cropType: 'Rice', rate: 2000 },
  ];

  for (let i = 0; i < farmersData.length; i++) {
    const fData = farmersData[i];
    const farmerUser = new User({ role: 'farmer', name: fData.name, phone: fData.phone });
    await farmerUser.save();

    const farmer = new Farmer({
      userId: farmerUser._id,
      name: fData.name,
      phone: fData.phone,
      region: fData.region,
      district: fData.district,
      community: fData.community,
      mobileMoneyNumber: fData.phone,
      farmSizeAcres: fData.acres
    });
    await farmer.save();

    const cData = cropsData[i % cropsData.length];
    const fundingRequired = fData.acres * cData.rate;

    const crop = new CropCycle({
      farmerId: farmer._id,
      cropType: cData.cropType,
      acres: fData.acres,
      region: fData.region,
      district: fData.district,
      expectedYieldKg: fData.acres * 1200,
      fundingRequired: fundingRequired,
      pricePerShare: 100,
      sharesAvailable: Math.ceil(fundingRequired / 100),
      expectedHarvestDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      createdBy: 'seed',
      status: i === 0 ? 'partially_funded' : 'open',
      fundedAmount: i === 0 ? 500 : 0
    });
    await crop.save();
    
    // Add an extra crop for one farmer
    if (i === 1) {
       const extraCrop = new CropCycle({
          farmerId: farmer._id,
          cropType: 'Tomato',
          acres: 2,
          region: fData.region,
          district: fData.district,
          expectedYieldKg: 2000,
          fundingRequired: 2 * 3000,
          pricePerShare: 100,
          sharesAvailable: Math.ceil(6000 / 100),
          expectedHarvestDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
          createdBy: 'seed',
          status: 'open'
       });
       await extraCrop.save();
    }
  }

  console.log('Seeded successfully!');
  process.exit(0);
}

seed().catch(console.error);
