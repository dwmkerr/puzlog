type TickHandler = (elapsedTime: number) => void;

export class Stopwatch {
  private intervalId: number | null = null;
  private startTime: number | null = null;
  private elapsedTime: number = 0;
  private tickHandler: TickHandler | null = null;

  start(handler: TickHandler, tickInterval: number = 1000) {
    this.tickHandler = handler;
    if (this.intervalId !== null) {
      return; // Already started
    }

    this.startTime = Date.now() - this.elapsedTime; // Adjust start time based on elapsed time
    this.intervalId = window.setInterval(() => this.tick(), tickInterval);
  }

  pause() {
    if (this.intervalId === null) {
      return; // Already paused
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
    this.startTime = null;
  }

  setElapsedTime(value: number) {
    this.elapsedTime = value;
  }

  private tick() {
    if (this.startTime === null || this.tickHandler === null) {
      return;
    }

    const currentTime = Date.now();
    this.elapsedTime = currentTime - this.startTime;
    this.tickHandler(this.elapsedTime);
  }
}
