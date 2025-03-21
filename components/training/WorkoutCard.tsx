import React, {
  useCallback,
  useState,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  UIManager,
  LayoutAnimation,
  Alert,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { MotiView } from "moti";
import { Swipeable } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";
import { useWorkoutContext } from "../../context/WorkoutContext";
import Colors from "../../constants/Colors";
import { Exercise } from "../../context/WorkoutContext";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInRight,
  FadeIn,
  FadeInDown,
  Easing,
} from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import ConfirmationModal from "../ui/ConfirmationModal";

const { width } = Dimensions.get("window");

// Habilitar LayoutAnimation para Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// Interface para as props do componente
interface WorkoutCardProps {
  workout: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  exercises: Exercise[];
  workoutTotals: {
    totalExercises: number;
    totalSets: number;
    totalVolume: number;
  };
  index: number;
  onPress: () => void;
  onDeleteExercise: (exerciseId: string) => Promise<void>;
  notificationsEnabled?: boolean;
}

export default function WorkoutCard({
  workout,
  exercises,
  workoutTotals,
  index,
  onPress,
  onDeleteExercise,
  notificationsEnabled = true,
}: WorkoutCardProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const userId = user?.uid || "no-user";
  const { selectedDate, copyWorkoutFromDate } = useWorkoutContext();

  // Usar useRef para armazenar os workouts em vez de extraí-los do contexto
  // e causar rerenderizações em cascata
  const workoutsRef = useRef<any>(null);
  const { workouts } = useWorkoutContext();

  // Atualização direta da referência para reduzir operações
  // Isso é seguro porque não causa re-renderizações e a ref é atualizada sempre que o componente renderiza
  workoutsRef.current = workouts;

  // Estado para controlar quais exercícios estão expandidos
  const [expandedExercises, setExpandedExercises] = useState<{
    [key: string]: boolean;
  }>({});

  // Estado para controlar o modal de confirmação
  const [showDeleteExerciseModal, setShowDeleteExerciseModal] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");

  // Estados para copiar treino
  const [showCopyWorkoutModal, setShowCopyWorkoutModal] = useState(false);
  const [selectedSourceDate, setSelectedSourceDate] = useState<string>("");
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Estado para notificações de progresso
  const [progressNotification, setProgressNotification] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info";
  }>({
    visible: false,
    message: "",
    type: "success",
  });

  // Função para resetar os exercícios expandidos
  const resetExpandedExercises = useCallback(() => {
    setExpandedExercises({});
  }, []);

  // Função para obter as datas anteriores com este treino - memoizada
  const getPreviousDatesWithWorkout = useCallback(() => {
    if (!workoutsRef.current) return [];

    // Filtrar datas anteriores à data selecionada
    return Object.keys(workoutsRef.current)
      .filter((date) => {
        // Verificar se a data é anterior à data selecionada
        return (
          date < selectedDate &&
          // Verificar se o treino existe nesta data e tem exercícios
          workoutsRef.current[date]?.[workout.id]?.length > 0
        );
      })
      .sort((a, b) => b.localeCompare(a)); // Ordenar por data decrescente
  }, [selectedDate, workout.id]);

  // Memoizar o resultado para evitar recálculos
  const previousDatesWithWorkout = useMemo(
    () => getPreviousDatesWithWorkout(),
    [getPreviousDatesWithWorkout]
  );

  // Função para obter a data mais recente - memoizada também
  const getMostRecentWorkoutDate = useCallback(() => {
    return previousDatesWithWorkout.length > 0
      ? previousDatesWithWorkout[0]
      : "";
  }, [previousDatesWithWorkout]);

  // Função para lidar com o feedback tátil
  const handleHapticFeedback = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Função para alternar o estado de expansão de um exercício
  const toggleExerciseExpand = useCallback(
    (exerciseId: string) => {
      handleHapticFeedback();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedExercises((prev) => ({
        ...prev,
        [exerciseId]: !prev[exerciseId],
      }));
    },
    [handleHapticFeedback]
  );

  // Função para formatar o volume total
  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
  };

  // Função para verificar se uma data é ontem
  const isYesterday = useCallback((dateString: string) => {
    // Obter a data atual no fuso horário local
    const today = new Date();

    // Criar o objeto de data de ontem
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    // Extrair componentes de data de ontem
    const yesterdayYear = yesterday.getFullYear();
    const yesterdayMonth = yesterday.getMonth() + 1;
    const yesterdayDay = yesterday.getDate();

    // Formatar a data de ontem como string no formato YYYY-MM-DD
    const yesterdayString = `${yesterdayYear}-${String(yesterdayMonth).padStart(
      2,
      "0"
    )}-${String(yesterdayDay).padStart(2, "0")}`;

    // Comparar as strings de data
    return dateString === yesterdayString;
  }, []);

  // Função para formatar a data para exibição
  const formatDate = (dateString: string) => {
    // Criar uma data no fuso horário local do Brasil (UTC-3)
    // Formato da string de data: YYYY-MM-DD
    const [year, month, day] = dateString.split("-").map(Number);

    // Criar a data com o horário definido como meio-dia para evitar problemas de fuso horário
    const date = new Date(year, month - 1, day, 12, 0, 0);

    // Verificar se é ontem
    if (isYesterday(dateString)) {
      return `Ontem (${date.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
      })})`;
    }

    // Formatar a data normalmente
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    });
  };

  // Função para abrir o modal de cópia
  const openCopyModal = useCallback(() => {
    handleHapticFeedback();

    // Obter a data mais recente
    const mostRecentDate = getMostRecentWorkoutDate();

    // Se houver uma data disponível, selecionar e abrir o modal
    if (mostRecentDate) {
      setSelectedSourceDate(mostRecentDate);
      setShowCopyWorkoutModal(true);
    } else {
      // Se não houver data disponível, mostrar mensagem de erro
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [getMostRecentWorkoutDate, handleHapticFeedback]);

  // Função para copiar treino de uma data anterior
  const handleCopyWorkout = useCallback(async () => {
    if (!selectedSourceDate) {
      return;
    }

    try {
      await copyWorkoutFromDate(
        selectedSourceDate,
        selectedDate,
        workout.id,
        workout.id
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCopyWorkoutModal(false);
      setShowCopySuccess(true);

      // Esconder a mensagem após 3 segundos
      setTimeout(() => {
        setShowCopySuccess(false);
      }, 3000);

      // Recarregar a página atual
      setTimeout(() => {
        router.push("/training");
      }, 1000);
    } catch (error) {
      console.error("Erro ao copiar treino:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [
    selectedSourceDate,
    selectedDate,
    workout.id,
    copyWorkoutFromDate,
    router,
  ]);

  // Função para navegar para os detalhes do exercício
  const navigateToExerciseDetails = (exercise: Exercise) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Preparar os dados do exercício para passar como parâmetro
    const exerciseData = {
      id: exercise.id,
      name: exercise.name,
      notes: exercise.notes,
      sets: exercise.sets,
      category: exercise.category,
      cardioDuration: exercise.cardioDuration,
      cardioIntensity: exercise.cardioIntensity,
    };

    // Navegar para a tela de detalhes do exercício como um modal
    router.push({
      pathname: "/(add-exercise)/exercise-details",
      params: {
        exerciseId: exercise.id,
        workoutId: workout.id,
        workoutName: workout.name,
        workoutColor: workout.color,
        mode: "edit",
        exerciseData: JSON.stringify(exerciseData),
      },
    });
  };

  // Função para renderizar as ações de deslize à esquerda (editar)
  const renderLeftActions = useCallback(
    (exercise: Exercise) => (
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: colors.primary + "CC" }]}
        onPress={() => navigateToExerciseDetails(exercise)}
      >
        <Ionicons name="create-outline" size={20} color="white" />
      </TouchableOpacity>
    ),
    [colors.primary, navigateToExerciseDetails]
  );

  // Renderizar as ações de deslizar para a direita (excluir)
  const renderRightActions = (exerciseId: string) => (
    <TouchableOpacity
      style={[
        styles.deleteAction,
        { backgroundColor: colors.danger || "#FF3B30" },
      ]}
      onPress={() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setSelectedExerciseId(exerciseId);
        setShowDeleteExerciseModal(true);
      }}
    >
      <Ionicons name="trash-outline" size={24} color="white" />
    </TouchableOpacity>
  );

  // Função para verificar e notificar progresso
  const checkForProgress = useCallback(
    (currentExercise: Exercise, previousExercise: Exercise) => {
      // Desativamos essa funcionalidade para manter apenas as notificações de PR
      return false;
    },
    [notificationsEnabled]
  );

  // Função que verifica se um exercício atingiu um novo recorde pessoal (PR)
  const checkForPersonalRecord = useCallback(
    (currentExercise: Exercise, previousExercise: Exercise) => {
      // Se as notificações estiverem desativadas, não verificar PRs
      if (!notificationsEnabled) return false;

      if (!previousExercise || !currentExercise) return false;

      // Verificar apenas para exercícios de força (não cardio)
      if (
        currentExercise.category !== "cardio" &&
        currentExercise.sets &&
        previousExercise.sets
      ) {
        // Para verificar PRs, precisamos encontrar a carga máxima por repetição
        // Um PR legítimo é quando a pessoa levanta mais peso para o mesmo número de repetições,
        // ou faz mais repetições com o mesmo peso

        // Mapear cargas e repetições do treino atual
        const currentSets = currentExercise.sets.map((set) => ({
          weight: set.weight,
          reps: set.reps,
        }));

        // Mapear cargas e repetições do treino anterior
        const previousSets = previousExercise.sets.map((set) => ({
          weight: set.weight,
          reps: set.reps,
        }));

        // Verificar PR de força: mais peso nas mesmas reps
        for (const currentSet of currentSets) {
          // Procurar um set no treino anterior com as mesmas repetições
          const matchingPrevSet = previousSets.find(
            (prevSet) => prevSet.reps === currentSet.reps
          );

          if (matchingPrevSet && currentSet.weight > matchingPrevSet.weight) {
            // Novo PR detectado - mais peso nas mesmas repetições!
            const increase = currentSet.weight - matchingPrevSet.weight;
            const percentIncrease = Math.round(
              (increase / matchingPrevSet.weight) * 100
            );

            // Apenas feedback tátil para PRs
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            return true;
          }
        }

        // Verificar PR de resistência: mais repetições com o mesmo peso
        for (const currentSet of currentSets) {
          // Procurar um set no treino anterior com o mesmo peso
          const matchingPrevSets = previousSets.filter(
            (prevSet) => prevSet.weight === currentSet.weight
          );

          if (matchingPrevSets.length > 0) {
            // Encontrar o maior número de repetições feito com este peso no treino anterior
            const maxPrevReps = Math.max(
              ...matchingPrevSets.map((set) => set.reps)
            );

            if (currentSet.reps > maxPrevReps) {
              // Novo PR detectado - mais repetições no mesmo peso!
              const increase = currentSet.reps - maxPrevReps;

              // Apenas feedback tátil para PRs
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );

              return true;
            }
          }
        }
      }

      return false;
    },
    [notificationsEnabled]
  );

  // Modificar o useEffect existente para verificar PRs - OTIMIZADO
  useEffect(() => {
    // Se as notificações estiverem desativadas, não verificar PRs nem progresso
    if (!notificationsEnabled) return;

    if (!workoutsRef.current || !previousDatesWithWorkout.length) return;

    const mostRecentDate = getMostRecentWorkoutDate();
    if (!mostRecentDate) return;

    // Obter exercícios do treino mais recente
    const previousWorkoutExercises =
      workoutsRef.current[mostRecentDate]?.[workout.id] || [];

    // Verificar cada exercício atual em relação ao anterior - apenas uma vez
    const checkExercises = () => {
      for (const currentExercise of exercises) {
        // Encontrar o exercício correspondente no treino anterior
        const previousExercise = previousWorkoutExercises.find(
          (ex: Exercise) =>
            ex.name.toLowerCase() === currentExercise.name.toLowerCase()
        );

        if (previousExercise) {
          // Primeiro verificar PRs, que são mais importantes
          const hasPR = checkForPersonalRecord(
            currentExercise,
            previousExercise
          );
          if (hasPR) break; // Mostrar apenas uma notificação por vez

          // Se não houver PR, verificar progresso geral
          const hasProgress = checkForProgress(
            currentExercise,
            previousExercise
          );
          if (hasProgress) break; // Mostrar apenas uma notificação por vez
        }
      }
    };

    // Só executar a verificação uma vez quando os dados estiverem prontos
    checkExercises();
  }, [
    exercises,
    previousDatesWithWorkout,
    getMostRecentWorkoutDate,
    checkForProgress,
    checkForPersonalRecord,
    notificationsEnabled,
    workout.id,
  ]);

  // Função para renderizar um exercício
  const renderExerciseItem = (exercise: Exercise, exerciseIndex: number) => (
    <Swipeable
      key={`exercise-${exercise.id}-${exerciseIndex}`}
      renderRightActions={() => renderRightActions(exercise.id)}
      renderLeftActions={() => renderLeftActions(exercise)}
      friction={2}
      overshootRight={false}
      overshootLeft={false}
    >
      <Animated.View
        entering={FadeInRight.delay(exerciseIndex * 100).duration(300)}
        style={[
          styles.exerciseItemContainer,
          { backgroundColor: colors.light },
          exerciseIndex === 0 && styles.firstExerciseItem,
          exerciseIndex === exercises.length - 1 && styles.lastExerciseItem,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleExerciseExpand(exercise.id)}
          style={styles.exerciseItemContent}
        >
          <View style={styles.exerciseItemLeft}>
            <View
              style={[
                styles.exerciseIconContainer,
                { backgroundColor: workout.color + "20" },
              ]}
            >
              {/* Determinar qual biblioteca de ícones usar com base no nome */}
              {workout.icon.includes("material-") ? (
                <MaterialCommunityIcons
                  name={workout.icon.replace("material-", "") as any}
                  size={16}
                  color={workout.color}
                />
              ) : workout.icon.includes("fa5-") ? (
                <FontAwesome5
                  name={workout.icon.replace("fa5-", "") as any}
                  size={16}
                  color={workout.color}
                />
              ) : (
                <Ionicons
                  name={workout.icon as any}
                  size={16}
                  color={workout.color}
                />
              )}
            </View>
            <View style={styles.exerciseTextContainer}>
              <Animated.Text
                entering={FadeIn.delay(exerciseIndex * 100 + 100).duration(400)}
                style={[styles.exerciseName, { color: colors.text }]}
              >
                {exercise.name}
              </Animated.Text>
              <View style={styles.exerciseDetailsContainer}>
                <Text
                  style={[
                    styles.exerciseDetails,
                    { color: colors.text + "80" },
                  ]}
                >
                  {exercise.category === "cardio"
                    ? `${exercise.cardioDuration} min • Intensidade ${exercise.cardioIntensity}/10`
                    : exercise.sets && exercise.sets.length > 0
                    ? `${exercise.sets.length} ${
                        exercise.sets.length === 1 ? "série" : "séries"
                      }`
                    : "Sem séries"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.exerciseRightContainer}>
            {exercise.category !== "cardio" &&
            exercise.sets &&
            exercise.sets.length > 0 ? (
              <View style={styles.exerciseIndicators}>
                {/* Carga (Weight) */}
                <View style={styles.exerciseIndicator}>
                  <View
                    style={[
                      styles.indicatorBar,
                      { backgroundColor: colors.danger || "#FF3B30" },
                    ]}
                  />
                  <Text style={[styles.indicatorValue, { color: colors.text }]}>
                    <Text
                      style={[
                        styles.indicatorLabel,
                        { color: colors.text + "99" },
                      ]}
                    >
                      C{" "}
                    </Text>
                    {exercise.sets && exercise.sets.length > 0
                      ? exercise.sets[0].weight
                      : 0}
                  </Text>
                </View>

                {/* Repetições (Reps) */}
                <View style={styles.exerciseIndicator}>
                  <View
                    style={[
                      styles.indicatorBar,
                      { backgroundColor: colors.primary || "#2196F3" },
                    ]}
                  />
                  <Text style={[styles.indicatorValue, { color: colors.text }]}>
                    <Text
                      style={[
                        styles.indicatorLabel,
                        { color: colors.text + "99" },
                      ]}
                    >
                      R{" "}
                    </Text>
                    {exercise.sets && exercise.sets.length > 0
                      ? exercise.sets[0].reps
                      : 0}
                  </Text>
                </View>

                {/* Séries (Sets) */}
                <View style={styles.exerciseIndicator}>
                  <View
                    style={[
                      styles.indicatorBar,
                      { backgroundColor: colors.success || "#4CAF50" },
                    ]}
                  />
                  <Text style={[styles.indicatorValue, { color: colors.text }]}>
                    <Text
                      style={[
                        styles.indicatorLabel,
                        { color: colors.text + "99" },
                      ]}
                    >
                      S{" "}
                    </Text>
                    {exercise.sets ? exercise.sets.length : 0}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.cardioContainer}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={colors.text + "80"}
                />
                <Text style={[styles.cardioText, { color: colors.text }]}>
                  {exercise.cardioDuration} min
                </Text>
              </View>
            )}

            <Ionicons
              name={
                expandedExercises[exercise.id] ? "chevron-up" : "chevron-down"
              }
              size={16}
              color={colors.text + "60"}
            />
          </View>
        </TouchableOpacity>

        {/* Exibir detalhes das séries quando o exercício estiver expandido */}
        {expandedExercises[exercise.id] &&
          exercise.sets &&
          exercise.category !== "cardio" &&
          exercise.sets.length > 0 && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ type: "timing", duration: 300 }}
              style={[
                styles.setsDetailsContainer,
                { backgroundColor: colors.light },
              ]}
            >
              <View style={styles.setsHeader}>
                <Text style={[styles.setsHeaderText, { color: colors.text }]}>
                  Detalhes das Séries
                </Text>
              </View>
              <View style={styles.setsGrid}>
                <View style={styles.setsGridHeader}>
                  <Text
                    style={[
                      styles.setsGridHeaderText,
                      { color: colors.text + "99" },
                    ]}
                  >
                    Série
                  </Text>
                  <Text
                    style={[
                      styles.setsGridHeaderText,
                      { color: colors.text + "99" },
                    ]}
                  >
                    Peso
                  </Text>
                  <Text
                    style={[
                      styles.setsGridHeaderText,
                      { color: colors.text + "99" },
                    ]}
                  >
                    Reps
                  </Text>
                </View>
                {exercise.sets.map((set, setIndex) => (
                  <View key={`set-${set.id}`} style={styles.setRow}>
                    <Text style={[styles.setNumber, { color: colors.text }]}>
                      {setIndex + 1}
                    </Text>
                    <Text style={[styles.setWeight, { color: colors.text }]}>
                      {set.weight}kg
                    </Text>
                    <Text style={[styles.setReps, { color: colors.text }]}>
                      {set.reps}
                    </Text>
                  </View>
                ))}
              </View>
            </MotiView>
          )}

        {/* Exibir notas do exercício quando expandido */}
        {expandedExercises[exercise.id] && exercise.notes && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={[styles.notesContainer, { backgroundColor: colors.light }]}
          >
            <Text style={[styles.notesTitle, { color: colors.text }]}>
              Notas:
            </Text>
            <Text style={[styles.notesText, { color: colors.text + "99" }]}>
              {exercise.notes}
            </Text>
          </Animated.View>
        )}

        {/* Exibir detalhes do cardio quando expandido */}
        {expandedExercises[exercise.id] && exercise.category === "cardio" && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={[
              styles.cardioDetailsContainer,
              { backgroundColor: colors.light },
            ]}
          >
            <View style={styles.cardioDetailRow}>
              <Text
                style={[
                  styles.cardioDetailLabel,
                  { color: colors.text + "99" },
                ]}
              >
                Duração:
              </Text>
              <Text style={[styles.cardioDetailValue, { color: colors.text }]}>
                {exercise.cardioDuration} minutos
              </Text>
            </View>

            <View style={styles.cardioDetailRow}>
              <Text
                style={[
                  styles.cardioDetailLabel,
                  { color: colors.text + "99" },
                ]}
              >
                Intensidade:
              </Text>
              <Text style={[styles.cardioDetailValue, { color: colors.text }]}>
                {exercise.cardioIntensity}/10
              </Text>
            </View>

            {exercise.notes && (
              <>
                <Text style={[styles.notesTitle, { color: colors.text }]}>
                  Notas:
                </Text>
                <Text style={[styles.notesText, { color: colors.text + "99" }]}>
                  {exercise.notes}
                </Text>
              </>
            )}
          </Animated.View>
        )}
      </Animated.View>
    </Swipeable>
  );

  return (
    <>
      <Swipeable
        friction={2}
        overshootRight={false}
        containerStyle={styles.swipeableContainer}
      >
        <MotiView
          key={`workout-card-${workout.id}`}
          style={[styles.workoutCard, { backgroundColor: colors.light }]}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", delay: index * 100 }}
        >
          <View style={styles.workoutContent}>
            <TouchableOpacity
              style={styles.headerTouchable}
              onPress={() => {
                handleHapticFeedback();
                router.push({
                  pathname: "/(add-exercise)",
                  params: {
                    workoutId: workout.id,
                    workoutName: workout.name,
                    workoutColor: workout.color,
                  },
                });
              }}
              activeOpacity={0.7}
            >
              <View style={styles.workoutHeader}>
                <View style={styles.workoutTitleContainer}>
                  <View
                    style={[
                      styles.workoutIconContainer,
                      { backgroundColor: workout.color + "30" },
                    ]}
                  >
                    {/* Determinar qual biblioteca de ícones usar com base no nome */}
                    {workout.icon.includes("material-") ? (
                      <MaterialCommunityIcons
                        name={workout.icon.replace("material-", "") as any}
                        size={18}
                        color={workout.color}
                      />
                    ) : workout.icon.includes("fa5-") ? (
                      <FontAwesome5
                        name={workout.icon.replace("fa5-", "") as any}
                        size={18}
                        color={workout.color}
                      />
                    ) : (
                      <Ionicons
                        name={workout.icon as any}
                        size={18}
                        color={workout.color}
                      />
                    )}
                  </View>
                  <View>
                    <Text style={[styles.workoutTitle, { color: colors.text }]}>
                      {workout.name}
                    </Text>
                    <Text
                      style={[styles.volumeValue, { color: workout.color }]}
                    >
                      {formatVolume(workoutTotals.totalVolume)}{" "}
                      <Text
                        style={[
                          styles.volumeLabel,
                          { color: colors.text + "70" },
                        ]}
                      >
                        volume
                      </Text>
                    </Text>
                  </View>
                </View>
                <View style={styles.actionButtonsContainer}>
                  {getMostRecentWorkoutDate() && (
                    <TouchableOpacity
                      style={[
                        styles.headerActionButton,
                        {
                          borderColor: workout.color,
                          backgroundColor: workout.color + "10",
                        },
                      ]}
                      onPress={openCopyModal}
                    >
                      <Ionicons
                        name="copy-outline"
                        size={20}
                        color={workout.color}
                      />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.headerActionButton,
                      {
                        borderColor: workout.color,
                        backgroundColor: workout.color + "10",
                      },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleHapticFeedback();
                      router.push({
                        pathname: "/(add-exercise)",
                        params: {
                          workoutId: workout.id,
                          workoutName: workout.name,
                          workoutColor: workout.color,
                        },
                      });
                    }}
                  >
                    <Ionicons name="add" size={20} color={workout.color} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>

            {exercises.length > 0 && (
              <View
                style={[
                  styles.progressContainer,
                  { backgroundColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: workout.color },
                    { width: `100%` },
                  ]}
                />
              </View>
            )}

            <View style={styles.exercisesContainer}>
              {exercises.length > 0 ? (
                <View style={styles.exercisesList}>
                  {exercises.map((exercise, exerciseIndex) =>
                    renderExerciseItem(exercise, exerciseIndex)
                  )}
                </View>
              ) : (
                <MotiView
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: "timing", duration: 500 }}
                  style={styles.emptyContainer}
                >
                  <LinearGradient
                    colors={[colors.light, colors.background]}
                    style={styles.emptyGradient}
                  >
                    <Text
                      style={[styles.emptyText, { color: colors.text + "50" }]}
                    >
                      Adicione seu primeiro exercício
                    </Text>
                  </LinearGradient>
                </MotiView>
              )}

              {/* Mensagem de sucesso após copiar treino */}
              {showCopySuccess && (
                <MotiView
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0, translateY: 10 }}
                  style={[
                    styles.successMessage,
                    { backgroundColor: workout.color + "20" },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={workout.color}
                  />
                  <Text
                    style={[
                      styles.successMessageText,
                      { color: workout.color },
                    ]}
                  >
                    Treino copiado com sucesso!
                  </Text>
                </MotiView>
              )}
            </View>
          </View>
        </MotiView>
      </Swipeable>

      {/* Modal de confirmação para excluir exercício */}
      <ConfirmationModal
        visible={showDeleteExerciseModal}
        title="Excluir Exercício"
        message="Tem certeza que deseja excluir este exercício? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmType="danger"
        icon="trash-outline"
        onConfirm={async () => {
          if (selectedExerciseId) {
            await onDeleteExercise(selectedExerciseId);
          }
          setShowDeleteExerciseModal(false);
          setSelectedExerciseId("");
        }}
        onCancel={() => {
          setShowDeleteExerciseModal(false);
          setSelectedExerciseId("");
        }}
      />

      {/* Modal para copiar treino de data anterior */}
      <ConfirmationModal
        visible={showCopyWorkoutModal}
        title={`Copiar treino ${workout.name}`}
        message={`Deseja copiar o treino de ${formatDate(selectedSourceDate)}?`}
        confirmText="Copiar"
        cancelText="Cancelar"
        confirmType="primary"
        icon="copy-outline"
        onConfirm={handleCopyWorkout}
        onCancel={() => setShowCopyWorkoutModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Estilos para o exercício expansível
  exerciseItemContainer: {
    overflow: "hidden",
  },
  firstExerciseItem: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  lastExerciseItem: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  exerciseItemContent: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  exerciseIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  exerciseTextContainer: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  exerciseDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseDetails: {
    fontSize: 11,
  },
  exerciseRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exerciseIndicators: {
    flexDirection: "row",
    gap: 20,
  },
  exerciseIndicator: {
    alignItems: "center",
    width: 32,
  },
  indicatorBar: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
    marginBottom: 4,
  },
  indicatorValue: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
  },
  indicatorLabel: {
    fontSize: 10,
    fontWeight: "400",
  },
  cardioContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardioText: {
    fontSize: 12,
    fontWeight: "500",
  },
  setsDetailsContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  setsHeader: {
    marginBottom: 8,
  },
  setsHeaderText: {
    fontSize: 12,
    fontWeight: "600",
  },
  setsGrid: {
    gap: 8,
  },
  setsGridHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  setsGridHeaderText: {
    fontSize: 11,
    fontWeight: "500",
    width: 50,
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 6,
  },
  setNumber: {
    fontSize: 12,
    fontWeight: "500",
    width: 50,
    textAlign: "center",
  },
  setWeight: {
    fontSize: 12,
    fontWeight: "500",
    width: 50,
    textAlign: "center",
  },
  setReps: {
    fontSize: 12,
    fontWeight: "500",
    width: 50,
    textAlign: "center",
  },
  notesContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    lineHeight: 18,
  },
  cardioDetailsContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  cardioDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardioDetailLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardioDetailValue: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Estilos para o Swipeable
  swipeableContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },

  // Estilos originais do card
  workoutCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  workoutContent: {
    padding: 20,
    paddingBottom: 20,
  },
  headerTouchable: {
    marginBottom: 14,
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workoutTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  workoutIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseCount: {
    fontSize: 12,
    marginTop: 2,
  },
  volumeValue: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  volumeLabel: {
    fontSize: 11,
    fontWeight: "normal",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  progressContainer: {
    height: 3,
    flexDirection: "row",
    borderRadius: 1.5,
    overflow: "hidden",
    marginBottom: 18,
  },
  progressBar: {
    height: "100%",
  },
  exercisesContainer: {
    minHeight: 50,
  },
  exercisesList: {
    marginVertical: 0,
    marginHorizontal: -20, // Estender além do padding do card
  },
  emptyContainer: {
    marginVertical: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  emptyGradient: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  successMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
    alignSelf: "center",
  },
  successMessageText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    height: "100%",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
});
