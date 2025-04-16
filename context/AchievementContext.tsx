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
}

interface AchievementContextType {
  achievements: Achievement[];
  progress: Record<string, AchievementProgress>;
  recentlyUnlocked: UnlockedAchievement[];
  stats: AchievementStats;
  checkAchievements: () => Promise<void>;
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
  const { nutritionInfo } = useNutrition();

  const [achievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [progress, setProgress] = useState<Record<string, AchievementProgress>>(
    {}
  );
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<
    UnlockedAchievement[]
  >([]);
  // Estado para rastrear dias de meta de água atingida
  const [waterGoalDays, setWaterGoalDays] = useState<number>(0);

  // Estado para rastrear FitPoints
  const [fitPoints, setFitPoints] = useState<number>(0);

  // Carregar progresso das conquistas do AsyncStorage ou Firebase
  useEffect(() => {
    if (user) {
      loadAchievementProgress();
      loadWaterGoalDays();
      loadFitPoints();
    } else {
      // Limpar dados quando não houver usuário
      setProgress({});
      setRecentlyUnlocked([]);
      setWaterGoalDays(0);
      setFitPoints(0);
    }
  }, [user?.uid]);

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

  // Atualizar progresso de uma conquista
  const updateAchievementProgress = async (
    id: string,
    newValue: number,
    forceCheck = false
  ): Promise<UnlockedAchievement | null> => {
    const achievement = getAchievementById(id);
    if (!achievement) return null;

    // Verificar se já foi completado
    if (progress[id]?.unlocked && !forceCheck) {
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
    progress[id] = {
      ...progress[id],
      currentValue,
      lastUpdated: new Date().toISOString(),
      unlocked: isNowUnlocked,
    };

    // Se acabou de desbloquear, adicionar aos recentemente desbloqueados
    if (!wasUnlocked && isNowUnlocked) {
      const unlockedAchievement: UnlockedAchievement = {
        id: achievement.id,
        unlockedAt: new Date().toISOString(),
        viewed: false,
      };

      // Adicionar aos recentemente desbloqueados
      recentlyUnlocked.push(unlockedAchievement);

      // Adicionar os FitPoints
      await addFitPoints(achievement.fitPoints);

      // Salvar o progresso
      await saveAchievementProgress();

      return unlockedAchievement;
    }

    // Salvar o progresso se houve alteração
    if (progress[id].currentValue !== newValue) {
      await saveAchievementProgress();
    }

    return null;
  };

  // Verificar todas as conquistas com base nos dados atuais
  const checkAchievements = async () => {
    if (!user) return;

    // Recarregar os dados de água antes de verificar
    await loadWaterGoalDays();

    // Verificar conquista de criação de conta - apenas se ainda não foi desbloqueada
    const accountCreationProgress = progress["account_creation"];
    if (!accountCreationProgress || !accountCreationProgress.unlocked) {
      await updateAchievementProgress("account_creation", 1);
    }

    // Verificar conquistas apenas se não estiverem completamente desbloqueadas
    const checksToRun = [
      {
        id: "workout_completion",
        getValue: () =>
          Object.values(workouts)
            .flatMap((dateWorkouts) => Object.values(dateWorkouts))
            .filter((exercises) => exercises.length > 0).length,
      },
      {
        id: "streak_days",
        getValue: () => progress["streak_days"]?.currentValue || 0,
        forceCheck: true,
      },
      {
        id: "exercise_variety",
        getValue: () => {
          const uniqueExercises = new Set();
          Object.values(workouts).forEach((dateWorkouts) => {
            Object.values(dateWorkouts).forEach((exercises) => {
              exercises.forEach((exercise) => {
                uniqueExercises.add(exercise.id);
              });
            });
          });
          return uniqueExercises.size;
        },
      },
      {
        id: "meal_tracking",
        getValue: () => {
          // Conta o número de dias diferentes para os quais o usuário registrou refeições
          return Object.keys(meals).length;
        },
      },
      {
        id: "weight_tracking",
        getValue: () => nutritionInfo.weightHistory?.length || 0,
      },
      {
        id: "nutrition_goals",
        getValue: () => {
          // Precisamos verificar se o usuário atingiu as metas de calorias e macros para o dia atual
          // Obter as metas definidas do usuário
          const targetCalories = nutritionInfo.calories || 0;
          const targetProtein = nutritionInfo.protein || 0;
          const targetCarbs = nutritionInfo.carbs || 0;
          const targetFat = nutritionInfo.fat || 0;

          if (targetCalories === 0) return 0; // Se não há meta definida, retornar 0

          // Obter os totais consumidos no dia atual
          const consumedTotals = getDayTotals();
          const consumedCalories = consumedTotals.calories || 0;
          const consumedProtein = consumedTotals.protein || 0;
          const consumedCarbs = consumedTotals.carbs || 0;
          const consumedFat = consumedTotals.fat || 0;

          // Calcular a porcentagem de cada meta atingida
          const caloriesPercentage = Math.min(
            100,
            (consumedCalories / targetCalories) * 100
          );
          const proteinPercentage = Math.min(
            100,
            (consumedProtein / targetProtein) * 100
          );
          const carbsPercentage = Math.min(
            100,
            (consumedCarbs / targetCarbs) * 100
          );
          const fatPercentage = Math.min(100, (consumedFat / targetFat) * 100);

          // Consideramos que a meta foi atingida se todas as metas individuais estiverem em pelo menos 90%
          const metaAtingida =
            caloriesPercentage >= 90 &&
            proteinPercentage >= 90 &&
            carbsPercentage >= 90 &&
            fatPercentage >= 90;

          // Retornar o valor atual do progresso mais 1 se a meta foi atingida hoje
          const currentProgress =
            progress["nutrition_goals"]?.currentValue || 0;

          // Verificar se já atualizamos hoje
          const lastUpdated = progress["nutrition_goals"]?.lastUpdated
            ? new Date(progress["nutrition_goals"].lastUpdated).toDateString()
            : null;
          const today = new Date().toDateString();

          if (metaAtingida && (!lastUpdated || lastUpdated !== today)) {
            return currentProgress + 1;
          }

          return currentProgress; // Retornar o valor atual se não atingiu a meta ou já foi contabilizado hoje
        },
      },
      {
        id: "water_intake",
        getValue: () => {
          // Usar o valor que já foi carregado no estado
          return waterGoalDays;
        },
      },
      {
        id: "first_food",
        getValue: () => {
          // Verificar se há pelo menos um alimento em qualquer refeição
          let hasAnyFood = false;

          // Percorrer todas as datas e refeições para encontrar qualquer alimento
          Object.values(meals).forEach((dateData) => {
            Object.values(dateData).forEach((mealFoods) => {
              if (Array.isArray(mealFoods) && mealFoods.length > 0) {
                hasAnyFood = true;
              }
            });
          });

          return hasAnyFood ? 1 : 0;
        },
      },
      {
        id: "meal_type_creation",
        getValue: () => {
          // Verificar se há pelo menos um tipo de refeição configurado
          return mealTypes && mealTypes.length > 0 ? 1 : 0;
        },
      },
      {
        id: "workout_type_creation",
        getValue: () => {
          // Verificar se há pelo menos um tipo de treino configurado
          const availableTypes = getAvailableWorkoutTypes();
          return availableTypes && availableTypes.length > 0 ? 1 : 0;
        },
      },
      {
        id: "daily_login_streak",
        getValue: () => {
          // Verificar o último acesso para atualizar o streak
          const currentStreak =
            progress["daily_login_streak"]?.currentValue || 0;

          // Verificar a data do último login
          const lastLoginDate = progress["daily_login_streak"]?.lastUpdated
            ? new Date(progress["daily_login_streak"].lastUpdated)
            : null;

          if (!lastLoginDate) {
            // Primeiro login, começa com 1
            return 1;
          }

          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          // Verificar se o último login foi ontem
          const lastLoginDay = lastLoginDate.setHours(0, 0, 0, 0);
          const yesterdayDay = yesterday.setHours(0, 0, 0, 0);

          if (lastLoginDay === yesterdayDay) {
            // Último login foi ontem, incrementar streak
            return currentStreak + 1;
          } else {
            const todayDay = today.setHours(0, 0, 0, 0);

            if (lastLoginDay === todayDay) {
              // Já logou hoje, manter o streak atual
              return currentStreak;
            } else {
              // Quebrou o streak, começar de novo
              return 1;
            }
          }
        },
      },
      {
        id: "early_bird",
        getValue: () => {
          // Verificar se já desbloqueou essa conquista
          if (progress["early_bird"]?.unlocked) {
            return 1; // Já desbloqueada
          }

          // Verificar se há treinos realizados hoje
          const today = new Date().toISOString().split("T")[0];
          const todayWorkouts = workouts[today] || {};

          // Verificar a hora dos treinos
          const earlyMorningWorkout = Object.values(todayWorkouts).some(
            (exercises) => {
              if (exercises.length === 0) return false;

              // Verificar se o treino foi iniciado antes das 7h
              const now = new Date();
              return now.getHours() < 7;
            }
          );

          return earlyMorningWorkout ? 1 : 0;
        },
      },
      {
        id: "night_owl",
        getValue: () => {
          // Verificar se já desbloqueou essa conquista
          if (progress["night_owl"]?.unlocked) {
            return 1; // Já desbloqueada
          }

          // Verificar se há treinos realizados hoje
          const today = new Date().toISOString().split("T")[0];
          const todayWorkouts = workouts[today] || {};

          // Verificar a hora dos treinos
          const lateNightWorkout = Object.values(todayWorkouts).some(
            (exercises) => {
              if (exercises.length === 0) return false;

              // Verificar se o treino foi iniciado depois das 22h
              const now = new Date();
              return now.getHours() >= 22;
            }
          );

          return lateNightWorkout ? 1 : 0;
        },
      },
    ];

    // Executar as verificações em paralelo
    await Promise.all(
      checksToRun
        .filter((check) => !isAchievementAlreadyCompleted(check.id))
        .map(async (check) => {
          const value = check.getValue();
          if (value > 0) {
            await updateAchievementProgress(check.id, value, check.forceCheck);
          }
        })
    );

    // Verificar dias de uso do app - esta verificação precisa ser especial
    // Só incrementamos uma vez por dia, verificando a data do último update
    const appUsageProgress = progress["app_usage"];
    const appUsageDays = appUsageProgress?.currentValue || 0;

    // Verificar se já incrementamos hoje
    const lastUpdated = appUsageProgress?.lastUpdated
      ? new Date(appUsageProgress.lastUpdated).toDateString()
      : null;
    const today = new Date().toDateString();

    // Só incrementa se for a primeira vez no dia ou não existir registro
    if (
      (!lastUpdated || lastUpdated !== today) &&
      !isAchievementAlreadyCompleted("app_usage")
    ) {
      await updateAchievementProgress("app_usage", appUsageDays + 1);
    }

    // Verificar progresso do objetivo de peso (se houver objetivo)
    if (
      nutritionInfo.weight &&
      nutritionInfo.targetWeight &&
      !isAchievementAlreadyCompleted("weight_goals")
    ) {
      const initialDifference = Math.abs(
        nutritionInfo.weight - nutritionInfo.targetWeight
      );
      const currentDifference =
        nutritionInfo.weightHistory && nutritionInfo.weightHistory.length > 0
          ? Math.abs(
              nutritionInfo.weightHistory[
                nutritionInfo.weightHistory.length - 1
              ].weight - nutritionInfo.targetWeight
            )
          : initialDifference;

      // Calcular o progresso como porcentagem do objetivo alcançado
      const progress = Math.min(
        100,
        Math.max(0, 100 - (currentDifference / initialDifference) * 100)
      );

      await updateAchievementProgress("weight_goals", Math.round(progress));
    }
  };

  // Marcar uma conquista desbloqueada como visualizada
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
      await saveAchievementProgress();
    }
  };

  // Obter o progresso de uma conquista específica
  const getAchievementProgress = (id: string): AchievementProgress | null => {
    return progress[id] || null;
  };

  // Verificar se uma conquista foi recentemente desbloqueada
  const isRecentlyUnlocked = (id: string): boolean => {
    return !!recentlyUnlocked.find((item) => item.id === id && !item.viewed);
  };

  // Substituir getHighestUnlockedLevel por isAchievementUnlocked
  const isAchievementUnlocked = (id: string): boolean => {
    return progress[id]?.unlocked ?? false;
  };

  // Substituir getNextLevel
  const getAchievementValue = (id: string): number => {
    return progress[id]?.currentValue ?? 0;
  };

  // Definir o valor do contexto
  const contextValue = useMemo(
    () => ({
      achievements,
      progress,
      recentlyUnlocked,
      stats: calculateStats(),
      checkAchievements,
      markUnlockedAsViewed,
      getAchievementProgress,
      isAchievementUnlocked,
      updateAchievementProgress,
      isRecentlyUnlocked,
      getCurrentFitPoints,
      addFitPoints,
      getAchievementValue,
    }),
    [achievements, progress, recentlyUnlocked, fitPoints]
  );

  return (
    <AchievementContext.Provider value={contextValue}>
      {children}
    </AchievementContext.Provider>
  );
};

// Hook de compatibilidade para uso em componentes existentes
export const useAchievementContext = useAchievements;
