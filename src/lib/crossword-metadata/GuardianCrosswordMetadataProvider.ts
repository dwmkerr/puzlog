import {
  CrosswordMetadata,
  CrosswordMetadataProvider,
} from "./CrosswordMetadataProvider";
import {} from "./crossword-metadata";
import { QueryType, scrapeString } from "./scraping-helpers";

const seriesRexes = [
  { series: "Guardian Quiptic", rex: /theguardian\.com\/crosswords\/quiptic/ },
  { series: "Guardian Cryptic", rex: /theguardian\.com\/crosswords\/cryptic/ },
];

export class GuardianCrosswordMetadataProvider extends CrosswordMetadataProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  test(href: string, document: Document): boolean {
    //  Test the href against the regexes. If any match, we have found a
    //  crossword page we can scrape for metadata.
    return seriesRexes.find((series) => series.rex.test(href)) !== undefined;
  }

  loadMetadata(href: string, document: Document): Partial<CrosswordMetadata> {
    const seriesRex = seriesRexes.find((series) => series.rex.test(href));
    const series = seriesRex?.series;
    if (!series) {
      throw new Error(`href ${href} not identified as a guardian crossword`);
    }

    const queries = {
      title: {
        type: QueryType.InnerText,
        xpath: '//article[@id="crossword"]//h1',
      },
      setter: {
        type: QueryType.InnerText,
        xpath:
          '//article[@id="crossword"]//a[@data-link-name="crossword-creator"]',
      },
      datePublishedTimestamp: {
        type: QueryType.InnerText,
        xpath:
          '//article[@id="crossword"]//time[@itemprop="datePublished"]/@data-timestamp',
      },
    };

    //  Get the published timestamp then turn into a date.
    const publishedTimestamp =
      scrapeString(document, queries.datePublishedTimestamp) || "";
    const publishedDate = publishedTimestamp
      ? new Date(parseInt(publishedTimestamp))
      : undefined;

    //  Scrape each of the fields and return.
    return {
      series,
      title: scrapeString(document, queries.title) || "",
      setter: scrapeString(document, queries.setter) || "",
      datePublished: publishedDate,
    };
  }
}
