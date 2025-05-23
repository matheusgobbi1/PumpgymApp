import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
} from "react";
import * as Notifications from "expo-notifications";
import {
  registerForPushNotificationsAsync,
  saveTokenToDatabase,
  setupNotificationListeners,
} from "../firebase/notification";
import NetInfo from "@react-native-community/netinfo";

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
  isRegistering: boolean;
  registrationError: string | null;
  retryRegistration: () => Promise<void>;
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
  // Estado para controlar o status do registro
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null
  );

  // Referência às notificações para evitar re-renders desnecessários
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  // Registrar o dispositivo para notificações e salvar o token no banco de dados
  const registerForPushNotifications = useCallback(async () => {
    try {
      setIsRegistering(true);
      setRegistrationError(null);

      // Verificar conexão com a internet primeiro
      const netInfoState = await NetInfo.fetch();
      if (!netInfoState.isConnected || !netInfoState.isInternetReachable) {
        setRegistrationError(
          "Sem conexão com a internet. Verifique sua conexão e tente novamente."
        );
        return null;
      }

      const token = await registerForPushNotificationsAsync();
      if (token) {
        await saveTokenToDatabase(token);
        return token;
      }
      return null;
    } catch (error: any) {
      console.error("Erro ao registrar para notificações push:", error);
      setRegistrationError(
        `Erro ao registrar para notificações: ${
          error.message || "Erro desconhecido"
        }`
      );
      return null;
    } finally {
      setIsRegistering(false);
    }
  }, []);

  // Função para permitir que o usuário tente novamente o registro
  const retryRegistration = useCallback(async () => {
    return registerForPushNotifications();
  }, [registerForPushNotifications]);

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
 
      },
      (response: Notifications.NotificationResponse) => {
   
      }
    );

    // Registrar para notificações push ao iniciar
    registerForPushNotifications().catch((error) => {
      console.error("Falha ao registrar notificações:", error);
      // Já tratamos o erro na função, então não precisamos fazer nada aqui
    });

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
    isRegistering,
    registrationError,
    retryRegistration,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
