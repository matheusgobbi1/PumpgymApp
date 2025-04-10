import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MotiView } from "moti";
import Colors from "../../constants/Colors";
import { MealNutritionRecommendation } from "../../utils/nutritionDistributionAlgorithm";
import { useTranslation } from "react-i18next";

interface NutritionRecommendationCardProps {
  recommendation: MealNutritionRecommendation;
  mealColor: string;
  theme: "light" | "dark";
  mealTotals?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  isPreview?: boolean;
}

export default function NutritionRecommendationCard({
  recommendation,
  mealColor,
  theme,
  mealTotals,
  isPreview = false,
}: NutritionRecommendationCardProps) {
  const colors = Colors[theme];
  const { t } = useTranslation();

  // Verificar se há dados de consumo
  const hasConsumptionData = mealTotals !== undefined;

  // Formatar números para exibição
  const formatNumber = (value: number, isCalorie = false) => {
    if (isCalorie) {
      // Para calorias, sem casas decimais
      return Math.round(value);
    } else {
      // Para macros, uma casa decimal
      return Math.round(value * 10) / 10;
    }
  };

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 300 }}
      style={styles.container}
    >
      <View style={styles.contentRow}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isPreview
              ? t(
                  "nutrition.recommendation.previewValues",
                  "Prévia dos Valores"
                )
              : t(
                  "nutrition.recommendation.suggestedValues",
                  "Valores Recomendados"
                )}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
            {isPreview
              ? t(
                  "nutrition.recommendation.withSelectedFoods",
                  "Com alimentos selecionados"
                )
              : `${Math.round(recommendation.percentageOfDaily)}% ${t(
                  "nutrition.recommendation.ofDailyNeeds",
                  "do seu plano diário"
                )}`}
          </Text>
        </View>
      </View>

      <View style={styles.macroContainer}>
        {/* Calorias */}
        <View style={styles.macroItem}>
          <View style={styles.macroValueContainer}>
            <MaterialCommunityIcons
              name="fire"
              size={18}
              color="#FF1F02"
              style={styles.macroIcon}
            />
            <Text
              style={[
                styles.macroValue,
                { color: isPreview ? mealColor : colors.text },
              ]}
            >
              {hasConsumptionData
                ? formatNumber(mealTotals!.calories, true)
                : "0"}
              <Text style={[styles.macroTarget, { color: colors.text + "40" }]}>
                /{formatNumber(recommendation.calories, true)}
              </Text>
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View
          style={[styles.divider, { backgroundColor: colors.border + "40" }]}
        />

        {/* Proteína */}
        <View style={styles.macroItem}>
          <View style={styles.macroValueContainer}>
            <MaterialCommunityIcons
              name="food-steak"
              size={18}
              color="#EF476F"
              style={styles.macroIcon}
            />
            <Text
              style={[
                styles.macroValue,
                { color: isPreview ? mealColor : colors.text },
              ]}
            >
              {hasConsumptionData ? formatNumber(mealTotals!.protein) : "0"}
              <Text style={[styles.macroTarget, { color: colors.text + "40" }]}>
                /{formatNumber(recommendation.protein)}g
              </Text>
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View
          style={[styles.divider, { backgroundColor: colors.border + "40" }]}
        />

        {/* Carboidratos */}
        <View style={styles.macroItem}>
          <View style={styles.macroValueContainer}>
            <MaterialCommunityIcons
              name="bread-slice"
              size={18}
              color="#118AB2"
              style={styles.macroIcon}
            />
            <Text
              style={[
                styles.macroValue,
                { color: isPreview ? mealColor : colors.text },
              ]}
            >
              {hasConsumptionData ? formatNumber(mealTotals!.carbs) : "0"}
              <Text style={[styles.macroTarget, { color: colors.text + "40" }]}>
                /{formatNumber(recommendation.carbs)}g
              </Text>
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View
          style={[styles.divider, { backgroundColor: colors.border + "40" }]}
        />

        {/* Gorduras */}
        <View style={styles.macroItem}>
          <View style={styles.macroValueContainer}>
            <MaterialCommunityIcons
              name="oil"
              size={18}
              color="#FFD166"
              style={styles.macroIcon}
            />
            <Text
              style={[
                styles.macroValue,
                { color: isPreview ? mealColor : colors.text },
              ]}
            >
              {hasConsumptionData ? formatNumber(mealTotals!.fat) : "0"}
              <Text style={[styles.macroTarget, { color: colors.text + "40" }]}>
                /{formatNumber(recommendation.fat)}g
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  contentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  macroContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 0,
    marginVertical: 0,

    paddingHorizontal: 0,
    borderRadius: 8,
  },
  macroItem: {
    flex: 1,
    alignItems: "center",
  },
  macroValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  macroIcon: {
    marginRight: 5,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  macroTarget: {
    fontSize: 14,
    fontWeight: "400",
  },
  divider: {
    width: 1,
    height: 36,
    marginHorizontal: 8,
  },
});
