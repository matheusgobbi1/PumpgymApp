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

interface ProgressData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
  legend?: string[];
}

interface ProgressSummaryCardProps {
  title: string;
  subtitle: string;
  data: ProgressData;
  metricName: string;
  metricUnit: string;
  currentValue: number;
  changePercentage: number;
  onPressViewMore: () => void;
}

export default function ProgressSummaryCard({
  title,
  subtitle,
  data,
  metricName,
  metricUnit,
  currentValue,
  changePercentage,
  onPressViewMore,
}: ProgressSummaryCardProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

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
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: colors.secondary }]}>
              {subtitle}
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

        <View style={styles.metricsContainer}>
          <View style={styles.metricValueContainer}>
            <Text style={[styles.metricName, { color: colors.secondary }]}>
              {metricName}
            </Text>
            <View style={styles.valueRow}>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {currentValue}
              </Text>
              <Text style={[styles.metricUnit, { color: colors.secondary }]}>
                {metricUnit}
              </Text>
            </View>
            <View style={styles.changeContainer}>
              <Ionicons
                name={
                  changePercentage > 0
                    ? "arrow-up-outline"
                    : changePercentage < 0
                    ? "arrow-down-outline"
                    : "remove-outline"
                }
                size={14}
                color={
                  changePercentage > 0
                    ? colors.success
                    : changePercentage < 0
                    ? colors.danger
                    : colors.secondary
                }
              />
              <Text
                style={[
                  styles.changeText,
                  {
                    color:
                      changePercentage > 0
                        ? colors.success
                        : changePercentage < 0
                        ? colors.danger
                        : colors.secondary,
                  },
                ]}
              >
                {Math.abs(changePercentage)}%
              </Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <LineChart
              data={data}
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
    paddingBottom: 8,
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
  metricsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  metricValueContainer: {
    marginBottom: 16,
  },
  metricName: {
    fontSize: 14,
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  metricUnit: {
    fontSize: 14,
    marginLeft: 4,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 2,
  },
  chartContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  chart: {
    borderRadius: 16,
    paddingRight: 16,
  },
});
