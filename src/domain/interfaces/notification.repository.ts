import { Notification } from '../entities/notification.entity';

export interface INotificationRepository {
  save(notification: Notification): Promise<void>;
  findById(id: string): Promise<Notification | null>;
  findByUserId(userId: string, limit?: number): Promise<Notification[]>;
  updateStatus(notification: Notification): Promise<void>;
  findRetryable(): Promise<Notification[]>;
  isDuplicate(userId: string, eventType: string, channel: string, windowMs: number): Promise<boolean>;
}