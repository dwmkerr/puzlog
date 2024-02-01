import React, { useState, useEffect } from "react";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import IconButton from "@mui/joy/IconButton";
import { Link, Stack, Tooltip, Typography } from "@mui/joy";
import { Theme, useTheme } from "@mui/joy/styles";

import PlayCircleOutline from "@mui/icons-material/PlayCircleOutline";
import SportsScoreIcon from "@mui/icons-material/SportsScore";

import * as extensionInterface from "../extensionInterface";
import { msToTime } from "../lib/helpers";
import { Puzzle, PuzzleStatus } from "../lib/puzzle";
import { PuzzleRepository } from "../lib/PuzzleRepository";
import { ServiceWorkerInterface } from "../lib/extensionMessages";
import { CrosswordMetadata } from "../lib/crossword-metadata/CrosswordMetadataProvider";
import { PuzlogError } from "../lib/Errors";
import StatusIcon from "./StatusIcon";

export interface ToolbarPuzzleProps
  extends React.ComponentPropsWithoutRef<"div"> {
  pageTitle: string;
  //  The puzzle is only created once we start the puzzle.
  puzzle: Puzzle | undefined;
}

function formatTitle(
  pageTitle: string,
  crosswordMetadata: Partial<CrosswordMetadata>
) {
  if (crosswordMetadata?.title && crosswordMetadata?.setter) {
    return `${crosswordMetadata.title} - ${crosswordMetadata.setter}`;
  } else if (crosswordMetadata?.title) {
    return crosswordMetadata.title;
  } else {
    return pageTitle;
  }
}

function puzzleStatusToBackgroundColor(
  puzzleStatus: PuzzleStatus | undefined,
  theme: Theme
) {
  const status =
    puzzleStatus !== undefined ? puzzleStatus : PuzzleStatus.Unknown;
  switch (status) {
    case PuzzleStatus.NotStarted:
      return "white";
    case PuzzleStatus.Started:
      return `rgba(${theme.vars.palette.primary.mainChannel} / 0.1)`;
    case PuzzleStatus.Finished:
      return `rgba(${theme.vars.palette.success.mainChannel} / 0.1)`;
    case PuzzleStatus.Unknown:
      return `rgba(${theme.vars.palette.neutral.mainChannel} / 0.1)`;
  }
}

const ToolbarPuzzle = ({ pageTitle, puzzle, ...props }: ToolbarPuzzleProps) => {
  const theme = useTheme();
  const puzzleRepository = new PuzzleRepository();
  const [timerMilliseconds, setTimerMilliseconds] = useState(
    puzzle?.elapsedTime || 0
  );
  const [title, setTitle] = useState(
    formatTitle(pageTitle, puzzle?.metadata || {})
  );
  const [status, setStatus] = useState<PuzzleStatus>(
    puzzle?.status || PuzzleStatus.NotStarted // no puzzle = not started
  );
  const [backgroundColor, setBackgroundColor] = useState(
    puzzleStatusToBackgroundColor(puzzle?.status, theme)
  );

  //  Handle changes to the puzzle which come from external sources (most
  //  commonly, the popup page) so that the puzzle state is updated.
  useEffect(() => {
    //  We can only watch for changes to the puzzle if we have an id, i.e. if
    //  it has been started.
    if (!puzzle) {
      return () => undefined;
    }

    const unsubscribe = puzzleRepository.subscribeToChanges(
      puzzle.id,
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
  }, [puzzle]);

  //  Update the service worker when our status changes - so that it can update
  //  the action icon for the page. We also update our current color.
  //  TODO: we can probably retire 'status' and just watch the puzzle as above
  useEffect(() => {
    ServiceWorkerInterface.updatePuzzleStatusIcon(status);
    setBackgroundColor(puzzleStatusToBackgroundColor(status, theme));
  }, [status]);

  //  On mount, wait for the current user (if any). This waits for firebase
  //  to load based on any cached credentials.
  useEffect(() => {
    // const waitForUser = async () => {
    //   const user = await puzzleRepository.waitForUser();
    //   setUser(user);
    //   setWaitingForUser(false);
    // };
    // waitForUser();
  });

  //  Track the user state.
  useEffect(() => {
    // const unsubscribe = onAuthStateChanged(
    //   puzzleRepository.getAuth(),
    //   (user) => {
    //     setUser(user || null);
    //   }
    // );
    // return () => unsubscribe();
  }, []);

  const start = async () => {
    try {
      await ServiceWorkerInterface.start();
    } catch (err) {
      throw PuzlogError.fromError("Start Error", err);
    }
  };

  const resume = async () => {
    if (!puzzle) {
      throw new PuzlogError(
        "Resume Error",
        "Cannot resume a puzzle that has not been created"
      );
    }
    try {
      ServiceWorkerInterface.resumePuzzle(puzzle.id);
    } catch (err) {
      throw PuzlogError.fromError("Resume Error", err);
    }
  };

  const finish = async () => {
    if (!puzzle) {
      throw new PuzlogError(
        "Finish Error",
        "Cannot finish a puzzle that has not been created"
      );
    }
    try {
      ServiceWorkerInterface.finishPuzzle(puzzle.id);
    } catch (err) {
      throw PuzlogError.fromError("Finish Error", err);
    }
  };
  const openPuzlogPage = async () => {
    await extensionInterface.sendRuntimeMessage("OpenPuzlogTab", {
      puzzleId: puzzle?.id || "",
    });
  };

  return (
    <div
      style={{
        borderBottom: "grey 1px solid",
        boxShadow: "0 2px 4px -1px rgba(0,0,0,0.8)",
        backgroundColor: "white",
      }}
      {...props}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
        sx={{
          height: "40px",
          padding: "0 10px",
          backgroundColor: backgroundColor,
        }}
      >
        {/* Left toolbar: the timer. */}
        <div className="timer" style={{ marginRight: "10px" }}>
          <Typography level="title-md" sx={{ color: "rgba(4, 30, 73, 0.7)" }}>
            {msToTime(timerMilliseconds)}
          </Typography>
        </div>

        {/* Middle toolbar: the title and status. */}
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={1}
        >
          <StatusIcon status={status} size={18} />
          <Typography level="title-md">
            <Link onClick={openPuzlogPage}>{title}</Link>
          </Typography>
        </Stack>

        {/* Right toolbar: the menu buttons. */}
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={1}
          sx={{
            minHeight: "36px",
          }}
        >
          {status === PuzzleStatus.NotStarted && (
            <Tooltip title="Start Puzzle" variant="soft">
              <IconButton
                onClick={start}
                variant="outlined"
                size="sm"
                sx={{
                  marginLeft: 1,
                  borderRadius: "50%",
                }}
              >
                <PlayCircleOutline />
              </IconButton>
            </Tooltip>
          )}
          {status === PuzzleStatus.Finished && (
            <Tooltip title="Resume Puzzle" variant="soft">
              <IconButton
                onClick={resume}
                variant="outlined"
                size="sm"
                sx={{
                  marginLeft: 1,
                  borderRadius: "50%",
                }}
              >
                <PlayCircleOutline />
              </IconButton>
            </Tooltip>
          )}
          {status === PuzzleStatus.Started && (
            <Tooltip title="Finish Puzzle" variant="soft">
              <IconButton
                onClick={finish}
                variant="outlined"
                size="sm"
                sx={{
                  marginLeft: 1,
                  borderRadius: "50%",
                }}
              >
                <SportsScoreIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Puzlog Home" variant="soft">
            <IconButton
              onClick={openPuzlogPage}
              variant="outlined"
              sx={{
                marginLeft: 1,
                borderRadius: "50%",
              }}
              size="sm"
            >
              <HomeOutlined />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </div>
  );
};

export default ToolbarPuzzle;
