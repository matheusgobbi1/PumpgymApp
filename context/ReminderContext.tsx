import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isToday } from "date-fns";
import { AppState } from "react-native";
import { useAuth } from "./AuthContext";

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
  { name: "water", label: "Água", color: "#0096FF" },
  { name: "pill", label: "Suplemento", color: "#9575CD" },
  { name: "dumbbell", label: "Treino", color: "#FF5252" },
  { name: "nutrition", label: "Refeição", color: "#4CAF50" },
  { name: "timer", label: "Tempo", color: "#FFA000" },
  { name: "bed", label: "Dormir", color: "#78909C" },
  { name: "walk", label: "Caminhar", color: "#FF7043" },
  { name: "scale", label: "Peso", color: "#9C27B0" },
  { name: "heart-pulse", label: "Saúde", color: "#E91E63" },
];

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
}

const ReminderContext = createContext<ReminderContextType | undefined>(
  undefined
);

export function ReminderProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheckDate, setLastCheckDate] = useState<Date>(new Date());
  const [storageKey, setStorageKey] = useState<string>(BASE_STORAGE_KEY);

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
              console.error("Erro ao analisar dados antigos:", parseError);
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
      console.error("Erro ao carregar lembretes:", error);
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
    } catch (error) {
      console.error("Erro ao salvar lembretes:", error);
    }
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
  };

  // Atualizar um lembrete existente
  const updateReminder = async (id: string, data: Partial<Reminder>) => {
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
  };

  // Excluir um lembrete
  const deleteReminder = async (id: string) => {
    const updatedReminders = reminders.filter((r) => r.id !== id);
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
  };

  // Alternar o estado de completado para um lembrete
  const toggleCompleted = async (id: string) => {
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

    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
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
