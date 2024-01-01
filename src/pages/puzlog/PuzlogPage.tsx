import React, { useEffect, useState } from "react";
import { PuzzleState } from "../../lib/puzzleState";
import {
  loadPuzzles,
  savePuzzle,
  deletePuzzle,
} from "../../extensionInterface";
import PuzzleGrid from "./PuzzleGrid";
import { storageKeyFromPuzzleId } from "../../helpers";

const PuzlogPage = () => {
  // State to store the array of puzzles
  const [puzzles, setPuzzles] = useState<PuzzleState[]>([]);

  useEffect(() => {
    // Define your async function
    const getPuzzles = async () => {
      try {
        // Perform your async operation to get puzzles
        const puzzles = await loadPuzzles();
        setPuzzles(puzzles);
      } catch (error) {
        console.error("puzlog: error getting puzzles", error);
      }
    };

    // Call the async function on component mount
    getPuzzles();
  }, []); // Empty dependency array ensures this effect runs only once on mount

  const downloadPuzzles = (puzzles: PuzzleState[], filename: string): void => {
    // Create a Blob from the JSON data
    const blob = new Blob([JSON.stringify(puzzles)], {
      type: "application/json",
    });

    //  Create the link, download the content, clean up.
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      style={{
        padding: "1em",
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
      }}
    >
      <h1>Puzlog</h1>
      <p>
        <a onClick={() => downloadPuzzles(puzzles, "puzzles.json")}>Download</a>
      </p>
      <PuzzleGrid
        puzzles={puzzles}
        updatePuzzle={async (puzzle) => await savePuzzle(puzzle)}
        deletePuzzle={async (puzzleId) =>
          await deletePuzzle(storageKeyFromPuzzleId(puzzleId))
        }
        style={{ width: "100%", flexGrow: 1 }}
      />
    </div>
  );
};

export default PuzlogPage;
