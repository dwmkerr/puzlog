import React, { useState } from "react";
import { AgGridReact } from "ag-grid-react"; // React Grid Logic
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme
import { PuzzleState } from "../../lib/puzzleState";
import StatusIcon from "./StatusIcon";
import { msToTime } from "../../helpers";

type UpdatePuzzleFunc = (puzzle: PuzzleState) => Promise<void>;

interface PuzzleGridProps extends React.HTMLProps<HTMLDivElement> {
  puzzles: PuzzleState[];
  updatePuzzle: UpdatePuzzleFunc;
}

const PuzzleGrid = ({ puzzles, updatePuzzle, ...props }: PuzzleGridProps) => {
  //  Turn the puzzles ino a set of row data.
  const rowData = puzzles.map((puzzle) => ({
    title: puzzle.title,
    url: puzzle.url,
    status: puzzle.status,
    hintsOrMistakes: puzzle.hintsOrMistakes,
    timeStart: puzzle.timeStart, //.toISOString().substr(0, 10),
    timeEnd: puzzle.timeStart, //toISOString().substr(0, 10),
    elapsedTime: msToTime(puzzle.elapsedTime),
    puzzle,
  }));
  const StatusRenderer = ({ value }) => (
    <span
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        alignItems: "center",
      }}
    >
      <StatusIcon size={16} status={value} />
    </span>
  );

  const TitleRenderer = ({ value }) => (
    <span
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        alignItems: "center",
      }}
    >
      <StatusIcon size={16} status={value.status} />
      <a href={value.url} style={{ paddingLeft: "1em" }}>
        <p
          style={{
            textOverflow: "ellipsis",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {value.title}
        </p>
      </a>
    </span>
  );

  const [colDefs] = useState([
    // {
    //   field: "status",
    //   headerName: "",
    //   width: 64,
    //   filter: false,
    //   cellRenderer: StatusRenderer,
    // },
    {
      field: "title",
      filter: true,
      // width: 480,
      flex: 1,
      valueGetter: (params) => ({
        title: params.data.title,
        status: params.data.status,
        url: params.data.url,
      }),
      //  Filters take the value of 'field' or 'valueGetter'. Given that
      //  'valueGetter' returns an object (so that we can have a composite
      //  value) we need to explicitly provide the string that the filter
      //  will operate on.
      filterValueGetter: (params) => params.data.title,
      cellRenderer: TitleRenderer,
    },
    {
      field: "hintsOrMistakes",
      filter: true,
      editable: true,
    },
    { field: "rating", filter: true },
    { field: "timeStart", filter: true },
    { field: "timeEnd", filter: true },
    { field: "elapsedTime", filter: true },
  ]);

  const onCellValueChanged = async (event) => {
    //  Get the key info on the change.
    const {
      data: puzzleRowData,
      oldValue,
      newValue,
      colDef: { field },
    } = event;
    console.log(
      `Cell Change for ID ${puzzleRowData.title} field ${field}: ${oldValue} -> ${newValue}`
    );
    console.log("raw puzzle", puzzleRowData.puzzle);

    //  Update the puzzle state, save it, broadcast changes.
    const updatedPuzzle = {
      ...puzzleRowData.puzzle,
      [field]: newValue,
    };
    console.log("updated puzzle", updatedPuzzle);
    await updatePuzzle(updatedPuzzle);
  };

  return (
    <div className="ag-theme-quartz" {...props}>
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
        onCellValueChanged={onCellValueChanged}
      />
    </div>
  );
};

export default PuzzleGrid;
