import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter"; // Font used by JoyUI
import PuzlogPage from "./PuzlogPage";
import { PuzzleRepository } from "../../lib/PuzzleRepository";
import ErrorBoundary from "../../components/ErrorBoundary";
import { AlertContextProvider } from "../../components/AlertContext";

//  Instantiate a puzzle repository.
const puzzleRepository = PuzzleRepository.get();

//  Get the puzzle id if we have one in the query parameters.
const urlParams = new URLSearchParams(window.location.search);
const selectedPuzzleId = urlParams.get("id");

const container = document.getElementById("root");
if (!container) {
  throw new Error(`puzlog: cannot find container element`);
}
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(
  <ErrorBoundary>
    <AlertContextProvider>
      <PuzlogPage
        puzzleRepository={puzzleRepository}
        selectedPuzzleId={selectedPuzzleId}
      />
    </AlertContextProvider>
  </ErrorBoundary>
);
