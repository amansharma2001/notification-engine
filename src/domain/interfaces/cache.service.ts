export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  publish(channel: string, message: string): Promise<void>;
  subscribe(channel: string, callback: (message: string) => void): Promise<void>;
}