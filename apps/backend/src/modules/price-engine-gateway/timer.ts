export type SyncTimerCallback = () => void;

export class SyncTimer {
  private timeout: ReturnType<typeof setTimeout>;

  private constructor(
    private readonly ttlMs: number,
    private readonly callback: SyncTimerCallback,
  ) {
    if (ttlMs < 0) throw new Error('Invalid ttlMs value');
  }

  static start(ttlMs: number, callback: SyncTimerCallback): SyncTimer {
    const timer = new SyncTimer(ttlMs, callback);
    timer.restart();

    return timer;
  }

  restart(): void {
    this.clear();
    this.timeout = setTimeout(() => this.callback(), this.ttlMs);
  }

  clear(): void {
    clearTimeout(this.timeout);
  }
}
