import React, { useCallback, useState, useEffect, useRef } from "react";
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
} from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import { useRefresh } from "../../context/RefreshContext";

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
  onDeleteWorkout?: (workoutId: string) => Promise<void>;
  refreshKey?: number;
}

export default function WorkoutCard({
  workout,
  exercises,
  workoutTotals,
  index,
  onPress,
  onDeleteExercise,
  onDeleteWorkout,
  refreshKey,
}: WorkoutCardProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const userId = user?.uid || "no-user";
  const { refreshKey: contextRefreshKey } = useRefresh();
  
  // Combinar refreshKey da prop com o do contexto
  const combinedRefreshKey = refreshKey || contextRefreshKey;

  // Estado para controlar quais exercícios estão expandidos
  const [expandedExercises, setExpandedExercises] = useState<{
    [key: string]: boolean;
  }>({});

  // Efeito para forçar a re-renderização quando o tema ou usuário mudar
  useEffect(() => {
    // Não é necessário fazer nada aqui, o React já vai re-renderizar quando as props mudarem
  }, [theme, user, exercises]);

  // Efeito para atualizar o estado quando o refreshKey mudar
  useEffect(() => {
    // Atualizar o estado quando o refreshKey mudar
    if (combinedRefreshKey) {
      // Forçar re-renderização quando o refreshKey mudar
      setExpandedExercises({});
    }
  }, [combinedRefreshKey]);

  // Função para lidar com o feedback tátil
  const handleHapticFeedback = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Função para alternar o estado de expansão de um exercício
  const toggleExerciseExpand = (exerciseId: string) => {
    handleHapticFeedback();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedExercises((prev) => ({
      ...prev,
      [exerciseId]: !prev[exerciseId],
    }));
  };

  // Função para formatar o volume total
  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
  };

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
        mode: 'edit',
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
      onPress={async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        
        // Confirmar exclusão
        Alert.alert(
          "Excluir Exercício",
          "Tem certeza que deseja excluir este exercício?",
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Excluir",
              style: "destructive",
              onPress: async () => {
                await onDeleteExercise(exerciseId);
              },
            },
          ]
        );
      }}
    >
      <Ionicons name="trash-outline" size={24} color="white" />
    </TouchableOpacity>
  );

  // Função para renderizar as ações de deslize à direita (excluir treino)
  const renderWorkoutRightActions = useCallback(() => {
    console.log(
      "renderWorkoutRightActions chamado, onDeleteWorkout existe:",
      !!onDeleteWorkout
    );

    if (!onDeleteWorkout) return null;

    return (
      <View style={styles.swipeActionContainer}>
        <TouchableOpacity
          style={[
            styles.swipeActionWorkout,
            { backgroundColor: colors.danger + "CC" },
          ]}
          onPress={async () => {
            console.log("Botão de excluir treino pressionado");
            await handleHapticFeedback();

            // Confirmar antes de excluir
            Alert.alert(
              "Excluir Treino",
              `Tem certeza que deseja excluir o treino "${workout.name}"?`,
              [
                {
                  text: "Cancelar",
                  style: "cancel",
                },
                {
                  text: "Excluir",
                  style: "destructive",
                  onPress: async () => {
                    console.log(
                      "Confirmação de exclusão aceita, chamando onDeleteWorkout com ID:",
                      workout.id
                    );
                    if (onDeleteWorkout) {
                      await onDeleteWorkout(workout.id);
                    }
                  },
                },
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={24} color="white" />
          <Text style={styles.swipeActionText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    );
  }, [colors.danger, onDeleteWorkout, handleHapticFeedback, workout]);

  // Cores para os indicadores de treino
  const weightColor = colors.danger || "#FF3B30"; // Vermelho para carga
  const repsColor = colors.primary || "#2196F3"; // Azul para repetições
  const setsColor = colors.success || "#4CAF50"; // Verde para séries

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
                      { backgroundColor: weightColor },
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
                      { backgroundColor: repsColor },
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
                      { backgroundColor: setsColor },
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
    <Swipeable
      renderRightActions={renderWorkoutRightActions}
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
            onPress={onPress}
            activeOpacity={0.7}
          >
            <View style={styles.workoutHeader}>
              <View style={styles.workoutTitleContainer}>
                <View
                  style={[
                    styles.workoutIconContainer,
                    { backgroundColor: workout.color },
                  ]}
                >
                  {/* Determinar qual biblioteca de ícones usar com base no nome */}
                  {workout.icon.includes("material-") ? (
                    <MaterialCommunityIcons
                      name={workout.icon.replace("material-", "") as any}
                      size={18}
                      color="white"
                    />
                  ) : workout.icon.includes("fa5-") ? (
                    <FontAwesome5
                      name={workout.icon.replace("fa5-", "") as any}
                      size={18}
                      color="white"
                    />
                  ) : (
                    <Ionicons
                      name={workout.icon as any}
                      size={18}
                      color="white"
                    />
                  )}
                </View>
                <View>
                  <Text style={[styles.workoutTitle, { color: colors.text }]}>
                    {workout.name}
                  </Text>
                  {exercises.length > 0 && (
                    <Text
                      style={[
                        styles.exerciseCount,
                        { color: colors.text + "70" },
                      ]}
                    >
                      {exercises.length}{" "}
                      {exercises.length === 1 ? "exercício" : "exercícios"}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.workoutStatsContainer}>
                <Text style={[styles.volumeValue, { color: workout.color }]}>
                  {formatVolume(workoutTotals.totalVolume)}
                </Text>
                <Text
                  style={[styles.volumeLabel, { color: colors.text + "70" }]}
                >
                  volume
                </Text>
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
          </View>

          <View style={styles.addButtonContainer}>
            <TouchableOpacity
              style={[styles.addButton, { borderColor: workout.color }]}
              onPress={(e) => {
                e.stopPropagation();
                handleHapticFeedback();
                // Navegar para a tela de adicionar exercício
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
      </MotiView>
    </Swipeable>
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
    borderRadius: 8,
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
    fontSize: 12,
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
  workoutStatsContainer: {
    alignItems: "flex-end",
  },
  volumeValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  volumeLabel: {
    fontSize: 11,
    marginTop: 2,
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
    marginBottom: 50, // Espaço para o botão
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
  addButtonContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
    zIndex: 1,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 70,
  },
  swipeActionContainer: {
    height: "100%",
    justifyContent: "center",
    overflow: "hidden",
  },
  swipeActionWorkout: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    backgroundColor: "rgba(255, 59, 48, 0.9)",
    paddingHorizontal: 10,
  },
  swipeActionText: {
    color: "white",
    fontSize: 10,
    marginTop: 4,
  },
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 70,
  },
});
