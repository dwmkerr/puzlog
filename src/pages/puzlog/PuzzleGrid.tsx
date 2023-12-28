import React, { useState, CSSProperties } from "react";
import { AgGridReact } from "ag-grid-react"; // React Grid Logic
import { ColDef, ICellRendererParams } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme
import { PuzzleState, PuzzleStatus } from "../../lib/puzzleState";
import StatusIcon from "./StatusIcon";
import StarRating from "../../components/StarRating";
import { msToTime } from "../../helpers";
import theme from "../../theme";

type UpdatePuzzleFunc = (puzzle: PuzzleState) => Promise<void>;

interface PuzzleGridProps extends React.HTMLProps<HTMLDivElement> {
  puzzles: PuzzleState[];
  updatePuzzle: UpdatePuzzleFunc;
}

interface PuzzleRowData {
  title: string;
  url: string;
  status: PuzzleStatus;
  hintsOrMistakes: number | null;
  rating: number | null;
  timeStart: Date;
  timeFinish: Date | null;
  elapsedTime: number;
  notes: string;
  puzzle: PuzzleState;
}

const PuzzleGrid = ({ puzzles, updatePuzzle, ...props }: PuzzleGridProps) => {
  //  Turn the puzzles ino a set of row data.
  const rowData = puzzles.map((puzzle) => ({
    title: puzzle.title,
    url: puzzle.url,
    status: puzzle.status,
    hintsOrMistakes: puzzle.hintsOrMistakes,
    rating: puzzle.rating,
    timeStart: puzzle.timeStart,
    timeFinish: puzzle.timeFinish,
    elapsedTime: msToTime(puzzle.elapsedTime),
    notes: puzzle.notes,
    puzzle,
  }));

  // eslint-disable-next-line
  // const StatusRenderer = ({ value }: any) => (
  //   <span
  //     style={{
  //       display: "flex",
  //       height: "100%",
  //       width: "100%",
  //       alignItems: "center",
  //     }}
  //   >
  //     <StatusIcon size={16} status={value} />
  //   </span>
  // );

  const TitleRenderer = (props: ICellRendererParams<PuzzleRowData>) => {
    const finishedLinkStyle: CSSProperties = {
      fontWeight: "bold",
      //  TODO extract to var - also used in the finished icon
      //  TODO use the same color as the 'in progress' icon - so icons and links
      //  always match colors
      color: theme.colors.success,
    };
    return (
      <span
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
        }}
      >
        <StatusIcon
          size={16}
          status={props.data?.status || PuzzleStatus.Unknown}
        />
        <a
          href={props.data?.url}
          style={{
            paddingLeft: "1em",
            ...(props.data?.status === PuzzleStatus.Finished
              ? finishedLinkStyle
              : {}),
          }}
        >
          <p
            style={{
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {props.value /* i.e. the title */}
          </p>
        </a>
      </span>
    );
  };
  const RatingRenderer = (props: ICellRendererParams<PuzzleRowData>) => {
    const onStarsChanged = (stars: number) => {
      props.node.setDataValue("rating", stars);
    };
    return (
      <StarRating
        maxStars={3}
        stars={props.value}
        onStarsChanged={onStarsChanged}
      />
    );
  };

  const [colDefs] = useState<ColDef[]>([
    // {
    //   field: "status",
    //   headerName: "",
    //   width: 64,
    //   filter: false,
    //   cellRenderer: StatusRenderer,
    // },
    {
      field: "title",
      headerName: "Crossword",
      filter: true,
      minWidth: 300,
      // width: 480,
      flex: 1,
      cellRenderer: TitleRenderer,
    },
    {
      field: "hintsOrMistakes",
      filter: true,
      editable: true,
    },
    {
      field: "rating",
      filter: true,
      cellRenderer: RatingRenderer,
    },
    {
      field: "timeStart",
      headerName: "Start Time",
      filter: true,
      //  Default to sort by most recent first...
      sort: "desc",
    },
    {
      field: "timeFinish",
      headerName: "Finish Time",
      filter: true,
    },
    {
      headerName: "Total Time",
      filter: true,
      valueGetter: ({ data }: { data: PuzzleRowData }) => {
        const d2ms = (d: Date) => d.getTime();
        return data.timeFinish !== null
          ? msToTime(d2ms(data.timeFinish) - d2ms(data.timeStart))
          : "";
      },
    },
    { field: "elapsedTime", filter: true },
    {
      field: "notes",
      filter: true,
      editable: true,
    },
  ]);

  // Disable the implicit any warning for the ag-grid event.
  // eslint-disable-next-line
  const onCellValueChanged = async (event: any) => {
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

    //  Update the puzzle state, save it, broadcast changes.
    const updatedPuzzle = {
      ...puzzleRowData.puzzle,
      [field]: newValue,
    };
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
