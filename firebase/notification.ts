import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { db } from "./config";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Constants from "expo-constants";

// Configuração das notificações para mostrar quando o app está em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Função auxiliar para aguardar um determinado período
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Função para registrar o dispositivo para notificações push com retry
export async function registerForPushNotificationsAsync() {
  let token;
  let retryCount = 0;
  const maxRetries = 3; // Número máximo de tentativas
  const initialDelay = 2000; // Tempo inicial em ms antes de tentar novamente

  if (Device.isDevice) {
    // Verificar permissões existentes
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Se não temos permissão, solicitar ao usuário
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Se o usuário não concedeu permissão, retornar null
    if (finalStatus !== "granted") {
      console.log("Permissão para notificações não concedida!");
      return null;
    }

    // Obter o projectId do app.json ou .env
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      process.env.EXPO_PUBLIC_PROJECT_ID ||
      process.env.EXPO_PUBLIC_EXPO_PROJECT_ID;

    if (!projectId) {
      console.warn(
        "Nenhum projectId encontrado para notificações push. Verifique suas configurações."
      );
    }

    // Tenta obter o token com retry
    while (retryCount < maxRetries) {
      try {
        console.log(
          `Tentativa ${retryCount + 1} de obter token de notificações push...`
        );

        // Timeout mais longo para a solicitação
        const tokenResponse = await Promise.race([
          Notifications.getExpoPushTokenAsync({
            projectId,
          }),
          // Cancela se demorar mais de 15 segundos
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Timeout ao obter token de notificações")),
              15000
            )
          ),
        ]);

        // Se chegou aqui, obteve o token com sucesso
        token = (tokenResponse as any).data;
        console.log("Token de notificação obtido com sucesso:", token);
        break;
      } catch (error) {
        retryCount++;
        console.warn(
          `Erro ao obter token (tentativa ${retryCount}/${maxRetries}):`,
          error
        );

        if (retryCount < maxRetries) {
          // Espera um tempo antes de tentar novamente (com backoff exponencial)
          const delay = initialDelay * Math.pow(2, retryCount - 1);
          console.log(`Tentando novamente em ${delay / 1000} segundos...`);
          await sleep(delay);
        } else {
          console.error("Todas as tentativas de obter token falharam");
        }
      }
    }
  } else {
    console.log("É necessário um dispositivo físico para notificações push");
  }

  // Configurações específicas para Android
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

// Função para salvar o token no Firestore associado ao usuário
export async function saveTokenToDatabase(
  token: string | undefined
): Promise<boolean> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const userRef = doc(db, "users", user.uid);

      // Verificar se o documento do usuário existe
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        // Atualizar o documento existente com o token
        await setDoc(userRef, { expoPushToken: token }, { merge: true });
      } else {
        // Criar um novo documento para o usuário
        await setDoc(userRef, {
          expoPushToken: token,
          email: user.email,
          createdAt: new Date(),
        });
      }

      console.log("Token de notificação salvo com sucesso!");
      return true;
    } else {
      console.log("Usuário não está autenticado");
      return false;
    }
  } catch (error) {
    console.error("Erro ao salvar token:", error);
    return false;
  }
}

// Função para configurar e gerenciar ouvintes de notificação
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (
    response: Notifications.NotificationResponse
  ) => void
) {
  // Ouvinte para notificações recebidas com o app em primeiro plano
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    onNotificationReceived ||
      ((notification) => {
        console.log("Notificação recebida:", notification);
      })
  );

  // Ouvinte para resposta à notificação (quando o usuário toca na notificação)
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener(
      onNotificationResponse ||
        ((response) => {
          console.log("Resposta à notificação:", response);
        })
    );

  // Retorna as funções de cancelamento da inscrição para limpeza
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
