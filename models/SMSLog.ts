import mongoose, { Schema, Document } from 'mongoose';

export interface ISMSLog extends Document {
  phoneNumber: string;
  recipientType: 'farmer' | 'buyer' | 'admin';
  message: string;
  status: 'pending' | 'sent' | 'failed';
  providerReference?: string;
  rawProviderResponse?: any;
  createdAt: Date;
  updatedAt: Date;
}

const SMSLogSchema: Schema = new Schema(
  {
    phoneNumber: { type: String, required: true, index: true },
    recipientType: { type: String, enum: ['farmer', 'buyer', 'admin'], required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    providerReference: { type: String },
    rawProviderResponse: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const SMSLog = mongoose.models.SMSLog || mongoose.model<ISMSLog>('SMSLog', SMSLogSchema);
