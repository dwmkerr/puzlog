import {
  CrosswordMetadata,
  CrosswordMetadataProvider,
} from "./CrosswordMetadataProvider";
import { GuardianCrosswordMetadataProvider } from "./GuardianCrosswordMetadataProvider";

export function findMetadataProvider(
  href: string,
  document: Document
): CrosswordMetadataProvider | undefined {
  //  Create an instance of our providers and test each one against the
  //  document.
  const providers = [new GuardianCrosswordMetadataProvider()];

  return providers.find((provider) => provider.test(href, document));
}

export function enrichMetadata(
  initial: Partial<CrosswordMetadata>,
  updated: Partial<CrosswordMetadata>
): Partial<CrosswordMetadata> {
  const enriched: Partial<CrosswordMetadata> = {
    series: initial.series || updated.series,
    title: initial.title || updated.title,
    setter: initial.setter || updated.setter,
    datePublished: initial.datePublished || updated.datePublished,
  };
  return enriched;
}
