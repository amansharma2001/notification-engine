import mongoose, { Schema, Document } from 'mongoose';

export interface UserPreferenceDocument {
  _id: string;
  channels: Record<string, boolean>;
  quietStart: string;
  quietEnd: string;
  maxDailyBulk: number;
}

const userPreferenceSchema = new Schema<UserPreferenceDocument>(
  {
    _id: { type: String, required: true },
    channels: { type: Schema.Types.Mixed, default: { email: true, sms: false, push: true, inapp: true } },
    quietStart: { type: String, default: '22:00' },
    quietEnd: { type: String, default: '07:00' },
    maxDailyBulk: { type: Number, default: 10 },
  },
  { timestamps: true },
);

export const UserPreferenceModel = mongoose.model<UserPreferenceDocument>('UserPreference', userPreferenceSchema);