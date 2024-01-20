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
import { ServiceWorkerInterface } from "../lib/extensionMessages";
import { Link, Typography } from "@mui/joy";

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

  //  Handle changes to the puzzle which come from external sources (most
  //  commonly, the popup page) so that the puzzle state is updated.
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

  //  Update the service worker when our status changes - so that it can update
  //  the action icon for the page.
  useEffect(() => {
    ServiceWorkerInterface.updatePuzzleStatusIcon(status);
  }, [status]);

  const finish = async () => {
    await extensionInterface.sendRuntimeMessage("finish", {
      tabId: null, // the runtime will provide this as we come from a tab page.
      puzzleId,
    });
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
            <Typography level="title-md">
              {msToTime(timerMilliseconds)}
            </Typography>
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
            size={24}
            style={{ minWidth: "24px", minHeight: "24px", paddingRight: "8px" }}
          />
          <Typography level="title-md">
            <Link onClick={openPuzlogPage}>{title}</Link>
          </Typography>
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
