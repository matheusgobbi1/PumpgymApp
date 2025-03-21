import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { format } from "date-fns";
import { Exercise } from "../../context/WorkoutContext";

// Habilitar LayoutAnimation para Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface TrainingStatsCardProps {
  workoutTotals: {
    totalExercises: number;
    totalSets: number;
    totalVolume: number;
    totalDuration: number;
    avgWeight: number;
    maxWeight: number;
    avgReps: number;
    totalReps: number;
  };
  previousWorkoutTotals?: {
    totals: {
      totalExercises: number;
      totalSets: number;
      totalVolume: number;
      totalDuration: number;
      avgWeight: number;
      maxWeight: number;
      avgReps: number;
      totalReps: number;
    } | null;
    date: string | null;
  };
  workoutName: string;
  workoutColor: string;
  currentExercises: Exercise[];
  previousExercises?: Exercise[];
  notificationsEnabled?: boolean;
}

// Função auxiliar para substituir parseISO
const parseISODate = (dateString: string) => {
  return new Date(dateString);
};

export default function TrainingStatsCard({
  workoutTotals,
  previousWorkoutTotals,
  workoutName,
  workoutColor,
  currentExercises,
  previousExercises,
  notificationsEnabled = true,
}: TrainingStatsCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Verificar se os dados de treino estão disponíveis
    if (workoutTotals) {
      setIsLoading(false);
    }
  }, [workoutTotals]);

  const formatVolume = useCallback((volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
  }, []);

  const formatDuration = useCallback((minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
    }
    return `${minutes}m`;
  }, []);

  const calculateProgress = useCallback((current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  }, []);

  const getProgressColor = useCallback(
    (progress: number) => {
      if (progress >= 0 && progress <= 10) return colors.text + "80"; // Neutro
      if (progress > 10) return colors.success || "#4CAF50"; // Positivo
      return colors.danger || "#FF3B30"; // Negativo
    },
    [colors.text, colors.success, colors.danger]
  );

  const toggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  }, []);

  const renderStatRow = useCallback(
    (
      title: string,
      icon: string,
      current: number,
      previous: number | null,
      unit: string,
      formatter: (value: number) => string = (value) => value.toString()
    ) => {
      const hasPrevious = previous !== null && previous > 0;
      const progress = hasPrevious ? calculateProgress(current, previous) : 0;
      const progressColor = hasPrevious
        ? getProgressColor(progress)
        : colors.text + "80";
      const isExceeded = progress > 0;

      const displayProgress = Math.min(Math.abs(progress), 100);

      // Definir uma cor de fundo para o ícone mesmo quando é o primeiro treino
      const iconBackgroundColor = hasPrevious
        ? progressColor + "15"
        : colors.primary + "15"; // Usar a cor primária quando não há dados anteriores

      return (
        <MotiView
          key={`stat-${title}-${theme}`}
          style={styles.statRow}
          from={{ opacity: 0, translateX: -20 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{
            type: "spring",
            delay: title === "Volume Total" ? 100 : 200,
          }}
        >
          <View style={styles.statInfo}>
            <View style={styles.statHeader}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: iconBackgroundColor },
                ]}
              >
                <Ionicons
                  name={icon as any}
                  size={18}
                  color={hasPrevious ? progressColor : colors.primary}
                />
              </View>
              <View>
                <Text style={[styles.statTitle, { color: colors.text }]}>
                  {title}
                </Text>
                <Text style={[styles.comparison, { color: colors.text }]}>
                  {isLoading ? (
                    "Carregando..."
                  ) : hasPrevious ? (
                    isExceeded ? (
                      <>
                        Aumento{" "}
                        <Text
                          style={[
                            styles.comparisonValue,
                            { color: progressColor },
                          ]}
                        >
                          {Math.abs(Math.round(progress))}%
                        </Text>
                      </>
                    ) : (
                      <>
                        Redução{" "}
                        <Text
                          style={[
                            styles.comparisonValue,
                            { color: progressColor },
                          ]}
                        >
                          {Math.abs(Math.round(progress))}%
                        </Text>
                      </>
                    )
                  ) : (
                    "Primeiro treino"
                  )}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.progressWrapper}>
            <MotiView
              key={`progress-bar-${title}-${theme}`}
              style={[
                styles.progressBar,
                {
                  backgroundColor: colors.border,
                },
              ]}
            >
              {!isLoading && hasPrevious && (
                <MotiView
                  key={`progress-fill-${title}-${theme}`}
                  from={{ width: "0%" }}
                  animate={{ width: `${displayProgress}%` }}
                  transition={{ type: "timing", duration: 1000 }}
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: progressColor,
                    },
                  ]}
                />
              )}
            </MotiView>
            <Text style={[styles.progressText, { color: colors.text }]}>
              {isLoading
                ? "..."
                : `${formatter(current)}${unit}${
                    hasPrevious ? ` / ${formatter(previous)}${unit}` : ""
                  }`}
            </Text>
          </View>
        </MotiView>
      );
    },
    [
      calculateProgress,
      colors.text,
      colors.border,
      getProgressColor,
      isLoading,
      theme,
    ]
  );

  // Memoizar a comparação de exercícios para evitar recálculos desnecessários
  const exerciseComparison = useMemo(() => {
    if (!previousExercises || previousExercises.length === 0) {
      return (
        <View style={styles.noComparisonContainer}>
          <Text
            style={[styles.noComparisonText, { color: colors.text + "80" }]}
          >
            Não há exercícios do treino anterior para comparar.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.exercisesContainer}>
        <Text style={[styles.exercisesTitle, { color: colors.text }]}>
          Evolução por Exercício
        </Text>

        {currentExercises.map((currentExercise, index) => {
          const previousExercise = previousExercises.find(
            (ex) => ex.name.toLowerCase() === currentExercise.name.toLowerCase()
          );

          // Calcular estatísticas do exercício atual
          const currentSets = currentExercise.sets || [];
          const currentTotalSets = currentSets.length;
          let currentTotalReps = 0;
          let currentTotalWeight = 0;
          let currentMaxWeight = 0;

          currentSets.forEach((set) => {
            currentTotalReps += set.reps;
            currentTotalWeight += set.weight * set.reps;
            if (set.weight > currentMaxWeight) {
              currentMaxWeight = set.weight;
            }
          });

          // Calcular estatísticas do exercício anterior
          const previousSets = previousExercise?.sets || [];
          const previousTotalSets = previousSets.length;
          let previousTotalReps = 0;
          let previousTotalWeight = 0;
          let previousMaxWeight = 0;

          previousSets.forEach((set) => {
            previousTotalReps += set.reps;
            previousTotalWeight += set.weight * set.reps;
            if (set.weight > previousMaxWeight) {
              previousMaxWeight = set.weight;
            }
          });

          const volumeProgress =
            previousTotalWeight > 0
              ? ((currentTotalWeight - previousTotalWeight) /
                  previousTotalWeight) *
                100
              : 0;

          const progressColor = getProgressColor(volumeProgress);

          return (
            <MotiView
              key={`exercise-${currentExercise.id}-${index}`}
              style={[styles.exerciseCard, { backgroundColor: colors.card }]}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "spring", delay: index * 100 }}
            >
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseNameContainer}>
                  <View
                    style={[
                      styles.exerciseIconContainer,
                      { backgroundColor: workoutColor + "15" },
                    ]}
                  >
                    <Ionicons
                      name={
                        currentExercise.category === "cardio"
                          ? "fitness-outline"
                          : "barbell-outline"
                      }
                      size={16}
                      color={workoutColor}
                    />
                  </View>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>
                    {currentExercise.name}
                  </Text>
                </View>

                {previousExercise && volumeProgress !== 0 && (
                  <View
                    style={[
                      styles.exerciseProgressBadge,
                      { backgroundColor: progressColor + "15" },
                    ]}
                  >
                    <Ionicons
                      name={
                        volumeProgress > 0 ? "trending-up" : "trending-down"
                      }
                      size={14}
                      color={progressColor}
                    />
                    <Text
                      style={[
                        styles.exerciseProgressText,
                        { color: progressColor },
                      ]}
                    >
                      {Math.abs(Math.round(volumeProgress))}%
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.exerciseStatsGrid}>
                <View style={styles.exerciseStatItem}>
                  <Text
                    style={[styles.exerciseStatValue, { color: colors.text }]}
                  >
                    {currentTotalWeight}kg
                  </Text>
                  <Text
                    style={[
                      styles.exerciseStatLabel,
                      { color: colors.text + "80" },
                    ]}
                  >
                    Volume
                  </Text>
                  {previousTotalWeight > 0 && (
                    <Text
                      style={[
                        styles.exerciseStatPrevious,
                        { color: colors.text + "60" },
                      ]}
                    >
                      Anterior: {previousTotalWeight}kg
                    </Text>
                  )}
                </View>

                <View
                  style={[
                    styles.exerciseStatDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                <View style={styles.exerciseStatItem}>
                  <Text
                    style={[styles.exerciseStatValue, { color: colors.text }]}
                  >
                    {currentMaxWeight}kg
                  </Text>
                  <Text
                    style={[
                      styles.exerciseStatLabel,
                      { color: colors.text + "80" },
                    ]}
                  >
                    Carga Máx.
                  </Text>
                  {previousMaxWeight > 0 && (
                    <Text
                      style={[
                        styles.exerciseStatPrevious,
                        { color: colors.text + "60" },
                      ]}
                    >
                      Anterior: {previousMaxWeight}kg
                    </Text>
                  )}
                </View>

                <View
                  style={[
                    styles.exerciseStatDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                <View style={styles.exerciseStatItem}>
                  <Text
                    style={[styles.exerciseStatValue, { color: colors.text }]}
                  >
                    {currentTotalSets}×
                    {currentSets.length > 0
                      ? Math.round(currentTotalReps / currentTotalSets)
                      : 0}
                  </Text>
                  <Text
                    style={[
                      styles.exerciseStatLabel,
                      { color: colors.text + "80" },
                    ]}
                  >
                    Séries × Reps
                  </Text>
                  {previousTotalSets > 0 && (
                    <Text
                      style={[
                        styles.exerciseStatPrevious,
                        { color: colors.text + "60" },
                      ]}
                    >
                      Anterior: {previousTotalSets}×
                      {previousSets.length > 0
                        ? Math.round(previousTotalReps / previousTotalSets)
                        : 0}
                    </Text>
                  )}
                </View>
              </View>
            </MotiView>
          );
        })}
      </View>
    );
  }, [
    colors.text,
    colors.card,
    colors.border,
    workoutColor,
    currentExercises,
    previousExercises,
    getProgressColor,
  ]);

  const statsContainer = useMemo(
    () => (
      <View style={styles.statsContainer}>
        {renderStatRow(
          "Volume Total",
          "barbell-outline",
          workoutTotals.totalVolume,
          previousWorkoutTotals?.totals?.totalVolume || null,
          " kg",
          formatVolume
        )}
        {renderStatRow(
          "Carga Média",
          "speedometer-outline",
          workoutTotals.avgWeight,
          previousWorkoutTotals?.totals?.avgWeight || null,
          " kg"
        )}
        {renderStatRow(
          "Repetições",
          "repeat-outline",
          workoutTotals.avgReps,
          previousWorkoutTotals?.totals?.avgReps || null,
          " reps"
        )}
        {renderStatRow(
          "Séries",
          "layers-outline",
          workoutTotals.totalSets,
          previousWorkoutTotals?.totals?.totalSets || null,
          ""
        )}
      </View>
    ),
    [
      renderStatRow,
      workoutTotals.totalVolume,
      workoutTotals.avgWeight,
      workoutTotals.avgReps,
      workoutTotals.totalSets,
      previousWorkoutTotals?.totals,
      formatVolume,
    ]
  );

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={toggleExpand}>
      <MotiView
        key={`training-stats-card-${theme}`}
        style={[styles.container, { backgroundColor: colors.background }]}
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring" }}
      >
        <View style={styles.headerContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Estatísticas: {workoutName}
          </Text>

          {previousWorkoutTotals?.date && (
            <Text
              style={[styles.previousDateText, { color: colors.text + "80" }]}
            >
              Comparando com{" "}
              {format(parseISODate(previousWorkoutTotals.date), "dd/MM")}
            </Text>
          )}
        </View>

        {statsContainer}

        {isExpanded && (
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ type: "timing", duration: 300 }}
            style={styles.expandedContent}
          >
            {exerciseComparison}
          </MotiView>
        )}

        <View style={styles.expandHintContainer}>
          <Text style={[styles.expandHint, { color: colors.text + "60" }]}>
            {isExpanded ? "Toque para recolher" : "Toque para ver detalhes"}
          </Text>
        </View>
      </MotiView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 16,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  previousDateText: {
    fontSize: 12,
  },
  statsContainer: {
    gap: 20,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  statInfo: {
    flex: 1,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  comparison: {
    fontSize: 13,
    opacity: 0.8,
  },
  comparisonValue: {
    fontWeight: "600",
  },
  progressWrapper: {
    flex: 1,
    gap: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: "right",
    opacity: 0.8,
  },
  expandedContent: {
    marginTop: 16,
    overflow: "hidden",
  },
  expandHintContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  expandHint: {
    fontSize: 12,
    fontWeight: "500",
  },
  exercisesContainer: {
    gap: 12,
  },
  exercisesTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  exerciseCard: {
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  exerciseIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseProgressBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  exerciseProgressText: {
    fontSize: 12,
    fontWeight: "600",
  },
  exerciseStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  exerciseStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  exerciseStatValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  exerciseStatLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  exerciseStatPrevious: {
    fontSize: 11,
    textAlign: "center",
  },
  exerciseStatDivider: {
    width: 1,
    marginHorizontal: 12,
  },
  noComparisonContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  noComparisonText: {
    fontSize: 14,
    textAlign: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
});
