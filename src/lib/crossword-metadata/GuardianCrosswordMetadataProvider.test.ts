import { JSDOM } from "jsdom";
import { GuardianCrosswordMetadataProvider } from "./GuardianCrosswordMetadataProvider";

describe("GuardianCrosswordMetadataProvider", () => {
  test("correcty scrapes a Guardian Quiptic crossword", async () => {
    const dom = await JSDOM.fromFile(
      "./src/lib/crossword-metadata/__test_files__/guardian-quiptic-254.html"
    );
    const provider = new GuardianCrosswordMetadataProvider();
    const metadata = provider.loadMetadata(
      "https://www.theguardian.com/crosswords/quiptic/254#1-across",
      dom.window.document
    );
    expect(metadata).toEqual({
      series: "Guardian Quiptic",
      title: "Quiptic crossword No 254",
      setter: "Hazard",
      //  Note the webpage shows "Mon 27 Sep 2004 01.00 CEST" but we scrape
      //  the underlying timestamp for accuracy and ease across timezones.
      datePublished: new Date(1096243200000),
    });
  });

  test("correcty scrapes a Guardian Cryptic crossword", async () => {
    const dom = await JSDOM.fromFile(
      "./src/lib/crossword-metadata/__test_files__/guardian-cryptic-29211.html"
    );
    const provider = new GuardianCrosswordMetadataProvider();
    const metadata = provider.loadMetadata(
      "https://www.theguardian.com/crosswords/cryptic/29211",
      dom.window.document
    );
    expect(metadata).toEqual({
      series: "Guardian Cryptic",
      title: "Cryptic crossword No 29,211",
      setter: "Picaroon",
      datePublished: new Date(1698278400000), // 2023-10-26T00:00:00.000Z
    });
  });
});
