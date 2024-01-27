import { CrosswordMetadata } from "./crossword-metadata";

export enum PuzzleStatus {
  NotStarted,
  Started,
  Finished,
  Unknown,
}

export interface Puzzle {
  userId: string;
  id: string;
  url: string;
  title: string;
  status: PuzzleStatus;
  timeLoad: Date;
  timeLastAccess: Date;
  timeStart: Date;
  timeFinish: Date | null;
  elapsedTime: number;
  hintsOrMistakes: number | null;
  rating: number | null;
  metadata: CrosswordMetadata;
  notes: string | null;
}

export interface SerializablePuzzle {
  userId: string;
  id: string;
  url: string;
  title: string;
  status: string;
  timeLoad: string;
  timeLastAccess: string;
  timeStart: string;
  timeFinish: string | null;
  elapsedTime: number;
  hintsOrMistakes: number | null;
  rating: number | null;
  metadata: {
    series: string | null;
    title: string | null;
    setter: string | null;
    datePublished: string | null;
  };
  notes: string | null;
}

export function toSerializableObject(state: Puzzle): SerializablePuzzle {
  return {
    userId: state.userId,
    id: state.id,
    url: state.url,
    title: state.title,
    status: PuzzleStatus[state.status],
    timeLoad: state.timeLoad.toISOString(),
    timeLastAccess: state.timeLastAccess.toISOString(),
    timeStart: state.timeStart.toISOString(),
    timeFinish: state.timeFinish ? state.timeFinish.toISOString() : null,
    elapsedTime: state.elapsedTime,
    hintsOrMistakes: state.hintsOrMistakes,
    rating: state.rating,
    metadata: {
      series: state.metadata.series,
      title: state.metadata.title,
      setter: state.metadata.setter,
      datePublished: state.metadata.datePublished?.toISOString() || null,
    },
    notes: state.notes,
  };
}

//  When we deserialize we are a little less strict - some fields are allowed
//  to be missing. This is because the crossword model is growing over time and
//  historic records may not have all of the newer fields.
//  For this clever 'AtLeast' type see:
//  https://stackoverflow.com/questions/48230773/how-to-create-a-partial-like-that-requires-a-single-property-to-be-set
type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;
export type MinimumSerializablePuzzle = AtLeast<
  SerializablePuzzle,
  "userId" | "id" | "url" | "title"
>;
export function fromSerializableObject(
  object: MinimumSerializablePuzzle
): Puzzle {
  function parseDateString<T>(puzzle: T, fieldName: keyof T): Date {
    const dateString = puzzle[fieldName] as string;
    const parsedDate = new Date(dateString);

    if (isNaN(parsedDate.getTime())) {
      throw new Error(
        `date field '${String(fieldName)}' is invalid: ${dateString}`
      );
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
    userId: object.userId,
    id: object.id,
    url: object.url,
    title: object.title,
    status: parsePuzzleStatus(object.status || ""),
    timeLoad: object.timeLoad
      ? parseDateString(object, "timeLoad")
      : new Date(),
    timeLastAccess: object.timeLastAccess
      ? parseDateString(object, "timeLastAccess")
      : new Date(),
    timeStart: object.timeStart
      ? parseDateString(object, "timeStart")
      : new Date(),
    timeFinish: object.timeFinish
      ? parseDateString(object, "timeFinish")
      : null,
    elapsedTime: object.elapsedTime || 0,
    hintsOrMistakes: object.hintsOrMistakes || null,
    rating: object.rating || null,
    metadata: {
      series: object.metadata?.series || null,
      title: object.metadata?.title || null,
      setter: object.metadata?.setter || null,
      datePublished:
        typeof object.metadata?.datePublished === "string"
          ? parseDateString(object.metadata, "datePublished")
          : null,
    },
    notes: object.notes || "",
  };
}
