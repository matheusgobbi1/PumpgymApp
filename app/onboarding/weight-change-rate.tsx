import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Animated } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import { useNutrition } from "../../context/NutritionContext";
import Slider from "@react-native-community/slider";
import { LineChart } from "react-native-chart-kit";
import OnboardingLayout from "../../components/onboarding/OnboardingLayout";

const screenWidth = Dimensions.get("window").width;

export default function WeightChangeRateScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();
  const [animatedValue] = useState(new Animated.Value(0));

  const [rate, setRate] = useState<number>(0.5);
  const [projectedData, setProjectedData] = useState<{
    labels: string[];
    datasets: { data: number[] }[];
    targetDate: Date;
  }>({ labels: [], datasets: [{ data: [] }], targetDate: new Date() });

  // Calcular os dados do gráfico baseado na taxa selecionada
  useEffect(() => {
    if (!nutritionInfo.weight || !nutritionInfo.targetWeight) return;

    const currentWeight = nutritionInfo.weight;
    const targetWeight = nutritionInfo.targetWeight;
    const weeklyChange = rate;
    const totalChange = targetWeight - currentWeight;
    const weeksToGoal = Math.abs(totalChange / weeklyChange);

    // Gerar apenas dados de início e fim
    const data = [currentWeight, targetWeight];
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + Math.ceil(weeksToGoal * 7));

    // Formatar datas para labels
    const labels = [
      "Hoje",
      targetDate.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "short",
      }),
    ];

    setProjectedData({
      labels,
      datasets: [{ data }],
      targetDate,
    });

    // Animar a mudança
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start();
  }, [rate, nutritionInfo.weight, nutritionInfo.targetWeight]);

  const handleNext = () => {
    updateNutritionInfo({ weightChangeRate: rate });
    router.push("/onboarding/diet-type" as any);
  };

  const handleBack = () => {
    router.back();
  };

  // Formatar a data alvo
  const formatTargetDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Determinar a velocidade baseada na taxa
  const getSpeedText = () => {
    if (rate <= 0.3) return "Conservadora";
    if (rate <= 0.7) return "Moderada";
    if (rate <= 0.9) return "Acelerada";
    return "Agressiva";
  };

  // Determinar a cor baseada na taxa
  const getSpeedColor = () => {
    if (rate <= 0.3) return "#4CAF50";
    if (rate <= 0.6) return "#2196F3";
    if (rate <= 0.9) return "#FF9800";
    return "#F44336";
  };

  return (
    <OnboardingLayout
      title="Velocidade da mudança"
      subtitle="Ajuste a velocidade para atingir seu objetivo de forma sustentável"
      currentStep={7}
      totalSteps={10}
      onBack={handleBack}
      onNext={handleNext}
    >
      <View style={styles.chartAndSliderContainer}>
        <Animated.View
          style={[
            styles.chartContainer,
            {
              transform: [
                {
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
              opacity: animatedValue,
            },
          ]}
        >
          <LineChart
            data={{
              labels: projectedData.labels,
              datasets: projectedData.datasets,
            }}
            width={screenWidth - 48}
            height={200}
            chartConfig={{
              backgroundColor: colors.primary,
              backgroundGradientFrom: colors.background,
              backgroundGradientTo: colors.background,
              decimalPlaces: 1,
              color: (opacity = 1) => getSpeedColor(),
              labelColor: (opacity = 1) => colors.text,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: getSpeedColor(),
              },
            }}
            bezier
            style={styles.chart}
          />
        </Animated.View>

        <View style={styles.sliderContainer}>
          <Text style={[styles.sliderLabel, { color: colors.text }]}>
            Velocidade:{" "}
            <Text style={{ color: getSpeedColor() }}>{getSpeedText()}</Text>
          </Text>
          <Text style={[styles.rateText, { color: colors.text }]}>
            {rate.toFixed(1)}kg por semana
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0.2}
            maximumValue={1.2}
            step={0.1}
            value={rate}
            onValueChange={setRate}
            minimumTrackTintColor={getSpeedColor()}
            maximumTrackTintColor={colors.border}
            thumbTintColor={getSpeedColor()}
          />
          <View style={styles.sliderLabels}>
            <Text style={[styles.sliderEndLabel, { color: colors.text }]}>
              0.2kg
            </Text>
            <Text style={[styles.sliderEndLabel, { color: colors.text }]}>
              1.2kg
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.light }]}>
          <Text style={[styles.statLabel, { color: colors.text }]}>
            Peso Atual
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {nutritionInfo.weight?.toFixed(1)}kg
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.light }]}>
          <Text style={[styles.statLabel, { color: colors.text }]}>
            Peso Meta
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {nutritionInfo.targetWeight?.toFixed(1)}kg
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.light, width: "100%" },
          ]}
        >
          <Text style={[styles.statLabel, { color: colors.text }]}>
            Data Prevista
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatTargetDate(projectedData.targetDate)}
          </Text>
        </View>
      </View>

      <View style={[styles.infoBox, { backgroundColor: colors.light }]}>
        <Ionicons
          name="information-circle-outline"
          size={24}
          color={getSpeedColor()}
          style={styles.infoIcon}
        />
        <Text style={[styles.infoText, { color: colors.text }]}>
          Uma mudança de {rate.toFixed(1)}kg por semana é considerada
          <Text style={{ color: getSpeedColor() }}>
            {" "}
            {getSpeedText().toLowerCase()}{" "}
          </Text>
          e{" "}
          {rate > 0.9 ? "pode ser desafiadora" : "tem boas chances de sucesso"}.
          Ajuste conforme sua rotina e disposição.
        </Text>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  chartAndSliderContainer: {
    marginTop: 20,
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    minWidth: "45%",
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "600",
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderLabel: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
  },
  rateText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -8,
  },
  sliderEndLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  infoBox: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
