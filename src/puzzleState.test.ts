import {
  PuzzleState,
  TimerState,
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
      timeLoad: new Date("2023-01-01T12:00:00Z"),
      timeLastAccess: new Date("2023-01-01T12:05:00Z"),
      timeStart: new Date("2023-01-01T12:10:00Z"),
      timeFinish: new Date("2023-01-01T12:20:00Z"),
      elapsedTime: 600, // 10 minutes in seconds
      timerState: TimerState.Started,
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
      timeLoad: "invalid-date", // Invalid ISO8601 string
      timeLastAccess: "2023-01-01T12:05:00.000Z",
      timeStart: "2023-01-01T12:10:00.000Z",
      timeFinish: "2023-01-01T12:20:00.000Z",
      elapsedTime: 600, // 10 minutes in seconds
      timerState: TimerState.Started,
    };

    // Attempting to deserialize should throw an error
    expect(() => fromSerializableObject(invalidSerializedObject)).toThrowError(
      "Invalid timeLoad: invalid-date"
    );
  });
});
