import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useNutrition } from "../../context/NutritionContext";
import Slider from "@react-native-community/slider";
import { LineChart } from "react-native-chart-kit";
import OnboardingLayout from "../../components/onboarding/OnboardingLayout";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const screenWidth = Dimensions.get("window").width;

// Função para interpolar cores em formato hexadecimal
const interpolateColor = (color1: string, color2: string, ratio: number) => {
  // Converter cores hex para RGB
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);

  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);

  // Interpolar cada componente
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  // Converter de volta para hex
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

export default function WeightChangeRateScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();
  const sliderRef = useRef<any>(null);
  const animatedScale = useRef(new Animated.Value(1)).current;

  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});

  // Estado para armazenar a cor atual do gráfico
  const [chartColor, setChartColor] = useState<string>(colors.primary);

  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

  const [rate, setRate] = useState<number>(0.5);
  const [projectedData, setProjectedData] = useState<{
    labels: string[];
    datasets: { data: number[] }[];
    targetDate: Date;
    weeksToGoal: number;
    dates?: Date[];
  }>({
    labels: [],
    datasets: [{ data: [] }],
    targetDate: new Date(),
    weeksToGoal: 0,
  });

  // Atualizar a cor do gráfico quando a taxa muda
  useEffect(() => {
    // Determinar a cor baseada na taxa
    let newColor: string;
    if (rate <= 0.3) {
      newColor = colors.success;
    } else if (rate <= 0.6) {
      newColor = colors.primary;
    } else if (rate <= 0.9) {
      newColor = colors.warning;
    } else {
      newColor = colors.danger;
    }

    // Atualizar o estado da cor
    setChartColor(newColor);
  }, [rate, colors]);

  // Calcular os dados do gráfico baseado na taxa selecionada
  useEffect(() => {
    if (!nutritionInfo.weight || !nutritionInfo.targetWeight) return;

    const currentWeight = nutritionInfo.weight;
    const targetWeight = nutritionInfo.targetWeight;
    const weeklyChange = rate;
    const totalChange = targetWeight - currentWeight;
    const weeksToGoal = Math.abs(totalChange / weeklyChange);
    const isGaining = totalChange > 0;

    // Gerar pontos intermediários para o gráfico
    const numPoints = 5; // Número de pontos no gráfico
    const data = [];
    const labels = [];
    const dates = [];
    const today = new Date();

    for (let i = 0; i < numPoints; i++) {
      const progress = i / (numPoints - 1);
      const weight = currentWeight + progress * totalChange;
      data.push(parseFloat(weight.toFixed(1)));

      // Calcular a data para cada ponto
      const pointDate = new Date(today);
      const daysToAdd = Math.ceil(progress * weeksToGoal * 7);
      pointDate.setDate(pointDate.getDate() + daysToAdd);
      dates.push(pointDate);

      if (i === 0) {
        labels.push("Hoje");
      } else if (i === numPoints - 1) {
        labels.push("Meta");
      } else {
        // Datas intermediárias formatadas
        labels.push(formatShortDate(pointDate));
      }
    }

    const targetDate = dates[dates.length - 1];

    setProjectedData({
      labels,
      datasets: [{ data }],
      targetDate,
      weeksToGoal,
      dates,
    });
  }, [rate, nutritionInfo.weight, nutritionInfo.targetWeight]);

  // Função para animar o gráfico quando o valor do slider muda
  const animateChart = () => {
    // Feedback tátil sutil
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animar o gráfico com um efeito de pulso
    Animated.sequence([
      Animated.timing(animatedScale, {
        toValue: 1.03,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animatedScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Função para lidar com a mudança do slider
  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    animateChart();

    // Feedback tátil adicional em valores específicos
    if (
      newRate === 0.3 ||
      newRate === 0.6 ||
      newRate === 0.9 ||
      newRate === 1.2
    ) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

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

  // Formatar data curta para o gráfico
  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
    });
  };

  // Formatar data intermediária
  const formatIntermediateDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
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
    if (rate <= 0.3) return colors.success;
    if (rate <= 0.6) return colors.primary;
    if (rate <= 0.9) return colors.warning;
    return colors.danger;
  };

  // Determinar o ícone baseado na velocidade
  const getSpeedIcon = () => {
    if (rate <= 0.3) return "leaf-outline";
    if (rate <= 0.7) return "walk-outline";
    if (rate <= 0.9) return "bicycle-outline";
    return "flash-outline";
  };

  // Calcular a diferença de peso
  const getWeightDifference = () => {
    if (!nutritionInfo.weight || !nutritionInfo.targetWeight) return 0;
    return nutritionInfo.targetWeight - nutritionInfo.weight;
  };

  // Determinar se está ganhando ou perdendo peso
  const isGainingWeight = getWeightDifference() > 0;

  // Determinar o texto de descrição
  const getDescriptionText = () => {
    const diff = Math.abs(getWeightDifference()).toFixed(1);
    const speedText = getSpeedText().toLowerCase();
    const timeText = Math.ceil(projectedData.weeksToGoal);

    if (isGainingWeight) {
      return `Você ganhará ${diff}kg em aproximadamente ${timeText} semanas com uma velocidade ${speedText}.`;
    } else {
      return `Você perderá ${diff}kg em aproximadamente ${timeText} semanas com uma velocidade ${speedText}.`;
    }
  };

  // Presets de velocidade
  const speedPresets = [
    { label: "Lenta", value: 0.3 },
    { label: "Moderada", value: 0.6 },
    { label: "Rápida", value: 0.9 },
    { label: "Intensa", value: 1.2 },
  ];

  return (
    <OnboardingLayout
      title="Velocidade da mudança"
      subtitle="Ajuste a velocidade para atingir seu objetivo de forma sustentável"
      currentStep={7}
      totalSteps={10}
      onBack={handleBack}
      onNext={handleNext}
    >
      <MotiView
        key={`content-container-${theme}`}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500 }}
        style={styles.contentContainer}
      >
        {/* Card principal com gráfico */}
        <MotiView
          key={`chart-card-${theme}`}
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 200 }}
          style={[
            styles.chartCard,
            {
              backgroundColor: theme === "dark" ? colors.dark : colors.light,
              borderColor: getSpeedColor() + "20",
              shadowColor: colors.text,
              overflow: "hidden",
            },
          ]}
        >
          <View key={`chart-header-${theme}`} style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                Projeção de {isGainingWeight ? "Ganho" : "Perda"}
              </Text>
              <Animated.Text
                style={[
                  styles.chartSubtitle,
                  {
                    color: colors.text + "80",
                    transform: [{ scale: animatedScale }],
                  },
                ]}
              >
                {Math.abs(getWeightDifference()).toFixed(1)}kg em{" "}
                {Math.ceil(projectedData.weeksToGoal)} semanas
              </Animated.Text>
            </View>
            <Ionicons
              name={isGainingWeight ? "trending-up" : "trending-down"}
              size={28}
              color={getSpeedColor()}
            />
          </View>

          <Animated.View
            key={`chart-container-${theme}`}
            style={[
              styles.chartContainer,
              { transform: [{ scale: animatedScale }] },
            ]}
          >
            <LineChart
              data={{
                labels: projectedData.labels,
                datasets: [
                  {
                    data: projectedData.datasets[0].data,
                    color: (opacity = 1) => {
                      return (
                        chartColor +
                        Math.round(opacity * 255)
                          .toString(16)
                          .padStart(2, "0")
                      );
                    },
                  },
                ],
              }}
              width={screenWidth - 80}
              height={180}
              chartConfig={{
                backgroundColor: "transparent",
                backgroundGradientFrom:
                  theme === "dark" ? colors.dark : colors.light,
                backgroundGradientTo:
                  theme === "dark" ? colors.dark : colors.light,
                decimalPlaces: 1,
                color: (opacity = 1) => {
                  return (
                    chartColor +
                    Math.round(opacity * 255)
                      .toString(16)
                      .padStart(2, "0")
                  );
                },
                labelColor: (opacity = 1) =>
                  colors.text + (opacity * 100).toString(16).padStart(2, "0"),
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: chartColor,
                },
                propsForBackgroundLines: {
                  stroke: colors.border + "40",
                  strokeDasharray: "5, 5",
                },
                propsForLabels: {
                  fontWeight: "bold",
                  fontSize: 10,
                },
                fillShadowGradient: chartColor,
                fillShadowGradientOpacity: 0.2,
              }}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={false}
              withHorizontalLabels={true}
              withVerticalLabels={true}
              withDots={true}
              segments={4}
              fromZero={false}
              yAxisSuffix="kg"
              renderDotContent={({ x, y, index }) => {
                if (
                  index === 0 ||
                  index === projectedData.datasets[0].data.length - 1
                ) {
                  return (
                    <View
                      key={`dot-label-${index}-${theme}-${rate}`}
                      style={{
                        position: "absolute",
                        top: y - 36,
                        left: x - 30,
                        width: 60,
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: chartColor + "20",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: chartColor,
                        }}
                      >
                        <Text
                          style={{
                            color: chartColor,
                            fontSize: 10,
                            fontWeight: "bold",
                          }}
                        >
                          {projectedData.datasets[0].data[index]}kg
                        </Text>
                      </View>
                    </View>
                  );
                }
                return null;
              }}
            />

            {/* Datas de início e fim simplificadas */}
            <View
              key={`chart-dates-${theme}-${rate}`}
              style={styles.chartDates}
            >
              <MotiView
                key={`start-date-${theme}-${rate}`}
                style={[
                  styles.dateChip,
                  {
                    backgroundColor: chartColor + "10",
                    borderColor: chartColor + "30",
                    left: 0,
                  },
                ]}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "spring", delay: 200 }}
              >
                <Text style={[styles.dateChipText, { color: chartColor }]}>
                  Hoje
                </Text>
              </MotiView>

              <MotiView
                key={`end-date-${theme}-${rate}`}
                style={[
                  styles.dateChip,
                  {
                    backgroundColor: chartColor + "10",
                    borderColor: chartColor + "30",
                    right: 0,
                  },
                ]}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "spring", delay: 300 }}
              >
                <Text style={[styles.dateChipText, { color: chartColor }]}>
                  {formatShortDate(projectedData.targetDate)} •{" "}
                  {Math.ceil(projectedData.weeksToGoal)} semanas
                </Text>
              </MotiView>
            </View>
          </Animated.View>
        </MotiView>

        {/* Card de velocidade */}
        <MotiView
          key={`speed-card-${theme}`}
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 300 }}
          style={[
            styles.speedCard,
            {
              backgroundColor: theme === "dark" ? colors.dark : colors.light,
              borderColor: getSpeedColor() + "20",
              shadowColor: colors.text,
              overflow: "hidden",
            },
          ]}
        >
          <View key={`speed-header-${theme}`} style={styles.speedHeader}>
            <View
              style={[
                styles.speedIconContainer,
                { backgroundColor: getSpeedColor() + "20" },
              ]}
            >
              <Ionicons
                name={getSpeedIcon()}
                size={24}
                color={getSpeedColor()}
              />
            </View>
            <View style={styles.speedTextContainer}>
              <Text style={[styles.speedTitle, { color: colors.text }]}>
                Velocidade {getSpeedText()}
              </Text>
              <Animated.Text
                style={[
                  styles.speedValue,
                  {
                    color: getSpeedColor(),
                    transform: [{ scale: animatedScale }],
                  },
                ]}
              >
                {rate.toFixed(1)}kg por semana
              </Animated.Text>
            </View>
          </View>

          <View
            key={`slider-container-${theme}`}
            style={styles.sliderContainer}
          >
            <Slider
              ref={sliderRef}
              style={styles.slider}
              minimumValue={0.2}
              maximumValue={1.2}
              step={0.1}
              value={rate}
              onValueChange={handleRateChange}
              minimumTrackTintColor={getSpeedColor()}
              maximumTrackTintColor={colors.border}
              thumbTintColor={getSpeedColor()}
            />

            <View key={`preset-buttons-${theme}`} style={styles.presetButtons}>
              {speedPresets.map((preset, index) => (
                <TouchableOpacity
                  key={`preset-${index}-${theme}`}
                  style={[
                    styles.presetButton,
                    {
                      backgroundColor:
                        Math.abs(rate - preset.value) < 0.05
                          ? getSpeedColor() + "20"
                          : theme === "dark"
                          ? colors.dark + "80"
                          : colors.light + "80",
                      borderColor:
                        Math.abs(rate - preset.value) < 0.05
                          ? getSpeedColor()
                          : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setRate(preset.value);
                    animateChart();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                >
                  <Text
                    style={[
                      styles.presetButtonText,
                      {
                        color:
                          Math.abs(rate - preset.value) < 0.05
                            ? getSpeedColor()
                            : colors.text,
                      },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </MotiView>

        {/* Card de informações */}
        <MotiView
          key={`info-card-${theme}`}
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 400 }}
          style={[
            styles.infoCard,
            {
              backgroundColor: theme === "dark" ? colors.dark : colors.light,
              borderColor: colors.primary + "20",
              shadowColor: colors.text,
              overflow: "hidden",
            },
          ]}
        >
          <View key={`info-content-${theme}`} style={styles.infoContent}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.text + "80" }]}>
                  Peso Atual
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {nutritionInfo.weight?.toFixed(1)}kg
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.text + "80" }]}>
                  Peso Meta
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {nutritionInfo.targetWeight?.toFixed(1)}kg
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.text + "80" }]}>
                  Data Prevista
                </Text>
                <Animated.Text
                  style={[
                    styles.infoValue,
                    {
                      color: colors.text,
                      transform: [{ scale: animatedScale }],
                    },
                  ]}
                >
                  {formatTargetDate(projectedData.targetDate)}
                </Animated.Text>
              </View>
            </View>
          </View>

          <View
            key={`info-footer-${theme}`}
            style={[
              styles.infoFooter,
              {
                borderTopColor:
                  theme === "dark"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.05)",
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={getSpeedColor()}
              style={styles.infoIcon}
            />
            <Animated.Text
              style={[
                styles.infoText,
                {
                  color: colors.text + "80",
                  transform: [{ scale: animatedScale }],
                },
              ]}
            >
              {getDescriptionText()}
            </Animated.Text>
          </View>
        </MotiView>
      </MotiView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  chartCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  chartSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  chartContainer: {
    alignItems: "center",
  },
  chart: {
    borderRadius: 16,
  },
  speedCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  speedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  speedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  speedTextContainer: {
    flex: 1,
  },
  speedTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  speedValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  sliderContainer: {
    marginTop: 8,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  presetButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  presetButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoCard: {
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  infoFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
    alignItems: "flex-start",
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  chartDates: {
    width: "100%",
    height: 30,
    position: "relative",
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dateChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  timeline: {
    width: "90%",
    height: 40,
    position: "relative",
    marginTop: 20,
    alignSelf: "center",
  },
  timelineLine: {
    position: "absolute",
    width: "100%",
    height: 2,
    top: 10,
  },
  timelinePoint: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    top: 6,
    marginLeft: -5,
  },
  timelineDate: {
    position: "absolute",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
  },
  timelineDateText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
