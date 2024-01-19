import { describe, expect, test } from "@jest/globals";
import { scrapeCrosswordMetadata } from "./crossword-metadata";
import { JSDOM /*, VirtualConsole */ } from "jsdom";

//  Create a virtual console that suppresses the CSS errors we get loading the
//  ChatGPT sample (they can be safely ignored and pollute the console output
//  too much).
// const virtualConsole = new VirtualConsole();
// virtualConsole.sendTo(console, { omitJSDOMErrors: true });
// virtualConsole.on("jsdomError", (err) => {
//   if (/Could not parse CSS stylesheet/.test(err.message)) {
//     return;
//   }
//   console.error(`Error uncaught: ${err.message.substring(0, 1024)}`);
//   //  When I'm comfortable I've caught these JDOM issues we can log the error
//   //  fully as below.
//   // console.error(err);
// });

describe("crossword-metadata", () => {
  describe("scrape-crossword-metadata", () => {
    test("correcty scrapes a Guardian Quiptic crossword", async () => {
      const dom = await JSDOM.fromFile(
        "./src/lib/__test_files__/guardian-quiptic-254.html"
        // { virtualConsole },
      );
      const metadata = scrapeCrosswordMetadata(
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
        "./src/lib/__test_files__/guardian-cryptic-29211.html"
        // { virtualConsole },
      );
      const metadata = scrapeCrosswordMetadata(
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
});
