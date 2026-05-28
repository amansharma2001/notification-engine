export enum Priority {
  CRITICAL = 'critical',
  STANDARD = 'standard',
  BULK = 'bulk',
}

export class PriorityLevel {
  private static readonly ORDER: Record<Priority, number> = {
    [Priority.CRITICAL]: 0,
    [Priority.STANDARD]: 1,
    [Priority.BULK]: 2,
  };

  constructor(private readonly value: Priority) {}

  get priority(): Priority { return this.value; }

  bypassesQuietHours(): boolean {
    return this.value === Priority.CRITICAL;
  }

  static fromString(value: string): PriorityLevel {
    if (!Object.values(Priority).includes(value as Priority)) {
      throw new Error(`Invalid priority: ${value}`);
    }
    return new PriorityLevel(value as Priority);
  }
}