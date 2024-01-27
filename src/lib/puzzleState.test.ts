import {
  PuzzleState,
  PuzzleStatus,
  toSerializableObject,
  fromSerializableObject,
  MinimumSerializablePuzzle,
} from "./puzzleState"; // Replace 'yourFile' with the actual file path

describe("puzzleState", () => {
  it("should serialize and deserialize PuzzleState without data loss", () => {
    const originalPuzzleState: PuzzleState = {
      userId: "TODO",
      id: "xQI9LNXf12VMm8tEkN31",
      url: "https://www.theguardian.com/crosswords/cryptic/29233",
      title: "Sample Puzzle",
      status: PuzzleStatus.Started,
      timeLoad: new Date("2023-01-01T12:00:00Z"),
      timeLastAccess: new Date("2023-01-01T12:05:00Z"),
      timeStart: new Date("2023-01-01T12:10:00Z"),
      timeFinish: new Date("2023-01-01T12:20:00Z"),
      elapsedTime: 600, // 10 minutes in seconds
      hintsOrMistakes: 2,
      rating: null,
      metadata: {
        title: "Cryptic 29222",
        setter: null,
        series: "Guardian Cryptic",
        datePublished: new Date("2023-11-21T00:00:00+0000)"),
      },
      notes: "Hard 🥵 <\"';", // note complex characters...
    };

    const serializedObject = toSerializableObject(originalPuzzleState);
    const deserializedState = fromSerializableObject(serializedObject);

    expect(deserializedState).toEqual(originalPuzzleState);
  });

  it("should throw an error if dates are not valid ISO8601 strings during deserialization", () => {
    const invalidSerializedObject = {
      userId: "TODO",
      id: "xQI9LNXf12VMm8tEkN31",
      url: "https://www.theguardian.com/crosswords/cryptic/29233",
      title: "Sample Puzzle",
      status: "badstatus", // should deesrialize to 'PuzzleStatus.Unknown'.
      timeLoad: "invalid-date", // Invalid ISO8601 string
      timeLastAccess: "2023-01-01T12:05:00.000Z",
      timeStart: "2023-01-01T12:10:00.000Z",
      timeFinish: "2023-01-01T12:20:00.000Z",
      elapsedTime: 600, // 10 minutes in seconds
      hintsOrMistakes: 2,
      rating: 2,
      metadata: {
        title: "Cryptic 29222",
        setter: null,
        series: "Guardian Cryptic",
        datePublished: null,
      },
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
    const serliazedObjectPartial: MinimumSerializablePuzzle = {
      id: "5jbe0DKy57ndYwuRIeaH",
      url: "https://www.theguardian.com/crosswords/cryptic/29233",
      title: "Sample Puzzle",
      // status: null, // should be 'unknown'.
      timeLoad: "2023-01-01T12:00:00.000Z", // this can also be undefined...
      timeLastAccess: "2023-01-01T12:05:00.000Z", // this can also be undefined...
      timeStart: "2023-01-01T12:10:00.000Z", // this can also be undefined...
      timeFinish: "2023-01-01T12:20:00.000Z", // this can also be undefined...
      elapsedTime: 600, // 10 minutes in seconds.
      // hintsOrMistakes: null, // should be '0'.
      // rating: null, // should be 'null'.
      // notes: null, // should be "".
      // metadata: null // should be null
    };

    //  Fix the dates, then check we get a Unknown PuzzleStatus.
    const deserializedObject = fromSerializableObject(serliazedObjectPartial);
    expect(deserializedObject.userId).toEqual("");
    expect(deserializedObject.status).toEqual(PuzzleStatus.Unknown);
    expect(deserializedObject.hintsOrMistakes).toEqual(null);
    expect(deserializedObject.notes).toEqual("");
    expect(deserializedObject.metadata).toEqual(null);
  });
});
