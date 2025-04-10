import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useWorkoutContext } from "../../context/WorkoutContext";
import { useMealContext } from "../../context/MealContext";
import { useNutrition } from "../../context/NutritionContext";
import { format, subDays, differenceInDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { waterDataManager } from "./WaterIntakeCard";
import { MotiView } from "moti";
import Svg, { Circle } from "react-native-svg";

import InfoModal, { InfoItem } from "../common/InfoModal";

const { width } = Dimensions.get("window");

interface ConsistencyScoreCardProps {
  onPress?: () => void;
  steps: number | null;
}

// Função para determinar a cor com base na pontuação
const getScoreColor = (score: number) => {
  if (score >= 90) return "#4CAF50"; // Verde para excelente
  if (score >= 75) return "#8BC34A"; // Verde claro para muito bom
  if (score >= 60) return "#CDDC39"; // Lima para bom
  if (score >= 45) return "#FFEB3B"; // Amarelo para médio
  if (score >= 30) return "#FFC107"; // Âmbar para regular
  if (score >= 15) return "#FF9800"; // Laranja para baixo
  return "#FF5722"; // Vermelho para muito baixo
};

// Função para obter o ícone com base na pontuação
const getScoreIcon = (score: number) => {
  if (score >= 90) return "trophy";
  if (score >= 75) return "star";
  if (score >= 60) return "thumb-up";
  if (score >= 45) return "thumb-up";
  if (score >= 30) return "dumbbell";
  if (score >= 15) return "trending-up";
  return "trending-up";
};

// Define types for MetricItem props
interface MetricItemProps {
  label: string;
  percentage: number;
  color: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
}

// Componente de círculo de progresso para métricas
const CircularProgress = ({
  percentage,
  color,
  size = 36,
  iconName,
}: {
  percentage: number;
  color: string;
  size?: number;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
}) => {
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const iconSize = size * 0.45; // Tamanho do ícone proporcional ao círculo

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background Circle */}
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color + "20"}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
      </Svg>

      {/* Progress Circle with Animation */}
      <MotiView
        from={{ opacity: 0, rotate: "0deg" }}
        animate={{ opacity: 1, rotate: "0deg" }}
        transition={{
          type: "timing",
          duration: 1000,
        }}
        style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
      >
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            originX={size / 2}
            originY={size / 2}
          />
        </Svg>
      </MotiView>

      {/* Ícone centralizado */}
      <MotiView
        from={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          delay: 200,
          damping: 15,
        }}
      >
        <MaterialCommunityIcons name={iconName} size={iconSize} color={color} />
      </MotiView>
    </View>
  );
};

// Componente para os mini-cards de métricas
const MetricCard = ({
  label,
  percentage,
  color,
  iconName,
  theme,
}: MetricItemProps & { theme: "light" | "dark" }) => {
  const colors = Colors[theme];

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "timing", duration: 500 }}
      style={[styles.metricCard, { backgroundColor: colors.card }]}
    >
      <View style={styles.statCardContent}>
        <View
          style={[styles.statIconContainer, { backgroundColor: color + "20" }]}
        >
          <MaterialCommunityIcons name={iconName} size={20} color={color} />
        </View>
        <View style={styles.statTextContainer}>
          <Text
            style={[styles.statLabel, { color: colors.text }]}
            numberOfLines={1}
          >
            {label}
          </Text>
          <Text style={[styles.statValue, { color }]}>
            {Math.round(percentage)}%
          </Text>
        </View>
      </View>
    </MotiView>
  );
};

export default function ConsistencyScoreCard({
  onPress,
  steps,
}: ConsistencyScoreCardProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { workouts, availableWorkoutTypes } = useWorkoutContext();
  const { meals, mealTypes } = useMealContext();
  const { nutritionInfo } = useNutrition();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [showScoreInfoModal, setShowScoreInfoModal] = useState(false);

  // Obter dados de água do gerenciador global
  const waterData = useMemo(() => waterDataManager.getWaterData(), []);

  // Verificar se o usuário já configurou treinos e refeições
  const hasWorkoutTypesConfigured =
    availableWorkoutTypes && availableWorkoutTypes.length > 0;
  const hasMealTypesConfigured = mealTypes && mealTypes.length > 0;
  const hasConfiguredApp = hasWorkoutTypesConfigured && hasMealTypesConfigured;

  // Encontrar a data do primeiro treino registrado
  const firstWorkoutDate = useMemo(() => {
    if (!workouts) return null;

    let firstDate: Date | null = null;
    let hasAnyWorkout = false;

    Object.keys(workouts).forEach((dateStr) => {
      if (Object.keys(workouts[dateStr]).length > 0) {
        const date = new Date(dateStr);
        if (!firstDate || date < firstDate) {
          firstDate = date;
          hasAnyWorkout = true;
        }
      }
    });

    return hasAnyWorkout ? firstDate : null;
  }, [workouts]);

  // Encontrar a data da primeira refeição registrada
  const firstMealDate = useMemo(() => {
    if (!meals) return null;

    let firstDate: Date | null = null;
    let hasAnyMeal = false;

    Object.keys(meals).forEach((dateStr) => {
      if (Object.keys(meals[dateStr]).length > 0) {
        const date = new Date(dateStr);
        if (!firstDate || date < firstDate) {
          firstDate = date;
          hasAnyMeal = true;
        }
      }
    });

    return hasAnyMeal ? firstDate : null;
  }, [meals]);

  // Encontrar a data do primeiro registro de água
  const firstWaterDate = useMemo(() => {
    if (!waterData || Object.keys(waterData).length === 0) return null;

    let firstDate: Date | null = null;

    Object.keys(waterData).forEach((dateStr) => {
      if (waterData[dateStr] > 0) {
        const date = new Date(dateStr);
        if (!firstDate || date < firstDate) {
          firstDate = date;
        }
      }
    });

    return firstDate;
  }, [waterData]);

  // Calcular a consistência dos passos baseada nos passos reais
  const stepsConsistencyPercentage = useMemo(() => {
    if (steps === null) return 0;
    const dailyGoal = 10000; // Meta diária de passos (mantendo consistência com HealthStepsCard)
    return Math.min((steps / dailyGoal) * 100, 100);
  }, [steps]);

  // Cálculo da consistência de treinos (ponderada com a data do primeiro treino)
  const workoutConsistency = useMemo(() => {
    if (!workouts || !firstWorkoutDate) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calcular o número de dias desde o primeiro treino (limitado a 30)
    const daysSinceFirstWorkout = Math.min(
      30,
      Math.max(1, differenceInDays(today, firstWorkoutDate) + 1)
    );

    let trainedDays = 0;

    // Verificar apenas os dias desde o primeiro treino
    for (let i = 0; i < daysSinceFirstWorkout; i++) {
      const checkDate = subDays(today, i);
      const dateFormatted = format(checkDate, "yyyy-MM-dd");

      const hasWorkoutOnDate =
        workouts[dateFormatted] &&
        Object.keys(workouts[dateFormatted]).length > 0 &&
        Object.values(workouts[dateFormatted]).some(
          (exercises) => exercises.length > 0
        );

      if (hasWorkoutOnDate) {
        trainedDays++;
      }
    }

    // Calcular usando 4 treinos por semana como meta, mas ajustado para o período
    const weeksActive = Math.max(1, daysSinceFirstWorkout / 7);
    const targetWorkoutDays = Math.min(
      daysSinceFirstWorkout,
      Math.round(4 * weeksActive)
    );

    return Math.min(100, (trainedDays / targetWorkoutDays) * 100);
  }, [workouts, firstWorkoutDate]);

  // Cálculo da consistência de alimentação (atingir meta calórica) considerando o primeiro registro
  const nutritionConsistency = useMemo(() => {
    if (!meals || !nutritionInfo.calories || !firstMealDate) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calcular o número de dias desde a primeira refeição (limitado a 14)
    const daysSinceFirstMeal = Math.min(
      14,
      Math.max(1, differenceInDays(today, firstMealDate) + 1)
    );

    let daysOnTarget = 0;
    const calorieTarget = nutritionInfo.calories;
    const tolerance = 0.15; // 15% de tolerância para mais ou para menos

    // Verificar apenas os dias desde a primeira refeição
    for (let i = 0; i < daysSinceFirstMeal; i++) {
      const checkDate = subDays(today, i);
      const dateFormatted = format(checkDate, "yyyy-MM-dd");

      if (meals[dateFormatted]) {
        // Somar calorias do dia
        let totalCalories = 0;
        Object.values(meals[dateFormatted]).forEach((foods: any) => {
          if (Array.isArray(foods)) {
            foods.forEach((food: any) => {
              if (food && food.calories) {
                totalCalories += food.calories * (food.quantity || 1);
              }
            });
          }
        });

        // Verificar se está dentro da faixa de tolerância
        const lowerLimit = calorieTarget * (1 - tolerance);
        const upperLimit = calorieTarget * (1 + tolerance);

        if (totalCalories >= lowerLimit && totalCalories <= upperLimit) {
          daysOnTarget++;
        }
      }
    }

    return Math.min(100, (daysOnTarget / daysSinceFirstMeal) * 100);
  }, [meals, nutritionInfo.calories, firstMealDate]);

  // Cálculo da consistência de água (atingir meta de consumo de água)
  const waterConsistencyPercentage = useMemo(() => {
    if (!waterData || !nutritionInfo.waterIntake || !firstWaterDate) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calcular o número de dias desde o primeiro registro de água (limitado a 14)
    const daysSinceFirstWater = Math.min(
      14,
      Math.max(1, differenceInDays(today, firstWaterDate) + 1)
    );

    let daysOnTarget = 0;
    const waterTarget = nutritionInfo.waterIntake;
    const waterTolerance = 0.1; // 10% de tolerância para consumo de água
    const minimumWaterGoal = waterTarget * (1 - waterTolerance);

    // Verificar apenas os dias desde o primeiro registro de água
    for (let i = 0; i < daysSinceFirstWater; i++) {
      const checkDate = subDays(today, i);
      const dateFormatted = format(checkDate, "yyyy-MM-dd");

      if (
        waterData[dateFormatted] &&
        waterData[dateFormatted] >= minimumWaterGoal
      ) {
        daysOnTarget++;
      }
    }

    return Math.min(100, (daysOnTarget / daysSinceFirstWater) * 100);
  }, [waterData, nutritionInfo.waterIntake, firstWaterDate]);

  // Cálculo da pontuação geral de consistência
  const consistencyScore = useMemo(() => {
    if (!hasConfiguredApp) return 0;

    // Pesos para cada componente
    const workoutWeight = 0.35; // 35%
    const nutritionWeight = 0.3; // 30%
    const waterWeight = 0.2; // 20%
    const stepsWeight = 0.15; // 15%

    // Calcular pontuação ponderada
    const weightedScore =
      workoutWeight * workoutConsistency +
      nutritionWeight * nutritionConsistency +
      waterWeight * waterConsistencyPercentage +
      stepsWeight * stepsConsistencyPercentage;

    return Math.round(weightedScore);
  }, [
    workoutConsistency,
    nutritionConsistency,
    waterConsistencyPercentage,
    stepsConsistencyPercentage,
    hasConfiguredApp,
  ]);

  // Cor baseada na pontuação
  const scoreColor = getScoreColor(consistencyScore);

  // Ícone baseado na pontuação
  const scoreIcon = getScoreIcon(consistencyScore);

  // Função para obter a descrição da pontuação
  const getScoreDescription = (score: number) => {
    if (score >= 90) return t("home.consistency.excellent");
    if (score >= 75) return t("home.consistency.veryGood");
    if (score >= 60) return t("home.consistency.good");
    if (score >= 45) return t("home.consistency.moderate");
    if (score >= 30) return t("home.consistency.fair");
    if (score >= 15) return t("home.consistency.needsImprovement");
    return t("home.consistency.starting");
  };

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
  };

  // Empty state - quando não há dados suficientes
  const renderEmptyState = () => {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.light,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.emptyContainer}>
          <View style={styles.emptyGradient}>
            <View
              style={[
                styles.emptyIconContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name="chart-timeline-variant"
                size={40}
                color={colors.primary}
              />
            </View>

            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t("consistency.start_tracking")}
            </Text>
            <Text
              style={[styles.emptyDescription, { color: colors.text + "80" }]}
            >
              {t("consistency.empty_state_description")}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Preparar itens de informações para o modal
  const consistencyInfoItems = useMemo<InfoItem[]>(
    () => [
      {
        title: t("home.consistency.explanation.title"),
        description: t("home.consistency.explanation.description"),
        icon: "analytics-outline",
        iconType: "ionicons",
        color: colors.success,
      },
      {
        title: t("home.consistency.calculation.title"),
        description: t("home.consistency.calculation.description"),
        icon: "calculator-outline",
        iconType: "ionicons",
        color: colors.primary,
      },
      {
        title: t("home.consistency.workout.title"),
        description: t("home.consistency.workout.description"),
        icon: "barbell-outline",
        iconType: "ionicons",
        color: colors.primary,
      },
      {
        title: t("home.consistency.nutrition.title"),
        description: t("home.consistency.nutrition.description"),
        icon: "restaurant-outline",
        iconType: "ionicons",
        color: "#FF6B6B",
      },
      {
        title: t("home.consistency.hydration.title"),
        description: t("home.consistency.hydration.description"),
        icon: "water-outline",
        iconType: "ionicons",
        color: "#0096FF",
      },
      {
        title: t("home.consistency.activity.title"),
        description: t("home.consistency.activity.description"),
        icon: "footsteps-outline",
        iconType: "ionicons",
        color: "#4CAF50",
      },
    ],
    [t, colors]
  );

  // Renderizar o gráfico de consistência
  const renderConsistencyCard = () => {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.light,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        <InfoModal
          visible={showScoreInfoModal}
          title={t("home.consistency.modal.title")}
          subtitle={t("home.consistency.modal.subtitle")}
          infoItems={consistencyInfoItems}
          onClose={() => setShowScoreInfoModal(false)}
          topIcon={{
            name: "analytics",
            type: "ionicons",
            color: getScoreColor(consistencyScore),
            backgroundColor: getScoreColor(consistencyScore) + "20",
          }}
        />

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={toggleExpand}
          style={styles.touchableContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <View
                style={[
                  styles.iconBackground,
                  { backgroundColor: scoreColor + "20" },
                ]}
              >
                <MaterialCommunityIcons
                  name={scoreIcon}
                  size={20}
                  color={scoreColor}
                />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {t("home.consistency.title")}
                </Text>
                <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
                  {getScoreDescription(consistencyScore)}
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[
                  styles.infoButton,
                  { backgroundColor: scoreColor + "20" },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowScoreInfoModal(true);
                }}
              >
                <CircularScoreDisplay
                  score={consistencyScore}
                  color={scoreColor}
                  backgroundColor={colors.primary + "20"}
                  size={36}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.expandButton,
                  { backgroundColor: colors.text + "10" },
                ]}
                onPress={toggleExpand}
              >
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.text + "80"}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Grid de Métricas */}
          {expanded && (
            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 300 }}
              style={styles.metricsGrid}
            >
              <View style={styles.metricsRow}>
                <MetricCard
                  label={t("home.consistency.workouts")}
                  percentage={workoutConsistency}
                  color={colors.primary}
                  theme={theme}
                  iconName="dumbbell"
                />
                <MetricCard
                  label={t("home.consistency.nutritions")}
                  percentage={nutritionConsistency}
                  color="#FF6B6B"
                  theme={theme}
                  iconName="food-apple"
                />
              </View>
              <View style={styles.metricsRow}>
                <MetricCard
                  label={t("home.consistency.water")}
                  percentage={waterConsistencyPercentage}
                  color="#0096FF"
                  theme={theme}
                  iconName="water"
                />
                <MetricCard
                  label={t("home.consistency.steps")}
                  percentage={stepsConsistencyPercentage}
                  color="#4CAF50"
                  theme={theme}
                  iconName="walk"
                />
              </View>
            </MotiView>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Decidir qual componente renderizar
  return hasConfiguredApp &&
    (firstWorkoutDate || firstMealDate || firstWaterDate)
    ? renderConsistencyCard()
    : renderEmptyState();
}

// Componente para exibir a pontuação em formato circular
const CircularScoreDisplay = ({
  score,
  color,
  backgroundColor,
  size = 70,
}: {
  score: number;
  color: string;
  backgroundColor?: string;
  size?: number;
}) => {
  const strokeWidth = size * 0.05;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor || color + "20"}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          originX={size / 2}
          originY={size / 2}
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      <View style={styles.scoreValueContainer}>
        <Text style={[styles.scoreValue, { color }]}>{score}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  touchableContainer: {
    width: "100%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
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
  scoreCircleContainer: {
    alignItems: "center",
  },
  scoreValueContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  metricsGrid: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metricCard: {
    width: "48%",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyContainer: {
    overflow: "hidden",
    borderRadius: 16,
  },
  emptyGradient: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 24,
    marginBottom: 0,
    letterSpacing: -0.2,
  },
  startTrackingButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  startTrackingButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: -0.3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalGradient: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxHeight: "80%",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    maxHeight: "90%",
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  modalText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  scoreOverview: {
    alignItems: "center",
    marginVertical: 16,
  },
  scoreDescription: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    letterSpacing: -0.2,
  },
  formulaItemsContainer: {
    marginTop: 12,
    marginBottom: 20,
  },
  formulaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  formulaIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  formulaTextContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  formulaLabel: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  formulaWeight: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  periodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
  },
  periodItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderRadius: 10,
  },
  periodValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  periodLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  modalTip: {
    fontSize: 15,
    fontWeight: "600",
    fontStyle: "italic",
    lineHeight: 22,
    marginTop: 16,
    marginBottom: 24,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + "10",
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: -0.3,
  },
});
