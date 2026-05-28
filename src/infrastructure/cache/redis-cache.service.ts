import Redis from 'ioredis';
import { ICacheService } from '../../domain/interfaces/cache.service';

export class RedisCacheService implements ICacheService {
  private readonly client: Redis;
  private readonly subscriber: Redis;

  constructor(host: string, port: number) {
    this.client = new Redis({ host, port, retryStrategy: (t) => Math.min(t * 50, 2000) });
    this.subscriber = new Redis({ host, port });
    this.client.on('connect', () => console.log('[Redis] Connected'));
  }

  async get<T>(key: string): Promise<T | null> {
    const val = await this.client.get(key);
    return val ? JSON.parse(val) : null;
  }

  async set<T>(key: string, value: T, ttl = 3600): Promise<void> {
    await this.client.setex(key, ttl, JSON.stringify(value));
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, msg) => { if (ch === channel) callback(msg); });
  }
}