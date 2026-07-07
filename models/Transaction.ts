import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  reference: string;
  moolreReference?: string;
  buyerId?: mongoose.Types.ObjectId;
  cropCycleId?: mongoose.Types.ObjectId;
  farmerId?: mongoose.Types.ObjectId;
  type: 'collection' | 'disbursement' | 'insurance_payout';
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  paymentUrl?: string;
  rawProviderResponse?: any;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    moolreReference: { type: String, index: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User' },
    cropCycleId: { type: Schema.Types.ObjectId, ref: 'CropCycle' },
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer' },
    type: { type: String, enum: ['collection', 'disbursement', 'insurance_payout'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'GHS' },
    status: { type: String, enum: ['pending', 'success', 'failed', 'cancelled'], default: 'pending' },
    paymentUrl: { type: String },
    rawProviderResponse: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
