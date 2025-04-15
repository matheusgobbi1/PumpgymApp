import React, { createContext, useContext, useCallback, useRef } from "react";
import * as Notifications from "expo-notifications";
import {
  registerForPushNotificationsAsync,
  saveTokenToDatabase,
  setupNotificationListeners,
} from "../firebase/notification";

// Definindo o tipo para o contexto
type NotificationContextType = {
  registerForPushNotifications: () => Promise<string | null>;
  sendLocalNotification: (
    title: string,
    body: string,
    data?: Record<string, unknown>
  ) => Promise<void>;
  schedulePushNotification: (
    title: string,
    body: string,
    trigger: any,
    data?: Record<string, unknown>
  ) => Promise<string>;
};

// Criando o contexto
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// Hook personalizado para acessar o contexto
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification deve ser usado dentro de um NotificationProvider"
    );
  }
  return context;
};

// Provedor de contexto
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Referência às notificações para evitar re-renders desnecessários
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  // Registrar o dispositivo para notificações e salvar o token no banco de dados
  const registerForPushNotifications = useCallback(async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await saveTokenToDatabase(token);
        return token;
      }
      return null;
    } catch (error) {
      console.error("Erro ao registrar para notificações push:", error);
      return null;
    }
  }, []);

  // Enviar uma notificação local instantânea
  const sendLocalNotification = useCallback(
    async (title: string, body: string, data = {}) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Mostra imediatamente
      });
    },
    []
  );

  // Agendar uma notificação local para ser mostrada no futuro
  const schedulePushNotification = useCallback(
    async (title: string, body: string, trigger: any, data = {}) => {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger,
      });
      return identifier;
    },
    []
  );

  // Configurar os ouvintes de notificação quando o componente for montado
  React.useEffect(() => {
    // Limpeza de funções para remover os ouvintes quando o componente for desmontado
    const cleanupListeners = setupNotificationListeners(
      (notification: Notifications.Notification) => {
        // Manipulador de notificações recebidas com o app em primeiro plano
        console.log("Notificação recebida:", notification);
      },
      (response: Notifications.NotificationResponse) => {
        // Manipulador de respostas à notificação (toque na notificação)
        console.log("Resposta à notificação:", response);
        // Aqui você pode adicionar lógica para lidar com ações quando uma notificação é tocada
      }
    );

    // Registrar para notificações push ao iniciar
    registerForPushNotifications().catch(console.error);

    // Limpar ouvintes quando o componente for desmontado
    return () => {
      cleanupListeners();
    };
  }, [registerForPushNotifications]);

  // Valores que serão disponibilizados pelo contexto
  const value = {
    registerForPushNotifications,
    sendLocalNotification,
    schedulePushNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
