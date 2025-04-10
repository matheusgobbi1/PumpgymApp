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
          <LinearGradient
            colors={[`${colors.primary}40`, `${colors.primary}15`]}
            style={styles.illustrationGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconInnerContainer}>
              <Ionicons
                name="restaurant-outline"
                size={64}
                color={colors.primary}
              />
            </View>
          </LinearGradient>
        </View>

        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("nutrition.emptyState.title")}
          </Text>
        </View>

        <View>
          <Text style={[styles.description, { color: colors.text + "80" }]}>
            {t("nutrition.emptyState.subtitle")}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={openMealConfig}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.primary, `${colors.primary}DD`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: theme === "dark" ? "#000000" : "white" },
                ]}
              >
                {t("nutrition.emptyState.configButton")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 10,
  },
  illustrationGradient: {
    width: 130,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
  },
  iconInnerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 18,
    maxWidth: 300,
    lineHeight: 22,
    fontWeight: "400",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 280,
    alignItems: "center",
  },
  button: {
    borderRadius: 18,
    overflow: "hidden",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 18,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
    marginRight: 8,
  },
});

export default memo(EmptyNutritionState);
