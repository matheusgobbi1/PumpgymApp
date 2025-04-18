import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";
import { OfflineStorage, PendingOperation } from "../services/OfflineStorage";
import NetInfo from "@react-native-community/netinfo";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { SyncService } from "../services/SyncService";
import { CustomMealDistribution } from "../utils/nutritionDistributionAlgorithm";
import { format, isToday, subDays } from "date-fns";
import { useAchievements } from "./AchievementContext";

// Chaves para armazenamento no AsyncStorage
const KEYS = {
  NUTRITION_DATA: "pumpgym_nutrition_data",
  PENDING_OPERATIONS: "pumpgym_pending_operations",
  ONBOARDING_COMPLETED: "pumpgym_onboarding_completed",
  USER_DATA: "pumpgym_user_data",
  ONBOARDING_DATA: "pumpgym_onboarding_data",
  ONBOARDING_STEP: "pumpgym_onboarding_step",
  PENDING_SYNC: "pumpgym_pending_sync",
  TEMP_NUTRITION_DATA: "@temp_nutrition_data",
  MEALS_KEY: "@meals:",
  CUSTOM_MEAL_DISTRIBUTION: "pumpgym_custom_meal_distribution",
  WATER_INTAKE: "pumpgym_water_intake",
  WATER_GOAL_DAYS: "pumpgym_water_goal_days",
  LAST_WATER_GOAL_DAY: "pumpgym_last_water_goal_day",
};

// Função utilitária para arredondar valores nutricionais
const roundNutritionValue = (
  value: number,
  type: "calories" | "macros" | "water" | "weight" = "macros"
): number => {
  if (value === undefined || value === null || isNaN(value)) return 0;

  switch (type) {
    case "calories":
      // Arredondar calorias para múltiplos de 50
      return Math.round(value / 50) * 50;
    case "macros":
      // Arredondar macronutrientes para inteiros
      return Math.round(value);
    case "water":
      // Arredondar água para múltiplos de 50ml
      return Math.round(value / 50) * 50;
    case "weight":
      // Arredondar peso para 1 casa decimal
      return Math.round(value * 10) / 10;
    default:
      return Math.round(value);
  }
};

// Definindo os tipos para as informações de nutrição
export type Gender = "male" | "female" | "other";
export type TrainingFrequency =
  | "sedentary"
  | "light"
  | "moderate"
  | "intense"
  | "athlete";
export type DietType = "classic" | "pescatarian" | "vegetarian" | "vegan";
export type Goal = "lose" | "maintain" | "gain";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "intense"
  | "athlete";
export type MacroDistribution =
  | "balanced"
  | "high-protein"
  | "high-fat"
  | "low-carb";

// Novo tipo para o histórico de água
export type WaterHistoryType = { [date: string]: number };

// Interface para entradas do histórico de peso
export interface WeightHistoryEntry {
  date: string; // Data no formato ISO string
  weight: number; // Peso em kg
}

export interface NutritionInfo {
  gender?: Gender;
  trainingFrequency?: TrainingFrequency;
  birthDate?: Date | string | null;
  height?: number; // em cm
  weight?: number; // em kg
  targetWeight?: number;
  goal?: Goal;
  weightChangeRate?: number; // 0.2 a 1.2 kg por semana
  dietType?: DietType;
  referral?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  targetDate?: Date | string | null;
  activityLevel?: ActivityLevel;
  macros?: MacroDistribution;
  meals?: number;
  waterIntake?: number;
  updatedAt?: string; // Data da última atualização
  _isModifiedLocally?: boolean; // Flag interna para controle
  healthScore?: number;
  weightHistory?: WeightHistoryEntry[]; // Histórico de pesos
  customMealDistribution?: CustomMealDistribution[]; // Distribuição personalizada de macros por refeição
}

interface NutritionContextType {
  nutritionInfo: NutritionInfo;
  updateNutritionInfo: (info: Partial<NutritionInfo>) => void;
  calculateMacros: () => void;
  saveNutritionInfo: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetNutritionInfo: () => void;
  isOnline: boolean;
  syncPendingData: () => Promise<any>;
  saveOnboardingStep: (step: string) => Promise<void>;
  getOnboardingStep: () => Promise<string | null>;
  getWeightHistory: () => WeightHistoryEntry[];
  saveCustomMealDistribution: (
    distribution: CustomMealDistribution[]
  ) => Promise<void>;
  resetCustomMealDistribution: () => Promise<void>;
  updateCustomMealDistributionWhenMealTypesChange: (
    currentMealTypeIds: string[]
  ) => Promise<void>;
  currentWaterIntake: number;
  addWater: (amount?: number) => void;
  removeWater: (amount?: number) => void;
  dailyWaterGoal: number;
  waterHistory: WaterHistoryType;
}

const NutritionContext = createContext<NutritionContextType | undefined>(
  undefined
);

export const useNutrition = () => {
  const context = useContext(NutritionContext);
  if (!context) {
    throw new Error("useNutrition must be used within a NutritionProvider");
  }
  return context;
};

interface NutritionProviderProps {
  children: ReactNode;
}

const initialNutritionInfo: NutritionInfo = {
  height: undefined,
  weight: undefined,
  targetWeight: undefined,
  goal: undefined,
  weightChangeRate: undefined,
  dietType: undefined,
  activityLevel: undefined,
  macros: undefined,
  meals: undefined,
  waterIntake: 0,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  weightHistory: [], // Explicitamente inicializado como array vazio
};

export const NutritionProvider = ({ children }: NutritionProviderProps) => {
  const { t } = useTranslation();
  const [nutritionInfo, setNutritionInfo] =
    useState<NutritionInfo>(initialNutritionInfo);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const { user, isNewUser, registrationCompleted } = useAuth();

  // Novo estado para o consumo atual de água
  const [currentWaterIntake, setCurrentWaterIntake] = useState(0);
  // Estado para saber se a meta de água foi atingida hoje
  const [goalMetToday, setGoalMetToday] = useState(false);
  // Novo estado para o histórico de água
  const [waterHistory, setWaterHistory] = useState<{ [date: string]: number }>(
    {}
  );

  // Definição do tamanho do copo padrão
  const CUP_SIZE = 250;

  // Calcular meta diária de água (usar valor do nutritionInfo ou padrão)
  const dailyWaterGoal = useMemo(() => {
    return nutritionInfo.waterIntake || 2000; // Padrão 2000ml se não definido
  }, [nutritionInfo.waterIntake]);

  // Função para obter a chave de armazenamento de água para uma data
  const getWaterStorageKeyForDate = useCallback(
    (date: string) => {
      if (!user) return null;
      return `${KEYS.WATER_INTAKE}_${user.uid}_${date}`;
    },
    [user]
  );

  // Função para carregar histórico de água (últimos 14 dias)
  const loadWaterHistory = useCallback(async () => {
    if (!user) return;
    const today = new Date();
    const history: { [date: string]: number } = {};
    try {
      for (let i = 0; i < 14; i++) {
        const checkDate = subDays(today, i);
        const dateStr = format(checkDate, "yyyy-MM-dd");
        const storageKey = getWaterStorageKeyForDate(dateStr);
        if (storageKey) {
          const data = await AsyncStorage.getItem(storageKey);
          if (data) {
            history[dateStr] = JSON.parse(data);
          }
        }
      }
      setWaterHistory(history);
    } catch (error) {
      console.error("Erro ao carregar histórico de água:", error);
      setWaterHistory({}); // Resetar em caso de erro
    }
  }, [user, getWaterStorageKeyForDate]);

  // Função para carregar consumo de água do dia
  const loadCurrentWaterIntake = useCallback(async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const storageKey = getWaterStorageKeyForDate(today);
    if (!storageKey) return;

    try {
      const data = await AsyncStorage.getItem(storageKey);
      if (data) {
        const savedIntake = JSON.parse(data);
        setCurrentWaterIntake(savedIntake);
        // Verifica se a meta já estava atingida ao carregar
        if (savedIntake >= dailyWaterGoal) {
          setGoalMetToday(true);
        }
      } else {
        setCurrentWaterIntake(0); // Começa do zero se não houver dados
      }

      // Verifica também o último dia registrado de meta batida
      const lastWaterGoalDayKey = `${KEYS.LAST_WATER_GOAL_DAY}_${user?.uid}`;
      const lastWaterGoalDay = await AsyncStorage.getItem(lastWaterGoalDayKey);
      if (lastWaterGoalDay === today && !goalMetToday) {
        setGoalMetToday(true);
      }
    } catch (error) {
      console.error("Erro ao carregar consumo de água:", error);
      setCurrentWaterIntake(0);
    }
  }, [user, getWaterStorageKeyForDate, dailyWaterGoal, goalMetToday]);

  // Carregar dados de água quando o usuário muda ou o dia muda (implícito pela chave)
  useEffect(() => {
    if (user) {
      loadCurrentWaterIntake();
      // Carregar histórico também
      loadWaterHistory();
    }
  }, [user, loadCurrentWaterIntake, loadWaterHistory]);

  // Verificar e resetar goalMetToday se for um novo dia
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const lastWaterGoalDayKey = `${KEYS.LAST_WATER_GOAL_DAY}_${user?.uid}`;
      const lastWaterGoalDay = await AsyncStorage.getItem(lastWaterGoalDayKey);
      if (lastWaterGoalDay !== today && goalMetToday) {
        setGoalMetToday(false);
      }
      // Recarrega a água caso o dia tenha mudado e o app ficou aberto
      const storageKey = getWaterStorageKeyForDate(today);
      const data = await AsyncStorage.getItem(storageKey || "");
      if (!data && currentWaterIntake !== 0) {
        setCurrentWaterIntake(0);
      }
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(intervalId);
  }, [user, goalMetToday, getWaterStorageKeyForDate, currentWaterIntake]);

  // Função para verificar conquistas de água (agora só gerencia AsyncStorage)
  const checkWaterAchievement = useCallback(async () => {
    if (!user) return;

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const waterGoalDaysKey = `${KEYS.WATER_GOAL_DAYS}_${user.uid}`;
      const lastWaterGoalDayKey = `${KEYS.LAST_WATER_GOAL_DAY}_${user.uid}`;

      const lastWaterGoalDay = await AsyncStorage.getItem(lastWaterGoalDayKey);

      // Se já atingimos a meta hoje E já registramos isso, não fazer nada
      if (lastWaterGoalDay === today) return;

      // Salvar o dia atual como último dia em que a meta foi atingida
      await AsyncStorage.setItem(lastWaterGoalDayKey, today);
      setGoalMetToday(true); // Garante que o estado local está sincronizado

      // Calcular novo valor para dias totais com meta atingida
      const storedWaterGoalDays = await AsyncStorage.getItem(waterGoalDaysKey);
      const currentWaterGoalDays = storedWaterGoalDays
        ? parseInt(storedWaterGoalDays)
        : 0;
      const newWaterGoalDays = currentWaterGoalDays + 1;

      await AsyncStorage.setItem(waterGoalDaysKey, newWaterGoalDays.toString());

      // REMOVIDO: Chamada para atualizar progresso da conquista
      // await updateAchievementProgress("water_intake", newWaterGoalDays, true);
    } catch (error) {
      console.error("Erro ao verificar/salvar dados de meta de água:", error);
    }
    // Remover updateAchievementProgress das dependências
  }, [user]);

  // Função para salvar o consumo atual de água
  const saveCurrentWaterIntake = useCallback(
    async (intake: number) => {
      const today = format(new Date(), "yyyy-MM-dd");
      const storageKey = getWaterStorageKeyForDate(today);
      if (!storageKey) return;

      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(intake));
        setCurrentWaterIntake(intake); // Atualiza o estado local
        // Atualizar também o histórico local para o dia atual
        setWaterHistory((prevHistory) => ({
          ...prevHistory,
          [today]: intake,
        }));

        // Verifica se atingiu a meta APÓS salvar
        if (intake >= dailyWaterGoal && !goalMetToday) {
          checkWaterAchievement();
        }
      } catch (error) {
        console.error("Erro ao salvar consumo de água:", error);
      }
    },
    [
      getWaterStorageKeyForDate,
      dailyWaterGoal,
      goalMetToday,
      checkWaterAchievement,
    ]
  );

  // Função para adicionar água
  const addWater = useCallback(
    (amount: number = CUP_SIZE) => {
      // Permitir adicionar mesmo se a meta foi ultrapassada
      const newIntake = currentWaterIntake + amount;
      saveCurrentWaterIntake(newIntake);
    },
    [currentWaterIntake, saveCurrentWaterIntake, CUP_SIZE]
  );

  // Função para remover água
  const removeWater = useCallback(
    (amount: number = CUP_SIZE) => {
      const newIntake = Math.max(0, currentWaterIntake - amount); // Não permite negativo
      saveCurrentWaterIntake(newIntake);
      // Se a ingestão cair abaixo da meta, resetar o flag goalMetToday
      // (embora o registro do dia já tenha sido feito na conquista)
      if (newIntake < dailyWaterGoal && goalMetToday) {
        // Potencialmente resetar goalMetToday aqui, mas pode causar re-contagem
        // Vamos manter simples por enquanto e só resetar no dia seguinte.
      }
    },
    [
      currentWaterIntake,
      saveCurrentWaterIntake,
      CUP_SIZE,
      dailyWaterGoal,
      goalMetToday,
    ]
  );

  // Efeito para recarregar dados quando o registro é concluído
  useEffect(() => {
    if (registrationCompleted && user) {
      loadUserData();
    }
  }, [registrationCompleted, user]);

  // Monitorar o estado da conexão
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const newOnlineState = state.isConnected === true;
      setIsOnline(newOnlineState);

      // Se a conexão foi restaurada, tentar sincronizar dados pendentes
      if (newOnlineState && user) {
        syncPendingData();
      }
    });

    // Verificar o estado inicial da conexão
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected === true);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Carregar dados quando o usuário mudar
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      // Quando o usuário sair, limpar completamente o estado
      resetNutritionInfo();
    }
  }, [user]);

  // Adicionar listener para sincronizar com mudanças nos tipos de refeições
  useEffect(() => {
    // Função para lidar com o evento de alteração de tipos de refeições
    const handleMealTypesChanged = (event: any) => {
      if (event && event.detail && Array.isArray(event.detail.mealTypeIds)) {
        // Chamar a função para atualizar a distribuição de refeições
        updateCustomMealDistributionWhenMealTypesChange(
          event.detail.mealTypeIds
        );
      }
    };

    // No React Native não temos acesso ao objeto document
    // Vamos usar uma abordagem diferente, registrando diretamente no MealContext
    // Em um componente separado ou usando EventEmitter

    // Remover a manipulação de eventos DOM
    // document.addEventListener("mealTypesChanged", handleMealTypesChanged);
    // return () => {
    //   document.removeEventListener("mealTypesChanged", handleMealTypesChanged);
    // };

    // Em vez disso, vamos exportar a função para ser chamada diretamente
    (global as any).updateNutritionMealTypes = (mealTypeIds: string[]) => {
      updateCustomMealDistributionWhenMealTypesChange(mealTypeIds);
    };

    return () => {
      // Limpar a função global quando o componente desmontar
      (global as any).updateNutritionMealTypes = undefined;
    };
  }, [nutritionInfo]); // Dependência em nutritionInfo para ter acesso ao valor mais recente

  // Função para carregar dados do usuário (do Firestore ou local)
  const loadUserData = async () => {
    if (!user) return;

    try {
      const isDeviceOnline = await OfflineStorage.isOnline();
      setIsOnline(isDeviceOnline);

      let userData = null;
      let useLocalData = false;

      // Primeiro, tentar carregar dados locais
      const offlineData = await OfflineStorage.loadNutritionData(user.uid);

      if (offlineData) {
        userData = offlineData;

        // Se os dados foram modificados localmente, usá-los independentemente dos dados do Firestore
        if (offlineData._isModifiedLocally) {
          useLocalData = true;
        }
      }

      // Se estiver online e não estiver usando dados locais modificados, verificar se há dados mais recentes no Firestore
      if (isDeviceOnline && !useLocalData) {
        try {
          const nutritionDoc = await getDoc(doc(db, "nutrition", user.uid));

          if (nutritionDoc.exists()) {
            const firestoreData = nutritionDoc.data() as NutritionInfo;

            // Verificar qual dado é mais recente
            if (
              !userData ||
              (firestoreData.updatedAt &&
                (!userData.updatedAt ||
                  new Date(firestoreData.updatedAt) >
                    new Date(userData.updatedAt)))
            ) {
              userData = firestoreData;

              // Salvar os dados mais recentes localmente
              await OfflineStorage.saveNutritionData(user.uid, firestoreData);

              // Limpar a flag de modificação local
              await AsyncStorage.removeItem(
                `${KEYS.NUTRITION_DATA}_${user.uid}_modified`
              );
            }
          }
        } catch (firestoreError) {
          // Erro ao carregar dados do Firestore
          // Continuar usando os dados locais se houver erro no Firestore
        }
      }

      // Se temos dados, processar e atualizar o estado
      if (userData) {
        // Garantir que um novo usuário tenha um histórico vazio
        if (isNewUser) {
          userData.weightHistory = []; // Inicializar com array vazio para novos usuários
        }

        // Converter timestamps para Date
        if (userData.birthDate && typeof userData.birthDate === "string") {
          userData.birthDate = new Date(userData.birthDate);
        }
        if (userData.targetDate && typeof userData.targetDate === "string") {
          userData.targetDate = new Date(userData.targetDate);
        }

        // Tentar carregar distribuição personalizada do AsyncStorage
        try {
          const distributionStr = await AsyncStorage.getItem(
            `${KEYS.CUSTOM_MEAL_DISTRIBUTION}_${user.uid}`
          );
          if (distributionStr) {
            userData.customMealDistribution = JSON.parse(distributionStr);
          }
        } catch (error) {
          // Erro ao carregar distribuição personalizada
        }

        setNutritionInfo(userData);
      } else if (isNewUser) {
        // Para um novo usuário sem dados, inicializar com valores padrão
        setNutritionInfo({
          ...initialNutritionInfo,
          weightHistory: [], // Garantir que o histórico comece vazio
        });
      }
    } catch (error) {
      // Erro ao carregar dados do usuário
    }
  };

  const updateNutritionInfo = async (info: Partial<NutritionInfo>) => {
    // Arredondar valores numéricos antes de atualizar
    const roundedInfo = { ...info };

    // Arredondar valores específicos
    if (roundedInfo.weight !== undefined) {
      roundedInfo.weight = roundNutritionValue(roundedInfo.weight, "weight");
    }
    if (roundedInfo.targetWeight !== undefined) {
      roundedInfo.targetWeight = roundNutritionValue(
        roundedInfo.targetWeight,
        "weight"
      );
    }
    if (roundedInfo.calories !== undefined) {
      roundedInfo.calories = roundNutritionValue(
        roundedInfo.calories,
        "calories"
      );
    }
    if (roundedInfo.protein !== undefined) {
      roundedInfo.protein = roundNutritionValue(roundedInfo.protein, "macros");
    }
    if (roundedInfo.carbs !== undefined) {
      roundedInfo.carbs = roundNutritionValue(roundedInfo.carbs, "macros");
    }
    if (roundedInfo.fat !== undefined) {
      roundedInfo.fat = roundNutritionValue(roundedInfo.fat, "macros");
    }
    if (roundedInfo.waterIntake !== undefined) {
      roundedInfo.waterIntake = roundNutritionValue(
        roundedInfo.waterIntake,
        "water"
      );
    }

    // Criar uma cópia do estado atual para evitar problemas de referência
    const updatedInfo = { ...nutritionInfo, ...roundedInfo };

    // Se o peso foi atualizado, adicionar ao histórico de peso
    if (info.weight && info.weight !== nutritionInfo.weight) {
      const newWeightEntry: WeightHistoryEntry = {
        date: new Date().toISOString(),
        weight: roundedInfo.weight as number, // Type assertion para corrigir erro do linter
      };

      // Verificar se este é um novo usuário ou a primeira entrada de peso
      const isFirstWeightEntry =
        isNewUser ||
        !updatedInfo.weightHistory ||
        updatedInfo.weightHistory.length === 0;

      if (isFirstWeightEntry) {
        updatedInfo.weightHistory = [newWeightEntry];
      } else {
        // Verificar se o último peso é diferente para evitar entradas duplicadas
        const lastEntry = updatedInfo.weightHistory?.[0];
        if (!lastEntry || lastEntry.weight !== roundedInfo.weight) {
          updatedInfo.weightHistory = [
            newWeightEntry,
            ...(updatedInfo.weightHistory || []),
          ];
        }
      }
    }

    // Atualizar o estado com os novos valores
    setNutritionInfo(updatedInfo);

    if (user) {
      try {
        if (user.isAnonymous) {
          // Para usuários anônimos, salvar temporariamente
          await OfflineStorage.saveTemporaryNutritionData(updatedInfo);
        } else {
          // Para usuários autenticados, salvar localmente
          await OfflineStorage.saveNutritionData(user.uid, updatedInfo);
        }
      } catch (error) {
        throw error;
      }
    }

    return updatedInfo;
  };

  // Função para resetar as informações de nutrição
  const resetNutritionInfo = async () => {
    // Garantir que o histórico de peso seja explicitamente limpo
    setNutritionInfo({
      ...initialNutritionInfo,
      weightHistory: [], // Garantir que o histórico seja explicitamente vazio
    });

    if (user) {
      await OfflineStorage.clearUserData(user.uid);
    }
  };

  // Função para calcular idade precisa em anos (incluindo meses)
  const calculatePreciseAge = (birthDate: Date | string): number => {
    const birthDateObj =
      birthDate instanceof Date ? birthDate : new Date(birthDate);
    const today = new Date();
    const monthsDiff =
      (today.getFullYear() - birthDateObj.getFullYear()) * 12 +
      (today.getMonth() - birthDateObj.getMonth());
    return Math.round((monthsDiff / 12) * 10) / 10; // Arredonda para 1 casa decimal
  };

  // Função para ajustar macros baseado no tipo de dieta
  const adjustMacrosByDiet = (
    protein: number,
    fat: number,
    carbs: number,
    dietType: DietType,
    targetCalories: number
  ) => {
    // Calcular a distribuição original em percentuais
    const originalProteinPercentage = ((protein * 4) / targetCalories) * 100;
    const originalFatPercentage = ((fat * 9) / targetCalories) * 100;
    const originalCarbsPercentage = ((carbs * 4) / targetCalories) * 100;

    switch (dietType) {
      case "vegan":
      case "vegetarian":
        // Para dietas vegetarianas/veganas, mantemos 40C/30P/30F mas ajustamos as fontes
        // Enfatizamos mais carboidratos complexos e aumentamos proteína para compensar biodisponibilidade
        return {
          // Mantemos a mesma distribuição mas com um pequeno ajuste para compensar biodisponibilidade
          protein: roundNutritionValue((targetCalories * 0.3) / 4, "macros"),
          fat: roundNutritionValue((targetCalories * 0.3) / 9, "macros"),
          carbs: roundNutritionValue((targetCalories * 0.4) / 4, "macros"),
        };
      case "pescatarian":
        // Para pescatarianos, mantemos a proporção, mas com ênfase em gorduras boas (ômega 3)
        return {
          protein: roundNutritionValue((targetCalories * 0.3) / 4, "macros"),
          fat: roundNutritionValue((targetCalories * 0.3) / 9, "macros"),
          carbs: roundNutritionValue((targetCalories * 0.4) / 4, "macros"),
        };
      default:
        // Para dieta clássica, simplesmente retornamos a proporção original
        return {
          protein: roundNutritionValue((targetCalories * 0.3) / 4, "macros"),
          fat: roundNutritionValue((targetCalories * 0.3) / 9, "macros"),
          carbs: roundNutritionValue((targetCalories * 0.4) / 4, "macros"),
        };
    }
  };

  // Função para calcular progressão calórica
  const calculateCalorieProgression = (
    maintenanceCalories: number,
    goal: Goal,
    weekNumber: number = 1
  ): number => {
    const maxAdjustment = 300; // Ajuste máximo de calorias
    const weeksToMax = 3; // Número de semanas até atingir o ajuste máximo

    if (goal === "maintain") return maintenanceCalories;

    const adjustmentPerWeek = maxAdjustment / weeksToMax;
    const currentAdjustment = Math.min(
      adjustmentPerWeek * weekNumber,
      maxAdjustment
    );

    return goal === "lose"
      ? maintenanceCalories - currentAdjustment
      : maintenanceCalories + currentAdjustment;
  };

  const calculateHealthScore = (info: NutritionInfo): number => {
    let score = 5; // Pontuação base

    // 1. Peso saudável (IMC entre 18.5 e 24.9)
    if (info.height && info.weight) {
      const heightInMeters = info.height / 100;
      const bmi = info.weight / (heightInMeters * heightInMeters);
      if (bmi >= 18.5 && bmi <= 24.9) score += 1;
      else if (bmi >= 17 && bmi <= 29.9) score += 0.5;
    }

    // 2. Nível de atividade física
    switch (info.trainingFrequency) {
      case "sedentary":
        score += 0;
        break;
      case "light":
        score += 0.5;
        break;
      case "moderate":
        score += 1;
        break;
      case "intense":
      case "athlete":
        score += 1.5;
        break;
    }

    // 3. Dieta balanceada
    switch (info.dietType) {
      case "classic":
      case "pescatarian":
        score += 1;
        break;
      case "vegetarian":
      case "vegan":
        score += 1.5; // Bonus para dietas plant-based
        break;
    }

    // 4. Metas realistas
    if (info.goal && info.weightChangeRate) {
      if (info.goal === "maintain") {
        score += 1;
      } else {
        // Para perda/ganho de peso, valorizar taxas moderadas
        if (info.weightChangeRate <= 0.5) score += 1;
        else if (info.weightChangeRate <= 0.8) score += 0.5;
      }
    }

    // Normalizar para escala 0-10
    return Math.min(Math.max(Math.round(score * 10) / 10, 0), 10);
  };

  const calculateWaterIntake = (info: NutritionInfo): number => {
    if (!info.weight || !info.trainingFrequency) return 0;

    // Base: 35ml por kg de peso corporal
    let waterBase = info.weight * 35;

    // Ajuste baseado no nível de atividade
    const activityMultiplier = {
      sedentary: 1,
      light: 1.1,
      moderate: 1.2,
      intense: 1.3,
      athlete: 1.4,
    }[info.trainingFrequency];

    waterBase *= activityMultiplier;

    // Ajuste para clima (poderia ser dinâmico baseado na localização)
    const climateMultiplier = 1.1; // Assumindo clima moderado
    waterBase *= climateMultiplier;

    // Usar a função de arredondamento para valores de água
    return roundNutritionValue(waterBase, "water");
  };

  const calculateMacros = () => {
    try {
      const {
        gender,
        trainingFrequency,
        birthDate,
        height,
        weight,
        goal,
        weightChangeRate = goal === "maintain" ? 0 : 0.5, // Valor padrão com base no objetivo
        dietType = "classic",
        targetWeight,
      } = nutritionInfo;

      if (
        !gender ||
        !trainingFrequency ||
        !birthDate ||
        !height ||
        !weight ||
        !goal
      ) {
        return;
      }

      // Garantir que temos um peso alvo para cálculos, usar o peso atual para "maintain"
      const effectiveTargetWeight = targetWeight || weight;

      // Calcular idade precisa
      const preciseAge = calculatePreciseAge(birthDate);

      // Calcular BMR usando Mifflin-St Jeor
      let bmr = 0;
      if (gender === "male") {
        bmr = 10 * weight + 6.25 * height - 5 * preciseAge + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * preciseAge - 161;
      }

      // Fator de atividade ajustado para ser mais conservador
      let activityFactor = 1.2;
      switch (trainingFrequency) {
        case "sedentary":
          activityFactor = 1.2;
          break;
        case "light":
          activityFactor = 1.3;
          break;
        case "moderate":
          activityFactor = 1.45;
          break;
        case "intense":
          activityFactor = 1.6;
          break;
        case "athlete":
          activityFactor = 1.75;
          break;
      }

      // TDEE (Total Daily Energy Expenditure)
      const maintenanceCalories = roundNutritionValue(
        bmr * activityFactor,
        "calories"
      );

      // Ajuste calórico baseado no objetivo
      let targetCalories = maintenanceCalories;
      if (goal === "lose") {
        // Déficit de 20-25% para cutting
        targetCalories = roundNutritionValue(
          maintenanceCalories * 0.8,
          "calories"
        );
      } else if (goal === "gain") {
        // Superávit de 10-15% para bulking
        targetCalories = roundNutritionValue(
          maintenanceCalories * 1.1,
          "calories"
        );
      }

      // Usar distribuição fixa de macros 40C/30P/30F
      // Distribuição exata independente do objetivo
      const carbsPercentage = 40;
      const proteinPercentage = 30;
      const fatPercentage = 30;

      // Cálculo em gramas usando a distribuição de porcentagem
      let carbs = roundNutritionValue(
        (targetCalories * (carbsPercentage / 100)) / 4,
        "macros"
      );
      let protein = roundNutritionValue(
        (targetCalories * (proteinPercentage / 100)) / 4,
        "macros"
      );
      let fat = roundNutritionValue(
        (targetCalories * (fatPercentage / 100)) / 9,
        "macros"
      );

      // Ajuste final para macros
      const adjustedMacros = adjustMacrosByDiet(
        protein,
        fat,
        carbs,
        dietType,
        targetCalories
      );

      // Calcular data alvo
      let targetDate = new Date();
      if (goal !== "maintain" && effectiveTargetWeight !== weight) {
        const actualWeightChangeRate = weightChangeRate || 0.5; // Garantir que temos um valor
        const weeksToGoal =
          Math.abs(weight - effectiveTargetWeight) / actualWeightChangeRate;
        targetDate.setDate(targetDate.getDate() + Math.round(weeksToGoal * 7));
      } else {
        // Para manutenção, definir data alvo como 3 meses a partir de hoje
        targetDate.setMonth(targetDate.getMonth() + 3);
      }

      // Adicionar cálculo de Water Intake
      const waterIntake = calculateWaterIntake(nutritionInfo);

      // Atualizar o estado com os novos valores
      updateNutritionInfo({
        calories: targetCalories,
        protein: adjustedMacros.protein,
        carbs: adjustedMacros.carbs,
        fat: adjustedMacros.fat,
        targetDate,
        waterIntake,
        activityLevel: trainingFrequency,
        // Para "maintain", definir explicitamente targetWeight igual ao peso atual se não definido
        ...(goal === "maintain" && !targetWeight
          ? { targetWeight: weight }
          : {}),
      });
    } catch (error) {
      // Valores padrão em caso de erro
      updateNutritionInfo({
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 65,
        waterIntake: 2000,
      });
    }
  };

  // Função para salvar as informações de nutrição no Firebase
  const saveNutritionInfo = async (): Promise<void> => {
    if (!user) {
      return;
    }

    try {
      // Verificar se está online
      const online = await OfflineStorage.isOnline();

      // Carregar os dados mais recentes do armazenamento local
      let currentData = { ...nutritionInfo };

      try {
        const localData = await OfflineStorage.loadNutritionData(user.uid);
        if (localData && localData._isModifiedLocally) {
          // Remover a flag interna antes de salvar
          delete localData._isModifiedLocally;
          currentData = localData;
        }
      } catch (localError) {
        // Erro ao carregar dados locais
      }

      // Preparar os dados para salvar, tratando as datas com segurança
      const preparedData = { ...currentData };

      // Tratar birthDate com segurança
      if (preparedData.birthDate) {
        if (preparedData.birthDate instanceof Date) {
          preparedData.birthDate = preparedData.birthDate.toISOString();
        } else if (typeof preparedData.birthDate === "string") {
          // Já é uma string, manter como está
        } else {
          // Tipo desconhecido, converter para null
          preparedData.birthDate = null;
        }
      } else {
        preparedData.birthDate = null;
      }

      // Tratar targetDate com segurança
      if (preparedData.targetDate) {
        if (preparedData.targetDate instanceof Date) {
          preparedData.targetDate = preparedData.targetDate.toISOString();
        } else if (typeof preparedData.targetDate === "string") {
          // Já é uma string, manter como está
        } else {
          // Tipo desconhecido, converter para null
          preparedData.targetDate = null;
        }
      } else {
        preparedData.targetDate = null;
      }

      // Adicionar timestamp de atualização
      preparedData.updatedAt = new Date().toISOString();

      // Remover campos undefined
      const nutritionData = Object.entries(preparedData).reduce<
        Record<string, any>
      >((acc, [key, value]) => {
        // Não incluir campos com valor undefined
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      if (online) {
        // Salvar no Firestore se estiver online
        await setDoc(doc(db, "nutrition", user.uid), nutritionData);

        // Também salvar localmente para acesso offline
        await OfflineStorage.saveNutritionData(user.uid, nutritionData);

        // Limpar a flag de modificação local após salvar no Firestore
        await AsyncStorage.removeItem(
          `${KEYS.NUTRITION_DATA}_${user.uid}_modified`
        );
      } else {
        // Se estiver offline, salvar localmente e adicionar à fila de operações pendentes
        await OfflineStorage.saveNutritionData(user.uid, nutritionData);

        // Adicionar operação pendente
        const pendingOp: PendingOperation = {
          id: uuidv4(),
          type: "update",
          collection: "nutrition",
          data: { ...nutritionData, id: user.uid },
          timestamp: Date.now(),
        };

        await OfflineStorage.addPendingOperation(pendingOp);
      }

      // Atualizar o estado com os dados salvos
      setNutritionInfo((prev) => {
        // Converter as datas de volta para objetos Date
        const updatedData = { ...nutritionData };
        if (
          updatedData.birthDate &&
          typeof updatedData.birthDate === "string"
        ) {
          try {
            updatedData.birthDate = new Date(updatedData.birthDate);
          } catch (e) {
            updatedData.birthDate = undefined;
          }
        }
        if (
          updatedData.targetDate &&
          typeof updatedData.targetDate === "string"
        ) {
          try {
            updatedData.targetDate = new Date(updatedData.targetDate);
          } catch (e) {
            updatedData.targetDate = undefined;
          }
        }
        return updatedData;
      });
    } catch (error) {
      throw error;
    }
  };

  // Função para marcar o onboarding como concluído
  const completeOnboarding = async () => {
    if (!user) {
      return;
    }

    try {
      // Verificar se está online
      const online = await OfflineStorage.isOnline();

      // Salvar as informações de nutrição
      await saveNutritionInfo();

      if (online) {
        // Atualizar o documento do usuário para marcar o onboarding como concluído
        await setDoc(
          doc(db, "users", user.uid),
          {
            onboardingCompleted: true,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        // Salvar status localmente também
        await OfflineStorage.saveOnboardingStatus(user.uid, true);
      } else {
        // Se estiver offline, marcar localmente que o onboarding foi concluído
        await OfflineStorage.saveOnboardingStatus(user.uid, true);

        // Adicionar operação pendente
        const pendingOp: PendingOperation = {
          id: uuidv4(),
          type: "update",
          collection: "users",
          data: {
            id: user.uid,
            onboardingCompleted: true,
            updatedAt: new Date().toISOString(),
          },
          timestamp: Date.now(),
        };

        await OfflineStorage.addPendingOperation(pendingOp);
      }
    } catch (error) {
      throw error;
    }
  };

  // Função para sincronizar dados pendentes quando o dispositivo estiver online
  const syncPendingData = async () => {
    if (!user) return;

    try {
      // Usar o novo SyncService para sincronizar os dados pendentes
      const syncResult = await SyncService.syncAll();

      return syncResult;
    } catch (error) {
      // Não propagar o erro para não interromper a experiência do usuário
    }
  };

  // Funções para gerenciar o passo atual do onboarding
  const saveOnboardingStep = async (step: string) => {
    await OfflineStorage.saveOnboardingStep(step);
  };

  const getOnboardingStep = async () => {
    return await OfflineStorage.getOnboardingStep();
  };

  // Função para obter o histórico de peso
  const getWeightHistory = () => {
    // Garantir que sempre retornamos um array válido
    if (!nutritionInfo || !Array.isArray(nutritionInfo.weightHistory)) {
      return [];
    }
    return nutritionInfo.weightHistory;
  };

  // Função para salvar a distribuição personalizada de refeições
  const saveCustomMealDistribution = async (
    distribution: CustomMealDistribution[]
  ) => {
    if (!user) return;

    try {
      // Atualizar o estado local
      const updatedInfo = {
        ...nutritionInfo,
        customMealDistribution: distribution,
      };
      setNutritionInfo(updatedInfo);

      // Salvar no AsyncStorage
      await AsyncStorage.setItem(
        `${KEYS.CUSTOM_MEAL_DISTRIBUTION}_${user.uid}`,
        JSON.stringify(distribution)
      );

      // Se estiver online, salvar no Firestore
      const online = await OfflineStorage.isOnline();
      if (online) {
        try {
          await setDoc(
            doc(db, "nutrition", user.uid),
            {
              customMealDistribution: distribution,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (firebaseError) {
          // Erro ao salvar no Firebase
        }
      } else {
        // Adicionar operação pendente
        const pendingOp: PendingOperation = {
          id: uuidv4(),
          type: "update",
          collection: "nutrition",
          data: {
            id: user.uid,
            customMealDistribution: distribution,
            updatedAt: new Date().toISOString(),
          },
          timestamp: Date.now(),
        };

        await OfflineStorage.addPendingOperation(pendingOp);
      }
    } catch (error) {
      throw error;
    }
  };

  // Função para resetar a distribuição personalizada de refeições
  const resetCustomMealDistribution = async () => {
    if (!user) return;

    try {
      // Atualizar o estado local
      const updatedInfo = { ...nutritionInfo };
      delete updatedInfo.customMealDistribution;
      setNutritionInfo(updatedInfo);

      // Remover do AsyncStorage
      await AsyncStorage.removeItem(
        `${KEYS.CUSTOM_MEAL_DISTRIBUTION}_${user.uid}`
      );

      // Se estiver online, atualizar no Firestore
      const online = await OfflineStorage.isOnline();
      if (online) {
        try {
          await setDoc(
            doc(db, "nutrition", user.uid),
            {
              customMealDistribution: null,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (firebaseError) {
          // Erro ao salvar no Firebase
        }
      } else {
        // Adicionar operação pendente
        const pendingOp: PendingOperation = {
          id: uuidv4(),
          type: "update",
          collection: "nutrition",
          data: {
            id: user.uid,
            customMealDistribution: null,
            updatedAt: new Date().toISOString(),
          },
          timestamp: Date.now(),
        };

        await OfflineStorage.addPendingOperation(pendingOp);
      }
    } catch (error) {
      throw error;
    }
  };

  // Nova função para atualizar a distribuição de refeições quando os tipos de refeições mudam
  const updateCustomMealDistributionWhenMealTypesChange = async (
    currentMealTypeIds: string[]
  ) => {
    if (!user) return;

    try {
      // Verificar se existe uma distribuição personalizada
      if (
        !nutritionInfo.customMealDistribution ||
        nutritionInfo.customMealDistribution.length === 0
      ) {
        return;
      }

      // Criar um set com os IDs das refeições atuais para busca eficiente
      const currentMealIds = new Set(currentMealTypeIds);

      // Filtrar apenas as refeições que ainda existem
      const validCustomDistribution =
        nutritionInfo.customMealDistribution.filter((dist) =>
          currentMealIds.has(dist.mealId)
        );

      // Se após a filtragem a quantidade de refeições mudou, precisamos atualizar
      if (
        validCustomDistribution.length !==
        nutritionInfo.customMealDistribution.length
      ) {
        // Verificar se ainda temos distribuições válidas
        if (validCustomDistribution.length === 0) {
          // Se não sobrou nenhuma configuração válida, resetar completamente
          await resetCustomMealDistribution();
        } else {
          // Abordagem 1: Redistribuir proporcionalmente para manter a proporção relativa entre as refeições restantes

          // Calcular a soma dos percentuais das refeições válidas
          const totalValidPercentage = validCustomDistribution.reduce(
            (sum, dist) => sum + dist.percentage,
            0
          );

          // Redistribuir os percentuais para somar 100%
          const adjustedDistribution = validCustomDistribution.map((dist) => {
            // Calcular a proporção relativa de cada refeição
            const proportion = dist.percentage / totalValidPercentage;

            // Aplicar a proporção para reajustar para o total de 100%
            const adjustedPercentage = Math.round(proportion * 100);

            return {
              ...dist,
              percentage: adjustedPercentage,
            };
          });

          // Verificar se o total está exatamente em 100% após o arredondamento
          const adjustedTotal = adjustedDistribution.reduce(
            (sum, dist) => sum + dist.percentage,
            0
          );

          // Ajustar a primeira refeição para garantir que somem exatamente 100%
          if (adjustedTotal !== 100 && adjustedDistribution.length > 0) {
            const diff = 100 - adjustedTotal;
            adjustedDistribution[0].percentage += diff;
          }

          // Salvar a distribuição ajustada
          await saveCustomMealDistribution(adjustedDistribution);
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar distribuição de refeições:", error);
    }
  };

  return (
    <NutritionContext.Provider
      value={{
        nutritionInfo,
        updateNutritionInfo,
        calculateMacros,
        saveNutritionInfo,
        completeOnboarding,
        resetNutritionInfo,
        isOnline,
        syncPendingData,
        saveOnboardingStep,
        getOnboardingStep,
        getWeightHistory,
        saveCustomMealDistribution,
        resetCustomMealDistribution,
        updateCustomMealDistributionWhenMealTypesChange,
        currentWaterIntake,
        addWater,
        removeWater,
        dailyWaterGoal,
        waterHistory,
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
};
