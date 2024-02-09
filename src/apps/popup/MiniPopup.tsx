import React, { useState, useEffect } from "react";

import Alert from "@mui/joy/Alert";
import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardActions from "@mui/joy/CardActions";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LinearProgress from "@mui/joy/LinearProgress";
import Link from "@mui/joy/Link";
import IconButton from "@mui/joy/IconButton";
import Typography from "@mui/joy/Typography";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningIcon from "@mui/icons-material/Warning";
import PlayCircleOutline from "@mui/icons-material/PlayCircleOutline";

import {
  ContentScriptInterface,
  ContentScriptStatus,
  ServiceWorkerInterface,
} from "../../lib/extensionMessages";
import * as extensionInterface from "../../extensionInterface";
import { PuzzleStatus } from "../../lib/puzzle";
import { isExtensionAccessibleTab } from "../../lib/helpers";
import { PuzzleRepository } from "../../lib/PuzzleRepository";
import { PuzlogError } from "../../lib/Errors";
import { Stack } from "@mui/joy";
import { User, onAuthStateChanged } from "firebase/auth";
import MiniPopupWelcome from "../../components/WelcomeCard";
import { AlertType, useAlertContext } from "../../components/AlertContext";
import { AlertSnackbar } from "../../components/AlertSnackbar";
import { CrosswordMetadata } from "../../lib/crossword-metadata/CrosswordMetadataProvider";

const ErrorAlert = ({ error }: { error: PuzlogError }) => {
  return (
    <Alert
      startDecorator={<WarningIcon />}
      variant="outlined"
      size="sm"
      color="danger"
    >
      <Stack direction="column">
        <Typography title="body-xs" color="danger" fontWeight="lg">
          {error?.title}
        </Typography>
        <Typography level="body-xs" color="danger">
          {error?.message}
        </Typography>
      </Stack>
    </Alert>
  );
};

const CrosswordDataAlert = ({
  crosswordMetadata,
}: {
  crosswordMetadata: Partial<CrosswordMetadata>;
}) => (
  <Alert
    variant="outlined"
    color="primary"
    size="sm"
    startDecorator={<InfoOutlinedIcon />}
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
  const puzzleRepository = PuzzleRepository.get();

  //  State for the current user, which will initially be loading while we wait
  //  for it.
  const [user, setUser] = useState<User | null>(null);
  const [waitingForUser, setWaitingForUser] = useState(true);

  const [crosswordMetadata, setCrosswordMetadata] = useState<
    Partial<CrosswordMetadata>
  >({});
  const [puzzleId, setPuzzleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PuzlogError | undefined>(undefined);
  const [puzzleStatus, setPuzzleStatus] = useState(PuzzleStatus.Unknown);

  //  Access the alert context so that we can render the alerts.
  const { alertInfo, setAlertInfo } = useAlertContext();

  //  On mount, wait for the current user (if any). This waits for firebase
  //  to load based on any cached credentials.
  useEffect(() => {
    const waitForUser = async () => {
      const user = await puzzleRepository.waitForUser();
      setUser(user);
      setWaitingForUser(false);
    };
    waitForUser();
  });

  //  Track the user state.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      puzzleRepository.getAuth(),
      (user) => {
        setUser(user || null);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
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
          setCrosswordMetadata(tabPuzzleData.crosswordMetadata || {});
          setPuzzleStatus(tabPuzzleData.status);
          setPuzzleId(tabPuzzleData.puzzleId);
        }
        // eslint-disable-next-line
      } catch (err: any) {
        setError(new PuzlogError("Cannot Load Puzzles", err?.message, err));
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
    try {
      const tabId = await extensionInterface.getCurrentTabId();
      await ContentScriptInterface.start(tabId);
    } catch (err) {
      const error = PuzlogError.fromError("Start Error", err);
      setAlertInfo({
        type: AlertType.Error,
        title: error.title,
        message: error.message,
      });
    }
  };
  const finish = async () => {
    if (puzzleId) {
      ServiceWorkerInterface.finishPuzzle(puzzleId);
    }
  };
  const resume = async () => {
    if (puzzleId) {
      ServiceWorkerInterface.resumePuzzle(puzzleId);
    }
  };

  //  If we are waiting for the user show a loader.
  if (waitingForUser) {
    return (
      <Card
        sx={{
          width: 380,
          /*"--Card-radius": "0px" TODO setting card readius works but changes all the children, find alternative... */
        }}
      >
        <CardContent>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  //  If the user is not logged in, show the Welcome card.
  if (!waitingForUser && !user) {
    return <MiniPopupWelcome />;
  }

  return (
    <Card
      sx={{
        width: 380,
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
          <HomeOutlinedIcon />
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
          <HomeOutlinedIcon />
        </IconButton>
        {puzzleStatus === PuzzleStatus.NotStarted && (
          <Button
            variant="solid"
            color="primary"
            startDecorator={<PlayCircleOutline />}
            onClick={start}
            disabled={user === undefined /* can only start when logged in */}
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
      {alertInfo && (
        <AlertSnackbar
          alertInfo={alertInfo}
          onDismiss={() => setAlertInfo(null)}
        />
      )}
    </Card>
  );
}
