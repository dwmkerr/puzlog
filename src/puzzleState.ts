export enum TimerState {
  Stopped,
  Started,
}

export interface PuzzleState {
  puzzleId: string;
  storageKey: string;
  url: string;
  title: string;
  timeLoad: Date;
  timeLastAccess: Date;
  timeStart: Date;
  timeFinish: Date | null;
  durationWorking: number;
  timerState: TimerState;
  timerId: number | null;
}
