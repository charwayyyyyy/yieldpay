import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  role: 'buyer' | 'farmer' | 'admin';
  name: string;
  phone?: string;
  email?: string;
  region?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    role: { type: String, enum: ['buyer', 'farmer', 'admin'], required: true },
    name: { type: String, required: true },
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    region: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
