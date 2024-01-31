export enum QueryType {
  InnerText,
  Count,
}

export interface ElementScraper {
  type: QueryType;
  xpath: string;
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
