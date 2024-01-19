import React, { useState, useEffect } from "react";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import IconButton from "@mui/joy/IconButton";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import * as extensionInterface from "../extensionInterface";
import { msToTime } from "../lib/helpers";
import { PuzzleState, PuzzleStatus } from "../lib/puzzleState";
import StatusIcon from "./StatusIcon";
import { CrosswordMetadata } from "../lib/crossword-metadata";
import { PuzzleRepository } from "../lib/PuzzleRepository";

// const style = `
// a {
//   color: #337ab7;
//   text-decoration: none;
// }
// a:hover {
//   color: #22527b;
//   text-decoration: underline;
//   cursor: "pointer";
// }
// `;

interface ExtensionToolbarProps extends React.ComponentPropsWithoutRef<"div"> {
  puzzleId: string;
  pageTitle: string;
  puzzle: PuzzleState | null;
}

function formatTitle(
  pageTitle: string,
  crosswordMetadata: CrosswordMetadata | null
) {
  if (crosswordMetadata?.title && crosswordMetadata?.setter) {
    return `${crosswordMetadata.title} - ${crosswordMetadata.setter}`;
  } else if (crosswordMetadata?.title) {
    return crosswordMetadata.title;
  } else {
    return pageTitle;
  }
}

const ExtensionToolbar = ({
  puzzleId,
  pageTitle,
  puzzle,
  ...props
}: ExtensionToolbarProps) => {
  const puzzleRepository = new PuzzleRepository();
  const [timerMilliseconds, setTimerMilliseconds] = useState(
    puzzle?.elapsedTime || 0
  );
  const [title, setTitle] = useState(
    formatTitle(pageTitle, puzzle?.metadata || null)
  );
  const [status, setStatus] = useState<PuzzleStatus>(
    puzzle?.status || PuzzleStatus.Unknown
  );

  useEffect(() => {
    const unsubscribe = puzzleRepository.subscribeToChanges(
      puzzleId,
      (changedPuzzle) => {
        setTimerMilliseconds(changedPuzzle.elapsedTime);
        //  TODO: we might not really need to ever update the title, just set it
        //  right from the metadata on puzzle create...
        setTitle(formatTitle(changedPuzzle.title, changedPuzzle.metadata));
        setStatus(changedPuzzle.status);
      }
    );

    //  Return the cleanup function.
    return unsubscribe;
  }, []);
  const finish = async () => {
    await extensionInterface.sendRuntimeMessage("finish", { puzzleId });
  };
  const openPuzlogPage = async () => {
    await extensionInterface.sendRuntimeMessage("OpenPuzlogTab", {
      puzzleId,
    });
  };
  return (
    <div
      style={{
        borderBottom: "grey 1px solid",
        boxShadow: "0 2px 4px -1px rgba(0,0,0,0.8)",
      }}
      {...props}
    >
      {/* <style>{style}</style> */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "40px",
          backgroundColor: "white",
          color: "rgba(4, 30, 73, 0.7)", // nice dark grey
          padding: "0 10px",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div className="timer" style={{ marginRight: "10px" }}>
            {msToTime(timerMilliseconds)}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            alignItems: "center",
            display: "flex",
          }}
        >
          <StatusIcon
            status={status}
            size={16}
            style={{ minWidth: "16px", minHeight: "16px", paddingRight: "8px" }}
          />
          <a onClick={openPuzlogPage}>{title}</a>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            height: "36px",
          }}
        >
          <IconButton
            onClick={openPuzlogPage}
            aria-label="Open Puzlog"
            variant="plain"
            size="sm"
          >
            <HomeOutlined />
          </IconButton>
          <IconButton
            onClick={finish}
            aria-label="Finish Puzzle"
            variant="plain"
          >
            <SportsScoreIcon />
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export default ExtensionToolbar;
