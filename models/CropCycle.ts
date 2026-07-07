import mongoose, { Schema, Document } from 'mongoose';

export interface ICropCycle extends Document {
  farmerId: mongoose.Types.ObjectId;
  cropType: string;
  acres: number;
  region: string;
  district: string;
  expectedYieldKg: number;
  fundingRequired: number;
  fundedAmount: number;
  pricePerShare: number;
  sharesAvailable: number;
  sharesFunded: number;
  plantingDate?: Date;
  expectedHarvestDate: Date;
  stage: 'registered' | 'funded' | 'planting' | 'growing' | 'harvesting' | 'completed' | 'failed';
  status: 'open' | 'partially_funded' | 'funded' | 'harvested' | 'failed' | 'cancelled';
  progressPercent: number;
  createdBy: 'ussd' | 'admin' | 'seed';
  createdAt: Date;
  updatedAt: Date;
}

const CropCycleSchema: Schema = new Schema(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true, index: true },
    cropType: { type: String, required: true },
    acres: { type: Number, required: true },
    region: { type: String, required: true },
    district: { type: String, required: true },
    expectedYieldKg: { type: Number, required: true },
    fundingRequired: { type: Number, required: true },
    fundedAmount: { type: Number, default: 0 },
    pricePerShare: { type: Number, required: true },
    sharesAvailable: { type: Number, required: true },
    sharesFunded: { type: Number, default: 0 },
    plantingDate: { type: Date },
    expectedHarvestDate: { type: Date, required: true },
    stage: { 
      type: String, 
      enum: ['registered', 'funded', 'planting', 'growing', 'harvesting', 'completed', 'failed'],
      default: 'registered'
    },
    status: {
      type: String,
      enum: ['open', 'partially_funded', 'funded', 'harvested', 'failed', 'cancelled'],
      default: 'open'
    },
    progressPercent: { type: Number, default: 0 },
    createdBy: { type: String, enum: ['ussd', 'admin', 'seed'], required: true },
  },
  { timestamps: true }
);

// Add index requested by phase 3
CropCycleSchema.index({ status: 1, region: 1, cropType: 1 });

export const CropCycle = mongoose.models.CropCycle || mongoose.model<ICropCycle>('CropCycle', CropCycleSchema);
