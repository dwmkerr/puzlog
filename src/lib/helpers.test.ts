import { isExtensionAccessibleTab } from "./helpers";

describe("helpers", () => {
  describe("isExtensionAccessibleTab", () => {
    test("correctly identifies extension accessible tabs", () => {
      //  Returns false for the chrome home page (or similar).
      expect(isExtensionAccessibleTab(undefined)).toBe(false);
      expect(isExtensionAccessibleTab(null)).toBe(false);
      expect(isExtensionAccessibleTab("")).toBe(false);

      //  Returns false for chrome internal pages.
      expect(isExtensionAccessibleTab("chrome://settings")).toBe(false);
      expect(isExtensionAccessibleTab("chrome://extensions")).toBe(false);

      //  Returns false for extension pages.
      expect(
        isExtensionAccessibleTab(
          "chrome-extension://kiohhamgmipbmcbnbenbncgjnfdbcdgn/puzlog.html"
        )
      ).toBe(false);

      //  Returns true for valid urls.
      expect(
        isExtensionAccessibleTab(
          "https://www.theguardian.com/crosswords/cryptic/29280"
        )
      ).toBe(true);
      expect(
        isExtensionAccessibleTab(
          "https://www.theguardian.com/crosswords/quiptic/255"
        )
      ).toBe(true);
    });
  });
});
