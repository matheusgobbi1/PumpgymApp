import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { NutritionInfo } from "../context/NutritionContext";
import { KEYS } from "../constants/keys";

// Tipos para operações pendentes
type OperationType = "create" | "update" | "delete";

export interface PendingOperation {
  id: string;
  type: OperationType;
  collection: string;
  data: any;
  timestamp: number;
}

/**
 * Serviço para gerenciar o armazenamento local dos dados do onboarding
 * e sincronização quando o dispositivo estiver online novamente
 */
export const OfflineStorage = {
  /**
   * Salva os dados do onboarding localmente
   */
  saveOnboardingData: async (data: Partial<NutritionInfo>): Promise<void> => {
    try {
      // Não salvar dados se o usuário for anônimo
      const userData = await AsyncStorage.getItem(KEYS.USER_DATA);
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        if (parsedUserData.isAnonymous) {
          return;
        }
      }

      // Obter dados existentes
      const existingDataStr = await AsyncStorage.getItem(KEYS.ONBOARDING_DATA);
      let existingData = existingDataStr ? JSON.parse(existingDataStr) : {};

      // Mesclar dados existentes com novos dados
      const mergedData = { ...existingData, ...data };

      // Salvar dados mesclados
      await AsyncStorage.setItem(
        KEYS.ONBOARDING_DATA,
        JSON.stringify(mergedData)
      );
    } catch (error) {
      // Erro ao salvar dados do onboarding
    }
  },

  /**
   * Salva o passo atual do onboarding
   */
  saveOnboardingStep: async (step: string): Promise<void> => {
    try {
      // Não salvar passo se o usuário for anônimo
      const userData = await AsyncStorage.getItem(KEYS.USER_DATA);
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        if (parsedUserData.isAnonymous) {
          return;
        }
      }

      await AsyncStorage.setItem(KEYS.ONBOARDING_STEP, step);
    } catch (error) {
      // Erro ao salvar passo do onboarding
    }
  },

  /**
   * Recupera os dados do onboarding salvos localmente
   */
  getOnboardingData: async (): Promise<Partial<NutritionInfo> | null> => {
    try {
      // Não recuperar dados se o usuário for anônimo
      const userData = await AsyncStorage.getItem(KEYS.USER_DATA);
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        if (parsedUserData.isAnonymous) {
          return null;
        }
      }

      const dataStr = await AsyncStorage.getItem(KEYS.ONBOARDING_DATA);
      if (!dataStr) return null;

      const data = JSON.parse(dataStr);

      // Converter strings de data de volta para objetos Date
      const processedData = Object.entries(data).reduce<Record<string, any>>(
        (acc, [key, value]) => {
          if (
            typeof value === "string" &&
            (key === "birthDate" || key === "targetDate") &&
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value as string)
          ) {
            acc[key] = new Date(value as string);
          } else {
            acc[key] = value;
          }
          return acc;
        },
        {}
      );

      return processedData as Partial<NutritionInfo>;
    } catch (error) {
      // Erro ao recuperar dados do onboarding
      return null;
    }
  },

  /**
   * Recupera o passo atual do onboarding
   */
  getOnboardingStep: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(KEYS.ONBOARDING_STEP);
    } catch (error) {
      // Erro ao recuperar passo do onboarding
      return null;
    }
  },

  /**
   * Verifica se há dados pendentes para sincronização
   */
  hasPendingSync: async (): Promise<boolean> => {
    try {
      const pendingSync = await AsyncStorage.getItem(KEYS.PENDING_SYNC);
      return pendingSync === "true";
    } catch (error) {
      // Erro ao verificar sincronização pendente
      return false;
    }
  },

  /**
   * Limpa os dados de sincronização pendente
   */
  clearPendingSync: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(KEYS.PENDING_SYNC);
    } catch (error) {
      // Erro ao limpar sincronização pendente
    }
  },

  /**
   * Limpa todos os dados do onboarding
   */
  clearOnboardingData: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        KEYS.ONBOARDING_DATA,
        KEYS.ONBOARDING_STEP,
        KEYS.PENDING_SYNC,
      ]);
    } catch (error) {
      // Erro ao limpar dados do onboarding
    }
  },

  /**
   * Verifica se o dispositivo está online
   */
  isOnline: async (): Promise<boolean> => {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true;
  },

  // Salvar dados de nutrição
  saveNutritionData: async (userId: string, data: any): Promise<void> => {
    try {
      const key = `${KEYS.NUTRITION_DATA}_${userId}`;

      // Garantir que os dados são serializáveis e criar uma cópia profunda
      const dataToSave = JSON.stringify(data);

      // Verificar se os dados são válidos antes de salvar
      try {
        JSON.parse(dataToSave);
      } catch (parseError) {
        throw new Error("Dados inválidos para serialização");
      }

      // Salvar os dados
      await AsyncStorage.setItem(key, dataToSave);

      // Verificar se os dados foram salvos corretamente
      const savedData = await AsyncStorage.getItem(key);
      if (!savedData) {
        throw new Error("Falha ao verificar dados salvos");
      }

      // Adicionar flag para indicar que os dados foram modificados
      await AsyncStorage.setItem(`${key}_modified`, "true");
    } catch (error) {
      throw error;
    }
  },

  // Carregar dados de nutrição
  loadNutritionData: async (userId: string): Promise<any | null> => {
    try {
      const key = `${KEYS.NUTRITION_DATA}_${userId}`;

      const data = await AsyncStorage.getItem(key);
      if (!data) {
        return null;
      }

      try {
        const parsedData = JSON.parse(data);

        // Verificar se os dados carregados são válidos
        if (!parsedData) {
          return null;
        }

        // Verificar se há uma versão mais recente dos dados
        const isModified = await AsyncStorage.getItem(`${key}_modified`);
        if (isModified === "true") {
          parsedData._isModifiedLocally = true;
        }

        return parsedData;
      } catch (parseError) {
        // Tentar recuperar os dados brutos em caso de erro de parsing
        return {
          _rawData: data,
          _parseError: true,
          error: (parseError as Error).message,
        };
      }
    } catch (error) {
      return null;
    }
  },

  // Adicionar operação pendente
  addPendingOperation: async (operation: PendingOperation): Promise<void> => {
    try {
      const pendingOps = await OfflineStorage.getPendingOperations();
      pendingOps.push(operation);
      await AsyncStorage.setItem(
        KEYS.PENDING_OPERATIONS,
        JSON.stringify(pendingOps)
      );
    } catch (error) {
      // Erro ao adicionar operação pendente
    }
  },

  // Obter todas as operações pendentes
  getPendingOperations: async (): Promise<PendingOperation[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.PENDING_OPERATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      // Erro ao obter operações pendentes
      return [];
    }
  },

  // Remover operação pendente
  removePendingOperation: async (operationId: string): Promise<void> => {
    try {
      const pendingOps = await OfflineStorage.getPendingOperations();
      const updatedOps = pendingOps.filter((op) => op.id !== operationId);
      await AsyncStorage.setItem(
        KEYS.PENDING_OPERATIONS,
        JSON.stringify(updatedOps)
      );
    } catch (error) {
      // Erro ao remover operação pendente
    }
  },

  // Limpar todas as operações pendentes
  clearPendingOperations: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(KEYS.PENDING_OPERATIONS);
    } catch (error) {
      // Erro ao limpar operações pendentes
    }
  },

  // Salvar status de onboarding
  saveOnboardingStatus: async (
    userId: string,
    completed: boolean
  ): Promise<void> => {
    try {
      const key = `${KEYS.ONBOARDING_COMPLETED}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(completed));
    } catch (error) {
      // Erro ao salvar status de onboarding
    }
  },

  // Carregar status de onboarding
  loadOnboardingStatus: async (userId: string): Promise<boolean> => {
    try {
      const key = `${KEYS.ONBOARDING_COMPLETED}_${userId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : false;
    } catch (error) {
      // Erro ao carregar status de onboarding
      return false;
    }
  },

  // Salvar dados do usuário
  saveUserData: async (userId: string, userData: any): Promise<void> => {
    try {
      const key = `${KEYS.USER_DATA}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(userData));
    } catch (error) {
      // Erro ao salvar dados do usuário
    }
  },

  // Carregar dados do usuário
  loadUserData: async (userId: string): Promise<any | null> => {
    try {
      const key = `${KEYS.USER_DATA}_${userId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      // Erro ao carregar dados do usuário
      return null;
    }
  },

  // Limpar todos os dados do usuário
  clearUserData: async (userId: string): Promise<void> => {
    try {
      const keys = [
        `${KEYS.NUTRITION_DATA}_${userId}`,
        `${KEYS.ONBOARDING_COMPLETED}_${userId}`,
        `${KEYS.USER_DATA}_${userId}`,
      ];

      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      // Erro ao limpar dados do usuário
    }
  },

  // Funções para dados temporários de nutrição
  saveTemporaryNutritionData: async (data: any) => {
    try {
      await AsyncStorage.setItem(
        KEYS.TEMP_NUTRITION_DATA,
        JSON.stringify(data)
      );
    } catch (error) {
      throw error;
    }
  },

  getTemporaryNutritionData: async () => {
    try {
      const data = await AsyncStorage.getItem(KEYS.TEMP_NUTRITION_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      // Erro ao recuperar dados temporários
      return null;
    }
  },

  clearTemporaryNutritionData: async () => {
    try {
      await AsyncStorage.removeItem(KEYS.TEMP_NUTRITION_DATA);
    } catch (error) {
      throw error;
    }
  },

  // Salvar dados de refeições
  saveMealsData: async (
    userId: string,
    date: string,
    data: any
  ): Promise<void> => {
    try {
      const key = `${KEYS.MEALS_KEY}${userId}:${date}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      // Erro ao salvar dados de refeições
      throw error;
    }
  },

  // Carregar dados de refeições
  loadMealsData: async (userId: string, date: string): Promise<any | null> => {
    try {
      const key = `${KEYS.MEALS_KEY}${userId}:${date}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      // Erro ao carregar dados de refeições
      return null;
    }
  },

  // Obter todas as datas que possuem refeições salvas
  getDatesWithMeals: async (userId: string): Promise<string[]> => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const mealKeys = allKeys.filter((key) =>
        key.startsWith(`${KEYS.MEALS_KEY}${userId}`)
      );

      return mealKeys.map((key) => {
        // Extrair a data da chave: @meals:userId:YYYY-MM-DD
        const parts = key.split(":");
        return parts[parts.length - 1];
      });
    } catch (error) {
      // Erro ao buscar datas com refeições
      return [];
    }
  },

  // Funções para gerenciar o histórico de busca
  saveSearchHistory: async (
    userId: string,
    searchHistory: {
      id: string;
      name: string;
      portion: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }[]
  ): Promise<void> => {
    try {
      const key = `${KEYS.SEARCH_HISTORY}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(searchHistory));
    } catch (error) {
      // Erro ao salvar histórico de busca
      throw error;
    }
  },

  loadSearchHistory: async (
    userId: string
  ): Promise<
    {
      id: string;
      name: string;
      portion: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }[]
  > => {
    try {
      const key = `${KEYS.SEARCH_HISTORY}_${userId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      // Erro ao carregar histórico de busca
      return [];
    }
  },

  clearSearchHistory: async (userId: string): Promise<void> => {
    try {
      const key = `${KEYS.SEARCH_HISTORY}_${userId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      // Erro ao limpar histórico de busca
      throw error;
    }
  },
};
