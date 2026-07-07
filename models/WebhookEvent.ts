import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookEvent extends Document {
  provider: string;
  eventType: string;
  reference?: string;
  idempotencyKey: string;
  processed: boolean;
  payload: any;
  createdAt: Date;
}

const WebhookEventSchema: Schema = new Schema(
  {
    provider: { type: String, required: true, default: 'moolre' },
    eventType: { type: String, required: true },
    reference: { type: String, index: true },
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    processed: { type: Boolean, default: false },
    payload: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const WebhookEvent = mongoose.models.WebhookEvent || mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);
