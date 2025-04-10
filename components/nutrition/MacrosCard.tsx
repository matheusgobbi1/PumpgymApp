import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeIn, FadeInRight, Layout } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { useTranslation } from "react-i18next";

interface MacrosCardProps {
  dayTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  nutritionInfo: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  date: string;
}

export default function MacrosCard({
  dayTotals,
  nutritionInfo,
  date,
}: MacrosCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();

  useEffect(() => {
    // Verificar se os dados de nutrição estão disponíveis
    if (
      nutritionInfo &&
      (nutritionInfo.calories ||
        nutritionInfo.protein ||
        nutritionInfo.carbs ||
        nutritionInfo.fat)
    ) {
      setIsLoading(false);
    }
  }, [nutritionInfo]);

  const calculateProgress = (consumed: number, target: number) => {
    if (!target) return 0;
    return (consumed / target) * 100;
  };

  const calculateRemaining = (consumed: number, target: number) => {
    if (!target) return 0;
    const remaining = target - consumed;
    return Math.abs(remaining);
  };

  const isExactTarget = (consumed: number, target: number) => {
    return Math.abs(consumed - target) < 0.9; // tolerância de 0.1g/kcal
  };

  const getProgressColor = (
    percentage: number,
    consumed: number,
    target: number,
    isMacro: boolean,
    title?: string
  ) => {
    // Tolerâncias específicas
    const calorieBuffer = !isMacro ? 50 : 0; // 50kcal para calorias
    let macroBuffer = 0;

    if (isMacro) {
      if (title?.includes(t("common.nutrition.protein"))) {
        macroBuffer = 0.05; // 5% para proteína
      } else {
        macroBuffer = 0.03; // 3% para carboidratos e gorduras
      }
    }

    // Verifica se está dentro da tolerância aceitável
    const isWithinBuffer = isMacro
      ? consumed <= target * (1 + macroBuffer)
      : consumed <= target + calorieBuffer;

    // Se atingiu exatamente a meta
    if (isExactTarget(consumed, target)) {
      return colors.success || "#4CAF50";
    }

    // Se está acima da meta mas dentro da tolerância
    if (consumed > target && isWithinBuffer) {
      return colors.info;
    }

    // Se está acima da meta e fora da tolerância
    if (consumed > target) {
      return colors.danger || "#FF3B30";
    }

    // Se está abaixo da meta
    if (percentage >= 90) {
      return colors.success || "#4CAF50";
    }

    return colors.primary;
  };

  const renderMacroProgress = (
    title: string,
    icon: string,
    iconType: "ionicons" | "material",
    consumed: number,
    target: number,
    unit: string,
    index: number
  ) => {
    const progress = calculateProgress(consumed, target);
    const remaining = calculateRemaining(consumed, target);
    const isMacro = unit === "g";
    const progressColor = getProgressColor(
      progress,
      consumed,
      target,
      isMacro,
      title
    );

    // Usar a mesma lógica de cor do progresso para o ícone
    const iconColor = progressColor;

    // Se atingiu a meta ou está dentro da tolerância, mostra 100%
    const macroBuffer = title.includes(t("common.nutrition.protein"))
      ? 0.05
      : 0.03;
    const isWithinBuffer = isMacro
      ? consumed <= target * (1 + macroBuffer)
      : consumed <= target + 50; // 50kcal para calorias
    const displayProgress =
      isExactTarget(consumed, target) || (consumed > target && isWithinBuffer)
        ? 100
        : Math.min(progress, 100);

    return (
      <Animated.View
        entering={FadeInRight.delay(index * 100)
          .duration(600)
          .springify()
          .withInitialValues({
            opacity: 0,
            transform: [{ translateX: 20 }],
          })}
        key={`macro-${title}-${theme}-${date}`}
        style={styles.macroRow}
      >
        <View style={styles.macroInfo}>
          <View style={styles.macroHeader}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: iconColor + "15" },
              ]}
            >
              {iconType === "ionicons" ? (
                <Ionicons name={icon as any} size={18} color={iconColor} />
              ) : (
                <MaterialCommunityIcons
                  name={icon as any}
                  size={18}
                  color={iconColor}
                />
              )}
            </View>
            <View>
              <Text style={[styles.macroTitle, { color: colors.text }]}>
                {title}
              </Text>
              <Text style={[styles.remaining, { color: colors.text }]}>
                {isLoading ? (
                  t("nutrition.loading")
                ) : isExactTarget(consumed, target) ? (
                  <Text
                    style={[
                      styles.remainingValue,
                      styles.targetReachedText,
                      { color: colors.success || "#4CAF50" },
                    ]}
                  >
                    {t("nutrition.targetReached")}
                  </Text>
                ) : consumed > target ? (
                  <>
                    {t("nutrition.excess")}{" "}
                    <Text
                      style={[
                        styles.remainingValue,
                        {
                          color:
                            consumed <=
                            (isMacro
                              ? target *
                                (title.includes(t("common.nutrition.protein"))
                                  ? 1.05
                                  : 1.03)
                              : target + 50)
                              ? colors.info
                              : colors.danger || "#FF3B30",
                        },
                      ]}
                    >
                      {Math.round(remaining)}
                      {unit}
                    </Text>
                  </>
                ) : (
                  <>
                    {t("nutrition.remaining")}{" "}
                    <Text
                      style={[styles.remainingValue, { color: progressColor }]}
                    >
                      {Math.round(remaining)}
                      {unit}
                    </Text>
                  </>
                )}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.progressWrapper}>
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: colors.border,
              },
            ]}
          >
            {!isLoading && (
              <Animated.View
                entering={FadeIn.delay(index * 100 + 300).duration(400)}
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: progressColor,
                    width: `${displayProgress}%`,
                  },
                ]}
              />
            )}
          </View>
          <Text style={[styles.progressText, { color: colors.text }]}>
            {isLoading
              ? "..."
              : `${Math.round(consumed)}/${Math.round(target)}${unit}`}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <TouchableOpacity>
      <Animated.View
        entering={FadeIn.duration(400).springify()}
        layout={Layout.springify()}
        key={`macros-card-${theme}-${date}`}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Animated.View
          entering={FadeInRight.duration(500).springify()}
          style={styles.headerContainer}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("nutrition.dailyProgress")}
          </Text>
        </Animated.View>

        {!nutritionInfo ||
        (!nutritionInfo.calories &&
          !nutritionInfo.protein &&
          !nutritionInfo.carbs &&
          !nutritionInfo.fat) ? (
          <View
            key={`no-targets-${theme}-${date}`}
            style={styles.noTargetsContainer}
          >
            <Text style={[styles.noTargetsText, { color: colors.text + "80" }]}>
              {t("nutrition.configureMacrosMessage")}
            </Text>
            <TouchableOpacity
              style={[styles.configButton, { backgroundColor: colors.tint }]}
            >
              <Text style={styles.configButtonText}>
                {t("nutrition.configureTargets")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            key={`macros-container-${theme}-${date}`}
            style={styles.macrosContainer}
          >
            {renderMacroProgress(
              t("common.nutrition.calories"),
              "flame-outline",
              "ionicons",
              dayTotals.calories,
              nutritionInfo.calories || 0,
              "kcal",
              0
            )}
            {renderMacroProgress(
              t("common.nutrition.protein"),
              "food-steak",
              "material",
              dayTotals.protein,
              nutritionInfo.protein || 0,
              "g",
              1
            )}
            {renderMacroProgress(
              t("common.nutrition.carbs"),
              "bread-slice",
              "material",
              dayTotals.carbs,
              nutritionInfo.carbs || 0,
              "g",
              2
            )}
            {renderMacroProgress(
              t("common.nutrition.fat"),
              "oil",
              "material",
              dayTotals.fat,
              nutritionInfo.fat || 0,
              "g",
              3
            )}
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 30,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 25,
  },
  macrosContainer: {
    gap: 20,
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  macroInfo: {
    flex: 1,
  },
  macroHeader: {
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
  macroTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  remaining: {
    fontSize: 13,
    opacity: 0.8,
  },
  remainingValue: {
    fontWeight: "600",
  },
  progressWrapper: {
    flex: 1,
    gap: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: "right",
    opacity: 0.8,
  },
  noTargetsContainer: {
    alignItems: "center",
    padding: 20,
  },
  noTargetsText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  configButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  configButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  targetReachedText: {
    fontWeight: "400",
  },
});
