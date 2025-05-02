import React, { memo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Icon } from "@expo/vector-icons/build/createIconSet";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { MealType } from "../../context/MealContext";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

interface EmptyNutritionStateProps {
  onMealConfigured: (meals: MealType[]) => void;
  onOpenMealConfig: () => void;
}

type IoniconsNames = React.ComponentProps<typeof Ionicons>["name"];

function EmptyNutritionState({
  onMealConfigured,
  onOpenMealConfig,
}: EmptyNutritionStateProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();

  // Função para abrir o bottom sheet
  const openMealConfig = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onOpenMealConfig();
  }, [onOpenMealConfig]);

  return (
    <View style={styles.container}>
      <View style={styles.emptyContainer}>
        <View style={styles.illustrationContainer}>
          <Ionicons
            name="restaurant-outline"
            size={80}
            color={colors.primary}
          />
        </View>

        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("nutrition.emptyState.title")}
          </Text>
        </View>

        <View>
          <Text style={[styles.description, { color: colors.text + "80" }]}>
            {t(
              "nutrition.emptyState.subtitle_fab_instruction_detailed",
              "Toque no botão "
            )}
            <Ionicons name="add-circle" size={16} color={colors.primary} />
            {t(
              "nutrition.emptyState.subtitle_fab_instruction_detailed_part2",
              " abaixo e depois no ícone "
            )}
            <Ionicons name="nutrition" size={16} color={colors.primary} />
            {t(
              "nutrition.emptyState.subtitle_fab_instruction_detailed_part3",
              " para configurar suas refeições."
            )}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: height * 0.08,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 400,
    marginTop: -height * 0.05,
  },
  illustrationContainer: {
    marginBottom: 35,
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 33,
    fontFamily: "Anton-Regular",
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 0,
    maxWidth: 300,
    lineHeight: 22,
    fontWeight: "400",
  },
});

export default memo(EmptyNutritionState);
