import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import { useColorScheme } from "react-native";
import { MotiView } from "moti";
import { useMeals } from "../context/MealContext";
import { useNutrition } from "../context/NutritionContext";
import { PieChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

type ChartMode = "calories" | "macros";

interface CaloriesDataItem {
  name: string;
  calories: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface MacrosDataItem {
  name: string;
  value: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

export default function MacrosDetailsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { getMealTotals } = useMeals();
  const { nutritionInfo } = useNutrition();
  const [chartMode, setChartMode] = useState<ChartMode>("calories");

  // Dados das refeições
  const meals = [
    { id: "breakfast", name: "Café da Manhã", color: "#FF6B6B" },
    { id: "lunch", name: "Almoço", color: "#4ECDC4" },
    { id: "snack", name: "Lanche", color: "#FFD93D" },
    { id: "dinner", name: "Jantar", color: "#6C5CE7" },
  ];

  // Calcula os totais de cada refeição
  const mealTotals = meals.map((meal) => getMealTotals(meal.id));

  // Calcula o total geral de calorias
  const totalCalories = mealTotals.reduce(
    (acc, curr) => acc + curr.calories,
    0
  );

  // Dados para o gráfico de calorias
  const caloriesData: CaloriesDataItem[] = meals
    .map((meal, index: number) => {
      const calories = mealTotals[index].calories;
      const percentage =
        totalCalories > 0 ? (calories / totalCalories) * 100 : 0;
      return {
        name: `${meal.name} (${percentage.toFixed(1)}%)`,
        calories: calories,
        color: meal.color,
        legendFontColor: colors.text,
        legendFontSize: 12,
      };
    })
    .filter((item: CaloriesDataItem) => item.calories > 0);

  // Calcula o total de macros
  const totalMacros = mealTotals.reduce(
    (acc, curr) => ({
      protein: acc.protein + curr.protein,
      carbs: acc.carbs + curr.carbs,
      fat: acc.fat + curr.fat,
    }),
    { protein: 0, carbs: 0, fat: 0 }
  );

  // Dados para o gráfico de macros
  const totalMacrosValue =
    totalMacros.protein + totalMacros.carbs + totalMacros.fat;
  const macrosData: MacrosDataItem[] = [
    {
      name: `Proteínas (${(
        (totalMacros.protein / totalMacrosValue) *
        100
      ).toFixed(1)}%)`,
      value: totalMacros.protein,
      color: "#FF6B6B",
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
    {
      name: `Carboidratos (${(
        (totalMacros.carbs / totalMacrosValue) *
        100
      ).toFixed(1)}%)`,
      value: totalMacros.carbs,
      color: "#4ECDC4",
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
    {
      name: `Gorduras (${((totalMacros.fat / totalMacrosValue) * 100).toFixed(
        1
      )}%)`,
      value: totalMacros.fat,
      color: "#FFD93D",
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
  ].filter((item: MacrosDataItem) => item.value > 0);

  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) =>
      colors.text + (opacity * 255).toString(16).padStart(2, "0"),
    labelColor: (opacity = 1) =>
      colors.text + (opacity * 255).toString(16).padStart(2, "0"),
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: colors.primary,
    },
  };

  const renderMealBreakdown = () => {
    return meals.map((meal, index) => {
      const total = mealTotals[index];
      const percentage = ((total.calories / totalCalories) * 100).toFixed(1);

      if (total.calories === 0) return null;

      return (
        <MotiView
          key={meal.id}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: index * 100 }}
          style={[styles.mealCard, { backgroundColor: colors.light }]}
        >
          <View style={styles.mealHeader}>
            <View style={styles.mealTitleContainer}>
              <View
                style={[styles.colorDot, { backgroundColor: meal.color }]}
              />
              <Text style={[styles.mealTitle, { color: colors.text }]}>
                {meal.name}
              </Text>
            </View>
            <Text style={[styles.percentage, { color: colors.text }]}>
              {percentage}%
            </Text>
          </View>

          <View style={styles.macrosBreakdown}>
            <Text style={[styles.macroText, { color: colors.text }]}>
              {total.calories.toFixed(0)} kcal
            </Text>
            <Text style={[styles.macroText, { color: colors.text + "80" }]}>
              P: {total.protein.toFixed(1)}g
            </Text>
            <Text style={[styles.macroText, { color: colors.text + "80" }]}>
              C: {total.carbs.toFixed(1)}g
            </Text>
            <Text style={[styles.macroText, { color: colors.text + "80" }]}>
              G: {total.fat.toFixed(1)}g
            </Text>
          </View>
        </MotiView>
      );
    });
  };

  const renderGoalComparison = () => {
    if (chartMode === "macros") {
      return (
        <View style={[styles.goalCard, { backgroundColor: colors.light }]}>
          <Text style={[styles.goalTitle, { color: colors.text }]}>
            Comparação com Meta
          </Text>
          <View style={styles.goalRow}>
            <Text style={[styles.goalLabel, { color: colors.text }]}>
              Proteínas:
            </Text>
            <Text style={[styles.goalValue, { color: colors.text }]}>
              {totalMacros.protein.toFixed(1)}g / {nutritionInfo.protein}g
            </Text>
          </View>
          <View style={styles.goalRow}>
            <Text style={[styles.goalLabel, { color: colors.text }]}>
              Carboidratos:
            </Text>
            <Text style={[styles.goalValue, { color: colors.text }]}>
              {totalMacros.carbs.toFixed(1)}g / {nutritionInfo.carbs}g
            </Text>
          </View>
          <View style={styles.goalRow}>
            <Text style={[styles.goalLabel, { color: colors.text }]}>
              Gorduras:
            </Text>
            <Text style={[styles.goalValue, { color: colors.text }]}>
              {totalMacros.fat.toFixed(1)}g / {nutritionInfo.fat}g
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.goalCard, { backgroundColor: colors.light }]}>
        <Text style={[styles.goalTitle, { color: colors.text }]}>
          Calorias Totais
        </Text>
        <View style={styles.goalRow}>
          <Text style={[styles.goalValue, { color: colors.text }]}>
            {totalCalories.toFixed(0)} / {nutritionInfo.calories} kcal
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Análise de Macros
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            chartMode === "calories" && { backgroundColor: colors.primary },
          ]}
          onPress={() => setChartMode("calories")}
        >
          <Text
            style={[
              styles.modeButtonText,
              { color: chartMode === "calories" ? "#FFF" : colors.text },
            ]}
          >
            Calorias
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            chartMode === "macros" && { backgroundColor: colors.primary },
          ]}
          onPress={() => setChartMode("macros")}
        >
          <Text
            style={[
              styles.modeButtonText,
              { color: chartMode === "macros" ? "#FFF" : colors.text },
            ]}
          >
            Macros
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Chart */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring" }}
          style={styles.chartContainer}
        >
          <PieChart
            data={chartMode === "calories" ? caloriesData : macrosData}
            width={width - 32}
            height={220}
            chartConfig={chartConfig}
            accessor={chartMode === "calories" ? "calories" : "value"}
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
            hasLegend={true}
            center={[width / 4, 0]}
          />
        </MotiView>

        {/* Goal Comparison */}
        {renderGoalComparison()}

        {/* Meal Breakdown */}
        {chartMode === "calories" && (
          <View style={styles.breakdownContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Distribuição por Refeição
            </Text>
            {renderMealBreakdown()}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modeSelector: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  chartContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  goalCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  goalLabel: {
    fontSize: 16,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  breakdownContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  mealCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mealTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  percentage: {
    fontSize: 16,
    fontWeight: "600",
  },
  macrosBreakdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  macroText: {
    fontSize: 14,
  },
});
