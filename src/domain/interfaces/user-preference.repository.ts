import { UserPreference } from '../entities/user-preference.entity';

export interface IUserPreferenceRepository {
  findByUserId(userId: string): Promise<UserPreference | null>;
  save(pref: UserPreference): Promise<void>;
}