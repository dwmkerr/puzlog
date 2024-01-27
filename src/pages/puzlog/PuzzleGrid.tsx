import React, { useState, CSSProperties } from "react";
import { IconButton } from "@mui/joy";
import DeleteIcon from "@mui/icons-material/Delete";
import { AgGridReact } from "ag-grid-react"; // React Grid Logic
import { ColDef, ICellRendererParams } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme
import { Puzzle, PuzzleStatus } from "../../lib/puzzle";
import StatusIcon from "../../components/StatusIcon";
import StarRating from "../../components/StarRating";
import { msToTime } from "../../lib/helpers";
import theme from "../../theme";

type UpdatePuzzleFunc = (puzzle: Puzzle) => Promise<void>;
type DeletePuzzleFunc = (puzzleId: string) => Promise<void>;

interface PuzzleGridProps extends React.HTMLProps<HTMLDivElement> {
  puzzles: Puzzle[];
  quickFilterText: string;
  updatePuzzle: UpdatePuzzleFunc;
  deletePuzzle: DeletePuzzleFunc;
}

interface PuzzleRowData {
  title: string;
  setter: string;
  url: string;
  status: PuzzleStatus;
  hintsOrMistakes: number | null;
  rating: number | null;
  timeStart: Date;
  timeFinish: Date | null;
  elapsedTime: number;
  notes: string;
  puzzle: Puzzle;
}

const PuzzleGrid = ({
  puzzles,
  quickFilterText,
  updatePuzzle,
  deletePuzzle,
  ...props
}: PuzzleGridProps) => {
  //  Turn the puzzles ino a set of row data.
  const rowData = puzzles.map((puzzle) => ({
    id: puzzle?.id,
    title: puzzle?.metadata?.title || puzzle.title,
    series: puzzle?.metadata?.series || "",
    setter: puzzle?.metadata?.setter || "",
    datePublished: puzzle?.metadata?.datePublished || "",
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
          style={{ minWidth: 16 }}
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
  const ActionsRenderer = (props: ICellRendererParams<PuzzleRowData>) => {
    const onDelete = async () => {
      //  props.data will only be undefined for infinite grids etc.
      if (props.data) {
        await deletePuzzle(props.data.puzzle.id);
        props.api.applyTransaction({
          remove: [props.data],
        });
      }
    };
    return (
      <IconButton
        sx={{ "--IconButton-size": "24px" }}
        variant="outlined"
        onClick={onDelete}
      >
        <DeleteIcon />
      </IconButton>
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
      field: "setter",
      width: 140,
      filter: true,
      editable: false,
    },
    {
      field: "series",
      width: 140,
      filter: true,
      editable: false,
    },
    {
      field: "datePublished",
      headerName: "Published",
      width: 140,
      filter: true,
      editable: false,
    },
    {
      field: "elapsedTime",
      headerName: "Time",
      filter: true,
    },
    {
      field: "hintsOrMistakes",
      headerName: "Clues Helped",
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
      hide: true,
    },
    {
      field: "timeFinish",
      headerName: "Finish Time",
      filter: true,
      hide: true,
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
      hide: true,
    },
    {
      field: "notes",
      filter: true,
      editable: true,
    },
    {
      headerName: "",
      cellRenderer: ActionsRenderer,
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

  //  For reference, link this back in with the prop:
  //          onFirstDataRendered={onFirstDataRendered}
  //
  //  Called on first render, can be used to set filters etc.
  // const onFirstDataRendered = async (
  //   params: FirstDataRenderedEvent<PuzzleRowData>
  // ) => {
  //   //  If we have an initial title filter, set it.
  //   if (initialPuzzleTitleFilter) {
  //     params.api.setFilterModel({
  //       title: {
  //         filter: initialPuzzleTitleFilter,
  //         type: "equals",
  //         filterType: "text",
  //       },
  //     });
  //     params.api.onFilterChanged();
  //   }
  // };

  return (
    <div className="ag-theme-quartz" style={{ fontSize: "150%" }} {...props}>
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
        onCellValueChanged={onCellValueChanged}
        quickFilterText={quickFilterText}
      />
    </div>
  );
};

export default PuzzleGrid;
