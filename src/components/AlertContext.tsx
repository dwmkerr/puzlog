import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useState,
} from "react";
import { AlertInfo } from "./WarningSnackbar";

interface AlertContextValue {
  alert: AlertInfo | null;
  setAlert: (alert: AlertInfo | null) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export const AlertContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [alert, setAlert] = useState<AlertInfo | null>(null);

  const value: AlertContextValue = {
    alert,
    setAlert,
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
