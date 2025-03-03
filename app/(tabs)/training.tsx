import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import React, { useState, useRef, useCallback, useEffect } from "react";
import Calendar from "../../components/training/Calendar";
import { getLocalDate } from "../../utils/dateUtils";
import { format } from "date-fns";
import EmptyWorkoutState from "../../components/training/EmptyWorkoutState";
import * as Haptics from "expo-haptics";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import WorkoutConfigSheet, { WorkoutType } from "../../components/training/WorkoutConfigSheet";
import { useWorkouts, Exercise } from "../../context/WorkoutContext";
import WorkoutCard from "../../components/training/WorkoutCard";
import { useRouter } from "expo-router";

export default function TrainingScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  
  // Usar o contexto de treinos
  const {
    workouts,
    workoutTypes,
    selectedDate: contextSelectedDate,
    setSelectedDate: setContextSelectedDate,
    updateWorkoutTypes,
    hasWorkoutTypesConfigured,
    getWorkoutTotals,
    getExercisesForWorkout,
    removeExerciseFromWorkout,
    getWorkoutTypeById,
    saveWorkouts,
    setWorkouts,
  } = useWorkouts();
  
  // Estado para a data selecionada (sincronizado com o contexto)
  const [selectedDate, setSelectedDate] = useState<string>(contextSelectedDate);
  
  // Referência para o bottom sheet de configuração de treinos
  const workoutConfigSheetRef = useRef<BottomSheetModal>(null);
  
  // Sincronizar a data selecionada com o contexto
  useEffect(() => {
    if (selectedDate !== contextSelectedDate) {
      setContextSelectedDate(selectedDate);
    }
  }, [selectedDate, setContextSelectedDate, contextSelectedDate]);
  
  // Sincronizar o estado local com o contexto
  useEffect(() => {
    if (contextSelectedDate !== selectedDate) {
      setSelectedDate(contextSelectedDate);
    }
  }, [contextSelectedDate, selectedDate]);
  
  // Efeito para salvar treinos quando o usuário sair da tela
  useEffect(() => {
    return () => {
      saveWorkouts();
    };
  }, [saveWorkouts]);
  
  // Efeito para verificar se os treinos estão sendo renderizados corretamente após a atualização dos tipos de treino
  useEffect(() => {
    if (workouts && workouts[selectedDate]) {
      const workoutIdsForSelectedDate = Object.keys(workouts[selectedDate]);
      const selectedWorkoutTypes = workoutTypes.filter(w => w.selected);
      
      // Verificar se todos os tipos de treino selecionados têm um treino correspondente
      const missingWorkouts = selectedWorkoutTypes.filter(
        w => !workoutIdsForSelectedDate.includes(w.id)
      );
      
      // Verificar se todos os treinos têm um tipo de treino correspondente
      const unexpectedWorkouts = workoutIdsForSelectedDate.filter(
        id => !selectedWorkoutTypes.some(w => w.id === id)
      );
    }
  }, [workoutTypes, workouts, selectedDate]);
  
  // Função para lidar com a seleção de data
  const handleDateSelect = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    
    // Verificar se a data selecionada é diferente da atual
    if (formattedDate === selectedDate) {
      return;
    }
    
    // Salvar os treinos da data atual antes de mudar
    saveWorkouts();
    
    // Atualizar a data selecionada no estado local
    setSelectedDate(formattedDate);
    
    // Atualizar a data selecionada no contexto
    setContextSelectedDate(formattedDate);
  };
  
  // Função para abrir o bottom sheet de configuração de treinos
  const openWorkoutConfigSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Verificar se a referência existe antes de chamar o método present
    if (workoutConfigSheetRef.current) {
      workoutConfigSheetRef.current.present();
    } else {
      console.error('Referência do bottom sheet é null em TrainingScreen');
    }
  }, []);
  
  // Função para lidar com a configuração de treinos
  const handleWorkoutConfigured = useCallback((configuredWorkouts: WorkoutType[]) => {
    // Separar os treinos selecionados dos não selecionados
    const selectedWorkouts = configuredWorkouts.filter(w => w.selected);
    
    // Atualizar os tipos de treinos no contexto
    updateWorkoutTypes(configuredWorkouts);
    
    // Forçar uma atualização imediata da UI
    setTimeout(() => {
      // Forçar uma atualização do estado para garantir que a UI seja atualizada
      setSelectedDate(prevDate => {
        // Primeiro, verificar se os treinos foram configurados corretamente
        if (workouts && selectedDate in workouts) {
          const workoutIdsForSelectedDate = Object.keys(workouts[selectedDate]);
          console.log(`Treinos configurados: ${workoutIdsForSelectedDate.length}`);
        } else {
          // Se não houver treinos configurados, criar manualmente
          setWorkouts((prev: { [date: string]: { [workoutId: string]: Exercise[] } }) => {
            const updated = { ...prev };
            if (!updated[selectedDate]) {
              updated[selectedDate] = {};
            }
            
            // Adicionar entradas vazias para os treinos selecionados
            selectedWorkouts.forEach(workout => {
              if (!updated[selectedDate][workout.id]) {
                updated[selectedDate][workout.id] = [];
              }
            });
            
            return updated;
          });
        }
        
        return prevDate;
      });
    }, 300);
  }, [updateWorkoutTypes, selectedDate, workouts, setSelectedDate, setWorkouts]);
  
  // Função para navegar para a tela de adicionar exercício
  const navigateToAddExercise = useCallback((workoutId: string) => {
    const workoutType = getWorkoutTypeById(workoutId);
    
    if (!workoutType) {
      console.error(`Tipo de treino não encontrado para o ID: ${workoutId}`);
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    router.push({
      pathname: '/add-exercise',
      params: {
        workoutId: workoutId,
        workoutName: workoutType.name,
        workoutColor: workoutType.color,
      }
    });
  }, [getWorkoutTypeById, router]);
  
  // Função para remover um exercício
  const handleDeleteExercise = useCallback(
    async (workoutId: string, exerciseId: string) => {
      await removeExerciseFromWorkout(workoutId, exerciseId);
    },
    [removeExerciseFromWorkout]
  );
  
  // Renderizar os cards de treino
  const renderWorkoutCards = () => {
    // Verificar se existem treinos para a data selecionada
    const workoutsForSelectedDate = workouts[selectedDate] || {};
    const workoutIdsForSelectedDate = Object.keys(workoutsForSelectedDate);
    
    // Verificar se há tipos de treino selecionados para a data atual
    const selectedWorkoutTypes = workoutTypes.filter(w => w.selected);
    
    // Se não houver treinos configurados para a data selecionada, mostrar o botão de configurar
    if (workoutIdsForSelectedDate.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Nenhum treino configurado para {format(getLocalDate(selectedDate), "dd 'de' MMMM")}.
          </Text>
          <TouchableOpacity
            style={[styles.configButton, { backgroundColor: colors.primary }]}
            onPress={openWorkoutConfigSheet}
          >
            <Text style={styles.configButtonText}>Configurar Treinos</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Determinar quais tipos de treino devem ser renderizados
    let workoutTypesToRender: WorkoutType[] = [];
    
    // Usar apenas os treinos configurados para a data selecionada
    workoutTypesToRender = workoutIdsForSelectedDate
      .map(id => {
        const workoutType = getWorkoutTypeById(id);
        // Verificar se o tipo de treino ainda existe
        if (!workoutType) {
          console.warn(`Tipo de treino não encontrado para o ID: ${id}`);
          return undefined;
        }
        return workoutType;
      })
      .filter((workoutType): workoutType is WorkoutType => workoutType !== undefined);
    
    // Se não houver tipos de treino para renderizar, mostrar o botão de configurar
    if (workoutTypesToRender.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Nenhum treino válido para {format(getLocalDate(selectedDate), "dd 'de' MMMM")}.
          </Text>
          <TouchableOpacity
            style={[styles.configButton, { backgroundColor: colors.primary }]}
            onPress={openWorkoutConfigSheet}
          >
            <Text style={styles.configButtonText}>Configurar Treinos</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Renderizar os cards de treino
    return (
      <>
        {workoutTypesToRender.map((workoutType, index) => {
          // Obter exercícios e totais especificamente para a data selecionada
          const exercises = workoutsForSelectedDate[workoutType.id] || [];
          const workoutTotals = getWorkoutTotals(workoutType.id);
          
          return (
            <WorkoutCard
              key={`workout-${workoutType.id}-${selectedDate}`}
              workout={workoutType}
              exercises={exercises}
              workoutTotals={workoutTotals}
              index={index}
              onPress={() => navigateToAddExercise(workoutType.id)}
              onDeleteExercise={(exerciseId: string) =>
                handleDeleteExercise(workoutType.id, exerciseId)
              }
            />
          );
        })}
      </>
    );
  };
  
  // Se não houver treinos configurados, mostrar o estado vazio
  if (!hasWorkoutTypesConfigured) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.calendarContainer}>
          <Calendar
            selectedDate={getLocalDate(selectedDate)}
            onSelectDate={handleDateSelect}
          />
        </View>
        
        <EmptyWorkoutState 
          onWorkoutConfigured={handleWorkoutConfigured} 
          onOpenWorkoutConfig={openWorkoutConfigSheet}
        />
        
        <WorkoutConfigSheet
          ref={workoutConfigSheetRef}
          onWorkoutConfigured={handleWorkoutConfigured}
          selectedDate={getLocalDate(selectedDate)}
        />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.calendarContainer}>
        <Calendar
          selectedDate={getLocalDate(selectedDate)}
          onSelectDate={handleDateSelect}
        />
      </View>
      
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Meus Treinos</Text>
          <Text style={[styles.date, { color: colors.text + "80" }]}>
            {format(getLocalDate(selectedDate), "dd 'de' MMMM, yyyy")}
          </Text>
        </View>
        
        {renderWorkoutCards()}
      </ScrollView>
      
      <WorkoutConfigSheet
        ref={workoutConfigSheetRef}
        onWorkoutConfigured={handleWorkoutConfigured}
        selectedDate={getLocalDate(selectedDate)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarContainer: {
    zIndex: 10,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  configButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  configButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});


