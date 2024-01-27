import React, { useEffect, useState } from "react";
import { IconButton, Snackbar, Stack, Typography } from "@mui/joy";
import { WarningError } from "../lib/Errors";

import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CloseIcon from "@mui/icons-material/Close";

export interface WarningSnackbarProps {
  warning?: WarningError;
  onDismiss: () => void;
}

export default function WarningSnackbar(props: WarningSnackbarProps) {
  const { warning, onDismiss } = props;
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(!!warning);
  }, [warning]);

  const dismiss = () => {
    setOpen(false);
    onDismiss();
  };

  return (
    <Snackbar
      size="sm"
      variant="outlined"
      color="warning"
      open={open}
      onClose={dismiss}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      startDecorator={<WarningAmberIcon />}
      endDecorator={
        <IconButton onClick={dismiss} size="sm" variant="plain" color="warning">
          <CloseIcon />
        </IconButton>
      }
    >
      <Stack direction="column">
        <Typography title="title-sm" color="warning" fontWeight="lg">
          {warning?.title}
        </Typography>
        <Typography level="body-sm" color="warning">
          {warning?.message}
        </Typography>
      </Stack>
    </Snackbar>
  );
}
