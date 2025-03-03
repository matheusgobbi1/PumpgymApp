import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";

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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90 && percentage <= 110) return colors.success || "#4CAF50";
    if (percentage < 90) return colors.primary;
    return colors.danger || "#FF3B30";
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
    const isExceeded = remaining < 0;

    const displayProgress = Math.min(progress, 100);

    return (
      <MotiView
        key={`macro-${title}-${theme}`}
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
            {isLoading ? (
              "Carregando..."
            ) : isExceeded ? (
              <>
                Excesso{" "}
                <Text style={[styles.remainingValue, { color: progressColor }]}>
                  {Math.abs(Math.round(remaining))}
                  {unit}
                </Text>
              </>
            ) : (
              <>
                Restam{" "}
                <Text style={[styles.remainingValue, { color: progressColor }]}>
                  {Math.round(remaining)}
                  {unit}
                </Text>
              </>
            )}
          </Text>
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
      </MotiView>
    );
  };

  return (
    <TouchableOpacity
      onPress={() => router.push("/macros-details")}
      activeOpacity={0.7}
    >
      <MotiView
        key={`macros-card-${theme}`}
        style={[styles.container, { backgroundColor: colors.background }]}
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring" }}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Progresso Diário
        </Text>

        {!nutritionInfo || (!nutritionInfo.calories && !nutritionInfo.protein && !nutritionInfo.carbs && !nutritionInfo.fat) ? (
          <View key={`no-targets-${theme}`} style={styles.noTargetsContainer}>
            <Text style={[styles.noTargetsText, { color: colors.text + "80" }]}>
              Configure suas metas de macronutrientes para acompanhar seu progresso diário
            </Text>
            <TouchableOpacity
              style={[styles.configButton, { backgroundColor: colors.tint }]}
              onPress={() => router.push("/macros-details")}
            >
              <Text style={styles.configButtonText}>Configurar Metas</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View key={`macros-container-${theme}`} style={styles.macrosContainer}>
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
        )}
      </MotiView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 5,
    marginBottom: 16,
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
