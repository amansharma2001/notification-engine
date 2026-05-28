import { Channel } from '../value-objects/channel.vo';
import { Priority } from '../value-objects/priority.vo';
import { DeliveryStatus } from '../value-objects/delivery-status.vo';

export interface NotificationPayload {
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export class Notification {
  private _status: DeliveryStatus;
  private _attemptCount: number;
  private _lastError: string | null;
  private _deliveredAt: Date | null;
  private _nextRetryAt: Date | null;

  constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _eventType: string,
    private readonly _channel: Channel,
    private readonly _priority: Priority,
    private readonly _payload: NotificationPayload,
    private readonly _maxAttempts: number = 3,
    status: DeliveryStatus = DeliveryStatus.PENDING,
    attemptCount: number = 0,
    lastError: string | null = null,
    deliveredAt: Date | null = null,
    nextRetryAt: Date | null = null,
    private readonly _createdAt: Date = new Date(),
  ) {
    this._status = status;
    this._attemptCount = attemptCount;
    this._lastError = lastError;
    this._deliveredAt = deliveredAt;
    this._nextRetryAt = nextRetryAt;
  }

  get id(): string { return this._id; }
  get userId(): string { return this._userId; }
  get eventType(): string { return this._eventType; }
  get channel(): Channel { return this._channel; }
  get priority(): Priority { return this._priority; }
  get payload(): NotificationPayload { return this._payload; }
  get status(): DeliveryStatus { return this._status; }
  get attemptCount(): number { return this._attemptCount; }
  get maxAttempts(): number { return this._maxAttempts; }
  get lastError(): string | null { return this._lastError; }
  get deliveredAt(): Date | null { return this._deliveredAt; }
  get nextRetryAt(): Date | null { return this._nextRetryAt; }
  get createdAt(): Date { return this._createdAt; }

  markAsDelivered(): void {
    this._status = DeliveryStatus.DELIVERED;
    this._deliveredAt = new Date();
    this._lastError = null;
  }

  markAsFailed(error: string): void {
    this._attemptCount++;
    this._lastError = error;

    if (this._attemptCount >= this._maxAttempts) {
      this._status = DeliveryStatus.DLQ;
      this._nextRetryAt = null;
    } else {
      this._status = DeliveryStatus.FAILED;
      const delayMs = Math.pow(5, this._attemptCount) * 1000;
      this._nextRetryAt = new Date(Date.now() + delayMs);
    }
  }

  markAsProcessing(): void {
    this._status = DeliveryStatus.PROCESSING;
  }

  canRetry(): boolean {
    return this._status === DeliveryStatus.FAILED && this._attemptCount < this._maxAttempts;
  }

  isRetryDue(): boolean {
    if (!this.canRetry() || !this._nextRetryAt) return false;
    return new Date() >= this._nextRetryAt;
  }

  isCritical(): boolean {
    return this._priority === Priority.CRITICAL;
  }
}