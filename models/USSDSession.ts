import mongoose, { Schema, Document } from 'mongoose';

export interface IUSSDSession extends Document {
  sessionId: string;
  phoneNumber: string;
  serviceCode: string;
  text: string;
  currentMenu: string;
  step: number;
  data: any;
  isActive: boolean;
  lastResponse?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const USSDSessionSchema: Schema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    phoneNumber: { type: String, required: true, index: true },
    serviceCode: { type: String, required: true },
    text: { type: String, default: '' },
    currentMenu: { type: String, default: 'main' },
    step: { type: Number, default: 0 },
    data: { type: Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
    lastResponse: { type: String },
    expiresAt: { type: Date, required: true, index: { expires: '1m' } }, // TTL index
  },
  { timestamps: true }
);

export const USSDSession = mongoose.models.USSDSession || mongoose.model<IUSSDSession>('USSDSession', USSDSessionSchema);
