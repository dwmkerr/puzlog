import { PuzzleState } from "./puzzleState";
import { getElementOrFail } from "./document";
import { loadPuzzles, deletePuzzle } from "./extensionInterface";
import { msToTime } from "./helpers";

function buildTableRow(puzzle: PuzzleState): HTMLTableRowElement {
  const tableTemplate = document.createElement("template");
  tableTemplate.id = puzzle.puzzleId;
  tableTemplate.innerHTML = `
    <tr>
      <td class="incomplete">
        <span class="icon">&#10007;</span>
        <a href="${puzzle.url}">${puzzle.title}</a>
      </td>
      <td>
        <span class="unfilled-star">&#9734;</span>
        <span class="unfilled-star">&#9734;</span>
      </td>
      <td>${puzzle.timeStart.toISOString().substr(0, 10)}</td>
      <td>TODO</td>
      <td>${msToTime(puzzle.elapsedTime)}</td>
      <td>TODO</td>
      <td class="edit-delete-icons">
        <span title="Edit">&#9998;</span>
        <span class="deleteButton" title="Delete">&#10006;</span>
      </td>
    </tr>
  `;
  const tableRow = tableTemplate.content.children[0] as HTMLTableRowElement;
  const deleteButton = tableRow.querySelector(
    ".deleteButton"
  ) as HTMLSpanElement;
  if (!deleteButton) {
    throw new Error(`required button element missing`);
  }
  deleteButton.onclick = () => {
    deletePuzzle(puzzle.storageKey);
  };

  return tableRow;
}

//  Get the button and set the handler.
document.addEventListener("DOMContentLoaded", async () => {
  console.log(`puzlog: initialising puzlog UI...`);

  const puzzles = await loadPuzzles();
  const puzzlesTable = getElementOrFail("puzzles_table") as HTMLTableElement;
  const elements = puzzles.map(buildTableRow);
  elements.forEach((row) => puzzlesTable.append(row));
});
