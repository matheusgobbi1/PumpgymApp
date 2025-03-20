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
import ContextMenu, { MenuAction } from "../../components/shared/ContextMenu";
import Toast from "../../components/common/Toast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HomeHeader from "../../components/home/HomeHeader";

// Definir interface para props do MemoizedWorkoutGroup
interface WorkoutGroupProps {
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
  notificationsEnabled: boolean;
}

// Função para comparar props do MemoizedWorkoutGroup
const arePropsEqual = (
  prevProps: WorkoutGroupProps,
  nextProps: WorkoutGroupProps
): boolean => {
  // Verificar se as props primitivas são iguais
  if (
    prevProps.workoutId !== nextProps.workoutId ||
    prevProps.index !== nextProps.index ||
    prevProps.refreshKey !== nextProps.refreshKey ||
    prevProps.notificationsEnabled !== nextProps.notificationsEnabled
  ) {
    return false;
  }

  // Verificar se o workoutType mudou
  if (
    prevProps.workoutType.name !== nextProps.workoutType.name ||
    prevProps.workoutType.color !== nextProps.workoutType.color
  ) {
    return false;
  }

  // Verificar se os totais mudaram
  if (
    prevProps.workoutTotals.totalExercises !==
      nextProps.workoutTotals.totalExercises ||
    prevProps.workoutTotals.totalSets !== nextProps.workoutTotals.totalSets ||
    prevProps.workoutTotals.totalVolume !== nextProps.workoutTotals.totalVolume
  ) {
    return false;
  }

  // Verificar se a lista de exercícios mudou em tamanho
  if (prevProps.exercises.length !== nextProps.exercises.length) {
    return false;
  }

  // Verificar se os exercícios mudaram superficialmente
  for (let i = 0; i < prevProps.exercises.length; i++) {
    if (
      prevProps.exercises[i].id !== nextProps.exercises[i].id ||
      prevProps.exercises[i].name !== nextProps.exercises[i].name
    ) {
      return false;
    }
  }

  // Se chegou até aqui, as props são consideradas iguais
  return true;
};

// Componente memoizado para o card de treino com comparador personalizado
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
    notificationsEnabled,
  }: WorkoutGroupProps) => {
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
          notificationsEnabled={notificationsEnabled}
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
          notificationsEnabled={notificationsEnabled}
        />
      </View>
    );
  },
  arePropsEqual
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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "info" | "error">(
    "success"
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Estado para contar dias de treino
  const [trainingDays, setTrainingDays] = useState(0);

  // Usar o contexto de treinos - desestruturar apenas o que é necessário para este componente
  // Usar os valores memoizados do contexto em vez de calcular novamente
  const {
    selectedDate: contextSelectedDate,
    setSelectedDate: setContextSelectedDate,
    updateWorkoutTypes,
    getWorkoutTotals,
    getExercisesForWorkout,
    removeExerciseFromWorkout,
    getWorkoutTypeById,
    saveWorkouts,
    getPreviousWorkoutTotals,
    startWorkoutForDate,
    resetWorkoutTypes,
    forceRefresh,
    // Usar valores memoizados do contexto
    workoutsForSelectedDate,
    hasConfiguredWorkouts,
    getWorkoutsForDate,
    workouts,
  } = useWorkoutContext();

  // Calcular o número de dias com treino registrado
  useEffect(() => {
    let workoutDaysCount = 0;

    // Contar dias únicos com treinos
    Object.keys(workouts).forEach((date) => {
      if (Object.keys(workouts[date]).length > 0) {
        // Verificar se há exercícios registrados nesse dia
        const hasExercisesForDay = Object.values(workouts[date]).some(
          (exercises) => exercises.length > 0
        );

        if (hasExercisesForDay) {
          workoutDaysCount++;
        }
      }
    });

    setTrainingDays(workoutDaysCount);
  }, [workouts, refreshKey]);

  // Navegar para o perfil
  const navigateToProfile = useCallback(() => {
    router.push("/profile");
  }, [router]);

  // Estado para a data selecionada (sincronizado com o contexto)
  const [selectedDate, setSelectedDate] = useState<string>(contextSelectedDate);

  // Referência para o bottom sheet de configuração de treinos
  const workoutConfigSheetRef = useRef<BottomSheetModal>(null);

  // Referência para armazenar contagens anteriores de exercícios
  const prevExercisesCountRef = useRef<{ [key: string]: number }>({});

  // Verificar se há treinos configurados para a data selecionada
  const hasWorkoutsForSelectedDate = useMemo(
    () => Object.keys(workoutsForSelectedDate).length > 0,
    [workoutsForSelectedDate]
  );

  // Carregar o estado de notificações do AsyncStorage no montagem
  useEffect(() => {
    const loadNotificationPreference = async () => {
      try {
        const preference = await AsyncStorage.getItem("notificationsEnabled");
        // Se o usuário já definiu uma preferência, use-a. Caso contrário, mantenha o padrão (true)
        if (preference !== null) {
          setNotificationsEnabled(preference === "true");
        }
      } catch (error) {
        console.error("Erro ao carregar preferência de notificações:", error);
      }
    };

    loadNotificationPreference();
  }, []);

  // Função para mostrar notificação
  const showNotification = useCallback(
    (message: string, type: "success" | "info" | "error" = "success") => {
      // Verificar se as notificações estão habilitadas, exceto para a notificação
      // que informa sobre a mudança de estado das notificações
      if (
        !notificationsEnabled &&
        !message.includes("Notificações de progresso")
      ) {
        return;
      }

      setToastMessage(message);
      setToastType(type);
      setShowToast(true);

      // Esconder a notificação após 5 segundos
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    },
    [notificationsEnabled]
  );

  // Função para alternar o estado de notificações
  const toggleNotifications = useCallback(async () => {
    try {
      const newState = !notificationsEnabled;
      setNotificationsEnabled(newState);
      await AsyncStorage.setItem("notificationsEnabled", newState.toString());

      // Mostrar uma notificação sobre a alteração
      showNotification(
        newState
          ? "Notificações de progresso ativadas"
          : "Notificações de progresso desativadas",
        "info"
      );

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("Erro ao salvar preferência de notificações:", error);
    }
  }, [notificationsEnabled, showNotification]);

  // Detectar quando o usuário completa um treino (adicionando exercícios)
  const checkForCompletedWorkout = useCallback(
    (prevExercises: Exercise[], currentExercises: Exercise[]) => {
      // Verificar se o usuário adicionou pelo menos 3 exercícios
      if (prevExercises.length === 0 && currentExercises.length >= 3) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    []
  );

  // Efeito para verificar mudanças nos treinos quando a data selecionada muda
  useEffect(() => {
    if (hasWorkoutsForSelectedDate) {
      const workoutIds = Object.keys(workoutsForSelectedDate);

      workoutIds.forEach((workoutId) => {
        const exercises = getExercisesForWorkout(workoutId);

        if (!prevExercisesCountRef.current[workoutId]) {
          // Primeiro carregamento, apenas armazenar o número atual
          prevExercisesCountRef.current[workoutId] = exercises.length;
        } else if (
          exercises.length > prevExercisesCountRef.current[workoutId]
        ) {
          // Usuário adicionou novos exercícios
          const prevExercises: Exercise[] = [];
          checkForCompletedWorkout(prevExercises, exercises);

          // Atualizar a contagem
          prevExercisesCountRef.current[workoutId] = exercises.length;
        }
      });
    }
  }, [
    workoutsForSelectedDate,
    hasWorkoutsForSelectedDate,
    getExercisesForWorkout,
    checkForCompletedWorkout,
  ]);

  // Sincronizar a data selecionada com o contexto
  const updateSelectedDate = useCallback(
    (date: string) => {
      setSelectedDate(date);
      setContextSelectedDate(date);
    },
    [setContextSelectedDate]
  );

  // Efeito para salvar treinos quando o usuário sair da tela
  useEffect(() => {
    return () => {
      saveWorkouts();
    };
  }, [saveWorkouts]);

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

      // Atualizar a data selecionada em uma única operação
      updateSelectedDate(formattedDate);
    },
    [selectedDate, saveWorkouts, updateSelectedDate]
  );

  // Função para abrir o bottom sheet de configuração de treinos
  const openWorkoutConfigSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    workoutConfigSheetRef.current?.present();
  }, []);

  // Efeito para abrir o WorkoutConfigSheet quando solicitado via parâmetro
  useEffect(() => {
    if (params?.openWorkoutConfig === "true") {
      const timer = setTimeout(() => {
        if (workoutConfigSheetRef.current) {
          workoutConfigSheetRef.current.present();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.replace("/training");
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [params, router]);

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
        triggerRefresh(); // Forçar atualização após mudança
      } catch (error) {
        console.error("Erro ao deletar exercício:", error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [removeExerciseFromWorkout, triggerRefresh]
  );

  // Função para iniciar um novo treino
  const handleStartWorkout = useCallback(
    async (workoutId: string) => {
      try {
        await startWorkoutForDate(workoutId);
        await saveWorkouts();
        triggerRefresh(); // Forçar atualização após iniciar treino
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error("Erro ao iniciar treino:", error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [startWorkoutForDate, saveWorkouts, triggerRefresh]
  );

  // Função para verificar se uma data tem conteúdo - memoizada
  const hasWorkoutContent = useCallback(
    (date: Date) => {
      try {
        const dateString = format(date, "yyyy-MM-dd");
        const workoutsForDate = getWorkoutsForDate(dateString);
        return Object.keys(workoutsForDate).length > 0;
      } catch (error) {
        console.error("Erro ao verificar treinos para a data:", error);
        return false;
      }
    },
    [getWorkoutsForDate]
  );

  // Função para lidar com a configuração de treinos
  const handleWorkoutConfigured = useCallback(
    async (configuredWorkouts: WorkoutType[]) => {
      try {
        // Filtrar apenas os tipos de treino que foram selecionados pelo usuário
        const selectedWorkoutTypes = configuredWorkouts.filter(
          (workout) => workout.selected
        );

        // Se não houver tipos selecionados, mostrar um alerta
        if (selectedWorkoutTypes.length === 0) {
          Alert.alert("Erro", "Selecione pelo menos um tipo de treino.");
          return;
        }

        // Atualizar o contexto com todos os tipos (selecionados e não selecionados)
        const success = await updateWorkoutTypes(configuredWorkouts);

        if (success) {
          // Forçar uma atualização da tela
          triggerRefresh();
        } else {
          Alert.alert("Erro", "Falha ao atualizar tipos de treino.");
        }
      } catch (error) {
        console.error("Erro ao configurar treinos:", error);
        Alert.alert("Erro", "Ocorreu um erro ao configurar os treinos.");
      }
    },
    [updateWorkoutTypes, triggerRefresh]
  );

  // Função para lidar com o pull to refresh
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return; // Evitar múltiplos refreshes simultâneos

    try {
      setRefreshing(true);
      triggerRefresh();
      await saveWorkouts();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setRefreshing(false);
    }
  }, [isRefreshing, triggerRefresh, saveWorkouts]);

  // Função para redefinir os tipos de treino
  const handleResetWorkoutTypes = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setResetModalVisible(true);
  }, []);

  // Função para confirmar a redefinição dos tipos de treino
  const confirmResetWorkoutTypes = useCallback(async () => {
    try {
      // Redefinir os tipos de treino
      const success = await resetWorkoutTypes();

      if (success) {
        // Forçar a recriação do WorkoutConfigSheet
        setWorkoutConfigKey(Date.now());

        // Forçar atualizações
        triggerRefresh();
        forceRefresh();
        await saveWorkouts();

        // Feedback de sucesso para o usuário
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // Se falhou, informar o usuário
        Alert.alert(
          "Erro",
          "Não foi possível redefinir os treinos. Tente novamente."
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      // Fechar o modal
      setResetModalVisible(false);
    } catch (error) {
      console.error("Erro ao redefinir treinos:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Fechar o modal mesmo em caso de erro
      setResetModalVisible(false);

      // Mostrar alerta de erro
      Alert.alert(
        "Erro",
        "Ocorreu um erro ao redefinir treinos. Tente reiniciar o aplicativo."
      );
    }
  }, [resetWorkoutTypes, triggerRefresh, saveWorkouts, forceRefresh]);

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
          onDeleteExercise={handleDeleteExercise}
          refreshKey={refreshKey}
          notificationsEnabled={notificationsEnabled}
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
    notificationsEnabled,
  ]);

  // Memoizar o componente de estado vazio para evitar re-renderizações
  const emptyStateComponent = useMemo(
    () => (
      <EmptyWorkoutState
        onWorkoutConfigured={handleWorkoutConfigured}
        onOpenWorkoutConfig={openWorkoutConfigSheet}
        onSelectWorkout={handleStartWorkout}
      />
    ),
    [handleWorkoutConfigured, openWorkoutConfigSheet, handleStartWorkout]
  );

  // Memoizar o componente Calendar para evitar re-renderizações desnecessárias
  const calendarComponent = useMemo(
    () => (
      <Calendar
        selectedDate={getLocalDate(selectedDate)}
        onSelectDate={handleDateSelect}
        workouts={workoutsForSelectedDate}
        hasContent={hasWorkoutContent}
      />
    ),
    [selectedDate, handleDateSelect, workoutsForSelectedDate, hasWorkoutContent]
  );

  // Atualizar as ações do menu contextual para incluir a opção de silenciar notificações
  const menuActions = useMemo<MenuAction[]>(
    () => [
      {
        id: "edit",
        label: "Editar Treinos",
        icon: "settings-outline",
        type: "default",
        onPress: openWorkoutConfigSheet,
      },
      {
        id: "notifications",
        label: notificationsEnabled
          ? "Silenciar Notificações"
          : "Ativar Notificações",
        icon: notificationsEnabled
          ? "notifications-off-outline"
          : "notifications-outline",
        type: "default",
        onPress: toggleNotifications,
      },
      {
        id: "reset",
        label: "Redefinir Treinos",
        icon: "refresh-outline",
        type: "danger",
        onPress: handleResetWorkoutTypes,
      },
    ],
    [
      openWorkoutConfigSheet,
      handleResetWorkoutTypes,
      notificationsEnabled,
      toggleNotifications,
    ]
  );

  // Função para verificar se o menu deve ser visível
  const isMenuVisible = useMemo(
    () => hasConfiguredWorkouts && hasWorkoutsForSelectedDate,
    [hasConfiguredWorkouts, hasWorkoutsForSelectedDate]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HomeHeader
          title="Seus treinos"
          count={trainingDays}
          iconName="barbell-outline"
          iconColor={colors.success}
          onProfilePress={navigateToProfile}
        />

        {calendarComponent}

        {/* Menu contextual */}
        <ContextMenu actions={menuActions} isVisible={isMenuVisible} />

        {/* Toast de notificação com cores sólidas */}
        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            onDismiss={() => setShowToast(false)}
            duration={4000}
          />
        )}

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
          {/* Renderizar os cards de treino ou o EmptyState */}
          {hasWorkoutsForSelectedDate
            ? renderWorkoutCards()
            : emptyStateComponent}
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
});
