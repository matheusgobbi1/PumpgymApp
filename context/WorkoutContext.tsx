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
import { format } from "date-fns";
import * as Haptics from "expo-haptics";
import { useAuth } from "./AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { KEYS } from "../constants/keys";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

// Tipo para os ícones do MaterialCommunityIcons
type MaterialIconNames = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

// Interface para série individual
export interface ExerciseSet {
  id: string;
  reps: number;
  weight: number;
  completed?: boolean;
  restTime?: number; // Tempo de descanso em segundos
  toFailure?: boolean; // Indica se a série foi levada até a falha muscular
  repsInReserve?: number; // Número de repetições que ainda poderiam ser feitas (1-5)
  perceivedEffort?: number; // Nível de esforço percebido (1-5)
  isBodyweightExercise?: boolean; // Adicionado para indicar exercício de peso corporal
}

// Interface para exercício
export interface Exercise {
  id: string;
  name: string;
  sets?: ExerciseSet[]; // Opcional
  notes?: string;
  cardioDuration?: number; // Duração em minutos para exercícios de cardio
  cardioIntensity?: number; // Intensidade de 1-10 para exercícios de cardio
  category?: "força" | "cardio" | "flexibilidade" | "equilíbrio" | "crossfit"; // Categoria do exercício
  completed?: boolean;
  isBodyweightExercise?: boolean; // Indica se é um exercício de peso corporal
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

// Exportar a interface WorkoutType que foi movida de WorkoutConfigSheet
export interface WorkoutType {
  id: string;
  name: string;
  iconType: {
    type: "ionicons" | "material" | "fontawesome";
    name: string;
  };
  color: string;
  selected: boolean;
  isDefault?: boolean;
}

// Interface para totais do treino
export interface WorkoutTotals {
  totalExercises: number;
  totalSets: number;
  totalVolume: number; // Volume total (peso * reps * sets)
  totalDuration: number; // Duração total em minutos
  avgWeight: number; // Carga média
  maxWeight: number; // Carga máxima
  avgReps: number; // Repetições médias
  totalReps: number; // Total de repetições
  caloriesBurned: number; // Novo campo para calorias
  trainingDensity: number; // Densidade do treino (relação trabalho/descanso)
  avgRestTime: number; // Tempo médio de descanso entre séries
}

// Interface genérica para dados da notificação de conquista
export interface AchievementNotificationData {
  type: "pr" | "proteinGoal" | "streak" | "other"; // Adicionar mais tipos conforme necessário
  iconName: any; // Nome do ícone Ionicon (ou outro set, ajustar tipo se necessário)
  iconColor: string;
  title: string;
  message: string;
}

// Interface para o contexto de treinos
interface WorkoutContextType {
  workouts: { [date: string]: { [workoutId: string]: Exercise[] } };
  workoutTypes: { [date: string]: { [workoutId: string]: WorkoutType } };
  availableWorkoutTypes: WorkoutType[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  addExerciseToWorkout: (
    workoutId: string,
    exercise: Exercise
  ) => Promise<boolean>;
  removeExerciseFromWorkout: (
    workoutId: string,
    exerciseId: string
  ) => Promise<void>;
  updateExerciseInWorkout: (
    workoutId: string,
    exerciseId: string,
    updatedExercise: Exercise
  ) => Promise<void>;
  removeWorkoutForDate: (workoutId: string, date?: string) => Promise<boolean>;
  saveWorkouts: () => Promise<void>;
  getWorkoutsForDate: (date: string) => { [workoutId: string]: Exercise[] };
  startWorkoutForDate: (workoutId: string) => Promise<string | null>;
  getAvailableWorkoutTypes: () => WorkoutType[];
  hasWorkoutTypesConfigured: () => boolean;
  copyWorkoutFromDate: (
    sourceDate: string,
    targetDate: string,
    sourceWorkoutId: string,
    targetWorkoutId: string
  ) => Promise<void>;
  saveAvailableWorkoutTypes: (types: WorkoutType[]) => Promise<void>;
  setAvailableWorkoutTypes: React.Dispatch<React.SetStateAction<WorkoutType[]>>;
  getWorkoutTypeForWorkout: (
    date: string,
    workoutId: string
  ) => WorkoutType | undefined;
  getWorkoutTypeById: (workoutTypeId: string) => WorkoutType | undefined;
  getExercisesForWorkout: (workoutId: string, date?: string) => Exercise[];
  saveWorkoutTypes: () => Promise<boolean>;
  addWorkoutType: (
    id: string,
    name: string,
    icon: string,
    color: string
  ) => Promise<void>;
  updateWorkoutTypes: (newWorkoutTypes: WorkoutType[]) => Promise<boolean>;
  getWorkoutTotals: (workoutId: string) => WorkoutTotals;
  getPreviousWorkoutTotals: (workoutId: string) => {
    totals: WorkoutTotals | null;
    date: string | null;
  };
  workoutsForSelectedDate: { [workoutId: string]: Exercise[] };
  selectedWorkoutTypes: WorkoutType[];
  hasConfiguredWorkouts: boolean;
  // Novas funções relacionadas à progressão
  getPreviousWorkoutExercises: (workoutId: string) => {
    exercises: Exercise[];
    date: string | null;
  };
  getMultiplePreviousWorkoutsExercises: (
    workoutId: string,
    limit?: number
  ) => { exercises: Exercise[]; date: string }[];
  applyProgressionToWorkout: (
    workoutId: string,
    updatedExercises: Exercise[]
  ) => Promise<boolean>;
  // Salvar treino gerado pelo builder
  saveGeneratedWorkout: (
    workoutId: string,
    date: string,
    exercises: Exercise[]
  ) => Promise<boolean>;

  // Propriedades para notificação de Conquista (genérico)
  achievementNotificationData: AchievementNotificationData | null;
  clearAchievementNotification: () => void;
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
  const [workoutTypes, setWorkoutTypes] = useState<{
    [date: string]: { [workoutId: string]: WorkoutType };
  }>({});
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [availableWorkoutTypes, setAvailableWorkoutTypes] = useState<
    WorkoutType[]
  >([]);
  const [loading, setLoading] = useState(false);
  // Estado para notificação de Conquista
  const [achievementNotificationData, setAchievementNotificationData] = useState<AchievementNotificationData | null>(null);

  // Função para limpar a notificação de Conquista
  const clearAchievementNotification = useCallback(() => {
    setAchievementNotificationData(null);
  }, []);

  // Função para resetar o estado quando o usuário mudar
  const resetState = useCallback(() => {
    setWorkouts({});
    setWorkoutTypes({});
    setAvailableWorkoutTypes([]);
    setAchievementNotificationData(null); // Limpar notificação ao trocar usuário
  }, []);

  // Memoizar valores derivados do estado que são frequentemente acessados
  const workoutsForSelectedDate = useMemo(
    () => workouts[selectedDate] || {},
    [workouts, selectedDate]
  );

  const selectedWorkoutTypes = useMemo(
    () => availableWorkoutTypes.filter((type) => type.selected),
    [availableWorkoutTypes]
  );

  const hasConfiguredWorkouts = useMemo(
    () => selectedWorkoutTypes.length > 0,
    [selectedWorkoutTypes]
  );

  // Memoizar funções que dependem apenas de estados específicos
  const getWorkoutsForDate = useCallback(
    (date: string) => {
      return workouts[date] || {};
    },
    [workouts]
  );

  const getExercisesForWorkout = useCallback(
    (workoutId: string, date?: string) => {
      const dateToUse = date || selectedDate;
      if (!workouts[dateToUse] || !workouts[dateToUse][workoutId]) {
        return [];
      }
      return workouts[dateToUse][workoutId];
    },
    [workouts, selectedDate]
  );

  const getWorkoutTypeById = useCallback(
    (workoutTypeId: string) => {
      // Verificar nos tipos de treino disponíveis
      const availableType = availableWorkoutTypes.find(
        (type) => type.id === workoutTypeId
      );
      if (availableType) return availableType;

      // Verificar nos tipos de treino associados a treinos
      for (const date in workoutTypes) {
        for (const workoutId in workoutTypes[date]) {
          if (workoutTypes[date][workoutId].id === workoutTypeId) {
            return workoutTypes[date][workoutId];
          }
        }
      }

      return undefined;
    },
    [availableWorkoutTypes, workoutTypes]
  );

  // Obter o tipo de treino para um treino específico
  const getWorkoutTypeForWorkout = useCallback(
    (date: string, workoutId: string): WorkoutType | undefined => {
      // Verificar se existe um tipo de treino para esta data e treino
      if (workoutTypes[date] && workoutTypes[date][workoutId]) {
        return workoutTypes[date][workoutId];
      }

      return undefined;
    },
    [workoutTypes]
  );

  // --- RESTAURAR/DEFINIR getPreviousWorkoutExercises --- 
  const getPreviousWorkoutExercises = useCallback(
    (workoutId: string): { exercises: Exercise[]; date: string | null } => {
      const defaultReturn = { exercises: [], date: null };
      const previousDates = Object.keys(workouts)
        .filter((date) => date < selectedDate)
        .sort((a, b) => b.localeCompare(a));
      if (previousDates.length === 0) {
        return defaultReturn;
      }
      for (const date of previousDates) {
        if (workouts[date] && workouts[date][workoutId]) {
          const exercises = workouts[date][workoutId];
          const validExercises = exercises.filter(
            (exercise: Exercise) => // Adicionado tipo Exercise
              exercise.category !== "cardio" &&
              exercise.sets &&
              exercise.sets.length > 0
          );
          if (validExercises.length > 0) {
            return { exercises: validExercises, date };
          }
        }
      }
      return defaultReturn;
    },
    [workouts, selectedDate]
  );
  // --- FIM RESTAURAR/DEFINIR getPreviousWorkoutExercises --- 

  // Carregar treinos do AsyncStorage
  const loadWorkouts = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);

      // Carregar todos os dados do AsyncStorage de forma paralela
      const [storedWorkouts, storedWorkoutTypes, storedAvailableTypes] =
        await Promise.all([
          AsyncStorage.getItem(`${KEYS.WORKOUTS}:${userId}`),
          AsyncStorage.getItem(`${KEYS.WORKOUT_TYPES}:${userId}`),
          AsyncStorage.getItem(`${KEYS.AVAILABLE_WORKOUT_TYPES}:${userId}`),
        ]);

      // Inicializar com valores padrão
      let workoutsData = storedWorkouts ? JSON.parse(storedWorkouts) : {};
      let workoutTypesData = storedWorkoutTypes
        ? JSON.parse(storedWorkoutTypes)
        : {};
      let availableTypes = storedAvailableTypes
        ? JSON.parse(storedAvailableTypes)
        : [];

      // Verificar consistência de dados para evitar a alternância entre treinos
      let dataChanged = false;

      // Garantir que cada treino tenha um tipo associado
      for (const date in workoutsData) {
        if (!workoutTypesData[date]) {
          workoutTypesData[date] = {};
          dataChanged = true;
        }

        for (const workoutId in workoutsData[date]) {
          // Se não existir um workoutType para este workout
          if (!workoutTypesData[date][workoutId]) {
            // Procurar o tipo nos available types
            const foundType = availableTypes.find(
              (t: WorkoutType) => t.id === workoutId
            );

            if (foundType) {
              // Associar o tipo encontrado ao treino
              workoutTypesData[date][workoutId] = JSON.parse(
                JSON.stringify(foundType)
              );
              dataChanged = true;
            } else {
              // Se não encontrar um tipo, remover o treino para manter consistência
              delete workoutsData[date][workoutId];
              dataChanged = true;
            }
          }
        }

        // Se não houver treinos para esta data após a verificação, remover a entrada
        if (Object.keys(workoutsData[date]).length === 0) {
          delete workoutsData[date];
          delete workoutTypesData[date];
          dataChanged = true;
        }
      }

      // Verificar o inverso: workoutTypes sem workouts correspondentes
      for (const date in workoutTypesData) {
        if (!workoutsData[date]) {
          workoutsData[date] = {};
          dataChanged = true;
        }

        for (const workoutId in workoutTypesData[date]) {
          // Se não existir um workout para este tipo, criar um vazio
          if (!workoutsData[date][workoutId]) {
            workoutsData[date][workoutId] = [];
            dataChanged = true;
          }
        }
      }

      // Se houve alterações para manter consistência, salvar de volta no AsyncStorage
      if (dataChanged) {
        await Promise.all([
          AsyncStorage.setItem(
            `${KEYS.WORKOUTS}:${userId}`,
            JSON.stringify(workoutsData)
          ),
          AsyncStorage.setItem(
            `${KEYS.WORKOUT_TYPES}:${userId}`,
            JSON.stringify(workoutTypesData)
          ),
        ]);
      }

      // Atualizar estados com dados consistentes
      setWorkouts(workoutsData);
      setWorkoutTypes(workoutTypesData);

      if (Array.isArray(availableTypes) && availableTypes.length > 0) {
        const validatedTypes = availableTypes.map((type) => ({
          ...type,
          selected: Boolean(type.selected),
        }));
        setAvailableWorkoutTypes(validatedTypes);
      }

      // Verificar se há dados no Firebase para sincronizar
      if (user && !user.isAnonymous) {
        try {
          const workoutsRef = doc(db, "users", user.uid, "workouts", "data");
          const workoutsDoc = await getDoc(workoutsRef);

          if (workoutsDoc.exists()) {
            const firebaseData = workoutsDoc.data();
            let firebaseDataChanged = false;

            // Verificar se os dados do Firebase são mais recentes
            // baseado no timestamp ou na quantidade de dados
            if (firebaseData.lastUpdated) {
              // Priorizar dados do Firebase se forem mais recentes
              const hasMoreDataInFirebase =
                firebaseData.workouts &&
                Object.keys(firebaseData.workouts).length >
                  Object.keys(workoutsData).length;

              if (hasMoreDataInFirebase) {
                workoutsData = firebaseData.workouts;
                workoutTypesData = firebaseData.workoutTypes || {};
                setWorkouts(workoutsData);
                setWorkoutTypes(workoutTypesData);
                firebaseDataChanged = true;
              }

              // Sincronizar availableWorkoutTypes do Firebase
              if (firebaseData.availableWorkoutTypes) {
                const firebaseAvailableTypes =
                  firebaseData.availableWorkoutTypes;

                // Usar os tipos do Firebase se forem diferentes
                if (
                  JSON.stringify(availableTypes) !==
                  JSON.stringify(firebaseAvailableTypes)
                ) {
                  setAvailableWorkoutTypes(firebaseAvailableTypes);
                  firebaseDataChanged = true;
                }
              }

              // Se os dados do Firebase foram usados, atualizar o AsyncStorage
              if (firebaseDataChanged) {
                await Promise.all([
                  AsyncStorage.setItem(
                    `${KEYS.WORKOUTS}:${userId}`,
                    JSON.stringify(workoutsData)
                  ),
                  AsyncStorage.setItem(
                    `${KEYS.WORKOUT_TYPES}:${userId}`,
                    JSON.stringify(workoutTypesData)
                  ),
                  AsyncStorage.setItem(
                    `${KEYS.AVAILABLE_WORKOUT_TYPES}:${userId}`,
                    JSON.stringify(firebaseData.availableWorkoutTypes || [])
                  ),
                ]);
              }
            }
          }
        } catch (firebaseError) {
          console.error("Erro ao sincronizar com Firebase:", firebaseError);
        }
      }

      return true;
    } catch (error) {
      console.error("Erro ao carregar workouts:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [
    userId,
    user,
    setWorkouts,
    setWorkoutTypes,
    setAvailableWorkoutTypes,
    setLoading,
  ]);

  // Resetar o estado quando o usuário mudar - Movemos para depois da definição de loadWorkouts
  useEffect(() => {
    // Definir um flag para indicar se este é o primeiro carregamento
    let isMounted = true;

    const initializeData = async () => {
      try {
        // Limpar dados do usuário anterior antes de carregar os novos
        resetState();

        // Aguardar um pequeno delay para garantir que o resetState tenha tempo de ser aplicado
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Carregar dados do novo usuário
        if (isMounted) {
          await loadWorkouts();
        }
      } catch (error) {
        console.error("Erro ao inicializar dados:", error);
      }
    };

    // Inicializar os dados
    initializeData();

    // Cleanup function para evitar atualizações de estado em componentes desmontados
    return () => {
      isMounted = false;
    };
  }, [user?.uid, resetState, loadWorkouts]); // Adicionar resetState e loadWorkouts às dependências

  // Iniciar um treino para uma data específica
  const startWorkoutForDate = async (workoutId: string) => {
    try {
      const date = selectedDate;
      const workoutType = availableWorkoutTypes.find((w) => w.id === workoutId);

      if (!workoutType) {
        return null;
      }

      // Criar uma cópia limpa do workoutType para evitar problemas de referência
      const cleanWorkoutType = JSON.parse(JSON.stringify(workoutType));

      // Criar um novo objeto para a data, contendo apenas o treino selecionado
      // Isso substitui todos os treinos existentes para aquela data
      const updatedWorkouts = {
        ...workouts,
        [date]: {
          [workoutId]: [], // Iniciar com array vazio de exercícios
        },
      };

      // Atualizar o objeto de tipos de treino para esta data
      const updatedWorkoutTypes = {
        ...workoutTypes,
        [date]: {
          [workoutId]: cleanWorkoutType,
        },
      };

      // Atualizar os estados locais
      setWorkouts(updatedWorkouts);
      setWorkoutTypes(updatedWorkoutTypes);

      // Persistir explicitamente no AsyncStorage antes de qualquer outra operação
      await AsyncStorage.setItem(
        `${KEYS.WORKOUTS}:${userId}`,
        JSON.stringify(updatedWorkouts)
      );

      await AsyncStorage.setItem(
        `${KEYS.WORKOUT_TYPES}:${userId}`,
        JSON.stringify(updatedWorkoutTypes)
      );

      // Verificar se os dados foram salvos corretamente
      const [savedWorkouts, savedWorkoutTypes] = await Promise.all([
        AsyncStorage.getItem(`${KEYS.WORKOUTS}:${userId}`),
        AsyncStorage.getItem(`${KEYS.WORKOUT_TYPES}:${userId}`),
      ]);

      if (!savedWorkouts || !savedWorkoutTypes) {
        // Se houver falha na persistência, tentar novamente
        console.warn("Falha ao persistir no AsyncStorage, tentando novamente");
        await AsyncStorage.setItem(
          `${KEYS.WORKOUTS}:${userId}`,
          JSON.stringify(updatedWorkouts)
        );

        await AsyncStorage.setItem(
          `${KEYS.WORKOUT_TYPES}:${userId}`,
          JSON.stringify(updatedWorkoutTypes)
        );
      }

      // Salvar no Firebase se necessário
      if (userId && userId !== "anonymous" && userId !== "no-user") {
        try {
          const db = getFirestore();
          // Verificar se o usuário ainda está autenticado
          const { auth } = require("../firebase/config");
          if (auth.currentUser) {
            // Limpar valores undefined antes de salvar
            const cleanWorkouts = JSON.parse(JSON.stringify(updatedWorkouts));
            const cleanWorkoutTypes = JSON.parse(
              JSON.stringify(updatedWorkoutTypes)
            );

            // Salvar no Firestore
            const workoutsRef = doc(db, "users", userId, "workouts", "data");
            await setDoc(
              workoutsRef,
              {
                workouts: cleanWorkouts,
                workoutTypes: cleanWorkoutTypes,
                lastUpdated: serverTimestamp(),
              },
              { merge: true }
            );
          }
        } catch (firebaseError) {
          console.error("Erro ao salvar no Firebase:", firebaseError);
          // Não tente mais salvar em caso de erro do Firebase
        }
      }

      return workoutId;
    } catch (error) {
      console.error("Erro ao iniciar treino:", error);
      return null;
    }
  };

  // Obter tipos de treino disponíveis
  const getAvailableWorkoutTypes = () => {
    return availableWorkoutTypes;
  };

  // Adicionar um tipo de treino
  const addWorkoutType = async (
    id: string,
    name: string,
    icon: string,
    color: string
  ) => {
    try {
      // Verificar se já existe um tipo de treino com o mesmo nome
      const existingWorkoutType = Object.values(workoutTypes)
        .flatMap((dateWorkouts) => Object.values(dateWorkouts))
        .find((w) => w.name.toLowerCase() === name.toLowerCase());

      if (existingWorkoutType) {
        // Se já existe, apenas atualizar o ícone e a cor
        const updatedWorkoutTypes = { ...workoutTypes };

        // Percorrer todas as datas e atualizar o tipo com esse ID
        Object.keys(updatedWorkoutTypes).forEach((date) => {
          Object.keys(updatedWorkoutTypes[date]).forEach((wId) => {
            if (updatedWorkoutTypes[date][wId].id === id) {
              updatedWorkoutTypes[date][wId] = {
                ...updatedWorkoutTypes[date][wId],
                iconType: { type: "ionicons", name: icon },
                color,
              };
            }
          });
        });

        setWorkoutTypes(updatedWorkoutTypes);

        // Salvar no AsyncStorage
        await AsyncStorage.setItem(
          `${KEYS.WORKOUT_TYPES}:${userId}`,
          JSON.stringify(updatedWorkoutTypes)
        );

        return;
      }

      // Se não existe, adicionar novo tipo de treino
      const newWorkoutType: WorkoutType = {
        id,
        name,
        iconType: { type: "ionicons", name: icon as any },
        color,
        selected: false,
      };

      const updatedWorkoutTypes = { ...workoutTypes };

      // Inicializar a entrada para a data selecionada se não existir
      if (!updatedWorkoutTypes[selectedDate]) {
        updatedWorkoutTypes[selectedDate] = {};
      }

      // Adicionar o novo tipo
      updatedWorkoutTypes[selectedDate][id] = newWorkoutType;

      setWorkoutTypes(updatedWorkoutTypes);

      // Salvar no AsyncStorage
      await AsyncStorage.setItem(
        `${KEYS.WORKOUT_TYPES}:${userId}`,
        JSON.stringify(updatedWorkoutTypes)
      );

      return Promise.resolve();
    } catch (error) {
      // Erro ao adicionar tipo de treino
      return Promise.reject(error);
    }
  };

  // Atualizar tipos de treino
  const updateWorkoutTypes = async (newWorkoutTypes: WorkoutType[]) => {
    try {
      // Função para remover valores undefined recursivamente
      const removeUndefined = (obj: any): any => {
        if (obj === null || typeof obj !== "object") {
          return obj;
        }

        if (Array.isArray(obj)) {
          return obj.map((item) => removeUndefined(item));
        }

        const result: any = {};
        for (const key in obj) {
          if (obj[key] !== undefined) {
            result[key] = removeUndefined(obj[key]);
          }
        }
        return result;
      };

      // Limpar valores undefined
      const cleanWorkoutTypes = removeUndefined(newWorkoutTypes);

      // Atualizar os tipos de treino disponíveis
      setAvailableWorkoutTypes(cleanWorkoutTypes);

      // Salvar os tipos de treino disponíveis no AsyncStorage
      await AsyncStorage.setItem(
        `${KEYS.AVAILABLE_WORKOUT_TYPES}:${userId}`,
        JSON.stringify(cleanWorkoutTypes)
      );

      // Salvar no Firebase se o usuário não for anônimo
      if (userId && userId !== "anonymous" && userId !== "no-user") {
        try {
          const db = getFirestore();
          const workoutsRef = doc(db, "users", userId, "workouts", "data");
          await setDoc(
            workoutsRef,
            {
              availableWorkoutTypes: cleanWorkoutTypes,
              lastUpdated: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (firebaseError) {
          // Continuar, pois os dados já foram salvos no AsyncStorage
        }
      }

      // Retornar verdadeiro para indicar sucesso
      return true;
    } catch (error) {
      return false;
    }
  };

  // Adicionar exercício a um treino
  const addExerciseToWorkout = async (
    workoutId: string,
    exercise: Exercise
  ): Promise<boolean> => {
    try {
      // Verificar se o exercício já existe no treino
      const existingExercises = workouts[selectedDate]?.[workoutId] || [];

      // Verificar se já existe um exercício com o mesmo ID
      const exerciseExists = existingExercises.some(
        (ex) => ex.id === exercise.id
      );

      if (exerciseExists) {
        return false;
      }

      // Atualizar o estado dos treinos
      setWorkouts((prev) => {
        const updatedWorkouts = { ...prev };

        // Inicializar a entrada para a data selecionada se não existir
        if (!updatedWorkouts[selectedDate]) {
          updatedWorkouts[selectedDate] = {};
        }

        // Inicializar a entrada para o treino se não existir
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

      // Salvar treinos
      await saveWorkouts();

      // Feedback tátil
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      return true;
    } catch (error) {
      // Feedback tátil de erro
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      return false;
    }
  };

  // Remover exercício de um treino
  const removeExerciseFromWorkout = async (
    workoutId: string,
    exerciseId: string
  ) => {
    try {
      // Atualizar o estado
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

      // Salvar imediatamente para garantir persistência
      try {
        await saveWorkouts();
      } catch (saveError) {
        // Tentar novamente com um pequeno atraso
        setTimeout(async () => {
          try {
            await saveWorkouts();
          } catch (retryError) {
            // Falha na segunda tentativa
          }
        }, 500);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Erro ao remover exercício
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Atualizar exercício em um treino - COM LÓGICA DE VERIFICAÇÃO DE PR
  const updateExerciseInWorkout = async (
    workoutId: string,
    exerciseId: string,
    updatedExercise: Exercise
  ) => {
    let isPR = false;
    let prWeight = 0;
    let currentWorkoutsState: any;

    try {
      setWorkouts((prev) => {
        const updatedWorkouts = { ...prev };
        if (!updatedWorkouts[selectedDate] || !updatedWorkouts[selectedDate][workoutId]) {
          return prev;
        }
        updatedWorkouts[selectedDate][workoutId] = updatedWorkouts[selectedDate][workoutId].map((exercise) =>
          exercise.id === exerciseId ? updatedExercise : exercise
        );
        currentWorkoutsState = updatedWorkouts; // Store the updated state for saving
        return updatedWorkouts;
      });

       // --- Lógica de Verificação de PR --- 
       if (updatedExercise.category !== 'cardio' && updatedExercise.sets && updatedExercise.sets.length > 0) {
           const { exercises: previousExercises } = getPreviousWorkoutExercises(workoutId);
           if (previousExercises.length > 0) {
               const previousExercise = previousExercises.find((ex: Exercise) => ex.id === exerciseId || ex.name === updatedExercise.name);
               if (previousExercise && previousExercise.sets && previousExercise.sets.length > 0) {
                   let previousMaxWeight = 0;
                   previousExercise.sets.forEach((set: ExerciseSet) => {
                       if (set.weight > previousMaxWeight) {
                           previousMaxWeight = set.weight;
                       }
                   });
                   let currentMaxWeight = 0;
                   updatedExercise.sets.forEach((set: ExerciseSet) => {
                       if (set.weight > currentMaxWeight) {
                           currentMaxWeight = set.weight;
                       }
                   });
                   if (currentMaxWeight > previousMaxWeight) {
                       isPR = true;
                       prWeight = currentMaxWeight;
                   }
               }
           }
        }
       // --- Fim da Lógica de Verificação de PR ---

      // Salvar imediatamente usando o estado capturado
      if (currentWorkoutsState) {
        await AsyncStorage.setItem(
          `${KEYS.WORKOUTS}:${userId}`,
          JSON.stringify(currentWorkoutsState)
        );
      } else {
        console.warn("Estado atualizado não capturado, salvamento pulado em updateExerciseInWorkout");
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (error) {
      console.error("Erro ao atualizar exercício:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Se for um PR, atualizar o estado da notificação de conquista
    if (isPR) {
      // Definir a cor aqui, poderia vir do tema ou ser fixa
      const prIconColor = '#FFD700'; // Dourado para troféu
      setAchievementNotificationData({
        type: 'pr',
        iconName: 'trophy',
        iconColor: prIconColor,
        title: 'Parabéns!',
        message: `Novo Recorde Pessoal em ${updatedExercise.name}: ${prWeight} kg!`,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  // Função para remover um treino inteiro para uma data específica
  const removeWorkoutForDate = async (
    workoutId: string,
    date?: string
  ): Promise<boolean> => {
    try {
      const dateToUse = date || selectedDate;

      // Verificar se existe uma entrada para a data e o treino
      if (!workouts[dateToUse] || !workouts[dateToUse][workoutId]) {
        return false;
      }

      // Criar cópias atualizadas dos objetos
      const updatedWorkouts = { ...workouts };
      const updatedWorkoutTypes = { ...workoutTypes };

      // Remover o treino específico da data
      delete updatedWorkouts[dateToUse][workoutId];

      // Remover também o tipo de treino correspondente
      if (updatedWorkoutTypes[dateToUse]) {
        delete updatedWorkoutTypes[dateToUse][workoutId];
      }

      // Se não houver mais treinos para esta data, remover a entrada da data
      if (Object.keys(updatedWorkouts[dateToUse]).length === 0) {
        delete updatedWorkouts[dateToUse];
        if (updatedWorkoutTypes[dateToUse]) {
          delete updatedWorkoutTypes[dateToUse];
        }
      }

      // Atualizar os estados
      setWorkouts(updatedWorkouts);
      setWorkoutTypes(updatedWorkoutTypes);

      // Persistir no AsyncStorage
      await AsyncStorage.setItem(
        `${KEYS.WORKOUTS}:${userId}`,
        JSON.stringify(updatedWorkouts)
      );

      await AsyncStorage.setItem(
        `${KEYS.WORKOUT_TYPES}:${userId}`,
        JSON.stringify(updatedWorkoutTypes)
      );

      // Executar feedback tátil de sucesso
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      return true;
    } catch (error) {
      // Executar feedback tátil de erro
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Erro ao remover treino:", error);
      return false;
    }
  };

  // Salvar treinos no AsyncStorage
  const saveWorkouts = async (): Promise<void> => {
    try {
      // Fazer uma cópia limpa dos estados para evitar problemas de referência
      const workoutsCopy = JSON.parse(JSON.stringify(workouts));
      const workoutTypesCopy = JSON.parse(JSON.stringify(workoutTypes));

      // Salvar os dois estados de forma atômica
      await Promise.all([
        AsyncStorage.setItem(
          `${KEYS.WORKOUTS}:${userId}`,
          JSON.stringify(workoutsCopy)
        ),
        AsyncStorage.setItem(
          `${KEYS.WORKOUT_TYPES}:${userId}`,
          JSON.stringify(workoutTypesCopy)
        ),
      ]);

      // Salvar no Firebase apenas se estiver online e o usuário não for anônimo
      if (userId && userId !== "anonymous" && userId !== "no-user") {
        try {
          const db = getFirestore();

          // Verificar se o usuário ainda está autenticado
          const { auth } = require("../firebase/config");
          if (!auth.currentUser) {
            return;
          }

          // Salvar no Firestore
          const workoutsRef = doc(db, "users", userId, "workouts", "data");
          await setDoc(
            workoutsRef,
            {
              workouts: workoutsCopy,
              workoutTypes: workoutTypesCopy,
              availableWorkoutTypes: JSON.parse(
                JSON.stringify(availableWorkoutTypes)
              ),
              lastUpdated: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (firebaseError) {
          console.error("Erro ao salvar no Firebase:", firebaseError);
        }
      }
    } catch (error) {
      console.error("Erro ao salvar workouts:", error);
      throw error;
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
      caloriesBurned: 0,
      trainingDensity: 0,
      avgRestTime: 0,
    };

    // Obter os treinos para a data selecionada
    const workoutsForDate = getWorkoutsForDate(selectedDate);

    // Verificar se existe o treino para esta data
    if (!workoutsForDate[workoutId]) {
      return totals;
    }

    // Usar 70kg como peso do usuário padrão ou tentar obter do armazenamento síncrono
    const userWeight = 70; // Por simplicidade, usamos o valor padrão

    const exercises = workoutsForDate[workoutId];

    // Calcular os totais
    totals.totalExercises = exercises.length;

    // Variáveis para calcular médias
    let totalWeightSum = 0;
    let totalWeightCount = 0;
    let totalRepsSum = 0;
    let totalRepsCount = 0;
    let maxWeightFound = 0;
    let totalCalories = 0;
    let totalRestTime = 0;
    let restTimeCount = 0;
    let workTime = 0; // Tempo estimado de trabalho (em segundos)

    // Basear o cálculo de calorias em equivalentes metabólicos (MET) ajustados
    // 1 MET = 1 kcal/kg/hora para uma pessoa em repouso

    // Fator de escala para ajustar o total de calorias para valores mais realistas
    const CALORIE_SCALING_FACTOR = 3.5;

    // Contador para duração total do treino em minutos (para evitar duplicação)
    let totalTrainingDuration = 0;

    exercises.forEach((exercise) => {
      // Calcular duração para exercícios de cardio
      if (exercise.category === "cardio" && exercise.cardioDuration) {
        const cardioMinutes = exercise.cardioDuration;
        totalTrainingDuration += cardioMinutes;

        // Ajustar MET baseado na intensidade definida (1-10)
        let metValue = 8.0; // Valor base para cardio moderado

        if (exercise.cardioIntensity) {
          if (exercise.cardioIntensity <= 3) {
            metValue = 4.0; // Cardio leve
          } else if (exercise.cardioIntensity <= 7) {
            metValue = 8.0; // Cardio moderado
          } else {
            metValue = 12.0; // Cardio intenso
          }
        }

        // Calorias = MET × peso (kg) × duração (horas)
        const caloriesForExercise =
          metValue * userWeight * (cardioMinutes / 60);
        totalCalories += caloriesForExercise;

        // Adicionar ao tempo de trabalho para cálculo de densidade
        workTime += cardioMinutes * 60; // Converter para segundos
      }

      // Calcular séries e volume para exercícios de força
      if (exercise.sets && exercise.category !== "cardio") {
        totals.totalSets += exercise.sets.length;

        // Duração total deste exercício em segundos
        let exerciseDuration = 0;

        // Verificar qual grupo muscular está sendo trabalhado para ajustar o MET
        // Grupos musculares maiores = maior MET
        let baseMetValue = 3.0; // Valor base para exercícios de força pequenos

        // Ajustar MET conforme tipo de exercício
        if (exercise.name) {
          const exerciseName = exercise.name.toLowerCase();
          // Exercícios de grandes grupos musculares têm maior gasto calórico
          if (
            exerciseName.includes("agachamento") ||
            exerciseName.includes("leg") ||
            exerciseName.includes("deadlift") ||
            exerciseName.includes("stiff") ||
            exerciseName.includes("terra")
          ) {
            baseMetValue = 6.0; // Exercícios para pernas/grandes grupos
          } else if (
            exerciseName.includes("supino") ||
            exerciseName.includes("remada") ||
            exerciseName.includes("puxada") ||
            exerciseName.includes("desenvolvimento") ||
            exerciseName.includes("bench") ||
            exerciseName.includes("press") ||
            exerciseName.includes("row")
          ) {
            baseMetValue = 5.0; // Exercícios para tórax/costas/médios grupos
          } else if (
            exerciseName.includes("biceps") ||
            exerciseName.includes("triceps") ||
            exerciseName.includes("curl") ||
            exerciseName.includes("elevação") ||
            exerciseName.includes("fly") ||
            exerciseName.includes("lateral")
          ) {
            baseMetValue = 3.5; // Exercícios para pequenos grupos musculares
          }
        }

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

          // Tempo de descanso entre séries
          const restTime = set.restTime || 60;
          totalRestTime += restTime;
          restTimeCount++;

          // Calcular tempo de trabalho por série
          const repDuration = 3 + set.weight / 100;
          const setWorkTime = set.reps * repDuration;
          workTime += setWorkTime;
          exerciseDuration += setWorkTime + restTime;

          // Atualizar carga máxima
          if (set.weight > maxWeightFound) {
            maxWeightFound = set.weight;
          }

          // Calcular calorias para esta série
          // Ajustar MET pelo peso relativo (peso como % do peso corporal)
          const relativeWeight = set.weight / userWeight;
          // Ajustar intensidade baseado no peso relativo e repetições
          const intensityFactor = 1 + (relativeWeight * set.reps) / 10;

          // MET efetivo combinando o base do exercício com intensidade
          const effectiveMetValue = baseMetValue * intensityFactor;

          // Calorias = MET × peso (kg) × duração (horas)
          const setDurationHours = setWorkTime / 3600; // Converter segundos para horas
          const caloriesForSet =
            effectiveMetValue *
            userWeight *
            setDurationHours *
            CALORIE_SCALING_FACTOR;

          totalCalories += caloriesForSet;
        });

        // Adicionar a duração deste exercício à duração total (em minutos)
        totalTrainingDuration += Math.ceil(exerciseDuration / 60);
      }
    });

    // Atualizar a duração total com valor calculado
    totals.totalDuration = totalTrainingDuration;

    // Calcular médias
    totals.avgWeight =
      totalWeightCount > 0 ? Math.round(totalWeightSum / totalWeightCount) : 0;
    totals.avgReps =
      totalRepsCount > 0 ? Math.round(totalRepsSum / totalRepsCount) : 0;
    totals.maxWeight = maxWeightFound;
    totals.caloriesBurned = Math.round(totalCalories);
    totals.avgRestTime =
      restTimeCount > 0 ? Math.round(totalRestTime / restTimeCount) : 60;

    // Calcular densidade do treino (relação entre tempo de trabalho e tempo total)
    if (workTime > 0 && totalRestTime > 0) {
      totals.trainingDensity = parseFloat(
        (workTime / totalRestTime).toFixed(2)
      );
    }

    return totals;
  };

  // Obter totais do treino anterior do mesmo tipo
  const getPreviousWorkoutTotals = (
    workoutId: string
  ): { totals: WorkoutTotals | null; date: string | null } => {
    // Ordenar todas as datas em ordem decrescente
    const dates = Object.keys(workouts)
      .filter((date) => date < selectedDate) // Apenas datas anteriores à selecionada
      .sort((a, b) => b.localeCompare(a)); // Ordenar em ordem decrescente (mais recente primeiro)

    // Usar 70kg como peso do usuário padrão
    const userWeight = 70;

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
          caloriesBurned: 0,
          trainingDensity: 0,
          avgRestTime: 0,
        };

        // Variáveis para calcular médias
        let totalWeightSum = 0;
        let totalWeightCount = 0;
        let totalRepsSum = 0;
        let totalRepsCount = 0;
        let maxWeightFound = 0;
        let totalCalories = 0;
        let totalRestTime = 0;
        let restTimeCount = 0;
        let workTime = 0; // Tempo estimado de trabalho (em segundos)

        // Fator de escala para ajustar o total de calorias para valores mais realistas
        const CALORIE_SCALING_FACTOR = 3.5;

        // Contador para duração total do treino
        let totalTrainingDuration = 0;

        // Calcular os totais
        previousExercises.forEach((exercise) => {
          // Calcular duração para exercícios de cardio
          if (exercise.category === "cardio" && exercise.cardioDuration) {
            const cardioMinutes = exercise.cardioDuration;
            totalTrainingDuration += cardioMinutes;

            // Ajustar MET baseado na intensidade
            let metValue = 8.0; // Valor base para cardio moderado

            if (exercise.cardioIntensity) {
              if (exercise.cardioIntensity <= 3) {
                metValue = 4.0; // Cardio leve
              } else if (exercise.cardioIntensity <= 7) {
                metValue = 8.0; // Cardio moderado
              } else {
                metValue = 12.0; // Cardio intenso
              }
            }

            // Calorias = MET × peso (kg) × duração (horas)
            const caloriesForExercise =
              metValue * userWeight * (cardioMinutes / 60);
            totalCalories += caloriesForExercise;

            // Adicionar ao tempo de trabalho para cálculo de densidade
            workTime += cardioMinutes * 60; // Converter para segundos
          }

          // Calcular séries e volume para exercícios de força
          if (exercise.sets && exercise.category !== "cardio") {
            totals.totalSets += exercise.sets.length;

            // Duração total deste exercício em segundos
            let exerciseDuration = 0;

            // Verificar qual grupo muscular está sendo trabalhado para ajustar o MET
            let baseMetValue = 3.0; // Valor base para exercícios de força pequenos

            // Ajustar MET conforme tipo de exercício
            if (exercise.name) {
              const exerciseName = exercise.name.toLowerCase();
              if (
                exerciseName.includes("agachamento") ||
                exerciseName.includes("leg") ||
                exerciseName.includes("deadlift") ||
                exerciseName.includes("stiff") ||
                exerciseName.includes("terra")
              ) {
                baseMetValue = 6.0; // Exercícios para pernas/grandes grupos
              } else if (
                exerciseName.includes("supino") ||
                exerciseName.includes("remada") ||
                exerciseName.includes("puxada") ||
                exerciseName.includes("desenvolvimento") ||
                exerciseName.includes("bench") ||
                exerciseName.includes("press") ||
                exerciseName.includes("row")
              ) {
                baseMetValue = 5.0; // Exercícios para tórax/costas/médios grupos
              } else if (
                exerciseName.includes("biceps") ||
                exerciseName.includes("triceps") ||
                exerciseName.includes("curl") ||
                exerciseName.includes("elevação") ||
                exerciseName.includes("fly") ||
                exerciseName.includes("lateral")
              ) {
                baseMetValue = 3.5; // Exercícios para pequenos grupos musculares
              }
            }

            // Calcular o volume total e outras estatísticas
            exercise.sets.forEach((set) => {
              const setVolume = set.weight * set.reps;
              totals.totalVolume += setVolume;
              totals.totalReps += set.reps;

              // Acumular para cálculos de média
              totalWeightSum += set.weight;
              totalWeightCount++;
              totalRepsSum += set.reps;
              totalRepsCount++;

              // Tempo de descanso entre séries
              const restTime = set.restTime || 60;
              totalRestTime += restTime;
              restTimeCount++;

              // Calcular tempo de trabalho por série
              const repDuration = 3 + set.weight / 100;
              const setWorkTime = set.reps * repDuration;
              workTime += setWorkTime;
              exerciseDuration += setWorkTime + restTime;

              // Atualizar carga máxima
              if (set.weight > maxWeightFound) {
                maxWeightFound = set.weight;
              }

              // Calcular calorias para esta série
              // Ajustar MET pelo peso relativo (peso como % do peso corporal)
              const relativeWeight = set.weight / userWeight;
              // Ajustar intensidade baseado no peso relativo e repetições
              const intensityFactor = 1 + (relativeWeight * set.reps) / 10;

              // MET efetivo combinando o base do exercício com intensidade
              const effectiveMetValue = baseMetValue * intensityFactor;

              // Calorias = MET × peso (kg) × duração (horas)
              const setDurationHours = setWorkTime / 3600; // Converter segundos para horas
              const caloriesForSet =
                effectiveMetValue *
                userWeight *
                setDurationHours *
                CALORIE_SCALING_FACTOR;

              totalCalories += caloriesForSet;
            });

            // Adicionar a duração deste exercício à duração total (em minutos)
            totalTrainingDuration += Math.ceil(exerciseDuration / 60);
          }
        });

        // Atualizar a duração total
        totals.totalDuration = totalTrainingDuration;

        // Calcular médias
        totals.avgWeight =
          totalWeightCount > 0
            ? Math.round(totalWeightSum / totalWeightCount)
            : 0;
        totals.avgReps =
          totalRepsCount > 0 ? Math.round(totalRepsSum / totalRepsCount) : 0;
        totals.maxWeight = maxWeightFound;
        totals.caloriesBurned = Math.round(totalCalories);
        totals.avgRestTime =
          restTimeCount > 0 ? Math.round(totalRestTime / restTimeCount) : 60;

        // Calcular densidade do treino
        if (workTime > 0 && totalRestTime > 0) {
          totals.trainingDensity = parseFloat(
            (workTime / totalRestTime).toFixed(2)
          );
        }

        return { totals, date };
      }
    }

    // Se não encontrar nenhum treino anterior
    return { totals: null, date: null };
  };

  // Salvar os tipos de treino disponíveis
  const saveAvailableWorkoutTypes = async (types: WorkoutType[]) => {
    try {
      // Atualizar o estado
      setAvailableWorkoutTypes(types);

      // Função para remover valores undefined recursivamente
      const removeUndefined = (obj: any): any => {
        if (obj === null || typeof obj !== "object") {
          return obj;
        }

        if (Array.isArray(obj)) {
          return obj.map((item) => removeUndefined(item));
        }

        const result: any = {};
        for (const key in obj) {
          if (obj[key] !== undefined) {
            result[key] = removeUndefined(obj[key]);
          }
        }
        return result;
      };

      // Limpar valores undefined antes de salvar
      const cleanTypes = removeUndefined(types);
      const typesJSON = JSON.stringify(cleanTypes);

      // Salvar no AsyncStorage
      await AsyncStorage.setItem(
        `${KEYS.AVAILABLE_WORKOUT_TYPES}:${userId}`,
        typesJSON
      );

      // Salvar no Firebase se o usuário não for anônimo
      if (userId && userId !== "anonymous" && userId !== "no-user") {
        try {
          const db = getFirestore();
          const workoutsRef = doc(db, "users", userId, "workouts", "data");
          await setDoc(
            workoutsRef,
            {
              availableWorkoutTypes: cleanTypes,
              lastUpdated: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (firebaseError) {
          // Continuar, pois os dados já foram salvos no AsyncStorage
        }
      }

      // Verificar se os dados foram salvos corretamente
      const savedData = await AsyncStorage.getItem(
        `${KEYS.AVAILABLE_WORKOUT_TYPES}:${userId}`
      );
      if (!savedData) {
        setTimeout(async () => {
          await AsyncStorage.setItem(
            `${KEYS.AVAILABLE_WORKOUT_TYPES}:${userId}`,
            typesJSON
          );
        }, 500);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Erro ao salvar tipos de treino disponíveis
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Copiar treino de uma data para outra
  const copyWorkoutFromDate = async (
    sourceDate: string,
    targetDate: string,
    sourceWorkoutId: string,
    targetWorkoutId: string
  ) => {
    try {
      // Verificar se o treino de origem existe
      if (!workouts[sourceDate] || !workouts[sourceDate][sourceWorkoutId]) {
        return;
      }

      // Tentar obter o tipo de treino usando getWorkoutTypeById
      let sourceWorkoutType = getWorkoutTypeById(sourceWorkoutId);

      if (!sourceWorkoutType) {
        // Se não encontrar, tentar obter pela função antiga
        sourceWorkoutType = getWorkoutTypeForWorkout(
          sourceDate,
          sourceWorkoutId
        );
      }

      if (!sourceWorkoutType) {
        // Criar um tipo de treino padrão se não encontrar
        sourceWorkoutType = {
          id: sourceWorkoutId,
          name:
            sourceWorkoutId.charAt(0).toUpperCase() + sourceWorkoutId.slice(1),
          iconType: {
            type: "ionicons",
            name: "barbell-outline",
          },
          color: "#FF6B6B",
          selected: true,
        };
      }

      // Atualizar o estado dos treinos
      setWorkouts((prev) => {
        const updatedWorkouts = { ...prev };

        // Inicializar a entrada para a data de destino se não existir
        if (!updatedWorkouts[targetDate]) {
          updatedWorkouts[targetDate] = {};
        }

        // Copiar os exercícios do treino de origem para o destino
        // Criando cópias profundas com novos IDs para evitar referências compartilhadas
        updatedWorkouts[targetDate][targetWorkoutId] = workouts[sourceDate][
          sourceWorkoutId
        ].map((exercise) => {
          // Verificar se o exercício usa uma chave de tradução
          const isTranslationKey =
            exercise.id &&
            exercise.id.length <= 6 &&
            exercise.id.startsWith("ex");

          // Gerar um novo ID apenas se não for uma chave de tradução
          const newExerciseId = isTranslationKey
            ? exercise.id
            : `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Criar uma cópia profunda do exercício
          const newExercise = {
            ...JSON.parse(JSON.stringify(exercise)),
            id: newExerciseId,
            // Se for uma chave de tradução, manter o nome original
            name: isTranslationKey ? exercise.name : exercise.name,
          };

          // Se existirem sets, criar novos IDs para eles também
          if (newExercise.sets && newExercise.sets.length > 0) {
            newExercise.sets = newExercise.sets.map((set: ExerciseSet) => ({
              ...JSON.parse(JSON.stringify(set)),
              id: `set_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            }));
          }

          return newExercise;
        });

        return updatedWorkouts;
      });

      // Atualizar o estado dos tipos de treino
      setWorkoutTypes((prev) => {
        const updatedWorkoutTypes = { ...prev };

        // Inicializar a entrada para a data de destino se não existir
        if (!updatedWorkoutTypes[targetDate]) {
          updatedWorkoutTypes[targetDate] = {};
        }

        // Garantir que temos um tipo de treino válido antes de fazer a atribuição
        if (sourceWorkoutType) {
          // Copiar o tipo de treino de origem para o destino
          updatedWorkoutTypes[targetDate][targetWorkoutId] = sourceWorkoutType;
        }

        return updatedWorkoutTypes;
      });

      // Salvar os treinos e tipos de treino
      await Promise.all([saveWorkouts(), saveWorkoutTypes()]);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Salvar tipos de treino no AsyncStorage
  const saveWorkoutTypes = async () => {
    try {
      // Converter para JSON e verificar se é válido
      const workoutTypesJSON = JSON.stringify(workoutTypes);

      // Salvar no AsyncStorage
      await AsyncStorage.setItem(
        `${KEYS.WORKOUT_TYPES}:${userId}`,
        workoutTypesJSON
      );

      // Salvar no Firebase se o usuário não for anônimo
      if (userId && userId !== "anonymous" && userId !== "no-user") {
        try {
          const db = getFirestore();

          // Verificar se o usuário ainda está autenticado antes de tentar salvar
          const { auth } = require("../firebase/config");
          if (!auth.currentUser) {
            return true;
          }

          // Função para remover valores undefined recursivamente
          const removeUndefined = (obj: any): any => {
            if (obj === null || typeof obj !== "object") {
              return obj;
            }

            if (Array.isArray(obj)) {
              return obj.map((item) => removeUndefined(item));
            }

            const result: any = {};
            for (const key in obj) {
              if (obj[key] !== undefined) {
                result[key] = removeUndefined(obj[key]);
              }
            }
            return result;
          };

          // Limpar valores undefined antes de salvar
          const cleanWorkoutTypes = removeUndefined(workoutTypes);

          // Salvar os dados no Firestore
          const workoutsRef = doc(db, "users", userId, "workouts", "data");
          await setDoc(
            workoutsRef,
            {
              workoutTypes: cleanWorkoutTypes,
              lastUpdated: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (firebaseError) {
          // Se o erro for de permissão durante o logout, não devemos lançar o erro
          if (
            typeof firebaseError === "object" &&
            firebaseError !== null &&
            "toString" in firebaseError &&
            typeof firebaseError.toString === "function" &&
            firebaseError
              .toString()
              .includes("Missing or insufficient permissions")
          ) {
            return true; // Continue normalmente, pois os dados foram salvos no AsyncStorage
          }
        }
      }

      // Verificar se os dados foram salvos corretamente
      const savedData = await AsyncStorage.getItem(
        `${KEYS.WORKOUT_TYPES}:${userId}`
      );

      if (!savedData) {
        // Tentar novamente com um pequeno atraso
        setTimeout(async () => {
          await AsyncStorage.setItem(
            `${KEYS.WORKOUT_TYPES}:${userId}`,
            workoutTypesJSON
          );
        }, 500);

        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  };

  // Verificar se há tipos de treino configurados
  const hasWorkoutTypesConfigured = useCallback(() => {
    // Verificar se existem tipos de treino selecionados
    return (
      Array.isArray(availableWorkoutTypes) &&
      availableWorkoutTypes.some((type) => type.selected === true)
    );
  }, [availableWorkoutTypes]);

  // Função para obter múltiplos treinos anteriores do mesmo tipo
  const getMultiplePreviousWorkoutsExercises = useCallback(
    (
      workoutId: string,
      limit: number = 4
    ): { exercises: Exercise[]; date: string }[] => {
      // Obter datas anteriores à data selecionada
      const previousDates = Object.keys(workouts)
        .filter((date) => date < selectedDate)
        .sort((a, b) => b.localeCompare(a)); // Ordem decrescente (mais recente primeiro)

      // Se não houver datas anteriores, retornar array vazio
      if (previousDates.length === 0) {
        return [];
      }

      const result: { exercises: Exercise[]; date: string }[] = [];

      // Percorrer as datas anteriores e coletar até 'limit' treinos
      for (const date of previousDates) {
        if (workouts[date] && workouts[date][workoutId]) {
          const exercises = workouts[date][workoutId];

          // Filtrar apenas exercícios de força que possuem séries
          const validExercises = exercises.filter(
            (exercise) =>
              exercise.category !== "cardio" &&
              exercise.sets &&
              exercise.sets.length > 0
          );

          if (validExercises.length > 0) {
            result.push({ exercises: validExercises, date });

            // Parar quando atingir o limite
            if (result.length >= limit) {
              break;
            }
          }
        }
      }

      return result;
    },
    [workouts, selectedDate]
  );

  // Função para aplicar progressão ao treino atual
  const applyProgressionToWorkout = useCallback(
    async (
      workoutId: string,
      updatedExercises: Exercise[]
    ): Promise<boolean> => {
      try {
        // Verificar se o workoutId e a data selecionada existem
        if (!workoutId || !selectedDate) {
          return false;
        }

        // Obter os treinos atuais para a data selecionada
        const workoutsForDate = workouts[selectedDate]
          ? { ...workouts[selectedDate] }
          : {};

        // Se o treino não existir para a data selecionada, criá-lo
        if (!workoutsForDate[workoutId]) {
          workoutsForDate[workoutId] = [];
        }

        // Para cada exercício atualizado
        updatedExercises.forEach((updatedExercise) => {
          // Verificar se o exercício já existe no treino
          const existingIndex = workoutsForDate[workoutId].findIndex(
            (e) => e.id === updatedExercise.id
          );

          if (existingIndex >= 0) {
            // Atualizar exercício existente
            workoutsForDate[workoutId][existingIndex] = updatedExercise;
          } else {
            // Adicionar novo exercício
            workoutsForDate[workoutId].push(updatedExercise);
          }
        });

        // Atualizar o estado
        setWorkouts((prev) => ({
          ...prev,
          [selectedDate]: {
            ...prev[selectedDate],
            [workoutId]: workoutsForDate[workoutId],
          },
        }));

        // Salvar os treinos
        await saveWorkouts();

        // NOVO: Salvar timestamp da aplicação bem-sucedida no AsyncStorage
        const todayStr = format(new Date(), "yyyy-MM-dd");
        // Obter userId do hook useAuth (já está no escopo do provider)
        if (userId && userId !== "anonymous" && userId !== "no-user") {
          await AsyncStorage.setItem(
            `${KEYS.LAST_PROGRESSION_APPLIED_CHECK_DATE}_${userId}`,
            todayStr
          );
        }
        // FIM NOVO

        return true;
      } catch (error) {
        console.error("Erro ao aplicar progressão:", error);
        return false;
      } 
    },
    [workouts, selectedDate, saveWorkouts, userId] // Adicionar userId às dependências
  );

  // Função para salvar/substituir um treino gerado pelo builder
  const saveGeneratedWorkout = useCallback(
    async (
      workoutId: string,
      date: string,
      exercises: Exercise[]
    ): Promise<boolean> => {
      try {
        // Verificar se workoutId e date são válidos
        if (!workoutId || !date) {
          console.warn("Workout ID ou Data inválidos para salvar treino gerado.");
          return false;
        }

        // Criar cópia profunda dos exercícios para evitar problemas de referência
        const cleanExercises = JSON.parse(JSON.stringify(exercises));

        // Atualizar o estado dos workouts
        setWorkouts((prev) => {
          const updatedWorkouts = { ...prev };

          // Garantir que a entrada para a data existe
          if (!updatedWorkouts[date]) {
            updatedWorkouts[date] = {};
          }

          // Substituir os exercícios para o workoutId específico nesta data
          updatedWorkouts[date][workoutId] = cleanExercises;

          return updatedWorkouts;
        });

        // Salvar os workouts (que inclui a persistência no AsyncStorage e Firebase)
        await saveWorkouts();

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return true;
      } catch (error) {
        console.error("Erro ao salvar treino gerado:", error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return false;
      }
    },
    [saveWorkouts] // saveWorkouts já inclui a dependência do userId
  );

  // Adicionar um novo contexto - usando os valores memoizados
  const contextValue: WorkoutContextType = useMemo(
    () => ({
      workouts,
      workoutTypes,
      availableWorkoutTypes,
      selectedDate,
      setSelectedDate,
      addExerciseToWorkout,
      removeExerciseFromWorkout,
      updateExerciseInWorkout,
      removeWorkoutForDate,
      saveWorkouts,
      getWorkoutsForDate,
      startWorkoutForDate,
      getAvailableWorkoutTypes,
      copyWorkoutFromDate,
      saveAvailableWorkoutTypes,
      setAvailableWorkoutTypes,
      getWorkoutTypeForWorkout,
      getWorkoutTypeById,
      getExercisesForWorkout,
      saveWorkoutTypes,
      addWorkoutType,
      updateWorkoutTypes,
      getWorkoutTotals,
      getPreviousWorkoutTotals,
      hasWorkoutTypesConfigured,
      workoutsForSelectedDate,
      selectedWorkoutTypes,
      hasConfiguredWorkouts,
      getPreviousWorkoutExercises,
      getMultiplePreviousWorkoutsExercises,
      applyProgressionToWorkout,
      saveGeneratedWorkout,
      // Propriedades para notificação de Conquista
      achievementNotificationData,
      clearAchievementNotification,
    }),
    [
      workouts,
      workoutTypes,
      availableWorkoutTypes,
      selectedDate,
      addExerciseToWorkout, 
      removeExerciseFromWorkout, 
      updateExerciseInWorkout, 
      removeWorkoutForDate, 
      saveWorkouts, 
      getWorkoutsForDate, 
      startWorkoutForDate, 
      getAvailableWorkoutTypes, 
      copyWorkoutFromDate, 
      saveAvailableWorkoutTypes, 
      getWorkoutTypeForWorkout, 
      getWorkoutTypeById, 
      getExercisesForWorkout, 
      saveWorkoutTypes, 
      addWorkoutType, 
      updateWorkoutTypes, 
      getWorkoutTotals, 
      getPreviousWorkoutTotals, 
      hasWorkoutTypesConfigured, 
      workoutsForSelectedDate,
      selectedWorkoutTypes,
      hasConfiguredWorkouts,
      getPreviousWorkoutExercises, 
      getMultiplePreviousWorkoutsExercises,
      applyProgressionToWorkout,
      saveGeneratedWorkout,
      achievementNotificationData,
      clearAchievementNotification,
    ]
  );

  return (
    <WorkoutContext.Provider value={contextValue}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkoutContext = () => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error("useWorkoutContext must be used within a WorkoutProvider");
  }
  return context;
};

// Manter compatibilidade com código existente
export const useWorkout = useWorkoutContext;
