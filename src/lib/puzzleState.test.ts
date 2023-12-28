import {
  PuzzleState,
  TimerState,
  PuzzleStatus,
  toSerializableObject,
  fromSerializableObject,
} from "./puzzleState"; // Replace 'yourFile' with the actual file path

describe("puzzleState", () => {
  it("should serialize and deserialize PuzzleState without data loss", () => {
    const originalPuzzleState: PuzzleState = {
      puzzleId: "https://www.theguardian.com/crosswords/cryptic/29233",
      storageKey: "puzlog:https://www.theguardian.com/crosswords/cryptic/29233",
      url: "https://www.theguardian.com/crosswords/cryptic/29233",
      title: "Sample Puzzle",
      status: PuzzleStatus.Started,
      timeLoad: new Date("2023-01-01T12:00:00Z"),
      timeLastAccess: new Date("2023-01-01T12:05:00Z"),
      timeStart: new Date("2023-01-01T12:10:00Z"),
      timeFinish: new Date("2023-01-01T12:20:00Z"),
      elapsedTime: 600, // 10 minutes in seconds
      timerState: TimerState.Started,
      hintsOrMistakes: 2,
      rating: null,
      notes: "Hard 🥵 <\"';", // note complex characters...
    };

    const serializedObject = toSerializableObject(originalPuzzleState);
    const deserializedState = fromSerializableObject(serializedObject);

    expect(deserializedState).toEqual(originalPuzzleState);
  });

  it("should throw an error if dates are not valid ISO8601 strings during deserialization", () => {
    const invalidSerializedObject = {
      puzzleId: "https://www.theguardian.com/crosswords/cryptic/29233",
      storageKey: "puzlog:https://www.theguardian.com/crosswords/cryptic/29233",
      url: "https://www.theguardian.com/crosswords/cryptic/29233",
      title: "Sample Puzzle",
      status: "badstatus", // should deesrialize to 'PuzzleStatus.Unknown'.
      timeLoad: "invalid-date", // Invalid ISO8601 string
      timeLastAccess: "2023-01-01T12:05:00.000Z",
      timeStart: "2023-01-01T12:10:00.000Z",
      timeFinish: "2023-01-01T12:20:00.000Z",
      elapsedTime: 600, // 10 minutes in seconds
      timerState: TimerState.Started,
      hintsOrMistakes: 2,
      rating: 2,
      notes: "Fun, not too hard",
    };

    // Attempting to deserialize should throw an error
    expect(() => fromSerializableObject(invalidSerializedObject)).toThrowError(
      "date field 'timeLoad' is invalid: invalid-date"
    );

    //  Fix the dates, then check we get a Unknown PuzzleStatus.
    const deserializedObject = fromSerializableObject({
      ...invalidSerializedObject,
      timeLoad: new Date().toISOString(),
    });
    expect(deserializedObject.status).toEqual(PuzzleStatus.Unknown);
  });

  it("should set the correct values for fields which have not been stored", () => {
    const serliazedObjectPartial = {
      puzzleId: "https://www.theguardian.com/crosswords/cryptic/29233",
      storageKey: "puzlog:https://www.theguardian.com/crosswords/cryptic/29233",
      url: "https://www.theguardian.com/crosswords/cryptic/29233",
      title: "Sample Puzzle",
      // status: null, // should be 'unknown'.
      timeLoad: "2023-01-01T12:00:00.000Z",
      timeLastAccess: "2023-01-01T12:05:00.000Z",
      timeStart: "2023-01-01T12:10:00.000Z",
      timeFinish: "2023-01-01T12:20:00.000Z",
      elapsedTime: 600, // 10 minutes in seconds.
      // timerState: null, // should be 'stopped'.
      // hintsOrMistakes: null, // should be '0'.
      // rating: null, // should be 'null'.
      // notes: null, // should be "".
    };

    //  Fix the dates, then check we get a Unknown PuzzleStatus.
    const deserializedObject = fromSerializableObject(serliazedObjectPartial);
    expect(deserializedObject.status).toEqual(PuzzleStatus.Unknown);
    expect(deserializedObject.timerState).toEqual(TimerState.Stopped);
    expect(deserializedObject.hintsOrMistakes).toEqual(null);
    expect(deserializedObject.notes).toEqual("");
  });
});
