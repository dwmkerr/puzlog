import React, { useEffect, useState } from "react";
import { IconButton, Snackbar, Stack, Typography } from "@mui/joy";

import CloseIcon from "@mui/icons-material/Close";

import { AlertInfo, alertTypeToColor, alertTypeToIcon } from "./AlertContext";

interface AlertSnackbarProps {
  alertInfo?: AlertInfo;
  onDismiss: () => void;
}

export function AlertSnackbar({ alertInfo, onDismiss }: AlertSnackbarProps) {
  const [open, setOpen] = useState(!!alertInfo);
  useEffect(() => {
    setOpen(!!alertInfo);
  }, [alertInfo]);

  const dismiss = () => {
    setOpen(false);
    onDismiss();
  };

  const color = alertInfo ? alertTypeToColor(alertInfo?.type) : "neutral";
  const icon = alertInfo ? alertTypeToIcon(alertInfo?.type) : null;

  return (
    <Snackbar
      size="sm"
      variant="outlined"
      color={color}
      open={open}
      onClose={dismiss}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      startDecorator={icon}
      endDecorator={
        <IconButton onClick={dismiss} size="sm" variant="plain" color={color}>
          <CloseIcon />
        </IconButton>
      }
    >
      <Stack direction="column">
        <Typography title="body-xs" color={color} fontWeight="lg">
          {alertInfo?.title}
        </Typography>
        <Typography level="body-xs" color={color}>
          {alertInfo?.message}
        </Typography>
      </Stack>
    </Snackbar>
  );
}
