import { INotificationChannel } from '../../domain/interfaces/notification-channel';
import { Notification } from '../../domain/entities/notification.entity';

export class EmailChannel implements INotificationChannel {
  readonly channelType = 'email';

  async send(notification: Notification): Promise<void> {
    console.log(`[Email] Sending to ${notification.userId}: ${notification.payload.subject || 'No subject'}`);
    if (Math.random() < 0.15) throw new Error('Email provider timeout');
    await new Promise((r) => setTimeout(r, 100));
    console.log(`[Email] ✓ Delivered to ${notification.userId}`);
  }
}