import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { MotiView } from "moti";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { BarChart, LineChart } from "react-native-chart-kit";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { format, subDays, isToday, isAfter, isBefore, isEqual } from "date-fns";
import * as Haptics from "expo-haptics";
import { useWorkoutContext } from "../../context/WorkoutContext";
import { Exercise } from "../../context/WorkoutContext";
import { WorkoutType } from "../../components/training/WorkoutConfigSheet";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

type ChartType = "weight" | "reps" | "volume";

// Período de visualização do histórico
type HistoryPeriod = "1m" | "3m" | "6m" | "all";

interface WorkoutProgressChartProps {
  onPress?: () => void;
  refreshKey?: number; // Prop para forçar atualização
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
    console.error("Erro ao renderizar ícone:", error);
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

  let currentValue = 0;
  let previousValue = 0;

  if (chartType === "weight") {
    currentValue = calculateMaxWeight(exercise);
    previousValue = prevExercise ? calculateMaxWeight(prevExercise) : 0;
  } else if (chartType === "reps") {
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
    <MotiView
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
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 300, delay: index * 100 }}
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
    </MotiView>
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
  refreshKey = 0,
}: WorkoutProgressChartProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
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
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialMount, setInitialMount] = useState(true);

  // Altura animada do card
  const cardHeight = useSharedValue(230);

  // Carregar dados quando o componente montar
  useEffect(() => {
    const initializeComponent = async () => {
      await loadData();
      setIsInitialized(true);
    };

    initializeComponent();
  }, [getWorkoutsForDate, getWorkoutTypeById, getExercisesForWorkout]);

  // Efeito para animar a altura do card
  useEffect(() => {
    const emptyStateHeight = 180; // Altura padrão para o estado vazio

    // Se não tiver exercícios ou estiver carregando, usar altura fixa
    if (todayExercises.length === 0 || isLoading) {
      cardHeight.value = emptyStateHeight;
      return;
    }

    // Só alterar a altura após os dados estarem carregados
    if (!isLoading) {
      if (initialMount) {
        cardHeight.value = isExpanded ? 650 : 220;
        setInitialMount(false);
      } else {
        cardHeight.value = withTiming(isExpanded ? 750 : 220, {
          duration: 300,
        });
      }
    }
  }, [isExpanded, todayExercises.length, isLoading, initialMount]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: cardHeight.value,
    };
  });

  // Efeito para atualizar o gráfico quando o tipo de gráfico ou período de histórico mudar
  useEffect(() => {
    if (selectedExercise && workoutHistory[selectedExercise.id]) {
      updateChartData();
    }
  }, [selectedChartType, selectedHistoryPeriod, selectedExercise]);

  // Efeito para atualizar o gráfico quando o refreshKey mudar
  useEffect(() => {
    if (refreshKey > 0) {
      loadData();
    }
  }, [refreshKey]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Obter a data de hoje formatada
      const today = format(new Date(), "yyyy-MM-dd");

      // Obter os treinos de hoje
      const todaysWorkouts = getWorkoutsForDate(today);

      // Verificar se há treinos para hoje
      if (todaysWorkouts && Object.keys(todaysWorkouts).length > 0) {
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
          setTodayExercises(exercisesForWorkout);

          // Carregar histórico de treinos para cada exercício
          const history: { [exerciseId: string]: WorkoutHistoryData[] } = {};

          // Para cada exercício, buscar seu histórico
          for (const exercise of exercisesForWorkout) {
            history[exercise.id] = await getExerciseHistory(
              exercise.name,
              workoutId
            );
          }

          setWorkoutHistory(history);

          // Se houver exercícios, selecionar o primeiro por padrão
          if (exercisesForWorkout.length > 0) {
            setSelectedExercise(exercisesForWorkout[0]);
          }

          // Atualizar dados do gráfico
          updateChartData();
        }
      } else {
        // Limpar dados se não houver treinos hoje
        setTodayWorkout(null);
        setTodayExercises([]);
        setWorkoutHistory({});
        setChartData({
          labels: [],
          datasets: [{ data: [] }],
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados do treino:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para obter o histórico de um exercício específico
  const getExerciseHistory = async (
    exerciseName: string,
    workoutTypeId: string
  ): Promise<WorkoutHistoryData[]> => {
    const history: WorkoutHistoryData[] = [];

    // Percorrer todos os treinos registrados
    for (const date in workouts) {
      // Verificar se o tipo de treino existe para esta data
      if (workouts[date] && workouts[date][workoutTypeId]) {
        const exercisesForDate = workouts[date][workoutTypeId];

        // Encontrar o exercício pelo nome (case insensitive)
        const exercise = exercisesForDate.find(
          (ex) => ex.name.toLowerCase() === exerciseName.toLowerCase()
        );

        if (exercise) {
          // Calcular o valor com base no tipo de gráfico selecionado
          let value = 0;

          if (selectedChartType === "weight") {
            value = calculateMaxWeight(exercise);
          } else if (selectedChartType === "reps") {
            value = calculateTotalReps(exercise);
          } else if (selectedChartType === "volume") {
            value = calculateVolume(exercise);
          }

          // Adicionar ao histórico
          history.push({
            date,
            value,
          });
        }
      }
    }

    // Ordenar por data (mais antiga para mais recente)
    history.sort((a, b) => {
      const dateA = parseISODate(a.date);
      const dateB = parseISODate(b.date);
      return isAfter(dateA, dateB) ? 1 : isEqual(dateA, dateB) ? 0 : -1;
    });

    return history;
  };

  // Função para calcular o volume (peso * reps * sets)
  const calculateVolume = (exercise: Exercise) => {
    if (!exercise.sets) return 0;

    return exercise.sets.reduce((total, set) => {
      return total + set.weight * set.reps;
    }, 0);
  };

  // Função para calcular o peso máximo
  const calculateMaxWeight = (exercise: Exercise) => {
    if (!exercise.sets || exercise.sets.length === 0) return 0;
    return Math.max(...exercise.sets.map((set) => set.weight));
  };

  // Função para calcular o total de repetições
  const calculateTotalReps = (exercise: Exercise) => {
    if (!exercise.sets) return 0;

    return exercise.sets.reduce((total, set) => {
      return total + set.reps;
    }, 0);
  };

  // Função para atualizar os dados do gráfico
  const updateChartData = () => {
    if (!selectedExercise) return;

    const exerciseHistory = workoutHistory[selectedExercise.id] || [];

    // Filtrar histórico com base no período selecionado
    const filteredHistory = filterHistoryByPeriod(
      exerciseHistory,
      selectedHistoryPeriod
    );

    // Preparar dados para o gráfico
    const labels = filteredHistory.map((item) => {
      const date = parseISODate(item.date);
      // Formatar data de forma mais compacta
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
          data: values,
          color: () => colors.primary,
          strokeWidth: 2,
        },
      ],
    });
  };

  // Função para filtrar o histórico com base no período selecionado
  const filterHistoryByPeriod = (
    history: WorkoutHistoryData[],
    period: HistoryPeriod
  ): WorkoutHistoryData[] => {
    if (period === "all") return history;

    const today = new Date();
    let cutoffDate: Date;

    switch (period) {
      case "1m":
        cutoffDate = subDays(today, 30);
        break;
      case "3m":
        cutoffDate = subDays(today, 90);
        break;
      case "6m":
        cutoffDate = subDays(today, 180);
        break;
      default:
        cutoffDate = subDays(today, 30);
    }

    return history.filter((item) => {
      const itemDate = parseISODate(item.date);
      return isAfter(itemDate, cutoffDate) || isEqual(itemDate, cutoffDate);
    });
  };

  // Função para alternar entre expandido e recolhido
  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  // Função para formatar valores com base no tipo de gráfico
  const formatValue = (value: number) => {
    if (selectedChartType === "weight") {
      return `${value} kg`;
    } else if (selectedChartType === "reps") {
      return `${value} reps`;
    } else {
      return `${value} kg`;
    }
  };

  // Verificar se há exercícios para mostrar
  const hasExercises = todayExercises.length > 0;

  // Título do gráfico com base no tipo selecionado
  const getChartTitle = () => {
    if (selectedChartType === "weight") {
      return "Progressão de Peso";
    } else if (selectedChartType === "reps") {
      return "Progressão de Repetições";
    } else {
      return "Progressão de Volume";
    }
  };

  // Função para mudar o período de histórico com feedback tátil
  const changeHistoryPeriod = (period: HistoryPeriod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedHistoryPeriod(period);
  };

  // Função para selecionar um exercício específico
  const handleSelectExercise = (exercise: Exercise | null) => {
    // Se o exercício clicado já está selecionado, deseleciona
    if (selectedExercise?.id === exercise?.id) {
      setSelectedExercise(null);
    } else {
      setSelectedExercise(exercise);
    }

    // Feedback tátil
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Renderizar a lista de exercícios em lista horizontal
  const renderExerciseList = () => {
    // Se não houver exercícios, não renderizar nada
    if (todayExercises.length === 0) return null;

    return (
      <View style={styles.exerciseListContainer}>
        <View style={styles.exerciseListHeader}>
          <Text style={[styles.exerciseListTitle, { color: colors.text }]}>
            Selecione para ver a progressão
          </Text>
        </View>
        <FlatList
          data={todayExercises}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.exerciseListContent}
          keyExtractor={(item) => `exercise-${item.id}`}
          renderItem={({ item: exercise, index }) => {
            // Calcular a porcentagem de progresso
            let currentValue = 0;
            let previousValue = 0;

            const previousWorkoutData = getPreviousWorkoutTotals(
              todayWorkout?.id || ""
            );

            // Encontrar o exercício correspondente no treino anterior
            const previousExercise = previousWorkoutData.date
              ? workouts[previousWorkoutData.date]?.[
                  todayWorkout?.id || ""
                ]?.find(
                  (ex) => ex.name.toLowerCase() === exercise.name.toLowerCase()
                )
              : undefined;

            if (selectedChartType === "weight") {
              currentValue = calculateMaxWeight(exercise);
              previousValue = previousExercise
                ? calculateMaxWeight(previousExercise)
                : 0;
            } else if (selectedChartType === "reps") {
              currentValue = calculateTotalReps(exercise);
              previousValue = previousExercise
                ? calculateTotalReps(previousExercise)
                : 0;
            } else {
              currentValue = calculateVolume(exercise);
              previousValue = previousExercise
                ? calculateVolume(previousExercise)
                : 0;
            }

            const percentChange =
              previousValue > 0
                ? ((currentValue - previousValue) / previousValue) * 100
                : 0;

            const isPositive = percentChange > 0;

            const cardBackgroundColor =
              theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";

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
                <MotiView
                  style={styles.exerciseCard}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: "timing",
                    duration: 500,
                    delay: index * 100,
                  }}
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
                </MotiView>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  // Se o componente ainda não foi inicializado, aplicar a mesma altura fixa
  if (!isInitialized) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.light,
            height: 180, // Exatamente a mesma altura do NutritionProgressChart
          },
        ]}
      />
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.light },
        !hasExercises ? { height: 180 } : animatedStyle,
      ]}
    >
      <Pressable
        style={styles.pressableArea}
        onPress={hasExercises ? toggleExpand : undefined}
        android_ripple={
          hasExercises
            ? { color: colors.text + "10", borderless: true }
            : undefined
        }
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {todayWorkout && (
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
            )}
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                {todayWorkout ? todayWorkout.name : "Treino de Hoje"}
              </Text>
              <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
                {hasExercises
                  ? `${todayExercises.length} exercício${
                      todayExercises.length !== 1 ? "s" : ""
                    }`
                  : "Nenhum exercício registrado"}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[
                styles.infoButton,
                { backgroundColor: colors.primary + "20" },
              ]}
              onPress={onPress}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>

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
              <Text style={[styles.emptyText, { color: colors.text + "50" }]}>
                Nenhum exercício registrado hoje
              </Text>
            </LinearGradient>
          </View>
        ) : (
          <>
            <View style={styles.progressContainer}>
              {/* Renderizar exercícios em lista horizontal logo após o header */}
              {renderExerciseList()}

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
          </>
        )}
      </Pressable>

      {/* Conteúdo que fica fora do Pressable */}
      {hasExercises && (
        <>
          {/* Mostrar o título e os botões de seleção apenas quando expandido */}
          {isExpanded && (
            <>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressTitle, { color: colors.text }]}>
                  {getChartTitle()}
                </Text>
                <Text
                  style={[
                    styles.progressSubtitle,
                    { color: colors.text + "60" },
                  ]}
                >
                  {selectedExercise
                    ? selectedExercise.name
                    : "Selecione um exercício"}
                </Text>
              </View>

              {/* Seletor de tipo de gráfico */}
              <View style={styles.chartTypeSelector}>
                <TouchableOpacity
                  style={[
                    styles.chartTypeButton,
                    selectedChartType === "weight" && [
                      styles.selectedChartType,
                      { backgroundColor: colors.primary + "20" },
                    ],
                  ]}
                  onPress={() => setSelectedChartType("weight")}
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
                    Peso
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.chartTypeButton,
                    selectedChartType === "reps" && [
                      styles.selectedChartType,
                      { backgroundColor: colors.primary + "20" },
                    ],
                  ]}
                  onPress={() => setSelectedChartType("reps")}
                >
                  <Text
                    style={[
                      styles.chartTypeText,
                      { color: colors.text + "80" },
                      selectedChartType === "reps" && {
                        color: colors.primary,
                        fontWeight: "600",
                      },
                    ]}
                  >
                    Repetições
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
                  onPress={() => setSelectedChartType("volume")}
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
                    Volume
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Seletor de período de histórico */}
              <View style={styles.comparisonContainer}>
                <Text style={[styles.comparisonTitle, { color: colors.text }]}>
                  Período:
                </Text>
                <View style={styles.comparisonSelector}>
                  <TouchableOpacity
                    style={[
                      styles.comparisonButton,
                      selectedHistoryPeriod === "1m" && [
                        styles.selectedComparison,
                        { backgroundColor: colors.primary + "20" },
                      ],
                    ]}
                    onPress={() => changeHistoryPeriod("1m")}
                  >
                    <Text
                      style={[
                        styles.comparisonText,
                        { color: colors.text + "80" },
                        selectedHistoryPeriod === "1m" && {
                          color: colors.primary,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      1 Mês
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.comparisonButton,
                      selectedHistoryPeriod === "3m" && [
                        styles.selectedComparison,
                        { backgroundColor: colors.primary + "20" },
                      ],
                    ]}
                    onPress={() => changeHistoryPeriod("3m")}
                  >
                    <Text
                      style={[
                        styles.comparisonText,
                        { color: colors.text + "80" },
                        selectedHistoryPeriod === "3m" && {
                          color: colors.primary,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      3 Meses
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.comparisonButton,
                      selectedHistoryPeriod === "6m" && [
                        styles.selectedComparison,
                        { backgroundColor: colors.primary + "20" },
                      ],
                    ]}
                    onPress={() => changeHistoryPeriod("6m")}
                  >
                    <Text
                      style={[
                        styles.comparisonText,
                        { color: colors.text + "80" },
                        selectedHistoryPeriod === "6m" && {
                          color: colors.primary,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      6 Meses
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.comparisonButton,
                      selectedHistoryPeriod === "all" && [
                        styles.selectedComparison,
                        { backgroundColor: colors.primary + "20" },
                      ],
                    ]}
                    onPress={() => changeHistoryPeriod("all")}
                  >
                    <Text
                      style={[
                        styles.comparisonText,
                        { color: colors.text + "80" },
                        selectedHistoryPeriod === "all" && {
                          color: colors.primary,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      Todos
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Gráfico (visível apenas quando expandido) */}
              <View style={styles.expandedSection}>
                <View style={styles.sectionDivider} />

                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Histórico de Progresso
                </Text>

                {selectedExercise &&
                workoutHistory[selectedExercise.id]?.length > 0 ? (
                  <View style={styles.chartContainer}>
                    <LineChart
                      data={chartData}
                      width={width - 40}
                      height={220}
                      yAxisLabel=""
                      yAxisSuffix={
                        selectedChartType === "weight" ||
                        selectedChartType === "volume"
                          ? " kg"
                          : ""
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
                        marginVertical: 16,
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
                    <View style={styles.legendContainer}>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendDot,
                            {
                              backgroundColor: colors.primary,
                              borderWidth: 2,
                              borderColor: colors.primary,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.legendText,
                            { color: colors.text + "80" },
                          ]}
                        >
                          {selectedChartType === "weight"
                            ? "Peso máximo por treino"
                            : selectedChartType === "reps"
                            ? "Total de repetições por treino"
                            : "Volume total por treino"}
                        </Text>
                      </View>
                    </View>
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
                      {selectedExercise
                        ? "Não há dados históricos para este exercício"
                        : "Selecione um exercício para ver o histórico"}
                    </Text>
                    <Text
                      style={[
                        styles.noDataSubText,
                        { color: colors.text + "60", marginTop: 8 },
                      ]}
                    >
                      Complete mais treinos para visualizar seu progresso
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </>
      )}
    </Animated.View>
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
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
  },
  progressHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  progressSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chartTypeSelector: {
    flexDirection: "row",
    marginBottom: 12,
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
    marginBottom: 16,
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
  exerciseListSubtitle: {
    fontSize: 13,
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
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: "500",
    marginRight: 4,
  },
  chartContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  expandedSection: {
    marginTop: 16,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
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
  comparisonContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  comparisonSelector: {
    flexDirection: "row",
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 3,
  },
  comparisonButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 8,
  },
  selectedComparison: {
    borderRadius: 8,
  },
  comparisonText: {
    fontSize: 12,
  },
  exerciseCardTouchable: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    marginRight: 12,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
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
  noDataSubText: {
    fontSize: 14,
    textAlign: "center",
  },
});
