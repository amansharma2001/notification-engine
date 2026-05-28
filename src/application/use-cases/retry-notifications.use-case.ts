import { INotificationRepository } from '../../domain/interfaces/notification.repository';
import { IEventBus } from '../interfaces/event-bus';

export class RetryNotificationsUseCase {
  constructor(
    private readonly notificationRepo: INotificationRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(): Promise<number> {
    const retryable = await this.notificationRepo.findRetryable();
    let count = 0;
    for (const notification of retryable) {
      if (notification.isRetryDue()) {
        this.eventBus.emit('notification.created', {
          notificationId: notification.id, channel: notification.channel, priority: notification.priority,
        });
        count++;
      }
    }
    if (count > 0) console.log(`[Retry] Scheduled ${count} notifications for retry`);
    return count;
  }
}