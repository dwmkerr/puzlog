import React, { useState } from "react";
import { Button, Link, Stack, Tooltip, Typography } from "@mui/joy";

import GoogleIcon from "@mui/icons-material/Google";

import { PuzlogError } from "../lib/Errors";
import { PuzzleRepository } from "../lib/PuzzleRepository";
import { useAlertContext } from "./AlertContext";

const ToolbarSignIn = () => {
  const puzzleRepository = new PuzzleRepository();
  //  State for the current user, which will initially be loading while we wait
  //  for it.
  const [loading, setLoading] = useState<boolean>(false);

  //  Use our alert context so that we can set error statuses.
  const { setAlertFromError } = useAlertContext();

  const login = async () => {
    setLoading(true);
    try {
      await puzzleRepository.signInWithGoogle();
    } catch (err) {
      setAlertFromError(PuzlogError.fromError("Sign In Error", err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack
      direction="row"
      justifyContent="center"
      alignItems="center"
      spacing={1}
      sx={(theme) => ({
        height: "40px",
        padding: "0 10px",
        backgroundColor: `${theme.vars.palette.neutral[100]}`,
      })}
    >
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={1}
      >
        <Typography level="title-md">
          <Link onClick={login}>Sign in to track progress for this puzzle</Link>
        </Typography>
        <Tooltip title="Login" variant="soft">
          <Button
            onClick={login}
            variant="outlined"
            loading={loading}
            sx={{
              marginLeft: 1,
            }}
            size="sm"
            startDecorator={<GoogleIcon />}
          >
            Sign In
          </Button>
        </Tooltip>
      </Stack>
    </Stack>
  );
};

export default ToolbarSignIn;
