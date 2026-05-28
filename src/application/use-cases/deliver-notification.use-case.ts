import { INotificationRepository } from '../../domain/interfaces/notification.repository';
import { INotificationChannel } from '../../domain/interfaces/notification-channel';
import { ICacheService } from '../../domain/interfaces/cache.service';
import { IEventBus } from '../interfaces/event-bus';

export class DeliverNotificationUseCase {
  private readonly channelMap: Map<string, INotificationChannel>;

  constructor(
    private readonly notificationRepo: INotificationRepository,
    channels: INotificationChannel[],
    private readonly cacheService: ICacheService,
    private readonly eventBus: IEventBus,
  ) {
    this.channelMap = new Map();
    channels.forEach((ch) => this.channelMap.set(ch.channelType, ch));
  }

  async execute(notificationId: string): Promise<void> {
    const notification = await this.notificationRepo.findById(notificationId);
    if (!notification) { console.error(`[Deliver] Not found: ${notificationId}`); return; }

    notification.markAsProcessing();
    await this.notificationRepo.updateStatus(notification);

    const channel = this.channelMap.get(notification.channel);
    if (!channel) {
      notification.markAsFailed(`No handler for channel: ${notification.channel}`);
      await this.notificationRepo.updateStatus(notification);
      return;
    }

    try {
      await channel.send(notification);
      notification.markAsDelivered();
      await this.notificationRepo.updateStatus(notification);
      console.log(`[Deliver] ✓ ${notification.channel} → ${notification.userId}`);
      this.eventBus.emit('notification.delivered', {
        notificationId: notification.id, channel: notification.channel, userId: notification.userId,
      });
    } catch (error: any) {
      notification.markAsFailed(error.message);
      await this.notificationRepo.updateStatus(notification);
      console.error(`[Deliver] ✗ ${notification.channel} → ${notification.userId}: ${error.message}`);

      if (notification.canRetry()) {
        this.eventBus.emit('notification.retry-scheduled', {
          notificationId: notification.id, retryAt: notification.nextRetryAt, attempt: notification.attemptCount,
        });
      } else {
        this.eventBus.emit('notification.dlq', { notificationId: notification.id, error: error.message });
      }
    }
  }
}