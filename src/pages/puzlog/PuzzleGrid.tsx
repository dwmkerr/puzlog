import React, { useState } from "react";
import { AgGridReact } from "ag-grid-react"; // React Grid Logic
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme
import { PuzzleState } from "../../puzzleState";
import StatusIcon from "./StatusIcon";
import { msToTime } from "../../helpers";

interface PuzzleGridProps {
  puzzles: PuzzleState[];
}

const PuzzleGrid = ({ puzzles }: PuzzleGridProps) => {
  //  Turn the puzzles ino a set of row data.
  const rowData = puzzles.map((puzzle) => ({
    title: puzzle.title,
    url: puzzle.url,
    status: puzzle.status,
    timeStart: puzzle.timeStart, //.toISOString().substr(0, 10),
    timeEnd: puzzle.timeStart, //toISOString().substr(0, 10),
    elapsedTime: msToTime(puzzle.elapsedTime),
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
      cellRenderer: TitleRenderer,
    },
    { field: "rating", filter: true },
    { field: "timeStart", filter: true },
    { field: "timeEnd", filter: true },
    { field: "elapsedTime", filter: true },
  ]);

  return (
    <div className="ag-theme-quartz" style={{ height: "10em" }}>
      <AgGridReact rowData={rowData} columnDefs={colDefs} />
    </div>
  );
};

export default PuzzleGrid;
