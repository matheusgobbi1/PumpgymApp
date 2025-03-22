import { doc, setDoc, getDoc, getFirestore } from "firebase/firestore";
import NetInfo from "@react-native-community/netinfo";
import { OfflineStorage, PendingOperation } from "./OfflineStorage";
import { KEYS } from "../constants/keys";
import { auth, db } from "../firebase/config";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const SyncService = {
  /**
   * Verifica se o dispositivo está online
   */
  isOnline: async (): Promise<boolean> => {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true;
  },

  /**
   * Sincroniza todas as operações pendentes
   */
  syncPendingOperations: async (): Promise<{
    success: boolean;
    syncedCount: number;
    failedCount: number;
    errors: string[];
  }> => {
    // Verificar se o usuário está autenticado
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: ["Usuário não autenticado"],
      };
    }

    // Verificar se o usuário é anônimo
    if (currentUser.isAnonymous) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: ["Usuário anônimo, sincronização não realizada"],
      };
    }

    try {
      // Verificar conexão
      const isDeviceOnline = await SyncService.isOnline();
      if (!isDeviceOnline) {
        return {
          success: false,
          syncedCount: 0,
          failedCount: 0,
          errors: ["Dispositivo offline"],
        };
      }

      // Obter operações pendentes
      const pendingOps = await OfflineStorage.getPendingOperations();
      if (!pendingOps.length) {
        return {
          success: true,
          syncedCount: 0,
          failedCount: 0,
          errors: [],
        };
      }

      const results = {
        success: true,
        syncedCount: 0,
        failedCount: 0,
        errors: [] as string[],
      };

      // Processar cada operação
      for (const op of pendingOps) {
        try {
          await SyncService.processOperation(op, currentUser.uid);
          await OfflineStorage.removePendingOperation(op.id);
          results.syncedCount++;
        } catch (error) {
          results.failedCount++;
          results.errors.push(
            `Erro ao sincronizar operação ${op.id}: ${
              error instanceof Error ? error.message : "Erro desconhecido"
            }`
          );
          results.success = false;
        }
      }

      return results;
    } catch (error) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: [
          `Erro ao sincronizar operações pendentes: ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }`,
        ],
      };
    }
  },

  /**
   * Processa uma operação pendente
   */
  processOperation: async (
    operation: PendingOperation,
    userId: string
  ): Promise<void> => {
    try {
      switch (operation.collection) {
        case "nutrition":
          if (operation.type === "update") {
            await setDoc(doc(db, "nutrition", userId), operation.data, {
              merge: true,
            });
          }
          break;

        case "meals":
          if (operation.type === "update" && operation.data.date) {
            await setDoc(
              doc(db, "meals", `${userId}_${operation.data.date}`),
              { userId, date: operation.data.date, data: operation.data.data },
              { merge: true }
            );
          }
          break;

        case "users":
          if (operation.type === "update") {
            await setDoc(doc(db, "users", userId), operation.data, {
              merge: true,
            });
          }
          break;

        case "exercises":
          if (operation.type === "update") {
            await setDoc(doc(db, "exercises", userId), operation.data, {
              merge: true,
            });
          }
          break;

        case "workouts":
          if (operation.type === "update") {
            await setDoc(doc(db, "workouts", userId), operation.data, {
              merge: true,
            });
          }
          break;

        default:
          throw new Error(
            `Tipo de coleção não suportado: ${operation.collection}`
          );
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Sincroniza dados de refeições modificados offline
   */
  syncMealsData: async (): Promise<{
    success: boolean;
    syncedDates: string[];
    failedDates: string[];
    errors: string[];
  }> => {
    const currentUser = auth?.currentUser;
    if (!currentUser || currentUser.isAnonymous) {
      return {
        success: false,
        syncedDates: [],
        failedDates: [],
        errors: ["Usuário não autenticado ou anônimo"],
      };
    }

    try {
      // Verificar conexão
      const isDeviceOnline = await SyncService.isOnline();
      if (!isDeviceOnline) {
        return {
          success: false,
          syncedDates: [],
          failedDates: [],
          errors: ["Dispositivo offline"],
        };
      }

      // Obter datas modificadas
      const modifiedDatesKey = `${KEYS.MEALS_KEY}${currentUser.uid}:modified_dates`;
      const modifiedDatesStr = await AsyncStorage.getItem(modifiedDatesKey);
      const modifiedDates: string[] = modifiedDatesStr
        ? JSON.parse(modifiedDatesStr)
        : [];

      if (!modifiedDates.length) {
        return {
          success: true,
          syncedDates: [],
          failedDates: [],
          errors: [],
        };
      }

      const results = {
        success: true,
        syncedDates: [] as string[],
        failedDates: [] as string[],
        errors: [] as string[],
      };

      // Sincronizar cada data modificada
      for (const date of modifiedDates) {
        try {
          const mealsData = await OfflineStorage.loadMealsData(
            currentUser.uid,
            date
          );

          await setDoc(
            doc(db, "meals", `${currentUser.uid}_${date}`),
            {
              userId: currentUser.uid,
              date,
              data: mealsData,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );

          results.syncedDates.push(date);
        } catch (error) {
          results.failedDates.push(date);
          results.errors.push(
            `Erro ao sincronizar refeições para ${date}: ${
              error instanceof Error ? error.message : "Erro desconhecido"
            }`
          );
          results.success = false;
        }
      }

      // Limpar datas sincronizadas da lista de modificadas
      if (results.syncedDates.length > 0) {
        const remainingDates = modifiedDates.filter(
          (date) => !results.syncedDates.includes(date)
        );
        await AsyncStorage.setItem(
          modifiedDatesKey,
          JSON.stringify(remainingDates)
        );
      }

      return results;
    } catch (error) {
      return {
        success: false,
        syncedDates: [],
        failedDates: [],
        errors: [
          `Erro ao sincronizar refeições: ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }`,
        ],
      };
    }
  },

  /**
   * Sincroniza dados de exercícios e treinos
   */
  syncWorkoutData: async (): Promise<{
    success: boolean;
    message: string;
    errors: string[];
  }> => {
    const currentUser = auth?.currentUser;
    if (!currentUser || currentUser.isAnonymous) {
      return {
        success: false,
        message: "Usuário não autenticado ou anônimo",
        errors: ["Usuário não autenticado ou anônimo"],
      };
    }

    try {
      // Verificar conexão
      const isDeviceOnline = await SyncService.isOnline();
      if (!isDeviceOnline) {
        return {
          success: false,
          message: "Dispositivo offline",
          errors: ["Dispositivo offline"],
        };
      }

      // Obter dados locais
      const workoutsKey = `pumpgym_workouts_${currentUser.uid}`;
      const exercisesKey = `pumpgym_exercises_${currentUser.uid}`;

      const workoutsData = await AsyncStorage.getItem(workoutsKey);
      const exercisesData = await AsyncStorage.getItem(exercisesKey);

      // Se não houver dados, não sincronizar
      if (!workoutsData && !exercisesData) {
        return {
          success: true,
          message: "Nenhum dado para sincronizar",
          errors: [],
        };
      }

      // Sincronizar exercícios
      if (exercisesData) {
        try {
          const parsedExercises = JSON.parse(exercisesData);
          await setDoc(
            doc(db, "exercises", currentUser.uid),
            {
              userId: currentUser.uid,
              exercises: parsedExercises,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (error) {
          return {
            success: false,
            message: "Erro ao sincronizar exercícios",
            errors: [
              `Erro ao sincronizar exercícios: ${
                error instanceof Error ? error.message : "Erro desconhecido"
              }`,
            ],
          };
        }
      }

      // Sincronizar treinos
      if (workoutsData) {
        try {
          const parsedWorkouts = JSON.parse(workoutsData);
          await setDoc(
            doc(db, "workouts", currentUser.uid),
            {
              userId: currentUser.uid,
              workouts: parsedWorkouts.workouts || [],
              availableWorkoutTypes: parsedWorkouts.availableWorkoutTypes || [],
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (error) {
          return {
            success: false,
            message: "Erro ao sincronizar treinos",
            errors: [
              `Erro ao sincronizar treinos: ${
                error instanceof Error ? error.message : "Erro desconhecido"
              }`,
            ],
          };
        }
      }

      return {
        success: true,
        message: "Dados de treinos sincronizados com sucesso",
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro ao sincronizar dados de treinos",
        errors: [
          `Erro ao sincronizar dados de treinos: ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }`,
        ],
      };
    }
  },

  /**
   * Sincroniza todos os dados para garantir que o servidor esteja atualizado
   */
  syncAll: async (): Promise<{
    pendingOps: { success: boolean; syncedCount: number; failedCount: number };
    meals: { success: boolean; syncedDates: string[]; failedDates: string[] };
    workouts: { success: boolean; message: string };
    errors: string[];
  }> => {
    try {
      const pendingOpsResult = await SyncService.syncPendingOperations();
      const mealsResult = await SyncService.syncMealsData();
      const workoutsResult = await SyncService.syncWorkoutData();

      return {
        pendingOps: {
          success: pendingOpsResult.success,
          syncedCount: pendingOpsResult.syncedCount,
          failedCount: pendingOpsResult.failedCount,
        },
        meals: {
          success: mealsResult.success,
          syncedDates: mealsResult.syncedDates,
          failedDates: mealsResult.failedDates,
        },
        workouts: {
          success: workoutsResult.success,
          message: workoutsResult.message,
        },
        errors: [
          ...pendingOpsResult.errors,
          ...mealsResult.errors,
          ...workoutsResult.errors,
        ],
      };
    } catch (error) {
      return {
        pendingOps: { success: false, syncedCount: 0, failedCount: 0 },
        meals: { success: false, syncedDates: [], failedDates: [] },
        workouts: { success: false, message: "Erro na sincronização" },
        errors: [
          `Erro ao sincronizar dados: ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }`,
        ],
      };
    }
  },
};
