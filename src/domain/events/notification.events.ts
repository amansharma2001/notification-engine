export interface NotificationCreatedEvent {
  notificationId: string;
  channel: string;
  priority: string;
}

export interface NotificationDeliveredEvent {
  notificationId: string;
  channel: string;
  userId: string;
}