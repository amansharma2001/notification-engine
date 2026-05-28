import { Channel } from '../value-objects/channel.vo';

export class UserPreference {
  constructor(
    private readonly _userId: string,
    private readonly _channels: Record<string, boolean>,
    private readonly _quietStart: string,
    private readonly _quietEnd: string,
    private readonly _maxDailyBulk: number,
  ) {}

  get userId(): string { return this._userId; }

  isChannelEnabled(channel: Channel): boolean {
    return this._channels[channel] !== false;
  }

  isInQuietHours(): boolean {
    const hour = new Date().getHours();
    const start = parseInt(this._quietStart.split(':')[0]);
    const end = parseInt(this._quietEnd.split(':')[0]);
    if (start > end) return hour >= start || hour < end;
    return hour >= start && hour < end;
  }
}