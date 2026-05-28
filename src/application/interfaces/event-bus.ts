export interface IEventBus {
  emit(event: string, data: unknown): void;
  on(event: string, handler: (data: any) => void): void;
}