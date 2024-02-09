export interface CrosswordMetadata {
  series: string;
  title: string;
  setter: string;
  datePublished: Date;
}

export abstract class CrosswordMetadataProvider {
  abstract test(href: string, document: Document): boolean;
  abstract loadMetadata(
    href: string,
    document: Document
  ): Partial<CrosswordMetadata>;
}
