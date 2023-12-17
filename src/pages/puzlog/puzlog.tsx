import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { PuzzleState } from "../../puzzleState";
import { loadPuzzles, deletePuzzle } from "../../extensionInterface";
import { msToTime } from "../../helpers";
import PuzzleGrid from "./PuzzleGrid";

import StatusIcon from "./StatusIcon";

type Props = {
  // Define the properties (props) that your component accepts
  // For example:
  title: string;
  count: number;
};

const Puzlog: React.FC<Props> = ({}) => {
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

  return (
    <div>
      <h1>Puzlog</h1>
      <p>Testing the index.</p>
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
      <div>
        <PuzzleGrid puzzles={puzzles} />
      </div>
    </div>
  );
};

const container = document.getElementById("root");
if (!container) {
  throw new Error(`puzlog: cannot find container element`);
}
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<Puzlog title="test" count={2} />);
