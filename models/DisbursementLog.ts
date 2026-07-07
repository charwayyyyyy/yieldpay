import mongoose, { Schema, Document } from 'mongoose';

export interface IDisbursementLog extends Document {
  transactionId: mongoose.Types.ObjectId;
  farmerId: mongoose.Types.ObjectId;
  amount: number;
  phoneNumber: string;
  status: 'pending' | 'success' | 'failed';
  attempts: number;
  providerReference?: string;
  rawProviderResponse?: any;
  createdAt: Date;
  updatedAt: Date;
}

const DisbursementLogSchema: Schema = new Schema(
  {
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true },
    amount: { type: Number, required: true },
    phoneNumber: { type: String, required: true },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    attempts: { type: Number, default: 0 },
    providerReference: { type: String },
    rawProviderResponse: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const DisbursementLog = mongoose.models.DisbursementLog || mongoose.model<IDisbursementLog>('DisbursementLog', DisbursementLogSchema);
