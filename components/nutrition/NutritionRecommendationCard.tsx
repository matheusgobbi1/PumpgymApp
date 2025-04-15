import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import Colors from "../../constants/Colors";
import { MealNutritionRecommendation } from "../../utils/nutritionDistributionAlgorithm";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

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
  onConfigPress?: () => void;
}

export default function NutritionRecommendationCard({
  recommendation,
  mealColor,
  theme,
  mealTotals,
  isPreview = false,
  onConfigPress,
}: NutritionRecommendationCardProps) {
  const colors = Colors[theme];
  const { t } = useTranslation();
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipOpacity = useState(new Animated.Value(0))[0];

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

  // Função para navegar para a tela de configuração de distribuição
  const handleConfigPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onConfigPress) {
      onConfigPress();
    } else {
      router.push("/meal-distribution-config");
    }
  };

  // Funções para controlar o tooltip
  const showTooltipAnimation = () => {
    setShowTooltip(true);
    Animated.timing(tooltipOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hideTooltipAnimation = () => {
    Animated.timing(tooltipOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setShowTooltip(false));
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 5 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 300 }}
      style={styles.container}
    >
      <View style={styles.macroContainer}>
        {/* Calorias */}
        <View style={styles.macroItem}>
          <View style={styles.macroValueContainer}>
            <MaterialCommunityIcons
              name="fire"
              size={18}
              color="#FFFFFF"
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
              color="#FFFFFF"
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
              color="#FFFFFF"
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
              color="#FFFFFF"
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
