import { INotificationChannel } from '../../domain/interfaces/notification-channel';
import { ICacheService } from '../../domain/interfaces/cache.service';
import { Notification } from '../../domain/entities/notification.entity';

export class InAppChannel implements INotificationChannel {
  readonly channelType = 'inapp';

  constructor(private readonly cacheService: ICacheService) {}

  async send(notification: Notification): Promise<void> {
    await this.cacheService.publish('inapp-notifications', JSON.stringify({
      userId: notification.userId, payload: notification.payload,
      priority: notification.priority, timestamp: Date.now(),
    }));
    console.log(`[InApp] ✓ Published for ${notification.userId}`);
  }
}