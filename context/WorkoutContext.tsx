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
  completed?: boolean;
}

// Interface para exercício
export interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[]; // Agora é um array de séries individuais
  notes?: string;
  completed?: boolean;
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
  completedExercises: number;
  completedSets: number;
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
  toggleExerciseCompletion: (workoutId: string, exerciseId: string) => Promise<void>;
  toggleSetCompletion: (workoutId: string, exerciseId: string, setId: string) => Promise<void>;
  saveWorkouts: () => Promise<void>;
  addWorkoutType: (id: string, name: string, icon: string, color: string) => void;
  resetWorkoutTypes: () => Promise<void>;
  updateWorkoutTypes: (workoutTypes: WorkoutType[]) => Promise<void>;
  hasWorkoutTypesConfigured: boolean;
  getWorkoutTypeById: (id: string) => WorkoutType | undefined;
  setWorkouts: React.Dispatch<React.SetStateAction<{ [date: string]: { [workoutId: string]: Exercise[] } }>>;
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
      // Criar cópia profunda do estado atual
      const updatedWorkouts = JSON.parse(JSON.stringify(prevWorkouts));
      
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
        sets: exercise.sets.map(set => ({
          ...set,
          id: set.id || `set-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        }))
      };
      
      // Adicionar o exercício ao treino
      updatedWorkouts[selectedDate][workoutId].push(exerciseWithValidSets);
      
      console.log(`Exercício adicionado com sucesso ao treino ${workoutId} na data ${selectedDate}`);
      console.log('Total de exercícios:', updatedWorkouts[selectedDate][workoutId].length);
      
      return updatedWorkouts;
    });
    
    // Salvar os treinos imediatamente após adicionar o exercício
    setTimeout(async () => {
      console.log('Salvando treinos após adicionar exercício...');
      await saveWorkouts();
      console.log('Treinos salvos com sucesso após adicionar exercício');
    }, 100);
    
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
    
    // Salvar alterações
    setTimeout(async () => {
      console.log('Salvando treinos após remover exercício...');
      await saveWorkouts();
      console.log('Treinos salvos com sucesso após remover exercício');
    }, 100);
    
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
    
    // Salvar alterações
    setTimeout(async () => {
      console.log('Salvando treinos após atualizar exercício...');
      await saveWorkouts();
      console.log('Treinos salvos com sucesso após atualizar exercício');
    }, 100);
    
    // Feedback tátil
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  
  // Alternar conclusão de um exercício
  const toggleExerciseCompletion = async (workoutId: string, exerciseId: string) => {
    console.log(`Alternando conclusão do exercício ${exerciseId} no treino ${workoutId} na data ${selectedDate}`);
    
    setWorkouts(prevWorkouts => {
      // Criar cópia profunda do estado atual
      const updatedWorkouts = JSON.parse(JSON.stringify(prevWorkouts));
      
      // Verificar se a data e o treino existem
      if (updatedWorkouts[selectedDate] && updatedWorkouts[selectedDate][workoutId]) {
        // Encontrar e atualizar o status de conclusão do exercício
        updatedWorkouts[selectedDate][workoutId] = updatedWorkouts[selectedDate][workoutId].map(
          (exercise: Exercise) => {
            if (exercise.id === exerciseId) {
              const newCompletedState = !exercise.completed;
              console.log(`Alterando status de conclusão do exercício para: ${newCompletedState}`);
              
              // Atualizar o estado de conclusão de todas as séries para corresponder ao exercício
              const updatedSets = exercise.sets.map(set => ({
                ...set,
                completed: newCompletedState
              }));
              return { ...exercise, completed: newCompletedState, sets: updatedSets };
            }
            return exercise;
          }
        );
        
        console.log(`Status de conclusão do exercício alternado com sucesso`);
      } else {
        console.log(`Treino ${workoutId} não encontrado na data ${selectedDate}`);
      }
      
      return updatedWorkouts;
    });
    
    // Salvar alterações
    setTimeout(async () => {
      console.log('Salvando treinos após alternar conclusão do exercício...');
      await saveWorkouts();
      console.log('Treinos salvos com sucesso após alternar conclusão do exercício');
    }, 100);
    
    // Feedback tátil
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  // Alternar conclusão de uma série específica
  const toggleSetCompletion = async (workoutId: string, exerciseId: string, setId: string) => {
    console.log(`Alternando conclusão da série ${setId} do exercício ${exerciseId} no treino ${workoutId} na data ${selectedDate}`);
    
    setWorkouts(prevWorkouts => {
      // Criar cópia profunda do estado atual
      const updatedWorkouts = JSON.parse(JSON.stringify(prevWorkouts));
      
      // Verificar se a data e o treino existem
      if (updatedWorkouts[selectedDate] && updatedWorkouts[selectedDate][workoutId]) {
        // Encontrar o exercício
        updatedWorkouts[selectedDate][workoutId] = updatedWorkouts[selectedDate][workoutId].map(
          (exercise: Exercise) => {
            if (exercise.id === exerciseId) {
              // Atualizar a série específica
              const updatedSets = exercise.sets.map(set => {
                if (set.id === setId) {
                  const newCompletedState = !set.completed;
                  console.log(`Alterando status de conclusão da série para: ${newCompletedState}`);
                  return { ...set, completed: newCompletedState };
                }
                return set;
              });
              
              // Verificar se todas as séries estão concluídas
              const allSetsCompleted = updatedSets.every(set => set.completed);
              
              console.log(`Todas as séries concluídas: ${allSetsCompleted}`);
              
              return { 
                ...exercise, 
                sets: updatedSets,
                completed: allSetsCompleted
              };
            }
            return exercise;
          }
        );
        
        console.log(`Status de conclusão da série alternado com sucesso`);
      } else {
        console.log(`Treino ${workoutId} não encontrado na data ${selectedDate}`);
      }
      
      return updatedWorkouts;
    });
    
    // Salvar alterações
    setTimeout(async () => {
      console.log('Salvando treinos após alternar conclusão da série...');
      await saveWorkouts();
      console.log('Treinos salvos com sucesso após alternar conclusão da série');
    }, 100);
    
    // Feedback tátil
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      completedExercises: 0,
      completedSets: 0,
    };
    
    // Verificar se existe algum treino para a data selecionada
    if (!workouts[selectedDate] || !workouts[selectedDate][workoutId]) {
      console.log(`Nenhum treino encontrado para ${workoutId} na data ${selectedDate}`);
      return totals;
    }
    
    const exercises = workouts[selectedDate][workoutId];
    
    // Calcular os totais
    totals.totalExercises = exercises.length;
    totals.completedExercises = exercises.filter(exercise => exercise.completed).length;
    
    exercises.forEach(exercise => {
      totals.totalSets += exercise.sets.length;
      totals.completedSets += exercise.sets.filter(set => set.completed).length;
    });
    
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
      completedExercises: 0,
      completedSets: 0,
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
      const exercises = workouts[selectedDate][workoutId];
      
      // Adicionar ao total de exercícios
      totals.totalExercises += exercises.length;
      totals.completedExercises += exercises.filter(ex => ex.completed).length;
      
      // Adicionar ao total de séries
      exercises.forEach(exercise => {
        totals.totalSets += exercise.sets.length;
        totals.completedSets += exercise.sets.filter(set => set.completed).length;
      });
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
  
  // Efeito para carregar dados quando o usuário mudar
  useEffect(() => {
    if (user) {
      loadWorkouts();
      loadWorkoutTypes();
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
    toggleExerciseCompletion,
    toggleSetCompletion,
    saveWorkouts,
    addWorkoutType,
    resetWorkoutTypes,
    updateWorkoutTypes,
    hasWorkoutTypesConfigured,
    getWorkoutTypeById,
    setWorkouts,
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