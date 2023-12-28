export enum PuzzleStatus {
  NotStarted,
  Started,
  Finished,
  Unknown,
}

export enum TimerState {
  Stopped,
  Started,
}

export interface PuzzleState {
  puzzleId: string;
  storageKey: string;
  url: string;
  title: string;
  status: PuzzleStatus;
  timeLoad: Date;
  timeLastAccess: Date;
  timeStart: Date;
  timeFinish: Date | null;
  elapsedTime: number;
  timerState: TimerState;
  hintsOrMistakes: number | null;
  rating: number | null;
  notes: string | null;
}

export function toSerializableObject(
  state: PuzzleState
): Record<string, number | string | null> {
  return {
    puzzleId: state.puzzleId,
    storageKey: state.storageKey,
    url: state.url,
    title: state.title,
    status: PuzzleStatus[state.status],
    timeLoad: state.timeLoad.toISOString(),
    timeLastAccess: state.timeLastAccess.toISOString(),
    timeStart: state.timeStart.toISOString(),
    timeFinish: state.timeFinish ? state.timeFinish.toISOString() : null,
    elapsedTime: state.elapsedTime,
    timerState: state.timerState,
    hintsOrMistakes: state.hintsOrMistakes,
    rating: state.rating,
    notes: state.notes,
  };
}

export function fromSerializableObject(
  object: Record<string, number | string | null>
): PuzzleState {
  function parseDateField(fieldName: string): Date {
    const dateString = object[fieldName] as string;
    const parsedDate = new Date(dateString);

    if (isNaN(parsedDate.getTime())) {
      throw new Error(`date field '${fieldName}' is invalid: ${dateString}`);
    }

    return parsedDate;
  }

  function parsePuzzleStatus(value: string): PuzzleStatus {
    return (
      PuzzleStatus[value as keyof typeof PuzzleStatus] || PuzzleStatus.Unknown
    );
  }

  //  Note that as well as deserializing, this code is also handling the logic
  //  for fields which might not be stored (for example fields which have been
  //  added to the extension since the puzzle was initially logged). This is
  //  also covered in the unit tests.
  return {
    puzzleId: object["puzzleId"] as string,
    storageKey: object["storageKey"] as string,
    url: object["url"] as string,
    title: object["title"] as string,
    status: parsePuzzleStatus(object["status"] as string),
    timeLoad: parseDateField("timeLoad"),
    timeLastAccess: parseDateField("timeLastAccess"),
    timeStart: parseDateField("timeStart"),
    timeFinish: object["timeFinish"] ? parseDateField("timeFinish") : null,
    elapsedTime: object["elapsedTime"] as number,
    timerState: (object["timerState"] as TimerState) || TimerState.Stopped,
    hintsOrMistakes: (object["hintsOrMistakes"] as number) || null,
    rating: (object["rating"] as number) || null,
    notes: (object["notes"] as string) || "",
  };
}
