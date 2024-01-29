import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useState,
} from "react";

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

interface AlertContextValue {
  alertInfo: AlertInfo | null;
  setAlertInfo: (alert: AlertInfo | null) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export const AlertContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [alertInfo, setAlertInfo] = useState<AlertInfo | null>(null);

  const value: AlertContextValue = {
    alertInfo,
    setAlertInfo,
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
