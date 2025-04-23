import React, { createContext, useContext, useState, ReactNode } from "react";
import Toast from "./Toast";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextProps {
  showToast: (toast: ToastMessage) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("success");
  const [duration, setDuration] = useState(3000);

  const showToast = ({ message, type, duration = 3000 }: ToastMessage) => {
    setMessage(message);
    setType(type);
    setDuration(duration);
    setVisible(true);
  };

  const hideToast = () => {
    setVisible(false);
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        visible={visible}
        message={message}
        type={type}
        duration={duration}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextProps => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider");
  }

  return context;
};
