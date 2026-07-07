import mongoose, { Schema, Document } from 'mongoose';

export interface IInsuranceClaim extends Document {
  farmerId: mongoose.Types.ObjectId;
  cropCycleId: mongoose.Types.ObjectId;
  source: 'ussd' | 'web' | 'admin';
  description: string;
  aiDecision?: any;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  payoutAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'failed';
  transactionId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InsuranceClaimSchema: Schema = new Schema(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true },
    cropCycleId: { type: Schema.Types.ObjectId, ref: 'CropCycle', required: true },
    source: { type: String, enum: ['ussd', 'web', 'admin'], required: true },
    description: { type: String, required: true },
    aiDecision: { type: Schema.Types.Mixed },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    confidence: { type: Number, default: 0 },
    payoutAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid', 'failed'], default: 'pending' },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
  },
  { timestamps: true }
);

export const InsuranceClaim = mongoose.models.InsuranceClaim || mongoose.model<IInsuranceClaim>('InsuranceClaim', InsuranceClaimSchema);
