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
  elapsedTime: number;
  timerState: TimerState;
}

export function toSerializableObject(
  state: PuzzleState
): Record<string, number | string | null> {
  return {
    puzzleId: state.puzzleId,
    storageKey: state.storageKey,
    url: state.url,
    title: state.title,
    timeLoad: state.timeLoad.toISOString(),
    timeLastAccess: state.timeLastAccess.toISOString(),
    timeStart: state.timeStart.toISOString(),
    timeFinish: state.timeFinish ? state.timeFinish.toISOString() : null,
    elapsedTime: state.elapsedTime,
    timerState: state.timerState,
  };
}

export function fromSerializableObject(
  object: Record<string, number | string | null>
): PuzzleState {
  function parseDateField(fieldName: string): Date {
    const dateString = object[fieldName] as string;
    const parsedDate = new Date(dateString);

    if (isNaN(parsedDate.getTime())) {
      throw new Error(`date field ${fieldName} is invalid: ${dateString}`);
    }

    return parsedDate;
  }
  return {
    puzzleId: object["puzzleId"] as string,
    storageKey: object["storageKey"] as string,
    url: object["url"] as string,
    title: object["title"] as string,
    timeLoad: parseDateField("timeLoad"),
    timeLastAccess: parseDateField("timeLastAccess"),
    timeStart: parseDateField("timeStart"),
    timeFinish: object["timeFinish"] ? parseDateField("timeFinish") : null,
    elapsedTime: object["elapsedTime"] as number,
    timerState: object["timerState"] as TimerState,
  };
}
