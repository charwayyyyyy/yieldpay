import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  buyerId: mongoose.Types.ObjectId;
  cropCycleId: mongoose.Types.ObjectId;
  farmerId: mongoose.Types.ObjectId;
  transactionId: mongoose.Types.ObjectId;
  amount: number;
  shares: number;
  status: 'active' | 'completed' | 'cancelled' | 'failed';
  expectedDeliveryNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cropCycleId: { type: Schema.Types.ObjectId, ref: 'CropCycle', required: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'Farmer', required: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
    amount: { type: Number, required: true },
    shares: { type: Number, required: true },
    status: { type: String, enum: ['active', 'completed', 'cancelled', 'failed'], default: 'active' },
    expectedDeliveryNote: { type: String },
  },
  { timestamps: true }
);

export const Subscription = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
