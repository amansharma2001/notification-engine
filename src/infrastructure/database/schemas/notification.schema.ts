import mongoose, { Schema, Document } from 'mongoose';

export interface NotificationDocument {
  _id: string;
  userId: string;
  eventType: string;
  channel: string;
  priority: string;
  payload: { subject?: string; body: string; metadata?: Record<string, unknown> };
  status: string;
  attemptCount: number;
  maxAttempts: number;
  lastError: string | null;
  deliveredAt: Date | null;
  nextRetryAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    eventType: { type: String, required: true },
    channel: { type: String, required: true, enum: ['email', 'sms', 'push', 'inapp'] },
    priority: { type: String, required: true, enum: ['critical', 'standard', 'bulk'], default: 'standard' },
    payload: { type: Schema.Types.Mixed, required: true },
    status: { type: String, required: true, enum: ['pending', 'processing', 'delivered', 'failed', 'dlq'], default: 'pending', index: true },
    attemptCount: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lastError: { type: String, default: null },
    deliveredAt: { type: Date, default: null },
    nextRetryAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, eventType: 1, channel: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<NotificationDocument>('Notification', notificationSchema);