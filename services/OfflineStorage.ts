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
          console.log("Usuário anônimo: dados do onboarding não serão salvos");
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
      console.error("Erro ao salvar dados do onboarding:", error);
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
          console.log("Usuário anônimo: passo do onboarding não será salvo");
          return;
        }
      }

      await AsyncStorage.setItem(KEYS.ONBOARDING_STEP, step);
    } catch (error) {
      console.error("Erro ao salvar passo do onboarding:", error);
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
          console.log(
            "Usuário anônimo: não há dados do onboarding para recuperar"
          );
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
      console.error("Erro ao recuperar dados do onboarding:", error);
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
      console.error("Erro ao recuperar passo do onboarding:", error);
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
      console.error("Erro ao verificar sincronização pendente:", error);
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
      console.error("Erro ao limpar sincronização pendente:", error);
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
      console.error("Erro ao limpar dados do onboarding:", error);
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
      console.log(`OfflineStorage - Salvando dados de nutrição para usuário ${userId}`, {
        dietType: data.dietType,
        goal: data.goal,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat
      });
      
      // Garantir que os dados são serializáveis e criar uma cópia profunda
      const dataToSave = JSON.stringify(data);
      
      // Verificar se os dados são válidos antes de salvar
      try {
        JSON.parse(dataToSave);
      } catch (parseError) {
        console.error(`OfflineStorage - Erro ao serializar dados para usuário ${userId}:`, parseError);
        throw new Error('Dados inválidos para serialização');
      }
      
      // Salvar os dados
      await AsyncStorage.setItem(key, dataToSave);
      
      // Verificar se os dados foram salvos corretamente
      const savedData = await AsyncStorage.getItem(key);
      if (!savedData) {
        console.error(`OfflineStorage - Falha ao verificar dados salvos para usuário ${userId}`);
        throw new Error('Falha ao verificar dados salvos');
      }
      
      // Verificar se os dados salvos são iguais aos dados originais
      const parsedSavedData = JSON.parse(savedData);
      console.log(`OfflineStorage - Dados salvos com sucesso para usuário ${userId}`, {
        dietType: parsedSavedData.dietType,
        goal: parsedSavedData.goal,
        calories: parsedSavedData.calories,
        protein: parsedSavedData.protein,
        carbs: parsedSavedData.carbs,
        fat: parsedSavedData.fat
      });
      
      // Adicionar flag para indicar que os dados foram modificados
      await AsyncStorage.setItem(`${key}_modified`, 'true');
      
    } catch (error) {
      console.error(`OfflineStorage - Erro ao salvar dados de nutrição para usuário ${userId}:`, error);
      throw error;
    }
  },

  // Carregar dados de nutrição
  loadNutritionData: async (userId: string): Promise<any | null> => {
    try {
      const key = `${KEYS.NUTRITION_DATA}_${userId}`;
      console.log(`OfflineStorage - Carregando dados de nutrição para usuário ${userId}`);
      
      const data = await AsyncStorage.getItem(key);
      if (!data) {
        console.log(`OfflineStorage - Nenhum dado encontrado para usuário ${userId}`);
        return null;
      }
      
      try {
        const parsedData = JSON.parse(data);
        console.log(`OfflineStorage - Dados carregados com sucesso para usuário ${userId}`, {
          dietType: parsedData.dietType,
          goal: parsedData.goal,
          calories: parsedData.calories,
          protein: parsedData.protein,
          carbs: parsedData.carbs,
          fat: parsedData.fat
        });
        
        // Verificar se os dados carregados são válidos
        if (!parsedData) {
          console.error(`OfflineStorage - Dados carregados inválidos para usuário ${userId}`);
          return null;
        }
        
        // Verificar se os campos críticos estão presentes
        if (parsedData.dietType === undefined || parsedData.goal === undefined || parsedData.calories === undefined) {
          console.warn(`OfflineStorage - Dados carregados incompletos para usuário ${userId}`);
        }
        
        // Verificar se há uma versão mais recente dos dados
        const isModified = await AsyncStorage.getItem(`${key}_modified`);
        if (isModified === 'true') {
          console.log(`OfflineStorage - Dados modificados localmente para usuário ${userId}`);
          parsedData._isModifiedLocally = true;
        }
        
        return parsedData;
      } catch (parseError) {
        console.error(`OfflineStorage - Erro ao analisar dados para usuário ${userId}:`, parseError);
        
        // Tentar recuperar os dados brutos em caso de erro de parsing
        console.log(`OfflineStorage - Tentando recuperar dados brutos para usuário ${userId}`);
        return { 
          _rawData: data,
          _parseError: true,
          error: parseError.message
        };
      }
    } catch (error) {
      console.error("OfflineStorage - Erro ao carregar dados de nutrição offline:", error);
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
      console.error("Erro ao adicionar operação pendente:", error);
    }
  },

  // Obter todas as operações pendentes
  getPendingOperations: async (): Promise<PendingOperation[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.PENDING_OPERATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Erro ao obter operações pendentes:", error);
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
      console.error("Erro ao remover operação pendente:", error);
    }
  },

  // Limpar todas as operações pendentes
  clearPendingOperations: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(KEYS.PENDING_OPERATIONS);
    } catch (error) {
      console.error("Erro ao limpar operações pendentes:", error);
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
      console.error("Erro ao salvar status de onboarding:", error);
    }
  },

  // Carregar status de onboarding
  loadOnboardingStatus: async (userId: string): Promise<boolean> => {
    try {
      const key = `${KEYS.ONBOARDING_COMPLETED}_${userId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : false;
    } catch (error) {
      console.error("Erro ao carregar status de onboarding:", error);
      return false;
    }
  },

  // Salvar dados do usuário
  saveUserData: async (userId: string, userData: any): Promise<void> => {
    try {
      const key = `${KEYS.USER_DATA}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(userData));
    } catch (error) {
      console.error("Erro ao salvar dados do usuário:", error);
    }
  },

  // Carregar dados do usuário
  loadUserData: async (userId: string): Promise<any | null> => {
    try {
      const key = `${KEYS.USER_DATA}_${userId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
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
      console.error("Erro ao limpar dados do usuário:", error);
    }
  },

  // Funções para dados temporários de nutrição
  saveTemporaryNutritionData: async (data: any) => {
    try {
      await AsyncStorage.setItem(
        KEYS.TEMP_NUTRITION_DATA,
        JSON.stringify(data)
      );
      console.log("Dados temporários salvos com sucesso");
    } catch (error) {
      console.error("Erro ao salvar dados temporários:", error);
      throw error;
    }
  },

  getTemporaryNutritionData: async () => {
    try {
      const data = await AsyncStorage.getItem(KEYS.TEMP_NUTRITION_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Erro ao recuperar dados temporários:", error);
      return null;
    }
  },

  clearTemporaryNutritionData: async () => {
    try {
      await AsyncStorage.removeItem(KEYS.TEMP_NUTRITION_DATA);
      console.log("Dados temporários limpos com sucesso");
    } catch (error) {
      console.error("Erro ao limpar dados temporários:", error);
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
      console.error("Erro ao salvar dados de refeições:", error);
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
      console.error("Erro ao carregar dados de refeições:", error);
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
      console.error("Erro ao buscar datas com refeições:", error);
      return [];
    }
  },

  // Funções para gerenciar o histórico de busca
  saveSearchHistory: async (userId: string, searchHistory: { id: string; name: string; portion: number; calories: number; protein: number; carbs: number; fat: number }[]): Promise<void> => {
    try {
      const key = `${KEYS.SEARCH_HISTORY}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(searchHistory));
      console.log("Histórico de busca salvo com sucesso");
    } catch (error) {
      console.error("Erro ao salvar histórico de busca:", error);
      throw error;
    }
  },

  loadSearchHistory: async (userId: string): Promise<{ id: string; name: string; portion: number; calories: number; protein: number; carbs: number; fat: number }[]> => {
    try {
      const key = `${KEYS.SEARCH_HISTORY}_${userId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Erro ao carregar histórico de busca:", error);
      return [];
    }
  },

  clearSearchHistory: async (userId: string): Promise<void> => {
    try {
      const key = `${KEYS.SEARCH_HISTORY}_${userId}`;
      await AsyncStorage.removeItem(key);
      console.log("Histórico de busca limpo com sucesso");
    } catch (error) {
      console.error("Erro ao limpar histórico de busca:", error);
      throw error;
    }
  },
};
