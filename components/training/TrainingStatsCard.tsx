import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeIn, FadeInRight, Layout } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { format } from "date-fns";
import { Exercise } from "../../context/WorkoutContext";
import { useTranslation } from "react-i18next";

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
    caloriesBurned: number;
    trainingDensity: number;
    avgRestTime: number;
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
      caloriesBurned: number;
      trainingDensity: number;
      avgRestTime: number;
    } | null;
    date: string | null;
  };
  workoutName: string;
  workoutColor: string;
  currentExercises: Exercise[];
  previousExercises?: Exercise[];
  notificationsEnabled?: boolean;
  workoutId?: string;
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
  workoutId,
}: TrainingStatsCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(!workoutTotals);
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();

  // Atualiza o estado de carregamento se a prop workoutTotals mudar
  if (workoutTotals && isLoading) {
    setIsLoading(false);
  }

  // Garantir que a análise de progresso seja atualizada corretamente
  useEffect(() => {
    // Recalcular estatísticas quando o componente montar ou quando as props mudarem
    if (!isLoading && workoutTotals && previousWorkoutTotals?.totals) {
      // A simples existência deste efeito garante que o componente será re-renderizado
      // quando as props mudarem, forçando a reanálise dos dados de progresso
      setIsLoading(false);
    }
  }, [isLoading, workoutTotals, previousWorkoutTotals]);

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

  // Pré-calcular os valores de progresso para métricas importantes
  const progressValues = useMemo(() => {
    if (!workoutTotals || !previousWorkoutTotals?.totals) {
      return {
        avgWeightProgress: null,
        maxWeightProgress: null,
        totalVolumeProgress: null,
        totalRepsProgress: null,
        densityProgress: null,
      };
    }

    return {
      avgWeightProgress: calculateProgress(
        workoutTotals.avgWeight,
        previousWorkoutTotals.totals.avgWeight
      ),
      maxWeightProgress: calculateProgress(
        workoutTotals.maxWeight,
        previousWorkoutTotals.totals.maxWeight
      ),
      totalVolumeProgress: calculateProgress(
        workoutTotals.totalVolume,
        previousWorkoutTotals.totals.totalVolume
      ),
      totalRepsProgress: calculateProgress(
        workoutTotals.totalReps,
        previousWorkoutTotals.totals.totalReps
      ),
      densityProgress: calculateProgress(
        workoutTotals.trainingDensity,
        previousWorkoutTotals.totals.trainingDensity
      ),
    };
  }, [workoutTotals, previousWorkoutTotals, calculateProgress]);

  // Analisa múltiplas métricas para detectar progresso na intensidade
  const analyzeProgressContext = useCallback(
    (
      title: string,
      current: number,
      previous: number | null,
      avgWeightProgress: number | null,
      maxWeightProgress: number | null,
      trainingDensityProgress: number | null
    ) => {
      if (!previous)
        return { progress: 0, isPositiveContext: false, message: "" };

      const progress = ((current - previous) / previous) * 100;

      // Caso específico para análise de volume quando há aumento de peso
      if (
        title === t("training.stats.totalVolume") &&
        progress < 0 && // Volume diminuiu
        avgWeightProgress !== null &&
        avgWeightProgress > 0 // Mas peso médio aumentou - qualquer aumento é significativo
      ) {
        return {
          progress: progress, // Mantém o valor real do progresso
          isPositiveContext: true, // Mas indica contexto positivo
          message: t("training.stats.intensityIncrease"),
        };
      }

      // Caso específico para análise de repetições quando há aumento de peso
      if (
        title === t("training.stats.repetitions") &&
        progress < 0 && // Repetições diminuíram
        ((avgWeightProgress !== null && avgWeightProgress > 0) || // Qualquer aumento no peso médio é significativo
          (maxWeightProgress !== null && maxWeightProgress > 0)) // Qualquer aumento no peso máximo é significativo
      ) {
        return {
          progress: progress,
          isPositiveContext: true,
          message: t("training.stats.strengthProgress"),
        };
      }

      // Caso específico para análise do tempo de descanso (um menor tempo de descanso é positivo)
      if (
        title === t("training.stats.restTime") &&
        progress < 0 // Tempo de descanso diminuiu
      ) {
        return {
          progress: Math.abs(progress), // Inverter para mostrar como positivo
          isPositiveContext: true,
          message: t("training.stats.intensityIncrease"),
        };
      }

      return {
        progress,
        isPositiveContext: false,
        message: "",
      };
    },
    [t]
  );

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

  const navigateToDetailsScreen = useCallback(() => {
    // Navegação para a tela de detalhes como modal com todos os dados necessários
    router.push({
      pathname: "/workout/stats",
      params: {
        workoutId: workoutId || "",
        workoutName,
        workoutColor,
        currentExercises: JSON.stringify(currentExercises),
        previousExercises: previousExercises
          ? JSON.stringify(previousExercises)
          : "",
        workoutTotals: JSON.stringify(workoutTotals),
        previousWorkoutTotals: previousWorkoutTotals
          ? JSON.stringify(previousWorkoutTotals)
          : "",
      },
    });
  }, [
    router,
    workoutId,
    workoutName,
    workoutColor,
    currentExercises,
    previousExercises,
    workoutTotals,
    previousWorkoutTotals,
  ]);

  const renderStatRow = useCallback(
    (
      title: string,
      icon: string,
      current: number,
      previous: number | null,
      unit: string,
      formatter: (value: number) => string = (value) => value.toString(),
      inverseProgress: boolean = false,
      index: number = 0
    ) => {
      const hasPrevious = previous !== null && previous > 0;
      const { avgWeightProgress, maxWeightProgress, densityProgress } =
        progressValues;

      // Analisa o contexto do progresso considerando outras métricas
      const { progress, isPositiveContext, message } = hasPrevious
        ? analyzeProgressContext(
            title,
            current,
            previous,
            avgWeightProgress,
            maxWeightProgress,
            densityProgress
          )
        : { progress: 0, isPositiveContext: false, message: "" };

      let displayProgress = progress;
      // Se for um progresso inverso (como tempo de descanso), inverte a lógica
      if (inverseProgress && hasPrevious) {
        displayProgress = -progress; // Para tempo de descanso, diminuir é bom
      }

      const progressColor = hasPrevious
        ? getProgressColor(displayProgress, isPositiveContext)
        : colors.text + "80";

      const isExceeded = displayProgress > 0;
      const isMaintained = displayProgress === 0;

      const displayProgressAbs = Math.min(Math.abs(displayProgress), 100);

      // Definir uma cor de fundo para o ícone mesmo quando é o primeiro treino
      const iconBackgroundColor = hasPrevious
        ? progressColor + "15"
        : colors.primary + "15"; // Usar a cor primária quando não há dados anteriores

      // Identificador único para cada linha de estatística
      const statKey = `stat-${title}-${theme}`;

      return (
        <Animated.View
          entering={FadeInRight.delay(index * 100)
            .duration(600)
            .springify()
            .withInitialValues({
              opacity: 0,
              transform: [{ translateX: 20 }],
            })}
          key={statKey}
          style={styles.statRow}
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
                    isMaintained ? (
                      <>
                        {t("training.stats.maintained", {
                          fallback: "Manteve",
                        })}{" "}
                        <Text
                          style={[
                            styles.comparisonValue,
                            { color: progressColor },
                          ]}
                        >
                          {Math.abs(Math.round(displayProgress))}%
                        </Text>
                      </>
                    ) : isExceeded ? (
                      <>
                        {inverseProgress && !isPositiveContext
                          ? t("training.stats.increase")
                          : !inverseProgress
                          ? t("training.stats.increase")
                          : t("training.stats.decrease")}{" "}
                        <Text
                          style={[
                            styles.comparisonValue,
                            { color: progressColor },
                          ]}
                        >
                          {Math.abs(Math.round(displayProgress))}%
                        </Text>
                      </>
                    ) : (
                      <>
                        {message ||
                          (inverseProgress && !isPositiveContext
                            ? t("training.stats.decrease")
                            : !inverseProgress
                            ? t("training.stats.decrease")
                            : t("training.stats.increase"))}{" "}
                        <Text
                          style={[
                            styles.comparisonValue,
                            { color: progressColor },
                          ]}
                        >
                          {Math.abs(Math.round(displayProgress))}%
                        </Text>
                      </>
                    )
                  ) : (
                    t("training.stats.firstWorkout")
                  )}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.progressWrapper}>
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: colors.border,
                },
              ]}
            >
              {!isLoading && hasPrevious && (
                <Animated.View
                  entering={FadeIn.delay(index * 100 + 300).duration(400)}
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: progressColor,
                      width: `${displayProgressAbs}%`,
                    },
                  ]}
                />
              )}
            </View>
            <Text style={[styles.progressText, { color: colors.text }]}>
              {isLoading
                ? "..."
                : `${formatter(current)}${unit}${
                    hasPrevious ? ` / ${formatter(previous)}${unit}` : ""
                  }`}
            </Text>
          </View>
        </Animated.View>
      );
    },
    [
      calculateProgress,
      analyzeProgressContext,
      getProgressColor,
      colors.border,
      colors.primary,
      colors.text,
      isLoading,
      t,
      theme,
      progressValues,
    ]
  );

  // Formatar tempo de descanso para exibição (segundos para texto)
  const formatRestTime = useCallback((seconds: number) => {
    return `${seconds}`;
  }, []);

  // Formatar densidade de treino para exibição (relação trabalho/descanso)
  const formatDensity = useCallback((density: number) => {
    return density.toFixed(2);
  }, []);

  // Adicionar métricas importantes para a visualização de progresso
  const statsContainer = useMemo(() => {
    if (isLoading) return <View style={styles.statsContainer} />;

    const stats = [
      {
        title: t("training.stats.calories"),
        icon: "flame-outline",
        current: workoutTotals.caloriesBurned,
        previous: previousWorkoutTotals?.totals?.caloriesBurned || null,
        unit: " kcal",
        formatter: (value: number) => value.toString(),
      },
      {
        title: t("training.stats.avgWeight"),
        icon: "speedometer-outline",
        current: workoutTotals.avgWeight,
        previous: previousWorkoutTotals?.totals?.avgWeight || null,
        unit: " kg",
        formatter: (value: number) => value.toString(),
      },
      {
        title: t("training.stats.totalVolume"),
        icon: "barbell-outline",
        current: workoutTotals.totalVolume,
        previous: previousWorkoutTotals?.totals?.totalVolume || null,
        unit: " kg",
        formatter: formatVolume,
      },
      {
        title: t("training.stats.repetitions"),
        icon: "repeat-outline",
        current: workoutTotals.totalReps,
        previous: previousWorkoutTotals?.totals?.totalReps || null,
        unit: "",
        formatter: (value: number) => value.toString(),
      },
    ];

    return (
      <Animated.View
        entering={FadeIn.duration(300).springify()}
        style={styles.statsContainer}
      >
        {stats.map((stat, index) =>
          renderStatRow(
            stat.title,
            stat.icon,
            stat.current,
            stat.previous,
            stat.unit,
            stat.formatter,
            false,
            index
          )
        )}
      </Animated.View>
    );
  }, [
    renderStatRow,
    isLoading,
    t,
    workoutTotals?.caloriesBurned,
    workoutTotals?.avgWeight,
    workoutTotals?.totalVolume,
    workoutTotals?.totalReps,
    previousWorkoutTotals?.totals?.caloriesBurned,
    previousWorkoutTotals?.totals?.avgWeight,
    previousWorkoutTotals?.totals?.totalVolume,
    previousWorkoutTotals?.totals?.totalReps,
    formatVolume,
  ]);

  const hasPreviousWorkout = previousExercises && previousExercises.length > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={navigateToDetailsScreen}
      disabled={false}
    >
      <Animated.View
        entering={FadeIn.duration(400).springify()}
        layout={Layout.springify()}
        key={`training-stats-card-${theme}`}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Animated.View
          entering={FadeInRight.duration(500).springify()}
          style={styles.headerContainer}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("training.stats.statistics")}: {workoutName}
          </Text>

          {previousWorkoutTotals?.date && (
            <Text
              style={[styles.previousDateText, { color: colors.text + "80" }]}
            >
              {t("training.stats.comparingWith")}{" "}
              {format(parseISODate(previousWorkoutTotals.date), "dd/MM")}
            </Text>
          )}
        </Animated.View>

        {statsContainer}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 30,
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
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
});
