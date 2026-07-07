import mongoose, { Schema, Document } from 'mongoose';

export interface IFarmer extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  region: string;
  district: string;
  community: string;
  mobileMoneyNumber: string;
  preferredLanguage: string;
  farmSizeAcres: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const FarmerSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true, index: true },
    region: { type: String, required: true },
    district: { type: String, required: true },
    community: { type: String, required: true },
    mobileMoneyNumber: { type: String, required: true },
    preferredLanguage: { type: String, default: 'English' },
    farmSizeAcres: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  },
  { timestamps: true }
);

export const Farmer = mongoose.models.Farmer || mongoose.model<IFarmer>('Farmer', FarmerSchema);
