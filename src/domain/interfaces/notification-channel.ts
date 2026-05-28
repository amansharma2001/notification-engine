import { Notification } from '../entities/notification.entity';

export interface INotificationChannel {
  readonly channelType: string;
  send(notification: Notification): Promise<void>;
}