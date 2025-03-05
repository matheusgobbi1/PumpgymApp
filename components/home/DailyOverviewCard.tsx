import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";

const { width } = Dimensions.get("window");

interface DailyOverviewCardProps {
  date: Date;
  nutritionSummary: {
    calories: {
      consumed: number;
      target: number;
    };
    protein: {
      consumed: number;
      target: number;
    };
    completedMeals: number;
    totalMeals: number;
  };
  trainingSummary: {
    completedWorkouts: number;
    totalWorkouts: number;
    totalVolume: number;
    totalDuration: number;
  };
  onPressNutrition: () => void;
  onPressTraining: () => void;
}

export default function DailyOverviewCard({
  date,
  nutritionSummary,
  trainingSummary,
  onPressNutrition,
  onPressTraining,
}: DailyOverviewCardProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Formatar a data para exibição
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);

  // Calcular porcentagens para os indicadores visuais
  const caloriesPercentage = Math.min(
    (nutritionSummary.calories.consumed / nutritionSummary.calories.target) *
      100,
    100
  );

  const proteinPercentage = Math.min(
    (nutritionSummary.protein.consumed / nutritionSummary.protein.target) * 100,
    100
  );

  const mealsPercentage = Math.min(
    (nutritionSummary.completedMeals / nutritionSummary.totalMeals) * 100,
    100
  );

  const workoutsPercentage = Math.min(
    (trainingSummary.completedWorkouts / trainingSummary.totalWorkouts) * 100,
    100
  );

  // Função para formatar o volume de treino
  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k kg`;
    }
    return `${volume} kg`;
  };

  // Função para formatar a duração do treino
  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
    }
    return `${minutes}m`;
  };

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(400)}>
      <MotiView
        style={[
          styles.container,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 400 }}
      >
        {/* Cabeçalho do card */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              Resumo do Dia
            </Text>
            <Text style={[styles.date, { color: colors.secondary }]}>
              {formattedDate}
            </Text>
          </View>
          <Ionicons name="calendar-outline" size={24} color={colors.primary} />
        </View>

        {/* Divisor */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Seção de Nutrição */}
        <TouchableOpacity
          style={styles.section}
          onPress={onPressNutrition}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons
                name="nutrition-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Nutrição
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.secondary}
            />
          </View>

          <View style={styles.metricsContainer}>
            {/* Calorias */}
            <View style={styles.metric}>
              <Text style={[styles.metricLabel, { color: colors.secondary }]}>
                Calorias
              </Text>
              <View style={styles.metricValueContainer}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {nutritionSummary.calories.consumed} /{" "}
                  {nutritionSummary.calories.target}
                </Text>
                <Text style={[styles.metricUnit, { color: colors.secondary }]}>
                  kcal
                </Text>
              </View>
              <View
                style={[styles.progressBar, { backgroundColor: colors.border }]}
              >
                <LinearGradient
                  colors={["#1c9abe", "#00BFFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${caloriesPercentage}%` },
                  ]}
                />
              </View>
            </View>

            {/* Proteínas */}
            <View style={styles.metric}>
              <Text style={[styles.metricLabel, { color: colors.secondary }]}>
                Proteínas
              </Text>
              <View style={styles.metricValueContainer}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {nutritionSummary.protein.consumed} /{" "}
                  {nutritionSummary.protein.target}
                </Text>
                <Text style={[styles.metricUnit, { color: colors.secondary }]}>
                  g
                </Text>
              </View>
              <View
                style={[styles.progressBar, { backgroundColor: colors.border }]}
              >
                <LinearGradient
                  colors={["#4BB543", "#6FD869"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${proteinPercentage}%` },
                  ]}
                />
              </View>
            </View>

            {/* Refeições */}
            <View style={styles.metric}>
              <Text style={[styles.metricLabel, { color: colors.secondary }]}>
                Refeições
              </Text>
              <View style={styles.metricValueContainer}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {nutritionSummary.completedMeals} /{" "}
                  {nutritionSummary.totalMeals}
                </Text>
              </View>
              <View
                style={[styles.progressBar, { backgroundColor: colors.border }]}
              >
                <LinearGradient
                  colors={["#FFC107", "#FFD54F"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${mealsPercentage}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Divisor */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Seção de Treino */}
        <TouchableOpacity
          style={styles.section}
          onPress={onPressTraining}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons
                name="barbell-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Treino
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.secondary}
            />
          </View>

          <View style={styles.metricsContainer}>
            {/* Treinos */}
            <View style={styles.metric}>
              <Text style={[styles.metricLabel, { color: colors.secondary }]}>
                Treinos
              </Text>
              <View style={styles.metricValueContainer}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {trainingSummary.completedWorkouts} /{" "}
                  {trainingSummary.totalWorkouts}
                </Text>
              </View>
              <View
                style={[styles.progressBar, { backgroundColor: colors.border }]}
              >
                <LinearGradient
                  colors={["#1c9abe", "#00BFFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${workoutsPercentage}%` },
                  ]}
                />
              </View>
            </View>

            {/* Volume */}
            <View style={styles.metric}>
              <Text style={[styles.metricLabel, { color: colors.secondary }]}>
                Volume Total
              </Text>
              <View style={styles.metricValueContainer}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {formatVolume(trainingSummary.totalVolume)}
                </Text>
              </View>
            </View>

            {/* Duração */}
            <View style={styles.metric}>
              <Text style={[styles.metricLabel, { color: colors.secondary }]}>
                Duração Total
              </Text>
              <View style={styles.metricValueContainer}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {formatDuration(trainingSummary.totalDuration)}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  date: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    width: "100%",
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  metricsContainer: {
    gap: 12,
  },
  metric: {
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  metricValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  metricUnit: {
    fontSize: 12,
    marginLeft: 4,
  },
  progressBar: {
    height: 6,
    width: "100%",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
});
