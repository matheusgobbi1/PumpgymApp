import React, { useCallback, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  UIManager,
  LayoutAnimation,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";
import { useWorkoutContext } from "../../context/WorkoutContext";
import Colors from "../../constants/Colors";
import { Exercise } from "../../context/WorkoutContext";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";
import ConfirmationModal from "../ui/ConfirmationModal";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
      return `${t("yesterday")} (${date.toLocaleDateString("pt-BR", {
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
      // Fornecer feedback tátil de sucesso
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Fechar o modal com um pequeno atraso para garantir que o feedback seja percebido
      setTimeout(() => {
        setShowCopyWorkoutModal(false);
      }, 50);

      // Mostrar mensagem de sucesso
      setShowCopySuccess(true);

      // Esconder a mensagem após 3 segundos
      setTimeout(() => {
        setShowCopySuccess(false);
      }, 3000);

      // Executar a operação assíncrona em segundo plano
      setTimeout(async () => {
        try {
          await copyWorkoutFromDate(
            selectedSourceDate,
            selectedDate,
            workout.id,
            workout.id
          );

          // Recarregar a página atual
          setTimeout(() => {
            router.push("/training");
          }, 500);
        } catch (error) {
          console.error("Erro ao copiar treino:", error);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }, 100);
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
      <View
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
            <View style={styles.exerciseTextContainer}>
              <Text style={[styles.exerciseName, { color: colors.text }]}>
                {exercise.name}
              </Text>
              <View style={styles.exerciseDetailsContainer}>
                <Text
                  style={[
                    styles.exerciseDetails,
                    { color: colors.text + "80" },
                  ]}
                >
                  {exercise.category === "cardio"
                    ? `${exercise.cardioDuration} min • ${t(
                        "exercise.intensityLevels.medium"
                      )} ${exercise.cardioIntensity}/10`
                    : exercise.sets && exercise.sets.length > 0
                    ? `${exercise.sets.length} ${
                        exercise.sets.length === 1
                          ? t("exercise.series", { count: 1 })
                          : t("exercise.series", { count: 2 })
                      }`
                    : t("exercise.noSets")}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.exerciseRightContainer}>
            {exercise.category !== "cardio" &&
            exercise.sets &&
            exercise.sets.length > 0 ? (
              <View style={styles.macroValues}>
                <Text style={[styles.macroText, { color: colors.text + "80" }]}>
                  W{" "}
                  <Text style={[styles.macroNumber, { color: colors.text }]}>
                    {exercise.sets[0].weight}
                  </Text>
                  {"   "}R{" "}
                  <Text style={[styles.macroNumber, { color: colors.text }]}>
                    {exercise.sets[0].reps}
                  </Text>
                  {"   "}S{" "}
                  <Text style={[styles.macroNumber, { color: colors.text }]}>
                    {exercise.sets ? exercise.sets.length : 0}
                  </Text>
                </Text>
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
            <View
              style={[
                styles.setsDetailsContainer,
                { backgroundColor: colors.light },
              ]}
            >
              <View style={styles.setsHeader}>
                <Text style={[styles.setsHeaderText, { color: colors.text }]}>
                  {t("exercise.setsDetails")}
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
                    {t("exercise.setNumber")}
                  </Text>
                  <Text
                    style={[
                      styles.setsGridHeaderText,
                      { color: colors.text + "99" },
                    ]}
                  >
                    {t("exercise.weight")}
                  </Text>
                  <Text
                    style={[
                      styles.setsGridHeaderText,
                      { color: colors.text + "99" },
                    ]}
                  >
                    {t("exercise.reps")}
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
            </View>
          )}

        {/* Exibir notas do exercício quando expandido */}
        {expandedExercises[exercise.id] && exercise.notes && (
          <View
            style={[styles.notesContainer, { backgroundColor: colors.light }]}
          >
            <Text style={[styles.notesTitle, { color: colors.text }]}>
              {t("exercise.notes")}:
            </Text>
            <Text style={[styles.notesText, { color: colors.text + "99" }]}>
              {exercise.notes}
            </Text>
          </View>
        )}

        {/* Exibir detalhes do cardio quando expandido */}
        {expandedExercises[exercise.id] && exercise.category === "cardio" && (
          <View
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
                {t("exercise.duration")}:
              </Text>
              <Text style={[styles.cardioDetailValue, { color: colors.text }]}>
                {exercise.cardioDuration} {t("minutes")}
              </Text>
            </View>

            <View style={styles.cardioDetailRow}>
              <Text
                style={[
                  styles.cardioDetailLabel,
                  { color: colors.text + "99" },
                ]}
              >
                {t("exercise.intensity")}:
              </Text>
              <Text style={[styles.cardioDetailValue, { color: colors.text }]}>
                {exercise.cardioIntensity}/10
              </Text>
            </View>

            {exercise.notes && (
              <>
                <Text style={[styles.notesTitle, { color: colors.text }]}>
                  {t("exercise.notes")}:
                </Text>
                <Text style={[styles.notesText, { color: colors.text + "99" }]}>
                  {exercise.notes}
                </Text>
              </>
            )}
          </View>
        )}

        {exerciseIndex < exercises.length - 1 && (
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
        )}
      </View>
    </Swipeable>
  );

  return (
    <>
      <Swipeable
        friction={2}
        overshootRight={false}
        containerStyle={styles.swipeableContainer}
      >
        <View
          key={`workout-card-${workout.id}`}
          style={[styles.workoutCard, { backgroundColor: colors.light }]}
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
                        {t("training.stats.volume").toLowerCase()}
                      </Text>
                    </Text>
                  </View>
                </View>
                <View style={styles.actionButtonsContainer}>
                  {/* Botão de copiar treino */}
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

            <View style={styles.exercisesContainer}>
              {exercises.length > 0 ? (
                <View style={styles.exercisesList}>
                  {exercises.map((exercise, exerciseIndex) =>
                    renderExerciseItem(exercise, exerciseIndex)
                  )}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <LinearGradient
                    colors={[colors.light, colors.background]}
                    style={styles.emptyGradient}
                  >
                    <Ionicons
                      name="barbell-outline"
                      size={20}
                      color={colors.text + "30"}
                      style={{ marginBottom: 6 }}
                    />
                    <Text
                      style={[styles.emptyText, { color: colors.text + "50" }]}
                    >
                      {t("training.addFirstExercise")}
                    </Text>
                  </LinearGradient>
                </View>
              )}

              {/* Mensagem de sucesso após copiar treino */}
              {showCopySuccess && (
                <View
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
                    {t("training.workoutCopiedSuccess")}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Swipeable>

      {/* Modal de confirmação para excluir exercício */}
      <ConfirmationModal
        visible={showDeleteExerciseModal}
        title={t("training.deleteExercise")}
        message={t("training.deleteExerciseConfirm")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        confirmType="danger"
        icon="trash-outline"
        onConfirm={async () => {
          // Fornecer feedback tátil de aviso
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

          // Armazenar o ID do exercício para uso após fechar o modal
          const exerciseIdToDelete = selectedExerciseId;

          // Fechar o modal com um pequeno atraso para garantir que o feedback seja percebido
          setTimeout(() => {
            setShowDeleteExerciseModal(false);
            setSelectedExerciseId("");
          }, 50);

          // Executar a operação assíncrona em segundo plano após o modal fechar
          setTimeout(async () => {
            if (exerciseIdToDelete) {
              try {
                await onDeleteExercise(exerciseIdToDelete);
              } catch (error) {
                console.error("Erro ao excluir exercício:", error);
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error
                );
              }
            }
          }, 100);
        }}
        onCancel={() => {
          setShowDeleteExerciseModal(false);
          setSelectedExerciseId("");
        }}
      />

      {/* Modal para copiar treino de data anterior */}
      <ConfirmationModal
        visible={showCopyWorkoutModal}
        title={t("training.copyWorkout", { name: workout.name })}
        message={t("training.copyWorkoutFrom", {
          date: formatDate(selectedSourceDate),
        })}
        confirmText={t("common.copy")}
        cancelText={t("common.cancel")}
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
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastExerciseItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
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
  exerciseTextContainer: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  exerciseDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseDetails: {
    fontSize: 12,
    letterSpacing: -0.1,
  },
  exerciseRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  macroValues: {
    alignItems: "flex-end",
  },
  macroText: {
    fontSize: 11,
    fontWeight: "400",
  },
  macroNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
  },
  cardioContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardioText: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: -0.1,
  },
  setsDetailsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  setsHeader: {
    marginBottom: 10,
  },
  setsHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  setsGrid: {
    gap: 8,
  },
  setsGridHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  setsGridHeaderText: {
    fontSize: 12,
    fontWeight: "500",
    width: 50,
    textAlign: "center",
    letterSpacing: -0.1,
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 10,
  },
  setNumber: {
    fontSize: 13,
    fontWeight: "600",
    width: 50,
    textAlign: "center",
  },
  setWeight: {
    fontSize: 13,
    fontWeight: "600",
    width: 50,
    textAlign: "center",
  },
  setReps: {
    fontSize: 13,
    fontWeight: "600",
    width: 50,
    textAlign: "center",
  },
  notesContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  cardioDetailsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  cardioDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardioDetailLabel: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: -0.1,
  },
  cardioDetailValue: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  separator: {
    height: 1,
    opacity: 0.3,
    marginHorizontal: 16,
  },

  // Estilos para o Swipeable
  swipeableContainer: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
  },

  // Estilos originais do card
  workoutCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  workoutContent: {
    padding: 16,
  },
  headerTouchable: {
    marginBottom: 12,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  workoutTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  exerciseCount: {
    fontSize: 12,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  volumeValue: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 3,
  },
  volumeLabel: {
    fontSize: 11,
    fontWeight: "normal",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  exercisesContainer: {
    minHeight: 50,
  },
  exercisesList: {
    marginVertical: 0,
    marginHorizontal: -16, // Ajustado para o novo padding do card
  },
  emptyContainer: {
    marginVertical: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  emptyGradient: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.8,
  },
  successMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 10,
    alignSelf: "center",
  },
  successMessageText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
    letterSpacing: -0.2,
  },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    height: "100%",
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
});
