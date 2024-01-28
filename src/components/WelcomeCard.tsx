import React, { useEffect, useState } from "react";

import Alert from "@mui/joy/Alert";
import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardActions from "@mui/joy/CardActions";
import Typography from "@mui/joy/Typography";
import { ButtonGroup, CardOverflow, IconButton, Stack } from "@mui/joy";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import WarningIcon from "@mui/icons-material/Warning";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import GoogleIcon from "@mui/icons-material/Google";

import { PuzzleRepository } from "../lib/PuzzleRepository";
import { PuzlogError } from "../lib/Errors";
import * as extensionInterface from "../extensionInterface";

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

export default function MiniPopupWelcome() {
  const puzzleRepository = new PuzzleRepository();

  const [error, setError] = useState<PuzlogError | undefined>(undefined);
  const [loadingGuestSignIn, setLoadingGuestSignIn] = useState(false);
  const [loadingGoogleSignIn, setLoadingGoogleSignIn] = useState(false);
  const [busy, setBusy] = useState(false);

  //  If either sign in methods are loading, we are busy and will disable the
  //  buttons.
  useEffect(() => {
    setBusy(loadingGuestSignIn || loadingGoogleSignIn);
  }, [loadingGuestSignIn, loadingGoogleSignIn]);

  const home = () => {
    extensionInterface.navigateToPuzlogInterface(null);
  };

  const loginAsGuest = async () => {
    try {
      setLoadingGuestSignIn(true);
      await puzzleRepository.signInAnonymously();
      setLoadingGuestSignIn(false);
    } catch (err) {
      setError(PuzlogError.fromError("Sign In Error", err));
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoadingGoogleSignIn(true);
      await puzzleRepository.signInWithGoogle();
      setLoadingGoogleSignIn(false);
    } catch (err) {
      setError(PuzlogError.fromError("Sign In Error", err));
    }
  };

  return (
    <Card
      sx={{
        width: 380,
        /*"--Card-radius": "0px" TODO setting card readius works but changes all the children, find alternative... */
      }}
    >
      <CardContent>
        <Typography level="title-lg">Welcome to Puzlog!</Typography>
        <Typography level="body-sm">
          Log in with Google to create an account and track your progress, or
          continue as a Guest if you would prefer to do this later.
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
        {error && <ErrorAlert error={error} />}
      </CardContent>
      <CardOverflow sx={{ bgcolor: "background.level1" }}>
        <CardActions buttonFlex="1">
          <ButtonGroup
            variant="outlined"
            sx={{ bgcolor: "background.surface" }}
          >
            <Button
              startDecorator={<AccountCircleIcon />}
              onClick={loginAsGuest}
              loading={loadingGuestSignIn}
              loadingPosition="start"
              disabled={busy}
            >
              Guest Sign In
            </Button>
            <Button
              startDecorator={<GoogleIcon />}
              onClick={loginWithGoogle}
              loading={loadingGoogleSignIn}
              loadingPosition="start"
              disabled={busy}
            >
              Google Sign In
            </Button>
          </ButtonGroup>
        </CardActions>
      </CardOverflow>
    </Card>
  );
}
