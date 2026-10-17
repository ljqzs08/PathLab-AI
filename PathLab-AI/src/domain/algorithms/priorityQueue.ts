export interface PriorityEntry {
  readonly f: number;
  readonly h: number;
  readonly entrySequence: number;
}

/** Sequence is unique per enqueue; no object/key iteration affects ties. */
export function comparePriority(a: PriorityEntry, b: PriorityEntry): number {
  return a.f - b.f || a.h - b.h || a.entrySequence - b.entrySequence;
}

/** Binary min-heap. Entries are immutable after insertion. */
export class PriorityQueue<T extends PriorityEntry> {
  private readonly items: T[] = [];

  get size(): number { return this.items.length; }

  push(entry: T): void {
    let index = this.items.length;
    this.items.push(entry);
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (comparePriority(this.items[parent]!, entry) <= 0) break;
      this.items[index] = this.items[parent]!;
      index = parent;
    }
    this.items[index] = entry;
  }

  pop(): T | undefined {
    const first = this.items[0];
    const last = this.items.pop();
    if (this.items.length === 0) return first;
    let index = 0;
    while (index * 2 + 1 < this.items.length) {
      let child = index * 2 + 1;
      const right = child + 1;
      if (right < this.items.length && comparePriority(this.items[right]!, this.items[child]!) < 0) child = right;
      if (comparePriority(last!, this.items[child]!) <= 0) break;
      this.items[index] = this.items[child]!;
      index = child;
    }
    this.items[index] = last!;
    return first;
  }
}
