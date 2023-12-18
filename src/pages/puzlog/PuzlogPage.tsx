import React, { useEffect, useState } from "react";
import { PuzzleState } from "../../lib/puzzleState";
import {
  loadPuzzles,
  deletePuzzle,
  savePuzzle,
} from "../../extensionInterface";
import { msToTime } from "../../helpers";
import PuzzleGrid from "./PuzzleGrid";

import StatusIcon from "./StatusIcon";

type Props = {
  // Define the properties (props) that your component accepts
  // For example:
  title: string;
  count: number;
};

const PuzlogPage = ({}: Props) => {
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
    <div style={{ height: "100%" }}>
      <h1>Puzlog</h1>
      <p>
        Testing the index.{" "}
        <a onClick={() => downloadPuzzles(puzzles, "puzzles.json")}>Download</a>
      </p>
      <table id="puzzles_table">
        <thead>
          <tr>
            <th>Crossword</th>
            <th>Ranking</th>
            <th>Date Started</th>
            <th>Date Finished</th>
            <th>Time Taken</th>
            <th>Correct Clues</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {puzzles.map((puzzle, index) => (
            <tr key={index}>
              <td className="incomplete">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <StatusIcon size={16} status={puzzle.status} />
                  <a href={puzzle.url} style={{ paddingLeft: "0.4em" }}>
                    {puzzle.title}
                  </a>
                </div>
              </td>
              <td>
                <span className="unfilled-star">&#9734;</span>
                <span className="unfilled-star">&#9734;</span>
              </td>
              <td>{puzzle.timeStart.toISOString().substr(0, 10)}</td>
              <td>TODO</td>
              <td>{msToTime(puzzle.elapsedTime)}</td>
              <td>TODO</td>
              <td className="edit-delete-icons">
                <span title="Edit">&#9998;</span>
                <span
                  title="Delete"
                  onClick={() => deletePuzzle(puzzle.storageKey)}
                >
                  &#10006;
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <PuzzleGrid
        puzzles={puzzles}
        updatePuzzle={async (puzzle) => await savePuzzle(puzzle, true)}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default PuzlogPage;
