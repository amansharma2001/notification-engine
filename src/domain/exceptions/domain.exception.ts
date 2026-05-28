export class DomainException extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'DomainException';
  }
}

export class NotificationNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Notification not found: ${id}`, 'NOTIFICATION_NOT_FOUND');
  }
}

export class DuplicateNotificationException extends DomainException {
  constructor(userId: string, eventType: string) {
    super(`Duplicate notification for ${userId}:${eventType}`, 'DUPLICATE_NOTIFICATION');
  }
}