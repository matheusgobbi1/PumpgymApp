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

// Chave para controlar verificação retroativa de conquistas
const RETROACTIVE_CHECK_KEY = "ACHIEVEMENT_RETROACTIVE_CHECK_COMPLETED";

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
  // unlockAllAchievementsAndMaxLevel?: () => Promise<void>; // Função de debug
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

  // --- Funções que NÃO precisam de useCallback (dependem diretamente de 'progress' ou são simples) ---
  // Estas funções são simples e/ou dependem de `progress`. Memoizá-las traria pouco benefício
  // ou teriam que ser recriadas sempre que `progress` mudasse de qualquer forma.
  const isAchievementUnlocked = (id: string): boolean => {
    return progress[id]?.unlocked ?? false;
  };

  const getAchievementValue = (id: string): number => {
    return progress[id]?.currentValue ?? 0;
  };

  // --- Salvar com Debounce (já usa useCallback internamente) ---
  // Função debounced para salvar progresso
  const saveProgressDebounced = useMemo(
    () =>
      debounce(
        async (
          currentProgress: Record<string, AchievementProgress>,
          currentRecentlyUnlocked: UnlockedAchievement[],
          userId: string | undefined
        ) => {
          if (!userId) return;
          try {
            const progressString = JSON.stringify(currentProgress);
            const recentString = JSON.stringify(currentRecentlyUnlocked);

            await AsyncStorage.setItem(
              `${KEYS.ACHIEVEMENTS_PROGRESS}:${userId}`,
              progressString
            );
            await AsyncStorage.setItem(
              `${KEYS.RECENTLY_UNLOCKED_ACHIEVEMENTS}:${userId}`,
              recentString
            );

            // Parse again for Firebase to avoid potential issues with complex objects
            const firebaseProgress = JSON.parse(progressString);

            // Salvar no Firebase
            await setDoc(
              doc(db, "users", userId, "gameData", "achievements"),
              {
                progress: firebaseProgress,
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          } catch (error) {
            console.error("Erro ao salvar progresso (debounce):", error);
          }
        },
        1000
      ),
    [] // Debounce é criado apenas uma vez
  );

  // Trigger para salvar progresso (usa o estado atual)
  const saveAchievementProgress = useCallback(() => {
    if (user) {
      saveProgressDebounced(progress, recentlyUnlocked, user.uid);
    }
  }, [user, progress, recentlyUnlocked, saveProgressDebounced]);

  // --- Funções Envolvidas em useCallback ---

  // Função para limpar a lista de recentes (agora com useCallback)
  const cleanUpRecentlyUnlocked = useCallback(
    (unlocked: UnlockedAchievement[]): UnlockedAchievement[] => {
      const notViewed = unlocked.filter((item) => !item.viewed);
      const MAX_RECENT_ACHIEVEMENTS = 10;
      const sorted = notViewed.sort(
        (a, b) =>
          new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
      );
      return sorted.slice(0, MAX_RECENT_ACHIEVEMENTS);
    },
    []
  ); // Sem dependências externas

  // Salvar FitPoints (separado para ser usado em addFitPoints)
  const saveFitPoints = useCallback(
    async (newPoints: number) => {
      if (!user) return;
      try {
        const fitPointsKey = `${KEYS.FITPOINTS}_${user.uid}`;
        await AsyncStorage.setItem(fitPointsKey, newPoints.toString());
        // Salvar também no Firebase
        await setDoc(
          doc(db, "users", user.uid, "gameData", "fitpoints"),
          { points: newPoints, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (error) {
        console.error("Erro ao salvar FitPoints:", error);
      }
    },
    [user]
  ); // Depende de user

  // Adicionar FitPoints
  const addFitPoints = useCallback(
    async (points: number) => {
      if (points <= 0 || !user) return;

      setFitPoints((currentPoints) => {
        const newTotal = currentPoints + points;
        // Salva o novo total
        saveFitPoints(newTotal);
        return newTotal;
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [user, saveFitPoints] // Depende de user e saveFitPoints
  );

  // Função para atualizar o progresso de uma conquista
  const updateAchievementProgress = useCallback(
    async (
      id: string,
      newValue: number,
      forceCheck = false
    ): Promise<UnlockedAchievement | null> => {
      const achievement = getAchievementById(id);
      if (!achievement) return null;

      let unlockedResult: UnlockedAchievement | null = null;
      let shouldSave = false;

      setProgress((currentProgress) => {
        const currentProg = currentProgress[id];
        const alreadyUnlocked = currentProg?.unlocked ?? false;

        if (alreadyUnlocked && !forceCheck) {
          return currentProgress; // Sem mudanças
        }

        const initialValue = currentProg?.currentValue ?? 0;
        // Garantir que o valor só aumente ou seja definido se for maior
        const updatedValue = Math.max(initialValue, newValue);
        const isNowUnlocked = updatedValue >= achievement.threshold;

        if (
          updatedValue !== initialValue ||
          (!alreadyUnlocked && isNowUnlocked)
        ) {
          shouldSave = true;
          const updatedProg = {
            id, // Sempre incluir ID
            currentValue: updatedValue,
            lastUpdated: new Date().toISOString(),
            unlocked: isNowUnlocked,
            // Manter viewed se já existia, ou definir como false se for novo/acabou de desbloquear
            viewed:
              !alreadyUnlocked && isNowUnlocked
                ? false
                : currentProg?.viewed ?? false,
          };

          if (!alreadyUnlocked && isNowUnlocked) {
            const unlockedAchievement: UnlockedAchievement = {
              id: achievement.id,
              unlockedAt: new Date().toISOString(),
              viewed: false,
            };
            setRecentlyUnlocked((prevUnlocked) =>
              cleanUpRecentlyUnlocked([...prevUnlocked, unlockedAchievement])
            );
            addFitPoints(achievement.fitPoints);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            unlockedResult = unlockedAchievement;
          }

          return {
            ...currentProgress,
            [id]: updatedProg,
          };
        }
        return currentProgress; // Nenhuma mudança necessária
      });

      // Salvar fora do setProgress se necessário, usando o estado atualizado indiretamente
      if (shouldSave) {
        // A função saveAchievementProgress pegará o estado mais recente de 'progress' e 'recentlyUnlocked'
        saveAchievementProgress();
      }

      return unlockedResult;
    },
    [addFitPoints, cleanUpRecentlyUnlocked, saveAchievementProgress] // Dependências
  );

  // Função para marcar conquista como visualizada
  const markUnlockedAsViewed = useCallback(
    async (id: string) => {
      let needsSave = false;

      setRecentlyUnlocked((prevUnlocked) => {
        let itemFoundAndUpdated = false;
        const updatedList = prevUnlocked.map((item) => {
          if (item.id === id && !item.viewed) {
            itemFoundAndUpdated = true;
            return { ...item, viewed: true };
          }
          return item;
        });
        // Se um item foi atualizado na lista de recentes, precisamos salvar
        if (itemFoundAndUpdated) needsSave = true;
        return updatedList;
      });

      setProgress((prevProgress) => {
        const currentProg = prevProgress[id];
        // Se o progresso existe e ainda não está marcado como visualizado
        if (currentProg && !currentProg.viewed) {
          needsSave = true; // Marcar para salvar
          return {
            ...prevProgress,
            [id]: { ...currentProg, viewed: true },
          };
        }
        return prevProgress; // Nenhuma mudança no progresso
      });

      // Salvar se houve alteração em recentlyUnlocked ou progress
      if (needsSave) {
        saveAchievementProgress(); // Pega o estado atualizado de ambos
      }
    },
    [saveAchievementProgress] // Depende de saveAchievementProgress
  );

  // Função para obter o progresso de uma conquista específica
  const getAchievementProgress = useCallback(
    (id: string): AchievementProgress | null => {
      return progress[id] || null;
    },
    [progress] // Depende de progress
  );

  // Verificar se uma conquista foi recentemente desbloqueada
  const isRecentlyUnlocked = useCallback(
    (id: string): boolean => {
      return !!recentlyUnlocked.find((item) => item.id === id && !item.viewed);
    },
    [recentlyUnlocked] // Depende de recentlyUnlocked
  );

  // Função para verificar conquistas específicas
  const checkSpecificAchievement = useCallback(
    async (achievementType: string, value = 1) => {
      if (!user) return;
      const isFirstRun = Object.keys(progress).length === 0;
      // Não rodar na primeira vez (geralmente onboarding) para evitar popups imediatos
      if (isFirstRun) return;

      try {
        // A lógica interna usará a função `updateAchievementProgress` memoizada
        // Certifique-se que as dependências abaixo cobrem os dados lidos DENTRO do switch
        switch (achievementType) {
          case "meal_type_creation":
            if (mealTypes && mealTypes.length > 0) {
              await updateAchievementProgress(
                "meal_type_creation",
                value,
                true
              );
            }
            break;
          case "weight_tracking":
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
            break;
          case "workout_type_creation":
            const workoutTypes = getAvailableWorkoutTypes(); // Função do WorkoutContext
            if (workoutTypes && workoutTypes.length > 0) {
              await updateAchievementProgress(
                "workout_type_creation",
                value,
                true
              );
            }
            break;
          case "first_food":
            let hasFood = false;
            // Otimização: parar assim que encontrar comida
            for (const dateData of Object.values(meals)) {
              for (const mealFoods of Object.values(dateData)) {
                if (Array.isArray(mealFoods) && mealFoods.length > 0) {
                  hasFood = true;
                  break;
                }
              }
              if (hasFood) break;
            }
            if (hasFood) {
              await updateAchievementProgress("first_food", value, true);
            }
            break;
          case "workout_completion":
            const totalWorkouts = Object.values(workouts)
              .flatMap(Object.values) // Achata os treinos do dia
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
            break;
          case "caloric_goal":
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
            break;
          case "protein_goal":
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
            break;
          case "daily_login_streak": // Verificado por recordUserActivityAndUpdateStreak
            await updateAchievementProgress(
              "daily_login_streak_1",
              value,
              true
            );
            await updateAchievementProgress(
              "daily_login_streak_2",
              value,
              true
            );
            await updateAchievementProgress(
              "daily_login_streak_3",
              value,
              true
            );
            await updateAchievementProgress(
              "daily_login_streak_4",
              value,
              true
            );
            await updateAchievementProgress(
              "daily_login_streak_5",
              value,
              true
            );
            break;
          case "streak_days": // Verificado por recordUserActivityAndUpdateStreak
            await updateAchievementProgress("streak_days_1", value, true);
            await updateAchievementProgress("streak_days_2", value, true);
            await updateAchievementProgress("streak_days_3", value, true);
            await updateAchievementProgress("streak_days_4", value, true);
            await updateAchievementProgress("streak_days_5", value, true);
            break;
          case "progression_applied":
            if (appliedProgressionCount > 0) {
              await updateAchievementProgress(
                "progression_apply_1",
                appliedProgressionCount,
                true
              );
              await updateAchievementProgress(
                "progression_apply_2",
                appliedProgressionCount,
                true
              );
              await updateAchievementProgress(
                "progression_apply_3",
                appliedProgressionCount,
                true
              );
              await updateAchievementProgress(
                "progression_apply_4",
                appliedProgressionCount,
                true
              );
            }
            break;
          // Adicionar outros cases se necessário
        }
      } catch (error) {
        console.error(
          `Erro ao verificar conquista específica ${achievementType}:`,
          error
        );
      }
    },
    [
      user,
      progress, // Necessário para a verificação isFirstRun
      mealTypes,
      nutritionInfo, // Usado para weightHistory
      meals,
      workouts,
      caloricGoalDays,
      proteinGoalDays,
      appliedProgressionCount,
      getAvailableWorkoutTypes, // Função externa (espera-se estável)
      updateAchievementProgress, // Função memoizada
    ] // Dependências principais
  );

  // --- Funções para Conquistas Escondidas ---
  const check24hWarriorAchievement = useCallback(async () => {
    if (!user) return;
    const earlyBirdUnlocked = isAchievementUnlocked("early_bird");
    const nightOwlUnlocked = isAchievementUnlocked("night_owl");
    if (earlyBirdUnlocked && nightOwlUnlocked) {
      await updateAchievementProgress("hidden_24h_warrior", 1, true);
    }
  }, [user, isAchievementUnlocked, updateAchievementProgress]);

  const checkPerfectWeekAchievement = useCallback(async () => {
    if (!user || !workouts) return;
    try {
      const workoutDates = Object.keys(workouts)
        .filter((date) => Object.keys(workouts[date]).length > 0)
        .map((dateStr) => parseISO(dateStr));

      if (workoutDates.length < 7) return;
      workoutDates.sort((a, b) => a.getTime() - b.getTime());

      let perfectWeekFound = false;
      const checkedWeeks = new Set<string>();

      for (const date of workoutDates) {
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        const weekKey = format(weekStart, "yyyy-MM-dd");

        if (checkedWeeks.has(weekKey)) continue;

        const workoutsInThisWeek = workoutDates.filter((wd) =>
          isWithinInterval(wd, { start: weekStart, end: weekEnd })
        );
        const uniqueDaysWithWorkout = new Set(
          workoutsInThisWeek.map((d) => format(d, "yyyy-MM-dd"))
        );

        if (uniqueDaysWithWorkout.size >= 7) {
          perfectWeekFound = true;
          break;
        }
        checkedWeeks.add(weekKey);
      }

      if (perfectWeekFound) {
        await updateAchievementProgress("hidden_perfect_week", 1, true);
      }
    } catch (error) {
      console.error("Erro checkPerfectWeekAchievement:", error);
    }
  }, [user, workouts, updateAchievementProgress]);

  const checkConsistentChefAchievement = useCallback(async () => {
    if (!user || !meals) return;
    try {
      const mealDates = Object.keys(meals)
        .filter((date) => Object.keys(meals[date]).length > 0)
        .map((dateStr) => parseISO(dateStr))
        .sort((a, b) => a.getTime() - b.getTime());

      if (mealDates.length === 0) return;
      let maxStreak = 0;
      let currentMealStreak = 0;
      for (let i = 0; i < mealDates.length; i++) {
        if (i === 0) {
          currentMealStreak = 1;
        } else {
          const diff = differenceInDays(mealDates[i], mealDates[i - 1]);
          if (diff === 1) {
            currentMealStreak++;
          } else if (diff > 1) {
            currentMealStreak = 1;
          }
        }
        maxStreak = Math.max(maxStreak, currentMealStreak);
      }

      if (maxStreak > 0) {
        await updateAchievementProgress(
          "hidden_consistent_chef",
          maxStreak,
          true
        );
      }
    } catch (error) {
      console.error("Erro checkConsistentChefAchievement:", error);
    }
  }, [user, meals, updateAchievementProgress]);

  const checkMacroMasterAchievement = useCallback(async () => {
    if (!user || !nutritionInfo || !meals || !getDayTotals) return;
    const { protein, carbs, fat, calories } = nutritionInfo;
    if (
      !protein ||
      protein <= 0 ||
      !carbs ||
      carbs <= 0 ||
      !fat ||
      fat <= 0 ||
      !calories ||
      calories <= 0
    )
      return;

    try {
      const dayTotals = getDayTotals(); // Assumindo que é estável ou memoizada externamente
      const proteinMatch = Math.abs(dayTotals.protein - protein) < 1;
      const carbsMatch = Math.abs(dayTotals.carbs - carbs) < 1;
      const fatMatch = Math.abs(dayTotals.fat - fat) < 1;
      // Verificar também calorias para garantir consistência
      const caloriesMatch = Math.abs(dayTotals.calories - calories) < 1;

      if (proteinMatch && carbsMatch && fatMatch && caloriesMatch) {
        await updateAchievementProgress("hidden_macro_master", 1, true);
      }
    } catch (error) {
      console.error("Erro checkMacroMasterAchievement:", error);
    }
  }, [user, nutritionInfo, meals, getDayTotals, updateAchievementProgress]);

  const checkWeightWatcherAchievement = useCallback(async () => {
    if (
      !user ||
      !nutritionInfo?.weightHistory ||
      nutritionInfo.weightHistory.length < 7
    )
      return;
    try {
      const sortedHistory = [...nutritionInfo.weightHistory]
        .map((entry) => ({ ...entry, dateObj: parseISO(entry.date) }))
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
            consecutiveDays = 1;
          }
        }
        maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
      }

      if (maxConsecutive > 0) {
        await updateAchievementProgress(
          "hidden_weight_vigilant",
          maxConsecutive,
          true
        );
      }
    } catch (error) {
      console.error("Erro checkWeightWatcherAchievement:", error);
    }
  }, [user, nutritionInfo?.weightHistory, updateAchievementProgress]);

  // --- Funções de Carregamento (useCallback nelas também) ---

  const loadWaterGoalDays = useCallback(async () => {
    if (!user) return;
    try {
      const key = `${KEYS.WATER_GOAL_DAYS}_${user.uid}`;
      const stored = await AsyncStorage.getItem(key);
      setWaterGoalDays(stored ? parseInt(stored) : 0); // Definir 0 se não houver valor
    } catch (error) {
      console.error("Erro ao carregar dias de meta de água:", error);
      setWaterGoalDays(0); // Resetar em caso de erro
    }
  }, [user]);

  const loadCaloricGoalDays = useCallback(async () => {
    if (!user) return;
    try {
      const key = `${KEYS.CALORIC_GOAL_DAYS}_${user.uid}`;
      const stored = await AsyncStorage.getItem(key);
      setCaloricGoalDays(stored ? parseInt(stored) : 0);
    } catch (error) {
      console.error("Erro ao carregar dias de meta calórica:", error);
      setCaloricGoalDays(0);
    }
  }, [user]);

  const loadProteinGoalDays = useCallback(async () => {
    if (!user) return;
    try {
      const key = `${KEYS.PROTEIN_GOAL_DAYS}_${user.uid}`;
      const stored = await AsyncStorage.getItem(key);
      setProteinGoalDays(stored ? parseInt(stored) : 0);
    } catch (error) {
      console.error("Erro ao carregar dias de meta de proteína:", error);
      setProteinGoalDays(0);
    }
  }, [user]);

  const loadAppliedProgressionCount = useCallback(async () => {
    if (!user) return;
    try {
      const key = `${KEYS.APPLIED_PROGRESSION_COUNT}_${user.uid}`;
      const stored = await AsyncStorage.getItem(key);
      setAppliedProgressionCount(stored ? parseInt(stored) : 0);
    } catch (error) {
      console.error("Erro ao carregar contagem de progressão:", error);
      setAppliedProgressionCount(0);
    }
  }, [user]);

  const loadFitPoints = useCallback(async () => {
    if (!user) return;
    try {
      const key = `${KEYS.FITPOINTS}_${user.uid}`;
      const stored = await AsyncStorage.getItem(key);
      setFitPoints(stored ? parseInt(stored) : 0);
    } catch (error) {
      console.error("Erro ao carregar FitPoints:", error);
      setFitPoints(0);
    }
  }, [user]);

  // Salvar contagem de progressão (separado para ser usado)
  const saveAppliedProgressionCount = useCallback(
    async (count: number) => {
      if (!user) return;
      try {
        const countKey = `${KEYS.APPLIED_PROGRESSION_COUNT}_${user.uid}`;
        await AsyncStorage.setItem(countKey, count.toString());
        // Salvar também no Firebase
        await setDoc(
          doc(db, "users", user.uid, "gameData", "progressionStats"),
          { appliedCount: count, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (error) {
        console.error("Erro ao salvar contagem de progressão:", error);
      }
    },
    [user]
  );

  // Salvar dados da sequência (separado)
  const saveStreakData = useCallback(
    async (streak: number, lastDay: string | null) => {
      if (!user) return;
      const streakKey = `${KEYS.ACTIVITY_STREAK}_${user.uid}`;
      const lastDayKey = `${KEYS.LAST_ACTIVE_DAY}_${user.uid}`;
      try {
        await AsyncStorage.setItem(streakKey, streak.toString());
        if (lastDay) {
          await AsyncStorage.setItem(lastDayKey, lastDay);
        } else {
          await AsyncStorage.removeItem(lastDayKey); // Remover se for nulo
        }
        // Salvar no Firebase
        await setDoc(
          doc(db, "users", user.uid, "gameData", "activityStreak"),
          {
            streak,
            lastActivityDate: lastDay,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Erro ao salvar dados da sequência:", error);
      }
    },
    [user]
  );

  // Carregar dados da sequência
  const loadStreakData = useCallback(async () => {
    if (!user) return;
    const streakKey = `${KEYS.ACTIVITY_STREAK}_${user.uid}`;
    const lastDayKey = `${KEYS.LAST_ACTIVE_DAY}_${user.uid}`;
    try {
      const storedStreak = await AsyncStorage.getItem(streakKey);
      const storedLastDay = await AsyncStorage.getItem(lastDayKey);
      let loadedStreak = 0;
      let loadedLastDay: string | null = null;

      if (storedStreak) {
        loadedStreak = parseInt(storedStreak);
      }
      if (storedLastDay) {
        loadedLastDay = storedLastDay;
      }

      // Verificar expiração da sequência antes de definir o estado
      if (loadedLastDay) {
        const lastDate = parseISO(loadedLastDay); // Use parseISO
        const today = new Date();
        if (!isToday(lastDate) && !isYesterday(lastDate)) {
          loadedStreak = 0; // Zera a streak carregada
          // Não salva aqui, deixa o recordUserActivity... lidar com isso se necessário
        }
      }

      setCurrentStreak(loadedStreak);
      setLastActivityDate(loadedLastDay);
    } catch (error) {
      console.error("Erro ao carregar dados da sequência:", error);
      setCurrentStreak(0);
      setLastActivityDate(null);
    }
  }, [user]); // saveStreakData não é dependência direta do load

  // Registrar atividade e atualizar sequência
  const recordUserActivityAndUpdateStreak = useCallback(async () => {
    if (!user) return;

    const todayStr = format(new Date(), "yyyy-MM-dd");

    // Evitar processamento desnecessário se a data já for hoje
    if (lastActivityDate === todayStr) {
      return;
    }

    let newStreak = 0; // Começa com 0 por padrão
    const today = new Date();

    if (lastActivityDate) {
      try {
        const lastDate = parseISO(lastActivityDate); // Use parseISO
        if (isYesterday(lastDate)) {
          newStreak = currentStreak + 1; // Incrementa a streak atual do estado
        } else if (isToday(lastDate)) {
          newStreak = currentStreak; // Mantém a streak atual se já for hoje (redundante com a guarda inicial)
        } else {
          newStreak = 1; // Quebrou, começa com 1
        }
      } catch (e) {
        console.error("Erro ao parsear lastActivityDate:", lastActivityDate, e);
        newStreak = 1; // Resetar em caso de erro de parse
      }
    } else {
      // Primeira atividade registrada
      newStreak = 1;
    }

    // Atualiza o estado local ANTES de salvar e verificar conquistas
    setCurrentStreak(newStreak);
    setLastActivityDate(todayStr);

    // Salva os dados atualizados
    await saveStreakData(newStreak, todayStr);

    // Verifica as conquistas relacionadas à sequência com o novo valor
    // Apenas se a sequência for maior que 0 (ou seja, houve atividade)
    if (newStreak > 0) {
      await checkSpecificAchievement("daily_login_streak", newStreak);
      await checkSpecificAchievement("streak_days", newStreak);
    }
  }, [
    user,
    lastActivityDate,
    currentStreak,
    saveStreakData,
    checkSpecificAchievement,
  ]);

  // Carregar progresso geral das conquistas
  const loadAchievementProgress = useCallback(async () => {
    if (!user) return;
    try {
      // Tentar carregar do AsyncStorage
      const localProgressData = await AsyncStorage.getItem(
        `${KEYS.ACHIEVEMENTS_PROGRESS}:${user.uid}`
      );
      let progressData: Record<string, AchievementProgress> = {};

      if (localProgressData) {
        progressData = JSON.parse(localProgressData);
      } else {
        // Tentar do Firebase se local falhar
        const achievementsDoc = await getDoc(
          doc(db, "users", user.uid, "gameData", "achievements")
        );
        if (achievementsDoc.exists()) {
          progressData = achievementsDoc.data().progress || {};
          // Salvar no AsyncStorage após buscar do Firebase
          await AsyncStorage.setItem(
            `${KEYS.ACHIEVEMENTS_PROGRESS}:${user.uid}`,
            JSON.stringify(progressData)
          );
        }
      }

      // Carregar recentes
      const recentlyUnlockedData = await AsyncStorage.getItem(
        `${KEYS.RECENTLY_UNLOCKED_ACHIEVEMENTS}:${user.uid}`
      );
      let recentUnlocked: UnlockedAchievement[] = [];
      if (recentlyUnlockedData) {
        recentUnlocked = JSON.parse(recentlyUnlockedData);
        recentUnlocked = cleanUpRecentlyUnlocked(recentUnlocked); // Limpa
        // Salva a lista limpa de volta
        await AsyncStorage.setItem(
          `${KEYS.RECENTLY_UNLOCKED_ACHIEVEMENTS}:${user.uid}`,
          JSON.stringify(recentUnlocked)
        );
      }

      setProgress(progressData);
      setRecentlyUnlocked(recentUnlocked);
    } catch (error) {
      console.error("Erro ao carregar progresso das conquistas:", error);
      setProgress({}); // Resetar em caso de erro
      setRecentlyUnlocked([]);
    }
  }, [user, cleanUpRecentlyUnlocked]); // Depende de user e cleanUpRecentlyUnlocked

  // --- Funções de Verificação Geral ---

  // Verificar a conquista de passos diários
  const checkDailyStepsAchievement = useCallback(async () => {
    if (!user) return;
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const stepsKey = `${KEYS.STEPS_COUNT}_${user.uid}_${todayStr}`;
      const storedStepsData = await AsyncStorage.getItem(stepsKey);
      if (storedStepsData) {
        const dailySteps = parseInt(storedStepsData);
        if (!isNaN(dailySteps) && dailySteps > 0) {
          // Remover verificações para daily_steps_1 e daily_steps_2
          // await updateAchievementProgress("daily_steps_1", dailySteps, true);
          // await updateAchievementProgress("daily_steps_2", dailySteps, true);
          await updateAchievementProgress("daily_steps_3", dailySteps, true); // Manter 10k
          await updateAchievementProgress("daily_steps_4", dailySteps, true); // Manter 15k
          await updateAchievementProgress("daily_steps_5", dailySteps, true); // Manter 20k
        }
      }
    } catch (error) {
      console.error("Erro checkDailyStepsAchievement:", error);
    }
  }, [user, updateAchievementProgress]);

  // Função para verificar conquistas de meta de peso
  const checkWeightGoalAchievements = useCallback(async () => {
    if (!user || !nutritionInfo) return;
    const { weight, targetWeight, weightHistory } = nutritionInfo;
    if (
      weight === undefined ||
      targetWeight === undefined ||
      !weightHistory ||
      weightHistory.length === 0
    )
      return;

    try {
      const sortedHistory = [...weightHistory].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const initialWeight = sortedHistory[0].weight;
      const totalDifference = Math.abs(initialWeight - targetWeight);
      const coveredDifference = Math.abs(initialWeight - weight);
      let percentage = 0;
      if (totalDifference >= 0.1) {
        percentage = Math.min((coveredDifference / totalDifference) * 100, 100);
      }
      if (isNaN(percentage) || !isFinite(percentage)) {
        percentage = 0;
      }

      await updateAchievementProgress("weight_goals_1", percentage, true);
      await updateAchievementProgress("weight_goals_2", percentage, true);
      await updateAchievementProgress("weight_goals_3", percentage, true);
      await updateAchievementProgress("weight_goals_4", percentage, true);
      await updateAchievementProgress("weight_goals_5", percentage, true);
    } catch (error) {
      console.error("Erro checkWeightGoalAchievements:", error);
    }
  }, [user, nutritionInfo, updateAchievementProgress]);

  // Verificar todas as conquistas
  const checkAchievements = useCallback(async () => {
    if (!user) return;
    try {
      const isFirstRun = Object.keys(progress).length === 0;

      // Recarregar contadores ANTES das verificações que dependem deles
      // Estas funções já usam useCallback e dependem apenas de 'user'
      await loadWaterGoalDays();
      await loadCaloricGoalDays();
      await loadProteinGoalDays();
      await loadAppliedProgressionCount();

      // --- Verificações Iniciais (se não for firstRun) ---
      if (!isFirstRun) {
        if (mealTypes && mealTypes.length > 0) {
          await updateAchievementProgress("meal_type_creation", 1, true);
        }
        const workoutTypes = getAvailableWorkoutTypes();
        if (workoutTypes && workoutTypes.length > 0) {
          await updateAchievementProgress("workout_type_creation", 1, true);
        }
        let hasAddedFood = false;
        for (const dateData of Object.values(meals)) {
          // Otimizado
          for (const mealFoods of Object.values(dateData)) {
            if (Array.isArray(mealFoods) && mealFoods.length > 0) {
              hasAddedFood = true;
              break;
            }
          }
          if (hasAddedFood) break;
        }
        if (hasAddedFood) {
          await updateAchievementProgress("first_food", 1, true);
        }
      }

      // --- Verificações Baseadas em Contagem/Agregação ---
      const totalWorkouts = Object.values(workouts)
        .flatMap(Object.values)
        .filter((e) => e.length > 0).length;
      if (totalWorkouts > 0) {
        await updateAchievementProgress(
          "workout_completion_1",
          totalWorkouts,
          true
        );
        // ... (outras workout_completion)
      }

      const uniqueExercises = new Set();
      Object.values(workouts).forEach((dateWorkouts) => {
        Object.values(dateWorkouts).forEach((exercises) => {
          exercises.forEach((ex) => uniqueExercises.add(ex.id)); // Usar ex.id ou identificador único
        });
      });
      if (uniqueExercises.size > 0) {
        await updateAchievementProgress(
          "exercise_variety_1",
          uniqueExercises.size,
          true
        );
        // ... (outras exercise_variety)
      }

      // Dias de uso (app_usage) - lógica para incrementar apenas uma vez ao dia
      const appUsageProgress = progress["app_usage_1"]; // Checar apenas uma, todas usam o mesmo valor
      const appUsageDays = appUsageProgress?.currentValue || 0;
      const lastUpdatedStr = appUsageProgress?.lastUpdated;
      let lastUpdatedDateStr: string | null = null;
      if (lastUpdatedStr) {
        try {
          lastUpdatedDateStr = format(parseISO(lastUpdatedStr), "yyyy-MM-dd");
        } catch (e) {
          console.warn("Formato inválido em app_usage lastUpdated");
        }
      }
      const todayStr = format(new Date(), "yyyy-MM-dd");
      if (lastUpdatedDateStr !== todayStr) {
        const newAppUsageDays = appUsageDays + 1;
        await updateAchievementProgress("app_usage_1", newAppUsageDays, true);
        await updateAchievementProgress("app_usage_2", newAppUsageDays, true);
        await updateAchievementProgress("app_usage_3", newAppUsageDays, true);
        await updateAchievementProgress("app_usage_4", newAppUsageDays, true);
        await updateAchievementProgress("app_usage_5", newAppUsageDays, true);
      }

      const mealTrackingDays = Object.keys(meals).length;
      if (mealTrackingDays > 0) {
        await updateAchievementProgress(
          "meal_tracking_1",
          mealTrackingDays,
          true
        );
        // ... (outras meal_tracking)
      }

      const weightEntries = nutritionInfo.weightHistory?.length || 0;
      if (weightEntries > 0) {
        await updateAchievementProgress(
          "weight_tracking_1",
          weightEntries,
          true
        );
        // ... (outras weight_tracking)
      }

      // --- Verificações de Metas (se não for firstRun) ---
      if (!isFirstRun) {
        // Usa os valores carregados pelos loads no início da função
        if (waterGoalDays > 0) {
          await updateAchievementProgress(
            "water_intake_1",
            waterGoalDays,
            true
          );
          // ... (outras water_intake)
        }
        if (caloricGoalDays > 0) {
          await updateAchievementProgress(
            "caloric_goal_1",
            caloricGoalDays,
            true
          );
          // ... (outras caloric_goal)
        }
        if (proteinGoalDays > 0) {
          await updateAchievementProgress(
            "protein_goal_1",
            proteinGoalDays,
            true
          );
          // ... (outras protein_goal)
        }
      }

      // --- Verificações Específicas (Chamando funções memoizadas) ---
      await checkDailyStepsAchievement();
      await checkWeightGoalAchievements();

      // --- Verificação de Gatilho de Progressão Aplicada ---
      const progressionCheckTodayStr = format(new Date(), "yyyy-MM-dd"); // Renomeado
      const progressionAppliedKey = `${KEYS.LAST_PROGRESSION_APPLIED_CHECK_DATE}_${user.uid}`;
      const processedDateKey = `${KEYS.LAST_PROCESSED_PROGRESSION_APPLIED_DATE}_${user.uid}`;
      try {
        const lastAppliedDate = await AsyncStorage.getItem(
          progressionAppliedKey
        );
        const lastProcessedDate = await AsyncStorage.getItem(processedDateKey);

        if (
          lastAppliedDate === progressionCheckTodayStr &&
          lastProcessedDate !== progressionCheckTodayStr
        ) {
          // Incrementar o contador NO ESTADO antes de salvar/verificar
          setAppliedProgressionCount((prevCount) => {
            const newCount = prevCount + 1;
            // Salvar e verificar DENTRO do callback do setState garante usar o newCount correto
            saveAppliedProgressionCount(newCount);
            AsyncStorage.setItem(processedDateKey, progressionCheckTodayStr); // Marcar como processado
            checkSpecificAchievement("progression_applied", newCount);
            return newCount;
          });
        } else if (appliedProgressionCount > 0 && !isFirstRun) {
          // Se não houve aplicação hoje, apenas re-verifica com o valor atual do estado
          await checkSpecificAchievement(
            "progression_applied",
            appliedProgressionCount
          );
        }
      } catch (err) {
        console.error("Erro ao verificar gatilho de progressão:", err);
        // Fallback: Apenas re-verificar se tiver um contador
        if (appliedProgressionCount > 0 && !isFirstRun) {
          await checkSpecificAchievement(
            "progression_applied",
            appliedProgressionCount
          );
        }
      }

      // --- Verificações de Conquistas Escondidas ---
      await check24hWarriorAchievement();
      await checkPerfectWeekAchievement();
      await checkConsistentChefAchievement();
      await checkMacroMasterAchievement();
      await checkWeightWatcherAchievement();
    } catch (error) {
      console.error("Erro GERAL ao verificar conquistas:", error);
    }
  }, [
    user,
    progress, // Estados principais
    loadWaterGoalDays,
    loadCaloricGoalDays,
    loadProteinGoalDays,
    loadAppliedProgressionCount, // Funções de load
    mealTypes,
    meals,
    workouts,
    nutritionInfo, // Dados de outros contextos
    waterGoalDays,
    caloricGoalDays,
    proteinGoalDays,
    appliedProgressionCount, // Contadores carregados
    getAvailableWorkoutTypes, // Função externa
    updateAchievementProgress, // Funções memoizadas internas
    checkDailyStepsAchievement,
    checkWeightGoalAchievements,
    saveAppliedProgressionCount,
    checkSpecificAchievement,
    check24hWarriorAchievement,
    checkPerfectWeekAchievement,
    checkConsistentChefAchievement,
    checkMacroMasterAchievement,
    checkWeightWatcherAchievement,
  ]); // Dependências

  // Verificar conquistas retroativamente
  const checkRetroactiveAchievements = useCallback(async () => {
    if (!user) return;
    try {
      const retroCheckKey = `${RETROACTIVE_CHECK_KEY}_${user.uid}`;
      const hasCheckedRetroactive = await AsyncStorage.getItem(retroCheckKey);
      if (hasCheckedRetroactive === "true") return;

      // Usar setTimeout para dar tempo aos outros contextos carregarem
      const timerId = setTimeout(async () => {
        console.log("Iniciando verificação retroativa de conquistas...");
        await checkAchievements(); // Chama a função principal memoizada

        // Chamar verificações de hidden achievements explicitamente
        // para garantir que sejam checadas mesmo se checkAchievements falhar
        // ou se a lógica delas for complexa demais para checkAchievements cobrir inicialmente.
        await check24hWarriorAchievement();
        await checkPerfectWeekAchievement();
        await checkConsistentChefAchievement();
        await checkMacroMasterAchievement();
        await checkWeightWatcherAchievement();

        await AsyncStorage.setItem(retroCheckKey, "true");
        try {
          await setDoc(
            doc(db, "users", user.uid, "gameData", "retroChecks"),
            { achievementsChecked: true, checkedAt: new Date().toISOString() },
            { merge: true }
          );
        } catch (firebaseError) {
          /* Ignorar */
        }
        console.log("Verificação retroativa concluída.");
      }, 5000); // Atraso de 5 segundos

      // Limpar timeout se o componente desmontar
      return () => clearTimeout(timerId);
    } catch (error) {
      console.error(
        "Erro ao agendar/verificar conquistas retroativamente:",
        error
      );
    }
  }, [
    user,
    checkAchievements,
    check24hWarriorAchievement,
    checkPerfectWeekAchievement,
    checkConsistentChefAchievement,
    checkMacroMasterAchievement,
    checkWeightWatcherAchievement,
  ]);

  // --- useEffects ---

  // Carregar dados iniciais quando o usuário muda
  useEffect(() => {
    if (user) {
      // Encadear as cargas para garantir a ordem, especialmente para streak
      const loadData = async () => {
        await loadAchievementProgress();
        await loadWaterGoalDays();
        await loadCaloricGoalDays();
        await loadProteinGoalDays();
        await loadAppliedProgressionCount();
        await loadFitPoints();
        await loadStreakData(); // Carrega streak e lastActivityDate

        // *** CHAMA A ATUALIZAÇÃO DA STREAK AQUI ***
        // Após carregar, verifica se a atividade de hoje já ocorreu
        // ou se a sequência precisa ser atualizada/resetada para hoje.
        recordUserActivityAndUpdateStreak();
      };
      loadData();
    } else {
      // Limpar estado se não houver usuário
      setProgress({});
      setRecentlyUnlocked([]);
      setWaterGoalDays(0);
      setCaloricGoalDays(0);
      setProteinGoalDays(0);
      setAppliedProgressionCount(0);
      setFitPoints(0);
      setCurrentStreak(0);
      setLastActivityDate(null);
    }
  }, [
    user?.uid,
    loadAchievementProgress,
    loadWaterGoalDays,
    loadCaloricGoalDays,
    loadProteinGoalDays,
    loadAppliedProgressionCount,
    loadFitPoints,
    loadStreakData,
    recordUserActivityAndUpdateStreak,
  ]);

  // Disparar verificação retroativa após o carregamento inicial (se necessário)
  useEffect(() => {
    if (user) {
      checkRetroactiveAchievements();
    }
  }, [user?.uid, checkRetroactiveAchievements]);

  // useEffect para verificações normais (APÓS carregamento inicial)
  useEffect(() => {
    if (user && Object.keys(progress).length > 0) {
      // Garante que o progresso foi carregado
      const timer = setTimeout(() => {
        checkAchievements(); // Chama a função principal de verificação
      }, 1500); // Pequeno delay para evitar execuções excessivas em atualizações rápidas
      return () => clearTimeout(timer);
    }
  }, [user?.uid, progress, checkAchievements]);

  // useEffect para verificar meta de proteína diariamente
  useEffect(() => {
    const checkProteinGoal = async () => {
      if (!user || !nutritionInfo?.protein || !meals || !getDayTotals) return;

      const todayStr = format(new Date(), "yyyy-MM-dd");
      const dayTotals = getDayTotals();
      const targetProtein = nutritionInfo.protein;

      if (targetProtein > 0 && dayTotals.protein >= targetProtein) {
        const checkKey = `${KEYS.LAST_PROTEIN_GOAL_CHECK_DATE}_${user.uid}`;
        const lastCheck = await AsyncStorage.getItem(checkKey);
        if (lastCheck !== todayStr) {
          // Usar callback no setState para garantir valor correto
          setProteinGoalDays((prevDays) => {
            const newCount = prevDays + 1;
            const daysKey = `${KEYS.PROTEIN_GOAL_DAYS}_${user.uid}`;
            AsyncStorage.setItem(daysKey, newCount.toString()); // Salva novo contador
            AsyncStorage.setItem(checkKey, todayStr); // Salva data da checagem
            checkSpecificAchievement("protein_goal", newCount); // Verifica conquista
            return newCount;
          });
        }
      }
    };
    checkProteinGoal();
  }, [
    user,
    nutritionInfo?.protein,
    meals,
    getDayTotals,
    checkSpecificAchievement,
  ]);

  // --- Memoização das Stats e do Valor do Contexto ---

  // Memoizar cálculo das estatísticas
  const calculatedStats = useMemo((): AchievementStats => {
    try {
      const totalAchievements = achievements.length;
      const unlockedAchievementsList = Object.values(progress).filter(
        (p) => p.unlocked
      );
      const unlockedAchievementsCount = unlockedAchievementsList.length;

      const earnedPoints = unlockedAchievementsList.reduce(
        (total, progData) => {
          const ach = getAchievementById(progData.id);
          return total + (ach?.fitPoints || 0);
        },
        0
      );

      const totalPoints = achievements.reduce(
        (total, ach) => total + ach.fitPoints,
        0
      );
      const completionPercentage =
        totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

      const currentFitLevel = getCurrentFitLevel(fitPoints);
      const nextLevelInfo = getNextLevelProgress(fitPoints);

      return {
        totalAchievements,
        unlockedAchievements: unlockedAchievementsCount, // Usar a contagem correta
        totalPoints,
        earnedPoints,
        completionPercentage,
        totalFitPoints: fitPoints,
        currentFitLevel,
        nextFitLevel: nextLevelInfo.next,
        fitLevelProgress: nextLevelInfo.percentage,
        fitPointsToNextLevel: nextLevelInfo.pointsToNext,
        currentStreak, // Incluir a streak atual do estado
      };
    } catch (error) {
      console.error("Erro ao calcular estatísticas:", error);
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
  }, [achievements, progress, fitPoints, currentStreak]); // Dependências

  // Memoizar o valor final do contexto
  const contextValue = useMemo(
    () => ({
      achievements, // Estado estático (não muda)
      progress, // Estado (muda)
      recentlyUnlocked, // Estado (muda)
      stats: calculatedStats, // Valor memoizado
      // --- Funções Memoizadas ---
      checkAchievements,
      checkSpecificAchievement,
      markUnlockedAsViewed,
      getAchievementProgress,
      updateAchievementProgress,
      isRecentlyUnlocked, // Memoizada (depende de recentlyUnlocked)
      addFitPoints,
      // --- Funções NÃO Memoizadas intencionalmente ---
      // (Dependem diretamente de 'progress' ou são muito simples)
      isAchievementUnlocked,
      getAchievementValue,
      getCurrentFitPoints: () => fitPoints, // Simples getter, pode ser inline ou useCallback
    }),
    [
      // Dependências do Context Value:
      achievements,
      progress,
      recentlyUnlocked,
      calculatedStats,
      fitPoints, // Estados e valores memoizados
      checkAchievements,
      checkSpecificAchievement,
      markUnlockedAsViewed, // Funções memoizadas
      getAchievementProgress,
      updateAchievementProgress,
      isRecentlyUnlocked, // Funções memoizadas
      addFitPoints, // Função memoizada
      isAchievementUnlocked,
      getAchievementValue, // Funções que dependem de 'progress'
    ]
  );

  return (
    <AchievementContext.Provider value={contextValue}>
      {children}
    </AchievementContext.Provider>
  );
};
