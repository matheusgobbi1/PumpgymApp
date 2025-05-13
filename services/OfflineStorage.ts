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
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected === true;
      console.log("OfflineStorage: Status de conexão:", isConnected ? "Online" : "Offline");
      return isConnected;
    } catch (error) {
      console.error("OfflineStorage: Erro ao verificar conexão:", error);
      return false;
    }
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
      console.log("OfflineStorage: Salvando status de onboarding:", userId, completed);
      if (!userId) return;
      
      const key = `${KEYS.ONBOARDING_COMPLETED}_${userId}`;
      const valueString = JSON.stringify(completed);
      
      // Salvar em locais redundantes
      await AsyncStorage.setItem(key, valueString);
      await AsyncStorage.setItem(`onboarding_status_${userId}`, valueString);
      
      // Atualizar nos dados do usuário também
      try {
        const userData = await OfflineStorage.loadUserData(userId);
        if (userData) {
          userData.onboardingCompleted = completed;
          await OfflineStorage.saveUserData(userId, userData);
        }
      } catch (userDataError) {
        // Ignorar erro ao atualizar dados do usuário
      }
    } catch (error) {
      console.error("OfflineStorage: Erro ao salvar status de onboarding:", error);
    }
  },

  // Carregar status de onboarding
  loadOnboardingStatus: async (userId: string): Promise<boolean> => {
    try {
      console.log("OfflineStorage: Carregando status de onboarding:", userId);
      if (!userId) return false;
      
      // Verificar em múltiplos locais
      const locations = [
        `${KEYS.ONBOARDING_COMPLETED}_${userId}`,
        `onboarding_status_${userId}`
      ];
      
      for (const location of locations) {
        try {
          const data = await AsyncStorage.getItem(location);
          if (data) {
            const status = JSON.parse(data);
            console.log(`OfflineStorage: Status de onboarding carregado de ${location}:`, status);
            return status === true;
          }
        } catch (locationError) {
          // Continuar para o próximo local
        }
      }
      
      // Verificar também nos dados do usuário
      try {
        const userData = await OfflineStorage.loadUserData(userId);
        if (userData && userData.onboardingCompleted !== undefined) {
          console.log("OfflineStorage: Status de onboarding carregado dos dados do usuário:", userData.onboardingCompleted);
          return userData.onboardingCompleted === true;
        }
      } catch (userDataError) {
        // Ignorar erro ao carregar dos dados do usuário
      }
      
      console.log("OfflineStorage: Status de onboarding não encontrado");
      return false;
    } catch (error) {
      console.error("OfflineStorage: Erro ao carregar status de onboarding:", error);
      return false;
    }
  },

  // Salvar dados do usuário
  saveUserData: async (userId: string, userData: any): Promise<void> => {
    try {
      console.log("OfflineStorage: Salvando dados do usuário", userId);
      if (!userId || !userData) {
        console.error("OfflineStorage: Dados inválidos para salvar");
        return;
      }
      
      // Salvar em múltiplos locais para redundância
      const key = `${KEYS.USER_DATA}_${userId}`;
      const dataString = JSON.stringify(userData);
      
      // Salvar em múltiplos locais para garantir recuperação
      const locations = [
        key,
        `pumpgym_user_${userId}`,
        "pumpgym_user_data_mirror"
      ];
      
      // Salvar em todos os locais
      for (const location of locations) {
        try {
          await AsyncStorage.setItem(location, dataString);
        } catch (locationError) {
          console.error(`OfflineStorage: Erro ao salvar em ${location}:`, locationError);
        }
      }
      
      // Garantir que o ID do último usuário logado esteja salvo
      await AsyncStorage.setItem(KEYS.LAST_LOGGED_USER, userId);
      
      console.log("OfflineStorage: Dados do usuário salvos com sucesso");
    } catch (error) {
      console.error("OfflineStorage: Erro ao salvar dados do usuário:", error);
    }
  },

  // Carregar dados do usuário
  loadUserData: async (userId: string): Promise<any | null> => {
    try {
      console.log("OfflineStorage: Carregando dados do usuário", userId);
      
      // Se userId não for fornecido, tentar obter o último usuário logado
      if (!userId) {
        const lastUserId = await AsyncStorage.getItem(KEYS.LAST_LOGGED_USER);
        if (lastUserId) {
          userId = lastUserId;
          console.log("OfflineStorage: Usando último usuário logado:", lastUserId);
        } else {
          // Se não houver último usuário, retornar null
          console.log("OfflineStorage: Nenhum último usuário encontrado");
          return null;
        }
      }

      // Locais onde podemos encontrar os dados do usuário
      const locations = [
        `${KEYS.USER_DATA}_${userId}`,
        `pumpgym_user_${userId}`,
        "pumpgym_user_data_mirror",
        `${KEYS.USER_DATA}_${userId}_backup`
      ];
      
      // Tentar carregar dos locais em ordem
      for (const location of locations) {
        try {
          const data = await AsyncStorage.getItem(location);
          if (data) {
            try {
              const parsedData = JSON.parse(data);
              if (parsedData && parsedData.uid) {
                console.log(`OfflineStorage: Dados carregados com sucesso de ${location}`);
                
                // Restaurar nos outros locais para garantir consistência
                try {
                  const dataToSave = parsedData._isBackup 
                    ? JSON.stringify({...parsedData, _isBackup: false})
                    : data;
                    
                  // Atualizar em todos os outros locais para sincronização
                  for (const otherLocation of locations) {
                    if (otherLocation !== location) {
                      await AsyncStorage.setItem(otherLocation, dataToSave);
                    }
                  }
                } catch (syncError) {
                  // Ignorar erros de sincronização
                }
                
                return parsedData;
              }
            } catch (parseError) {
              console.error(`OfflineStorage: Erro ao analisar dados de ${location}:`, parseError);
            }
          }
        } catch (locationError) {
          console.error(`OfflineStorage: Erro ao carregar de ${location}:`, locationError);
        }
      }
      
      console.log("OfflineStorage: Nenhum dado do usuário encontrado após verificar todos os locais");
      return null;
    } catch (error) {
      console.error("OfflineStorage: Erro ao carregar dados do usuário:", error);
      return null;
    }
  },

  // Salvar o ID do último usuário logado
  saveLastLoggedUser: async (userId: string): Promise<void> => {
    try {
      console.log("OfflineStorage: Salvando último usuário logado:", userId);
      if (!userId) return;
      
      await AsyncStorage.setItem(KEYS.LAST_LOGGED_USER, userId);
      
      // Salvar também em um segundo local para redundância
      await AsyncStorage.setItem("pumpgym_last_user_backup", userId);
    } catch (error) {
      console.error("OfflineStorage: Erro ao salvar último usuário logado:", error);
    }
  },
  
  // Obter o ID do último usuário logado
  getLastLoggedUser: async (): Promise<string | null> => {
    try {
      // Tentar o local principal
      const userId = await AsyncStorage.getItem(KEYS.LAST_LOGGED_USER);
      if (userId) return userId;
      
      // Tentar o backup
      return await AsyncStorage.getItem("pumpgym_last_user_backup");
    } catch (error) {
      console.error("OfflineStorage: Erro ao obter último usuário logado:", error);
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
      // Validar parâmetros
      if (!userId || !date) {
        throw new Error("Parâmetros inválidos para saveMealsData");
      }

      // Verificar se a data está no formato correto (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error("Formato de data inválido para saveMealsData");
      }

      const key = `${KEYS.MEALS_KEY}${userId}:${date}`;

      // Validar os dados antes de salvar
      if (!data) {
        data = {};
      }

      // Convertemos para objeto vazio se não for um objeto
      if (typeof data !== "object") {
        data = {};
      }

      // Corrigir problemas de dados
      const sanitizedData: { [key: string]: any[] } = {};

      try {
        // Garantir que estamos trabalhando com um objeto iterável
        const dataKeys = Object.keys(data);

        // Filtrar metadados comuns que possam estar nos dados
        const filteredKeys = dataKeys.filter((key) => {
          const metadataKeys = [
            "data",
            "date",
            "updatedAt",
            "createdAt",
            "userId",
            "user_id",
          ];
          return !metadataKeys.includes(key);
        });

        // Para cada chave, garantir que os valores são arrays
        for (const mealId of filteredKeys) {
          try {
            if (Array.isArray(data[mealId])) {
              // Validar cada item do array para garantir que são objetos Food válidos
              const validFoods = data[mealId].filter((food: any) => {
                return (
                  food &&
                  typeof food === "object" &&
                  typeof food.id === "string" &&
                  typeof food.name === "string" &&
                  !isNaN(Number(food.calories)) &&
                  !isNaN(Number(food.protein)) &&
                  !isNaN(Number(food.carbs)) &&
                  !isNaN(Number(food.fat)) &&
                  !isNaN(Number(food.portion))
                );
              });

              sanitizedData[mealId] = validFoods;
            } else {
              sanitizedData[mealId] = [];
            }
          } catch (mealError) {
            sanitizedData[mealId] = [];
          }
        }
      } catch (keysError) {
        // Problema ao obter as chaves do objeto
      }

      // Serializar para garantir que temos uma string JSON válida
      let jsonData;
      try {
        jsonData = JSON.stringify(sanitizedData);
      } catch (jsonError) {
        jsonData = "{}"; // Em caso de erro, usar objeto vazio
      }

      // Salvar os dados
      await AsyncStorage.setItem(key, jsonData);

      try {
        // Adicionar à lista de datas modificadas para sincronização posterior
        let dates = [];
        try {
          const modifiedDates = await AsyncStorage.getItem(
            `${KEYS.MEALS_KEY}${userId}:modified_dates`
          );

          if (modifiedDates) {
            const parsedDates = JSON.parse(modifiedDates);
            if (Array.isArray(parsedDates)) {
              dates = [...new Set([...parsedDates, date])];
            } else {
              dates = [date];
            }
          } else {
            dates = [date];
          }
        } catch (modifiedError) {
          dates = [date];
        }

        await AsyncStorage.setItem(
          `${KEYS.MEALS_KEY}${userId}:modified_dates`,
          JSON.stringify(dates)
        );
      } catch (datesError) {
        // Continuar mesmo se houver erro ao atualizar datas modificadas
      }
    } catch (error) {
      throw error;
    }
  },

  // Carregar dados de refeições
  loadMealsData: async (userId: string, date: string): Promise<any | null> => {
    try {
      // Validar parâmetros
      if (!userId || !date) {
        return {};
      }

      // Verificar se a data está no formato correto (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return {};
      }

      const key = `${KEYS.MEALS_KEY}${userId}:${date}`;
      const data = await AsyncStorage.getItem(key);

      if (!data) {
        return {};
      }

      try {
        const parsedData = JSON.parse(data);

        // Validar estrutura básica dos dados
        if (!parsedData || typeof parsedData !== "object") {
          return {};
        }

        // Verificar se os valores das refeições são arrays
        const sanitizedData: { [key: string]: any[] } = {};

        try {
          const mealIds = Object.keys(parsedData);

          // Filtrar metadados que não deveriam estar aqui
          const filteredMealIds = mealIds.filter((mealId) => {
            const metadataKeys = [
              "data",
              "date",
              "updatedAt",
              "createdAt",
              "userId",
              "user_id",
            ];
            return !metadataKeys.includes(mealId);
          });

          for (const mealId of filteredMealIds) {
            if (Array.isArray(parsedData[mealId])) {
              // Validar cada item do array como um objeto Food válido
              const validFoods = parsedData[mealId].filter((food: any) => {
                return (
                  food &&
                  typeof food === "object" &&
                  typeof food.id === "string" &&
                  typeof food.name === "string" &&
                  !isNaN(Number(food.calories)) &&
                  !isNaN(Number(food.protein)) &&
                  !isNaN(Number(food.carbs)) &&
                  !isNaN(Number(food.fat)) &&
                  !isNaN(Number(food.portion))
                );
              });

              // Só adicionar se houver alimentos válidos
              if (validFoods.length > 0) {
                sanitizedData[mealId] = validFoods;
              } else {
                sanitizedData[mealId] = [];
              }
            } else {
              sanitizedData[mealId] = [];
            }
          }

          return sanitizedData;
        } catch (keysError) {
          return {};
        }
      } catch (parseError) {
        // Se houver erro no parsing, tentar recuperar fazendo backup e limpando
        try {
          await AsyncStorage.setItem(`${key}_backup`, data);
          await AsyncStorage.removeItem(key);
        } catch (backupError) {
          // Ignorar erro de backup
        }
        return {};
      }
    } catch (error) {
      return {};
    }
  },

  // Obter todas as datas que possuem refeições salvas
  getDatesWithMeals: async (userId: string): Promise<string[]> => {
    try {
      if (!userId) {
        return [];
      }

      const allKeys = await AsyncStorage.getAllKeys();

      if (!allKeys || !Array.isArray(allKeys)) {
        return [];
      }

      const mealKeyPrefix = `${KEYS.MEALS_KEY}${userId}`;
      const mealKeys = allKeys.filter(
        (key) => key && typeof key === "string" && key.startsWith(mealKeyPrefix)
      );

      if (!mealKeys.length) {
        return [];
      }

      // Extrair as datas das chaves com tratamento de erros
      const dates = [];
      for (const key of mealKeys) {
        try {
          // Extrair a data da chave: @meals:userId:YYYY-MM-DD
          const parts = key.split(":");
          if (parts.length >= 3) {
            const date = parts[parts.length - 1];
            // Validar se a data está em um formato válido (YYYY-MM-DD)
            if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
              dates.push(date);
            }
          }
        } catch (err) {
          // Ignorar chaves com formato inválido
        }
      }

      return dates;
    } catch (error) {
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

  // Limpar todos os dados de refeições para um usuário
  clearAllMealsData: async (userId: string): Promise<void> => {
    try {
      if (!userId) {
        return;
      }

      // Obter todas as chaves de refeições para o usuário
      const allKeys = await AsyncStorage.getAllKeys();
      if (!allKeys || !Array.isArray(allKeys)) {
        return;
      }

      // Filtrar as chaves relacionadas a refeições deste usuário
      const mealKeyPrefix = `${KEYS.MEALS_KEY}${userId}`;
      const keysToRemove = allKeys.filter(
        (key) => key && typeof key === "string" && key.startsWith(mealKeyPrefix)
      );

      // Se houver chaves para remover, usar multiRemove
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }

      return;
    } catch (error) {
      // Não lançar erro para permitir que o reset continue mesmo com falha na limpeza
    }
  },

  // Funções para gerenciar o status de assinatura offline
  saveSubscriptionStatus: async (
    userId: string,
    isSubscribed: boolean
  ): Promise<void> => {
    try {
      console.log("OfflineStorage: Salvando status de assinatura:", userId, isSubscribed);
      if (!userId) return;
      
      const key = `${KEYS.SUBSCRIPTION_STATUS}_${userId}`;
      const subscriptionData = {
        isSubscribed,
        lastVerified: new Date().toISOString(),
      };
      
      const dataString = JSON.stringify(subscriptionData);
      
      // Salvar em locais redundantes
      await AsyncStorage.setItem(key, dataString);
      await AsyncStorage.setItem(`subscription_${userId}`, dataString);
      
      // Atualizar também nos dados do usuário
      try {
        const userData = await OfflineStorage.loadUserData(userId);
        if (userData) {
          userData.isSubscribed = isSubscribed;
          userData.subscriptionLastVerified = new Date().toISOString();
          await OfflineStorage.saveUserData(userId, userData);
        }
      } catch (userDataError) {
        // Ignorar erro ao atualizar dados do usuário
      }
    } catch (error) {
      console.error("OfflineStorage: Erro ao salvar status de assinatura:", error);
    }
  },

  getSubscriptionStatus: async (userId: string): Promise<boolean> => {
    try {
      console.log("OfflineStorage: Verificando status de assinatura:", userId);
      if (!userId) return false;
      
      // Verificar em múltiplos locais
      const locations = [
        `${KEYS.SUBSCRIPTION_STATUS}_${userId}`,
        `subscription_${userId}`
      ];
      
      for (const location of locations) {
        try {
          const data = await AsyncStorage.getItem(location);
          if (data) {
            const subscriptionData = JSON.parse(data);
            console.log(`OfflineStorage: Status de assinatura carregado de ${location}:`, subscriptionData.isSubscribed);
            return subscriptionData.isSubscribed === true;
          }
        } catch (locationError) {
          // Continuar para o próximo local
        }
      }
      
      // Verificar também nos dados do usuário
      try {
        const userData = await OfflineStorage.loadUserData(userId);
        if (userData && userData.isSubscribed !== undefined) {
          console.log("OfflineStorage: Status de assinatura carregado dos dados do usuário:", userData.isSubscribed);
          return userData.isSubscribed === true;
        }
      } catch (userDataError) {
        // Ignorar erro ao carregar dos dados do usuário
      }
      
      // SIMULAÇÃO PARA TESTE: Forçar assinatura para usuário específico
      if (userId === "4N7KtLUsNNV9mF3EGo5OyoctHr72") {
        console.log("OfflineStorage: Usuário de teste com assinatura forçada");
        return true;
      }
      
      console.log("OfflineStorage: Status de assinatura não encontrado");
      return false;
    } catch (error) {
      console.error("OfflineStorage: Erro ao obter status de assinatura:", error);
      return false;
    }
  },
};
