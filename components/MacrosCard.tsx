import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

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
  colors: any;
}

export default function MacrosCard({
  dayTotals,
  nutritionInfo,
  colors,
}: MacrosCardProps) {
  const calculateProgress = (consumed: number, target: number) => {
    if (!target) return 0;
    return Math.min(Math.max((consumed / target) * 100, 0), 100);
  };

  const calculateRemaining = (consumed: number, target: number) => {
    if (!target) return 0;
    return Math.max(target - consumed, 0);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90 && percentage <= 110) return "#4CAF50";
    if (percentage < 90) return "#2196F3";
    return "#FF5722";
  };

  const renderMacroProgress = (
    title: string,
    icon: string,
    consumed: number,
    target: number,
    unit: string
  ) => {
    const progress = calculateProgress(consumed, target);
    const remaining = calculateRemaining(consumed, target);
    const progressColor = getProgressColor(progress);

    return (
      <MotiView
        style={styles.macroRow}
        from={{ opacity: 0, translateX: -20 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: "spring", delay: title === "Calorias" ? 100 : 200 }}
      >
        <View style={styles.macroInfo}>
          <View style={styles.macroHeader}>
            <Ionicons name={icon as any} size={20} color={progressColor} />
            <Text style={[styles.macroTitle, { color: colors.text }]}>
              {title}
            </Text>
          </View>
          <Text style={[styles.remaining, { color: colors.text }]}>
            Restam{" "}
            <Text style={[styles.remainingValue, { color: progressColor }]}>
              {Math.round(remaining)}
              {unit}
            </Text>
          </Text>
        </View>

        <View style={styles.progressWrapper}>
          <MotiView
            style={[
              styles.progressBar,
              {
                backgroundColor: colors.border,
              },
            ]}
          >
            <MotiView
              from={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "timing", duration: 1000 }}
              style={[
                styles.progressFill,
                {
                  backgroundColor: progressColor,
                },
              ]}
            />
          </MotiView>
          <Text style={[styles.progressText, { color: colors.text }]}>
            {Math.round(consumed)}/{Math.round(target)}
            {unit}
          </Text>
        </View>
      </MotiView>
    );
  };

  return (
    <MotiView
      style={[styles.container, { backgroundColor: colors.card }]}
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring" }}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Progresso Diário
      </Text>

      <View style={styles.macrosContainer}>
        {renderMacroProgress(
          "Calorias",
          "flame-outline",
          dayTotals.calories,
          nutritionInfo.calories || 0,
          "kcal"
        )}
        {renderMacroProgress(
          "Proteína",
          "fitness-outline",
          dayTotals.protein,
          nutritionInfo.protein || 0,
          "g"
        )}
        {renderMacroProgress(
          "Carboidratos",
          "leaf-outline",
          dayTotals.carbs,
          nutritionInfo.carbs || 0,
          "g"
        )}
        {renderMacroProgress(
          "Gorduras",
          "water-outline",
          dayTotals.fat,
          nutritionInfo.fat || 0,
          "g"
        )}
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  macrosContainer: {
    gap: 16,
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  macroInfo: {
    flex: 1,
    gap: 4,
  },
  macroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
});
