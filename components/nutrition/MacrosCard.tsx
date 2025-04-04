import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
}

export default function MacrosCard({
  dayTotals,
  nutritionInfo,
}: MacrosCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();

  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});

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

  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    // Forçar re-renderização quando o tema mudar
    setForceUpdate({});
  }, [theme]);

  const calculateProgress = (consumed: number, target: number) => {
    if (!target) return 0;
    return (consumed / target) * 100;
  };

  const calculateRemaining = (consumed: number, target: number) => {
    if (!target) return 0;
    return target - consumed;
  };

  const getProgressColor = (
    percentage: number,
    consumed: number,
    target: number,
    isMacro: boolean
  ) => {
    // Para macros (proteína, carboidratos, gordura)
    if (isMacro && consumed > target) {
      return colors.danger || "#FF3B30";
    }

    // Para calorias (permitir 100 kcal de excesso)
    if (!isMacro && consumed > target + 100) {
      return colors.danger || "#FF3B30";
    }

    if (percentage >= 90 && percentage <= 110)
      return colors.success || "#4CAF50";
    if (percentage < 90) return colors.primary;
    return colors.danger || "#FF3B30";
  };

  const renderMacroProgress = (
    title: string,
    icon: string,
    iconType: "ionicons" | "material",
    consumed: number,
    target: number,
    unit: string
  ) => {
    const progress = calculateProgress(consumed, target);
    const remaining = calculateRemaining(consumed, target);
    const isMacro = unit === "g"; // Verificar se é um macro (proteínas, carbos, gorduras) ou calorias
    const progressColor = getProgressColor(progress, consumed, target, isMacro);
    const isExceeded = remaining < 0;

    // Determinar a cor do ícone com base no status de progresso
    let iconColor;

    // Status de conclusão:
    if (progress >= 90 && progress <= 110) {
      // Ideal: entre 90% e 110% da meta
      iconColor = colors.success || "#4CAF50";
    } else if (progress < 90) {
      // Abaixo: menos de 90% da meta
      iconColor = colors.primary;
    } else {
      // Excesso: mais de 110% da meta
      iconColor = colors.danger || "#FF3B30";
    }

    // Mostra excesso mesmo quando excede por 1g para macros ou 100kcal para calorias
    const showExcess = isMacro ? consumed > target : consumed > target + 100;

    const displayProgress = Math.min(progress, 100);

    return (
      <View key={`macro-${title}-${theme}`} style={styles.macroRow}>
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
                ) : showExcess ? (
                  <>
                    {t("nutrition.excess")}{" "}
                    <Text
                      style={[
                        styles.remainingValue,
                        { color: colors.danger || "#FF3B30" },
                      ]}
                    >
                      {Math.abs(Math.round(remaining))}
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
          <MotiView
            key={`progress-bar-${title}-${theme}`}
            style={[
              styles.progressBar,
              {
                backgroundColor: colors.border,
              },
            ]}
          >
            {!isLoading && (
              <MotiView
                key={`progress-fill-${title}-${theme}`}
                from={{ width: "0%" }}
                animate={{ width: `${displayProgress}%` }}
                transition={{ type: "timing", duration: 1000 }}
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: progressColor,
                  },
                ]}
              />
            )}
          </MotiView>
          <Text style={[styles.progressText, { color: colors.text }]}>
            {isLoading
              ? "..."
              : `${Math.round(consumed)}/${Math.round(target)}${unit}`}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity>
      <View
        key={`macros-card-${theme}`}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t("nutrition.dailyProgress")}
        </Text>

        {!nutritionInfo ||
        (!nutritionInfo.calories &&
          !nutritionInfo.protein &&
          !nutritionInfo.carbs &&
          !nutritionInfo.fat) ? (
          <View key={`no-targets-${theme}`} style={styles.noTargetsContainer}>
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
            key={`macros-container-${theme}`}
            style={styles.macrosContainer}
          >
            {renderMacroProgress(
              t("common.nutrition.calories"),
              "flame-outline",
              "ionicons",
              dayTotals.calories,
              nutritionInfo.calories || 0,
              "kcal"
            )}
            {renderMacroProgress(
              t("common.nutrition.protein"),
              "food-steak",
              "material",
              dayTotals.protein,
              nutritionInfo.protein || 0,
              "g"
            )}
            {renderMacroProgress(
              t("common.nutrition.carbs"),
              "bread-slice",
              "material",
              dayTotals.carbs,
              nutritionInfo.carbs || 0,
              "g"
            )}
            {renderMacroProgress(
              t("common.nutrition.fat"),
              "oil",
              "material",
              dayTotals.fat,
              nutritionInfo.fat || 0,
              "g"
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 30,
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
});
