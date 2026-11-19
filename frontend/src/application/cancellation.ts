// One in-flight operation per screen, including rapid double taps before a render.
export class Cancellation {
  private pending = false;
  async run(operation: () => Promise<void>): Promise<boolean> {
    if (this.pending) return false;
    this.pending = true;
    try { await operation(); return true; }
    finally { this.pending = false; }
  }
}
