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
import { BarChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 64;

interface TrainingStatItem {
  label: string;
  value: string;
  icon: string;
  change: number;
}

interface TrainingStatsCardProps {
  stats: TrainingStatItem[];
  weeklyVolume: {
    labels: string[];
    data: number[];
  };
  onPressViewHistory: () => void;
}

export default function TrainingStatsCard({
  stats,
  weeklyVolume,
  onPressViewHistory,
}: TrainingStatsCardProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Formatar o volume para exibição
  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k kg`;
    }
    return `${volume} kg`;
  };

  // Configuração do gráfico
  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.secondary,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.6,
  };

  const chartData = {
    labels: weeklyVolume.labels,
    datasets: [
      {
        data: weeklyVolume.data,
        colors: weeklyVolume.data.map((value) =>
          value === Math.max(...weeklyVolume.data)
            ? (opacity = 1) => colors.primary
            : (opacity = 1) => colors.primary + "80"
        ),
      },
    ],
  };

  return (
    <Animated.View entering={FadeInDown.delay(400).duration(400)}>
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
              Estatísticas de Treino
            </Text>
            <Text style={[styles.subtitle, { color: colors.secondary }]}>
              Últimos 30 dias
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.viewHistoryButton, { borderColor: colors.border }]}
            onPress={onPressViewHistory}
          >
            <Text style={[styles.viewHistoryText, { color: colors.primary }]}>
              Histórico
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Estatísticas de treino */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View
              key={`training-stat-${index}`}
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
              <View style={styles.statContent}>
                <Text style={[styles.statLabel, { color: colors.secondary }]}>
                  {stat.label}
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stat.value}
                </Text>
                {stat.change !== 0 && (
                  <View style={styles.changeContainer}>
                    <Ionicons
                      name={stat.change > 0 ? "arrow-up" : "arrow-down"}
                      size={12}
                      color={stat.change > 0 ? colors.success : colors.danger}
                    />
                    <Text
                      style={[
                        styles.changeText,
                        {
                          color:
                            stat.change > 0 ? colors.success : colors.danger,
                        },
                      ]}
                    >
                      {Math.abs(stat.change)}%
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Gráfico de volume semanal */}
        <View style={[styles.chartSection, { borderTopColor: colors.border }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Volume de Treino Semanal
          </Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={chartData}
              width={CHART_WIDTH}
              height={180}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
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
  viewHistoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  viewHistoryText: {
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
    width: "50%",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  changeText: {
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 2,
  },
  chartSection: {
    borderTopWidth: 1,
    paddingTop: 16,
    paddingBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 16,
    marginBottom: 12,
  },
  chartContainer: {
    alignItems: "center",
  },
  chart: {
    borderRadius: 16,
    paddingRight: 16,
  },
});
