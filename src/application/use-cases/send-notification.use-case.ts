import { v4 as uuidv4 } from 'uuid';
import { Notification } from '../../domain/entities/notification.entity';
import { Channel } from '../../domain/value-objects/channel.vo';
import { Priority } from '../../domain/value-objects/priority.vo';
import { PriorityLevel } from '../../domain/value-objects/priority.vo';
import { INotificationRepository } from '../../domain/interfaces/notification.repository';
import { IUserPreferenceRepository } from '../../domain/interfaces/user-preference.repository';
import { IEventBus } from '../interfaces/event-bus';
import { SendNotificationDto } from '../dtos/send-notification.dto';

export class SendNotificationUseCase {
  constructor(
    private readonly notificationRepo: INotificationRepository,
    private readonly userPrefRepo: IUserPreferenceRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(dto: SendNotificationDto) {
    const priority = dto.priority || Priority.STANDARD;
    const priorityLevel = PriorityLevel.fromString(priority);
    const userPrefs = await this.userPrefRepo.findByUserId(dto.userId);

    const filteredChannels = dto.channels.filter((channel) => {
      if (priorityLevel.bypassesQuietHours()) return true;
      if (userPrefs && !userPrefs.isChannelEnabled(channel)) return false;
      if (userPrefs?.isInQuietHours() && channel !== Channel.INAPP) return false;
      return true;
    });

    const notificationIds: string[] = [];

    for (const channel of filteredChannels) {
      const isDuplicate = await this.notificationRepo.isDuplicate(
        dto.userId, dto.eventType, channel, 5 * 60 * 1000,
      );
      if (isDuplicate) {
        console.log(`[SendNotification] Duplicate skipped: ${dto.userId}:${dto.eventType}:${channel}`);
        continue;
      }

      const notification = new Notification(
        uuidv4(), dto.userId, dto.eventType, channel, priority, dto.payload,
      );

      await this.notificationRepo.save(notification);
      notificationIds.push(notification.id);

      this.eventBus.emit('notification.created', {
        notificationId: notification.id, channel, priority,
      });
    }

    return { notificationIds, status: 'queued', channelsQueued: filteredChannels };
  }
}