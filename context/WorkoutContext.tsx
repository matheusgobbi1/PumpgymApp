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
import { WorkoutType } from "../components/training/WorkoutConfigSheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { KEYS } from "../constants/keys";
import { Alert } from "react-native";
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
  resetWorkoutTypes: () => Promise<boolean>;
  updateWorkoutTypes: (newWorkoutTypes: WorkoutType[]) => Promise<boolean>;
  getWorkoutTotals: (workoutId: string) => WorkoutTotals;
  getPreviousWorkoutTotals: (workoutId: string) => {
    totals: WorkoutTotals | null;
    date: string | null;
  };
  workoutsForSelectedDate: { [workoutId: string]: Exercise[] };
  selectedWorkoutTypes: WorkoutType[];
  hasConfiguredWorkouts: boolean;
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

  // Carregar treinos do AsyncStorage
  const loadWorkouts = async (): Promise<boolean> => {
    try {
      setLoading(true);

      // Primeiro carregar dados do AsyncStorage
      const storedWorkouts = await AsyncStorage.getItem(
        `${KEYS.WORKOUTS}:${userId}`
      );
      const storedTypes = await AsyncStorage.getItem(
        `${KEYS.AVAILABLE_WORKOUT_TYPES}:${userId}`
      );

      let workoutsData = storedWorkouts ? JSON.parse(storedWorkouts) : {};
      let workoutTypes = storedTypes ? JSON.parse(storedTypes) : [];

      // Atualizar estado com dados locais primeiro
      setWorkouts(workoutsData);
      if (Array.isArray(workoutTypes) && workoutTypes.length > 0) {
        const validatedTypes = workoutTypes.map((type) => ({
          ...type,
          selected: Boolean(type.selected),
        }));
        setAvailableWorkoutTypes(validatedTypes);
      }

      // Tentar sincronizar com Firebase se o usuário estiver autenticado e não for anônimo
      if (user && !user.isAnonymous) {
        try {
          const workoutsRef = doc(db, "users", user.uid, "workouts", "data");
          const workoutsDoc = await getDoc(workoutsRef);

          if (workoutsDoc.exists()) {
            const firebaseData = workoutsDoc.data();

            // Mesclar dados do Firebase com dados locais
            if (firebaseData.workouts) {
              const mergedWorkouts = {
                ...workoutsData,
                ...firebaseData.workouts,
              };
              workoutsData = mergedWorkouts;
              setWorkouts(mergedWorkouts);

              // Atualizar AsyncStorage com dados mesclados
              await AsyncStorage.setItem(
                `${KEYS.WORKOUTS}:${userId}`,
                JSON.stringify(mergedWorkouts)
              );
            }

            // Atualizar tipos de treino se existirem no Firebase
            if (firebaseData.availableWorkoutTypes) {
              const mergedTypes = [
                ...workoutTypes,
                ...firebaseData.availableWorkoutTypes,
              ];
              const uniqueTypes = Array.from(
                new Set(mergedTypes.map((type) => type.id))
              ).map((id) => mergedTypes.find((type) => type.id === id));

              workoutTypes = uniqueTypes;
              setAvailableWorkoutTypes(uniqueTypes);

              // Atualizar AsyncStorage com tipos mesclados
              await AsyncStorage.setItem(
                `${KEYS.AVAILABLE_WORKOUT_TYPES}:${userId}`,
                JSON.stringify(uniqueTypes)
              );
            }
          }
        } catch (firebaseError) {
          console.error(
            "Erro ao carregar dados do Firebase, usando dados locais:",
            firebaseError
          );
        }
      }

      return true;
    } catch (error) {
      console.error("Erro ao carregar treinos:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função para inicializar tipos de treino padrão
  const initializeDefaultWorkoutTypes = async () => {
    try {
      // Definir tipos de treino padrão sem nenhum selecionado
      const defaultTypes: WorkoutType[] = [
        {
          id: "Treino A",
          name: "Treino A",
          iconType: {
            type: "material" as const,
            name: "arm-flex-outline" as MaterialIconNames,
          },
          color: "#FF5252",
          selected: false,
          isDefault: true,
        },
        {
          id: "Treino B",
          name: "Treino B",
          iconType: {
            type: "material" as const,
            name: "arm-flex-outline" as MaterialIconNames,
          },
          color: "#448AFF",
          selected: false,
          isDefault: true,
        },
        {
          id: "Treino C",
          name: "Treino C",
          iconType: {
            type: "material" as const,
            name: "arm-flex-outline" as MaterialIconNames,
          },
          color: "#66BB6A",
          selected: false,
          isDefault: true,
        },
        {
          id: "Treino D",
          name: "Treino D",
          iconType: {
            type: "material" as const,
            name: "arm-flex-outline" as MaterialIconNames,
          },
          color: "#FFA726",
          selected: false,
          isDefault: true,
        },
        {
          id: "Treino E",
          name: "Treino E",
          iconType: {
            type: "material" as const,
            name: "arm-flex-outline" as MaterialIconNames,
          },
          color: "#AB47BC",
          selected: false,
          isDefault: true,
        },
        {
          id: "Treino F",
          name: "Treino F",
          iconType: {
            type: "material" as const,
            name: "arm-flex-outline" as MaterialIconNames,
          },
          color: "#26A69A",
          selected: false,
          isDefault: true,
        },
        {
          id: "Treino G",
          name: "Treino G",
          iconType: {
            type: "material" as const,
            name: "arm-flex-outline" as MaterialIconNames,
          },
          color: "#EC407A",
          selected: false,
          isDefault: true,
        },
      ];

      // Atualizar estado local
      setAvailableWorkoutTypes(defaultTypes);

      // Salvar no AsyncStorage
      await AsyncStorage.setItem(
        `${KEYS.AVAILABLE_WORKOUT_TYPES}:${userId}`,
        JSON.stringify(defaultTypes)
      );

      // Se o usuário estiver autenticado e não for anônimo, sincronizar com Firebase
      if (user && !user.isAnonymous) {
        try {
          const db = getFirestore();
          const workoutsRef = doc(db, "users", user.uid, "workouts", "data");

          await setDoc(
            workoutsRef,
            {
              availableWorkoutTypes: defaultTypes,
              lastUpdated: serverTimestamp(),
            },
            { merge: true }
          );

          console.log("Tipos de treino padrão sincronizados com Firebase");
        } catch (firebaseError) {
          console.error(
            "Erro ao sincronizar tipos de treino padrão com Firebase:",
            firebaseError
          );
        }
      }

      return true;
    } catch (error) {
      console.error("Erro ao inicializar tipos de treino padrão:", error);
      return false;
    }
  };

  // Carregar tipos de treino do AsyncStorage
  const loadWorkoutTypes = async () => {
    try {
      const storedWorkoutTypes = await AsyncStorage.getItem(
        `${KEYS.WORKOUT_TYPES}:${userId}`
      );
      if (storedWorkoutTypes) {
        try {
          const parsedWorkoutTypes = JSON.parse(storedWorkoutTypes);

          // Verificar se os dados têm formato válido
          if (parsedWorkoutTypes && typeof parsedWorkoutTypes === "object") {
            setWorkoutTypes(parsedWorkoutTypes);
            console.log("Tipos de treino carregados com sucesso");
            return true;
          } else {
            console.warn(
              "Formato inválido de tipos de treino:",
              parsedWorkoutTypes
            );
            await AsyncStorage.removeItem(`${KEYS.WORKOUT_TYPES}:${userId}`);
            setWorkoutTypes({});
            return false;
          }
        } catch (parseError) {
          console.error(
            "Erro ao analisar dados de tipos de treino:",
            parseError
          );
          // Em caso de erro, limpar os dados para evitar problemas
          await AsyncStorage.removeItem(`${KEYS.WORKOUT_TYPES}:${userId}`);
          setWorkoutTypes({});
          return false;
        }
      }
      return false;
    } catch (error) {
      // Erro ao carregar tipos de treino
      console.error("Erro ao carregar tipos de treino:", error);
      // Em caso de erro, limpar os dados para evitar problemas
      await AsyncStorage.removeItem(`${KEYS.WORKOUT_TYPES}:${userId}`);
      setWorkoutTypes({});
      return false;
    }
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Iniciando carregamento de dados...");

        // Tentar carregar os dados várias vezes se necessário
        let retryCount = 0;
        const maxRetries = 3;
        let success = false;

        while (retryCount < maxRetries && !success) {
          try {
            // Carregar treinos e tipos de treino
            success = await loadWorkouts();

            if (success) {
              console.log(
                "Dados carregados com sucesso na tentativa",
                retryCount + 1
              );
              break;
            }

            // Se não teve sucesso, esperar um pouco antes de tentar novamente
            await new Promise((resolve) => setTimeout(resolve, 1000));
            retryCount++;
          } catch (error) {
            console.error("Erro na tentativa", retryCount + 1, ":", error);
            retryCount++;
          }
        }

        if (!success) {
          console.error(
            "Falha ao carregar dados após",
            maxRetries,
            "tentativas"
          );
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    loadData();
  }, [userId]);

  // Obter dados do treino de forma segura
  const getWorkoutDataSafely = () => {
    return {
      workouts,
      workoutTypes,
      selectedDate,
    };
  };

  // Iniciar um treino para uma data específica
  const startWorkoutForDate = async (workoutId: string) => {
    try {
      console.log(`Iniciando treino ${workoutId} para a data ${selectedDate}`);

      // Buscar o tipo de treino
      const workoutType = getWorkoutTypeById(workoutId);
      if (!workoutType) {
        console.error(`Tipo de treino ${workoutId} não encontrado`);
        return null;
      }

      console.log("Tipo de treino encontrado:", workoutType.name);

      // Atualizar o estado
      setWorkoutTypes((prev) => {
        const updatedWorkoutTypes = { ...prev };

        // Inicializar a entrada para a data se não existir
        if (!updatedWorkoutTypes[selectedDate]) {
          updatedWorkoutTypes[selectedDate] = {};
        }

        // Adicionar o tipo de treino
        updatedWorkoutTypes[selectedDate][workoutId] = workoutType;

        return updatedWorkoutTypes;
      });

      // Inicializar workouts se não existir
      setWorkouts((prev) => {
        const updatedWorkouts = { ...prev };
        if (!updatedWorkouts[selectedDate]) {
          updatedWorkouts[selectedDate] = {};
        }
        if (!updatedWorkouts[selectedDate][workoutId]) {
          updatedWorkouts[selectedDate][workoutId] = [];
        }
        return updatedWorkouts;
      });

      // Salvar os treinos no AsyncStorage e Firebase para persistência
      try {
        await saveWorkouts();
        console.log("Treino iniciado e salvo com sucesso");
      } catch (saveError) {
        console.error("Erro ao salvar treino iniciado:", saveError);

        // Tentar novamente com um pequeno atraso
        setTimeout(async () => {
          try {
            await saveWorkouts();
            console.log("Treino salvo após tentativa adicional");
          } catch (retryError) {
            console.error("Falha na segunda tentativa de salvar:", retryError);
          }
        }, 500);
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
      console.error("Erro ao adicionar tipo de treino:", error);
      return Promise.reject(error);
    }
  };

  // Redefinir tipos de treino
  const resetWorkoutTypes = async () => {
    try {
      console.log("Iniciando redefinição de treinos...");

      // Limpar todos os estados
      setWorkouts({});
      setWorkoutTypes({});
      setAvailableWorkoutTypes([]);

      // Limpar dados do AsyncStorage
      await AsyncStorage.removeItem(`${KEYS.WORKOUT_TYPES}:${userId}`);
      await AsyncStorage.removeItem(`${KEYS.WORKOUTS}:${userId}`);
      await AsyncStorage.removeItem(
        `${KEYS.AVAILABLE_WORKOUT_TYPES}:${userId}`
      );

      // Inicializar tipos de treino padrão
      initializeDefaultWorkoutTypes();

      // Verificar se a remoção foi bem-sucedida
      const storedWorkouts = await AsyncStorage.getItem(
        `${KEYS.WORKOUTS}:${userId}`
      );
      const storedTypes = await AsyncStorage.getItem(
        `${KEYS.AVAILABLE_WORKOUT_TYPES}:${userId}`
      );

      if (storedWorkouts || storedTypes) {
        console.warn(
          "Dados ainda presentes após tentativa de limpeza, tentando novamente..."
        );

        // Forçar uma segunda tentativa de limpeza
        await AsyncStorage.clear(); // Limpar todo o AsyncStorage em caso de erro persistente
        await AsyncStorage.removeItem(`${KEYS.WORKOUT_TYPES}:${userId}`);
        await AsyncStorage.removeItem(`${KEYS.WORKOUTS}:${userId}`);
        await AsyncStorage.removeItem(
          `${KEYS.AVAILABLE_WORKOUT_TYPES}:${userId}`
        );

        // Reinicializar os tipos novamente
        setTimeout(() => {
          initializeDefaultWorkoutTypes();
        }, 500);
      }

      // Feedback tátil
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      console.log("Redefinição de treinos concluída com sucesso");
      return true;
    } catch (error) {
      // Erro ao redefinir tipos de treino
      console.error("Erro ao redefinir tipos de treino:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
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
          console.log("Tipos de treino atualizados no Firebase");
        } catch (firebaseError) {
          console.error(
            "Erro ao atualizar tipos de treino no Firebase:",
            firebaseError
          );
          // Continuar, pois os dados já foram salvos no AsyncStorage
        }
      }

      // Log para debug
      console.log("Tipos de treino atualizados:", cleanWorkoutTypes);

      // Filtrar apenas os tipos de treino selecionados
      const selectedTypes = cleanWorkoutTypes.filter(
        (type: WorkoutType) => type.selected
      );
      console.log("Tipos de treino selecionados:", selectedTypes);

      // Retornar verdadeiro para indicar sucesso
      return true;
    } catch (error) {
      console.error("Erro ao atualizar tipos de treino:", error);
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
      console.error("Erro ao adicionar exercício:", error);

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
      console.log(`Removendo exercício ${exerciseId} do treino ${workoutId}`);

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
        console.log("Exercício removido e alterações salvas com sucesso");
      } catch (saveError) {
        console.error("Erro ao salvar após remover exercício:", saveError);

        // Tentar novamente com um pequeno atraso
        setTimeout(async () => {
          try {
            await saveWorkouts();
            console.log("Exercício removido após tentativa adicional");
          } catch (retryError) {
            console.error("Falha na segunda tentativa de salvar:", retryError);
          }
        }, 500);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Erro ao remover exercício
      console.error("Erro ao remover exercício:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Atualizar exercício em um treino
  const updateExerciseInWorkout = async (
    workoutId: string,
    exerciseId: string,
    updatedExercise: Exercise
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

        // Atualizar o exercício no treino
        updatedWorkouts[selectedDate][workoutId] = updatedWorkouts[
          selectedDate
        ][workoutId].map((exercise) =>
          exercise.id === exerciseId ? updatedExercise : exercise
        );

        return updatedWorkouts;
      });

      // Salvar imediatamente para garantir persistência
      try {
        const currentWorkouts = { ...workouts };

        // Verificar se existe uma entrada para a data selecionada e o treino
        if (
          !currentWorkouts[selectedDate] ||
          !currentWorkouts[selectedDate][workoutId]
        ) {
          return;
        }

        // Atualizar o exercício no treino
        currentWorkouts[selectedDate][workoutId] = currentWorkouts[
          selectedDate
        ][workoutId].map((exercise) =>
          exercise.id === exerciseId ? updatedExercise : exercise
        );

        // Salvar no AsyncStorage
        await AsyncStorage.setItem(
          `${KEYS.WORKOUTS}:${userId}`,
          JSON.stringify(currentWorkouts)
        );

        // Verificar se os dados foram salvos corretamente
        const savedData = await AsyncStorage.getItem(
          `${KEYS.WORKOUTS}:${userId}`
        );
        if (!savedData) {
          console.warn(
            "Falha ao verificar se os dados foram salvos corretamente após atualizar exercício"
          );

          // Tentar novamente com um pequeno atraso
          setTimeout(async () => {
            await AsyncStorage.setItem(
              `${KEYS.WORKOUTS}:${userId}`,
              JSON.stringify(currentWorkouts)
            );
          }, 500);
        }
      } catch (error) {
        console.error("Erro ao salvar após atualizar exercício:", error);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Erro ao atualizar exercício
      console.error("Erro ao atualizar exercício:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Salvar treinos no AsyncStorage
  const saveWorkouts = async (): Promise<void> => {
    try {
      console.log("Salvando treinos no storage...");

      // Primeiro salvar localmente para garantir persistência
      await AsyncStorage.setItem(
        `${KEYS.WORKOUTS}:${userId}`,
        JSON.stringify(workouts)
      );

      // Verificar se os dados foram salvos localmente
      const savedData = await AsyncStorage.getItem(
        `${KEYS.WORKOUTS}:${userId}`
      );
      if (!savedData) {
        console.warn("Falha ao verificar se os dados foram salvos localmente");
        // Tentar novamente
        await AsyncStorage.setItem(
          `${KEYS.WORKOUTS}:${userId}`,
          JSON.stringify(workouts)
        );
      }

      // Salvar no Firebase apenas se estiver online e o usuário não for anônimo
      if (userId && userId !== "anonymous" && userId !== "no-user") {
        try {
          const db = getFirestore();

          // Verificar se o usuário ainda está autenticado
          const { auth } = require("../firebase/config");
          if (!auth.currentUser) {
            console.log(
              "Usuário não está autenticado, dados salvos apenas localmente"
            );
            return;
          }

          // Limpar valores undefined antes de salvar
          const cleanWorkouts = JSON.parse(JSON.stringify(workouts));
          const cleanWorkoutTypes = JSON.parse(
            JSON.stringify(availableWorkoutTypes)
          );

          // Salvar no Firestore
          const workoutsRef = doc(db, "users", userId, "workouts", "data");
          await setDoc(
            workoutsRef,
            {
              workouts: cleanWorkouts,
              availableWorkoutTypes: cleanWorkoutTypes,
              lastUpdated: serverTimestamp(),
            },
            { merge: true }
          );
          console.log("Treinos sincronizados com Firebase com sucesso");
        } catch (firebaseError) {
          console.error(
            "Erro ao salvar no Firebase, dados mantidos localmente:",
            firebaseError
          );
        }
      }
    } catch (error) {
      console.error("Erro ao salvar treinos:", error);
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
    };

    // Obter os treinos para a data selecionada
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
      try {
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
            console.log(
              "Tipos de treino disponíveis sincronizados com Firebase"
            );
          } catch (firebaseError) {
            console.error(
              "Erro ao salvar tipos de treino disponíveis no Firebase:",
              firebaseError
            );
            // Continuar, pois os dados já foram salvos no AsyncStorage
          }
        }

        // Verificar se os dados foram salvos corretamente
        const savedData = await AsyncStorage.getItem(
          `${KEYS.AVAILABLE_WORKOUT_TYPES}:${userId}`
        );
        if (!savedData) {
          console.warn(
            "Falha ao verificar se os tipos de treino disponíveis foram salvos corretamente"
          );

          // Tentar novamente com um pequeno atraso
          setTimeout(async () => {
            await AsyncStorage.setItem(
              `${KEYS.AVAILABLE_WORKOUT_TYPES}:${userId}`,
              typesJSON
            );
          }, 500);
        }
      } catch (error) {
        console.error("Erro ao salvar tipos de treino disponíveis:", error);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Erro ao salvar tipos de treino disponíveis
      console.error("Erro ao atualizar tipos de treino disponíveis:", error);
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
          color: "#FF5252",
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
        updatedWorkouts[targetDate][targetWorkoutId] = [
          ...workouts[sourceDate][sourceWorkoutId],
        ];

        return updatedWorkouts;
      });

      // Atualizar o estado dos tipos de treino
      setWorkoutTypes((prev) => {
        const updatedWorkoutTypes = { ...prev };

        // Inicializar a entrada para a data de destino se não existir
        if (!updatedWorkoutTypes[targetDate]) {
          updatedWorkoutTypes[targetDate] = {};
        }

        // Copiar o tipo de treino de origem para o destino
        updatedWorkoutTypes[targetDate][targetWorkoutId] = sourceWorkoutType;

        return updatedWorkoutTypes;
      });

      // Salvar os treinos e tipos de treino
      await Promise.all([saveWorkouts(), saveWorkoutTypes()]);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Erro ao copiar treino:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Salvar tipos de treino no AsyncStorage
  const saveWorkoutTypes = async () => {
    try {
      console.log("Salvando tipos de treino:", JSON.stringify(workoutTypes));

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
            console.log(
              "Usuário não está autenticado, pulando sincronização com Firebase"
            );
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

          console.log("Tipos de treino sincronizados com Firebase com sucesso");
        } catch (firebaseError) {
          console.error(
            "Erro ao salvar tipos de treino no Firebase:",
            firebaseError
          );

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
            console.log(
              "Erro de permissão ao salvar no Firebase. Provavelmente durante logout."
            );
            return true; // Continue normalmente, pois os dados foram salvos no AsyncStorage
          }

          // Continuar, pois os dados já foram salvos em AsyncStorage
        }
      }

      // Verificar se os dados foram salvos corretamente
      const savedData = await AsyncStorage.getItem(
        `${KEYS.WORKOUT_TYPES}:${userId}`
      );

      if (!savedData) {
        console.warn("Falha ao verificar se os tipos de treino foram salvos");

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
      console.error("Erro ao salvar tipos de treino:", error);
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
      resetWorkoutTypes,
      updateWorkoutTypes,
      getWorkoutTotals,
      getPreviousWorkoutTotals,
      hasWorkoutTypesConfigured,
      // Valores memoizados
      workoutsForSelectedDate,
      selectedWorkoutTypes,
      hasConfiguredWorkouts,
    }),
    [
      workouts,
      workoutTypes,
      availableWorkoutTypes,
      selectedDate,
      addExerciseToWorkout,
      removeExerciseFromWorkout,
      updateExerciseInWorkout,
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
      resetWorkoutTypes,
      updateWorkoutTypes,
      getWorkoutTotals,
      getPreviousWorkoutTotals,
      hasWorkoutTypesConfigured,
      workoutsForSelectedDate,
      selectedWorkoutTypes,
      hasConfiguredWorkouts,
    ]
  );

  // Em WorkoutProvider, remover efeito desnecessário
  // useEffect com array de dependência vazio - mantido apenas para documentação
  useEffect(() => {
    return () => {
      // Limpeza ao desmontar - se necessário
    };
  }, []);

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
