import React, { useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { Alert, IconButton, LinearProgress, Stack, Typography } from "@mui/joy";

import CloseIcon from "@mui/icons-material/Close";

import { Puzzle } from "../lib/puzzle";
import ToolbarSignIn from "./ToolbarSignIn";
import ToolbarPuzzle from "./ToolbarPuzzle";
import {
  AlertInfo,
  alertTypeToColor,
  alertTypeToIcon,
  useAlertContext,
} from "./AlertContext";
import { PuzzleRepository } from "../lib/PuzzleRepository";

interface AlertToolbarProps {
  alertInfo: AlertInfo;
  onDismiss: () => void;
}

const AlertToolbar = ({ alertInfo, onDismiss }: AlertToolbarProps) => {
  const alertColor = alertTypeToColor(alertInfo.type);
  const alertIcon = alertTypeToIcon(alertInfo.type);

  return (
    <Alert color={alertColor}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ width: "100%" }}
      >
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={1}
        >
          {alertIcon}
          <Typography
            level="title-sm"
            color={alertColor}
            sx={{ fontWeight: "bold" }}
          >
            {alertInfo.title}
          </Typography>
          <Typography level="body-sm" color={alertColor}>
            {alertInfo.message}
          </Typography>
        </Stack>

        <IconButton
          onClick={onDismiss}
          size="sm"
          variant="outlined"
          color={alertColor}
        >
          <CloseIcon />
        </IconButton>
      </Stack>
    </Alert>
  );
};

export interface ExtensionToolbarProps
  extends React.ComponentPropsWithoutRef<"div"> {
  pageTitle: string;
  //  The puzzle is only created once we start the puzzle.
  puzzle: Puzzle | undefined;
}

const ExtensionToolbar = ({
  pageTitle,
  puzzle,
  ...props
}: ExtensionToolbarProps) => {
  const puzzleRepository = PuzzleRepository.get();
  //  Access the alert context so that we can render the alerts.
  const { alertInfo, setAlertInfo } = useAlertContext();

  //  State for the current user, which will initially be loading while we wait
  //  for it.
  const [user, setUser] = useState<User | null>(null);
  const [waitingForUser, setWaitingForUser] = useState(false);

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

  const setToolbarContent = () => {
    //  Alerts are the highest priority...
    if (alertInfo) {
      return (
        <AlertToolbar
          alertInfo={alertInfo}
          onDismiss={() => setAlertInfo(null)}
        />
      );
    }
    //  Followed by the loader...
    if (waitingForUser) {
      return <LinearProgress size="sm" />;
    }
    //  Followed by sign in...
    if (!user) {
      return <ToolbarSignIn />;
    }
    return <ToolbarPuzzle pageTitle={pageTitle} puzzle={puzzle} />;
  };
  const content = setToolbarContent();

  return (
    <div
      style={{
        borderBottom: "grey 1px solid",
        boxShadow: "0 2px 4px -1px rgba(0,0,0,0.8)",
        backgroundColor: "white",
      }}
      {...props}
    >
      {content}
    </div>
  );
};

export default ExtensionToolbar;
