// TL;DR: How many events of one kind a process records per launch, and how many it dropped.
// Details: An error in a loop must not flood analytics, so each kind of event that records errors has a limit per
// launch, and a lower one for the same label. What a limit drops is counted, and recorded once when the process ends
// (recordDroppedEvents), so that the analytics backend tells a quiet launch from one whose errors were cut off.

const limiters: EventLimiter[] = [];

export class EventLimiter {
  private recorded = 0;
  private readonly recordedLabels = new Map<string, number>();
  private droppedEvents = 0;

  /**
   * @param kind How the kind is named where the dropped events are counted, such as "Unhandled Error".
   * @param maxPerLaunch How many events of the kind a process records per launch.
   * @param maxWithSameLabel How many of them may have the same label.
   */
  constructor(public readonly kind: string, private readonly maxPerLaunch: number, private readonly maxWithSameLabel: number) {
    limiters.push(this);
  }

  /** Whether an event with this label may be recorded. It is counted as recorded if so, as dropped otherwise. */
  public allows(label: string): boolean {
    const sameLabel = this.recordedLabels.get(label) ?? 0;
    if (this.recorded >= this.maxPerLaunch || sameLabel >= this.maxWithSameLabel) {
      this.droppedEvents++;
      return false;
    }
    this.recorded++;
    this.recordedLabels.set(label, sameLabel + 1);
    return true;
  }

  /** Whether the limit of the launch is reached, so that an event can be dropped before its label is made. */
  public get isFull(): boolean {
    return this.recorded >= this.maxPerLaunch;
  }

  /** Counts an event dropped without asking allows(), as when isFull. */
  public drop(): void {
    this.droppedEvents++;
  }

  public get dropped(): number {
    return this.droppedEvents;
  }
}

/**
 * What the limits of this process dropped, as "Unhandled Error: 3, Logged Warning: 41", the kinds in the order they
 * were made; empty when nothing was dropped.
 */
export function droppedEventsLabel(): string {
  return limiters.filter(limiter => limiter.dropped > 0).map(limiter => `${limiter.kind}: ${limiter.dropped}`).join(', ');
}

/** The limiters of this process, for tests. */
export function eventLimiters(): readonly EventLimiter[] {
  return limiters;
}
