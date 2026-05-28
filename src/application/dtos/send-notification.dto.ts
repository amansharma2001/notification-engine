import { Channel } from '../../domain/value-objects/channel.vo';
import { Priority } from '../../domain/value-objects/priority.vo';

export interface SendNotificationDto {
  userId: string;
  eventType: string;
  channels: Channel[];
  priority?: Priority;
  payload: { subject?: string; body: string; metadata?: Record<string, unknown> };
}

export function validateSendNotificationDto(dto: any): string[] {
  const errors: string[] = [];
  if (!dto.userId || typeof dto.userId !== 'string') errors.push('userId is required');
  if (!dto.eventType || typeof dto.eventType !== 'string') errors.push('eventType is required');
  if (!Array.isArray(dto.channels) || dto.channels.length === 0) errors.push('channels must be a non-empty array');
  if (!dto.payload?.body) errors.push('payload.body is required');
  const validChannels = Object.values(Channel);
  dto.channels?.forEach((ch: string) => {
    if (!validChannels.includes(ch as Channel)) errors.push(`Invalid channel: ${ch}`);
  });
  return errors;
}