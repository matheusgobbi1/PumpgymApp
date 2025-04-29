import React, {
  useCallback,
  useReducer,
  useRef,
  useMemo,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  UIManager,
  LayoutAnimation,
  Pressable,
  Dimensions,
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
import { useDateLocale } from "../../hooks/useDateLocale";

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
  onDeleteExercise: (exerciseId: string) => Promise<void>;
}

// Definição do estado inicial e tipos para o reducer
type WorkoutCardState = {
  activeSwipeable: string | null;
  expandedExercises: { [key: string]: boolean };
  showDeleteExerciseModal: boolean;
  selectedExerciseId: string;
  showCopyWorkoutModal: boolean;
  selectedSourceDate: string;
};

type WorkoutCardAction =
  | { type: "SET_ACTIVE_SWIPEABLE"; payload: string | null }
  | { type: "TOGGLE_EXERCISE_EXPAND"; payload: string }
  | { type: "SET_SHOW_DELETE_MODAL"; payload: boolean }
  | { type: "SET_SELECTED_EXERCISE_ID"; payload: string }
  | { type: "SET_SHOW_COPY_MODAL"; payload: boolean }
  | { type: "SET_SELECTED_SOURCE_DATE"; payload: string }
  | { type: "RESET_EXPANDED_EXERCISES" };

// Reducer para gerenciar o estado do card
const workoutCardReducer = (
  state: WorkoutCardState,
  action: WorkoutCardAction
): WorkoutCardState => {
  switch (action.type) {
    case "SET_ACTIVE_SWIPEABLE":
      return { ...state, activeSwipeable: action.payload };
    case "TOGGLE_EXERCISE_EXPAND":
      return {
        ...state,
        expandedExercises: {
          ...state.expandedExercises,
          [action.payload]: !state.expandedExercises[action.payload],
        },
      };
    case "RESET_EXPANDED_EXERCISES":
      return { ...state, expandedExercises: {} };
    case "SET_SHOW_DELETE_MODAL":
      return { ...state, showDeleteExerciseModal: action.payload };
    case "SET_SELECTED_EXERCISE_ID":
      return { ...state, selectedExerciseId: action.payload };
    case "SET_SHOW_COPY_MODAL":
      return { ...state, showCopyWorkoutModal: action.payload };
    case "SET_SELECTED_SOURCE_DATE":
      return { ...state, selectedSourceDate: action.payload };
    default:
      return state;
  }
};

export default function WorkoutCard({
  workout,
  exercises,
  workoutTotals,
  index,
  onDeleteExercise,
}: WorkoutCardProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { selectedDate, copyWorkoutFromDate, startWorkoutForDate } =
    useWorkoutContext();
  const { t } = useTranslation();
  const { formatSmartDate } = useDateLocale();

  // Usar useRef para armazenar os workouts em vez de extraí-los do contexto
  // e causar rerenderizações em cascata
  const workoutsRef = useRef<any>(null);
  const { workouts } = useWorkoutContext();

  // Referência para os Swipeables
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  // Substituir useState por useReducer
  const [state, dispatch] = useReducer(workoutCardReducer, {
    activeSwipeable: null,
    expandedExercises: {},
    showDeleteExerciseModal: false,
    selectedExerciseId: "",
    showCopyWorkoutModal: false,
    selectedSourceDate: "",
  });

  // Atualização direta da referência para reduzir operações
  workoutsRef.current = workouts;

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
    requestAnimationFrame(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });
  }, []);

  // Função para alternar o estado de expansão de um exercício
  const toggleExerciseExpand = useCallback(
    (exerciseId: string) => {
      handleHapticFeedback();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      dispatch({ type: "TOGGLE_EXERCISE_EXPAND", payload: exerciseId });
    },
    [handleHapticFeedback]
  );

  // Função para formatar o volume total
  const formatVolume = useCallback((volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
  }, []);

  // Função para formatar a data para exibição
  const formatDate = useCallback(
    (dateString: string) => {
      try {
        // Importar a função getLocalDate para garantir consistência na conversão de datas
        const { getLocalDate } = require("../../utils/dateUtils");

        // Converter a string de data para um objeto Date no fuso horário local
        const localDate = getLocalDate(dateString);

        // Validar se a data é válida
        if (isNaN(localDate.getTime())) {
          console.warn("Data inválida recebida:", dateString);
          return "Data inválida";
        }

        // Usar a função do hook que já trata locales e formatos com a data local
        return formatSmartDate(localDate);
      } catch (error) {
        console.error("Erro ao formatar data:", error, dateString);
        return "Data inválida";
      }
    },
    [formatSmartDate]
  );

  // Função para abrir o modal de cópia
  const openCopyModal = useCallback(() => {
    handleHapticFeedback();

    // Obter a data mais recente
    const mostRecentDate = getMostRecentWorkoutDate();

    // Se houver uma data disponível, selecionar e abrir o modal
    if (mostRecentDate) {
      dispatch({ type: "SET_SELECTED_SOURCE_DATE", payload: mostRecentDate });
      dispatch({ type: "SET_SHOW_COPY_MODAL", payload: true });
    } else {
      // Se não houver data disponível, mostrar mensagem de erro
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [getMostRecentWorkoutDate, handleHapticFeedback]);

  // Função para abrir o modal de progressão
  const openProgressionModal = useCallback(() => {
    requestAnimationFrame(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });

    // Verificar se existe um treino anterior
    const mostRecentDate = getMostRecentWorkoutDate();

    if (mostRecentDate) {
      // Navegar para a tela modal de progressão em vez de usar o componente
      router.push({
        pathname: "/progression-modal",
        params: {
          workoutId: workout.id,
          workoutName: workout.name,
          workoutColor: workout.color,
        },
      });
    } else {
      // Se não houver treino anterior, mostrar feedback de erro
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [
    getMostRecentWorkoutDate,
    router,
    workout.id,
    workout.name,
    workout.color,
  ]);

  // Função para copiar treino de uma data anterior
  const handleCopyWorkout = useCallback(async () => {
    if (!state.selectedSourceDate) {
      return;
    }

    try {
      // Fornecer feedback tátil de sucesso
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Fechar o modal com um pequeno atraso para garantir que o feedback seja percebido
      setTimeout(() => {
        dispatch({ type: "SET_SHOW_COPY_MODAL", payload: false });
      }, 50);

      // Executar a operação assíncrona em segundo plano
      setTimeout(async () => {
        try {
          await copyWorkoutFromDate(
            state.selectedSourceDate,
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
        }
      }, 100);
    } catch (error) {
      console.error("Erro ao processar cópia de treino:", error);
    }
  }, [
    state.selectedSourceDate,
    selectedDate,
    workout.id,
    copyWorkoutFromDate,
    router,
  ]);

  // Função para navegar para os detalhes do exercício
  const navigateToExerciseDetails = useCallback(
    (exercise: Exercise) => {
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
        isBodyweightExercise: exercise.isBodyweightExercise,
      };

      // Navegar para a tela de detalhes do exercício como um card (não modal) quando editando
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
    },
    [router, workout.id, workout.name, workout.color]
  );

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
  const renderRightActions = useCallback(
    (exerciseId: string) => (
      <TouchableOpacity
        style={[
          styles.deleteAction,
          { backgroundColor: colors.danger || "#FF3B30" },
        ]}
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          dispatch({ type: "SET_SELECTED_EXERCISE_ID", payload: exerciseId });
          dispatch({ type: "SET_SHOW_DELETE_MODAL", payload: true });
        }}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
      </TouchableOpacity>
    ),
    [colors.danger]
  );

  // Efeito para limpar as referências quando o componente é desmontado
  useEffect(() => {
    return () => {
      // Fechar todos os swipeables quando o componente for desmontado
      Array.from(swipeableRefs.current.entries()).forEach(([_, swipeable]) => {
        if (swipeable) {
          swipeable.close();
        }
      });
      // Limpar as referências
      swipeableRefs.current.clear();
    };
  }, []);

  // Função para fechar todos os Swipeables exceto o ativo
  const closeOtherSwipeables = useCallback((currentId: string) => {
    Array.from(swipeableRefs.current.entries()).forEach(([id, swipeable]) => {
      if (id !== currentId && swipeable) {
        swipeable.close();
      }
    });
  }, []);

  // Função para lidar com o swipe aberto
  const handleSwipeableOpen = useCallback(
    (exerciseId: string) => {
      // Fechar itens expandidos se houver algum aberto
      if (
        Object.keys(state.expandedExercises).some(
          (id) => state.expandedExercises[id]
        )
      ) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        dispatch({ type: "RESET_EXPANDED_EXERCISES" });
      }

      dispatch({ type: "SET_ACTIVE_SWIPEABLE", payload: exerciseId });
      closeOtherSwipeables(exerciseId);
    },
    [state.expandedExercises, closeOtherSwipeables]
  );

  // Função para renderizar um exercício com animação
  const renderExerciseItem = useMemo(
    () => (exercise: Exercise, exerciseIndex: number) =>
      (
        <Swipeable
          key={`exercise-${exercise.id}-${exerciseIndex}`}
          renderRightActions={() => renderRightActions(exercise.id)}
          renderLeftActions={() => renderLeftActions(exercise)}
          friction={2}
          overshootRight={false}
          overshootLeft={false}
          onSwipeableOpen={() => handleSwipeableOpen(exercise.id)}
          ref={(ref) => {
            if (ref) {
              swipeableRefs.current.set(exercise.id, ref);
            } else {
              swipeableRefs.current.delete(exercise.id);
            }
          }}
        >
          <View
            style={[
              styles.exerciseItemContainer,
              { backgroundColor: colors.light },
              exerciseIndex === 0 && styles.firstExerciseItem,
              exerciseIndex === exercises.length - 1 && styles.lastExerciseItem,
            ]}
          >
            <Pressable
              style={styles.exerciseItemContent}
              onPress={() => toggleExerciseExpand(exercise.id)}
              onPressIn={() => {
                // Se houver algum swipeable aberto, fechá-lo
                if (
                  state.activeSwipeable &&
                  swipeableRefs.current.has(state.activeSwipeable)
                ) {
                  swipeableRefs.current.get(state.activeSwipeable)?.close();
                  dispatch({ type: "SET_ACTIVE_SWIPEABLE", payload: null });
                }
              }}
            >
              <View style={styles.exerciseItemLeft}>
                <View style={styles.exerciseTextContainer}>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>
                    {exercise.id.startsWith("exercise-")
                      ? exercise.name
                      : exercise.id &&
                        exercise.id.length <= 6 &&
                        exercise.id.startsWith("ex")
                      ? t(`exercises.exercises.${exercise.id}`)
                      : exercise.name}
                  </Text>
                  <View style={styles.exerciseDetailsContainer}>
                    <Text
                      style={[
                        styles.exerciseDetails,
                        { color: colors.text + "80" },
                      ]}
                    >
                      {exercise.category === "cardio"
                        ? `${exercise.cardioDuration} min • ${
                            exercise.cardioIntensity &&
                            exercise.cardioIntensity <= 3
                              ? t("exercise.cardioConfig.intensityLevels.low")
                              : exercise.cardioIntensity &&
                                exercise.cardioIntensity >= 8
                              ? t("exercise.cardioConfig.intensityLevels.high")
                              : t(
                                  "exercise.cardioConfig.intensityLevels.medium"
                                )
                          } ${exercise.cardioIntensity}/10`
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
                    <Text
                      style={[styles.macroText, { color: colors.text + "80" }]}
                    >
                      W{" "}
                      <Text
                        style={[styles.macroNumber, { color: colors.text }]}
                      >
                        {exercise.isBodyweightExercise
                          ? t("exercise.bodyweight.short", {
                              defaultValue: "PC",
                            })
                          : exercise.sets[0].weight}
                      </Text>
                      {"   "}R{" "}
                      <Text
                        style={[styles.macroNumber, { color: colors.text }]}
                      >
                        {exercise.sets[0].reps}
                      </Text>
                      {"   "}
                      <Text
                        style={[
                          styles.macroText,
                          { color: colors.text + "80" },
                        ]}
                      >
                        T{" "}
                      </Text>
                      <Text
                        style={[styles.macroNumber, { color: colors.text }]}
                      >
                        {exercise.sets[0].restTime || 60}s
                      </Text>
                    </Text>
                  </View>
                ) : (
                  <View style={styles.cardioContainer}>
                    <Text
                      style={[styles.cardioText, { color: colors.text + "80" }]}
                    >
                      T{" "}
                    </Text>
                    <Text style={[styles.cardioText, { color: colors.text }]}>
                      {exercise.cardioDuration} min
                    </Text>
                  </View>
                )}

                <Ionicons
                  name={
                    state.expandedExercises[exercise.id]
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={16}
                  color={colors.text + "60"}
                />
              </View>
            </Pressable>

            {/* Exibir detalhes das séries quando o exercício estiver expandido */}
            {state.expandedExercises[exercise.id] &&
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
                    <Text
                      style={[styles.setsHeaderText, { color: colors.text }]}
                    >
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
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {t("exercise.setNumber", { defaultValue: "Série" })}
                      </Text>
                      <Text
                        style={[
                          styles.setsGridHeaderText,
                          { color: colors.text + "99" },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {t("exercise.weight", { defaultValue: "Peso" })}
                      </Text>
                      <Text
                        style={[
                          styles.setsGridHeaderText,
                          { color: colors.text + "99" },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {t("exercise.reps", { defaultValue: "Reps" })}
                      </Text>
                      <Text
                        style={[
                          styles.setsGridHeaderText,
                          { color: colors.text + "99" },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {t("exercise.restTime", { defaultValue: "Tempo" })}
                      </Text>
                    </View>
                    {exercise.sets.map((set, setIndex) => (
                      <View key={`set-${set.id}`} style={styles.setRow}>
                        <Text
                          style={[styles.setNumber, { color: colors.text }]}
                        >
                          {setIndex + 1}
                        </Text>
                        <Text
                          style={[styles.setWeight, { color: colors.text }]}
                        >
                          {exercise.isBodyweightExercise || set.weight === 0
                            ? t("exercise.bodyweight.short", {
                                defaultValue: "PC",
                              })
                            : set.weight}
                        </Text>
                        <Text style={[styles.setReps, { color: colors.text }]}>
                          {set.reps}
                        </Text>
                        <Text style={[styles.setRest, { color: colors.text }]}>
                          {set.restTime || 60}s
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

            {/* Exibir notas do exercício quando expandido */}
            {state.expandedExercises[exercise.id] && exercise.notes && (
              <View
                style={[
                  styles.notesContainer,
                  { backgroundColor: colors.light },
                ]}
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
            {state.expandedExercises[exercise.id] &&
              exercise.category === "cardio" && (
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
                    <Text
                      style={[styles.cardioDetailValue, { color: colors.text }]}
                    >
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
                    <Text
                      style={[styles.cardioDetailValue, { color: colors.text }]}
                    >
                      {exercise.cardioIntensity}/10
                    </Text>
                  </View>

                  {exercise.notes && (
                    <>
                      <Text style={[styles.notesTitle, { color: colors.text }]}>
                        {t("exercise.notes")}:
                      </Text>
                      <Text
                        style={[
                          styles.notesText,
                          { color: colors.text + "99" },
                        ]}
                      >
                        {exercise.notes}
                      </Text>
                    </>
                  )}
                </View>
              )}
          </View>
        </Swipeable>
      ),
    [
      colors.light,
      colors.text,
      renderLeftActions,
      renderRightActions,
      handleSwipeableOpen,
      toggleExerciseExpand,
      state.activeSwipeable,
      state.expandedExercises,
      t,
    ]
  );

  // Funções para os botões das ações do card
  const renderHeaderActions = useMemo(
    () => () =>
      (
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
              onPress={() => {
                requestAnimationFrame(() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  openCopyModal();
                });
              }}
            >
              <Ionicons name="copy-outline" size={20} color={workout.color} />
            </TouchableOpacity>
          )}

          {/* Botão de progressão de treino */}
          {getMostRecentWorkoutDate() && (
            <TouchableOpacity
              style={[
                styles.headerActionButton,
                {
                  borderColor: workout.color,
                  backgroundColor: workout.color + "10",
                },
              ]}
              onPress={() => {
                requestAnimationFrame(() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  openProgressionModal();
                });
              }}
            >
              <Ionicons
                name="trending-up-outline"
                size={20}
                color={workout.color}
              />
            </TouchableOpacity>
          )}

          {/* Botão para adicionar exercício */}
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
              requestAnimationFrame(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: "/(add-exercise)",
                  params: {
                    workoutId: workout.id,
                    workoutName: workout.name,
                    workoutColor: workout.color,
                  },
                });
              });
            }}
          >
            <Ionicons name="add" size={20} color={workout.color} />
          </TouchableOpacity>
        </View>
      ),
    [
      getMostRecentWorkoutDate,
      openCopyModal,
      openProgressionModal,
      workout.color,
      workout.id,
      workout.name,
      router,
    ]
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
          style={[
            styles.workoutCard,
            {
              backgroundColor: colors.light,
              borderWidth: 1,
              borderColor: colors.border,
            },
          ]}
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

                {/* Renderizar ações do cabeçalho */}
                {renderHeaderActions()}
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
            </View>
          </View>
        </View>
      </Swipeable>

      {/* Modal de confirmação para excluir exercício */}
      <ConfirmationModal
        visible={state.showDeleteExerciseModal}
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
          const exerciseIdToDelete = state.selectedExerciseId;

          // Fechar o modal com um pequeno atraso para garantir que o feedback seja percebido
          setTimeout(() => {
            dispatch({ type: "SET_SHOW_DELETE_MODAL", payload: false });
            dispatch({ type: "SET_SELECTED_EXERCISE_ID", payload: "" });
          }, 50);

          // Executar a operação assíncrona em segundo plano após o modal fechar
          setTimeout(async () => {
            if (exerciseIdToDelete) {
              try {
                await onDeleteExercise(exerciseIdToDelete);
              } catch (error) {
                console.error("Erro ao excluir exercício:", error);
              }
            }
          }, 100);
        }}
        onCancel={() => {
          dispatch({ type: "SET_SHOW_DELETE_MODAL", payload: false });
          dispatch({ type: "SET_SELECTED_EXERCISE_ID", payload: "" });
        }}
      />

      {/* Modal para copiar treino de data anterior */}
      <ConfirmationModal
        visible={state.showCopyWorkoutModal}
        title={t("training.copyWorkout", { name: workout.name })}
        message={t("training.copyWorkoutFrom", {
          date: formatDate(state.selectedSourceDate),
        })}
        confirmText={t("common.copy")}
        cancelText={t("common.cancel")}
        confirmType="primary"
        icon="copy-outline"
        onConfirm={handleCopyWorkout}
        onCancel={() =>
          dispatch({ type: "SET_SHOW_COPY_MODAL", payload: false })
        }
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
    flexShrink: 1,
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
  setRest: {
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
