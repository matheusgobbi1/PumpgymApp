import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isToday } from "date-fns";
import { AppState } from "react-native";
import { useTranslation } from "react-i18next";
import NotificationService from "../services/NotificationService";
import * as Notifications from "expo-notifications";

// Interface para lembretes
export interface Reminder {
  id: string;
  title: string;
  description?: string;
  icon: string;
  color: string;
  time?: string;
  completed: boolean;
  completedDate?: string;
  createdAt: string;
  repeatDays: number[]; // 0 = domingo, 1 = segunda, ..., 6 = sábado
}

// Ícones predefinidos para escolher
export const REMINDER_ICONS = [
  { name: "water", color: "#0096FF" },
  { name: "pill", color: "#9575CD" },
  { name: "dumbbell", color: "#FF6B6B" },
  { name: "nutrition", color: "#4CAF50" },
  { name: "timer", color: "#FFA000" },
  { name: "bed", color: "#78909C" },
  { name: "walk", color: "#FF7043" },
  { name: "scale", color: "#9C27B0" },
  { name: "heart-pulse", color: "#E91E63" },
];

// Hook personalizado para usar os ícones com tradução
export const useReminderIcons = () => {
  const { t } = useTranslation();
  return REMINDER_ICONS.map((icon) => ({
    ...icon,
    label: t(`reminders.icons.${icon.name}`),
  }));
};

const BASE_STORAGE_KEY = "@fitfolio_reminders";

interface ReminderContextType {
  reminders: Reminder[];
  loading: boolean;
  addReminder: (
    reminder: Omit<Reminder, "id" | "createdAt" | "completed" | "completedDate">
  ) => Promise<void>;
  updateReminder: (id: string, data: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleCompleted: (id: string) => Promise<void>;
  getTodayReminders: () => Reminder[];
  getReminderById: (id: string) => Reminder | undefined;
  loadReminders: () => Promise<void>;
  notificationsEnabled: boolean;
  toggleNotificationsEnabled: () => Promise<void>;
}

const ReminderContext = createContext<ReminderContextType | undefined>(
  undefined
);

export function ReminderProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheckDate, setLastCheckDate] = useState<Date>(new Date());
  const [storageKey, setStorageKey] = useState<string>(BASE_STORAGE_KEY);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Este é um workaround para evitar um erro de dependência circular
  // Como AuthContext depende deste contexto, não podemos usar useAuth diretamente aqui
  // Usamos um efeito para obter o userId quando disponível
  useEffect(() => {
    const getUserIdForStorage = async () => {
      try {
        const userData = await AsyncStorage.getItem("@pumpgym_user_data");
        if (userData) {
          const parsed = JSON.parse(userData);
          const userId = parsed?.uid;
          if (userId) {
            setStorageKey(`${BASE_STORAGE_KEY}:${userId}`);
            return;
          }
        }

        // Se não encontrou o userId, tenta recuperar do auth
        try {
          const { auth } = require("../firebase/config");
          if (auth.currentUser) {
            setStorageKey(`${BASE_STORAGE_KEY}:${auth.currentUser.uid}`);
            return;
          }
        } catch (e) {
          // Ignorar erros
        }

        // Se nada funcionar, use a chave de convidado
        setStorageKey(`${BASE_STORAGE_KEY}:guest`);
      } catch (e) {
        // Em caso de erro, use a chave de convidado
        setStorageKey(`${BASE_STORAGE_KEY}:guest`);
      }
    };

    getUserIdForStorage();
  }, []);

  // Carregar a preferência de notificações
  useEffect(() => {
    const loadNotificationPreference = async () => {
      try {
        const preference = await AsyncStorage.getItem(
          "@reminder_notifications_enabled"
        );
        if (preference !== null) {
          setNotificationsEnabled(preference === "true");
        }
      } catch (error) {
        // Falha silenciosa, mantém o padrão (true)
      }
    };

    loadNotificationPreference();
  }, []);

  // Resetar o status de completado para os lembretes diários
  const resetCompletedForToday = (remindersArray: Reminder[]): Reminder[] => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado

    return remindersArray.map((reminder) => {
      // Se o lembrete deve repetir hoje (baseado nos dias da semana)
      if (reminder.repeatDays.includes(dayOfWeek)) {
        // Se já foi completado hoje, manter completado
        if (
          reminder.completedDate &&
          isToday(new Date(reminder.completedDate))
        ) {
          return reminder;
        }
        // Caso contrário, resetar para não completado
        return { ...reminder, completed: false, completedDate: undefined };
      }
      return reminder;
    });
  };

  // Verificar se passou da meia-noite e resetar lembretes se necessário
  useEffect(() => {
    const checkMidnightReset = () => {
      const now = new Date();
      if (!isToday(lastCheckDate)) {
        const updatedReminders = resetCompletedForToday(reminders);
        setReminders(updatedReminders);
        saveReminders(updatedReminders);
        setLastCheckDate(now);
      }
    };

    // Verificar a cada minuto
    const interval = setInterval(checkMidnightReset, 60000);

    // Verificar também quando o app volta do background
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkMidnightReset();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [reminders, lastCheckDate]);

  // Recarregar lembretes quando a chave de armazenamento mudar
  useEffect(() => {
    loadReminders();
  }, [storageKey]);

  // Efeito para verificar e processar ações de completar lembretes a partir de notificações
  useEffect(() => {
    const checkCompletePendingReminders = async () => {
      try {
        // Verificar explicitamente a chave para marcar como concluído
        const reminderId = await AsyncStorage.getItem("@complete_reminder_id");

        if (reminderId) {
         

          // Verificar se o lembrete existe
          const reminderToComplete = reminders.find((r) => r.id === reminderId);

          if (reminderToComplete) {
       

            // Marcar como concluído
            await toggleCompleted(reminderId);

            // Limpar a flag para não processar novamente
            await AsyncStorage.removeItem("@complete_reminder_id");

          } else {
      

            // Se o lembrete não estiver na memória, tente buscar direto do armazenamento
            await loadReminders();

            // Tentar novamente após recarregar
            const refreshedReminder = reminders.find(
              (r) => r.id === reminderId
            );
            if (refreshedReminder) {
              await toggleCompleted(reminderId);
            }

            // Limpar a flag
            await AsyncStorage.removeItem("@complete_reminder_id");
          }
        }
      } catch (error) {
        console.error(
          "Erro ao processar lembrete pendente para completar:",
          error
        );
        // Limpar a flag caso ocorra um erro para evitar loop infinito
        AsyncStorage.removeItem("@complete_reminder_id").catch(() => {});
      }
    };

    // Verificar ao montar o componente
    checkCompletePendingReminders();

    // Verificar também quando o app volta para o primeiro plano
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkCompletePendingReminders();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [reminders]);

  // Efeito para processar notificações recebidas quando o app está em primeiro plano
  useEffect(() => {
    // Processar ações de notificação quando o app está em primeiro plano
    const notificationSubscription =
      Notifications.addNotificationResponseReceivedListener(
        async (response) => {
          try {
            const { actionIdentifier, notification } = response;
            const data = notification.request.content.data as {
              reminderId?: string;
            };

            if (!data || !data.reminderId) return;

            // Apenas processar ações específicas
            if (actionIdentifier === "COMPLETE") {
           
              await toggleCompleted(data.reminderId);
            }
          } catch (error) {
            console.error("Erro ao processar notificação no contexto:", error);
          }
        }
      );

    return () => {
      Notifications.removeNotificationSubscription(notificationSubscription);
    };
  }, []);

  // Carregar lembretes do armazenamento
  const loadReminders = async () => {
    if (!storageKey) return;

    try {
      setLoading(true);
      const storedReminders = await AsyncStorage.getItem(storageKey);

      if (storedReminders) {
        const parsedReminders = JSON.parse(storedReminders) as Reminder[];
        // Resetar os completados para hoje
        const updatedReminders = resetCompletedForToday(parsedReminders);
        setReminders(updatedReminders);

        // Agendar notificações após carregar os lembretes
        if (notificationsEnabled) {
          await scheduleAllNotifications();
        }
      } else {
        // Se não há dados na nova chave, tente migrar dados da antiga chave base
        // Verificar primeiro se a chave base é diferente da chave atual
        // (evita migração desnecessária quando usando a chave base diretamente)
        if (storageKey !== BASE_STORAGE_KEY) {
          const oldData = await AsyncStorage.getItem(BASE_STORAGE_KEY);
          if (oldData) {
            try {
              const parsedOldData = JSON.parse(oldData) as Reminder[];
              if (parsedOldData && parsedOldData.length > 0) {
                // Usar os dados antigos e salvá-los na nova chave
                const updatedReminders = resetCompletedForToday(parsedOldData);
                setReminders(updatedReminders);
                await saveReminders(updatedReminders);
                // Limpe os dados antigos para evitar migrações duplicadas
                await AsyncStorage.removeItem(BASE_STORAGE_KEY);
              } else {
                setReminders([]);
              }
            } catch (parseError) {
              setReminders([]);
            }
          } else {
            setReminders([]);
          }
        } else {
          setReminders([]);
        }
      }
    } catch (error) {
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  // Salvar lembretes no AsyncStorage
  const saveReminders = async (updatedReminders: Reminder[]) => {
    if (!storageKey) return;

    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedReminders));
    } catch (error) {}
  };

  // Adicionar novo lembrete
  const addReminder = async (
    reminderData: Omit<
      Reminder,
      "id" | "createdAt" | "completed" | "completedDate"
    >
  ) => {
    const newReminder: Reminder = {
      id: Date.now().toString(),
      title: reminderData.title.trim(),
      description: reminderData.description?.trim() || undefined,
      icon: reminderData.icon,
      color: reminderData.color,
      time: reminderData.time || undefined,
      completed: false,
      createdAt: new Date().toISOString(),
      repeatDays: reminderData.repeatDays,
    };

    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);

    // Agendar notificação para o novo lembrete
    if (notificationsEnabled && newReminder.time) {
      await NotificationService.scheduleNotification(newReminder);
    }
  };

  // Atualizar um lembrete existente
  const updateReminder = async (id: string, data: Partial<Reminder>) => {
    const oldReminder = reminders.find((r) => r.id === id);
    const updatedReminders = reminders.map((reminder) => {
      if (reminder.id === id) {
        return {
          ...reminder,
          ...data,
          title: data.title?.trim() || reminder.title,
          description: data.description?.trim() || reminder.description,
        };
      }
      return reminder;
    });

    setReminders(updatedReminders);
    await saveReminders(updatedReminders);

    // Atualizar notificação se necessário
    if (notificationsEnabled) {
      const updatedReminder = updatedReminders.find((r) => r.id === id);
      if (updatedReminder) {
        // Se houver mudanças no horário ou dias, ou se foi adicionado um horário
        if (
          data.time !== oldReminder?.time ||
          data.repeatDays !== oldReminder?.repeatDays
        ) {
          if (updatedReminder.time) {
            await NotificationService.scheduleNotification(updatedReminder);
          } else {
            await NotificationService.cancelNotification(id);
          }
        }
      }
    }
  };

  // Excluir um lembrete
  const deleteReminder = async (id: string) => {
    // Cancelar notificações associadas a este lembrete
    await NotificationService.cancelNotification(id);

    const updatedReminders = reminders.filter((r) => r.id !== id);
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
  };

  // Alternar o estado de completado para um lembrete
  const toggleCompleted = async (id: string) => {
    try {
      // Primeiro verificar se temos o lembrete na memória
      let reminderToToggle = reminders.find((r) => r.id === id);

      // Se não encontrou na memória, tente buscar do armazenamento
      if (!reminderToToggle && storageKey) {
        try {
          const storedData = await AsyncStorage.getItem(storageKey);
          if (storedData) {
            const storedReminders = JSON.parse(storedData) as Reminder[];
            reminderToToggle = storedReminders.find((r) => r.id === id);
          }
        } catch (storageError) {
          console.error(
            "Erro ao buscar lembrete do armazenamento:",
            storageError
          );
        }
      }

      if (!reminderToToggle) {
        console.error(
          "Não foi possível encontrar o lembrete para marcar como concluído:",
          id
        );
        return;
      }

      // Atualizar em memória
      const updatedReminders = reminders.map((reminder) => {
        if (reminder.id === id) {
          const now = new Date().toISOString();
          const newCompleted = !reminder.completed;

          return {
            ...reminder,
            completed: newCompleted,
            completedDate: newCompleted ? now : undefined,
          };
        }
        return reminder;
      });

      // Atualizar o estado e o armazenamento
      setReminders(updatedReminders);
      await saveReminders(updatedReminders);

    
    } catch (error) {
     
    }
  };

  // Obter lembretes para hoje
  const getTodayReminders = () => {
    const today = new Date().getDay();
    return reminders.filter((r) => r.repeatDays.includes(today));
  };

  // Obter um lembrete específico pelo ID
  const getReminderById = (id: string) => {
    return reminders.find((r) => r.id === id);
  };

  // Alternar a configuração de notificações
  const toggleNotificationsEnabled = async () => {
    try {
      const newState = !notificationsEnabled;
      setNotificationsEnabled(newState);
      await AsyncStorage.setItem(
        "@reminder_notifications_enabled",
        String(newState)
      );

      if (newState) {
        // Reagendar notificações para todos os lembretes
        await scheduleAllNotifications();
      } else {
        // Cancelar todas as notificações
        await NotificationService.cancelAllNotifications();
      }
    } catch (error) {
      console.error("Erro ao alternar notificações:", error);
    }
  };

  // Agendar notificações para todos os lembretes
  const scheduleAllNotifications = async () => {
    if (!notificationsEnabled) return;

    for (const reminder of reminders) {
      if (reminder.time && reminder.repeatDays.length > 0) {
        await NotificationService.scheduleNotification(reminder);
      }
    }
  };

  const value = {
    reminders,
    loading,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleCompleted,
    getTodayReminders,
    getReminderById,
    loadReminders,
    notificationsEnabled,
    toggleNotificationsEnabled,
  };

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  );
}

export const useReminders = () => {
  const context = useContext(ReminderContext);
  if (context === undefined) {
    throw new Error("useReminders must be used within a ReminderProvider");
  }
  return context;
};
