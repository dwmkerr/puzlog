import React, { useState, useEffect } from "react";

import Alert from "@mui/joy/Alert";
import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardActions from "@mui/joy/CardActions";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import WarningIcon from "@mui/icons-material/Warning";
import IconButton from "@mui/joy/IconButton";
import Typography from "@mui/joy/Typography";

import {
  ContentScriptInterface,
  ContentScriptStatus,
  TabPuzzleData,
} from "../../lib/extensionMessages";
import { CrosswordMetadata } from "../../lib/crossword-metadata";
import * as extensionInterface from "../../extensionInterface";

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
  </Alert>
);

export default function MiniPopup() {
  const [contentScriptStatus, setContentScriptStatus] =
    useState<ContentScriptStatus>(ContentScriptStatus.Unknown);
  const [tabPuzzleData, setTabPuzzleData] = useState<TabPuzzleData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [enableStart, setEnableStart] = useState(false);

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
        if (tab.url === undefined || tab.url?.startsWith("chrome://")) {
          return;
        }

        //  Get the status of the content script. If the content script is not
        //  loaded we will not load anything more. In the future, if it is
        //  in the 'Loading' status we could show a spinner or skeleton.
        const contentStatus =
          await ContentScriptInterface.getContentScriptStatus(tabId);
        setContentScriptStatus(contentStatus);
        if (contentStatus !== ContentScriptStatus.Loaded) {
          setTabPuzzleData(null);
          return;
        }

        //  The content script is running so it's safe for us to get the puzzle
        //  data.
        const tabPuzzleData = (await extensionInterface.sendTabMessage(
          "getTabPuzzleStatus",
          tabId,
          null
        )) as TabPuzzleData;
        setTabPuzzleData(tabPuzzleData);
        setEnableStart(true);
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
      extensionInterface.sendTabMessage("startTabPuzzle", tabPuzzleData.tabId, {
        puzzleId: tabPuzzleData.puzzleId,
      });
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
        {enableStart && (
          <Typography level="body-sm">
            Just press the <a onClick={start}>Start</a> button to begin!
          </Typography>
        )}
        {error && <ErrorAlert error={error} />}
        {tabPuzzleData?.crosswordMetadata && (
          <CrosswordDataAlert
            crosswordMetadata={tabPuzzleData.crosswordMetadata}
          />
        )}
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
        <Button variant="outlined" color="neutral">
          View
        </Button>
        <Button
          variant="solid"
          color="primary"
          disabled={!enableStart}
          onClick={start}
        >
          Start
        </Button>
      </CardActions>
    </Card>
  );
}
