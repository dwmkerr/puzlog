import React, { useState, useEffect } from "react";
import { FaFlagCheckered, FaPlay, FaExternalLinkAlt } from "react-icons/fa";
import * as extensionInterface from "../extensionInterface";
// import { StateUpdatedCommand } from "../lib/extensionMessages";
import { msToTime } from "../helpers";
import IconButton from "./IconButton";
import { PuzzleStatus } from "../lib/puzzleState";
import StatusIcon from "./StatusIcon";
import { CrosswordMetadata } from "../lib/crossword-metadata";

const style = `
a {
  color: #337ab7;
  text-decoration: none;
}
a:hover {
  color: #22527b;
  text-decoration: underline;
  cursor: "pointer";
}
`;

interface ExtensionToolbarProps {
  puzzleId: string;
  initialElapsedTime: number;
  initialTitle: string;
  initialStatus: PuzzleStatus;
}

function formatTitle(pageTitle: string, crosswordMetadata: CrosswordMetadata) {
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
  initialElapsedTime,
  initialTitle,
  initialStatus,
}: ExtensionToolbarProps) => {
  const [timerMilliseconds, setTimerMilliseconds] =
    useState(initialElapsedTime);
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    chrome.runtime.onMessage.addListener((request) => {
      if (
        request.command === "stateUpdated" &&
        request?.puzzleState?.puzzleId === puzzleId
      ) {
        setTimerMilliseconds(request.puzzleState.elapsedTime);
        setTitle(
          formatTitle(request.puzzleState.title, request.puzzleState.metadata)
        );
        setStatus(request.puzzleState.status);
      }
    });

    // extensionInterface.onMessage(
    //   "stateUpdated",
    //   async (tabId: number | null, message: StateUpdatedCommand) => {
    //     //  Bail if it is not our puzzle...
    //     if (message.puzzleState.puzzleId !== puzzleId) {
    //       return;
    //     }
    //     setTimerMilliseconds(message.puzzleState.elapsedTime);
    //   }
    // );
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
    >
      <style>{style}</style>
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
          }}
        >
          <IconButton title="Open Puzlog">
            <FaExternalLinkAlt onClick={openPuzlogPage} />
          </IconButton>
          <IconButton title="Start Puzzle Timer">
            <FaPlay />
          </IconButton>
          <IconButton onClick={finish} title="Finish Puzzle">
            <FaFlagCheckered />
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export default ExtensionToolbar;
