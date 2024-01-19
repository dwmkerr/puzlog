import React, { useState, useEffect } from "react";

import Alert from "@mui/joy/Alert";
import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardActions from "@mui/joy/CardActions";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
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
  TabPuzzleData,
} from "../../lib/extensionMessages";
import { CrosswordMetadata } from "../../lib/crossword-metadata";
import * as extensionInterface from "../../extensionInterface";
import { PuzzleStatus } from "../../lib/puzzleState";
import { isExtensionAccessibleTab } from "../../lib/helpers";

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
  const [tabPuzzleData, setTabPuzzleData] = useState<TabPuzzleData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [enableStart, setEnableStart] = useState(false);
  const [enableFinish, setEnableFinish] = useState(false);
  const [enableResume, setEnableResume] = useState(false);

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
          setTabPuzzleData(null);
          return;
        }

        //  The content script is running so it's safe for us to get the puzzle
        //  data.
        const tabPuzzleData = await ContentScriptInterface.getTabPuzzleStatus(
          tabId
        );
        setTabPuzzleData(tabPuzzleData);

        switch (tabPuzzleData.status) {
          case PuzzleStatus.NotStarted:
            setEnableStart(true);
            break;
          case PuzzleStatus.Started:
            setEnableFinish(true);
            break;
          case PuzzleStatus.Finished:
            setEnableResume(true);
            break;
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

  const home = () => {
    extensionInterface.navigateToPuzlogInterface();
  };
  const start = async () => {
    if (tabPuzzleData?.puzzleId) {
      const tabId = await extensionInterface.getCurrentTabId();
      extensionInterface.sendTabMessage("startTabPuzzle", tabId, {
        puzzleId: tabPuzzleData.puzzleId,
      });
    }
  };
  const finish = async () => {
    if (tabPuzzleData?.puzzleId) {
      ServiceWorkerInterface.finishPuzzle(tabPuzzleData?.puzzleId);
    }
  };
  const resume = async () => {
    if (tabPuzzleData?.puzzleId) {
      ServiceWorkerInterface.resumePuzzle(tabPuzzleData?.puzzleId);
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
        {enableStart && (
          <Typography level="body-sm">
            Just press the <Link onClick={start}>Start</Link> button to begin!
          </Typography>
        )}
        {enableStart && tabPuzzleData?.crosswordMetadata && (
          <CrosswordDataAlert
            crosswordMetadata={tabPuzzleData.crosswordMetadata}
          />
        )}
        {enableFinish && (
          <Typography level="body-sm">
            Press <Link onClick={finish}>Finish</Link> to complete the puzzle!
          </Typography>
        )}
        {enableResume && (
          <div>
            <Typography level="body-sm">
              Well done, you've finished this Crossword!
            </Typography>
            <Typography level="body-sm">
              If you finished too soo, hit <Link onClick={resume}>Resume</Link>{" "}
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
        {enableStart && (
          <Button
            variant="solid"
            color="primary"
            disabled={!enableStart}
            startDecorator={<PlayCircleOutline />}
            onClick={start}
          >
            Start
          </Button>
        )}
        {enableFinish && (
          <Button
            variant="solid"
            color="primary"
            disabled={!enableFinish}
            onClick={finish}
          >
            Finish
          </Button>
        )}
        {enableResume && (
          <Button
            variant="solid"
            color="primary"
            disabled={!enableResume}
            onClick={resume}
          >
            Resume
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
