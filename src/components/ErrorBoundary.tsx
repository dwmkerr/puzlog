import React, { Component, ReactNode, ErrorInfo } from "react";
import { IconButton, Snackbar, Stack, Typography } from "@mui/joy";

import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CloseIcon from "@mui/icons-material/Close";
import { PuzlogError } from "../lib/Errors";

interface Props {
  children?: ReactNode;
}

interface State {
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { error };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("puzlog: rendering", error, info.componentStack);
  }

  public render() {
    const { error } = this.state;
    const dismiss = () => {
      this.setState({ error: undefined });
    };

    if (error) {
      const puzlogError = error as PuzlogError;
      return (
        <Snackbar
          size="sm"
          variant="outlined"
          color="danger"
          open={true}
          onClose={dismiss}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          startDecorator={<ErrorOutlineIcon />}
          endDecorator={
            <IconButton
              onClick={dismiss}
              size="sm"
              variant="plain"
              color="danger"
            >
              <CloseIcon />
            </IconButton>
          }
        >
          <Stack direction="column">
            <Typography title="title-sm" color="danger" fontWeight="lg">
              {puzlogError?.title || "Internal Error"}
            </Typography>
            <Typography level="body-sm" color="danger">
              {error.message}
            </Typography>
          </Stack>
        </Snackbar>
      );
    }

    return this.props.children;
  }
}
