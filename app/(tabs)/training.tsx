import {
  StyleSheet,
  View,
  ScrollView,
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
} from "react";
import Calendar from "../../components/shared/Calendar";
import { getLocalDate } from "../../utils/dateUtils";
import { format } from "date-fns";
import EmptyWorkoutState from "../../components/training/EmptyWorkoutState";
import * as Haptics from "expo-haptics";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import WorkoutConfigSheet from "../../components/training/WorkoutConfigSheet";
import {
  useWorkoutContext,
  Exercise,
  WorkoutType,
} from "../../context/WorkoutContext";
import WorkoutCard from "../../components/training/WorkoutCard";
import TrainingStatsCard from "../../components/training/TrainingStatsCard";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { MenuAction } from "../../components/shared/ContextMenu";
import HomeHeader from "../../components/home/HomeHeader";
import { useTranslation } from "react-i18next";
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
}

// Função para comparar props do MemoizedWorkoutGroup
const arePropsEqual = (
  prevProps: WorkoutGroupProps,
  nextProps: WorkoutGroupProps
): boolean => {
  // Verificar se as props primitivas são iguais
  if (
    prevProps.workoutId !== nextProps.workoutId ||
    prevProps.index !== nextProps.index
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

    onDeleteExercise,
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
          onDeleteExercise={(exerciseId) =>
            onDeleteExercise(workoutId, exerciseId)
          }
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

  // Estado para controlar carregamento da UI
  const [isUIReady, setIsUIReady] = useState(false);

  // Estado para forçar a recriação do WorkoutConfigSheet
  const [workoutConfigKey, setWorkoutConfigKey] = useState(Date.now());

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
    removeWorkoutForDate,
    getWorkoutTypeById,
    saveWorkouts,
    getPreviousWorkoutTotals,
    startWorkoutForDate,
    // Usar valores memoizados do contexto
    workoutsForSelectedDate,
    hasConfiguredWorkouts,
    getWorkoutsForDate,
    workouts,
  } = useWorkoutContext();

  // Verificar se há treinos configurados para a data selecionada
  const hasWorkoutsForSelectedDate = useMemo(
    () => Object.keys(workoutsForSelectedDate).length > 0,
    [workoutsForSelectedDate]
  );

  // Variável para determinar se deve mostrar o estado vazio
  const shouldShowEmptyState = !hasWorkoutsForSelectedDate;

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
      } catch (error) {}
    },
    [removeExerciseFromWorkout]
  );

  // Função para iniciar um treino
  const handleStartWorkout = useCallback(
    async (workoutTypeId: string) => {
      try {
        await startWorkoutForDate(workoutTypeId);
        await saveWorkouts();
      } catch (error) {}
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
      } catch (error) {}
    },
    [updateWorkoutTypes]
  );

  // Função para excluir um treino
  const handleDeleteWorkout = useCallback(async () => {
    // Verificar se há treinos para a data selecionada
    const workoutIds = Object.keys(workoutsForSelectedDate);
    if (workoutIds.length === 0) return;

    // Pegar o primeiro workoutId (como mostrado nos comentários, só temos um tipo de treino por dia)
    const workoutId = workoutIds[0];

    // Solicitar confirmação antes de excluir
    Alert.alert(
      t("training.deleteWorkoutModal.title"),
      t("training.deleteWorkoutModal.message"),
      [
        {
          text: t("training.deleteWorkoutModal.cancel"),
          style: "cancel",
        },
        {
          text: t("training.deleteWorkoutModal.confirm"),
          style: "destructive",
          onPress: async () => {
            try {
              const success = await removeWorkoutForDate(workoutId);
              if (success) {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              } else {
                Alert.alert(
                  t("common.error"),
                  t("training.errors.deleteError") ||
                    "Não foi possível excluir o treino. Tente novamente."
                );
              }
            } catch (error) {
              Alert.alert(
                t("common.error"),
                t("training.errors.deleteError") ||
                  "Não foi possível excluir o treino. Tente novamente."
              );
            }
          },
        },
      ]
    );
  }, [workoutsForSelectedDate, removeWorkoutForDate, t]);

  // Renderizar os cards de treino
  const renderWorkoutCards = useCallback(() => {
    if (
      !workoutsForSelectedDate ||
      Object.keys(workoutsForSelectedDate).length === 0
    )
      return null;

    // Como agora só temos um tipo de treino por dia, pegamos o primeiro ID
    const workoutIds = Object.keys(workoutsForSelectedDate);
    const workoutId = workoutIds[0]; // Usar apenas o primeiro treino

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
        key={`workout-group-${workoutId}-0`}
        workoutId={workoutId}
        workoutType={workoutType}
        exercises={exercises}
        workoutTotals={workoutTotals}
        index={0}
        previousWorkoutData={previousWorkoutData}
        previousExercises={previousExercises}
        onNavigate={navigateToWorkoutDetails}
        onDeleteExercise={handleDeleteExercise}
      />
    );
  }, [
    workoutsForSelectedDate,
    getWorkoutTypeById,
    getExercisesForWorkout,
    getWorkoutTotals,
    getPreviousWorkoutTotals,
    getWorkoutsForDate,
    navigateToWorkoutDetails,
    handleDeleteExercise,
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

  // Atualizar as ações do menu contextual
  const menuActions = useMemo<MenuAction[]>(() => {
    // Ações base sempre presentes
    const baseActions: MenuAction[] = [
      {
        id: "edit",
        label: t("training.menu.editWorkouts"),
        icon: "settings-outline",
        type: "default",
        onPress: openWorkoutConfigSheet,
      },
    ];

    // Adicionar opção de exportar e excluir apenas se houver treinos para a data selecionada
    if (Object.keys(workoutsForSelectedDate).length > 0) {
      baseActions.push({
        id: "export",
        label: t("training.menu.exportWorkout") || "Exportar Treino",
        icon: "share-outline",
        type: "default",
        onPress: () => {
          router.push("/workout-export-modal");
        },
      });

      baseActions.push({
        id: "delete",
        label: t("training.menu.deleteWorkout"),
        icon: "trash-outline",
        type: "danger",
        onPress: handleDeleteWorkout,
      });
    }

    return baseActions;
  }, [
    openWorkoutConfigSheet,
    t,
    workoutsForSelectedDate,
    handleDeleteWorkout,
    router,
  ]);

  // Função para verificar se o menu deve ser visível
  const isMenuVisible = useMemo(
    () => hasConfiguredWorkouts,
    [hasConfiguredWorkouts]
  );

  // Calcular alturas
  const headerHeight = Platform.OS === "ios" ? 70 : 60; // Altura do HomeHeader
  const calendarHeight = 70; // Altura ajustada do Calendário (reduzida de 90 para 80)

  // Renderização do conteúdo completo da tela
  const renderScreenContent = () => {
    if (!isUIReady) {
      return (
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <View style={styles.loadingContainer}>
            {/* Você pode adicionar aqui qualquer UI de carregamento simples, se necessário */}
          </View>
        </View>
      );
    }

    return (
      // Container relativo principal para conteúdo (ScrollView + elementos absolutos)
      <View style={styles.contentWrapper}>
        {/* Calendário posicionado absolutamente abaixo do header */}
        <View style={[styles.calendarWrapper, { top: headerHeight }]}>
          {calendarComponent}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollViewContent,
            // Padding top = altura do header + altura do calendário + padding reduzido
            { paddingTop: headerHeight + calendarHeight + 8 },
          ]}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews={true}
        >
          {shouldShowEmptyState ? emptyStateComponent : renderWorkoutCards()}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Container principal da tela com fundo transparente */}
      <View style={[styles.container, { backgroundColor: "transparent" }]}>
        {/* Header posicionado absolutamente no topo */}
        <View style={styles.headerWrapper}>
          <HomeHeader
            title={t("training.title")}
            showContextMenu={true}
            menuActions={menuActions}
            menuVisible={isMenuVisible}
            onFitLevelPress={() => router.push("/achievements-modal")}
            showFitLevelBadge={!shouldShowEmptyState}
          />
        </View>

        {/* Conteúdo da tela (ScrollView + Calendar) renderizado aqui */}
        {renderScreenContent()}
      </View>

      {/* BottomSheet continua fora do container principal */}
      <WorkoutConfigSheet
        ref={workoutConfigSheetRef}
        onWorkoutConfigured={handleWorkoutConfigured}
        selectedDate={getLocalDate(selectedDate)}
        key={`workout-config-${workoutConfigKey}-${theme}`}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative", // Para que o header absoluto funcione
  },
  // Wrapper para o header absoluto
  headerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2, // Header fica sobre o calendário
  },
  // Wrapper para o conteúdo principal (ScrollView + Calendário)
  contentWrapper: {
    flex: 1,
    position: "relative", // Para que o calendário absoluto funcione
    marginTop: 0, // O espaço é criado pelo paddingTop do ScrollView
  },
  // Wrapper do calendário absoluto
  calendarWrapper: {
    position: "absolute",
    // top é definido inline (abaixo do header)
    left: 0,
    right: 0,
    zIndex: 1, // Calendário fica sobre o ScrollView, mas abaixo do header
    height: 80, // Definir altura fixa igual à do componente Calendar
  },
  scrollView: {
    flex: 1,
    backgroundColor: "transparent", // ScrollView precisa ser transparente
  },
  scrollViewContent: {
    paddingHorizontal: 16, // Padding horizontal aplicado aqui
    paddingBottom: 100,
    // paddingTop será adicionado dinamicamente
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
