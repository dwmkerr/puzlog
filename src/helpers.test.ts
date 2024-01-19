import {
  puzzleIdFromUrl,
  storageKeyFromPuzzleId,
  timeAgo,
  msToTime,
} from "./lib/helpers";

describe("helpers", () => {
  describe("msToTime Function", () => {
    it("should convert milliseconds to hh:mm:ss format", () => {
      // Test case 1: 3665000 milliseconds (1 hour, 1 minute, 5 seconds)
      expect(msToTime(3665000)).toEqual("01:01:05");

      // Test case 2: 900000 milliseconds (15 minutes)
      expect(msToTime(900000)).toEqual("00:15:00");

      // Test case 3: 60000 milliseconds (1 minute)
      expect(msToTime(60000)).toEqual("00:01:00");

      // Test case 4: Negative milliseconds, large milliseconds, and zero milliseconds
      debugger;
      expect(msToTime(-1000)).toEqual("00:00:00");
      expect(msToTime(86400000)).toEqual("24:00:00");
      expect(msToTime(0)).toEqual("00:00:00");
    });
  });

  describe("puzzleIdFromUrl", () => {
    it("correctly creates a puzzle id from a simple puzzle url", () => {
      const input = "https://www.theguardian.com/crosswords/cryptic/29233";
      const result = puzzleIdFromUrl(input);
      expect(result).toEqual(
        "https://www.theguardian.com/crosswords/cryptic/29233"
      );
    });

    it("correctly creates a puzzle id from a puzzle url with a fragment", () => {
      //  Note the '#' fragment - many puzzles will have this and it should not
      //  be part of the id.
      const input =
        "https://www.theguardian.com/crosswords/cryptic/29233#4-down";
      const result = puzzleIdFromUrl(input);
      expect(result).toEqual(
        "https://www.theguardian.com/crosswords/cryptic/29233"
      );
    });
  });

  describe("storageKeyFromPuzzleId", () => {
    it("correctly creates a storage key from a puzzle id", () => {
      const input = "https://www.theguardian.com/crosswords/cryptic/29233";
      const result = storageKeyFromPuzzleId(input);
      expect(result).toEqual(
        "puzlog:https://www.theguardian.com/crosswords/cryptic/29233"
      );
    });
  });

  describe("timeAgo function", () => {
    it('returns "2 seconds ago" for a time 2 seconds ago', () => {
      const currentTime = new Date();
      const earlierTime = new Date(currentTime.getTime() - 2000); // 2 seconds ago
      const result = timeAgo(earlierTime, currentTime);
      expect(result).toBe("2 seconds ago");
    });

    test('returns "2 minutes ago" for a time 2 minutes ago', () => {
      const currentTime = new Date();
      const earlierTime = new Date(currentTime.getTime() - 120000); // 2 minutes ago
      const result = timeAgo(earlierTime, currentTime);
      expect(result).toBe("2 minutes ago");
    });

    test('returns "2 hours ago" for a time 2 hours ago', () => {
      const currentTime = new Date();
      const earlierTime = new Date(currentTime.getTime() - 7200000); // 2 hours ago
      const result = timeAgo(earlierTime, currentTime);
      expect(result).toBe("2 hours ago");
    });

    test('returns "2 days ago" for a time 2 days ago', () => {
      const currentTime = new Date();
      const earlierTime = new Date(currentTime.getTime() - 172800000); // 2 days ago
      const result = timeAgo(earlierTime, currentTime);
      expect(result).toBe("2 days ago");
    });
  });
});
