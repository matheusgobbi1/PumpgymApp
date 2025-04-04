import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Pressable,
  ScrollView,
  FlatList,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { BarChart, LineChart } from "react-native-chart-kit";
import { format, subDays, isToday, isAfter, isBefore, isEqual } from "date-fns";
import * as Haptics from "expo-haptics";
import { useWorkoutContext } from "../../context/WorkoutContext";
import { Exercise } from "../../context/WorkoutContext";
import { WorkoutType } from "../../components/training/WorkoutConfigSheet";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import InfoModal, { InfoItem } from "../common/InfoModal";

/**
 * WorkoutProgressChart - Componente refatorado para exibir progresso de treinos
 *
 * Correções implementadas:
 * 1. Substituição de múltiplos useEffect por hooks mais apropriados para melhor previsibilidade
 * 2. Simplificação da lógica de atualização do gráfico
 * 3. Correção na seleção automática de exercícios ao mudar o tipo de gráfico
 * 4. Melhoria na lógica de filtragem de histórico por período
 * 5. Melhor sincronização entre mudança de tipo de gráfico e atualização dos dados
 * 6. Correção da interface para o modo calorias/volume que não estavam funcionando corretamente
 * 7. Resposta reativa às alterações no WorkoutContext (adição/remoção de exercícios)
 * 8. Correção do problema de não atualizar ao adicionar novos exercícios
 * 9. Melhor manipulação de estados vazios e estados de erro
 */

const { width } = Dimensions.get("window");

type ChartType = "weight" | "calories" | "volume";

// Período de visualização do histórico
type HistoryPeriod = "1m" | "6m" | "all";

/**
 * Props do componente WorkoutProgressChart
 */
interface WorkoutProgressChartProps {
  onPress: () => void; // Função para navegar para a tela de detalhes
  router?: any; // Router para navegação para outras telas
}

// Função para obter o ícone correto com base no tipo
const WorkoutIcon = ({
  iconType,
  size,
  color,
}: {
  iconType: any;
  size: number;
  color: string;
}) => {
  if (!iconType)
    return <Ionicons name="barbell-outline" size={size} color={color} />;

  try {
    // Verificar se é um ícone do MaterialCommunityIcons
    if (typeof iconType === "string") {
      if (iconType.startsWith("material:")) {
        const iconName = iconType.replace("material:", "");
        return (
          <MaterialCommunityIcons
            name={iconName as any}
            size={size}
            color={color}
          />
        );
      } else {
        return <Ionicons name={iconType as any} size={size} color={color} />;
      }
    }

    // Verificar o tipo de ícone
    if (iconType.type === "ionicons") {
      return <Ionicons name={iconType.name as any} size={size} color={color} />;
    } else if (iconType.type === "material") {
      return (
        <MaterialCommunityIcons
          name={iconType.name as any}
          size={size}
          color={color}
        />
      );
    } else if (iconType.type === "fontawesome") {
      return (
        <FontAwesome5 name={iconType.name as any} size={size} color={color} />
      );
    }
  } catch (error) {
    return <Ionicons name="barbell-outline" size={size} color={color} />;
  }

  return <Ionicons name="barbell-outline" size={size} color={color} />;
};

// Componente para o cartão de exercício
const ExerciseCard = ({
  exercise,
  prevExercise,
  chartType,
  index,
  colors,
  calculateMaxWeight,
  calculateTotalReps,
  calculateVolume,
  formatValue,
}: {
  exercise: Exercise;
  prevExercise?: Exercise;
  chartType: ChartType;
  index: number;
  colors: any;
  calculateMaxWeight: (exercise: Exercise) => number;
  calculateTotalReps: (exercise: Exercise) => number;
  calculateVolume: (exercise: Exercise) => number;
  formatValue: (value: number) => string;
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  let currentValue = 0;
  let previousValue = 0;

  if (chartType === "weight") {
    currentValue = calculateMaxWeight(exercise);
    previousValue = prevExercise ? calculateMaxWeight(prevExercise) : 0;
  } else if (chartType === "calories") {
    currentValue = calculateTotalReps(exercise);
    previousValue = prevExercise ? calculateTotalReps(prevExercise) : 0;
  } else {
    currentValue = calculateVolume(exercise);
    previousValue = prevExercise ? calculateVolume(prevExercise) : 0;
  }

  const percentChange =
    previousValue > 0
      ? ((currentValue - previousValue) / previousValue) * 100
      : 0;

  const isPositive = percentChange > 0;

  return (
    <View
      key={`exercise-${exercise.id}`}
      style={[
        styles.exerciseCard,
        {
          backgroundColor: colors.background,
          borderLeftWidth: 3,
          borderLeftColor: isPositive
            ? colors.success
            : percentChange < 0
            ? colors.danger
            : colors.primary,
        },
      ]}
    >
      <View style={styles.exerciseCardHeader}>
        <Text
          style={[styles.exerciseName, { color: colors.text }]}
          numberOfLines={1}
        >
          {exercise.name}
        </Text>
        <Text
          style={[
            styles.exerciseChange,
            {
              color: isPositive
                ? colors.success
                : percentChange < 0
                ? colors.danger
                : colors.text + "60",
            },
          ]}
        >
          {isPositive ? "+" : ""}
          {percentChange.toFixed(1)}%
        </Text>
      </View>
      <Text style={[styles.exerciseValue, { color: colors.text }]}>
        {formatValue(currentValue)}
      </Text>
    </View>
  );
};

// Interface para armazenar dados históricos de treino
interface WorkoutHistoryData {
  date: string;
  value: number;
}

// Função auxiliar para substituir eachDayOfInterval
const getDaysInRange = (startDate: Date, endDate: Date) => {
  const days = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
};

// Função auxiliar para substituir parseISO
const parseISODate = (dateString: string) => {
  return new Date(dateString);
};

export default function WorkoutProgressChart({
  onPress,
  router,
}: WorkoutProgressChartProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();
  const {
    workouts,
    workoutTypes,
    getExercisesForWorkout,
    getWorkoutTotals,
    getPreviousWorkoutTotals,
    getWorkoutTypeById,
    getWorkoutsForDate,
  } = useWorkoutContext();

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedChartType, setSelectedChartType] =
    useState<ChartType>("weight");
  const [selectedHistoryPeriod, setSelectedHistoryPeriod] =
    useState<HistoryPeriod>("1m");
  const [todayWorkout, setTodayWorkout] = useState<{
    id: string;
    name: string;
    iconType: any;
    color: string;
  } | null>(null);
  const [todayExercises, setTodayExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [workoutHistory, setWorkoutHistory] = useState<{
    [exerciseId: string]: WorkoutHistoryData[];
  }>({});
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: {
      data: number[];
      color?: (opacity?: number) => string;
      strokeWidth?: number;
    }[];
  }>({
    labels: [],
    datasets: [{ data: [] }],
  });

  // Substituir isLoadingRef por estado para melhor previsibilidade
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Adicionando estado para controlar a visibilidade do modal de informações
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  // Verificar se há exercícios para mostrar
  const hasExercises = useMemo(
    () => Array.isArray(todayExercises) && todayExercises.length > 0,
    [todayExercises]
  );

  // Altura constante para evitar o efeito de "piscada"
  const fixedHeight = !hasExercises ? 190 : 260;

  // Memoizar as funções de cálculo para evitar recriações
  const calculateVolume = useCallback((exercise: Exercise) => {
    if (!exercise.sets) return 0;

    return exercise.sets.reduce((total, set) => {
      return total + set.weight * set.reps;
    }, 0);
  }, []);

  const calculateMaxWeight = useCallback((exercise: Exercise) => {
    if (!exercise.sets || exercise.sets.length === 0) return 0;
    return Math.max(...exercise.sets.map((set) => set.weight));
  }, []);

  const calculateTotalReps = useCallback((exercise: Exercise) => {
    if (!exercise.sets) return 0;

    return exercise.sets.reduce((total, set) => {
      return total + set.reps;
    }, 0);
  }, []);

  // Função para resetar o estado para valores iniciais
  const resetState = useCallback(() => {
    setTodayWorkout(null);
    setTodayExercises([]);
    setWorkoutHistory({});
    setSelectedExercise(null);
    setChartData({
      labels: [],
      datasets: [{ data: [] }],
    });
  }, []);

  // Memoizar a função para filtrar histórico por período
  const filterHistoryByPeriod = useCallback(
    (history: WorkoutHistoryData[]) => {
      // Usar abordagem mais segura para data atual
      const today = new Date();

      let cutoffDate: Date;

      switch (selectedHistoryPeriod) {
        case "1m":
          cutoffDate = subDays(today, 30);
          break;
        case "6m":
          cutoffDate = subDays(today, 180);
          break;
        default:
          // Para "all", usar uma data bem antiga para incluir tudo
          cutoffDate = new Date(2000, 0, 1);
      }

      return (history || []).filter((item) => {
        const itemDate = parseISODate(item.date);
        return isAfter(itemDate, cutoffDate) || isEqual(itemDate, cutoffDate);
      });
    },
    [selectedHistoryPeriod]
  );

  // Memoizar a função getExerciseHistory
  const getExerciseHistory = useCallback(
    async (
      exerciseName: string,
      workoutTypeId: string
    ): Promise<WorkoutHistoryData[]> => {
      const history: WorkoutHistoryData[] = [];
      if (!workouts) return history;

      // Casos especiais para calorias_total e volume_total
      const isCaloriesTotal = exerciseName === "calories_total";
      const isVolumeTotal = exerciseName === "volume_total";

      // Percorrer todos os treinos registrados
      for (const date in workouts) {
        // Verificar se o tipo de treino existe para esta data
        if (workouts[date] && workouts[date][workoutTypeId]) {
          const exercisesForDate = workouts[date][workoutTypeId];
          if (!exercisesForDate) continue;

          if (isCaloriesTotal) {
            // Para calorias, calculamos o total do treino inteiro
            let totalCalories = 0;

            // Calcular calorias totais para esse treino específico
            exercisesForDate.forEach((ex) => {
              // Para exercícios de cardio
              if (ex.category === "cardio" && ex.cardioDuration) {
                const metValue = 8.0; // Valor médio para cardio
                const weightInKg = 70; // Peso médio em kg
                const durationInMinutes = ex.cardioDuration;

                const caloriesForCardio =
                  ((metValue * 3.5 * weightInKg) / 200) * durationInMinutes;
                totalCalories += caloriesForCardio;
              }

              // Para exercícios de força
              if (ex.sets && ex.sets.length > 0) {
                // Estimar duração para exercícios de força (2 minutos por série)
                const metValue = 5.0; // Valor médio para treinamento com pesos
                const weightInKg = 70; // Peso médio

                ex.sets.forEach(() => {
                  const durationInMinutes = 2; // Tempo médio por série
                  const caloriesForSet =
                    0.0175 * metValue * weightInKg * durationInMinutes;
                  totalCalories += caloriesForSet;
                });
              }
            });

            history.push({
              date,
              value: Math.round(totalCalories),
            });
          } else if (isVolumeTotal) {
            // Para volume total, somamos o volume de todos os exercícios do treino
            let totalVolume = 0;

            exercisesForDate.forEach((ex) => {
              if (ex.sets) {
                totalVolume += ex.sets.reduce((sum, set) => {
                  return sum + set.weight * set.reps;
                }, 0);
              }
            });

            history.push({
              date,
              value: totalVolume,
            });
          } else {
            // Para peso máximo, encontrar o exercício específico
            const exercise = exercisesForDate.find(
              (ex) =>
                ex &&
                ex.name &&
                ex.name.toLowerCase() === exerciseName.toLowerCase()
            );

            if (exercise) {
              // Calcular o valor com base no tipo de gráfico selecionado
              let value = calculateMaxWeight(exercise);
              history.push({
                date,
                value,
              });
            }
          }
        }
      }

      // Ordenar por data (mais antiga primeiro)
      return history.sort((a, b) => {
        const dateA = parseISODate(a.date);
        const dateB = parseISODate(b.date);
        return dateA.getTime() - dateB.getTime();
      });
    },
    [workouts, calculateMaxWeight]
  );

  // Memoizar a função para atualizar os dados do gráfico
  const updateChartData = useCallback(() => {
    // Determinar qual histórico usar baseado no tipo de gráfico
    let historyToUse: WorkoutHistoryData[] = [];
    let historyKey = "";

    // Lógica simplificada e centralizada para determinar qual gráfico mostrar
    if (selectedChartType === "calories") {
      historyKey = "calories_total";
    } else if (selectedChartType === "volume") {
      historyKey = "volume_total";
    } else if (selectedExercise) {
      historyKey = selectedExercise.id;
    }

    historyToUse = workoutHistory[historyKey] || [];
    const filteredHistory = filterHistoryByPeriod(historyToUse);

    if (filteredHistory.length === 0) {
      setChartData({
        labels: [],
        datasets: [{ data: [0] }],
      });
      return;
    }

    // Preparar dados para o gráfico
    const labels = filteredHistory.map((item) => {
      const date = parseISODate(item.date);
      return format(date, "dd/MM");
    });

    // Limitar o número de labels para evitar sobreposição
    const maxLabels = 6;
    const finalLabels =
      labels.length <= maxLabels
        ? labels
        : labels.filter(
            (_, i) =>
              i === 0 ||
              i === labels.length - 1 ||
              i % Math.ceil(labels.length / maxLabels) === 0
          );

    const values = filteredHistory.map((item) => item.value);

    setChartData({
      labels: finalLabels,
      datasets: [
        {
          data: values.length > 0 ? values : [0],
          color: () => colors.primary,
          strokeWidth: 2,
        },
      ],
    });
  }, [
    selectedExercise,
    workoutHistory,
    selectedHistoryPeriod,
    filterHistoryByPeriod,
    colors.primary,
    selectedChartType,
  ]);

  // Função para inicializar os dados
  const initData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Obter a data de hoje formatada
      const today = new Date();
      const todayFormatted = format(today, "yyyy-MM-dd");

      // Obter os treinos de hoje
      const todaysWorkouts = getWorkoutsForDate(todayFormatted);

      // Se não houver treinos, resetar o estado
      if (!todaysWorkouts || Object.keys(todaysWorkouts).length === 0) {
        resetState();
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      // Verificar se há treinos para hoje
      // Pegar o primeiro treino do dia
      const workoutId = Object.keys(todaysWorkouts)[0];

      // Obter o tipo de treino
      const workoutType = getWorkoutTypeById(workoutId);

      if (workoutType) {
        setTodayWorkout({
          id: workoutId,
          name: workoutType.name,
          iconType: workoutType.iconType,
          color: workoutType.color,
        });

        // Obter exercícios para este treino
        const exercisesForWorkout = getExercisesForWorkout(workoutId);

        if (exercisesForWorkout && exercisesForWorkout.length > 0) {
          setTodayExercises(exercisesForWorkout);

          // Carregar histórico de treinos para cada exercício
          const history: { [exerciseId: string]: WorkoutHistoryData[] } = {};

          // Para cada exercício, buscar seu histórico
          for (const exercise of exercisesForWorkout) {
            if (exercise && exercise.id) {
              history[exercise.id] = await getExerciseHistory(
                exercise.name,
                workoutId
              );
            }
          }

          // Adicionar histórico específico para calorias e volume
          if (exercisesForWorkout[0]) {
            // Criar históricos especiais para calorias e volume
            const caloriesHistory = await getExerciseHistory(
              "calories_total",
              workoutId
            );
            const volumeHistory = await getExerciseHistory(
              "volume_total",
              workoutId
            );

            // Adicionar ao histórico com IDs especiais
            history["calories_total"] = caloriesHistory;
            history["volume_total"] = volumeHistory;
          }

          // Atualizar o estado com o histórico carregado
          setWorkoutHistory(history);

          // Definir o exercício selecionado com base no tipo de gráfico atual
          if (selectedChartType === "calories") {
            const virtualExercise: Exercise = {
              id: "calories_total",
              name: t("training.stats.calories"),
              sets: [],
            };
            setSelectedExercise(virtualExercise);
          } else if (selectedChartType === "volume") {
            const virtualExercise: Exercise = {
              id: "volume_total",
              name: t("training.stats.totalVolume"),
              sets: [],
            };
            setSelectedExercise(virtualExercise);
          } else {
            // Para weight, não selecionamos nenhum exercício automaticamente
            setSelectedExercise(null);
          }
        } else {
          // Se não houver exercícios, resetar para estado sem exercícios
          setTodayExercises([]);
          setWorkoutHistory({});
          setSelectedExercise(null);
          setChartData({
            labels: [],
            datasets: [{ data: [] }],
          });
        }
      } else {
        // Se não houver tipo de treino, resetar o estado
        resetState();
      }
    } catch (error) {
      resetState();
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [
    getWorkoutsForDate,
    getWorkoutTypeById,
    getExercisesForWorkout,
    getExerciseHistory,
    t,
    selectedChartType,
    resetState,
    workouts,
  ]);

  // Inicializar dados na montagem do componente
  useEffect(() => {
    if (!isInitialized) {
      initData();
    }
  }, [isInitialized, initData]);

  // Atualizar o gráfico quando dados relevantes mudarem
  useEffect(() => {
    if (isInitialized) {
      updateChartData();
    }
  }, [
    isInitialized,
    updateChartData,
    selectedChartType,
    selectedHistoryPeriod,
    selectedExercise,
    workoutHistory,
  ]);

  // Adicionar um efeito para reinicializar os dados quando os workouts mudarem
  useEffect(() => {
    if (isInitialized) {
      // Forçar a reinicialização dos dados quando workouts mudar
      initData();
    }
  }, [workouts, isInitialized, initData]);

  // Função para alternar entre expandido e recolhido
  const toggleExpand = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  // Função para formatar valores com base no tipo de gráfico
  const formatValue = useCallback(
    (value: number) => {
      if (selectedChartType === "weight") {
        return `${value} ${t("common.measurements.kg")}`;
      } else if (selectedChartType === "calories") {
        return `${value} ${t("common.nutrition.kcal")}`;
      } else if (selectedChartType === "volume") {
        return `${value} ${t("common.measurements.kg")}`;
      } else {
        return `${value}`;
      }
    },
    [selectedChartType, t]
  );

  // Título do gráfico com base no tipo selecionado
  const getChartTitle = useCallback(() => {
    if (selectedChartType === "weight") {
      return t("training.stats.progress");
    } else if (selectedChartType === "calories") {
      return t("training.stats.calories");
    } else {
      return t("training.stats.totalVolume");
    }
  }, [selectedChartType, t]);

  // Função para mudar o período de histórico com feedback tátil
  const changeHistoryPeriod = useCallback((period: HistoryPeriod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedHistoryPeriod(period);
  }, []);

  // Função para selecionar um exercício específico
  const handleSelectExercise = useCallback(
    (exercise: Exercise | null) => {
      // Se o exercício clicado já está selecionado, deseleciona
      if (selectedExercise?.id === exercise?.id) {
        setSelectedExercise(null);
      } else {
        setSelectedExercise(exercise);
      }

      // Feedback tátil
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [selectedExercise]
  );

  // Função para mudar o tipo de gráfico
  const changeChartType = useCallback(
    (type: ChartType) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Atualizar o tipo de gráfico
      setSelectedChartType(type);

      // IMPORTANTE: Selecionar o exercício apropriado com base no novo tipo
      // Esta parte evita a confusão quando alternar entre diferentes tipos de gráfico
      if (type === "calories") {
        const caloriesExercise: Exercise = {
          id: "calories_total",
          name: t("training.stats.calories"),
          sets: [],
        };
        setSelectedExercise(caloriesExercise);
      } else if (type === "volume") {
        const volumeExercise: Exercise = {
          id: "volume_total",
          name: t("training.stats.totalVolume"),
          sets: [],
        };
        setSelectedExercise(volumeExercise);
      } else if (type === "weight") {
        // Para tipo weight, não selecionamos nenhum exercício automaticamente
        setSelectedExercise(null);
      }
    },
    [t, todayExercises]
  );

  // Abrir o modal de informações
  const openInfoModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInfoModalVisible(true);
  }, []);

  // Preparar itens de informações para o modal
  const workoutInfoItems = useMemo<InfoItem[]>(
    () => [
      {
        title: t("home.workout.progressInfo.overview.title"),
        description: t("home.workout.progressInfo.overview.description"),
        icon: "analytics-outline",
        iconType: "ionicons",
        color: colors.primary,
      },
      {
        title: t("home.workout.progressInfo.weight.title"),
        description: t("home.workout.progressInfo.weight.description"),
        icon: "barbell-outline",
        iconType: "ionicons",
        color: colors.success,
      },
      {
        title: t("home.workout.progressInfo.volume.title"),
        description: t("home.workout.progressInfo.volume.description"),
        icon: "stats-chart-outline",
        iconType: "ionicons",
        color: colors.warning,
      },
      {
        title: t("home.workout.progressInfo.filters.title"),
        description: t("home.workout.progressInfo.filters.description"),
        icon: "filter-outline",
        iconType: "ionicons",
        color: colors.danger,
      },
      {
        title: t("home.workout.progressInfo.tips.title"),
        description: t("home.workout.progressInfo.tips.description"),
        icon: "bulb-outline",
        iconType: "ionicons",
        color: colors.info,
      },
    ],
    [t, colors]
  );

  // Renderizar cada exercício na lista
  const renderExerciseItem = useCallback(
    ({ item: exercise, index }: { item: Exercise; index: number }) => {
      if (!exercise || !todayWorkout) return null;

      // Calcular a porcentagem de progresso
      let currentValue = 0;
      let previousValue = 0;

      const previousWorkoutData = getPreviousWorkoutTotals(
        todayWorkout?.id || ""
      );

      // Encontrar o exercício correspondente no treino anterior
      const previousExercise = previousWorkoutData.date
        ? workouts[previousWorkoutData.date]?.[todayWorkout?.id || ""]?.find(
            (ex) => ex.name.toLowerCase() === exercise.name.toLowerCase()
          )
        : undefined;

      if (selectedChartType === "weight") {
        currentValue = calculateMaxWeight(exercise);
        previousValue = previousExercise
          ? calculateMaxWeight(previousExercise)
          : 0;
      } else if (selectedChartType === "volume") {
        currentValue = calculateVolume(exercise);
        previousValue = previousExercise
          ? calculateVolume(previousExercise)
          : 0;
      } else {
        // Para calorias, isso é tratado na renderização condicional
        currentValue = calculateTotalReps(exercise);
        previousValue = previousExercise
          ? calculateTotalReps(previousExercise)
          : 0;
      }

      // Calcular a mudança percentual apenas se houver um valor anterior
      let percentChange = 0;
      let hasChange = false;

      if (previousValue > 0) {
        percentChange = ((currentValue - previousValue) / previousValue) * 100;
        hasChange = true;
      }

      const isPositive = percentChange > 0;
      const isNegative = percentChange < 0;

      return (
        <TouchableOpacity
          onPress={() => handleSelectExercise(exercise)}
          style={[
            styles.exerciseCardTouchable,
            { backgroundColor: colors.card },
            selectedExercise?.id === exercise.id && {
              borderColor: colors.primary,
              backgroundColor: colors.primary + "10",
            },
          ]}
        >
          <View style={styles.exerciseCard}>
            <View style={styles.exerciseCardHeader}>
              <Text
                style={[styles.exerciseName, { color: colors.text }]}
                numberOfLines={1}
              >
                {exercise.name}
              </Text>
              {hasChange ? (
                <Text
                  style={[
                    styles.exerciseChange,
                    {
                      color: isPositive
                        ? colors.success
                        : isNegative
                        ? colors.danger
                        : colors.text + "60",
                    },
                  ]}
                >
                  {isPositive ? "+" : ""}
                  {Math.abs(percentChange).toFixed(1)}%
                </Text>
              ) : (
                <Text
                  style={[styles.exerciseChange, { color: colors.text + "60" }]}
                >
                  Novo
                </Text>
              )}
            </View>
            <Text style={[styles.exerciseValue, { color: colors.text }]}>
              {formatValue(currentValue)}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [
      todayWorkout,
      workouts,
      selectedChartType,
      selectedExercise,
      colors,
      getPreviousWorkoutTotals,
      calculateMaxWeight,
      calculateTotalReps,
      calculateVolume,
      handleSelectExercise,
      formatValue,
    ]
  );

  // Renderizar a lista de exercícios em lista horizontal
  const renderExerciseList = useMemo(() => {
    // Se não houver exercícios ou estiver carregando, não renderizar nada
    if (!todayExercises || todayExercises.length === 0 || !isInitialized)
      return null;

    // Se não tiver contexto de treino para mostrar, não renderizar nada
    if (!todayWorkout) return null;

    return (
      <View style={styles.exerciseListContainer}>
        <View style={styles.exerciseListHeader}>
          <Text style={[styles.exerciseListTitle, { color: colors.text }]}>
            {selectedChartType === "calories"
              ? t("home.workout.burnedCalories")
              : selectedChartType === "volume"
              ? t("home.workout.totalVolume")
              : t("home.workout.selectToSeeProgress")}
          </Text>
        </View>
        {selectedChartType === "calories" || selectedChartType === "volume" ? (
          <View style={{ paddingHorizontal: 4 }}>
            <View
              style={[
                styles.exerciseCardTouchable,
                {
                  width: "100%",
                  borderColor: colors.primary,
                  backgroundColor: colors.primary + "10",
                },
              ]}
            >
              <View style={[styles.exerciseCard, { width: "100%" }]}>
                <View style={styles.exerciseCardHeader}>
                  <Text
                    style={[styles.exerciseName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {selectedChartType === "calories"
                      ? t("home.workout.totalCalories")
                      : t("home.workout.totalVolumeTitle")}
                  </Text>

                  {/* Mostrar comparação com treino anterior */}
                  {(() => {
                    const currentValue =
                      selectedChartType === "calories"
                        ? getWorkoutTotals(todayWorkout.id).caloriesBurned
                        : getWorkoutTotals(todayWorkout.id).totalVolume;

                    const previousWorkoutData = getPreviousWorkoutTotals(
                      todayWorkout.id
                    );

                    const previousValue = previousWorkoutData.totals
                      ? selectedChartType === "calories"
                        ? previousWorkoutData.totals.caloriesBurned
                        : previousWorkoutData.totals.totalVolume
                      : 0;

                    // Calcular percentual de mudança
                    let percentChange = 0;
                    let hasChange = false;

                    if (previousValue > 0) {
                      percentChange =
                        ((currentValue - previousValue) / previousValue) * 100;
                      hasChange = true;
                    }

                    const isPositive = percentChange > 0;
                    const isNegative = percentChange < 0;

                    return hasChange ? (
                      <Text
                        style={[
                          styles.exerciseChange,
                          {
                            color: isPositive
                              ? colors.success
                              : isNegative
                              ? colors.danger
                              : colors.text + "60",
                          },
                        ]}
                      >
                        {isPositive ? "+" : ""}
                        {Math.abs(percentChange).toFixed(1)}%
                      </Text>
                    ) : (
                      <Text
                        style={[
                          styles.exerciseChange,
                          { color: colors.text + "60" },
                        ]}
                      >
                        {t("home.workout.new")}
                      </Text>
                    );
                  })()}
                </View>
                <Text
                  style={[
                    styles.exerciseValue,
                    { color: colors.text, fontSize: 20 },
                  ]}
                >
                  {formatValue(
                    selectedChartType === "calories"
                      ? getWorkoutTotals(todayWorkout.id).caloriesBurned
                      : getWorkoutTotals(todayWorkout.id).totalVolume
                  )}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <FlatList
            data={todayExercises}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.exerciseListContent}
            keyExtractor={(item) => `exercise-${item?.id || "unknown"}`}
            renderItem={renderExerciseItem}
          />
        )}
      </View>
    );
  }, [
    todayExercises,
    colors.text,
    renderExerciseItem,
    isInitialized,
    todayWorkout,
    selectedChartType,
    selectedExercise,
    colors.card,
    colors.primary,
    getWorkoutTotals,
    getPreviousWorkoutTotals,
    formatValue,
  ]);

  // Renderização - usar um container com altura fixa para evitar a piscada
  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.light,
            height: isExpanded ? "auto" : fixedHeight,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Adicionar o componente InfoModal */}
        <InfoModal
          visible={infoModalVisible}
          title={t("home.workout.progressInfo.title")}
          subtitle={t("home.workout.progressInfo.subtitle")}
          infoItems={workoutInfoItems}
          onClose={() => setInfoModalVisible(false)}
          topIcon={{
            name: "fitness",
            type: "ionicons",
            color: colors.primary,
            backgroundColor: colors.primary + "20",
          }}
        />

        <Pressable
          style={styles.pressableArea}
          onPress={isInitialized && hasExercises ? toggleExpand : undefined}
          android_ripple={
            hasExercises
              ? {
                  color: colors.text + "10",
                  borderless: true,
                }
              : null
          }
        >
          {isInitialized ? (
            <>
              <View style={styles.header}>
                <View style={styles.titleContainer}>
                  {todayWorkout ? (
                    <View
                      style={[
                        styles.iconContainer,
                        {
                          backgroundColor:
                            todayWorkout.color + "20" || colors.primary + "20",
                        },
                      ]}
                    >
                      <WorkoutIcon
                        iconType={todayWorkout.iconType}
                        size={18}
                        color={todayWorkout.color || colors.primary}
                      />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.iconContainer,
                        {
                          backgroundColor: colors.danger + "20",
                        },
                      ]}
                    >
                      <Ionicons
                        name="alert-circle-outline"
                        size={18}
                        color={colors.danger}
                      />
                    </View>
                  )}
                  <View>
                    <Text style={[styles.title, { color: colors.text }]}>
                      {todayWorkout
                        ? todayWorkout.name
                        : t("home.workout.todaysWorkout")}
                    </Text>
                    <Text
                      style={[styles.subtitle, { color: colors.text + "80" }]}
                    >
                      {hasExercises
                        ? `${todayExercises.length} ${
                            todayExercises.length !== 1
                              ? t("home.workout.exercises")
                              : t("home.workout.exercise")
                          }`
                        : t("home.workout.noExercisesToday")}
                    </Text>
                  </View>
                </View>

                <View style={styles.headerRight}>
                  <TouchableOpacity
                    style={[
                      styles.infoButton,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                    onPress={openInfoModal}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </TouchableOpacity>

                  {/* Botão de expansão - se houver exercícios */}
                  {hasExercises && (
                    <TouchableOpacity
                      style={[
                        styles.expandButton,
                        { backgroundColor: colors.text + "10" },
                      ]}
                      onPress={toggleExpand}
                    >
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={colors.text + "80"}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Conteúdo principal */}
              {!hasExercises ? (
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
                      {t("home.workout.noExercisesToday")}
                    </Text>
                  </LinearGradient>
                </View>
              ) : (
                <>
                  <View style={styles.progressContainer}>
                    {/* Seletores agrupados antes dos cards */}
                    <View style={styles.selectorsContainer}>
                      {/* Seletor de tipo de gráfico */}
                      <View
                        style={[
                          styles.chartTypeSelector,
                          { flex: 2, marginRight: 8 },
                        ]}
                      >
                        <TouchableOpacity
                          style={[
                            styles.chartTypeButton,
                            selectedChartType === "weight" && [
                              styles.selectedChartType,
                              { backgroundColor: colors.primary + "20" },
                            ],
                          ]}
                          onPress={() => changeChartType("weight")}
                        >
                          <Text
                            style={[
                              styles.chartTypeText,
                              { color: colors.text + "80" },
                              selectedChartType === "weight" && {
                                color: colors.primary,
                                fontWeight: "600",
                              },
                            ]}
                          >
                            {t("home.workout.chartTypes.weight")}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.chartTypeButton,
                            selectedChartType === "calories" && [
                              styles.selectedChartType,
                              { backgroundColor: colors.primary + "20" },
                            ],
                          ]}
                          onPress={() => changeChartType("calories")}
                        >
                          <Text
                            style={[
                              styles.chartTypeText,
                              { color: colors.text + "80" },
                              selectedChartType === "calories" && {
                                color: colors.primary,
                                fontWeight: "600",
                              },
                            ]}
                          >
                            {t("home.workout.chartTypes.calories")}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.chartTypeButton,
                            selectedChartType === "volume" && [
                              styles.selectedChartType,
                              { backgroundColor: colors.primary + "20" },
                            ],
                          ]}
                          onPress={() => changeChartType("volume")}
                        >
                          <Text
                            style={[
                              styles.chartTypeText,
                              { color: colors.text + "80" },
                              selectedChartType === "volume" && {
                                color: colors.primary,
                                fontWeight: "600",
                              },
                            ]}
                          >
                            {t("home.workout.chartTypes.volume")}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Seletor de período */}
                      <View style={[styles.chartTypeSelector, { flex: 1 }]}>
                        <TouchableOpacity
                          style={[
                            styles.chartTypeButton,
                            selectedHistoryPeriod === "1m" && [
                              styles.selectedChartType,
                              { backgroundColor: colors.primary + "20" },
                            ],
                          ]}
                          onPress={() => changeHistoryPeriod("1m")}
                        >
                          <Text
                            style={[
                              styles.chartTypeText,
                              { color: colors.text + "80" },
                              selectedHistoryPeriod === "1m" && {
                                color: colors.primary,
                                fontWeight: "600",
                              },
                            ]}
                          >
                            {t("home.workout.periods.month1")}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.chartTypeButton,
                            selectedHistoryPeriod === "6m" && [
                              styles.selectedChartType,
                              { backgroundColor: colors.primary + "20" },
                            ],
                          ]}
                          onPress={() => changeHistoryPeriod("6m")}
                        >
                          <Text
                            style={[
                              styles.chartTypeText,
                              { color: colors.text + "80" },
                              selectedHistoryPeriod === "6m" && {
                                color: colors.primary,
                                fontWeight: "600",
                              },
                            ]}
                          >
                            {t("home.workout.periods.month6")}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.chartTypeButton,
                            selectedHistoryPeriod === "all" && [
                              styles.selectedChartType,
                              { backgroundColor: colors.primary + "20" },
                            ],
                          ]}
                          onPress={() => changeHistoryPeriod("all")}
                        >
                          <Text
                            style={[
                              styles.chartTypeText,
                              { color: colors.text + "80" },
                              selectedHistoryPeriod === "all" && {
                                color: colors.primary,
                                fontWeight: "600",
                              },
                            ]}
                          >
                            {t("home.workout.periods.all")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Renderizar exercícios em lista horizontal */}
                    {renderExerciseList}

                    {/* Indicador de expansão - visível apenas quando não expandido */}
                    {!isExpanded && (
                      <View style={styles.expandIndicator}>
                        <View
                          style={[
                            styles.expandDot,
                            { backgroundColor: colors.primary + "40" },
                          ]}
                        />
                        <View
                          style={[
                            styles.expandDot,
                            { backgroundColor: colors.primary + "40" },
                          ]}
                        />
                        <View
                          style={[
                            styles.expandDot,
                            { backgroundColor: colors.primary + "40" },
                          ]}
                        />
                      </View>
                    )}
                  </View>

                  {/* Código do gráfico - integrado no container principal */}
                  {isExpanded && (
                    <View style={styles.expandedSection}>
                      <View style={styles.sectionDivider} />

                      {chartData.labels.length > 0 &&
                      chartData.datasets[0].data.length > 0 ? (
                        <View style={styles.chartContainer}>
                          <LineChart
                            data={chartData}
                            width={width - 40}
                            height={220}
                            yAxisLabel=""
                            yAxisSuffix={
                              selectedChartType === "calories" ? " kcal" : " kg"
                            }
                            chartConfig={{
                              backgroundColor: colors.chartBackground,
                              backgroundGradientFrom: colors.chartGradientStart,
                              backgroundGradientTo: colors.chartGradientEnd,
                              decimalPlaces: 0,
                              color: () => colors.primary,
                              labelColor: () => colors.text + "80",
                              style: {
                                borderRadius: 16,
                              },
                              propsForDots: {
                                r: "5",
                                strokeWidth: "2",
                                stroke: colors.primary,
                                fill: colors.chartDotFill,
                              },
                              fillShadowGradientFrom: colors.primary,
                              fillShadowGradientTo: "rgba(255, 255, 255, 0)",
                              propsForBackgroundLines: {
                                strokeDasharray: "5, 5",
                                stroke: colors.chartGrid,
                              },
                            }}
                            style={{
                              marginVertical: 8,
                              borderRadius: 16,
                              padding: 10,
                              backgroundColor: colors.chartBackground,
                              shadowColor: colors.text,
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.1,
                              shadowRadius: 4,
                              elevation: 3,
                            }}
                            bezier
                            withInnerLines={false}
                            fromZero={true}
                            segments={4}
                          />
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.noDataContainer,
                            {
                              backgroundColor: colors.chartBackground,
                              borderRadius: 16,
                              shadowColor: colors.text,
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.1,
                              shadowRadius: 4,
                              elevation: 3,
                            },
                          ]}
                        >
                          <Ionicons
                            name="analytics-outline"
                            size={40}
                            color={colors.primary + "60"}
                          />
                          <Text
                            style={[
                              styles.noDataText,
                              { color: colors.text + "80", marginTop: 12 },
                            ]}
                          >
                            {selectedChartType === "calories" ||
                            selectedChartType === "volume"
                              ? `${t("home.workout.noHistoricalData")} ${
                                  selectedChartType === "calories"
                                    ? t(
                                        "home.workout.chartTypes.calories"
                                      ).toLowerCase()
                                    : t(
                                        "home.workout.chartTypes.volume"
                                      ).toLowerCase()
                                }`
                              : selectedExercise
                              ? `${t("home.workout.noHistoricalData")} ${t(
                                  "home.workout.exercise"
                                )}`
                              : t("home.workout.selectExercise")}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </>
              )}
            </>
          ) : (
            // Conteúdo de carregamento
            <View style={styles.loadingContainer}>
              <View style={styles.header}>
                <View style={styles.titleContainer}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                  >
                    <Ionicons
                      name="barbell-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View>
                    <Text style={[styles.title, { color: colors.text }]}>
                      {t("home.workout.todaysWorkout")}
                    </Text>
                    <Text
                      style={[styles.subtitle, { color: colors.text + "80" }]}
                    >
                      {t("home.workout.loading")}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  content: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
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
  progressContainer: {
    width: "100%",
  },
  selectorsContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  chartTypeSelector: {
    flexDirection: "row",
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 3,
  },
  chartTypeButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 8,
  },
  selectedChartType: {
    borderRadius: 8,
  },
  chartTypeText: {
    fontSize: 12,
  },
  exerciseListContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  exerciseListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  exerciseListTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseListContent: {
    paddingRight: 16,
  },
  exerciseCard: {
    padding: 12,
    borderRadius: 10,
    width: 130,
    marginRight: 12,
  },
  exerciseCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    marginRight: 4,
  },
  exerciseValue: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  exerciseChange: {
    fontSize: 10,
    fontWeight: "500",
  },
  expandIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  expandDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 2,
  },
  pressableArea: {
    width: "100%",
  },
  expandedSection: {},
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginBottom: 10,
  },
  chartContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  noDataContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    margin: 16,
  },
  noDataText: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    padding: 16,
  },
  exerciseCardTouchable: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    marginRight: 12,
  },
});
