import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Exercise, ExerciseSet } from "../../context/WorkoutContext";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

// Função auxiliar para substituir parseISO
const parseISODate = (dateString: string) => {
  return new Date(dateString);
};

const { width } = Dimensions.get("window");

// Função para parsear parâmetros da URL
const parseUrlParams = (params: Record<string, any>) => {
  try {
    const currentExercisesData = params.currentExercises
      ? JSON.parse(params.currentExercises as string)
      : [];

    const previousExercisesData = params.previousExercises
      ? JSON.parse(params.previousExercises as string)
      : [];

    const workoutTotalsData = params.workoutTotals
      ? JSON.parse(params.workoutTotals as string)
      : null;

    const previousWorkoutTotalsData = params.previousWorkoutTotals
      ? JSON.parse(params.previousWorkoutTotals as string)
      : null;

    return {
      currentExercises: currentExercisesData,
      previousExercises: previousExercisesData,
      workoutTotals: workoutTotalsData,
      previousWorkoutTotals: previousWorkoutTotalsData,
    };
  } catch (error) {
    return {
      currentExercises: [],
      previousExercises: [],
      workoutTotals: null,
      previousWorkoutTotals: null,
    };
  }
};

export default function WorkoutStatsModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"resumo" | "exercicios">("resumo");

  // Parse dos parâmetros recebidos na navegação
  const workoutId = params.workoutId as string;
  const workoutName = params.workoutName as string;
  const workoutColor = params.workoutColor as string;

  // Parse de objetos complexos usando inicialização lazy
  const [parsedData] = useState(() => {
    const result = parseUrlParams(params);
    // Já terminamos o carregamento
    setTimeout(() => setIsLoading(false), 0);
    return result;
  });

  // Estados derivados do parsedData
  const currentExercises = parsedData.currentExercises;
  const previousExercises = parsedData.previousExercises;
  const workoutTotals = parsedData.workoutTotals;
  const previousWorkoutTotals = parsedData.previousWorkoutTotals;

  const formatVolume = useCallback((volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
  }, []);

  const calculateProgress = useCallback((current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  }, []);

  const getProgressColor = useCallback(
    (progress: number, isPositiveContext: boolean = false) => {
      // Lógica especial: se estiver em contexto positivo, usar cor de sucesso mesmo para valor negativo
      if (isPositiveContext) return colors.success || "#4CAF50";

      // Lógica padrão para outros casos
      if (progress > 0) return colors.success || "#4CAF50"; // Aumento (verde)
      if (progress == 0) return colors.text + "80"; // Sem alteração (cor de texto com opacidade)
      return colors.danger || "#FF3B30"; // Diminuição (vermelho)
    },
    [colors.text, colors.success, colors.danger]
  );

  // Componente para renderizar card de métrica
  const MetricCard = ({
    title,
    value,
    previousValue,
    icon,
    unit = "",
    formatter = (v: number) => v.toString(),
    isInverse = false,
  }: {
    title: string;
    value: number;
    previousValue: number | null;
    icon: any;
    unit?: string;
    formatter?: (value: number) => string;
    isInverse?: boolean;
  }) => {
    const hasPrevious = previousValue !== null && previousValue > 0;
    const progress = hasPrevious ? calculateProgress(value, previousValue) : 0;
    let displayProgress = isInverse ? -progress : progress;

    const progressColor = getProgressColor(displayProgress);
    const displayProgressAbs = Math.min(Math.abs(displayProgress), 100);

    const progressText = hasPrevious
      ? displayProgress > 0
        ? `+${Math.abs(Math.round(displayProgress))}%`
        : displayProgress < 0
        ? `${Math.round(displayProgress)}%`
        : t("training.stats.maintained")
      : t("training.stats.firstWorkout");

    return (
      <View style={[styles.metricCardNew, { backgroundColor: colors.card }]}>
        <View style={styles.metricCardHeader}>
          <View style={styles.metricTitleContainer}>
            <View
              style={[
                styles.metricIconNew,
                { backgroundColor: progressColor + "15" },
              ]}
            >
              <Ionicons name={icon} size={16} color={progressColor} />
            </View>
            <Text style={[styles.metricTitleNew, { color: colors.text }]}>
              {title}
            </Text>
          </View>

          {hasPrevious && (
            <View
              style={[
                styles.metricProgressBadge,
                { backgroundColor: progressColor + "15" },
              ]}
            >
              <Text
                style={[styles.metricProgressText, { color: progressColor }]}
              >
                {progressText}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.metricValueContainerNew}>
          <Text style={[styles.metricValueNew, { color: colors.text }]}>
            {formatter(value)}
            <Text style={styles.metricUnitNew}>{unit}</Text>
          </Text>

          {hasPrevious && (
            <Text
              style={[
                styles.metricPreviousValue,
                { color: colors.text + "50" },
              ]}
            >
              {t("training.stats.previous")}: {formatter(previousValue)}
              {unit}
            </Text>
          )}
        </View>

        {hasPrevious && (
          <View style={styles.metricProgressBarContainer}>
            <View
              style={[
                styles.metricProgressBarBg,
                { backgroundColor: colors.border + "30" },
              ]}
            >
              <View
                style={[
                  styles.metricProgressBarFill,
                  {
                    backgroundColor: progressColor,
                    width: `${displayProgressAbs}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  // Componente para renderizar linha de exercício
  const ExerciseRow = ({
    exercise,
    index,
  }: {
    exercise: Exercise;
    index: number;
  }) => {
    const previousExercise = previousExercises.find(
      (ex: Exercise) => ex.name.toLowerCase() === exercise.name.toLowerCase()
    );

    // Calcular estatísticas
    const currentSets = exercise.sets || [];
    const currentTotalSets = currentSets.length;
    let currentTotalReps = 0;
    let currentTotalWeight = 0;
    let currentMaxWeight = 0;
    const isBodyweightExercise =
      exercise.isBodyweightExercise ||
      (currentSets.length > 0 &&
        currentSets.every((set: { weight: number }) => set.weight === 0));

    currentSets.forEach((set: { reps: number; weight: number }) => {
      currentTotalReps += set.reps;
      // Não contar o peso para exercícios de peso corporal
      if (!isBodyweightExercise) {
        currentTotalWeight += set.weight * set.reps;
        if (set.weight > currentMaxWeight) {
          currentMaxWeight = set.weight;
        }
      }
    });

    const hasPrevious = !!previousExercise;

    // Calcular estatísticas do exercício anterior (se existir)
    let previousTotalSets = 0;
    let previousTotalReps = 0;
    let previousTotalWeight = 0;
    let previousMaxWeight = 0;
    let volumeProgress = 0;
    let maxWeightProgress = 0;

    if (hasPrevious) {
      const previousSets = previousExercise.sets || [];
      previousTotalSets = previousSets.length;
      const isPreviousBodyweight =
        previousExercise.isBodyweightExercise ||
        (previousSets.length > 0 &&
          previousSets.every((set: ExerciseSet) => set.weight === 0));

      previousSets.forEach((set: { reps: number; weight: number }) => {
        previousTotalReps += set.reps;
        // Não contar o peso para exercícios de peso corporal
        if (!isPreviousBodyweight) {
          previousTotalWeight += set.weight * set.reps;
          if (set.weight > previousMaxWeight) {
            previousMaxWeight = set.weight;
          }
        }
      });

      // Calcular progresso
      if (!isBodyweightExercise && !isPreviousBodyweight) {
        // Para exercícios que não são de peso corporal, calcular progresso normal
        volumeProgress =
          previousTotalWeight > 0
            ? calculateProgress(currentTotalWeight, previousTotalWeight)
            : 0;

        maxWeightProgress =
          previousMaxWeight > 0
            ? calculateProgress(currentMaxWeight, previousMaxWeight)
            : 0;
      } else if (isBodyweightExercise && isPreviousBodyweight) {
        // Para exercícios de peso corporal, o progresso é apenas baseado em repetições
        volumeProgress =
          previousTotalReps > 0
            ? calculateProgress(currentTotalReps, previousTotalReps)
            : 0;
        maxWeightProgress = 0; // Não há progresso de peso máximo para exercícios de peso corporal
      }
    }

    // Determinar a principal métrica de progresso
    const primaryProgress =
      maxWeightProgress > volumeProgress ? maxWeightProgress : volumeProgress;

    const progressColor = getProgressColor(primaryProgress);

    // Determinar ícone do exercício
    const exerciseIcon =
      exercise.category === "cardio" ? "fitness-outline" : "barbell-outline";

    // Determinar sufixo de progresso para valores
    const getProgressSuffix = (current: number, previous: number) => {
      if (!previous) return "";
      const progress = calculateProgress(current, previous);
      return progress > 0
        ? ` (+${Math.round(progress)}%)`
        : progress < 0
        ? ` (${Math.round(progress)}%)`
        : "";
    };

    // Formatar reps x sets
    const formatSetsReps = (sets: number, reps: number) => {
      const avgReps = reps / sets;
      return `${sets}×${avgReps > 0 ? Math.round(avgReps) : 0}`;
    };

    return (
      <View style={[styles.exerciseCardNew, { backgroundColor: colors.card }]}>
        {/* Cabeçalho do Card com Nome e Progresso */}
        <View style={styles.exerciseCardHeader}>
          <View style={styles.exerciseNameContainer}>
            <View
              style={[
                styles.exerciseIconNew,
                { backgroundColor: progressColor + "15" },
              ]}
            >
              <Ionicons name={exerciseIcon} size={16} color={progressColor} />
            </View>
            <Text
              style={[styles.exerciseNameNew, { color: colors.text }]}
              numberOfLines={1}
            >
              {exercise.name}
            </Text>
          </View>

          {hasPrevious && (
            <View
              style={[
                styles.progressBadgeNew,
                { backgroundColor: progressColor + "15" },
              ]}
            >
              <Text
                style={[styles.progressBadgeText, { color: progressColor }]}
              >
                {primaryProgress > 0
                  ? `+${Math.round(primaryProgress)}%`
                  : primaryProgress < 0
                  ? `${Math.round(primaryProgress)}%`
                  : t("training.stats.maintained")}
              </Text>
            </View>
          )}
        </View>

        {/* Separador */}
        <View
          style={[styles.separator, { backgroundColor: colors.border + "30" }]}
        />

        {/* Métricas Principais */}
        <View style={styles.metricsContainerNew}>
          {/* Peso Máximo */}
          <View style={styles.metricItemNew}>
            <View style={styles.metricTopRow}>
              <Text style={[styles.metricValueNew, { color: colors.text }]}>
                {currentMaxWeight}
                <Text style={styles.metricUnitNew}>kg</Text>
              </Text>
              {hasPrevious && maxWeightProgress !== 0 && (
                <Text
                  style={{
                    color: getProgressColor(maxWeightProgress),
                    fontSize: 12,
                    fontWeight: "500",
                  }}
                >
                  {maxWeightProgress > 0 ? "↑" : "↓"}
                </Text>
              )}
            </View>
            <Text
              style={[styles.metricLabelNew, { color: colors.text + "70" }]}
            >
              {t("training.stats.maxWeight")}
            </Text>
            {hasPrevious && (
              <Text
                style={[
                  styles.metricPreviousNew,
                  { color: colors.text + "50" },
                ]}
              >
                {previousMaxWeight}kg
              </Text>
            )}
          </View>

          {/* Volume */}
          <View style={styles.metricItemNew}>
            <View style={styles.metricTopRow}>
              <Text style={[styles.metricValueNew, { color: colors.text }]}>
                {currentTotalWeight}
                <Text style={styles.metricUnitNew}>kg</Text>
              </Text>
              {hasPrevious && volumeProgress !== 0 && (
                <Text
                  style={{
                    color: getProgressColor(volumeProgress),
                    fontSize: 12,
                    fontWeight: "500",
                  }}
                >
                  {volumeProgress > 0 ? "↑" : "↓"}
                </Text>
              )}
            </View>
            <Text
              style={[styles.metricLabelNew, { color: colors.text + "70" }]}
            >
              {t("training.stats.volume")}
            </Text>
            {hasPrevious && (
              <Text
                style={[
                  styles.metricPreviousNew,
                  { color: colors.text + "50" },
                ]}
              >
                {previousTotalWeight}kg
              </Text>
            )}
          </View>

          {/* Séries e Repetições */}
          <View style={styles.metricItemNew}>
            <Text style={[styles.metricValueNew, { color: colors.text }]}>
              {formatSetsReps(currentTotalSets, currentTotalReps)}
            </Text>
            <Text
              style={[styles.metricLabelNew, { color: colors.text + "70" }]}
            >
              {t("training.stats.seriesReps")}
            </Text>
            {hasPrevious && (
              <Text
                style={[
                  styles.metricPreviousNew,
                  { color: colors.text + "50" },
                ]}
              >
                {formatSetsReps(previousTotalSets, previousTotalReps)}
              </Text>
            )}
          </View>
        </View>

        {/* Barra de Progresso (apenas se houver dados anteriores) */}
        {hasPrevious && (
          <View style={styles.progressBarContainerNew}>
            <View
              style={[
                styles.progressBarBgNew,
                { backgroundColor: colors.border + "30" },
              ]}
            >
              <View
                style={[
                  styles.progressBarFillNew,
                  {
                    backgroundColor: progressColor,
                    width: `${Math.min(Math.abs(primaryProgress), 100)}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  // Header personalizado
  const ModalHeader = () => (
    <View style={[styles.modalHeader, { backgroundColor: colors.background }]}>
      <View style={styles.headerContent}>
        <View
          style={[
            styles.headerIconContainer,
            { backgroundColor: workoutColor + "30" },
          ]}
        >
          <Ionicons name="barbell-outline" size={24} color={workoutColor} />
        </View>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {workoutName}
          </Text>
          {previousWorkoutTotals?.date && (
            <Text style={[styles.headerDate, { color: colors.text + "70" }]}>
              {t("training.stats.comparingWith") +
                " " +
                format(parseISODate(previousWorkoutTotals.date), "dd/MM/yyyy")}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <TabBar />
    </View>
  );

  // Tabs de navegação
  const TabBar = () => (
    <View style={styles.tabBar}>
      <Pressable
        style={[
          styles.tabButton,
          activeTab === "resumo" && [
            styles.activeTab,
            { borderBottomColor: colors.primary },
          ],
        ]}
        onPress={() => setActiveTab("resumo")}
      >
        <Text
          style={[
            styles.tabText,
            {
              color:
                activeTab === "resumo" ? colors.primary : colors.text + "70",
            },
          ]}
        >
          {t("training.stats.summary")}
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.tabButton,
          activeTab === "exercicios" && [
            styles.activeTab,
            { borderBottomColor: colors.primary },
          ],
        ]}
        onPress={() => setActiveTab("exercicios")}
      >
        <Text
          style={[
            styles.tabText,
            {
              color:
                activeTab === "exercicios"
                  ? colors.primary
                  : colors.text + "70",
            },
          ]}
        >
          {t("training.stats.exercises")}
        </Text>
      </Pressable>
    </View>
  );

  // Conteúdo da aba de resumo
  const SummaryTab = useMemo(() => {
    if (!workoutTotals) return null;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.metricsGrid}>
          <MetricCard
            title={t("training.stats.totalVolume")}
            value={workoutTotals.totalVolume}
            previousValue={previousWorkoutTotals?.totals?.totalVolume || null}
            icon="barbell-outline"
            unit="kg"
            formatter={formatVolume}
          />

          <MetricCard
            title={t("training.stats.calories")}
            value={workoutTotals.caloriesBurned}
            previousValue={
              previousWorkoutTotals?.totals?.caloriesBurned || null
            }
            icon="flame-outline"
            unit=" kcal"
          />

          <MetricCard
            title={t("training.stats.maxWeight")}
            value={workoutTotals.maxWeight}
            previousValue={previousWorkoutTotals?.totals?.maxWeight || null}
            icon="trophy-outline"
            unit="kg"
          />

          <MetricCard
            title={t("training.stats.avgWeight")}
            value={workoutTotals.avgWeight}
            previousValue={previousWorkoutTotals?.totals?.avgWeight || null}
            icon="speedometer-outline"
            unit="kg"
          />

          <MetricCard
            title={t("training.stats.repetitions")}
            value={workoutTotals.totalReps}
            previousValue={previousWorkoutTotals?.totals?.totalReps || null}
            icon="repeat-outline"
          />

          <MetricCard
            title={t("training.stats.trainingDensity")}
            value={workoutTotals.trainingDensity}
            previousValue={
              previousWorkoutTotals?.totals?.trainingDensity || null
            }
            icon="timer-outline"
            formatter={(v) => v.toFixed(2)}
          />
        </View>
      </View>
    );
  }, [workoutTotals, previousWorkoutTotals, colors, t, formatVolume]);

  // Conteúdo da aba de exercícios
  const ExercisesTab = useMemo(() => {
    if (currentExercises.length === 0) return null;

    const hasAnyPreviousExercise =
      previousExercises && previousExercises.length > 0;

    return (
      <View style={styles.exercisesContainer}>
        <Text style={[styles.exercisesTitle, { color: colors.text }]}>
          {t("training.stats.evolutionByExercise")}
        </Text>

        {!hasAnyPreviousExercise && (
          <View
            style={[
              styles.noComparisonContainer,
              { backgroundColor: colors.card },
            ]}
          >
            <View
              style={[
                styles.infoIconContainer,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.noComparisonTextContainer}>
              <Text style={[styles.noComparisonTitle, { color: colors.text }]}>
                {t("training.stats.firstWorkout")}
              </Text>
              <Text
                style={[styles.noComparisonText, { color: colors.text + "70" }]}
              >
                {t("training.stats.firstWorkoutNoComparison", {
                  fallback:
                    "Faça mais treinos para ver a evolução ao longo do tempo.",
                })}
              </Text>
            </View>
          </View>
        )}

        {currentExercises.map((exercise: Exercise, index: number) => (
          <ExerciseRow
            key={`exercise-${exercise.id}-${index}`}
            exercise={exercise}
            index={index}
          />
        ))}
      </View>
    );
  }, [currentExercises, previousExercises, colors, t]);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <View
      style={[styles.modalContainer, { backgroundColor: colors.background }]}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <SafeAreaView style={styles.safeArea}>
        <ModalHeader />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "resumo" ? SummaryTab : ExercisesTab}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  modalHeader: {
    paddingTop: 12,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerDate: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 30,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  summaryContainer: {
    gap: 16,
  },
  metricsGrid: {
    gap: 12,
  },
  metricCardNew: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  metricCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  metricTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricIconNew: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  metricTitleNew: {
    fontSize: 15,
    fontWeight: "600",
  },
  metricProgressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metricProgressText: {
    fontSize: 12,
    fontWeight: "600",
  },
  metricValueContainerNew: {
    marginBottom: 12,
  },
  metricValueNew: {
    fontSize: 24,
    fontWeight: "700",
  },
  metricUnitNew: {
    fontSize: 18,
    fontWeight: "400",
  },
  metricPreviousValue: {
    fontSize: 12,
    marginTop: 4,
  },
  metricProgressBarContainer: {
    marginTop: 6,
  },
  metricProgressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  metricProgressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  exercisesContainer: {
    gap: 12,
  },
  exercisesTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  exerciseCardNew: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  exerciseCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  exerciseIconNew: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  exerciseNameNew: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  progressBadgeNew: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  separator: {
    height: 1,
    marginBottom: 12,
  },
  metricsContainerNew: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricItemNew: {
    flex: 1,
    alignItems: "center",
  },
  metricTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricLabelNew: {
    fontSize: 11,
    marginTop: 2,
  },
  metricPreviousNew: {
    fontSize: 10,
    marginTop: 4,
  },
  progressBarContainerNew: {
    marginTop: 12,
  },
  progressBarBgNew: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFillNew: {
    height: "100%",
    borderRadius: 2,
  },
  noComparisonContainer: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  noComparisonTextContainer: {
    flex: 1,
  },
  noComparisonTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  noComparisonText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
