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
import { LineChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 64;

interface BodyStat {
  label: string;
  value: string;
  unit: string;
  icon: string;
}

interface BodyStatsCardProps {
  stats: BodyStat[];
  weightHistory: {
    labels: string[];
    data: number[];
  };
  targetWeight: number;
  onPressViewMore: () => void;
  onPressUpdateWeight: () => void;
}

export default function BodyStatsCard({
  stats,
  weightHistory,
  targetWeight,
  onPressViewMore,
  onPressUpdateWeight,
}: BodyStatsCardProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Calcular a diferença entre o peso atual e o peso alvo
  const currentWeight = weightHistory.data[weightHistory.data.length - 1];
  const weightDifference = currentWeight - targetWeight;
  const isWeightLoss = weightDifference > 0;

  // Configuração do gráfico
  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 1,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.secondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      stroke: colors.border,
      strokeWidth: 1,
    },
  };

  const chartData = {
    labels: weightHistory.labels,
    datasets: [
      {
        data: weightHistory.data,
        color: (opacity = 1) => `rgba(28, 154, 190, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: Array(weightHistory.labels.length).fill(targetWeight),
        color: (opacity = 1) => `rgba(255, 193, 7, ${opacity})`,
        strokeWidth: 2,
        strokeDashArray: [5, 5],
      },
    ],
    legend: ["Peso Atual", "Peso Alvo"],
  };

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(400)}>
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
              Estatísticas Corporais
            </Text>
            <Text style={[styles.subtitle, { color: colors.secondary }]}>
              Acompanhe seu progresso físico
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.viewMoreButton, { borderColor: colors.border }]}
            onPress={onPressViewMore}
          >
            <Text style={[styles.viewMoreText, { color: colors.primary }]}>
              Ver Mais
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Estatísticas corporais */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View
              key={`body-stat-${index}`}
              style={[styles.statItem, { borderColor: colors.border }]}
            >
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name={stat.icon as any}
                  size={18}
                  color={colors.primary}
                />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={[styles.statLabel, { color: colors.secondary }]}>
                  {stat.label}
                </Text>
                <View style={styles.statValueContainer}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {stat.value}
                  </Text>
                  <Text style={[styles.statUnit, { color: colors.secondary }]}>
                    {stat.unit}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Gráfico de peso */}
        <View style={[styles.chartSection, { borderTopColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                Histórico de Peso
              </Text>
              <View style={styles.weightGoalContainer}>
                <Text
                  style={[styles.weightGoalText, { color: colors.secondary }]}
                >
                  {isWeightLoss
                    ? `${weightDifference.toFixed(1)}kg para perder`
                    : `${Math.abs(weightDifference).toFixed(1)}kg para ganhar`}
                </Text>
                <Ionicons
                  name={isWeightLoss ? "arrow-down" : "arrow-up"}
                  size={14}
                  color={isWeightLoss ? colors.success : colors.warning}
                />
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.updateWeightButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={onPressUpdateWeight}
            >
              <Text style={styles.updateWeightText}>Atualizar</Text>
              <Ionicons name="add" size={16} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.chartContainer}>
            <LineChart
              data={chartData}
              width={CHART_WIDTH}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={false}
              withHorizontalLabels={true}
              withVerticalLabels={true}
              withDots={true}
              segments={4}
              fromZero={false}
              yAxisSuffix="kg"
            />
          </View>
        </View>
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
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  viewMoreText: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  statUnit: {
    fontSize: 12,
    marginLeft: 4,
  },
  chartSection: {
    borderTopWidth: 1,
    paddingTop: 16,
    paddingBottom: 16,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  weightGoalContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  weightGoalText: {
    fontSize: 12,
    marginRight: 4,
  },
  updateWeightButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  updateWeightText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
    marginRight: 4,
  },
  chartContainer: {
    alignItems: "center",
  },
  chart: {
    borderRadius: 16,
    paddingRight: 16,
  },
});
