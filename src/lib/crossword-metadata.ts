export enum QueryType {
  InnerText,
  Count,
}

export interface CrosswordMetadata {
  series: string | null;
  setter: string | null;
  title: string | null;
}

export interface ElementScraper {
  type: QueryType;
  xpath: string;
}

export interface PuzzleScraper {
  seriesName: string;
  hrefTest: RegExp;
  title: ElementScraper;
  // datePublished: ElementScraper;
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
  },
];
