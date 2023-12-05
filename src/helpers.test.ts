import { puzzleIdFromUrl, storageKeyFromPuzzleId, timeAgo } from "./helpers";

describe("helpers", () => {
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
