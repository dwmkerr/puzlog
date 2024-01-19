export enum QueryType {
  InnerText,
  Count,
}

export interface CrosswordMetadata {
  series: string | null;
  title: string | null;
  setter: string | null;
  datePublished: Date | null;
}

export interface ElementScraper {
  type: QueryType;
  xpath: string;
}

export interface PuzzleScraper {
  seriesName: string;
  hrefTest: RegExp;
  title: ElementScraper;
  datePublishedTimestamp: ElementScraper;
  setter: ElementScraper;
  // setterUrl: ElementScraper;
}

export function scrapeString(
  document: Document,
  scraper: ElementScraper
): string | null | undefined {
  return document.evaluate(
    scraper.xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue?.textContent;
}

export const scrapers: PuzzleScraper[] = [
  {
    seriesName: "Guardian Quiptic",
    hrefTest: /theguardian\.com\/crosswords\/quiptic/,
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
  },
  {
    seriesName: "Guardian Cryptic",
    hrefTest: /theguardian\.com\/crosswords\/cryptic/,
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
  },
];

export function scrapeCrosswordMetadata(
  href: string,
  document: Document
): CrosswordMetadata {
  //  If the puzzle hasn't been loaded, we can check its metadata.
  const scraper = scrapers.find((scraper) => {
    const match = scraper.hrefTest.test(href);
    return match;
  });

  if (!scraper) {
    return { setter: null, title: null, series: null, datePublished: null };
  }

  //  Get the published timestamp.
  const publishedTimestamp =
    scrapeString(document, scraper.datePublishedTimestamp) || "";
  const publishedDate = publishedTimestamp
    ? new Date(parseInt(publishedTimestamp))
    : null;
  return {
    series: scraper.seriesName,
    title: scrapeString(document, scraper.title) || "",
    setter: scrapeString(document, scraper.setter) || "",
    datePublished: publishedDate,
  };
}
