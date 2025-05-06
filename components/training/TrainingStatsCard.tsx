import React, { useReducer, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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

// Definição do estado inicial e tipos para o reducer
type TrainingStatsState = {
  isLoading: boolean;
};

type TrainingStatsAction = { type: "SET_LOADING_STATE"; payload: boolean };

// Reducer para gerenciar o estado de carregamento
const trainingStatsReducer = (
  state: TrainingStatsState,
  action: TrainingStatsAction
): TrainingStatsState => {
  switch (action.type) {
    case "SET_LOADING_STATE":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

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
  workoutId,
}: TrainingStatsCardProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();

  // Substituindo useState por useReducer
  const [state, dispatch] = useReducer(trainingStatsReducer, {
    isLoading: !workoutTotals,
  });

  // Atualiza o estado de carregamento usando useMemo
  useMemo(() => {
    if (workoutTotals && state.isLoading) {
      dispatch({ type: "SET_LOADING_STATE", payload: false });
    }

    // Recalcular estatísticas quando as props mudarem
    if (!state.isLoading && workoutTotals && previousWorkoutTotals?.totals) {
      // A lógica aqui garante que o estado seja atualizado quando as props mudarem
      dispatch({ type: "SET_LOADING_STATE", payload: false });
    }
  }, [workoutTotals, previousWorkoutTotals, state.isLoading]);

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
      maxWeightProgress: number | null
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

  // Função para navegar para a tela de progressão (anteriormente navigateToDetailsScreen)
  const navigateToProgressionModal = useCallback(() => {
    // Navegação para a tela de progressão modal com os dados necessários
    if (!workoutId) {
      console.warn("Workout ID is missing, cannot navigate to progression modal.");
      // Adicionar um Haptic ou Alert aqui se necessário
      return;
    }
    router.push({
      pathname: "/progression-modal",
      params: {
        workoutId: workoutId,
        workoutName,
        workoutColor,
        // Não precisamos mais passar todos os totais e exercícios para o modal de progressão
      },
    });
  }, [router, workoutId, workoutName, workoutColor]);

  // Componente de linha de estatística memoizado
  const StatRowComponent = useMemo(() => {
    return (
      title: string,
      icon: string,
      current: number,
      previous: number | null,
      formatter: (value: number) => string = (value) => value.toString(),
      inverseProgress: boolean = false,
      index: number = 0
    ) => {
      const hasPrevious = previous !== null && previous > 0;
      const { avgWeightProgress, maxWeightProgress } = progressValues;

      // Analisa o contexto do progresso considerando outras métricas
      const { progress, isPositiveContext, message } = hasPrevious
        ? analyzeProgressContext(
            title,
            current,
            previous,
            avgWeightProgress,
            maxWeightProgress
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

      // Definir uma cor de fundo para o ícone
      const iconBackgroundColor =
        progressColor === colors.text + "80" || progressColor === colors.primary
          ? colors.accentGray + "20"
          : progressColor + "15";

      // Manter a cor original do ícone
      const iconColor = hasPrevious ? progressColor : colors.primary;

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
                <Ionicons name={icon as any} size={18} color={iconColor} />
              </View>
              <View>
                <Text style={[styles.statTitle, { color: colors.text }]}>
                  {title}
                </Text>
                <Text style={[styles.comparison, { color: colors.text }]}>
                  {state.isLoading ? (
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
              {!state.isLoading && hasPrevious && (
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
              {state.isLoading
                ? "..."
                : `${formatter(current)}${
                    hasPrevious ? `/${formatter(previous)}` : ""
                  }`}
            </Text>
          </View>
        </Animated.View>
      );
    };
  }, [
    analyzeProgressContext,
    getProgressColor,
    colors.border,
    colors.primary,
    colors.text,
    state.isLoading,
    t,
    theme,
    progressValues,
  ]);

  // Adicionar métricas importantes para a visualização de progresso
  const statsContainer = useMemo(() => {
    if (state.isLoading) return <View style={styles.statsContainer} />;

    const stats = [
      {
        title: t("training.stats.calories"),
        icon: "flame-outline",
        current: workoutTotals.caloriesBurned,
        previous: previousWorkoutTotals?.totals?.caloriesBurned || null,
        formatter: (value: number) => value.toString(),
      },
      {
        title: t("training.stats.avgWeight"),
        icon: "speedometer-outline",
        current: workoutTotals.avgWeight,
        previous: previousWorkoutTotals?.totals?.avgWeight || null,
        formatter: (value: number) => value.toString(),
      },
      {
        title: t("training.stats.totalVolume"),
        icon: "barbell-outline",
        current: workoutTotals.totalVolume,
        previous: previousWorkoutTotals?.totals?.totalVolume || null,
        formatter: formatVolume,
      },
      {
        title: t("training.stats.repetitions"),
        icon: "repeat-outline",
        current: workoutTotals.totalReps,
        previous: previousWorkoutTotals?.totals?.totalReps || null,
        formatter: (value: number) => value.toString(),
      },
    ];

    return (
      <Animated.View
        entering={FadeIn.duration(300).springify()}
        style={styles.statsContainer}
      >
        {stats.map((stat, index) =>
          StatRowComponent(
            stat.title,
            stat.icon,
            stat.current,
            stat.previous,
            stat.formatter,
            false,
            index
          )
        )}
      </Animated.View>
    );
  }, [
    StatRowComponent,
    state.isLoading,
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

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={navigateToProgressionModal}
      disabled={!workoutId}
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
