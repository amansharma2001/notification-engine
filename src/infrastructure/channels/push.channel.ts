import { INotificationChannel } from '../../domain/interfaces/notification-channel';
import { Notification } from '../../domain/entities/notification.entity';

export class PushChannel implements INotificationChannel {
  readonly channelType = 'push';

  async send(notification: Notification): Promise<void> {
    console.log(`[Push] Sending to ${notification.userId}: ${notification.payload.body.substring(0, 50)}`);
    await new Promise((r) => setTimeout(r, 50));
    console.log(`[Push] ✓ Delivered to ${notification.userId}`);
  }
}