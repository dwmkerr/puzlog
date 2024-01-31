import { findMetadataProvider, enrichMetadata } from "./crossword-metadata";
import { JSDOM } from "jsdom";
import { GuardianCrosswordMetadataProvider } from "./GuardianCrosswordMetadataProvider";

describe("crossword-metadata", () => {
  describe("find-crossword-metadata-provider", () => {
    test("correcty identifies a metadata provider for a Guardian Quiptic crossword", async () => {
      const dom = await JSDOM.fromFile(
        "./src/lib/crossword-metadata/__test_files__/guardian-quiptic-254.html"
      );
      const metadataProvider = findMetadataProvider(
        "https://www.theguardian.com/crosswords/quiptic/254#1-across",
        dom.window.document
      );
      expect(metadataProvider).toBeInstanceOf(
        GuardianCrosswordMetadataProvider
      );
    });

    test("correcty identifies a metadata provider for a Guardian Cryptic crossword", async () => {
      const dom = await JSDOM.fromFile(
        "./src/lib/crossword-metadata/__test_files__/guardian-cryptic-29211.html"
      );
      const metadataProvider = findMetadataProvider(
        "https://www.theguardian.com/crosswords/cryptic/29211",
        dom.window.document
      );
      expect(metadataProvider).toBeInstanceOf(
        GuardianCrosswordMetadataProvider
      );
    });

    test("correcty find no metadata provider for a page we do not recognise", async () => {
      const dom = await JSDOM.fromFile(
        "./src/lib/crossword-metadata/__test_files__/empty.html"
      );
      const metadataProvider = findMetadataProvider(
        "https://www.unknown.com/crosswords/unknown-crossword",
        dom.window.document
      );
      expect(metadataProvider).toBeUndefined();
    });
  });

  describe("enrich-metadata", () => {
    test("can enrich metadata with new values", () => {
      const initial = {
        series: "Some Crosswords",
        title: "Crossword 2",
      };
      const updated = {
        series: "Some Crosswords",
        setter: "Some Setter",
      };

      //  When we enrich metadata the result should be the union of the truthy
      //  properties.
      const enriched = enrichMetadata(initial, updated);

      expect(enriched).toMatchObject({
        series: "Some Crosswords",
        title: "Crossword 2",
        setter: "Some Setter",
      });
    });
  });
});
