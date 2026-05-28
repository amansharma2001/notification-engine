import { Notification, NotificationPayload } from '../../domain/entities/notification.entity';
import { INotificationRepository } from '../../domain/interfaces/notification.repository';
import { NotificationModel } from './schemas/notification.schema';
import { Channel } from '../../domain/value-objects/channel.vo';
import { Priority } from '../../domain/value-objects/priority.vo';
import { DeliveryStatus } from '../../domain/value-objects/delivery-status.vo';

export class MongoNotificationRepository implements INotificationRepository {
  async save(notification: Notification): Promise<void> {
    await NotificationModel.create({
      _id: notification.id,
      userId: notification.userId,
      eventType: notification.eventType,
      channel: notification.channel,
      priority: notification.priority,
      payload: notification.payload,
      status: notification.status,
      attemptCount: notification.attemptCount,
      maxAttempts: notification.maxAttempts,
    });
  }

  async findById(id: string): Promise<Notification | null> {
    const doc = await NotificationModel.findById(id).lean();
    return doc ? this.toDomain(doc) : null;
  }

  async findByUserId(userId: string, limit = 20): Promise<Notification[]> {
    const docs = await NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
    return docs.map((d) => this.toDomain(d));
  }

  async updateStatus(notification: Notification): Promise<void> {
    await NotificationModel.findByIdAndUpdate(notification.id, {
      status: notification.status,
      attemptCount: notification.attemptCount,
      lastError: notification.lastError,
      deliveredAt: notification.deliveredAt,
      nextRetryAt: notification.nextRetryAt,
    });
  }

  async findRetryable(): Promise<Notification[]> {
    const docs = await NotificationModel.find({
      status: 'failed',
      nextRetryAt: { $lte: new Date() },
    }).sort({ nextRetryAt: 1 }).limit(100).lean();
    return docs.map((d) => this.toDomain(d));
  }

  async isDuplicate(userId: string, eventType: string, channel: string, windowMs: number): Promise<boolean> {
    const windowStart = new Date(Date.now() - windowMs);
    const count = await NotificationModel.countDocuments({
      userId, eventType, channel, createdAt: { $gt: windowStart },
    });
    return count > 0;
  }

  private toDomain(doc: any): Notification {
    return new Notification(
      doc._id, doc.userId, doc.eventType,
      doc.channel as Channel, doc.priority as Priority,
      doc.payload as NotificationPayload, doc.maxAttempts,
      doc.status as DeliveryStatus, doc.attemptCount,
      doc.lastError, doc.deliveredAt, doc.nextRetryAt, doc.createdAt,
    );
  }
}