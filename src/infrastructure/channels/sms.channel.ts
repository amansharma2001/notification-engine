import { INotificationChannel } from '../../domain/interfaces/notification-channel';
import { Notification } from '../../domain/entities/notification.entity';

export class SMSChannel implements INotificationChannel {
  readonly channelType = 'sms';

  async send(notification: Notification): Promise<void> {
    console.log(`[SMS] Sending to ${notification.userId}: ${notification.payload.body.substring(0, 50)}`);
    if (Math.random() < 0.1) throw new Error('SMS gateway unavailable');
    await new Promise((r) => setTimeout(r, 200));
    console.log(`[SMS] ✓ Delivered to ${notification.userId}`);
  }
}