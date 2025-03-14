import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import * as Haptics from "expo-haptics";
import { useAuth } from "./AuthContext";
import { WorkoutType } from "../components/training/WorkoutConfigSheet";

// Interface para série individual
export interface ExerciseSet {
  id: string;
  reps: number;
  weight: number;
  completed?: boolean;
}

// Interface para exercício
export interface Exercise {
  id: string;
  name: string;
  sets?: ExerciseSet[]; // Opcional
  notes?: string;
  cardioDuration?: number; // Duração em minutos para exercícios de cardio
  cardioIntensity?: number; // Intensidade de 1-10 para exercícios de cardio
  category?: "força" | "cardio" | "flexibilidade" | "equilíbrio"; // Categoria do exercício
  completed?: boolean;
}

// Interface para treino (workout)
export interface Workout {
  id: string;
  name: string;
  icon?: string; // Tornar opcional para compatibilidade
  iconType?: { type: string; name: string }; // Adicionar propriedade iconType
  color: string;
  exercises: Exercise[];
}

// Interface para totais do treino
interface WorkoutTotals {
  totalExercises: number;
  totalSets: number;
  totalVolume: number; // Volume total (peso * reps * sets)
  totalDuration: number; // Duração total em minutos
  avgWeight: number; // Carga média
  maxWeight: number; // Carga máxima
  avgReps: number; // Repetições médias
  totalReps: number; // Total de repetições
}

// Interface para metas de treino
interface TrainingGoals {
  targetExercises?: number;
  targetSets?: number;
  targetVolume?: number;
  targetDuration?: number;
}

// Interface para o template semanal de treinos
interface WeeklyWorkoutTemplate {
  [dayOfWeek: number]: { [workoutId: string]: Exercise[] }; // 0 = domingo, 1 = segunda, ..., 6 = sábado
}

// Interface para o contexto de treinos
interface WorkoutContextType {
  workouts: { [date: string]: { [workoutId: string]: Exercise[] } };
  workoutTypes: WorkoutType[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  getWorkoutTotals: (workoutId: string) => WorkoutTotals;
  getExercisesForWorkout: (workoutId: string) => Exercise[];
  getDayTotals: () => WorkoutTotals;
  addExerciseToWorkout: (workoutId: string, exercise: Exercise) => void;
  removeExerciseFromWorkout: (
    workoutId: string,
    exerciseId: string
  ) => Promise<void>;
  updateExerciseInWorkout: (
    workoutId: string,
    exercise: Exercise
  ) => Promise<void>;
  saveWorkouts: () => Promise<void>;
  addWorkoutType: (
    id: string,
    name: string,
    icon: string,
    color: string
  ) => void;
  resetWorkoutTypes: () => Promise<void>;
  updateWorkoutTypes: (workoutTypes: WorkoutType[]) => Promise<void>;
  hasWorkoutTypesConfigured: boolean;
  getWorkoutTypeById: (id: string) => WorkoutType | undefined;
  setWorkouts: React.Dispatch<
    React.SetStateAction<{
      [date: string]: { [workoutId: string]: Exercise[] };
    }>
  >;
  trainingGoals: TrainingGoals | null;
  updateTrainingGoals: (goals: TrainingGoals) => Promise<void>;
  getPreviousWorkoutTotals: (workoutId: string) => {
    totals: WorkoutTotals | null;
    date: string | null;
  };
  removeWorkout: (workoutId: string) => Promise<void>;
  // Novas funções para o template semanal
  weeklyTemplate: WeeklyWorkoutTemplate;
  setWeeklyTemplate: React.Dispatch<
    React.SetStateAction<WeeklyWorkoutTemplate>
  >;
  updateWeeklyTemplate: (template: WeeklyWorkoutTemplate) => Promise<void>;
  getWorkoutsForDate: (date: string) => { [workoutId: string]: Exercise[] };
  addWorkoutToWeeklyTemplate: (dayOfWeek: number, workoutId: string) => void;
  removeWorkoutFromWeeklyTemplate: (
    dayOfWeek: number,
    workoutId: string
  ) => Promise<void>;
  hasWeeklyTemplateConfigured: boolean;
  // Nova função para copiar treino de uma data anterior
  copyWorkoutFromDate: (
    sourceDate: string,
    sourceWorkoutId: string,
    targetWorkoutId: string
  ) => Promise<void>;
}

// Criação do contexto
const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

// Provider do contexto
export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.uid || "anonymous";

  // Estados
  const [workouts, setWorkouts] = useState<{
    [date: string]: { [workoutId: string]: Exercise[] };
  }>({});
  const [workoutTypes, setWorkoutTypes] = useState<WorkoutType[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [hasWorkoutTypesConfigured, setHasWorkoutTypesConfigured] =
    useState<boolean>(false);
  const [trainingGoals, setTrainingGoals] = useState<TrainingGoals | null>(
    null
  );

  // Novo estado para o template semanal
  const [weeklyTemplate, setWeeklyTemplate] = useState<WeeklyWorkoutTemplate>(
    {}
  );
  const [hasWeeklyTemplateConfigured, setHasWeeklyTemplateConfigured] =
    useState<boolean>(false);

  // Carregar treinos do AsyncStorage
  const loadWorkouts = async () => {
    try {
      const storedWorkouts = await AsyncStorage.getItem(
        `@pumpgym:workouts:${userId}`
      );
      if (storedWorkouts) {
        const parsedWorkouts = JSON.parse(storedWorkouts);
        setWorkouts(parsedWorkouts);
      }
    } catch (error) {
      // Erro ao carregar treinos
    }
  };

  // Carregar template semanal do AsyncStorage
  const loadWeeklyTemplate = async () => {
    try {
      const storedTemplate = await AsyncStorage.getItem(
        `@pumpgym:weeklyTemplate:${userId}`
      );
      if (storedTemplate) {
        const parsedTemplate = JSON.parse(storedTemplate);
        setWeeklyTemplate(parsedTemplate);

        // Verificar se há pelo menos um dia configurado no template
        const hasAnyDayConfigured = Object.keys(parsedTemplate).length > 0;
        setHasWeeklyTemplateConfigured(hasAnyDayConfigured);
      } else {
        setHasWeeklyTemplateConfigured(false);
      }
    } catch (error) {
      // Erro ao carregar template semanal
      setHasWeeklyTemplateConfigured(false);
    }
  };

  // Carregar tipos de treinos do AsyncStorage
  const loadWorkoutTypes = async () => {
    try {
      const storedWorkoutTypes = await AsyncStorage.getItem(
        `@pumpgym:workoutTypes:${userId}`
      );
      if (storedWorkoutTypes) {
        const parsedWorkoutTypes = JSON.parse(storedWorkoutTypes);
        setWorkoutTypes(parsedWorkoutTypes);
        setHasWorkoutTypesConfigured(parsedWorkoutTypes.length > 0);
      } else {
        setHasWorkoutTypesConfigured(false);
      }
    } catch (error) {
      // Erro ao carregar tipos de treinos
      setHasWorkoutTypesConfigured(false);
    }
  };

  // Carregar metas de treino do AsyncStorage
  const loadTrainingGoals = async () => {
    try {
      const storedGoals = await AsyncStorage.getItem(
        `@pumpgym:trainingGoals:${userId}`
      );
      if (storedGoals) {
        const parsedGoals = JSON.parse(storedGoals);
        setTrainingGoals(parsedGoals);
      }
    } catch (error) {
      // Erro ao carregar metas de treino
    }
  };

  // Efeito para carregar dados do AsyncStorage
  useEffect(() => {
    if (userId) {
      // Limpar os estados antes de carregar novos dados
      setWorkouts({});
      setWorkoutTypes([]);
      setTrainingGoals(null);
      setWeeklyTemplate({});
      setHasWorkoutTypesConfigured(false);
      setHasWeeklyTemplateConfigured(false);

      // Carregar dados do usuário atual
      loadWorkouts();
      loadWorkoutTypes();
      loadTrainingGoals();
      loadWeeklyTemplate();
    }
  }, [userId]);

  // Efeito para limpar dados quando o usuário muda
  useEffect(() => {
    // Função para limpar todos os dados quando o usuário faz logout
    const clearAllData = () => {
      setWorkouts({});
      setWorkoutTypes([]);
      setTrainingGoals(null);
      setWeeklyTemplate({});
      setHasWorkoutTypesConfigured(false);
      setHasWeeklyTemplateConfigured(false);
    };

    // Limpar dados se userId for 'anonymous' ou vazio
    if (!userId || userId === "anonymous") {
      clearAllData();
    }

    return () => {
      // Limpar dados quando o componente for desmontado
      clearAllData();
    };
  }, [userId]);

  // Atualizar o template semanal
  const updateWeeklyTemplate = async (template: WeeklyWorkoutTemplate) => {
    try {
      setWeeklyTemplate(template);

      // Verificar se há pelo menos um dia configurado no template
      const hasAnyDayConfigured = Object.keys(template).length > 0;
      setHasWeeklyTemplateConfigured(hasAnyDayConfigured);

      // Salvar no AsyncStorage
      await AsyncStorage.setItem(
        `@pumpgym:weeklyTemplate:${userId}`,
        JSON.stringify(template)
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Erro ao atualizar template semanal
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Adicionar um treino ao template semanal
  const addWorkoutToWeeklyTemplate = (dayOfWeek: number, workoutId: string) => {
    try {
      setWeeklyTemplate((prev) => {
        const updatedTemplate = { ...prev };

        // Garantir que existe uma entrada para o dia da semana
        if (!updatedTemplate[dayOfWeek]) {
          updatedTemplate[dayOfWeek] = {};
        }

        // Inicializar o treino para o dia da semana
        if (!updatedTemplate[dayOfWeek][workoutId]) {
          updatedTemplate[dayOfWeek][workoutId] = [];
        }

        return updatedTemplate;
      });

      // Atualizar o estado de configuração
      setHasWeeklyTemplateConfigured(true);

      // Salvar no AsyncStorage
      saveWeeklyTemplate();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Erro ao adicionar treino ao template semanal
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Remover um treino do template semanal
  const removeWorkoutFromWeeklyTemplate = async (
    dayOfWeek: number,
    workoutId: string
  ) => {
    try {
      setWeeklyTemplate((prev) => {
        const updatedTemplate = { ...prev };

        // Verificar se existe uma entrada para o dia da semana
        if (updatedTemplate[dayOfWeek]) {
          // Remover o treino
          delete updatedTemplate[dayOfWeek][workoutId];

          // Se não houver mais treinos para este dia, remover o dia
          if (Object.keys(updatedTemplate[dayOfWeek]).length === 0) {
            delete updatedTemplate[dayOfWeek];
          }
        }

        return updatedTemplate;
      });

      // Verificar se ainda há algum dia configurado
      const hasAnyDayConfigured = Object.keys(weeklyTemplate).length > 0;
      setHasWeeklyTemplateConfigured(hasAnyDayConfigured);

      // Salvar no AsyncStorage
      await saveWeeklyTemplate();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Erro ao remover treino do template semanal
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Salvar o template semanal no AsyncStorage
  const saveWeeklyTemplate = async () => {
    try {
      await AsyncStorage.setItem(
        `@pumpgym:weeklyTemplate:${userId}`,
        JSON.stringify(weeklyTemplate)
      );
    } catch (error) {
      // Erro ao salvar template semanal
    }
  };

  // Obter treinos para uma data específica, combinando o template semanal e modificações específicas
  const getWorkoutsForDate = (
    date: string
  ): { [workoutId: string]: Exercise[] } => {
    try {
      // Verificar se há treinos específicos para a data
      const specificWorkouts = workouts[date] || {};

      // Converter a data para o dia da semana (0 = domingo, 1 = segunda, ..., 6 = sábado)
      const [year, month, day] = date.split("-").map(Number);
      // Mês em JavaScript é 0-indexed (0 = janeiro, 11 = dezembro)
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.getDay();

      // Verificar se há treinos configurados para este dia da semana
      const templateWorkouts = weeklyTemplate[dayOfWeek] || {};

      // Combinar os treinos do template com os treinos específicos
      const combinedWorkouts: { [workoutId: string]: Exercise[] } = {};

      // Adicionar todos os treinos do template para este dia da semana
      Object.keys(templateWorkouts).forEach((workoutId) => {
        // Se não houver exercícios específicos para este treino nesta data,
        // usar um array vazio (o usuário pode adicionar exercícios depois)
        combinedWorkouts[workoutId] = specificWorkouts[workoutId] || [];
      });

      return combinedWorkouts;
    } catch (error) {
      // Erro ao obter treinos para a data
      return {};
    }
  };

  // Adicionar tipo de treino
  const addWorkoutType = async (
    id: string,
    name: string,
    icon: string,
    color: string
  ) => {
    try {
      // Converter a string icon para o formato WorkoutIconType
      const iconType = {
        type: "material" as "material" | "ionicons" | "fontawesome",
        name: icon as any, // Usando any temporariamente para evitar erros de tipo
      };

      const newWorkoutType: WorkoutType = {
        id,
        name,
        iconType, // Usando iconType em vez de icon
        color,
        selected: true,
      };

      const updatedWorkoutTypes = [...workoutTypes, newWorkoutType];
      setWorkoutTypes(updatedWorkoutTypes);
      setHasWorkoutTypesConfigured(true);

      await AsyncStorage.setItem(
        `@pumpgym:workoutTypes:${userId}`,
        JSON.stringify(updatedWorkoutTypes)
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Erro ao adicionar tipo de treino
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Resetar tipos de treinos
  const resetWorkoutTypes = async () => {
    try {
      setWorkoutTypes([]);
      setHasWorkoutTypesConfigured(false);

      // Também limpar o template semanal
      setWeeklyTemplate({});
      setHasWeeklyTemplateConfigured(false);

      await AsyncStorage.removeItem(`@pumpgym:workoutTypes:${userId}`);
      // Também remover o template semanal do AsyncStorage
      await AsyncStorage.removeItem(`@pumpgym:weeklyTemplate:${userId}`);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Erro ao resetar tipos de treinos
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  /**
   * Atualiza os tipos de treino disponíveis.
   * Esta função é chamada quando o usuário confirma a configuração de treinos no WorkoutConfigSheet.
   *
   * Comportamento:
   * 1. Atualiza os tipos de treino no estado e no AsyncStorage
   * 2. Não adiciona treinos específicos para o dia atual, pois usamos apenas o template semanal
   */
  const updateWorkoutTypes = async (newWorkoutTypes: WorkoutType[]) => {
    try {
      // Atualizar os tipos de treino no estado
      setWorkoutTypes(newWorkoutTypes);
      setHasWorkoutTypesConfigured(newWorkoutTypes.length > 0);

      // Salvar os tipos de treino no AsyncStorage
      await AsyncStorage.setItem(
        `@pumpgym:workoutTypes:${userId}`,
        JSON.stringify(newWorkoutTypes)
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Erro ao atualizar tipos de treinos
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Adicionar exercício a um treino
  const addExerciseToWorkout = (workoutId: string, exercise: Exercise) => {
    try {
      // Verificar se o exercício já existe no treino
      const existingExercises = getExercisesForWorkout(workoutId);
      const exerciseExists = existingExercises.some(
        (ex) => ex.id === exercise.id
      );

      if (exerciseExists) {
        return;
      }

      // Adicionar o exercício ao treino específico para a data selecionada
      setWorkouts((prev) => {
        const updatedWorkouts = { ...prev };

        // Garantir que existe uma entrada para a data selecionada
        if (!updatedWorkouts[selectedDate]) {
          updatedWorkouts[selectedDate] = {};
        }

        // Garantir que existe uma entrada para o treino
        if (!updatedWorkouts[selectedDate][workoutId]) {
          updatedWorkouts[selectedDate][workoutId] = [];
        }

        // Adicionar o exercício ao treino
        updatedWorkouts[selectedDate][workoutId] = [
          ...updatedWorkouts[selectedDate][workoutId],
          exercise,
        ];

        return updatedWorkouts;
      });

      // Salvar os treinos
      saveWorkouts();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Erro ao adicionar exercício ao treino
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Remover exercício de um treino
  const removeExerciseFromWorkout = async (
    workoutId: string,
    exerciseId: string
  ) => {
    try {
      // Remover o exercício do treino específico para a data selecionada
      setWorkouts((prev) => {
        const updatedWorkouts = { ...prev };

        // Verificar se existe uma entrada para a data selecionada e o treino
        if (
          !updatedWorkouts[selectedDate] ||
          !updatedWorkouts[selectedDate][workoutId]
        ) {
          return updatedWorkouts;
        }

        // Remover o exercício do treino
        updatedWorkouts[selectedDate][workoutId] = updatedWorkouts[
          selectedDate
        ][workoutId].filter((exercise) => exercise.id !== exerciseId);

        return updatedWorkouts;
      });

      // Salvar os treinos
      await saveWorkouts();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Erro ao remover exercício
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Atualizar exercício em um treino
  const updateExerciseInWorkout = async (
    workoutId: string,
    updatedExercise: Exercise
  ) => {
    try {
      // Atualizar o exercício no treino específico para a data selecionada
      setWorkouts((prev) => {
        const updatedWorkouts = { ...prev };

        // Verificar se existe uma entrada para a data selecionada e o treino
        if (
          !updatedWorkouts[selectedDate] ||
          !updatedWorkouts[selectedDate][workoutId]
        ) {
          return updatedWorkouts;
        }

        // Atualizar o exercício no treino
        updatedWorkouts[selectedDate][workoutId] = updatedWorkouts[
          selectedDate
        ][workoutId].map((exercise) =>
          exercise.id === updatedExercise.id ? updatedExercise : exercise
        );

        return updatedWorkouts;
      });

      // Salvar os treinos
      await saveWorkouts();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Erro ao atualizar exercício no treino
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Salvar treinos no AsyncStorage
  const saveWorkouts = async () => {
    try {
      if (Object.keys(workouts).length === 0) return;
      await AsyncStorage.setItem(
        `@pumpgym:workouts:${userId}`,
        JSON.stringify(workouts)
      );
    } catch (error) {
      // Erro ao salvar treinos
    }
  };

  // Obter exercícios para um treino específico
  const getExercisesForWorkout = (workoutId: string): Exercise[] => {
    try {
      // Obter os treinos para a data selecionada (combinando template e específicos)
      const workoutsForDate = getWorkoutsForDate(selectedDate);

      // Verificar se existe o treino para esta data
      if (!workoutsForDate[workoutId]) {
        return [];
      }

      return workoutsForDate[workoutId];
    } catch (error) {
      // Erro ao obter exercícios para o treino
      return [];
    }
  };

  // Obter totais de um treino específico
  const getWorkoutTotals = (workoutId: string): WorkoutTotals => {
    // Inicializar com valores padrão
    const totals: WorkoutTotals = {
      totalExercises: 0,
      totalSets: 0,
      totalVolume: 0,
      totalDuration: 0,
      avgWeight: 0,
      maxWeight: 0,
      avgReps: 0,
      totalReps: 0,
    };

    // Obter os treinos para a data selecionada (combinando template e específicos)
    const workoutsForDate = getWorkoutsForDate(selectedDate);

    // Verificar se existe o treino para esta data
    if (!workoutsForDate[workoutId]) {
      return totals;
    }

    const exercises = workoutsForDate[workoutId];

    // Calcular os totais
    totals.totalExercises = exercises.length;

    // Variáveis para calcular médias
    let totalWeightSum = 0;
    let totalWeightCount = 0;
    let totalRepsSum = 0;
    let totalRepsCount = 0;
    let maxWeightFound = 0;

    exercises.forEach((exercise) => {
      // Calcular duração para exercícios de cardio
      if (exercise.category === "cardio" && exercise.cardioDuration) {
        totals.totalDuration += exercise.cardioDuration;
      }

      // Calcular séries e volume para exercícios de força
      if (exercise.sets && exercise.category !== "cardio") {
        totals.totalSets += exercise.sets.length;

        // Calcular o volume total (peso * reps * sets) e outras estatísticas
        exercise.sets.forEach((set) => {
          const setVolume = set.weight * set.reps;
          totals.totalVolume += setVolume;
          totals.totalReps += set.reps;

          // Acumular para cálculo de médias
          totalWeightSum += set.weight;
          totalWeightCount++;
          totalRepsSum += set.reps;
          totalRepsCount++;

          // Atualizar carga máxima
          if (set.weight > maxWeightFound) {
            maxWeightFound = set.weight;
          }
        });

        // Estimar duração para exercícios de força (2 minutos por série em média)
        totals.totalDuration += exercise.sets.length * 2;
      }
    });

    // Calcular médias
    totals.avgWeight =
      totalWeightCount > 0 ? Math.round(totalWeightSum / totalWeightCount) : 0;
    totals.avgReps =
      totalRepsCount > 0 ? Math.round(totalRepsSum / totalRepsCount) : 0;
    totals.maxWeight = maxWeightFound;

    return totals;
  };

  // Obter totais do dia
  const getDayTotals = (): WorkoutTotals => {
    // Inicializar com valores padrão
    const totals: WorkoutTotals = {
      totalExercises: 0,
      totalSets: 0,
      totalVolume: 0,
      totalDuration: 0,
      avgWeight: 0,
      maxWeight: 0,
      avgReps: 0,
      totalReps: 0,
    };

    // Obter os treinos para a data selecionada (específicos ou do template)
    const workoutsForDate = getWorkoutsForDate(selectedDate);

    // Verificar se existem treinos para a data selecionada
    if (Object.keys(workoutsForDate).length === 0) {
      return totals;
    }

    const workoutIds = Object.keys(workoutsForDate);

    // Calcular os totais para cada treino na data selecionada
    workoutIds.forEach((workoutId) => {
      const workoutTotals = getWorkoutTotals(workoutId);
      totals.totalExercises += workoutTotals.totalExercises;
      totals.totalSets += workoutTotals.totalSets;
      totals.totalVolume += workoutTotals.totalVolume;
      totals.totalDuration += workoutTotals.totalDuration;
      totals.avgWeight += workoutTotals.avgWeight;
      totals.maxWeight = Math.max(totals.maxWeight, workoutTotals.maxWeight);
      totals.avgReps += workoutTotals.avgReps;
      totals.totalReps += workoutTotals.totalReps;
    });

    return totals;
  };

  // Obter tipo de treino por ID
  const getWorkoutTypeById = (id: string): WorkoutType | undefined => {
    if (!workoutTypes || workoutTypes.length === 0) {
      return undefined;
    }

    const workoutType = workoutTypes.find(
      (workoutType) => workoutType.id === id
    );

    return workoutType;
  };

  // Atualizar metas de treino
  const updateTrainingGoals = async (goals: TrainingGoals) => {
    try {
      setTrainingGoals(goals);
      await AsyncStorage.setItem(
        `@pumpgym:trainingGoals:${userId}`,
        JSON.stringify(goals)
      );
    } catch (error) {
      // Erro ao salvar metas de treino
    }
  };

  // Obter totais do treino anterior do mesmo tipo
  const getPreviousWorkoutTotals = (
    workoutId: string
  ): { totals: WorkoutTotals | null; date: string | null } => {
    // Ordenar todas as datas em ordem decrescente
    const dates = Object.keys(workouts)
      .filter((date) => date < selectedDate) // Apenas datas anteriores à selecionada
      .sort((a, b) => b.localeCompare(a)); // Ordenar em ordem decrescente (mais recente primeiro)

    // Procurar o treino mais recente do mesmo tipo
    for (const date of dates) {
      if (workouts[date] && workouts[date][workoutId]) {
        // Calcular os totais para o treino anterior
        const previousExercises = workouts[date][workoutId];

        // Inicializar com valores padrão
        const totals: WorkoutTotals = {
          totalExercises: previousExercises.length,
          totalSets: 0,
          totalVolume: 0,
          totalDuration: 0,
          avgWeight: 0,
          maxWeight: 0,
          avgReps: 0,
          totalReps: 0,
        };

        // Variáveis para calcular médias
        let totalWeightSum = 0;
        let totalWeightCount = 0;
        let totalRepsSum = 0;
        let totalRepsCount = 0;
        let maxWeightFound = 0;

        // Calcular os totais
        previousExercises.forEach((exercise) => {
          // Calcular duração para exercícios de cardio
          if (exercise.category === "cardio" && exercise.cardioDuration) {
            totals.totalDuration += exercise.cardioDuration;
          }

          // Calcular séries e volume para exercícios de força
          if (exercise.sets && exercise.category !== "cardio") {
            totals.totalSets += exercise.sets.length;

            // Calcular o volume total (peso * reps * sets) e outras estatísticas
            exercise.sets.forEach((set) => {
              const setVolume = set.weight * set.reps;
              totals.totalVolume += setVolume;
              totals.totalReps += set.reps;

              // Acumular para cálculo de médias
              totalWeightSum += set.weight;
              totalWeightCount++;
              totalRepsSum += set.reps;
              totalRepsCount++;

              // Atualizar carga máxima
              if (set.weight > maxWeightFound) {
                maxWeightFound = set.weight;
              }
            });

            // Estimar duração para exercícios de força (2 minutos por série em média)
            totals.totalDuration += exercise.sets.length * 2;
          }
        });

        // Calcular médias
        totals.avgWeight =
          totalWeightCount > 0
            ? Math.round(totalWeightSum / totalWeightCount)
            : 0;
        totals.avgReps =
          totalRepsCount > 0 ? Math.round(totalRepsSum / totalRepsCount) : 0;
        totals.maxWeight = maxWeightFound;

        return { totals, date };
      }
    }

    // Se não encontrar nenhum treino anterior
    return { totals: null, date: null };
  };

  // Remover um treino completo
  const removeWorkout = async (workoutId: string) => {
    try {
      // Remover o treino específico para a data selecionada
      setWorkouts((prev) => {
        const updatedWorkouts = { ...prev };

        // Verificar se existe uma entrada para a data selecionada
        if (!updatedWorkouts[selectedDate]) {
          return updatedWorkouts;
        }

        // Remover o treino
        delete updatedWorkouts[selectedDate][workoutId];

        // Se não houver mais treinos para esta data, remover a data
        if (Object.keys(updatedWorkouts[selectedDate]).length === 0) {
          delete updatedWorkouts[selectedDate];
        }

        return updatedWorkouts;
      });

      // Salvar os treinos
      await saveWorkouts();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Erro ao remover treino
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Efeito para salvar treinos quando houver alterações
  useEffect(() => {
    if (Object.keys(workouts).length > 0) {
      saveWorkouts();
    }
  }, [workouts]);

  // Função para copiar treino de uma data anterior
  const copyWorkoutFromDate = async (
    sourceDate: string,
    sourceWorkoutId: string,
    targetWorkoutId: string
  ) => {
    try {
      // Verificar se existe o treino na data de origem
      if (!workouts[sourceDate] || !workouts[sourceDate][sourceWorkoutId]) {
        throw new Error("Treino não encontrado na data de origem");
      }

      // Obter os exercícios do treino de origem
      const sourceExercises = workouts[sourceDate][sourceWorkoutId];

      // Criar uma cópia profunda dos exercícios
      const copiedExercises = sourceExercises.map((exercise) => ({
        ...exercise,
        id: `${exercise.id}-${Date.now()}`, // Gerar novo ID para cada exercício
        sets: exercise.sets?.map((set) => ({
          ...set,
          id: `${set.id}-${Date.now()}`, // Gerar novo ID para cada série
          completed: false, // Resetar o status de completado
        })),
      }));

      // Atualizar os treinos com os exercícios copiados
      setWorkouts((prev) => {
        const updatedWorkouts = { ...prev };

        // Verificar se existe uma entrada para a data selecionada
        if (!updatedWorkouts[selectedDate]) {
          updatedWorkouts[selectedDate] = {};
        }

        // Adicionar os exercícios copiados
        updatedWorkouts[selectedDate][targetWorkoutId] = copiedExercises;

        return updatedWorkouts;
      });

      // Salvar os treinos
      await saveWorkouts();
    } catch (error) {
      console.error("Erro ao copiar treino:", error);
      throw error;
    }
  };

  // Valor do contexto
  const contextValue: WorkoutContextType = {
    workouts,
    workoutTypes,
    selectedDate,
    setSelectedDate,
    getWorkoutTotals,
    getExercisesForWorkout,
    getDayTotals,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    updateExerciseInWorkout,
    saveWorkouts,
    addWorkoutType,
    resetWorkoutTypes,
    updateWorkoutTypes,
    hasWorkoutTypesConfigured,
    getWorkoutTypeById,
    setWorkouts,
    trainingGoals,
    updateTrainingGoals,
    getPreviousWorkoutTotals,
    removeWorkout,
    // Novas propriedades e funções para o template semanal
    weeklyTemplate,
    setWeeklyTemplate,
    updateWeeklyTemplate,
    getWorkoutsForDate,
    addWorkoutToWeeklyTemplate,
    removeWorkoutFromWeeklyTemplate,
    hasWeeklyTemplateConfigured,
    // Nova função para copiar treino
    copyWorkoutFromDate,
  };

  return (
    <WorkoutContext.Provider value={contextValue}>
      {children}
    </WorkoutContext.Provider>
  );
};

// Hook para usar o contexto de treinos
export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
};

// Hook para usar o contexto de treinos (alias)
export const useWorkoutContext = () => {
  return useWorkout();
};

// Dados de exemplo para demonstração
const SAMPLE_WORKOUTS: { [id: string]: Workout } = {
  chest: {
    id: "chest",
    name: "Treino de Peito",
    iconType: { type: "ionicons", name: "body-outline" },
    color: "#FF5252",
    exercises: [],
  },
  back: {
    id: "back",
    name: "Treino de Costas",
    iconType: { type: "material", name: "human-handsup" },
    color: "#448AFF",
    exercises: [],
  },
  legs: {
    id: "legs",
    name: "Treino de Pernas",
    iconType: { type: "material", name: "human-legs" },
    color: "#66BB6A",
    exercises: [],
  },
};

const SAMPLE_EXERCISES: { [id: string]: Exercise } = {
  bench_press: {
    id: "bench_press",
    name: "Supino Reto",
    sets: [
      { id: "1", weight: 60, reps: 12, completed: true },
      { id: "2", weight: 70, reps: 10, completed: true },
      { id: "3", weight: 80, reps: 8, completed: true },
    ],
  },
  incline_press: {
    id: "incline_press",
    name: "Supino Inclinado",
    sets: [
      { id: "1", weight: 50, reps: 12, completed: true },
      { id: "2", weight: 60, reps: 10, completed: true },
      { id: "3", weight: 70, reps: 8, completed: true },
    ],
  },
  chest_fly: {
    id: "chest_fly",
    name: "Crucifixo",
    sets: [
      { id: "1", weight: 15, reps: 15, completed: true },
      { id: "2", weight: 17.5, reps: 12, completed: true },
      { id: "3", weight: 20, reps: 10, completed: true },
    ],
  },
  lat_pulldown: {
    id: "lat_pulldown",
    name: "Puxada Frontal",
    sets: [
      { id: "1", weight: 60, reps: 12, completed: true },
      { id: "2", weight: 70, reps: 10, completed: true },
      { id: "3", weight: 80, reps: 8, completed: true },
    ],
  },
  squat: {
    id: "squat",
    name: "Agachamento",
    sets: [
      { id: "1", weight: 80, reps: 12, completed: true },
      { id: "2", weight: 100, reps: 10, completed: true },
      { id: "3", weight: 120, reps: 8, completed: true },
    ],
  },
};

// Dados de exemplo para demonstração
const SAMPLE_WORKOUT_DATA: {
  [date: string]: { [workoutId: string]: Exercise[] };
} = {
  [format(new Date(), "yyyy-MM-dd")]: {
    chest: [
      SAMPLE_EXERCISES.bench_press,
      SAMPLE_EXERCISES.incline_press,
      SAMPLE_EXERCISES.chest_fly,
    ],
  },
  [format(new Date(Date.now() - 86400000), "yyyy-MM-dd")]: {
    back: [SAMPLE_EXERCISES.lat_pulldown],
  },
  [format(new Date(Date.now() - 172800000), "yyyy-MM-dd")]: {
    legs: [SAMPLE_EXERCISES.squat],
  },
};
