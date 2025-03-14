import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import Calendar from "../../components/shared/Calendar";
import { getLocalDate } from "../../utils/dateUtils";
import { format } from "date-fns";
import EmptyWorkoutState from "../../components/training/EmptyWorkoutState";
import * as Haptics from "expo-haptics";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import WorkoutConfigSheet, {
  WorkoutType,
} from "../../components/training/WorkoutConfigSheet";
import { useWorkoutContext, Exercise } from "../../context/WorkoutContext";
import WorkoutCard from "../../components/training/WorkoutCard";
import TrainingStatsCard from "../../components/training/TrainingStatsCard";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { useRefresh } from "../../context/RefreshContext";
import { Ionicons } from "@expo/vector-icons";
import ConfirmationModal from "../../components/ui/ConfirmationModal";

// Componente memoizado para o card de treino
const MemoizedWorkoutGroup = React.memo(
  ({
    workoutId,
    workoutType,
    exercises,
    workoutTotals,
    index,
    previousWorkoutData,
    previousExercises,
    onNavigate,
    onDeleteExercise,
    refreshKey,
  }: {
    workoutId: string;
    workoutType: WorkoutType;
    exercises: Exercise[];
    workoutTotals: any;
    index: number;
    previousWorkoutData: any;
    previousExercises: Exercise[];
    onNavigate: (id: string) => void;
    onDeleteExercise: (workoutId: string, exerciseId: string) => Promise<void>;
    refreshKey?: number;
  }) => {
    return (
      <View key={`workout-group-${workoutId}-${index}`}>
        {/* Card de estatísticas para este treino específico */}
        <TrainingStatsCard
          workoutTotals={workoutTotals}
          previousWorkoutTotals={previousWorkoutData}
          workoutName={workoutType.name}
          workoutColor={workoutType.color}
          currentExercises={exercises}
          previousExercises={previousExercises}
          refreshKey={refreshKey}
        />

        {/* Card do treino */}
        <WorkoutCard
          workout={{
            id: workoutId,
            name: workoutType.name,
            icon: workoutType.iconType
              ? workoutType.iconType.type === "material"
                ? "material-" + workoutType.iconType.name.toString()
                : workoutType.iconType.type === "fontawesome"
                ? "fa5-" + workoutType.iconType.name.toString()
                : workoutType.iconType.name.toString()
              : "barbell-outline",
            color: workoutType.color,
          }}
          exercises={exercises}
          workoutTotals={workoutTotals}
          index={index}
          onPress={() => onNavigate(workoutId)}
          onDeleteExercise={(exerciseId) =>
            onDeleteExercise(workoutId, exerciseId)
          }
          refreshKey={refreshKey}
        />
      </View>
    );
  }
);

export default function TrainingScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const params = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);
  const { refreshKey, triggerRefresh, isRefreshing } = useRefresh();
  // Estado para forçar a recriação do WorkoutConfigSheet
  const [workoutConfigKey, setWorkoutConfigKey] = useState(Date.now());
  // Estado para controlar a visibilidade do modal de confirmação
  const [resetModalVisible, setResetModalVisible] = useState(false);

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
    getPreviousWorkoutTotals,
    getDayTotals,
    trainingGoals,
    // Novas propriedades do template semanal
    weeklyTemplate,
    hasWeeklyTemplateConfigured,
    getWorkoutsForDate,
    resetWorkoutTypes,
  } = useWorkoutContext();

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
    const workoutsForSelectedDate = getWorkoutsForDate(selectedDate);
    if (Object.keys(workoutsForSelectedDate).length > 0) {
      const workoutIdsForSelectedDate = Object.keys(workoutsForSelectedDate);
      const selectedWorkoutTypes = workoutTypes.filter((w) => w.selected);

      // Verificar se todos os tipos de treino selecionados têm um treino correspondente
      const missingWorkouts = selectedWorkoutTypes.filter(
        (w) => !workoutIdsForSelectedDate.includes(w.id)
      );

      // Verificar se todos os treinos têm um tipo de treino correspondente
      const unexpectedWorkouts = workoutIdsForSelectedDate.filter(
        (id) => !selectedWorkoutTypes.some((w) => w.id === id)
      );
    }
  }, [workoutTypes, workouts, selectedDate]);

  // Efeito para abrir o WorkoutConfigSheet quando solicitado via parâmetro
  useEffect(() => {
    if (params?.openWorkoutConfig === "true") {
      // Aumentar o tempo de espera para garantir que o componente esteja completamente montado
      const timer = setTimeout(() => {
        if (workoutConfigSheetRef.current) {
          workoutConfigSheetRef.current.present();
          // Feedback tátil para indicar que o sheet foi aberto
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          // Limpar o parâmetro após abrir
          router.replace("/training");
        } else {
          setTimeout(() => {
            if (workoutConfigSheetRef.current) {
              workoutConfigSheetRef.current.present();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.replace("/training");
            } else {
            }
          }, 1000);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [params, router]);

  // Função para lidar com a seleção de data
  const handleDateSelect = useCallback(
    (date: Date) => {
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
    },
    [selectedDate, saveWorkouts, setContextSelectedDate]
  );

  // Função para abrir o bottom sheet de configuração de treinos
  const openWorkoutConfigSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    workoutConfigSheetRef.current?.present();
  }, []);

  // Função para lidar com a configuração de treinos
  const handleWorkoutConfigured = useCallback(
    (configuredWorkouts: WorkoutType[]) => {
      // Aqui precisamos apenas atualizar os tipos de treino disponíveis
      // sem vinculá-los ao dia atual. Isso já é feito pelo template semanal.

      // Desmarcar a seleção de todos os workoutTypes para que não sejam
      // adicionados automaticamente ao dia atual
      const typesWithoutSelection = configuredWorkouts.map((workout) => ({
        ...workout,
        selected: false,
      }));

      updateWorkoutTypes(typesWithoutSelection);
    },
    [updateWorkoutTypes]
  );

  // Função para navegar para a tela de detalhes do treino
  const navigateToWorkoutDetails = useCallback(
    (workoutId: string) => {
      const workoutType = getWorkoutTypeById(workoutId);
      if (!workoutType) return;

      router.push({
        pathname: "/(workout-details)/workout-details",
        params: {
          workoutId,
          workoutName: workoutType.name,
          workoutColor: workoutType.color,
        },
      });
    },
    [getWorkoutTypeById, router]
  );

  // Função para excluir um exercício de um treino
  const handleDeleteExercise = useCallback(
    async (workoutId: string, exerciseId: string) => {
      try {
        await removeExerciseFromWorkout(workoutId, exerciseId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error("Erro ao deletar exercício:", error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [removeExerciseFromWorkout]
  );

  // Obter os treinos para a data selecionada (específicos ou do template)
  const workoutsForSelectedDate = useMemo(
    () => (getWorkoutsForDate ? getWorkoutsForDate(selectedDate) : {}),
    [getWorkoutsForDate, selectedDate]
  );

  // Verificar se há treinos configurados para a data selecionada
  const hasWorkoutsForSelectedDate = useMemo(
    () =>
      workoutsForSelectedDate &&
      Object.keys(workoutsForSelectedDate).length > 0,
    [workoutsForSelectedDate]
  );

  // Função para lidar com o pull to refresh
  const handleRefresh = async () => {
    if (isRefreshing) return; // Evitar múltiplos refreshes simultâneos

    setRefreshing(true);
    // Usar o triggerRefresh do contexto para atualizar todos os componentes
    triggerRefresh();
    // Simular carregamento de dados
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Função para redefinir os tipos de treino
  const handleResetWorkoutTypes = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    // Mostrar o modal de confirmação
    setResetModalVisible(true);
  }, []);

  // Função para confirmar a redefinição dos tipos de treino
  const confirmResetWorkoutTypes = useCallback(async () => {
    try {
      // Redefinir os tipos de treino
      await resetWorkoutTypes();
      // Forçar a recriação do WorkoutConfigSheet
      setWorkoutConfigKey(Date.now());
      // Fechar o modal
      setResetModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Erro ao redefinir treinos:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Fechar o modal mesmo em caso de erro
      setResetModalVisible(false);
    }
  }, [resetWorkoutTypes]);

  // Obter os tipos de treino configurados
  const configuredWorkoutTypes = useMemo(() => {
    return workoutTypes.map((type) => ({
      ...type,
      exercises: [],
    }));
  }, [workoutTypes]);

  // Verificar se é um dia de descanso
  const isRestDay = useMemo(() => {
    if (!hasWorkoutTypesConfigured || !hasWeeklyTemplateConfigured)
      return false;

    // Pegar o dia da semana da data selecionada (0-6, onde 0 é domingo)
    const selectedDayOfWeek = new Date(selectedDate).getDay();

    // Verificar se há treinos configurados para este dia no template
    const workoutsForDay = weeklyTemplate[selectedDayOfWeek];

    // Se não houver workoutsForDay OU se for um objeto vazio, é dia de descanso
    const hasNoWorkouts =
      !workoutsForDay || Object.keys(workoutsForDay).length === 0;

    return (
      hasWorkoutTypesConfigured && hasWeeklyTemplateConfigured && hasNoWorkouts
    );
  }, [
    hasWorkoutTypesConfigured,
    hasWeeklyTemplateConfigured,
    weeklyTemplate,
    selectedDate,
  ]);

  // Renderizar os cards de treino
  const renderWorkoutCards = useCallback(() => {
    if (
      !workoutsForSelectedDate ||
      Object.keys(workoutsForSelectedDate).length === 0
    )
      return null;

    const workoutIds = Object.keys(workoutsForSelectedDate);

    return workoutIds.map((workoutId, index) => {
      const workoutType = getWorkoutTypeById(workoutId);
      if (!workoutType) return null;

      const exercises = getExercisesForWorkout(workoutId);
      const workoutTotals = getWorkoutTotals(workoutId);

      // Buscar dados do treino anterior
      const previousWorkoutData = getPreviousWorkoutTotals(workoutId);

      // Buscar exercícios do treino anterior
      let previousExercises: Exercise[] = [];
      if (previousWorkoutData.date && previousWorkoutData.totals) {
        const previousWorkouts = getWorkoutsForDate(previousWorkoutData.date);
        previousExercises = previousWorkouts[workoutId] || [];
      }

      return (
        <MemoizedWorkoutGroup
          key={`workout-group-${workoutId}-${index}`}
          workoutId={workoutId}
          workoutType={workoutType}
          exercises={exercises}
          workoutTotals={workoutTotals}
          index={index}
          previousWorkoutData={previousWorkoutData}
          previousExercises={previousExercises}
          onNavigate={navigateToWorkoutDetails}
          onDeleteExercise={(workoutId, exerciseId) =>
            handleDeleteExercise(workoutId, exerciseId)
          }
          refreshKey={refreshKey}
        />
      );
    });
  }, [
    workoutsForSelectedDate,
    getWorkoutTypeById,
    getExercisesForWorkout,
    getWorkoutTotals,
    getPreviousWorkoutTotals,
    getWorkoutsForDate,
    navigateToWorkoutDetails,
    handleDeleteExercise,
    refreshKey,
  ]);

  // Memoizar o componente EmptyWorkoutState para evitar re-renderizações desnecessárias
  const emptyStateComponent = useMemo(
    () => (
      <EmptyWorkoutState
        onWorkoutConfigured={handleWorkoutConfigured}
        onOpenWorkoutConfig={openWorkoutConfigSheet}
        isRestDay={isRestDay}
      />
    ),
    [handleWorkoutConfigured, openWorkoutConfigSheet, isRestDay]
  );

  // Memoizar o componente Calendar para evitar re-renderizações desnecessárias
  const calendarComponent = useMemo(
    () => (
      <Calendar
        selectedDate={getLocalDate(selectedDate)}
        onSelectDate={handleDateSelect}
        workouts={workouts}
        weeklyTemplate={weeklyTemplate}
        getWorkoutsForDate={getWorkoutsForDate}
        hasContent={(date) => {
          try {
            // Verificar treinos para a data usando o template semanal
            const dateString = format(date, "yyyy-MM-dd");
            const workoutsForDate = getWorkoutsForDate(dateString);
            const hasWorkouts = Object.keys(workoutsForDate).length > 0;

            if (hasWorkouts) {
              return true;
            }

            return false;
          } catch (error) {
            console.error("Erro ao verificar treinos para a data:", error);
            return false;
          }
        }}
      />
    ),
    [
      selectedDate,
      handleDateSelect,
      workouts,
      weeklyTemplate,
      getWorkoutsForDate,
    ]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {calendarComponent}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true} // Melhora a performance para listas longas
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {hasWorkoutTypesConfigured && hasWeeklyTemplateConfigured
            ? hasWorkoutsForSelectedDate
              ? renderWorkoutCards()
              : emptyStateComponent
            : emptyStateComponent}

          {/* Botões de redefinir e editar treinos (apenas mostrar se houver treinos configurados) */}
          {hasWorkoutTypesConfigured && (
            <>
              {/* Botão para redefinir treinos */}
              <TouchableOpacity
                key={`reset-button-${theme}`}
                style={[styles.resetButton, { borderColor: colors.border }]}
                onPress={handleResetWorkoutTypes}
              >
                <Ionicons
                  name="refresh-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.resetButtonText, { color: colors.text }]}>
                  Redefinir Treinos
                </Text>
              </TouchableOpacity>

              {/* Botão para editar treinos */}
              <TouchableOpacity
                key={`edit-button-${theme}`}
                style={[styles.editButton, { backgroundColor: colors.primary }]}
                onPress={openWorkoutConfigSheet}
              >
                <Ionicons name="settings-outline" size={20} color="white" />
                <Text style={styles.editButtonText}>Editar Treinos</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>

      <WorkoutConfigSheet
        ref={workoutConfigSheetRef}
        onWorkoutConfigured={handleWorkoutConfigured}
        selectedDate={getLocalDate(selectedDate)}
        key={`workout-config-${workoutConfigKey}-${theme}`}
      />

      {/* Modal de confirmação para redefinir treinos */}
      <ConfirmationModal
        visible={resetModalVisible}
        title="Redefinir Treinos"
        message="Tem certeza que deseja redefinir todos os tipos de treino? Esta ação não pode ser desfeita."
        confirmText="Redefinir"
        cancelText="Cancelar"
        confirmType="danger"
        icon="refresh-outline"
        onConfirm={confirmResetWorkoutTypes}
        onCancel={() => setResetModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 100,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 20,
    marginBottom: 12,
  },
  resetButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
});
