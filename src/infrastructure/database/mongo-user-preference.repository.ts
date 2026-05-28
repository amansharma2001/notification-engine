import { UserPreference } from '../../domain/entities/user-preference.entity';
import { IUserPreferenceRepository } from '../../domain/interfaces/user-preference.repository';
import { UserPreferenceModel } from './schemas/user-preference.schema';

export class MongoUserPreferenceRepository implements IUserPreferenceRepository {
  async findByUserId(userId: string): Promise<UserPreference | null> {
    const doc = await UserPreferenceModel.findById(userId).lean();
    if (!doc) return null;
    return new UserPreference(doc._id, doc.channels, doc.quietStart, doc.quietEnd, doc.maxDailyBulk);
  }

  async save(pref: UserPreference): Promise<void> {
    await UserPreferenceModel.findByIdAndUpdate(
      pref.userId,
      { _id: pref.userId },
      { upsert: true },
    );
  }
}