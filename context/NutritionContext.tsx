import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
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
};

// Função utilitária para arredondar valores nutricionais
const roundNutritionValue = (value: number, type: 'calories' | 'macros' | 'water' | 'weight' = 'macros'): number => {
  if (value === undefined || value === null || isNaN(value)) return 0;
  
  switch (type) {
    case 'calories':
      // Arredondar calorias para múltiplos de 50
      return Math.round(value / 50) * 50;
    case 'macros':
      // Arredondar macronutrientes para inteiros
      return Math.round(value);
    case 'water':
      // Arredondar água para múltiplos de 50ml
      return Math.round(value / 50) * 50;
    case 'weight':
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
      console.log(
        "[NutritionContext] Usuário saiu, limpando histórico e dados"
      );
      resetNutritionInfo();
    }
  }, [user]);

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
          console.log(
            "[NutritionContext] Novo usuário detectado, inicializando histórico de peso vazio"
          );
          userData.weightHistory = []; // Inicializar com array vazio para novos usuários
        }

        // Converter timestamps para Date
        if (userData.birthDate && typeof userData.birthDate === "string") {
          userData.birthDate = new Date(userData.birthDate);
        }
        if (userData.targetDate && typeof userData.targetDate === "string") {
          userData.targetDate = new Date(userData.targetDate);
        }

        setNutritionInfo(userData);
      } else if (isNewUser) {
        // Para um novo usuário sem dados, inicializar com valores padrão
        console.log(
          "[NutritionContext] Novo usuário sem dados, inicializando valores padrão"
        );
        setNutritionInfo({
          ...initialNutritionInfo,
          weightHistory: [], // Garantir que o histórico comece vazio
        });
      }
    } catch (error) {
      // Erro ao carregar dados do usuário
      console.error("[NutritionContext] Erro ao carregar dados:", error);
    }
  };

  const updateNutritionInfo = async (info: Partial<NutritionInfo>) => {
    // Arredondar valores numéricos antes de atualizar
    const roundedInfo = { ...info };
    
    // Arredondar valores específicos
    if (roundedInfo.weight !== undefined) {
      roundedInfo.weight = roundNutritionValue(roundedInfo.weight, 'weight');
    }
    if (roundedInfo.targetWeight !== undefined) {
      roundedInfo.targetWeight = roundNutritionValue(roundedInfo.targetWeight, 'weight');
    }
    if (roundedInfo.calories !== undefined) {
      roundedInfo.calories = roundNutritionValue(roundedInfo.calories, 'calories');
    }
    if (roundedInfo.protein !== undefined) {
      roundedInfo.protein = roundNutritionValue(roundedInfo.protein, 'macros');
    }
    if (roundedInfo.carbs !== undefined) {
      roundedInfo.carbs = roundNutritionValue(roundedInfo.carbs, 'macros');
    }
    if (roundedInfo.fat !== undefined) {
      roundedInfo.fat = roundNutritionValue(roundedInfo.fat, 'macros');
    }
    if (roundedInfo.waterIntake !== undefined) {
      roundedInfo.waterIntake = roundNutritionValue(roundedInfo.waterIntake, 'water');
    }
    
    // Criar uma cópia do estado atual para evitar problemas de referência
    const updatedInfo = { ...nutritionInfo, ...roundedInfo };

    // Se o peso foi atualizado, adicionar ao histórico de peso
    if (info.weight && info.weight !== nutritionInfo.weight) {
      console.log(
        `[NutritionContext] Atualizando peso: ${nutritionInfo.weight} -> ${roundedInfo.weight}`
      );
      console.log(
        `[NutritionContext] isNewUser: ${isNewUser}, historicoAtual: ${
          nutritionInfo.weightHistory ? nutritionInfo.weightHistory.length : 0
        } entradas`
      );

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
        console.log(
          "[NutritionContext] Inicializando histórico de peso para novo usuário"
        );
        updatedInfo.weightHistory = [newWeightEntry];
      } else {
        // Verificar se o último peso é diferente para evitar entradas duplicadas
        const lastEntry = updatedInfo.weightHistory?.[0];
        if (!lastEntry || lastEntry.weight !== roundedInfo.weight) {
          console.log(
            "[NutritionContext] Adicionando nova entrada ao histórico de peso existente"
          );
          updatedInfo.weightHistory = [
            newWeightEntry,
            ...(updatedInfo.weightHistory || []),
          ];
        } else {
          console.log("[NutritionContext] Ignorando entrada duplicada de peso");
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
    const originalProteinPercentage = (protein * 4 / targetCalories) * 100;
    const originalFatPercentage = (fat * 9 / targetCalories) * 100;
    const originalCarbsPercentage = (carbs * 4 / targetCalories) * 100;

    switch (dietType) {
      case "vegan":
      case "vegetarian":
        // Para dietas vegetarianas/veganas, mantemos 40C/30P/30F mas ajustamos as fontes
        // Enfatizamos mais carboidratos complexos e aumentamos proteína para compensar biodisponibilidade
        return {
          // Mantemos a mesma distribuição mas com um pequeno ajuste para compensar biodisponibilidade
          protein: roundNutritionValue((targetCalories * 0.30) / 4, 'macros'),
          fat: roundNutritionValue((targetCalories * 0.30) / 9, 'macros'),
          carbs: roundNutritionValue((targetCalories * 0.40) / 4, 'macros'),
        };
      case "pescatarian":
        // Para pescatarianos, mantemos a proporção, mas com ênfase em gorduras boas (ômega 3)
        return {
          protein: roundNutritionValue((targetCalories * 0.30) / 4, 'macros'),
          fat: roundNutritionValue((targetCalories * 0.30) / 9, 'macros'),
          carbs: roundNutritionValue((targetCalories * 0.40) / 4, 'macros'),
        };
      default:
        // Para dieta clássica, simplesmente retornamos a proporção original
        return { 
          protein: roundNutritionValue((targetCalories * 0.30) / 4, 'macros'),
          fat: roundNutritionValue((targetCalories * 0.30) / 9, 'macros'),
          carbs: roundNutritionValue((targetCalories * 0.40) / 4, 'macros'),
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
    return roundNutritionValue(waterBase, 'water');
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
        weightChangeRate,
        dietType = "classic",
      } = nutritionInfo;

      if (
        !gender ||
        !trainingFrequency ||
        !birthDate ||
        !height ||
        !weight ||
        !goal ||
        !weightChangeRate
      ) {
        console.warn("Dados insuficientes para calcular macros");
        return;
      }

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
      const maintenanceCalories = roundNutritionValue(bmr * activityFactor, 'calories');

      // Ajuste calórico baseado no objetivo
      let targetCalories = maintenanceCalories;
      if (goal === "lose") {
        // Déficit de 20-25% para cutting
        targetCalories = roundNutritionValue(maintenanceCalories * 0.8, 'calories');
      } else if (goal === "gain") {
        // Superávit de 10-15% para bulking
        targetCalories = roundNutritionValue(maintenanceCalories * 1.1, 'calories');
      }

      // Usar distribuição fixa de macros 40C/30P/30F
      // Distribuição exata independente do objetivo
      const carbsPercentage = 40;
      const proteinPercentage = 30;
      const fatPercentage = 30;

      // Cálculo em gramas usando a distribuição de porcentagem
      let carbs = roundNutritionValue((targetCalories * (carbsPercentage / 100)) / 4, 'macros');
      let protein = roundNutritionValue((targetCalories * (proteinPercentage / 100)) / 4, 'macros');
      let fat = roundNutritionValue((targetCalories * (fatPercentage / 100)) / 9, 'macros');

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
      if (goal !== "maintain") {
        const weeksToGoal =
          Math.abs(weight - (nutritionInfo.targetWeight || weight)) /
          weightChangeRate;
        targetDate.setDate(targetDate.getDate() + Math.round(weeksToGoal * 7));
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
      });
    } catch (error) {
      console.error("Erro ao calcular macros:", error);

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

      // Registrar resultados da sincronização (opcional)
      if (
        syncResult.pendingOps.syncedCount > 0 ||
        syncResult.meals.syncedDates.length > 0
      ) {
        console.log("Sincronização concluída com sucesso:", syncResult);
      }

      // Se houver erros, podemos registrá-los
      if (syncResult.errors.length > 0) {
        console.warn("Erros durante a sincronização:", syncResult.errors);
      }

      return syncResult;
    } catch (error) {
      console.error("Erro ao sincronizar dados pendentes:", error);
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
    return nutritionInfo.weightHistory || [];
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
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
};