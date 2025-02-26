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

export interface NutritionInfo {
  gender?: Gender;
  trainingFrequency?: TrainingFrequency;
  birthDate?: Date;
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
  targetDate?: Date;
  activityLevel?: ActivityLevel;
  macros?: MacroDistribution;
  meals?: number;
  waterIntake?: number;
  healthScore?: number;
}

interface NutritionContextType {
  nutritionInfo: NutritionInfo;
  updateNutritionInfo: (info: Partial<NutritionInfo>) => void;
  calculateMacros: () => void;
  saveNutritionInfo: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetNutritionInfo: () => void;
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
  healthScore: 0,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

export const NutritionProvider = ({ children }: NutritionProviderProps) => {
  const [nutritionInfo, setNutritionInfo] =
    useState<NutritionInfo>(initialNutritionInfo);
  const { user, isNewUser } = useAuth();

  // Resetar informações de nutrição quando o usuário mudar ou quando for um novo usuário
  useEffect(() => {
    if (user === null || isNewUser) {
      resetNutritionInfo();
    }
  }, [user, isNewUser]);

  const updateNutritionInfo = (info: Partial<NutritionInfo>) => {
    setNutritionInfo((prev) => ({ ...prev, ...info }));
  };

  // Função para resetar as informações de nutrição
  const resetNutritionInfo = () => {
    setNutritionInfo(initialNutritionInfo);
  };

  // Função para calcular idade precisa em anos (incluindo meses)
  const calculatePreciseAge = (birthDate: Date): number => {
    const today = new Date();
    const monthsDiff =
      (today.getFullYear() - birthDate.getFullYear()) * 12 +
      (today.getMonth() - birthDate.getMonth());
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
    switch (dietType) {
      case "vegan":
      case "vegetarian":
        // Aumenta proteína em 20% para compensar menor biodisponibilidade
        // Aumenta carboidratos e reduz gorduras
        return {
          protein: Math.round(protein * 1.2),
          fat: Math.round(fat * 0.9),
          carbs: Math.round(
            (targetCalories - protein * 1.2 * 4 - fat * 0.9 * 9) / 4
          ),
        };
      case "pescatarian":
        // Aumenta gorduras boas (ômega 3) e reduz carboidratos
        return {
          protein: protein,
          fat: Math.round(fat * 1.1),
          carbs: Math.round((targetCalories - protein * 4 - fat * 1.1 * 9) / 4),
        };
      default:
        return { protein, fat, carbs };
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

    // Arredondar para múltiplos de 100ml
    return Math.round(waterBase / 100) * 100;
  };

  const calculateMacros = () => {
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
    const maintenanceCalories = Math.round(bmr * activityFactor);

    // Ajuste calórico baseado no objetivo
    let targetCalories = maintenanceCalories;
    if (goal === "lose") {
      // Déficit de 20-25% para cutting
      targetCalories = Math.round(maintenanceCalories * 0.8);
    } else if (goal === "gain") {
      // Superávit de 10-15% para bulking
      targetCalories = Math.round(maintenanceCalories * 1.1);
    }

    // Cálculo de macros ajustado
    let proteinPerKg = 0;
    let fatPercentage = 0;

    if (goal === "lose") {
      proteinPerKg = 2.2; // Proteína alta para preservar massa magra
      fatPercentage = 25; // 25% das calorias
    } else if (goal === "gain") {
      proteinPerKg = 2.0;
      fatPercentage = 25;
    } else {
      proteinPerKg = 1.8;
      fatPercentage = 25;
    }

    // Cálculo em gramas
    let protein = Math.round(weight * proteinPerKg);
    let fat = Math.round((targetCalories * (fatPercentage / 100)) / 9);

    // Carboidratos preenchem o resto das calorias
    let carbs = Math.round((targetCalories - (protein * 4 + fat * 9)) / 4);

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

    // Adicionar cálculos de Health Score e Water Intake
    const healthScore = calculateHealthScore(nutritionInfo);
    const waterIntake = calculateWaterIntake(nutritionInfo);

    // Atualizar o estado com os novos valores
    updateNutritionInfo({
      calories: targetCalories,
      protein: adjustedMacros.protein,
      carbs: adjustedMacros.carbs,
      fat: adjustedMacros.fat,
      targetDate,
      healthScore,
      waterIntake,
      activityLevel: trainingFrequency,
    });
  };

  // Função para salvar as informações de nutrição no Firebase
  const saveNutritionInfo = async () => {
    if (!user) {
      console.error("Usuário não autenticado");
      return;
    }

    try {
      // Converter as datas para timestamps do Firestore e remover campos undefined
      const nutritionData = Object.entries({
        ...nutritionInfo,
        birthDate: nutritionInfo.birthDate
          ? nutritionInfo.birthDate.toISOString()
          : null,
        targetDate: nutritionInfo.targetDate
          ? nutritionInfo.targetDate.toISOString()
          : null,
        updatedAt: new Date().toISOString(),
      }).reduce<Record<string, any>>((acc, [key, value]) => {
        // Não incluir campos com valor undefined
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      // Salvar no Firestore
      await setDoc(doc(db, "nutrition", user.uid), nutritionData);
      console.log("Informações de nutrição salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar informações de nutrição:", error);
      throw error;
    }
  };

  // Função para marcar o onboarding como concluído
  const completeOnboarding = async () => {
    if (!user) {
      console.error("Usuário não autenticado");
      return;
    }

    try {
      // Salvar as informações de nutrição
      await saveNutritionInfo();

      // Atualizar o documento do usuário para marcar o onboarding como concluído
      await setDoc(
        doc(db, "users", user.uid),
        {
          onboardingCompleted: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      console.log("Onboarding concluído com sucesso!");
    } catch (error) {
      console.error("Erro ao concluir onboarding:", error);
      throw error;
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
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
};
