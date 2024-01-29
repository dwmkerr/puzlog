import React, { useEffect, useState } from "react";
import { IconButton, Snackbar, Stack, Typography } from "@mui/joy";
import { DefaultColorPalette } from "@mui/joy/styles/types";

import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoIcon from "@mui/icons-material/Info";

import { AlertInfo, AlertType } from "./AlertContext";

interface AlertSnackbarProps {
  alertInfo?: AlertInfo;
  onDismiss: () => void;
}

const alertTypeToColor = (type: AlertType): DefaultColorPalette => {
  switch (type) {
    case AlertType.Info:
      return "neutral";
    case AlertType.Warning:
      return "warning";
    case AlertType.Error:
      return "danger";
    case AlertType.Success:
      return "success";
    default:
      return "neutral";
  }
};

const alertTypeToIcon = (type: AlertType) => {
  switch (type) {
    case AlertType.Info:
      return <InfoIcon />;
    case AlertType.Warning:
      return <WarningAmberIcon />;
    case AlertType.Error:
      return <ErrorOutlineIcon />;
    case AlertType.Success:
      return <CheckCircleOutlineIcon />;
    default:
      return <HelpOutlineIcon />;
  }
};

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
