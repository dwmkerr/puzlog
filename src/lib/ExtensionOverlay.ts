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

    //  Create the styles for the UI.
    const shadowCss = `
    #extension-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      opacity: 100%;
      z-index: 9999;
      font-size: 1em;
    }

    .toolbar {
      display: flex;
      align-items: center;
      height: 40px;
      background-color: white;
      color: black;
      padding: 0 10px;
    }

    .left {
      flex: 1;
      display: flex;
      align-items: center;
    }

    .middle {
      flex: 1;
      text-align: center;
    }

    .right {
      flex: 1;
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }

    .timer {
      margin-right: 10px;
    }

    .icon {
      width: 24px;
      height: 24px;
      margin-left: 10px;
      cursor: pointer;
    }
  `;
    const style = iframeDocument.createElement("style");
    style.textContent = shadowCss;
    shadowRoot.appendChild(style);

    //  Create the UI elements, then add them to the container and then to the
    //  shadow DOM and iframe.
    const container = iframeDocument.createElement("div");
    container.id = "extension-container"; // Set an ID for easy access

    const toolbar = document.createElement("div");
    toolbar.className = "toolbar";
    container.appendChild(toolbar);

    const left = document.createElement("div");
    left.className = "left";
    toolbar.appendChild(left);
    const timer = document.createElement("div");
    timer.className = "timer";
    timer.textContent = "00:00";
    left.appendChild(timer);

    const middle = document.createElement("div");
    middle.className = "middle";
    middle.textContent = "Puzlog";
    toolbar.appendChild(middle);

    const right = document.createElement("div");
    right.className = "right";
    toolbar.appendChild(right);
    const addButton = (contents: string) => {
      const button = document.createElement("div");
      button.className = "icon";
      button.textContent = contents;
      right.appendChild(button);
    };

    addButton("&#128065;");
    addButton("&#128279;");
    addButton("&#9654;");
    addButton("&#9724;");

    shadowRoot.appendChild(container);
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
