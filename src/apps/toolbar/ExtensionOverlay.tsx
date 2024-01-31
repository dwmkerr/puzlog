import React from "react";
import { createRoot } from "react-dom/client";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import GlobalStyles from "@mui/joy/GlobalStyles";
import ExtensionToolbar from "../../components/ExtensionToolbar";
import { Puzzle } from "../../lib/puzzle";
import CustomIframe from "../../components/CustomIframe";

export class ExtensionOverlay {
  private static readonly ID_IFRAME = "puzlog-extension-frame";

  private constructor() {
    //  Private as this is created only via the 'create' factory function.
  }

  static create(
    document: Document,
    puzzle: Puzzle | undefined
  ): ExtensionOverlay {
    //  If this document already has an extension overlay frame, fail.
    if (document.getElementById(this.ID_IFRAME)) {
      throw new Error(
        "Cannot create puzlog extension overlay - an extension overlay already exists in the document"
      );
    }

    //  Create the iframe on the document to host the extension overlay.
    const div = document.createElement<"div">("div");
    div.id = this.ID_IFRAME;
    document.body.appendChild(div);
    const root = createRoot(div); // createRoot(container!) if you use TypeScript
    root.render(
      <CustomIframe
        style={{
          display: "block",
          position: "fixed",
          top: "0",
          left: "0",
          width: "100%",
          height: "100px", // give space for shadow/tooltip
          border: "none", // Remove border
          zIndex: 9999, // try and sit on top of everthing
        }}
      >
        <CssVarsProvider>
          <CssBaseline />
          <GlobalStyles
            styles={{
              body: {
                background: "transparent",
              },
            }}
          />
          <ExtensionToolbar pageTitle={document.title} puzzle={puzzle} />
        </CssVarsProvider>
      </CustomIframe>
    );

    return new ExtensionOverlay();
  }
}
