import React from "react";
import { createRoot } from "react-dom/client";
import MiniPopup from "./MiniPopup";
import ErrorBoundary from "../../components/ErrorBoundary";
import { AlertContextProvider } from "../../components/AlertContext";

const container = document.getElementById("root");
if (!container) {
  throw new Error(`puzlog: cannot find container element`);
}
const root = createRoot(container);
root.render(
  <ErrorBoundary>
    <AlertContextProvider>
      <MiniPopup />
    </AlertContextProvider>
  </ErrorBoundary>
);
