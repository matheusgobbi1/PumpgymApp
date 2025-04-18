import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";
import { KEYS } from "../constants/keys";
import { useWorkoutContext } from "./WorkoutContext";
import { useMeals } from "./MealContext";
import { useNutrition } from "./NutritionContext";
import * as Haptics from "expo-haptics";
import {
  Achievement,
  ACHIEVEMENTS,
  getAchievementById,
  getAchievementsByCategory,
  isAchievementUnlocked as isAchievementUnlockedUtil,
} from "../constants/achievementsDatabase";
import { debounce } from "lodash";
import {
  FitLevel,
  FIT_LEVELS,
  getCurrentFitLevel,
  getNextLevelProgress,
} from "../constants/fitLevelData";
import {
  format,
  isToday,
  isYesterday,
  differenceInDays,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isWithinInterval,
} from "date-fns";

// Tipos
export interface AchievementProgress {
  id: string;
  currentValue: number;
  lastUpdated: string;
  unlocked: boolean;
  viewed: boolean;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
  viewed: boolean;
}

export interface AchievementStats {
  totalAchievements: number;
  unlockedAchievements: number;
  totalPoints: number;
  earnedPoints: number;
  completionPercentage: number;
  // Adicionando estatísticas de FitPoints
  totalFitPoints: number;
  currentFitLevel: FitLevel;
  nextFitLevel: FitLevel | null;
  fitLevelProgress: number;
  fitPointsToNextLevel: number;
  // Adicionando estatística de Sequência
  currentStreak: number;
}

interface AchievementContextType {
  achievements: Achievement[];
  progress: Record<string, AchievementProgress>;
  recentlyUnlocked: UnlockedAchievement[];
  stats: AchievementStats;
  checkAchievements: () => Promise<void>;
  checkSpecificAchievement: (
    achievementType: string,
    value?: number
  ) => Promise<void>;
  markUnlockedAsViewed: (id: string) => Promise<void>;
  getAchievementProgress: (id: string) => AchievementProgress | null;
  isAchievementUnlocked: (id: string) => boolean;
  updateAchievementProgress: (
    id: string,
    newValue: number,
    forceCheck?: boolean
  ) => Promise<UnlockedAchievement | null>;
  isRecentlyUnlocked: (id: string) => boolean;
  // Funções para FitPoints
  getCurrentFitPoints: () => number;
  addFitPoints: (points: number) => Promise<void>;
  getAchievementValue: (id: string) => number;
  // --- DEBUG ONLY ---
  unlockAllAchievementsAndMaxLevel?: () => Promise<void>; // Função de debug
}

// Criar contexto
const AchievementContext = createContext<AchievementContextType | undefined>(
  undefined
);

// Hook para usar o contexto
export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error(
      "useAchievements deve ser usado dentro de um AchievementProvider"
    );
  }
  return context;
};

// Provedor do contexto
export const AchievementProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { workouts, getAvailableWorkoutTypes } = useWorkoutContext();
  const { meals, mealTypes, getDayTotals } = useMeals();
  const { nutritionInfo, currentWaterIntake, dailyWaterGoal } = useNutrition();

  const [achievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [progress, setProgress] = useState<Record<string, AchievementProgress>>(
    {}
  );
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<
    UnlockedAchievement[]
  >([]);
  // Estado para rastrear dias de meta de água atingida
  const [waterGoalDays, setWaterGoalDays] = useState<number>(0);
  // Estado para rastrear dias de meta calórica atingida
  const [caloricGoalDays, setCaloricGoalDays] = useState<number>(0);
  // NOVO: Estado para rastrear dias de meta de proteína atingida
  const [proteinGoalDays, setProteinGoalDays] = useState<number>(0);
  // NOVO: Estado para rastrear contagem de progressões aplicadas
  const [appliedProgressionCount, setAppliedProgressionCount] =
    useState<number>(0);
  // Estado para rastrear FitPoints
  const [fitPoints, setFitPoints] = useState<number>(0);
  // NOVO: Estado para rastrear Sequência de Atividade
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(null);

  // --- INÍCIO: Mover Definições de Funções Auxiliares para Cima ---

  // Função para verificar se uma conquista já foi desbloqueada
  const isAchievementUnlocked = (id: string): boolean => {
    return progress[id]?.unlocked ?? false;
  };

  // Função para obter o valor atual de uma conquista
  const getAchievementValue = (id: string): number => {
    return progress[id]?.currentValue ?? 0;
  };

  // Função para marcar conquista como visualizada
  const markUnlockedAsViewed = async (id: string) => {
    // Encontrar a conquista nos recentemente desbloqueados
    const unlocked = recentlyUnlocked.find(
      (item) => item.id === id && !item.viewed
    );

    if (unlocked) {
      // Marcar como visualizada
      unlocked.viewed = true;

      // Atualizar o progresso
      if (progress[id]) {
        progress[id].viewed = true;
      }

      // Salvar
      await saveAchievementProgress(); // saveAchievementProgress deve ser definida antes daqui
    }
  };

  // Função para obter o progresso de uma conquista específica
  const getAchievementProgress = (id: string): AchievementProgress | null => {
    return progress[id] || null;
  };

  // Verificar se uma conquista foi recentemente desbloqueada
  const isRecentlyUnlocked = (id: string): boolean => {
    return !!recentlyUnlocked.find((item) => item.id === id && !item.viewed);
  };

  // Função para atualizar o progresso de uma conquista
  const updateAchievementProgress = async (
    id: string,
    newValue: number,
    forceCheck = false
  ): Promise<UnlockedAchievement | null> => {
    const achievement = getAchievementById(id);
    if (!achievement) return null;

    // Verificar se já foi completado
    if (isAchievementUnlocked(id) && !forceCheck) {
      return null;
    }

    // Se não existe progresso para esta conquista, criar um novo
    if (!progress[id]) {
      progress[id] = {
        id,
        currentValue: 0,
        lastUpdated: new Date().toISOString(),
        unlocked: false,
        viewed: false,
      };
    }

    // Atualizar o valor atual
    const currentValue = Math.max(progress[id].currentValue, newValue);

    // Verificar se desbloqueou
    const wasUnlocked = progress[id].unlocked;
    const isNowUnlocked = currentValue >= achievement.threshold;

    // Atualizar o progresso
    setProgress((prevProgress) => ({
      ...prevProgress,
      [id]: {
        ...prevProgress[id],
        currentValue,
        lastUpdated: new Date().toISOString(),
        unlocked: isNowUnlocked,
      },
    }));

    // Se acabou de desbloquear, adicionar aos recentemente desbloqueados
    if (!wasUnlocked && isNowUnlocked) {
      const unlockedAchievement: UnlockedAchievement = {
        id: achievement.id,
        unlockedAt: new Date().toISOString(),
        viewed: false,
      };

      // Adicionar aos recentemente desbloqueados (usando função direta do estado)
      setRecentlyUnlocked((prevUnlocked) => [
        ...prevUnlocked,
        unlockedAchievement,
      ]);

      // Adicionar os FitPoints
      await addFitPoints(achievement.fitPoints);

      // Salvar o progresso
      await saveAchievementProgress();

      // Notificar através de haptics
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      return unlockedAchievement;
    }

    // Salvar o progresso se houve alteração
    if (progress[id].currentValue !== newValue) {
      await saveAchievementProgress();
    }

    return null;
  };

  // Função para verificar conquistas específicas que podem ser acionadas imediatamente
  const checkSpecificAchievement = async (
    achievementType: string,
    value = 1
  ) => {
    if (!user) return;

    try {
      // Verificar se é a primeira execução após o login
      const isFirstRun = Object.keys(progress).length === 0;
      // Não mostrar conquistas no primeiro login/onboarding
      if (isFirstRun) return;

      let unlockedAchievement: UnlockedAchievement | null = null;

      switch (achievementType) {
        case "meal_type_creation":
          // Verificar se os tipos de refeição foram configurados
          if (mealTypes && mealTypes.length > 0) {
            unlockedAchievement = await updateAchievementProgress(
              "meal_type_creation",
              value,
              true
            );
          }
          break;

        case "weight_tracking":
          // Verificar registros de peso
          const weightEntries = nutritionInfo.weightHistory?.length || 0;
          if (weightEntries > 0) {
            // Verificar cada conquista de rastreamento de peso
            const unlocked1 = await updateAchievementProgress(
              "weight_tracking_1",
              weightEntries,
              true
            );
            const unlocked2 = await updateAchievementProgress(
              "weight_tracking_2",
              weightEntries,
              true
            );
            const unlocked3 = await updateAchievementProgress(
              "weight_tracking_3",
              weightEntries,
              true
            );
            const unlocked4 = await updateAchievementProgress(
              "weight_tracking_4",
              weightEntries,
              true
            );
            const unlocked5 = await updateAchievementProgress(
              "weight_tracking_5",
              weightEntries,
              true
            );
            unlockedAchievement =
              unlocked1 || unlocked2 || unlocked3 || unlocked4 || unlocked5;
          }
          break;

        case "workout_type_creation":
          // Verificar se os tipos de treino foram configurados
          const workoutTypes = getAvailableWorkoutTypes();
          if (workoutTypes && workoutTypes.length > 0) {
            unlockedAchievement = await updateAchievementProgress(
              "workout_type_creation",
              value,
              true
            );
          }
          break;

        case "first_food":
          // Verificar se há pelo menos um alimento registrado
          let hasFood = false;
          Object.values(meals).forEach((dateData) => {
            Object.values(dateData).forEach((mealFoods) => {
              if (Array.isArray(mealFoods) && mealFoods.length > 0) {
                hasFood = true;
              }
            });
          });
          if (hasFood) {
            unlockedAchievement = await updateAchievementProgress(
              "first_food",
              value,
              true
            );
          }
          break;

        case "workout_completion":
          // Verificar conclusão de treinos
          const totalWorkouts = Object.values(workouts)
            .flatMap((dateWorkouts) => Object.values(dateWorkouts))
            .filter((exercises) => exercises.length > 0).length;

          if (totalWorkouts > 0) {
            const unlocked1 = await updateAchievementProgress(
              "workout_completion_1",
              totalWorkouts,
              true
            );
            const unlocked2 = await updateAchievementProgress(
              "workout_completion_2",
              totalWorkouts,
              true
            );
            const unlocked3 = await updateAchievementProgress(
              "workout_completion_3",
              totalWorkouts,
              true
            );
            const unlocked4 = await updateAchievementProgress(
              "workout_completion_4",
              totalWorkouts,
              true
            );
            const unlocked5 = await updateAchievementProgress(
              "workout_completion_5",
              totalWorkouts,
              true
            );
            unlockedAchievement =
              unlocked1 || unlocked2 || unlocked3 || unlocked4 || unlocked5;
          }
          break;

        case "caloric_goal":
          // Verificar conquistas de meta calórica
          if (caloricGoalDays > 0) {
            const unlocked1 = await updateAchievementProgress(
              "caloric_goal_1",
              caloricGoalDays,
              true
            );
            const unlocked2 = await updateAchievementProgress(
              "caloric_goal_2",
              caloricGoalDays,
              true
            );
            const unlocked3 = await updateAchievementProgress(
              "caloric_goal_3",
              caloricGoalDays,
              true
            );
            const unlocked4 = await updateAchievementProgress(
              "caloric_goal_4",
              caloricGoalDays,
              true
            );
            const unlocked5 = await updateAchievementProgress(
              "caloric_goal_5",
              caloricGoalDays,
              true
            );
            unlockedAchievement =
              unlocked1 || unlocked2 || unlocked3 || unlocked4 || unlocked5;
          }
          break;

        // NOVO: Caso para verificar conquistas de proteína
        case "protein_goal":
          if (proteinGoalDays > 0) {
            const unlockedP1 = await updateAchievementProgress(
              "protein_goal_1",
              proteinGoalDays,
              true
            );
            const unlockedP2 = await updateAchievementProgress(
              "protein_goal_2",
              proteinGoalDays,
              true
            );
            const unlockedP3 = await updateAchievementProgress(
              "protein_goal_3",
              proteinGoalDays,
              true
            );
            const unlockedP4 = await updateAchievementProgress(
              "protein_goal_4",
              proteinGoalDays,
              true
            );
            const unlockedP5 = await updateAchievementProgress(
              "protein_goal_5",
              proteinGoalDays,
              true
            );
            unlockedAchievement =
              unlockedP1 ||
              unlockedP2 ||
              unlockedP3 ||
              unlockedP4 ||
              unlockedP5;
          }
          break;

        case "daily_login_streak":
          // Chamada já existente dentro de recordUserActivityAndUpdateStreak
          const unlockedLogin1 = await updateAchievementProgress(
            "daily_login_streak_1",
            value,
            true
          );
          const unlockedLogin2 = await updateAchievementProgress(
            "daily_login_streak_2",
            value,
            true
          );
          const unlockedLogin3 = await updateAchievementProgress(
            "daily_login_streak_3",
            value,
            true
          );
          const unlockedLogin4 = await updateAchievementProgress(
            "daily_login_streak_4",
            value,
            true
          );
          const unlockedLogin5 = await updateAchievementProgress(
            "daily_login_streak_5",
            value,
            true
          );
          unlockedAchievement =
            unlockedLogin1 ||
            unlockedLogin2 ||
            unlockedLogin3 ||
            unlockedLogin4 ||
            unlockedLogin5;
          break;

        case "streak_days":
          // Chamada já existente dentro de recordUserActivityAndUpdateStreak
          const unlockedStreak1 = await updateAchievementProgress(
            "streak_days_1",
            value,
            true
          );
          const unlockedStreak2 = await updateAchievementProgress(
            "streak_days_2",
            value,
            true
          );
          const unlockedStreak3 = await updateAchievementProgress(
            "streak_days_3",
            value,
            true
          );
          const unlockedStreak4 = await updateAchievementProgress(
            "streak_days_4",
            value,
            true
          );
          const unlockedStreak5 = await updateAchievementProgress(
            "streak_days_5",
            value,
            true
          );
          unlockedAchievement =
            unlockedStreak1 ||
            unlockedStreak2 ||
            unlockedStreak3 ||
            unlockedStreak4 ||
            unlockedStreak5;
          break;

        // NOVO: Caso para verificar conquistas de progressão aplicada
        case "progression_applied":
          if (appliedProgressionCount > 0) {
            const unlockedProg1 = await updateAchievementProgress(
              "progression_apply_1",
              appliedProgressionCount,
              true
            );
            const unlockedProg2 = await updateAchievementProgress(
              "progression_apply_2",
              appliedProgressionCount,
              true
            );
            const unlockedProg3 = await updateAchievementProgress(
              "progression_apply_3",
              appliedProgressionCount,
              true
            );
            const unlockedProg4 = await updateAchievementProgress(
              "progression_apply_4",
              appliedProgressionCount,
              true
            );
            unlockedAchievement =
              unlockedProg1 || unlockedProg2 || unlockedProg3 || unlockedProg4;
          }
          break;

        default:
          break;
      }

      // Se uma conquista foi desbloqueada, garantir que está nos recentemente desbloqueados
      if (unlockedAchievement) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error(
        `Erro ao verificar conquista específica ${achievementType}:`,
        error
      );
    }
  };

  // Verifica "Guerreiro 24h": early_bird E night_owl desbloqueadas
  const check24hWarriorAchievement = async () => {
    if (!user) return;
    const earlyBirdUnlocked = isAchievementUnlocked("early_bird");
    const nightOwlUnlocked = isAchievementUnlocked("night_owl");
    if (earlyBirdUnlocked && nightOwlUnlocked) {
      await updateAchievementProgress("hidden_24h_warrior", 1, true);
    }
  };

  // Verifica "Semana Perfeita": registro de treino em 7 dias de uma semana
  const checkPerfectWeekAchievement = async () => {
    if (!user || !workouts) return;

    const workoutDates = Object.keys(workouts)
      .filter((date) => Object.keys(workouts[date]).length > 0) // Considerar apenas dias com treinos registrados
      .map((dateStr) => parseISO(dateStr)); // Converter para objetos Date

    if (workoutDates.length < 7) return; // Impossível ter uma semana perfeita

    workoutDates.sort((a, b) => a.getTime() - b.getTime()); // Ordenar datas

    let perfectWeekFound = false;
    const checkedWeeks = new Set<string>(); // Para evitar verificar a mesma semana várias vezes

    for (const date of workoutDates) {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Semana começa na Segunda
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      const weekKey = format(weekStart, "yyyy-MM-dd");

      if (checkedWeeks.has(weekKey)) {
        continue; // Já verificamos esta semana
      }

      // Filtrar datas de treino que pertencem a esta semana específica
      const workoutsInThisWeek = workoutDates.filter((workoutDate) =>
        isWithinInterval(workoutDate, { start: weekStart, end: weekEnd })
      );

      // Contar quantos dias *únicos* da semana têm treino
      const uniqueDaysWithWorkout = new Set(
        workoutsInThisWeek.map((d) => format(d, "yyyy-MM-dd"))
      );

      if (uniqueDaysWithWorkout.size >= 7) {
        perfectWeekFound = true;
        break; // Encontrou uma semana perfeita, pode parar
      }

      checkedWeeks.add(weekKey); // Marcar semana como verificada
    }

    if (perfectWeekFound) {
      await updateAchievementProgress("hidden_perfect_week", 1, true);
    }
  };

  // Verifica "Chef Consistente": >= 30 dias consecutivos de registro de refeição
  const checkConsistentChefAchievement = async () => {
    if (!user || !meals) return;

    const mealDates = Object.keys(meals)
      .filter((date) => Object.keys(meals[date]).length > 0) // Considerar apenas dias com refeições registradas
      .map((dateStr) => parseISO(dateStr)) // Converter para objetos Date
      .sort((a, b) => a.getTime() - b.getTime()); // Ordenar datas

    if (mealDates.length === 0) return;

    let maxStreak = 0;
    let currentStreak = 0;

    for (let i = 0; i < mealDates.length; i++) {
      if (i === 0) {
        currentStreak = 1; // Começa a primeira sequência
      } else {
        // Verificar se o dia atual é consecutivo ao anterior
        const diff = differenceInDays(mealDates[i], mealDates[i - 1]);
        if (diff === 1) {
          currentStreak++; // Continua a sequência
        } else if (diff > 1) {
          currentStreak = 1; // Quebrou a sequência, começa uma nova
        }
        // Se diff === 0 (mesmo dia), ignora e mantém a sequência
      }
      maxStreak = Math.max(maxStreak, currentStreak); // Atualiza a maior sequência encontrada
    }

    if (maxStreak > 0) {
      // Usar o valor máximo da sequência encontrada
      await updateAchievementProgress(
        "hidden_consistent_chef",
        maxStreak,
        true
      );
    }
  };

  // Verifica "Mestre dos Macros": Atingiu metas exatas de P/C/G no mesmo dia
  const checkMacroMasterAchievement = async () => {
    if (!user || !nutritionInfo || !meals) return;

    const targetProtein = nutritionInfo.protein;
    const targetCarbs = nutritionInfo.carbs;
    const targetFat = nutritionInfo.fat;
    const targetCalories = nutritionInfo.calories;

    // --- INÍCIO DA MODIFICAÇÃO: Adicionar verificação de metas > 0 ---
    // Só prosseguir se todas as metas forem definidas e maiores que zero
    if (
      !targetProtein ||
      targetProtein <= 0 ||
      !targetCarbs ||
      targetCarbs <= 0 ||
      !targetFat ||
      targetFat <= 0 ||
      !targetCalories ||
      targetCalories <= 0
    ) {
      return; // Retorna se as metas não são válidas
    }
    // --- FIM DA MODIFICAÇÃO ---

    const dayTotals = getDayTotals();

    // Verifica se os totais do dia batem exatamente (margem < 1) com as metas
    const proteinMatch = Math.abs(dayTotals.protein - targetProtein) < 1;
    const carbsMatch = Math.abs(dayTotals.carbs - targetCarbs) < 1;
    const fatMatch = Math.abs(dayTotals.fat - targetFat) < 1;
    const caloriesMatch = Math.abs(dayTotals.calories - targetCalories) < 1;

    if (proteinMatch && carbsMatch && fatMatch && caloriesMatch) {
      // Como o threshold é 1, desbloqueia na primeira vez que acontecer
      await updateAchievementProgress("hidden_macro_master", 1, true);
    }
  };

  // Verifica "Vigilante do Peso": Registrou peso por 7 dias consecutivos
  const checkWeightWatcherAchievement = async () => {
    if (!user || !nutritionInfo || !nutritionInfo.weightHistory) return;

    const weightHistory = nutritionInfo.weightHistory;
    if (weightHistory.length < 7) return; // Impossível ter 7 dias consecutivos

    // Ordenar histórico por data (mais antigo primeiro)
    const sortedHistory = [...weightHistory]
      .map((entry) => ({ ...entry, dateObj: parseISO(entry.date) })) // Converter para Date para ordenar
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    let consecutiveDays = 0;
    let maxConsecutive = 0;

    for (let i = 0; i < sortedHistory.length; i++) {
      if (i === 0) {
        consecutiveDays = 1;
      } else {
        const diff = differenceInDays(
          sortedHistory[i].dateObj,
          sortedHistory[i - 1].dateObj
        );
        if (diff === 1) {
          consecutiveDays++;
        } else if (diff > 1) {
          consecutiveDays = 1; // Resetar sequência
        }
        // Ignorar diff === 0 (mesmo dia)
      }
      maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
    }

    // Atualizar progresso com a maior sequência encontrada
    if (maxConsecutive > 0) {
      await updateAchievementProgress(
        "hidden_weight_vigilant",
        maxConsecutive,
        true
      );
    }
  };

  // --- FIM: Funções Movidas e Corrigidas ---

  // Carregar progresso das conquistas do AsyncStorage ou Firebase
  useEffect(() => {
    if (user) {
      loadAchievementProgress();
      loadWaterGoalDays();
      loadCaloricGoalDays();
      loadProteinGoalDays(); // NOVO: Carregar dias de meta de proteína
      loadAppliedProgressionCount(); // NOVO: Carregar contagem de progressão
      loadFitPoints();
      loadStreakData(); // NOVO: Carregar dados da sequência
    } else {
      // Limpar dados quando não houver usuário
      setProgress({});
      setRecentlyUnlocked([]);
      setWaterGoalDays(0);
      setCaloricGoalDays(0);
      setProteinGoalDays(0); // NOVO: Limpar dias de meta de proteína
      setAppliedProgressionCount(0); // NOVO: Limpar contagem de progressão
      setFitPoints(0);
      setCurrentStreak(0); // NOVO: Limpar sequência
      setLastActivityDate(null); // NOVO: Limpar última data
    }
  }, [user?.uid]);

  // --- Funções para Sequência de Atividade (Streak) ---

  // Chaves AsyncStorage para Streak
  const STREAK_KEY = `${KEYS.ACTIVITY_STREAK}_${user?.uid}`;
  const LAST_ACTIVE_DAY_KEY = `${KEYS.LAST_ACTIVE_DAY}_${user?.uid}`;

  // Carregar dados da sequência
  const loadStreakData = async () => {
    if (!user) return;
    try {
      const storedStreak = await AsyncStorage.getItem(STREAK_KEY);
      const storedLastDay = await AsyncStorage.getItem(LAST_ACTIVE_DAY_KEY);

      if (storedStreak) {
        setCurrentStreak(parseInt(storedStreak));
      }
      if (storedLastDay) {
        setLastActivityDate(storedLastDay);
      }
      // Verificar se a sequência expirou ao carregar
      if (storedLastDay) {
        const lastDate = new Date(storedLastDay);
        const today = new Date();
        // Se a última atividade não foi hoje nem ontem, zera a sequência
        if (!isToday(lastDate) && !isYesterday(lastDate)) {
          setCurrentStreak(0);
          // Salvar a sequência zerada
          await saveStreakData(0, storedLastDay);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados da sequência:", error);
      setCurrentStreak(0);
      setLastActivityDate(null);
    }
  };

  // Salvar dados da sequência
  const saveStreakData = async (streak: number, lastDay: string | null) => {
    if (!user) return;
    try {
      await AsyncStorage.setItem(STREAK_KEY, streak.toString());
      if (lastDay) {
        await AsyncStorage.setItem(LAST_ACTIVE_DAY_KEY, lastDay);
      }
      // Tentar salvar no Firebase também (opcional, ignora erros)
      try {
        await setDoc(
          doc(db, "users", user.uid, "gameData", "activityStreak"),
          {
            streak,
            lastActivityDate: lastDay,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (firebaseError) {
        // Ignorar erro
      }
    } catch (error) {
      console.error("Erro ao salvar dados da sequência:", error);
    }
  };

  // Registrar atividade do usuário e atualizar sequência
  const recordUserActivityAndUpdateStreak = async () => {
    if (!user) return;

    const todayStr = format(new Date(), "yyyy-MM-dd");

    // Se a última atividade já foi hoje, não faz nada
    if (lastActivityDate === todayStr) {
      return;
    }

    let newStreak = currentStreak;
    const today = new Date();

    if (lastActivityDate) {
      const lastDate = new Date(lastActivityDate);

      // Se a última atividade foi ontem, incrementa a sequência
      if (isYesterday(lastDate)) {
        newStreak += 1;
      }
      // Se a última atividade não foi ontem (e nem hoje), zera a sequência
      else if (!isToday(lastDate)) {
        newStreak = 1; // Começa uma nova sequência de 1 dia
      }
    } else {
      // Se não há data anterior, começa a sequência com 1
      newStreak = 1;
    }

    // Atualiza o estado e salva os dados
    setCurrentStreak(newStreak);
    setLastActivityDate(todayStr);
    await saveStreakData(newStreak, todayStr);

    // Verificar conquistas de sequência após atualizar
    await checkSpecificAchievement("daily_login_streak", newStreak);
    await checkSpecificAchievement("streak_days", newStreak); // Assumindo que esta é a sequência de atividade geral
  };

  // NOVO: useEffect para chamar recordUserActivityAndUpdateStreak em resposta a ações
  useEffect(() => {
    // Não executar se não houver usuário
    if (!user) return;

    // Chamar a função para potentially registrar a atividade do dia atual
    // A função interna já verifica se a atividade de hoje foi registrada
    recordUserActivityAndUpdateStreak();
  }, [
    // Dependências que indicam atividade do usuário:
    Object.keys(workouts).length, // Mudança no número de dias com treino
    Object.keys(meals).length, // Mudança no número de dias com refeições
    nutritionInfo.weightHistory?.length, // Mudança no histórico de peso
    currentWaterIntake, // Mudança na ingestão de água (pode ser muito frequente, avaliar)
    // user?.uid // Garantir que executa se o usuário mudar
  ]);

  // NOVO: useEffect para verificar a meta de proteína diariamente
  useEffect(() => {
    const checkProteinGoal = async () => {
      if (!user || !nutritionInfo || !meals || !nutritionInfo.protein) return;

      const todayStr = format(new Date(), "yyyy-MM-dd");
      const dayTotals = getDayTotals();
      const targetProtein = nutritionInfo.protein;

      // Verificar se a meta foi atingida hoje
      if (dayTotals.protein >= targetProtein) {
        // Verificar se já contamos a meta para hoje
        const proteinGoalCheckKey = `${KEYS.LAST_PROTEIN_GOAL_CHECK_DATE}_${user.uid}`;
        const lastCheckDate = await AsyncStorage.getItem(proteinGoalCheckKey);

        if (lastCheckDate !== todayStr) {
          // Incrementar o contador
          const newProteinGoalDays = proteinGoalDays + 1;
          setProteinGoalDays(newProteinGoalDays);

          // Salvar o novo contador
          const proteinGoalDaysKey = `${KEYS.PROTEIN_GOAL_DAYS}_${user.uid}`;
          await AsyncStorage.setItem(
            proteinGoalDaysKey,
            newProteinGoalDays.toString()
          );

          // Salvar a data da última verificação
          await AsyncStorage.setItem(proteinGoalCheckKey, todayStr);

          // Verificar conquistas relacionadas
          await checkSpecificAchievement("protein_goal", newProteinGoalDays);
        }
      }
    };

    // Verificar a meta quando os dados de nutrição ou refeições mudarem
    checkProteinGoal();
  }, [user, nutritionInfo, meals, getDayTotals, proteinGoalDays]); // Adicionar proteinGoalDays à dependência

  // --------------------------------------------------

  // Carregar FitPoints
  const loadFitPoints = async () => {
    if (!user) return;

    try {
      const fitPointsKey = `${KEYS.FITPOINTS}_${user.uid}`;
      const storedFitPoints = await AsyncStorage.getItem(fitPointsKey);

      if (storedFitPoints) {
        setFitPoints(parseInt(storedFitPoints));
      }
    } catch (error) {
      console.error("Erro ao carregar FitPoints:", error);
    }
  };

  // Salvar FitPoints
  const saveFitPoints = async (newPoints: number) => {
    if (!user) return;

    try {
      const fitPointsKey = `${KEYS.FITPOINTS}_${user.uid}`;
      await AsyncStorage.setItem(fitPointsKey, newPoints.toString());

      // Salvar também no Firebase se estiver online
      try {
        await setDoc(
          doc(db, "users", user.uid, "gameData", "fitpoints"),
          { points: newPoints, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (firebaseError) {
        // Ignorar erro do Firebase, dados mantidos localmente
      }
    } catch (error) {
      console.error("Erro ao salvar FitPoints:", error);
    }
  };

  // Adicionar FitPoints
  const addFitPoints = async (points: number) => {
    if (points <= 0) return;

    const newTotal = fitPoints + points;
    setFitPoints(newTotal);
    await saveFitPoints(newTotal);

    // Aplicar feedback haptico ao ganhar pontos
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Obter FitPoints atual
  const getCurrentFitPoints = () => fitPoints;

  // Função para calcular estatísticas
  const calculateStats = (): AchievementStats => {
    try {
      // Estatísticas básicas de conquistas
      const totalAchievements = achievements.length;

      // Calcular quantas conquistas foram desbloqueadas
      const unlockedAchievements = Object.values(progress).filter(
        (p) => p.unlocked
      ).length;

      // Calcular pontos ganhos
      const earnedPoints = Object.entries(progress).reduce(
        (total, [achievementId, progressData]) => {
          if (!progressData.unlocked) return total;

          const achievement = getAchievementById(achievementId);
          if (!achievement) return total;

          return total + achievement.fitPoints;
        },
        0
      );

      // Calcular pontos totais disponíveis
      const totalPoints = achievements.reduce(
        (total, achievement) => total + achievement.fitPoints,
        0
      );

      // Calcular porcentagem de conclusão
      const completionPercentage = Math.round(
        (earnedPoints / totalPoints) * 100
      );

      // Obter estatísticas de FitPoints
      const currentFitLevel = getCurrentFitLevel(fitPoints);
      const nextLevelInfo = getNextLevelProgress(fitPoints);

      return {
        totalAchievements,
        unlockedAchievements,
        totalPoints,
        earnedPoints,
        completionPercentage,
        totalFitPoints: fitPoints,
        currentFitLevel,
        nextFitLevel: nextLevelInfo.next,
        fitLevelProgress: nextLevelInfo.percentage,
        fitPointsToNextLevel: nextLevelInfo.pointsToNext,
        currentStreak,
      };
    } catch (error) {
      console.error("Erro ao calcular estatísticas:", error);

      // Retornar valores padrão em caso de erro
      return {
        totalAchievements: 0,
        unlockedAchievements: 0,
        totalPoints: 0,
        earnedPoints: 0,
        completionPercentage: 0,
        totalFitPoints: 0,
        currentFitLevel: FIT_LEVELS[0],
        nextFitLevel: FIT_LEVELS[1],
        fitLevelProgress: 0,
        fitPointsToNextLevel: FIT_LEVELS[1].pointsRequired,
        currentStreak: 0,
      };
    }
  };

  // Carregar progresso das conquistas
  const loadAchievementProgress = async () => {
    if (!user) return;

    try {
      // Primeiro tenta carregar do AsyncStorage
      const localProgressData = await AsyncStorage.getItem(
        `${KEYS.ACHIEVEMENTS_PROGRESS}:${user.uid}`
      );

      let progressData: Record<string, AchievementProgress> = {};
      if (localProgressData) {
        progressData = JSON.parse(localProgressData);
      } else {
        // Se não encontrar no AsyncStorage, tenta buscar do Firebase
        try {
          const achievementsDoc = await getDoc(
            doc(db, "users", user.uid, "gameData", "achievements")
          );

          if (achievementsDoc.exists()) {
            progressData = achievementsDoc.data().progress || {};
          }
        } catch (firebaseError) {
          // Ignorar erro do Firebase, usar objeto vazio
        }
      }

      // Carregar conquistas recentemente desbloqueadas
      const recentlyUnlockedData = await AsyncStorage.getItem(
        `${KEYS.RECENTLY_UNLOCKED_ACHIEVEMENTS}:${user.uid}`
      );

      let recentUnlocked: UnlockedAchievement[] = [];
      if (recentlyUnlockedData) {
        recentUnlocked = JSON.parse(recentlyUnlockedData);

        // Limpar conquistas já visualizadas da lista de recentes
        recentUnlocked = cleanUpRecentlyUnlocked(recentUnlocked);

        // Salvar a lista limpa
        await AsyncStorage.setItem(
          `${KEYS.RECENTLY_UNLOCKED_ACHIEVEMENTS}:${user.uid}`,
          JSON.stringify(recentUnlocked)
        );
      }

      // Atualizar estado
      setProgress(progressData);
      setRecentlyUnlocked(recentUnlocked);
    } catch (error) {
      // Ignorar erro, usar valores padrão
    }
  };

  // Função para limpar a lista de conquistas recentes
  const cleanUpRecentlyUnlocked = (
    unlocked: UnlockedAchievement[]
  ): UnlockedAchievement[] => {
    // Remover conquistas já visualizadas
    const notViewed = unlocked.filter((item) => !item.viewed);

    // Limitar o número máximo de conquistas recentes
    const MAX_RECENT_ACHIEVEMENTS = 10;

    // Ordenar por data de desbloqueio (mais recentes primeiro)
    const sorted = notViewed.sort(
      (a, b) =>
        new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
    );

    // Retornar apenas as mais recentes
    return sorted.slice(0, MAX_RECENT_ACHIEVEMENTS);
  };

  // Função para carregar dias de meta de água atingida
  const loadWaterGoalDays = async () => {
    if (!user) return;

    try {
      const waterGoalDaysKey = `${KEYS.WATER_GOAL_DAYS}_${user.uid}`;
      const storedWaterGoalDays = await AsyncStorage.getItem(waterGoalDaysKey);

      if (storedWaterGoalDays) {
        setWaterGoalDays(parseInt(storedWaterGoalDays));
      }
    } catch (error) {
      console.error("Erro ao carregar dias de meta de água:", error);
    }
  };

  // Função para carregar dias de meta calórica atingida
  const loadCaloricGoalDays = async () => {
    if (!user) return;

    try {
      const caloricGoalDaysKey = `${KEYS.CALORIC_GOAL_DAYS}_${user.uid}`;
      const storedCaloricGoalDays = await AsyncStorage.getItem(
        caloricGoalDaysKey
      );

      if (storedCaloricGoalDays) {
        setCaloricGoalDays(parseInt(storedCaloricGoalDays));
      }
    } catch (error) {
      console.error("Erro ao carregar dias de meta calórica:", error);
    }
  };

  // NOVO: Função para carregar dias de meta de proteína atingida
  const loadProteinGoalDays = async () => {
    if (!user) return;

    try {
      const proteinGoalDaysKey = `${KEYS.PROTEIN_GOAL_DAYS}_${user.uid}`;
      const storedProteinGoalDays = await AsyncStorage.getItem(
        proteinGoalDaysKey
      );

      if (storedProteinGoalDays) {
        setProteinGoalDays(parseInt(storedProteinGoalDays));
      }
    } catch (error) {
      console.error("Erro ao carregar dias de meta de proteína:", error);
    }
  };

  // NOVO: Função para carregar contagem de progressões aplicadas
  const loadAppliedProgressionCount = async () => {
    if (!user) return;
    try {
      const countKey = `${KEYS.APPLIED_PROGRESSION_COUNT}_${user.uid}`;
      const storedCount = await AsyncStorage.getItem(countKey);
      if (storedCount) {
        setAppliedProgressionCount(parseInt(storedCount));
      }
    } catch (error) {
      console.error("Erro ao carregar contagem de progressão:", error);
    }
  };

  // NOVO: Função para salvar contagem de progressões aplicadas
  const saveAppliedProgressionCount = async (count: number) => {
    if (!user) return;
    try {
      const countKey = `${KEYS.APPLIED_PROGRESSION_COUNT}_${user.uid}`;
      await AsyncStorage.setItem(countKey, count.toString());

      // Tentar salvar no Firebase também (opcional, ignora erros)
      try {
        await setDoc(
          doc(db, "users", user.uid, "gameData", "progressionStats"),
          {
            appliedCount: count,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (firebaseError) {
        // Ignorar erro
      }
    } catch (error) {
      console.error("Erro ao salvar contagem de progressão:", error);
    }
  };

  // Executar verificação de conquistas quando o usuário logar
  useEffect(() => {
    if (user) {
      // Esperar um pouco para os outros contextos serem carregados
      const timer = setTimeout(() => {
        // Verificar se já carregamos os dados primeiro
        if (Object.keys(progress).length > 0) {
          checkAchievements();
        } else {
          // Se não temos dados ainda, aguardar mais um pouco
          const loadDataTimer = setTimeout(() => {
            checkAchievements();
          }, 1000);
          return () => clearTimeout(loadDataTimer);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user?.uid, Object.keys(progress).length]);

  // Salvar progresso das conquistas com debounce para evitar muitas chamadas
  const saveProgressWithDebounce = useCallback(
    debounce(async () => {
      if (!user) return;

      try {
        // Salvar no AsyncStorage
        await AsyncStorage.setItem(
          `${KEYS.ACHIEVEMENTS_PROGRESS}:${user.uid}`,
          JSON.stringify(progress)
        );

        // Salvar conquistas recentes
        await AsyncStorage.setItem(
          `${KEYS.RECENTLY_UNLOCKED_ACHIEVEMENTS}:${user.uid}`,
          JSON.stringify(recentlyUnlocked)
        );

        // Salvar no Firebase se estiver online
        try {
          await setDoc(
            doc(db, "users", user.uid, "gameData", "achievements"),
            { progress, updatedAt: new Date().toISOString() },
            { merge: true }
          );
        } catch (firebaseError) {
          // Ignorar erro do Firebase, dados mantidos localmente
        }
      } catch (error) {
        // Ignorar erro ao salvar
      }
    }, 1000),
    [user, progress, recentlyUnlocked]
  );

  // Salvar progresso das conquistas
  const saveAchievementProgress = async () => {
    saveProgressWithDebounce();
  };

  // Verificar se uma conquista específica já foi completamente desbloqueada
  const isAchievementAlreadyCompleted = (achievementId: string): boolean => {
    const achievement = getAchievementById(achievementId);
    if (!achievement) return false;

    const userProgress = progress[achievementId];
    if (!userProgress || !userProgress.unlocked) return false;

    // Verificar se o valor atual da conquista já atingiu o limite
    return userProgress.currentValue >= achievement.threshold;
  };

  // Verificar todas as conquistas com base nos dados atuais
  const checkAchievements = async () => {
    if (!user) return;

    try {
      // Verificar se é a primeira execução após o login
      const isFirstRun = Object.keys(progress).length === 0;

      // Recarregar os dados de água antes de verificar
      await loadWaterGoalDays();
      await loadCaloricGoalDays();
      await loadProteinGoalDays(); // NOVO: Recarregar dias de meta de proteína
      await loadAppliedProgressionCount(); // NOVO: Recarregar contagem

      // Verificar conquista de meal_type_creation (organização de refeições)
      if (mealTypes && mealTypes.length > 0 && !isFirstRun) {
        await updateAchievementProgress("meal_type_creation", 1, true);
      }

      // Verificar conquista de workout_type_creation (tipos de treino)
      const workoutTypes = getAvailableWorkoutTypes();
      if (workoutTypes && workoutTypes.length > 0 && !isFirstRun) {
        await updateAchievementProgress("workout_type_creation", 1, true);
      }

      // Verificar primeiro alimento
      let hasAddedFood = false;
      Object.values(meals).forEach((dateData) => {
        Object.values(dateData).forEach((mealFoods) => {
          if (Array.isArray(mealFoods) && mealFoods.length > 0) {
            hasAddedFood = true;
          }
        });
      });

      if (hasAddedFood && !isFirstRun) {
        await updateAchievementProgress("first_food", 1, true);
      }

      // Verificar quantidade total de treinos
      const totalWorkouts = Object.values(workouts)
        .flatMap((dateWorkouts) => Object.values(dateWorkouts))
        .filter((exercises) => exercises.length > 0).length;

      if (totalWorkouts > 0) {
        await updateAchievementProgress(
          "workout_completion_1",
          totalWorkouts,
          true
        );
        await updateAchievementProgress(
          "workout_completion_2",
          totalWorkouts,
          true
        );
        await updateAchievementProgress(
          "workout_completion_3",
          totalWorkouts,
          true
        );
        await updateAchievementProgress(
          "workout_completion_4",
          totalWorkouts,
          true
        );
        await updateAchievementProgress(
          "workout_completion_5",
          totalWorkouts,
          true
        );
      }

      // Verificar variedade de exercícios
      const uniqueExercises = new Set();
      Object.values(workouts).forEach((dateWorkouts) => {
        Object.values(dateWorkouts).forEach((exercises) => {
          exercises.forEach((exercise) => {
            uniqueExercises.add(exercise.id);
          });
        });
      });

      if (uniqueExercises.size > 0) {
        await updateAchievementProgress(
          "exercise_variety_1",
          uniqueExercises.size,
          true
        );
        await updateAchievementProgress(
          "exercise_variety_2",
          uniqueExercises.size,
          true
        );
        await updateAchievementProgress(
          "exercise_variety_3",
          uniqueExercises.size,
          true
        );
        await updateAchievementProgress(
          "exercise_variety_4",
          uniqueExercises.size,
          true
        );
        await updateAchievementProgress(
          "exercise_variety_5",
          uniqueExercises.size,
          true
        );
      }

      // Verificar dias de uso do app
      const appUsageProgress =
        progress["app_usage_1"] ||
        progress["app_usage_2"] ||
        progress["app_usage_3"] ||
        progress["app_usage_4"] ||
        progress["app_usage_5"];
      const appUsageDays = appUsageProgress?.currentValue || 0;

      // Verificar se já incrementamos hoje
      const lastUpdated = appUsageProgress?.lastUpdated
        ? new Date(appUsageProgress.lastUpdated).toDateString()
        : null;
      const today = new Date().toDateString();

      // Só incrementa se for a primeira vez no dia
      if (!lastUpdated || lastUpdated !== today) {
        const newAppUsageDays = appUsageDays + 1;
        await updateAchievementProgress("app_usage_1", newAppUsageDays, true);
        await updateAchievementProgress("app_usage_2", newAppUsageDays, true);
        await updateAchievementProgress("app_usage_3", newAppUsageDays, true);
        await updateAchievementProgress("app_usage_4", newAppUsageDays, true);
        await updateAchievementProgress("app_usage_5", newAppUsageDays, true);
      }

      // Verificar dias de registro de refeições
      const mealTrackingDays = Object.keys(meals).length;
      if (mealTrackingDays > 0) {
        await updateAchievementProgress(
          "meal_tracking_1",
          mealTrackingDays,
          true
        );
        await updateAchievementProgress(
          "meal_tracking_2",
          mealTrackingDays,
          true
        );
        await updateAchievementProgress(
          "meal_tracking_3",
          mealTrackingDays,
          true
        );
        await updateAchievementProgress(
          "meal_tracking_4",
          mealTrackingDays,
          true
        );
        await updateAchievementProgress(
          "meal_tracking_5",
          mealTrackingDays,
          true
        );
      }

      // Verificar registros de peso
      const weightEntries = nutritionInfo.weightHistory?.length || 0;
      if (weightEntries > 0) {
        await updateAchievementProgress(
          "weight_tracking_1",
          weightEntries,
          true
        );
        await updateAchievementProgress(
          "weight_tracking_2",
          weightEntries,
          true
        );
        await updateAchievementProgress(
          "weight_tracking_3",
          weightEntries,
          true
        );
        await updateAchievementProgress(
          "weight_tracking_4",
          weightEntries,
          true
        );
        await updateAchievementProgress(
          "weight_tracking_5",
          weightEntries,
          true
        );
      }

      // Verificar metas de nutrição (já existente no código)
      // const nutritionGoalProgress = progress["nutrition_goals_1"]?.currentValue || 0;
      // Resto do código para verificar metas de nutrição...
      // Nota: As conquistas nutrition_goals_* parecem não estar implementadas aqui.

      // --- INÍCIO DA MODIFICAÇÃO ---
      // Pular verificações de água e calorias na primeira execução para evitar race conditions
      if (!isFirstRun) {
        // Verificar metas de água
        if (waterGoalDays > 0) {
          await updateAchievementProgress(
            "water_intake_1",
            waterGoalDays,
            true
          );
          await updateAchievementProgress(
            "water_intake_2",
            waterGoalDays,
            true
          );
          await updateAchievementProgress(
            "water_intake_3",
            waterGoalDays,
            true
          );
          await updateAchievementProgress(
            "water_intake_4",
            waterGoalDays,
            true
          );
          await updateAchievementProgress(
            "water_intake_5",
            waterGoalDays,
            true
          );
        }

        // Verificar metas calóricas
        if (caloricGoalDays > 0) {
          await updateAchievementProgress(
            "caloric_goal_1",
            caloricGoalDays,
            true
          );
          await updateAchievementProgress(
            "caloric_goal_2",
            caloricGoalDays,
            true
          );
          await updateAchievementProgress(
            "caloric_goal_3",
            caloricGoalDays,
            true
          );
          await updateAchievementProgress(
            "caloric_goal_4",
            caloricGoalDays,
            true
          );
          await updateAchievementProgress(
            "caloric_goal_5",
            caloricGoalDays,
            true
          );
        }

        // NOVO: Verificar metas de proteína
        if (proteinGoalDays > 0) {
          await updateAchievementProgress(
            "protein_goal_1",
            proteinGoalDays,
            true
          );
          await updateAchievementProgress(
            "protein_goal_2",
            proteinGoalDays,
            true
          );
          await updateAchievementProgress(
            "protein_goal_3",
            proteinGoalDays,
            true
          );
          await updateAchievementProgress(
            "protein_goal_4",
            proteinGoalDays,
            true
          );
          await updateAchievementProgress(
            "protein_goal_5",
            proteinGoalDays,
            true
          );
        }
      }
      // --- FIM DA MODIFICAÇÃO ---

      // --- INÍCIO DA MODIFICAÇÃO: Verificar Conquistas de Passos ---
      await checkDailyStepsAchievement();
      // --- FIM DA MODIFICAÇÃO ---

      // --- INÍCIO DA MODIFICAÇÃO: Verificar Conquistas de Meta de Peso ---
      await checkWeightGoalAchievements();
      // --- FIM DA MODIFICAÇÃO ---

      // --- INÍCIO: Verificar Conquistas de Progressão Aplicada (Gatilho Indireto) ---
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const progressionAppliedKey = `${KEYS.LAST_PROGRESSION_APPLIED_CHECK_DATE}_${user.uid}`;
      const processedDateKey = `${KEYS.LAST_PROCESSED_PROGRESSION_APPLIED_DATE}_${user.uid}`;

      try {
        const lastAppliedDate = await AsyncStorage.getItem(
          progressionAppliedKey
        );
        const lastProcessedDate = await AsyncStorage.getItem(processedDateKey);

        // Se uma progressão foi aplicada hoje E ainda não processamos a aplicação de hoje
        if (lastAppliedDate === todayStr && lastProcessedDate !== todayStr) {
          // Incrementar o contador
          const newCount = appliedProgressionCount + 1;
          setAppliedProgressionCount(newCount);

          // Salvar novo contador e marcar como processado hoje
          await saveAppliedProgressionCount(newCount);
          await AsyncStorage.setItem(processedDateKey, todayStr);

          // Verificar conquistas relacionadas com o novo contador
          await checkSpecificAchievement("progression_applied", newCount);
        } else if (appliedProgressionCount > 0 && !isFirstRun) {
          // Se não houve nova aplicação hoje, apenas verificar o estado atual (caso carregado)
          await checkSpecificAchievement(
            "progression_applied",
            appliedProgressionCount
          );
        }
      } catch (err) {
        console.error("Erro ao verificar gatilho de progressão aplicada:", err);
        // Se der erro, apenas verificar o estado atual como fallback
        if (appliedProgressionCount > 0 && !isFirstRun) {
          await checkSpecificAchievement(
            "progression_applied",
            appliedProgressionCount
          );
        }
      }
      // --- FIM: Verificar Conquistas de Progressão Aplicada ---

      // --- INÍCIO: Verificar Conquistas Surpresa (baseadas em estado) ---
      await check24hWarriorAchievement();
      await checkPerfectWeekAchievement();
      await checkConsistentChefAchievement();
      await checkMacroMasterAchievement();
      await checkWeightWatcherAchievement();
      // --- FIM: Verificar Conquistas Surpresa ---
    } catch (error) {
      console.error("Erro ao verificar conquistas:", error);
    }
  };

  // --- INÍCIO DA MODIFICAÇÃO: Função para verificar passos ---
  // Verificar a conquista de passos diários
  const checkDailyStepsAchievement = async () => {
    if (!user) return;

    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const stepsKey = `${KEYS.STEPS_COUNT}_${user.uid}_${todayStr}`;
      const storedStepsData = await AsyncStorage.getItem(stepsKey);

      if (storedStepsData) {
        const dailySteps = parseInt(storedStepsData);

        if (!isNaN(dailySteps) && dailySteps > 0) {
          // Atualizar a conquista de 2500 passos
          await updateAchievementProgress("daily_steps_1", dailySteps, true);
          // Atualizar para 5k
          await updateAchievementProgress("daily_steps_2", dailySteps, true);
          // Atualizar para 10k
          await updateAchievementProgress("daily_steps_3", dailySteps, true);
          // Atualizar para 15k
          await updateAchievementProgress("daily_steps_4", dailySteps, true);
          // NOVO: Atualizar para 20k
          await updateAchievementProgress("daily_steps_5", dailySteps, true);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar conquista de passos diários:", error);
    }
  };
  // --- FIM DA MODIFICAÇÃO ---

  // --- INÍCIO DA MODIFICAÇÃO: Função para verificar meta de peso ---
  // Função para verificar conquistas de meta de peso
  const checkWeightGoalAchievements = async () => {
    if (!user || !nutritionInfo) return;

    const { weight, targetWeight, weightHistory } = nutritionInfo;

    // Verificar se temos os dados necessários
    if (
      weight === undefined ||
      targetWeight === undefined ||
      !weightHistory ||
      weightHistory.length === 0
    ) {
      return; // Não é possível calcular sem peso atual, meta ou histórico
    }

    // Encontrar o peso inicial (o registro mais antigo no histórico)
    // Ordenar por data ascendente para pegar o mais antigo
    const sortedHistory = [...weightHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const initialWeight = sortedHistory[0].weight;

    let percentage = 0;

    // Calcular a diferença total necessária
    const totalDifference = Math.abs(initialWeight - targetWeight);

    // Calcular a diferença percorrida
    const coveredDifference = Math.abs(initialWeight - weight);

    // Caso especial: Meta é manter o peso
    if (totalDifference < 0.1) {
      // Se a meta é manter e o peso atual está muito próximo, considera 100%
      if (Math.abs(weight - targetWeight) < 0.5) {
        percentage = 100;
      }
    } else {
      // Calcular a porcentagem para ganho/perda
      percentage = Math.min((coveredDifference / totalDifference) * 100, 100);
    }

    // Garantir que a porcentagem não seja NaN ou infinita
    if (isNaN(percentage) || !isFinite(percentage)) {
      percentage = 0;
    }

    // Atualizar as conquistas de meta de peso
    try {
      await updateAchievementProgress("weight_goals_1", percentage, true);
      await updateAchievementProgress("weight_goals_2", percentage, true);
      await updateAchievementProgress("weight_goals_3", percentage, true);
      await updateAchievementProgress("weight_goals_4", percentage, true);
      await updateAchievementProgress("weight_goals_5", percentage, true);
    } catch (error) {
      console.error("Erro ao verificar conquistas de meta de peso:", error);
    }
  };
  // --- FIM DA MODIFICAÇÃO ---

  return (
    <AchievementContext.Provider
      value={{
        achievements,
        progress,
        recentlyUnlocked,
        stats: calculateStats(),
        checkAchievements,
        checkSpecificAchievement,
        markUnlockedAsViewed,
        getAchievementProgress,
        isAchievementUnlocked,
        updateAchievementProgress,
        isRecentlyUnlocked,
        getCurrentFitPoints,
        addFitPoints,
        getAchievementValue,
        // --- DEBUG ONLY ---
        // unlockAllAchievementsAndMaxLevel: __DEV__
        //   ? unlockAllAchievementsAndMaxLevel
        //   : undefined, // Expor apenas em DEV
        // --- END DEBUG ONLY ---
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
};
