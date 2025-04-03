import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { format, subDays, isFirstDayOfMonth, getDate } from "date-fns";
import { useMeals } from "../../context/MealContext";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import InfoModal, { InfoItem } from "../common/InfoModal";

const { width } = Dimensions.get("window");

type Period = "7d" | "14d" | "30d";

interface NutritionProgressChartProps {
  onPress?: () => void;
}

export default function NutritionProgressChart({
  onPress,
}: NutritionProgressChartProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { meals, getDayTotals } = useMeals();
  const { t } = useTranslation();

  const [selectedPeriod, setSelectedPeriod] = useState<Period>("7d");
  const [caloriesData, setCaloriesData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [cardHeight, setCardHeight] = useState(240);

  // Estado para controlar a visibilidade do modal de informações
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  // Efeito para atualizar a altura do card quando expandido/recolhido
  useEffect(() => {
    const emptyStateHeight = 190;
    const hasData = !caloriesData.every((cal) => cal === 0);

    if (!hasData) {
      setCardHeight(emptyStateHeight);
      return;
    }

    if (!isLoading) {
      setCardHeight(isExpanded ? 500 : 240);
    }
  }, [isExpanded, caloriesData, isLoading]);

  // Função auxiliar para substituir eachDayOfInterval
  const getDaysInRange = (startDate: Date, endDate: Date) => {
    const days = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  // Função para processar dados sem alterar a data selecionada no contexto
  const processData = useCallback(async () => {
    setIsLoading(true);

    // Usar abordagem segura para obter a data atual
    const today = new Date();
    let daysToSubtract = 0;

    // Determinar quantos dias subtrair com base no período
    switch (selectedPeriod) {
      case "7d":
        daysToSubtract = 6; // 7 dias (hoje + 6 dias anteriores)
        break;
      case "14d":
        daysToSubtract = 13; // 14 dias (hoje + 13 dias anteriores)
        break;
      case "30d":
        daysToSubtract = 29; // 30 dias (hoje + 29 dias anteriores)
        break;
    }

    // Gerar intervalo de datas
    const startDate = subDays(today, daysToSubtract);
    const dateInterval = getDaysInRange(startDate, today);

    // Formatar datas para labels e obter dados de calorias
    const newLabels: string[] = [];
    const newCaloriesData: number[] = [];

    // Processar cada data no intervalo
    for (let i = 0; i < dateInterval.length; i++) {
      const date = dateInterval[i];
      // Formatar a data para o formato yyyy-MM-dd (usado no contexto de refeições)
      const dateKey = format(date, "yyyy-MM-dd");

      // Formatar a data para exibição no gráfico
      let displayFormat = "";

      if (selectedPeriod === "7d") {
        // Para 7 dias, mostrar o dia da semana abreviado
        displayFormat = format(date, "EEE").substring(0, 3);
      } else if (selectedPeriod === "14d") {
        // Para 14 dias, mostrar apenas alguns dias para evitar amontoamento
        // Mostrar a cada 2 dias ou dias específicos
        if (i % 2 === 0 || i === dateInterval.length - 1) {
          displayFormat = format(date, "dd/MM");
        } else {
          displayFormat = ""; // Rótulo vazio para dias intermediários
        }
      } else {
        // Para 30 dias, mostrar apenas dias específicos
        // Mostrar o primeiro dia do mês, a cada 5 dias e o último dia
        if (
          isFirstDayOfMonth(date) ||
          getDate(date) % 5 === 0 ||
          i === dateInterval.length - 1
        ) {
          displayFormat = format(date, "dd/MM");
        } else {
          displayFormat = ""; // Rótulo vazio para dias intermediários
        }
      }

      newLabels.push(displayFormat);

      // Verificar se há dados para esta data
      const hasMealsForDate =
        meals[dateKey] && Object.keys(meals[dateKey]).length > 0;

      // Obter calorias totais para o dia
      // Importante: Não alteramos a data selecionada no contexto
      let dayCalories = 0;

      if (hasMealsForDate) {
        // Calcular calorias manualmente para esta data
        const mealsForDate = meals[dateKey];
        let totalCalories = 0;

        Object.values(mealsForDate).forEach((foods: any) => {
          foods.forEach((food: any) => {
            if (food && food.calories) {
              totalCalories += food.calories * (food.quantity || 1);
            }
          });
        });

        dayCalories = totalCalories;
      }

      newCaloriesData.push(dayCalories);
    }

    setLabels(newLabels);
    setCaloriesData(newCaloriesData);
    setIsLoading(false);
  }, [selectedPeriod, meals]);

  // Efeito para carregar dados quando o período mudar
  useEffect(() => {
    processData();
  }, [processData]);

  // Calcular estatísticas
  const averageCalories =
    caloriesData.length > 0
      ? Math.round(
          caloriesData.reduce((sum, val) => sum + val, 0) / caloriesData.length
        )
      : 0;

  const maxCalories = caloriesData.length > 0 ? Math.max(...caloriesData) : 0;

  const todayCalories =
    caloriesData.length > 0 ? caloriesData[caloriesData.length - 1] : 0;

  // Configurar o gráfico com base no período selecionado
  const getChartConfig = () => {
    // Configuração base
    const baseConfig = {
      backgroundColor: colors.chartBackground,
      backgroundGradientFrom: colors.chartGradientStart,
      backgroundGradientTo: colors.chartGradientEnd,
      decimalPlaces: 0,
      color: () => colors.primary,
      labelColor: () => colors.text + "80",
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: "5",
        strokeWidth: "2",
        stroke: colors.primary,
        fill: colors.chartDotFill,
      },
      fillShadowGradientFrom: colors.primary,
      fillShadowGradientTo: "rgba(255, 255, 255, 0)",
      propsForBackgroundLines: {
        strokeDasharray: "5, 5",
        stroke: colors.chartGrid,
      },
    };

    // Ajustes específicos para cada período
    if (selectedPeriod === "7d") {
      return {
        ...baseConfig,
        // Configuração padrão para 7 dias
      };
    } else if (selectedPeriod === "14d") {
      return {
        ...baseConfig,
        // Reduzir o tamanho da fonte para 14 dias
        labelFontSize: 10,
      };
    } else {
      return {
        ...baseConfig,
        // Reduzir ainda mais o tamanho da fonte para 30 dias
        labelFontSize: 9,
        // Rotacionar os rótulos para economizar espaço
        formatXLabel: (label: string) => label,
      };
    }
  };

  // Função para alternar entre expandido e recolhido
  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  // Função para mudar o período selecionado
  const handlePeriodChange = (period: Period) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPeriod(period);
  };

  const hasData = !caloriesData.every((cal) => cal === 0);

  // Função para abrir o modal de informações
  const openInfoModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInfoModalVisible(true);
  }, []);

  // Itens de informação para o modal
  const nutritionInfoItems = useMemo<InfoItem[]>(
    () => [
      {
        title: t("nutrition.progressInfo.overview.title"),
        description: t("nutrition.progressInfo.overview.description"),
        icon: "nutrition",
        iconType: "material",
        color: colors.primary,
      },
      {
        title: t("nutrition.progressInfo.tracking.title"),
        description: t("nutrition.progressInfo.tracking.description"),
        icon: "pencil-outline",
        iconType: "ionicons",
        color: colors.success,
      },
      {
        title: t("nutrition.progressInfo.analysis.title"),
        description: t("nutrition.progressInfo.analysis.description"),
        icon: "analytics-outline",
        iconType: "ionicons",
        color: colors.warning,
      },
      {
        title: t("nutrition.progressInfo.periods.title"),
        description: t("nutrition.progressInfo.periods.description"),
        icon: "calendar-outline",
        iconType: "ionicons",
        color: colors.danger,
      },
      {
        title: t("nutrition.progressInfo.tips.title"),
        description: t("nutrition.progressInfo.tips.description"),
        icon: "bulb-outline",
        iconType: "ionicons",
        color: colors.info,
      },
    ],
    [t, colors]
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.light,
          height: cardHeight,
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Adicionar o componente InfoModal */}
      <InfoModal
        visible={infoModalVisible}
        title={t("nutrition.progressInfo.title")}
        subtitle={t("nutrition.progressInfo.subtitle")}
        infoItems={nutritionInfoItems}
        onClose={() => setInfoModalVisible(false)}
        topIcon={{
          name: "nutrition",
          type: "material",
          color: colors.primary,
          backgroundColor: colors.primary + "20",
        }}
      />

      <Pressable
        style={styles.pressableArea}
        onPress={hasData ? toggleExpand : undefined}
        android_ripple={
          hasData ? { color: colors.text + "10", borderless: true } : undefined
        }
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name="fire"
                size={18}
                color={colors.primary}
              />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                {t("home.chart.dailyCalories")}
              </Text>
              <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
                {selectedPeriod === "7d"
                  ? t("home.chart.last7Days")
                  : selectedPeriod === "14d"
                  ? t("home.chart.last14Days")
                  : t("home.chart.lastMonth")}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[
                styles.infoButton,
                { backgroundColor: colors.primary + "20" },
              ]}
              onPress={openInfoModal}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>

            {hasData && (
              <TouchableOpacity
                style={[
                  styles.expandButton,
                  { backgroundColor: colors.text + "10" },
                ]}
                onPress={toggleExpand}
              >
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.text + "80"}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {hasData ? (
          <>
            <View style={styles.periodSelector}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === "7d" && [
                    styles.selectedPeriod,
                    { backgroundColor: colors.primary + "20" },
                  ],
                ]}
                onPress={() => handlePeriodChange("7d")}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: colors.text + "80" },
                    selectedPeriod === "7d" && {
                      color: colors.primary,
                      fontWeight: "600",
                    },
                  ]}
                >
                  7D
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === "14d" && [
                    styles.selectedPeriod,
                    { backgroundColor: colors.primary + "20" },
                  ],
                ]}
                onPress={() => handlePeriodChange("14d")}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: colors.text + "80" },
                    selectedPeriod === "14d" && {
                      color: colors.primary,
                      fontWeight: "600",
                    },
                  ]}
                >
                  14D
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === "30d" && [
                    styles.selectedPeriod,
                    { backgroundColor: colors.primary + "20" },
                  ],
                ]}
                onPress={() => handlePeriodChange("30d")}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: colors.text + "80" },
                    selectedPeriod === "30d" && {
                      color: colors.primary,
                      fontWeight: "600",
                    },
                  ]}
                >
                  {t("home.chart.lastMonth")
                    .split(" ")[1]
                    .charAt(0)
                    .toUpperCase() +
                    t("home.chart.lastMonth").split(" ")[1].slice(1)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <Text
                  style={[styles.statLabel, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {t("home.chart.today")}
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {todayCalories}{" "}
                  <Text
                    style={[styles.statUnit, { color: colors.text + "60" }]}
                  >
                    {t("common.nutrition.kcal")}
                  </Text>
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <Text
                  style={[styles.statLabel, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {t("home.chart.average")}
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {averageCalories}{" "}
                  <Text
                    style={[styles.statUnit, { color: colors.text + "60" }]}
                  >
                    {t("common.nutrition.kcal")}
                  </Text>
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <Text
                  style={[styles.statLabel, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {t("home.chart.maximum")}
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {maxCalories}{" "}
                  <Text
                    style={[styles.statUnit, { color: colors.text + "60" }]}
                  >
                    {t("common.nutrition.kcal")}
                  </Text>
                </Text>
              </View>
            </View>

            {!isExpanded && (
              <View style={styles.expandIndicator}>
                <View
                  style={[
                    styles.expandDot,
                    { backgroundColor: colors.primary + "40" },
                  ]}
                />
                <View
                  style={[
                    styles.expandDot,
                    { backgroundColor: colors.primary + "40" },
                  ]}
                />
                <View
                  style={[
                    styles.expandDot,
                    { backgroundColor: colors.primary + "40" },
                  ]}
                />
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={[colors.light, colors.background]}
              style={styles.emptyGradient}
            >
              <MaterialCommunityIcons
                name="food-outline"
                size={20}
                color={colors.text + "30"}
                style={{ marginBottom: 6 }}
              />
              <Text style={[styles.emptyText, { color: colors.text + "50" }]}>
                {t("home.chart.noNutritionData")}
              </Text>
            </LinearGradient>
          </View>
        )}
      </Pressable>

      {/* Conteúdo expandido - visível apenas quando expandido e há dados */}
      {isExpanded && hasData && (
        <View style={styles.expandedContent}>
          <View style={styles.expandedSection}>
            <View style={styles.sectionDivider} />

            <View style={styles.expandedHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("home.chart.dailyCalories")}
              </Text>
              <Text
                style={[styles.sectionSubtitle, { color: colors.text + "60" }]}
              >
                {selectedPeriod === "7d"
                  ? t("home.chart.last7Days")
                  : selectedPeriod === "14d"
                  ? t("home.chart.last14Days")
                  : t("home.chart.lastMonth")}
              </Text>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text
                  style={[styles.loadingText, { color: colors.text + "60" }]}
                >
                  {t("common.loading")}
                </Text>
              </View>
            ) : (
              <View style={styles.chartContainer}>
                <LineChart
                  data={{
                    labels: labels,
                    datasets: [
                      {
                        data: caloriesData,
                        color: () => colors.primary,
                        strokeWidth: 2,
                      },
                    ],
                  }}
                  width={width - 40}
                  height={180}
                  chartConfig={getChartConfig()}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                    padding: 10,
                    backgroundColor: colors.chartBackground,
                    shadowColor: colors.text,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  withInnerLines={false}
                  fromZero={true}
                  segments={4}
                />
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        {
                          backgroundColor: colors.primary,
                          borderWidth: 2,
                          borderColor: colors.primary,
                        },
                      ]}
                    />
                    <Text
                      style={[styles.legendText, { color: colors.text + "80" }]}
                    >
                      {t("home.chart.dailyCalories")}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Informações estatísticas quando expandido */}
          {isExpanded && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text + "70" }]}>
                  {t("home.chart.average")}
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {averageCalories} {t("common.nutrition.kcal")}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text + "70" }]}>
                  {t("home.chart.today")}
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {todayCalories} {t("common.nutrition.kcal")}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text + "70" }]}>
                  {t("home.chart.maximum")}
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {maxCalories} {t("common.nutrition.kcal")}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleContainer: {
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
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  periodSelector: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  selectedPeriod: {
    borderRadius: 10,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "500",
  },
  expandedContent: {
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  statUnit: {
    fontSize: 12,
    fontWeight: "500",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  loadingContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    marginVertical: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  emptyGradient: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.8,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 5,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
  chartContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  expandedSection: {
    marginTop: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginBottom: 16,
  },
  expandedHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  expandIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  expandDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 2,
  },
  pressableArea: {
    width: "100%",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
