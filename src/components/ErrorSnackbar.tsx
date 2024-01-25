import React, { useEffect, useState } from "react";
import { IconButton, Snackbar, Stack, Typography } from "@mui/joy";

import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CloseIcon from "@mui/icons-material/Close";

export interface ErrorInfo {
  title: string;
  message: string;
}

export interface ErrorSnackbarProps {
  error?: ErrorInfo;
  onDismiss: () => void;
}

export default function ErrorSnackbar(props: ErrorSnackbarProps) {
  const { error, onDismiss } = props;
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(!!error);
  }, [error]);

  const dismiss = () => {
    setOpen(false);
    onDismiss();
  };

  return (
    <Snackbar
      size="sm"
      variant="outlined"
      color="danger"
      open={open}
      onClose={dismiss}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      startDecorator={<ErrorOutlineIcon />}
      endDecorator={
        <IconButton onClick={dismiss} size="sm" variant="plain" color="danger">
          <CloseIcon />
        </IconButton>
      }
    >
      <Stack direction="column">
        <Typography title="title-sm" color="danger" fontWeight="lg">
          {error?.title}
        </Typography>
        <Typography level="body-sm" color="danger">
          {error?.message}
        </Typography>
      </Stack>
    </Snackbar>
  );
}
