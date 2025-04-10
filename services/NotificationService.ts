import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Reminder } from "../context/ReminderContext";

// Configurar como as notificações serão exibidas quando o app estiver em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Constantes para identificadores de ação
const ACTION_COMPLETE = "COMPLETE";
const ACTION_SNOOZE = "SNOOZE";
const ACTION_DISMISS = "DISMISS";
const REMINDER_CATEGORY = "reminder";

class NotificationService {
  // Armazenar os IDs de notificação por lembrete
  private notificationMappingKey = "@reminder_notification_mapping";

  constructor() {
    this.setupNotificationCategories();
  }

  // Configurar categorias de notificação com botões de ação
  private async setupNotificationCategories() {
    try {
      // Definir categoria para lembretes com botões de ação
      await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY, [
        {
          identifier: ACTION_COMPLETE,
          buttonTitle: "Completar",
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: ACTION_SNOOZE,
          buttonTitle: "Adiar (10min)",
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: ACTION_DISMISS,
          buttonTitle: "Dispensar",
          options: {
            isDestructive: true,
            isAuthenticationRequired: false,
          },
        },
      ]);
    } catch (error) {
      console.error("Erro ao configurar categorias de notificação:", error);
    }
  }

  // Lidar com ações das notificações (completar, adiar, etc.)
  public async handleNotificationAction(
    response: Notifications.NotificationResponse
  ) {
    try {
      const { actionIdentifier, notification } = response;
      const data = notification.request.content.data as { reminderId?: string };

      if (!data || !data.reminderId) return;

      const reminderId = data.reminderId;

      switch (actionIdentifier) {
        case ACTION_COMPLETE:
          // Marcar lembrete como completo - isso precisa ser implementado no ReminderContext
          await this.markReminderAsCompleted(reminderId);
          break;

        case ACTION_SNOOZE:
          // Adiar o lembrete por 10 minutos
          await this.snoozeReminder(reminderId, 10);
          break;

        case ACTION_DISMISS:
          // Apenas fecha a notificação, não faz nada especial
          break;

        default:
          // Ação de toque padrão na notificação - navegar para o lembrete
          break;
      }
    } catch (error) {
      console.error("Erro ao processar ação da notificação:", error);
    }
  }

  // Marcar um lembrete como completo - será chamado pelo ACTION_COMPLETE
  private async markReminderAsCompleted(reminderId: string) {
    try {
      // Para garantir que o ID do lembrete seja processado corretamente,
      // nós vamos usar uma chave que será verificada pelo ReminderContext
      await AsyncStorage.setItem("@complete_reminder_id", reminderId);

      // Para depuração
      console.log("Marcando lembrete como completo:", reminderId);

      // Vamos tentar também marcar diretamente no armazenamento
      // já que pode haver problemas de sincronização
      try {
        // Obter a chave de armazenamento correta
        const userData = await AsyncStorage.getItem("@pumpgym_user_data");
        let storageKey = "@fitfolio_reminders:guest";

        if (userData) {
          const user = JSON.parse(userData);
          if (user?.uid) {
            storageKey = `@fitfolio_reminders:${user.uid}`;
          }
        }

        // Buscar lembretes atuais
        const storedData = await AsyncStorage.getItem(storageKey);
        if (storedData) {
          const allReminders = JSON.parse(storedData) as Reminder[];

          // Encontrar e marcar o lembrete
          const updatedReminders = allReminders.map((reminder) => {
            if (reminder.id === reminderId) {
              return {
                ...reminder,
                completed: true,
                completedDate: new Date().toISOString(),
              };
            }
            return reminder;
          });

          // Salvar de volta no armazenamento
          await AsyncStorage.setItem(
            storageKey,
            JSON.stringify(updatedReminders)
          );
        }
      } catch (storageError) {
        // Ignorar erros aqui, pois o método principal ainda funcionará
        // quando o ReminderContext verificar a @complete_reminder_id
      }
    } catch (error) {
      console.error("Erro ao marcar lembrete como completo:", error);
    }
  }

  // Adiar um lembrete - será chamado pelo ACTION_SNOOZE
  private async snoozeReminder(reminderId: string, minutes: number) {
    try {
      // Cancelar notificações existentes para esse lembrete
      await this.cancelNotification(reminderId);

      // Agendar uma nova notificação para daqui a X minutos
      const date = new Date();
      date.setMinutes(date.getMinutes() + minutes);

      // Buscar informações do lembrete
      const storedReminders = await AsyncStorage.getItem(
        "@fitfolio_reminders:guest"
      );
      if (!storedReminders) return;

      const reminders = JSON.parse(storedReminders) as Reminder[];
      const reminder = reminders.find((r) => r.id === reminderId);

      if (!reminder) return;

      // Agendar uma notificação de lembrete adiado
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${reminder.title} (Adiado)`,
          body: reminder.description || "Lembrete adiado",
          data: { reminderId: reminder.id },
          color: reminder.color,
          sound: true,
          categoryIdentifier: REMINDER_CATEGORY,
          // Personalizar a notificação com ícone em dispositivos Android
          ...(Platform.OS === "android" && {
            icon: reminder.icon,
            color: reminder.color,
          }),
        },
        trigger: {
          date: date,
          type: Notifications.SchedulableTriggerInputTypes.DATE,
        },
      });
    } catch (error) {
      console.error("Erro ao adiar lembrete:", error);
    }
  }

  // Pedir permissão para enviar notificações
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log("Notificações não funcionam em emuladores/simuladores");
      return false;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permissão para notificações não concedida");
      return false;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("reminders", {
        name: "Lembretes",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return true;
  }

  // Agendar notificação para um lembrete
  async scheduleNotification(reminder: Reminder): Promise<string | null> {
    // Cancelar qualquer notificação existente para este lembrete
    await this.cancelNotification(reminder.id);

    // Se não tem horário definido ou dias de repetição, não agendar notificação
    if (!reminder.time || reminder.repeatDays.length === 0) {
      return null;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      // Extrair horas e minutos do tempo formatado (HH:MM)
      const [hours, minutes] = reminder.time.split(":").map(Number);

      // Configurar a notificação para disparar nos dias específicos da semana
      const notificationIds = [];

      for (const day of reminder.repeatDays) {
        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: reminder.title,
            body: reminder.description || "Hora do seu lembrete!",
            data: { reminderId: reminder.id },
            color: reminder.color,
            sound: true, // Ativar som para a notificação
            categoryIdentifier: REMINDER_CATEGORY, // Usar a categoria com botões de ação
            // Personalizar a notificação com ícone em dispositivos Android
            ...(Platform.OS === "android" && {
              icon: reminder.icon, // Usar o ícone do lembrete (requer configuração no app.json)
              color: reminder.color,
            }),
          },
          trigger: {
            weekday: day + 1, // Expo usa 1-7 (seg-dom), nosso app usa 0-6 (dom-sab)
            hour: hours,
            minute: minutes,
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          },
        });

        notificationIds.push(identifier);
      }

      // Salvar o mapeamento entre o ID do lembrete e os IDs de notificação
      await this.saveNotificationMapping(reminder.id, notificationIds);

      return reminder.id;
    } catch (error) {
      console.error("Erro ao agendar notificação:", error);
      return null;
    }
  }

  // Cancelar notificações de um lembrete
  async cancelNotification(reminderId: string): Promise<void> {
    try {
      const notificationIds = await this.getNotificationIds(reminderId);
      if (notificationIds && notificationIds.length > 0) {
        // Cancelar cada notificação agendada para este lembrete
        for (const id of notificationIds) {
          await Notifications.cancelScheduledNotificationAsync(id);
        }

        // Remover o mapeamento após cancelar
        await this.removeNotificationMapping(reminderId);
      }
    } catch (error) {
      console.error("Erro ao cancelar notificação:", error);
    }
  }

  // Cancelar todas as notificações de lembretes
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(this.notificationMappingKey);
    } catch (error) {
      console.error("Erro ao cancelar todas as notificações:", error);
    }
  }

  // Verificar as notificações agendadas (útil para debug)
  async getScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Erro ao obter notificações agendadas:", error);
      return [];
    }
  }

  // Salvar o mapeamento entre ID do lembrete e IDs de notificação
  private async saveNotificationMapping(
    reminderId: string,
    notificationIds: string[]
  ): Promise<void> {
    try {
      const mapping = await this.getNotificationMapping();
      mapping[reminderId] = notificationIds;
      await AsyncStorage.setItem(
        this.notificationMappingKey,
        JSON.stringify(mapping)
      );
    } catch (error) {
      console.error("Erro ao salvar mapeamento de notificação:", error);
    }
  }

  // Remover o mapeamento para um lembrete
  private async removeNotificationMapping(reminderId: string): Promise<void> {
    try {
      const mapping = await this.getNotificationMapping();
      delete mapping[reminderId];
      await AsyncStorage.setItem(
        this.notificationMappingKey,
        JSON.stringify(mapping)
      );
    } catch (error) {
      console.error("Erro ao remover mapeamento de notificação:", error);
    }
  }

  // Obter o mapeamento completo de notificações
  private async getNotificationMapping(): Promise<Record<string, string[]>> {
    try {
      const mapping = await AsyncStorage.getItem(this.notificationMappingKey);
      return mapping ? JSON.parse(mapping) : {};
    } catch (error) {
      console.error("Erro ao obter mapeamento de notificações:", error);
      return {};
    }
  }

  // Obter os IDs de notificação para um lembrete específico
  private async getNotificationIds(
    reminderId: string
  ): Promise<string[] | null> {
    try {
      const mapping = await this.getNotificationMapping();
      return mapping[reminderId] || null;
    } catch (error) {
      console.error("Erro ao obter IDs de notificação:", error);
      return null;
    }
  }
}

export default new NotificationService();
