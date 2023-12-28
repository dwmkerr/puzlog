import React from "react";
import { createRoot } from "react-dom/client";
import ExtensionToolbar from "../components/ExtensionToolbar";

export class ExtensionOverlay {
  private static readonly ID_IFRAME = "puzlog-extension-frame";

  private iframe: HTMLIFrameElement;
  private container: HTMLDivElement;

  private constructor(iframe: HTMLIFrameElement, container: HTMLDivElement) {
    this.iframe = iframe;
    this.container = container;
  }

  static create(document: Document): ExtensionOverlay {
    //  If this document already has an extension overlay frame, fail.
    if (document.getElementById(this.ID_IFRAME)) {
      throw new Error(
        "Cannot create puzlog extension overlay - an extension overlay already exists in the document"
      );
    }

    //  Create the iframe on the document to host the extension overlay.
    const iframe = document.createElement<"iframe">("iframe");
    iframe.id = this.ID_IFRAME;
    Object.assign(iframe.style, {
      display: "none", // will change to 'block' when we show the overlay...
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "50px",
      border: "none", // Remove border
    });

    //  Add the iframe to the document and access its content doc. If the
    //  content doc is unavailable, fail.
    document.body.appendChild(iframe);
    const iframeDocument = iframe.contentDocument;
    if (!iframeDocument) {
      throw new Error("Cannot access puzlog extension iframe content");
    }

    //  Now create the contain div in the iframe, a attach a closed shadow root
    //  and then build the UI.
    const shadowContainer = iframeDocument.createElement("div");
    const shadowRoot = shadowContainer.attachShadow({ mode: "closed" });

    const root = createRoot(shadowRoot); // createRoot(container!) if you use TypeScript
    root.render(<ExtensionToolbar />);

    iframeDocument.body.appendChild(shadowContainer);

    // const overlayDiv = document.createElement('div');
    // overlayDiv.style.display = 'none';
    // // Customize additional styles here
    // document.body.appendChild(overlayDiv);
    return new ExtensionOverlay(iframe, shadowContainer);
  }

  show(): void {
    this.iframe.style.display = "block";
  }

  hide(): void {
    this.iframe.style.display = "none";
  }

  update(content: string): void {
    // this.container.textContent = content;
  }
}
