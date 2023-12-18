import React from "react";
import { createRoot } from "react-dom/client";
import PuzlogPage from "./PuzlogPage";

const container = document.getElementById("root");
if (!container) {
  throw new Error(`puzlog: cannot find container element`);
}
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<PuzlogPage title="test" count={2} />);
