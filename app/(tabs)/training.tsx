import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  Platform,
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
  Suspense,
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
import { Ionicons } from "@expo/vector-icons";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import ContextMenu, { MenuAction } from "../../components/shared/ContextMenu";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HomeHeader from "../../components/home/HomeHeader";
import { useTranslation } from "react-i18next";
import { useTabPreloader } from "../../hooks/useTabPreloader";
import TabPreloader from "../../components/TabPreloader";
import { InteractionManager } from "react-native";

const { width } = Dimensions.get("window");

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
          notificationsEnabled={notificationsEnabled}
        />
      </View>
    );
  },
  arePropsEqual
);

export default function TrainingScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const colors = Colors[theme];
  const router = useRouter();
  const params = useLocalSearchParams();

  // Hook de precarregamento de tabs
  const { isReady, withPreloadDelay } = useTabPreloader({
    delayMs: 150, // Pequeno delay para permitir animações fluidas
  });

  // Estado para controlar carregamento da UI
  const [isUIReady, setIsUIReady] = useState(false);

  // Estado para forçar a recriação do WorkoutConfigSheet
  const [workoutConfigKey, setWorkoutConfigKey] = useState(Date.now());
  // Estado para controlar a visibilidade do modal de confirmação
  const [resetModalVisible, setResetModalVisible] = useState(false);
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
    // Usar valores memoizados do contexto
    workoutsForSelectedDate,
    hasConfiguredWorkouts,
    getWorkoutsForDate,
    workouts,
  } = useWorkoutContext();

  // Carregar a UI após a renderização inicial
  useEffect(() => {
    // Se já estiver pronto, não precisamos fazer nada
    if (isUIReady) return;

    // Usar InteractionManager para adiar o carregamento dos componentes
    // mais pesados até depois que a animação de navegação terminar
    InteractionManager.runAfterInteractions(() => {
      // Adicionar um pequeno timeout para garantir que a UI esteja fluida
      setTimeout(() => {
        setIsUIReady(true);
      }, 100);
    });
  }, [isUIReady]);

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
  }, [workouts]);

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
      }
    };

    if (isUIReady) {
      loadNotificationPreference();
    }
  }, [isUIReady]);

  // Função para alternar o estado de notificações
  const toggleNotifications = useCallback(async () => {
    try {
      const newState = !notificationsEnabled;
      setNotificationsEnabled(newState);
      await AsyncStorage.setItem("notificationsEnabled", newState.toString());
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
    }
  }, [notificationsEnabled]);

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
    if (!isUIReady) return;

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
    isUIReady,
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
    if (!isUIReady) return;

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
  }, [params, router, isUIReady]);

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
      }
    },
    [removeExerciseFromWorkout]
  );

  // Função para iniciar um treino
  const handleStartWorkout = useCallback(
    async (workoutTypeId: string) => {
      try {
        await startWorkoutForDate(workoutTypeId);
        await saveWorkouts();
      } catch (error) {
      }
    },
    [startWorkoutForDate, saveWorkouts]
  );

  // Função para verificar se uma data tem conteúdo - memoizada
  const hasWorkoutContent = useCallback(
    (date: Date) => {
      try {
        const dateString = format(date, "yyyy-MM-dd");
        const workoutsForDate = getWorkoutsForDate(dateString);
        return Object.keys(workoutsForDate).length > 0;
      } catch (error) {
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

        if (!success) {
          Alert.alert("Erro", "Falha ao atualizar tipos de treino.");
        }
      } catch (error) {
      }
    },
    [updateWorkoutTypes]
  );

  // Função para redefinir os tipos de treino
  const handleResetWorkoutTypes = useCallback(() => {
    // Fornecer feedback tátil imediatamente
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Mostrar o modal de confirmação imediatamente
    setResetModalVisible(true);
  }, []);

  // Função para confirmar a redefinição dos tipos de treino
  const confirmResetWorkoutTypes = useCallback(async () => {
    try {
      // Fechar o modal imediatamente para melhor UX
      setResetModalVisible(false);

      // Pequeno delay para garantir que o modal foi fechado visualmente
      // antes de processar a lógica pesada de redefinição
      setTimeout(async () => {
        try {
          // Redefinir os treinos
          const success = await resetWorkoutTypes();

          if (success) {
            // Forçar a recriação do WorkoutConfigSheet
            setWorkoutConfigKey(Date.now());

            // Forçar atualizações
            await saveWorkouts();

            // Feedback tátil
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            // Se falhou, informar o usuário
            Alert.alert(t("common.error"), t("training.errors.resetFailed"));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        } catch (error) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

          // Mostrar alerta de erro
          Alert.alert(t("common.error"), t("training.errors.resetError"));
        }
      }, 100);
    } catch (error) {

      // Fechar o modal mesmo em caso de erro
      setResetModalVisible(false);
    }
  }, [resetWorkoutTypes, saveWorkouts, t]);

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
        label: t("training.menu.editWorkouts"),
        icon: "settings-outline",
        type: "default",
        onPress: openWorkoutConfigSheet,
      },
      {
        id: "notifications",
        label: notificationsEnabled
          ? t("training.menu.muteNotifications")
          : t("training.menu.enableNotifications"),
        icon: notificationsEnabled
          ? "notifications-off-outline"
          : "notifications-outline",
        type: "default",
        onPress: toggleNotifications,
      },
      {
        id: "reset",
        label: t("training.menu.resetWorkouts"),
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
      t,
    ]
  );

  // Função para verificar se o menu deve ser visível
  const isMenuVisible = useMemo(
    () => hasConfiguredWorkouts,
    [hasConfiguredWorkouts]
  );

  // Renderização do conteúdo completo da tela
  const renderScreenContent = () => {
    // Enquanto a interface não está pronta, mostrar o preloader
    if (!isUIReady || !isReady) {
      return <TabPreloader message={t("common.loading")} />;
    }

    return (
      <>
        {calendarComponent}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true} // Melhora a performance para listas longas
        >
          {/* Renderizar os cards de treino ou o EmptyState */}
          {hasWorkoutsForSelectedDate
            ? renderWorkoutCards()
            : emptyStateComponent}
        </ScrollView>
      </>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HomeHeader
          title={t("training.title")}
          count={trainingDays}
          iconName="dumbbell"
          iconType="material"
          iconColor={colors.primary}
          iconBackgroundColor={colors.primary + "15"}
          showContextMenu={true}
          menuActions={menuActions}
          menuVisible={isMenuVisible}
        />

        {renderScreenContent()}
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
        title={t("training.resetModal.title")}
        message={t("training.resetModal.message")}
        confirmText={t("training.resetModal.confirm")}
        cancelText={t("training.resetModal.cancel")}
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
