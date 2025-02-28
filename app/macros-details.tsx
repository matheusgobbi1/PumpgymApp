import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Colors from "../constants/Colors";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMeals } from "../context/MealContext";
import { useNutrition } from "../context/NutritionContext";
import { PieChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");

const DEFAULT_MEAL_TOTALS = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

const pieColors = [
  Colors.light.primary, // Azul principal
  Colors.light.success, // Verde
  Colors.light.warning, // Amarelo
  Colors.light.accent, // Azul claro
  Colors.light.info, // Azul info
];

export default function MacrosDetailsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { meals } = useMeals();
  const { nutritionInfo } = useNutrition();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (meals !== undefined && nutritionInfo !== undefined) {
      setIsLoading(false);
    }
  }, [meals, nutritionInfo]);

  const mealTotals = React.useMemo(() => {
    if (!meals) return {};

    try {
      const totals: {
        [key: string]: typeof DEFAULT_MEAL_TOTALS;
      } = {};

      const today = new Date().toISOString().split("T")[0];
      const todayMeals = meals[today];

      if (!todayMeals) return totals;

      Object.entries(todayMeals).forEach(([mealType, foods]) => {
        if (!Array.isArray(foods)) return;

        totals[mealType] = foods.reduce(
          (acc, food) => ({
            calories: acc.calories + (Number(food?.calories) || 0),
            protein: acc.protein + (Number(food?.protein) || 0),
            carbs: acc.carbs + (Number(food?.carbs) || 0),
            fat: acc.fat + (Number(food?.fat) || 0),
          }),
          { ...DEFAULT_MEAL_TOTALS }
        );
      });

      return totals;
    } catch (error) {
      console.error("Erro ao calcular totais:", error);
      return {};
    }
  }, [meals]);

  const caloriesPieData = React.useMemo(() => {
    if (!mealTotals || typeof mealTotals !== "object") {
      return [];
    }

    try {
      const mealEntries = Object.entries(mealTotals);

      if (mealEntries.length === 0) {
        return [];
      }

      const totalCalories = mealEntries.reduce(
        (sum, [_, meal]) => sum + (Number(meal?.calories) || 0),
        0
      );

      if (totalCalories === 0) {
        return [];
      }

      return mealEntries
        .filter(([_, meal]) => meal && Number(meal.calories) > 0)
        .map(([mealType, meal], index) => ({
          name: mealType,
          calories: Number(meal?.calories) || 0,
          color: pieColors[index % (pieColors?.length || 1)] || pieColors[0],
          legendFontColor: colors.text,
          legendFontSize: 12,
        }));
    } catch (error) {
      console.error("Erro ao gerar dados do gráfico:", error);
      return [];
    }
  }, [mealTotals, colors.text]);

  // Dados para o progresso dos macros
  const macrosData = React.useMemo(() => {
    try {
      if (!mealTotals || !nutritionInfo) {
        return [];
      }

      const totals = Object.values(mealTotals).reduce(
        (acc, meal) => ({
          calories: acc.calories + (Number(meal?.calories) || 0),
          protein: acc.protein + (Number(meal?.protein) || 0),
          carbs: acc.carbs + (Number(meal?.carbs) || 0),
          fat: acc.fat + (Number(meal?.fat) || 0),
        }),
        { ...DEFAULT_MEAL_TOTALS }
      );

      return [
        {
          macro: "Proteína",
          atual: totals.protein,
          meta: Number(nutritionInfo?.protein) || 0,
          percentage:
            (totals.protein / (Number(nutritionInfo?.protein) || 1)) * 100 || 0,
        },
        {
          macro: "Carboidratos",
          atual: totals.carbs,
          meta: Number(nutritionInfo?.carbs) || 0,
          percentage:
            (totals.carbs / (Number(nutritionInfo?.carbs) || 1)) * 100 || 0,
        },
        {
          macro: "Gorduras",
          atual: totals.fat,
          meta: Number(nutritionInfo?.fat) || 0,
          percentage: (totals.fat / Number(nutritionInfo?.fat || 1)) * 100 || 0,
        },
      ];
    } catch (error) {
      console.error("Erro ao calcular macros:", error);
      return [];
    }
  }, [mealTotals, nutritionInfo]);

  const getMealTypeIcon = (mealType: string): any => {
    try {
      switch (mealType.toLowerCase()) {
        case "café da manhã":
          return "sunny";
        case "almoço":
          return "restaurant";
        case "jantar":
          return "moon";
        case "lanche":
          return "cafe";
        default:
          return "nutrition";
      }
    } catch {
      return "nutrition";
    }
  };

  const chartConfig = {
    backgroundGradientFrom: colors.light,
    backgroundGradientTo: colors.light,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Carregando dados...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Detalhes dos Macros
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Seção de Calorias por Refeição */}
        <View style={[styles.section, { backgroundColor: colors.light }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Distribuição de Calorias por Refeição
          </Text>
          {Array.isArray(caloriesPieData) && caloriesPieData.length > 0 ? (
            <>
              <View style={styles.chartContainer}>
                <PieChart
                  data={caloriesPieData}
                  width={width}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="calories"
                  backgroundColor="transparent"
                  paddingLeft="0"
                  absolute
                  hasLegend={false}
                  center={[(width) / 4, 0]}
                  avoidFalseZero
                />
              </View>
              <View style={styles.legendContainer}>
                {Object.entries(mealTotals).map(([mealType, meal], index) => {
                  const totalCalories = Object.values(mealTotals).reduce(
                    (sum, m) => sum + (Number(m?.calories) || 0),
                    0
                  );
                  const percentage =
                    totalCalories > 0
                      ? Math.round(
                          (Number(meal?.calories) / totalCalories) * 100
                        )
                      : 0;

                  return (
                    <View key={mealType} style={styles.legendItem}>
                      <View
                        style={[
                          styles.legendColor,
                          {
                            backgroundColor:
                              pieColors[index % pieColors.length],
                          },
                        ]}
                      />
                      <Ionicons
                        name={getMealTypeIcon(mealType)}
                        size={16}
                        color={colors.text}
                        style={styles.legendIcon}
                      />
                      <Text style={[styles.legendText, { color: colors.text }]}>
                        {mealType} ({Math.round(meal?.calories || 0)}kcal •{" "}
                        {percentage}%)
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="pie-chart-outline"
                size={48}
                color={colors.text}
                style={{ opacity: 0.5 }}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Nenhuma refeição registrada hoje
              </Text>
            </View>
          )}
        </View>

        {/* Seção de Progresso dos Macros */}
        <View style={[styles.section, { backgroundColor: colors.light }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Progresso dos Macronutrientes
          </Text>
          {Array.isArray(macrosData) &&
            macrosData.map((macro, index) => (
              <View key={macro.macro} style={styles.macroItem}>
                <View style={styles.macroHeader}>
                  <Text style={[styles.macroTitle, { color: colors.text }]}>
                    {macro.macro}
                  </Text>
                  <Text style={[styles.macroValues, { color: colors.text }]}>
                    {Math.round(macro.atual)}g / {Math.round(macro.meta)}g
                  </Text>
                </View>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, macro.percentage)}%`,
                        backgroundColor: pieColors[index % pieColors.length],
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.percentageText, { color: colors.text }]}>
                  {Math.round(macro.percentage)}% da meta
                </Text>
              </View>
            ))}
        </View>

        {/* Dicas e Recomendações */}
        <View style={[styles.section, { backgroundColor: colors.light }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Dicas e Recomendações
          </Text>
          <View style={styles.tipContainer}>
            <Ionicons name="bulb-outline" size={24} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.text }]}>
              Mantenha uma distribuição equilibrada de macronutrientes ao longo
              do dia para melhor energia e recuperação.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 220,
  },
  legendContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginTop: 16,
    width: "100%",
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendIcon: {
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
  },
  macroItem: {
    marginBottom: 16,
  },
  macroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  macroTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  macroValues: {
    fontSize: 14,
    opacity: 0.8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
    textAlign: "right",
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(108, 99, 255, 0.1)",
    padding: 12,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    opacity: 0.7,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
});
