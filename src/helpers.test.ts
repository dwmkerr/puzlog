import { puzzleIdFromUrl, storageKeyFromPuzzleId } from "./helpers";

describe("helpers", () => {
  describe("puzzleIdFromUrl", () => {
    it("correctly creates a puzzle id from a simple puzzle url", () => {
      const input = "https://www.theguardian.com/crosswords/cryptic/29233";
      const result = puzzleIdFromUrl(input);
      expect(result).toEqual("https://www.theguardian.com/crosswords/cryptic/29233");
    });

    it("correctly creates a puzzle id from a puzzle url with a fragment", () => {
      //  Note the '#' fragment - many puzzles will have this and it should not
      //  be part of the id.
      const input = "https://www.theguardian.com/crosswords/cryptic/29233#4-down";
      const result = puzzleIdFromUrl(input);
      expect(result).toEqual("https://www.theguardian.com/crosswords/cryptic/29233");
    });
  });

  describe("storageKeyFromPuzzleId", () => {
    it("correctly creates a storage key from a puzzle id", () => {
      const input = "https://www.theguardian.com/crosswords/cryptic/29233";
      const result = storageKeyFromPuzzleId(input);
      expect(result).toEqual("puzlog:https://www.theguardian.com/crosswords/cryptic/29233");
    });
  });
});
