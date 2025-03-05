import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

interface NutritionGoal {
  name: string;
  current: number;
  target: number;
  unit: string;
  icon: string;
  color: string;
}

interface NutritionGoalsCardProps {
  goals: NutritionGoal[];
  onPressEditGoals: () => void;
  onPressViewDetails: () => void;
}

export default function NutritionGoalsCard({
  goals,
  onPressEditGoals,
  onPressViewDetails,
}: NutritionGoalsCardProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Calcular porcentagem de progresso para cada meta
  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  // Determinar a cor do progresso com base na porcentagem
  const getProgressColor = (percentage: number) => {
    if (percentage < 70) return colors.warning;
    if (percentage < 90) return colors.primary;
    if (percentage <= 110) return colors.success;
    return colors.danger;
  };

  return (
    <Animated.View entering={FadeInDown.delay(300).duration(400)}>
      <MotiView
        style={[
          styles.container,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 400 }}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              Metas Nutricionais
            </Text>
            <Text style={[styles.subtitle, { color: colors.secondary }]}>
              Seus objetivos diários
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.editButton,
              { backgroundColor: colors.primary + "20" },
            ]}
            onPress={onPressEditGoals}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Lista de metas nutricionais */}
        <View style={styles.goalsList}>
          {goals.map((goal, index) => {
            const progressPercentage = calculateProgress(
              goal.current,
              goal.target
            );
            const progressColor = getProgressColor(progressPercentage);

            return (
              <View
                key={`goal-${index}`}
                style={[
                  styles.goalItem,
                  index < goals.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.goalIconContainer,
                    { backgroundColor: goal.color + "20" },
                  ]}
                >
                  <Ionicons
                    name={goal.icon as any}
                    size={18}
                    color={goal.color}
                  />
                </View>

                <View style={styles.goalContent}>
                  <View style={styles.goalHeader}>
                    <Text style={[styles.goalName, { color: colors.text }]}>
                      {goal.name}
                    </Text>
                    <Text
                      style={[styles.goalValues, { color: colors.secondary }]}
                    >
                      {goal.current} / {goal.target} {goal.unit}
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
                          width: `${progressPercentage}%`,
                          backgroundColor: progressColor,
                        },
                      ]}
                    />
                  </View>

                  <Text style={[styles.progressText, { color: progressColor }]}>
                    {progressPercentage.toFixed(0)}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Botão para ver detalhes */}
        <TouchableOpacity
          style={[styles.viewDetailsButton, { borderTopColor: colors.border }]}
          onPress={onPressViewDetails}
        >
          <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
            Ver Detalhes Completos
          </Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </MotiView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  goalsList: {
    paddingHorizontal: 16,
  },
  goalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  goalIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  goalContent: {
    flex: 1,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  goalName: {
    fontSize: 14,
    fontWeight: "600",
  },
  goalValues: {
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    width: "100%",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    fontWeight: "600",
    alignSelf: "flex-end",
  },
  viewDetailsButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 6,
  },
});
