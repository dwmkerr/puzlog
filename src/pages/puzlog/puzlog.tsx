import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter"; // Font used by JoyUI
import PuzlogPage from "./PuzlogPage";
import { PuzzleRepository } from "../../lib/PuzzleRepository";

//  Instantiate a puzzle repository.
//  const puzzleRepository = new ChromeStoragePuzzleRepository(chrome.storage.local);
const puzzleRepository = new PuzzleRepository();

//  Get the puzzle id if we have one in the query parameters.
const urlParams = new URLSearchParams(window.location.search);
const selectedPuzzleId = urlParams.get("id");

const container = document.getElementById("root");
if (!container) {
  throw new Error(`puzlog: cannot find container element`);
}
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(
  <PuzlogPage
    puzzleRepository={puzzleRepository}
    selectedPuzzleId={selectedPuzzleId}
  />
);
