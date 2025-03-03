import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useAuth } from './AuthContext';
import { WorkoutType } from '../components/training/WorkoutConfigSheet';

// Interface para série individual
export interface ExerciseSet {
  id: string;
  reps: number;
  weight: number;
}

// Interface para exercício
export interface Exercise {
  id: string;
  name: string;
  sets?: ExerciseSet[]; // Opcional
  notes?: string;
  cardioDuration?: number; // Duração em minutos para exercícios de cardio
  cardioIntensity?: number; // Intensidade de 1-10 para exercícios de cardio
  category?: 'força' | 'cardio' | 'flexibilidade' | 'equilíbrio'; // Categoria do exercício
}

// Interface para treino (workout)
export interface Workout {
  id: string;
  name: string;
  icon: string;
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
  removeExerciseFromWorkout: (workoutId: string, exerciseId: string) => Promise<void>;
  updateExerciseInWorkout: (workoutId: string, exercise: Exercise) => Promise<void>;
  saveWorkouts: () => Promise<void>;
  addWorkoutType: (id: string, name: string, icon: string, color: string) => void;
  resetWorkoutTypes: () => Promise<void>;
  updateWorkoutTypes: (workoutTypes: WorkoutType[]) => Promise<void>;
  hasWorkoutTypesConfigured: boolean;
  getWorkoutTypeById: (id: string) => WorkoutType | undefined;
  setWorkouts: React.Dispatch<React.SetStateAction<{ [date: string]: { [workoutId: string]: Exercise[] } }>>;
  trainingGoals: TrainingGoals | null;
  updateTrainingGoals: (goals: TrainingGoals) => Promise<void>;
  getPreviousWorkoutTotals: (workoutId: string) => { totals: WorkoutTotals | null, date: string | null };
  removeWorkout: (workoutId: string) => Promise<void>;
}

// Criação do contexto
const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

// Provider do contexto
export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.uid || 'anonymous';
  
  // Estados
  const [workouts, setWorkouts] = useState<{ [date: string]: { [workoutId: string]: Exercise[] } }>({});
  const [workoutTypes, setWorkoutTypes] = useState<WorkoutType[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [hasWorkoutTypesConfigured, setHasWorkoutTypesConfigured] = useState<boolean>(false);
  const [trainingGoals, setTrainingGoals] = useState<TrainingGoals | null>(null);
  
  // Carregar treinos do AsyncStorage
  const loadWorkouts = async () => {
    try {
      const storedWorkouts = await AsyncStorage.getItem(`@pumpgym:workouts:${userId}`);
      if (storedWorkouts) {
        const parsedWorkouts = JSON.parse(storedWorkouts);
        setWorkouts(parsedWorkouts);
      }
    } catch (error) {
      console.error('Erro ao carregar treinos:', error);
    }
  };
  
  // Carregar tipos de treinos do AsyncStorage
  const loadWorkoutTypes = async () => {
    try {
      const storedWorkoutTypes = await AsyncStorage.getItem(`@pumpgym:workoutTypes:${userId}`);
      if (storedWorkoutTypes) {
        const parsedWorkoutTypes = JSON.parse(storedWorkoutTypes);
        setWorkoutTypes(parsedWorkoutTypes);
        setHasWorkoutTypesConfigured(parsedWorkoutTypes.length > 0);
      } else {
        setHasWorkoutTypesConfigured(false);
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de treinos:', error);
      setHasWorkoutTypesConfigured(false);
    }
  };
  
  // Carregar metas de treino do AsyncStorage
  const loadTrainingGoals = async () => {
    try {
      const storedGoals = await AsyncStorage.getItem(`@pumpgym:trainingGoals:${userId}`);
      if (storedGoals) {
        const parsedGoals = JSON.parse(storedGoals);
        setTrainingGoals(parsedGoals);
      }
    } catch (error) {
      console.error('Erro ao carregar metas de treino:', error);
    }
  };
  
  // Adicionar tipo de treino
  const addWorkoutType = async (id: string, name: string, icon: string, color: string) => {
    try {
      const newWorkoutType: WorkoutType = {
        id,
        name,
        icon,
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
      
      // Inicializar entrada vazia para o novo tipo de treino
      // APENAS para o dia selecionado
      setWorkouts(prevWorkouts => {
        const updatedWorkouts = { ...prevWorkouts };
        
        // Garantir que existe uma entrada para o dia selecionado
        if (!updatedWorkouts[selectedDate]) {
          updatedWorkouts[selectedDate] = {};
        }
        
        // Inicializar o treino para o dia selecionado
        if (!updatedWorkouts[selectedDate][id]) {
          updatedWorkouts[selectedDate][id] = [];
        }
        
        return updatedWorkouts;
      });
      
      await saveWorkouts();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Erro ao adicionar tipo de treino:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  // Resetar tipos de treinos
  const resetWorkoutTypes = async () => {
    try {
      setWorkoutTypes([]);
      setHasWorkoutTypesConfigured(false);
      
      await AsyncStorage.removeItem(`@pumpgym:workoutTypes:${userId}`);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Erro ao resetar tipos de treinos:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  /**
   * Atualiza os tipos de treino e configura os treinos para a data selecionada.
   * Esta função é chamada quando o usuário confirma a configuração de treinos no WorkoutConfigSheet.
   * 
   * Comportamento:
   * 1. Salva os treinos atuais para evitar perda de dados
   * 2. Atualiza os tipos de treino no estado e no AsyncStorage
   * 3. Cria entradas vazias para os tipos de treino selecionados na data atual
   * 4. Remove treinos que não estão mais selecionados
   * 5. Salva as alterações no AsyncStorage
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
      
      // Obter apenas os tipos de treino selecionados
      const selectedWorkoutTypes = newWorkoutTypes.filter(type => type.selected);
      
      // Atualizar os treinos apenas para o dia selecionado
      setWorkouts(prevWorkouts => {
        const updatedWorkouts = { ...prevWorkouts };
        
        // Garantir que existe uma entrada para o dia selecionado
        if (!updatedWorkouts[selectedDate]) {
          updatedWorkouts[selectedDate] = {};
        }
        
        // Obter os treinos atuais para o dia selecionado
        const currentWorkouts = { ...updatedWorkouts[selectedDate] };
        
        // Verificar quais treinos estão selecionados
        const selectedWorkoutIds = selectedWorkoutTypes.map(workoutType => workoutType.id);
        
        // Atualizar os treinos para o dia selecionado
        selectedWorkoutIds.forEach(workoutId => {
          if (!currentWorkouts[workoutId]) {
            currentWorkouts[workoutId] = [];
          }
        });
        
        // Atualizar apenas o dia selecionado
        updatedWorkouts[selectedDate] = currentWorkouts;
        
        return updatedWorkouts;
      });
      
      // Salvar os treinos imediatamente
      await saveWorkouts();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Erro ao atualizar tipos de treinos:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  // Adicionar exercício a um treino
  const addExerciseToWorkout = (workoutId: string, exercise: Exercise) => {
    console.log(`Adicionando exercício ao treino ${workoutId} na data ${selectedDate}`);
    console.log('Exercício:', exercise);
    
    setWorkouts(prevWorkouts => {
      // Criar uma cópia rasa do estado atual
      const updatedWorkouts = { ...prevWorkouts };
      
      // Garantir que a data selecionada existe no objeto
      if (!updatedWorkouts[selectedDate]) {
        console.log(`Criando entrada para a data ${selectedDate}`);
        updatedWorkouts[selectedDate] = {};
      }
      
      // Garantir que o treino existe para a data selecionada
      if (!updatedWorkouts[selectedDate][workoutId]) {
        console.log(`Criando entrada para o treino ${workoutId} na data ${selectedDate}`);
        updatedWorkouts[selectedDate][workoutId] = [];
      }
      
      // Garantir que cada série tenha um ID único
      const exerciseWithValidSets = {
        ...exercise,
        sets: exercise.sets?.map(set => ({
          ...set,
          id: set.id || `set-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        })) || []
      };
      
      // Criar uma nova matriz de exercícios para forçar a atualização da UI
      updatedWorkouts[selectedDate][workoutId] = [
        ...updatedWorkouts[selectedDate][workoutId],
        exerciseWithValidSets
      ];
      
      console.log(`Exercício adicionado com sucesso ao treino ${workoutId} na data ${selectedDate}`);
      console.log('Total de exercícios:', updatedWorkouts[selectedDate][workoutId].length);
      
      return updatedWorkouts;
    });
    
    // Salvar os treinos imediatamente após adicionar o exercício
    saveWorkouts();
    
    // Feedback tátil
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  
  // Remover exercício de um treino
  const removeExerciseFromWorkout = async (workoutId: string, exerciseId: string) => {
    console.log(`Removendo exercício ${exerciseId} do treino ${workoutId} na data ${selectedDate}`);
    
    setWorkouts(prevWorkouts => {
      // Criar cópia profunda do estado atual
      const updatedWorkouts = JSON.parse(JSON.stringify(prevWorkouts));
      
      // Verificar se a data e o treino existem
      if (updatedWorkouts[selectedDate] && updatedWorkouts[selectedDate][workoutId]) {
        // Filtrar o exercício a ser removido
        const previousLength = updatedWorkouts[selectedDate][workoutId].length;
        updatedWorkouts[selectedDate][workoutId] = updatedWorkouts[selectedDate][workoutId].filter(
          (exercise: Exercise) => exercise.id !== exerciseId
        );
        const newLength = updatedWorkouts[selectedDate][workoutId].length;
        
        console.log(`Exercício removido com sucesso. Exercícios antes: ${previousLength}, depois: ${newLength}`);
      } else {
        console.log(`Treino ${workoutId} não encontrado na data ${selectedDate}`);
      }
      
      return updatedWorkouts;
    });
    
    // Salvar alterações imediatamente
    console.log('Salvando treinos após remover exercício...');
    await saveWorkouts();
    console.log('Treinos salvos com sucesso após remover exercício');
    
    // Feedback tátil
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  
  // Atualizar exercício em um treino
  const updateExerciseInWorkout = async (workoutId: string, updatedExercise: Exercise) => {
    console.log(`Atualizando exercício ${updatedExercise.id} no treino ${workoutId} na data ${selectedDate}`);
    
    setWorkouts(prevWorkouts => {
      // Criar cópia profunda do estado atual
      const updatedWorkouts = JSON.parse(JSON.stringify(prevWorkouts));
      
      // Verificar se a data e o treino existem
      if (updatedWorkouts[selectedDate] && updatedWorkouts[selectedDate][workoutId]) {
        // Encontrar e atualizar o exercício
        updatedWorkouts[selectedDate][workoutId] = updatedWorkouts[selectedDate][workoutId].map(
          (exercise: Exercise) => exercise.id === updatedExercise.id ? updatedExercise : exercise
        );
        
        console.log(`Exercício atualizado com sucesso no treino ${workoutId} na data ${selectedDate}`);
      } else {
        console.log(`Treino ${workoutId} não encontrado na data ${selectedDate}`);
      }
      
      return updatedWorkouts;
    });
    
    // Salvar alterações imediatamente
    console.log('Salvando treinos após atualizar exercício...');
    await saveWorkouts();
    console.log('Treinos salvos com sucesso após atualizar exercício');
    
    // Feedback tátil
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  
  // Salvar treinos no AsyncStorage
  const saveWorkouts = async () => {
    try {
      if (Object.keys(workouts).length === 0) return;
      await AsyncStorage.setItem(`@pumpgym:workouts:${userId}`, JSON.stringify(workouts));
    } catch (error) {
      console.error('Erro ao salvar treinos:', error);
    }
  };
  
  // Obter totais de um treino específico
  const getWorkoutTotals = (workoutId: string): WorkoutTotals => {
    console.log(`Calculando totais para o treino ${workoutId} na data ${selectedDate}`);
    
    // Inicializar com valores padrão
    const totals: WorkoutTotals = {
      totalExercises: 0,
      totalSets: 0,
      totalVolume: 0,
      totalDuration: 0,
      avgWeight: 0,
      maxWeight: 0,
      avgReps: 0,
      totalReps: 0
    };
    
    // Verificar se existe algum treino para a data selecionada
    if (!workouts[selectedDate] || !workouts[selectedDate][workoutId]) {
      console.log(`Nenhum treino encontrado para ${workoutId} na data ${selectedDate}`);
      return totals;
    }
    
    const exercises = workouts[selectedDate][workoutId];
    
    // Calcular os totais
    totals.totalExercises = exercises.length;
    
    // Variáveis para calcular médias
    let totalWeightSum = 0;
    let totalWeightCount = 0;
    let totalRepsSum = 0;
    let totalRepsCount = 0;
    let maxWeightFound = 0;
    
    exercises.forEach(exercise => {
      // Calcular duração para exercícios de cardio
      if (exercise.category === 'cardio' && exercise.cardioDuration) {
        totals.totalDuration += exercise.cardioDuration;
      }
      
      // Calcular séries e volume para exercícios de força
      if (exercise.sets && exercise.category !== 'cardio') {
        totals.totalSets += exercise.sets.length;
        
        // Calcular o volume total (peso * reps * sets) e outras estatísticas
        exercise.sets.forEach(set => {
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
    totals.avgWeight = totalWeightCount > 0 ? Math.round(totalWeightSum / totalWeightCount) : 0;
    totals.avgReps = totalRepsCount > 0 ? Math.round(totalRepsSum / totalRepsCount) : 0;
    totals.maxWeight = maxWeightFound;
    
    console.log(`Totais calculados para o treino ${workoutId} na data ${selectedDate}:`, totals);
    return totals;
  };
  
  // Obter exercícios para um treino específico
  const getExercisesForWorkout = (workoutId: string): Exercise[] => {
    console.log(`Obtendo exercícios para o treino ${workoutId} na data ${selectedDate}`);
    
    // Verificar se existe uma entrada para a data selecionada
    if (!workouts[selectedDate]) {
      console.log(`Nenhum treino encontrado para a data ${selectedDate}`);
      return [];
    }
    
    // Verificar se existe uma entrada para o treino na data selecionada
    if (!workouts[selectedDate][workoutId]) {
      console.log(`Nenhum exercício encontrado para o treino ${workoutId} na data ${selectedDate}`);
      return [];
    }
    
    // Retornar os exercícios do treino para a data selecionada
    const exercises = workouts[selectedDate][workoutId] || [];
    console.log(`Encontrados ${exercises.length} exercícios para o treino ${workoutId} na data ${selectedDate}`);
    return exercises;
  };
  
  // Obter totais do dia
  const getDayTotals = (): WorkoutTotals => {
    console.log(`Calculando totais para o dia ${selectedDate}`);
    
    // Inicializar com valores padrão
    const totals: WorkoutTotals = {
      totalExercises: 0,
      totalSets: 0,
      totalVolume: 0,
      totalDuration: 0,
      avgWeight: 0,
      maxWeight: 0,
      avgReps: 0,
      totalReps: 0
    };
    
    // Verificar se existe algum treino para a data selecionada
    if (!workouts[selectedDate]) {
      console.log(`Nenhum treino encontrado para o dia ${selectedDate}`);
      return totals;
    }
    
    const workoutIds = Object.keys(workouts[selectedDate]);
    console.log(`Encontrados ${workoutIds.length} treinos para o dia ${selectedDate}`);
    
    // Calcular os totais para cada treino na data selecionada
    workoutIds.forEach(workoutId => {
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
    
    console.log(`Totais calculados para o dia ${selectedDate}:`, totals);
    return totals;
  };
  
  // Obter tipo de treino por ID
  const getWorkoutTypeById = (id: string): WorkoutType | undefined => {
    console.log(`Buscando tipo de treino com ID: ${id}`);
    
    if (!workoutTypes || workoutTypes.length === 0) {
      console.log('Nenhum tipo de treino configurado');
      return undefined;
    }
    
    const workoutType = workoutTypes.find(workoutType => workoutType.id === id);
    
    if (workoutType) {
      console.log(`Tipo de treino encontrado: ${workoutType.name} (${workoutType.id})`);
    } else {
      console.log(`Tipo de treino não encontrado para o ID: ${id}`);
    }
    
    return workoutType;
  };
  
  // Atualizar metas de treino
  const updateTrainingGoals = async (goals: TrainingGoals) => {
    try {
      setTrainingGoals(goals);
      await AsyncStorage.setItem(`@pumpgym:trainingGoals:${userId}`, JSON.stringify(goals));
    } catch (error) {
      console.error('Erro ao salvar metas de treino:', error);
    }
  };
  
  // Obter totais do treino anterior do mesmo tipo
  const getPreviousWorkoutTotals = (workoutId: string): { totals: WorkoutTotals | null, date: string | null } => {
    console.log(`Buscando treino anterior para ${workoutId} antes de ${selectedDate}`);
    
    // Ordenar todas as datas em ordem decrescente
    const dates = Object.keys(workouts)
      .filter(date => date < selectedDate) // Apenas datas anteriores à selecionada
      .sort((a, b) => b.localeCompare(a)); // Ordenar em ordem decrescente (mais recente primeiro)
    
    // Procurar o treino mais recente do mesmo tipo
    for (const date of dates) {
      if (workouts[date] && workouts[date][workoutId]) {
        console.log(`Treino anterior encontrado em ${date}`);
        
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
          totalReps: 0
        };
        
        // Variáveis para calcular médias
        let totalWeightSum = 0;
        let totalWeightCount = 0;
        let totalRepsSum = 0;
        let totalRepsCount = 0;
        let maxWeightFound = 0;
        
        // Calcular os totais
        previousExercises.forEach(exercise => {
          // Calcular duração para exercícios de cardio
          if (exercise.category === 'cardio' && exercise.cardioDuration) {
            totals.totalDuration += exercise.cardioDuration;
          }
          
          // Calcular séries e volume para exercícios de força
          if (exercise.sets && exercise.category !== 'cardio') {
            totals.totalSets += exercise.sets.length;
            
            // Calcular o volume total (peso * reps * sets) e outras estatísticas
            exercise.sets.forEach(set => {
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
        totals.avgWeight = totalWeightCount > 0 ? Math.round(totalWeightSum / totalWeightCount) : 0;
        totals.avgReps = totalRepsCount > 0 ? Math.round(totalRepsSum / totalRepsCount) : 0;
        totals.maxWeight = maxWeightFound;
        
        return { totals, date };
      }
    }
    
    // Se não encontrar nenhum treino anterior
    console.log(`Nenhum treino anterior encontrado para ${workoutId}`);
    return { totals: null, date: null };
  };
  
  // Remover um treino inteiro
  const removeWorkout = async (workoutId: string) => {
    try {
      console.log(`Removendo treino ${workoutId} da data ${selectedDate}`);
      
      // Verificar se o treino existe
      if (!workouts[selectedDate] || !workouts[selectedDate][workoutId]) {
        console.log(`Treino ${workoutId} não encontrado na data ${selectedDate}`);
        return;
      }
      
      // Atualizar o estado removendo o treino
      setWorkouts(prevWorkouts => {
        const updatedWorkouts = { ...prevWorkouts };
        
        // Se existir a data e o treino, remover o treino
        if (updatedWorkouts[selectedDate]) {
          const { [workoutId]: removedWorkout, ...remainingWorkouts } = updatedWorkouts[selectedDate];
          updatedWorkouts[selectedDate] = remainingWorkouts;
        }
        
        return updatedWorkouts;
      });
      
      // Feedback tátil
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Salvar alterações imediatamente
      await saveWorkouts();
      console.log(`Treino ${workoutId} removido com sucesso`);
      
    } catch (error) {
      console.error('Erro ao remover treino:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  // Efeito para carregar dados quando o usuário mudar
  useEffect(() => {
    if (user) {
      loadWorkouts();
      loadWorkoutTypes();
      loadTrainingGoals();
    }
  }, [user]);
  
  // Efeito para salvar treinos quando houver alterações
  useEffect(() => {
    if (Object.keys(workouts).length > 0) {
      saveWorkouts();
    }
  }, [workouts]);
  
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
  };
  
  return (
    <WorkoutContext.Provider value={contextValue}>
      {children}
    </WorkoutContext.Provider>
  );
}

// Hook para usar o contexto de treinos
export function useWorkouts() {
  const context = useContext(WorkoutContext);
  
  if (context === undefined) {
    throw new Error('useWorkouts deve ser usado dentro de um WorkoutProvider');
  }
  
  return context;
}

// Hook para usar o contexto de treinos (alias)
export function useWorkoutContext() {
  return useWorkouts();
} 