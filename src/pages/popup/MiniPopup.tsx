import React, { useState, useEffect } from "react";

import Alert from "@mui/joy/Alert";
import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardActions from "@mui/joy/CardActions";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LinearProgress from "@mui/joy/LinearProgress";
import Link from "@mui/joy/Link";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import WarningIcon from "@mui/icons-material/Warning";
import PlayCircleOutline from "@mui/icons-material/PlayCircleOutline";
import IconButton from "@mui/joy/IconButton";
import Typography from "@mui/joy/Typography";

import {
  ContentScriptInterface,
  ContentScriptStatus,
  ServiceWorkerInterface,
} from "../../lib/extensionMessages";
import { CrosswordMetadata } from "../../lib/crossword-metadata";
import * as extensionInterface from "../../extensionInterface";
import { PuzzleStatus } from "../../lib/puzzleState";
import { isExtensionAccessibleTab } from "../../lib/helpers";
import { PuzzleRepository } from "../../lib/PuzzleRepository";

const ErrorAlert = ({ error }: { error: Error }) => {
  return (
    <Alert
      startDecorator={<WarningIcon />}
      variant="outlined"
      size="sm"
      color="danger"
    >
      There was an error loading puzzle data: {error.message}
    </Alert>
  );
};

const CrosswordDataAlert = ({
  crosswordMetadata,
}: {
  crosswordMetadata: CrosswordMetadata;
}) => (
  <Alert
    variant="outlined"
    color="primary"
    size="sm"
    startDecorator={<InfoOutlined />}
  >
    Series: {crosswordMetadata?.series}
    <br />
    Title: {crosswordMetadata?.title}
    <br />
    Setter: {crosswordMetadata?.setter}
    <br />
    Published: {crosswordMetadata?.datePublished?.toDateString()}
  </Alert>
);

export default function MiniPopup() {
  const [crosswordMetadata, setCrosswordMetadata] =
    useState<CrosswordMetadata | null>(null);
  const [puzzleId, setPuzzleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [puzzleStatus, setPuzzleStatus] = useState(PuzzleStatus.Unknown);

  useEffect(() => {
    // Define your async function
    const getTabPuzzleStatus = async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const tabId = tab?.id;
        if (!tabId) {
          throw new Error(
            "Cannot find the current tab id - maybe a permissions issue?"
          );
        }
        //  If the curent tab is an internal tab, we'll stop now.
        if (!isExtensionAccessibleTab(tab?.url)) {
          return;
        }

        //  Get the status of the content script. If the content script is not
        //  loaded we will not load anything more. In the future, if it is
        //  in the 'Loading' status we could show a spinner or skeleton.
        const contentStatus =
          await ContentScriptInterface.getContentScriptStatus(tabId);
        if (contentStatus !== ContentScriptStatus.Loaded) {
          return;
        }

        //  The content script is running so it's safe for us to get the puzzle
        //  data.
        const tabPuzzleData = await ContentScriptInterface.getTabPuzzleStatus(
          tabId
        );

        //  If we have a puzzle, set its status and id. From now on the next
        //  useEffect will watch for status changes.
        if (tabPuzzleData) {
          setCrosswordMetadata(tabPuzzleData.crosswordMetadata);
          setPuzzleStatus(tabPuzzleData.status);
          setPuzzleId(tabPuzzleData.puzzleId);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    // Call the async function on component mount
    getTabPuzzleStatus();
  }, []); // Empty dependency array ensures this effect runs only once on mount

  //  If the puzzle id has been set, we can watch the puzzle for changes.
  useEffect(() => {
    //  If we don't have a puzzle id, then no changes to watch for.
    if (puzzleId === null) {
      return;
    }

    //  We have a puzzle id, so we can watch for changes. These could be
    //  triggered by this popup or by the puzzle toolbar (or even other parts of
    //  the app).
    const puzzleRepository = new PuzzleRepository();
    const unsubscribe = puzzleRepository.subscribeToChanges(
      puzzleId,
      (changedPuzzle) => {
        setPuzzleStatus(changedPuzzle.status);
      }
    );

    //  Return the cleanup function.
    return unsubscribe;
  }, [puzzleId]);

  const home = () => {
    extensionInterface.navigateToPuzlogInterface(puzzleId);
  };
  const homeWithPuzzleFocused = () => {
    extensionInterface.navigateToPuzlogInterface(puzzleId);
  };

  const start = async () => {
    const tabId = await extensionInterface.getCurrentTabId();
    await ContentScriptInterface.start(tabId);
  };
  const finish = async () => {
    if (puzzleId) {
      const tabId = await extensionInterface.getCurrentTabId();
      ServiceWorkerInterface.finishPuzzle(tabId, puzzleId);
    }
  };
  const resume = async () => {
    if (puzzleId) {
      const tabId = await extensionInterface.getCurrentTabId();
      ServiceWorkerInterface.resumePuzzle(tabId, puzzleId);
    }
  };

  return (
    <Card
      sx={{
        width: 320,
        /*"--Card-radius": "0px" TODO setting card readius works but changes all the children, find alternative... */
      }}
    >
      <CardContent>
        <Typography level="title-lg">Puzlog</Typography>
        <Typography level="body-sm">
          Puzlog lets you track your progress on online puzzles such as
          crosswords.
        </Typography>
        <IconButton
          aria-label="Puzlog Home"
          variant="plain"
          color="neutral"
          size="sm"
          sx={{ position: "absolute", top: "0.875rem", right: "0.5rem" }}
          onClick={home}
        >
          <HomeOutlined />
        </IconButton>
        {loading && <LinearProgress />}
        {puzzleStatus === PuzzleStatus.NotStarted && (
          <Typography level="body-sm">
            Just press the <Link onClick={start}>Start</Link> button to begin!
          </Typography>
        )}
        {puzzleStatus === PuzzleStatus.NotStarted && crosswordMetadata && (
          <CrosswordDataAlert crosswordMetadata={crosswordMetadata} />
        )}
        {puzzleStatus === PuzzleStatus.Started && (
          <Typography level="body-sm">
            Press <Link onClick={finish}>Finish</Link> to complete the puzzle!
          </Typography>
        )}
        {puzzleStatus === PuzzleStatus.Finished && (
          <div>
            <Typography level="body-sm">
              Well done, you've finished this Crossword!
            </Typography>
            <Typography level="body-sm">
              If you finished too soon, hit <Link onClick={resume}>Resume</Link>{" "}
              to continue your progress.
            </Typography>
          </div>
        )}
        {error && <ErrorAlert error={error} />}
      </CardContent>
      <CardActions buttonFlex="0 1 120px">
        <IconButton
          variant="outlined"
          color="neutral"
          sx={{ mr: "auto" }}
          onClick={home}
        >
          <HomeOutlined />
        </IconButton>
        {puzzleStatus === PuzzleStatus.NotStarted && (
          <Button
            variant="solid"
            color="primary"
            startDecorator={<PlayCircleOutline />}
            onClick={start}
          >
            Start
          </Button>
        )}
        {puzzleStatus === PuzzleStatus.Started && (
          <Button
            variant="solid"
            color="primary"
            startDecorator={<SportsScoreIcon />}
            onClick={finish}
          >
            Finish
          </Button>
        )}
        {puzzleStatus === PuzzleStatus.Finished && (
          <Button
            variant="outlined"
            color="primary"
            startDecorator={<PlayCircleOutline />}
            onClick={resume}
          >
            Resume
          </Button>
        )}
        {puzzleStatus === PuzzleStatus.Finished && (
          <Button
            variant="solid"
            color="primary"
            startDecorator={<CheckCircleOutlineIcon />}
            onClick={homeWithPuzzleFocused}
          >
            Results
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
