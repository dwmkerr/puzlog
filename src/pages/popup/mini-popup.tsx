import React from "react";
import { createRoot } from "react-dom/client";
import MiniPopup from "./MiniPopup";
import ErrorBoundary from "../../components/ErrorBoundary";

const container = document.getElementById("root");
if (!container) {
  throw new Error(`puzlog: cannot find container element`);
}
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(
  <ErrorBoundary>
    <MiniPopup />
  </ErrorBoundary>
);
