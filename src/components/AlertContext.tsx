import React, {
  PropsWithChildren,
  ReactNode,
  createContext,
  useContext,
  useState,
} from "react";
import { DefaultColorPalette } from "@mui/joy/styles/types";

import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoIcon from "@mui/icons-material/Info";

import { PuzlogError } from "../lib/Errors";

export enum AlertType {
  Info,
  Warning,
  Error,
  Success,
}

export interface AlertInfo {
  type: AlertType;
  title: string;
  message: string;
}

//  Helper functions that many consumers of the provider might use for styling.
export function alertTypeToColor(type: AlertType): DefaultColorPalette {
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
}
export function alertTypeToIcon(type: AlertType): ReactNode {
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
}

interface AlertContextValue {
  alertInfo: AlertInfo | null;
  setAlertInfo: (alert: AlertInfo | null) => void;
  setAlertFromError: (error: PuzlogError) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export const AlertContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [alertInfo, setAlertInfo] = useState<AlertInfo | null>(null);

  const value: AlertContextValue = {
    alertInfo,
    setAlertInfo,
    //  Essentially just a helper to build an alert from a puzlog error.
    setAlertFromError: (error: PuzlogError) =>
      setAlertInfo({
        type: AlertType.Error,
        title: error.title,
        message: error.message,
      }),
  };

  return (
    <AlertContext.Provider value={value}>{children}</AlertContext.Provider>
  );
};

export const useAlertContext = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlertContext must be used within an AlertProvider");
  }
  return context;
};
