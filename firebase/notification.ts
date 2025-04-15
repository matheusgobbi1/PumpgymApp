import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { db } from "./config";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Configuração das notificações para mostrar quando o app está em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Função para registrar o dispositivo para notificações push
export async function registerForPushNotificationsAsync() {
  let token;

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

    // Obter o token de push do Expo
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID,
      })
    ).data;
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
