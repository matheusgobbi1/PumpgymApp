import React, { useState, useCallback, useMemo, useEffect } from "react";
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
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { format, subMonths } from "date-fns";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  useNutrition,
  WeightHistoryEntry,
} from "../../context/NutritionContext";
import { useTranslation } from "react-i18next";
import InfoModal, { InfoItem } from "../common/InfoModal";

/**
 * Componente de gráfico de evolução de peso
 *
 * Modificações realizadas:
 * 1. Implementação de internacionalização com i18next
 * 2. Substituição de useEffect por useMemo para cálculo de altura do card
 * 3. Otimização da renderização com melhor gerenciamento de estado
 * 4. Adição de função auxiliar getPeriodSubtitle para centralizar a lógica de subtítulos
 */

const { width } = Dimensions.get("window");

type Period = "1m" | "3m" | "6m" | "all";

interface WeightProgressChartProps {
  onPress?: () => void;
  refreshKey?: number; // Prop para forçar atualização
}

export default function WeightProgressChart({
  onPress,
  refreshKey = 0,
}: WeightProgressChartProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, getWeightHistory } = useNutrition();
  const { t } = useTranslation();

  const [selectedPeriod, setSelectedPeriod] = useState<Period>("1m");
  const [weightData, setWeightData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Estado para controlar a visibilidade do modal de informações
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  // Função para processar dados sem alterar a data selecionada no contexto
  const processData = useCallback(async () => {
    setIsLoading(true);

    // Obter o histórico de peso
    const history = getWeightHistory();

    if (!history || history.length === 0) {
      setWeightData([]);
      setLabels([]);
      setIsLoading(false);
      return;
    }

    // Ordenar entradas por data (mais antiga primeiro)
    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Filtrar com base no período selecionado
    const today = new Date();
    let filteredHistory = sortedHistory;

    switch (selectedPeriod) {
      case "1m":
        const oneMonthAgo = subMonths(today, 1);
        filteredHistory = sortedHistory.filter(
          (entry) => new Date(entry.date) >= oneMonthAgo
        );
        break;
      case "3m":
        const threeMonthsAgo = subMonths(today, 3);
        filteredHistory = sortedHistory.filter(
          (entry) => new Date(entry.date) >= threeMonthsAgo
        );
        break;
      case "6m":
        const sixMonthsAgo = subMonths(today, 6);
        filteredHistory = sortedHistory.filter(
          (entry) => new Date(entry.date) >= sixMonthsAgo
        );
        break;
      // Para "all", não precisamos filtrar
    }

    // Preparar dados para o gráfico
    const formattedData = filteredHistory.map((entry) => ({
      weight: entry.weight,
      date: format(new Date(entry.date), "dd/MM/yy"),
    }));

    // Definir os dados do gráfico - sempre usar todos os pesos
    setWeightData(formattedData.map((entry) => entry.weight));

    // Limitar o número de labels no eixo X para no máximo 5
    // Isso evita que as datas fiquem sobrepostas e ilegíveis
    const allLabels = formattedData.map((entry) => entry.date);
    let visibleLabels = [];

    if (allLabels.length <= 5) {
      // Se tiver 5 ou menos pontos, mostrar todos os labels
      visibleLabels = allLabels;
    } else {
      // Calcular os índices para mostrar no máximo 5 labels distribuídos uniformemente
      const interval = Math.ceil(allLabels.length / 5);
      for (let i = 0; i < allLabels.length; i++) {
        // Mostrar o primeiro, último e alguns intermediários (máximo 5 no total)
        if (i === 0 || i === allLabels.length - 1 || i % interval === 0) {
          visibleLabels[i] = allLabels[i];
        } else {
          visibleLabels[i] = ""; // Espaço vazio para manter alinhamento com os dados
        }
      }
    }

    setLabels(visibleLabels);

    setIsLoading(false);
  }, [selectedPeriod, getWeightHistory]);

  // Efeito para carregar dados quando o período mudar ou quando houver atualização
  useEffect(() => {
    processData();
  }, [processData, refreshKey, nutritionInfo.weight]);

  // Remover o useMemo redundante e o segundo useEffect
  const hasData = weightData.length > 0;

  // Calcular a altura do card baseado nos dados e estado
  const cardHeightValue = useMemo(() => {
    const emptyStateHeight = 180; // Altura para o estado vazio

    // Se não houver dados, definir uma altura fixa
    if (!hasData) {
      return emptyStateHeight;
    }

    // Só considerar expandido quando os dados estiverem carregados
    if (!isLoading) {
      return isExpanded ? 500 : 240;
    }

    return 240; // Altura padrão durante carregamento
  }, [hasData, isExpanded, isLoading]);

  // Calcular estatísticas
  const averageWeight =
    weightData.length > 0
      ? Number(
          (
            weightData.reduce((sum, val) => sum + val, 0) / weightData.length
          ).toFixed(1)
        )
      : 0;

  const currentWeight = nutritionInfo.weight || 0;

  const startWeight = weightData.length > 0 ? weightData[0] : currentWeight;

  const weightDifference = Number((currentWeight - startWeight).toFixed(1));

  // Configurar o gráfico
  const getChartConfig = () => {
    // Configuração base
    const baseConfig = {
      backgroundColor: colors.chartBackground,
      backgroundGradientFrom: colors.chartGradientStart,
      backgroundGradientTo: colors.chartGradientEnd,
      decimalPlaces: 1,
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
      // Configurações adicionais para melhorar a visualização das labels
      propsForLabels: {
        fontSize: 10,
        fontWeight: "bold",
      },
      // Função para formatar labels do eixo X
      // Retorna o label sem modificação se não for string vazia
      formatXLabel: (label: string) => label,
    };

    return baseConfig;
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

  // Função para obter o subtítulo baseado no período selecionado
  const getPeriodSubtitle = () => {
    switch (selectedPeriod) {
      case "1m":
        return t("weightProgressChart.periodSubtitles.month1");
      case "3m":
        return t("weightProgressChart.periodSubtitles.month3");
      case "6m":
        return t("weightProgressChart.periodSubtitles.month6");
      case "all":
        return t("weightProgressChart.periodSubtitles.all");
      default:
        return t("weightProgressChart.periodSubtitles.month1");
    }
  };

  // Função para abrir o modal de informações
  const openInfoModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInfoModalVisible(true);
  }, []);

  // Itens de informação para o modal
  const weightInfoItems = useMemo<InfoItem[]>(
    () => [
      {
        title: t("weightProgressChart.progressInfo.overview.title"),
        description: t("weightProgressChart.progressInfo.overview.description"),
        icon: "trending-up-outline",
        iconType: "ionicons",
        color: colors.primary,
      },
      {
        title: t("weightProgressChart.progressInfo.tracking.title"),
        description: t("weightProgressChart.progressInfo.tracking.description"),
        icon: "scale",
        iconType: "material",
        color: colors.success,
      },
      {
        title: t("weightProgressChart.progressInfo.indicators.title"),
        description: t(
          "weightProgressChart.progressInfo.indicators.description"
        ),
        icon: "analytics-outline",
        iconType: "ionicons",
        color: colors.warning,
      },
      {
        title: t("weightProgressChart.progressInfo.periods.title"),
        description: t("weightProgressChart.progressInfo.periods.description"),
        icon: "calendar-outline",
        iconType: "ionicons",
        color: colors.danger,
      },
      {
        title: t("weightProgressChart.progressInfo.tips.title"),
        description: t("weightProgressChart.progressInfo.tips.description"),
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
          height: cardHeightValue,
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Adicionar o componente InfoModal */}
      <InfoModal
        visible={infoModalVisible}
        title={t("weightProgressChart.progressInfo.title")}
        subtitle={t("weightProgressChart.progressInfo.subtitle")}
        infoItems={weightInfoItems}
        onClose={() => setInfoModalVisible(false)}
        topIcon={{
          name: "scale",
          type: "ionicons",
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
              <FontAwesome5 name="weight" size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                {t("weightProgressChart.title")}
              </Text>
              <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
                {getPeriodSubtitle()}
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
                  selectedPeriod === "1m" && [
                    styles.selectedPeriod,
                    { backgroundColor: colors.primary + "20" },
                  ],
                ]}
                onPress={() => handlePeriodChange("1m")}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: colors.text + "80" },
                    selectedPeriod === "1m" && {
                      color: colors.primary,
                      fontWeight: "600",
                    },
                  ]}
                >
                  {t("weightProgressChart.periods.month1")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === "3m" && [
                    styles.selectedPeriod,
                    { backgroundColor: colors.primary + "20" },
                  ],
                ]}
                onPress={() => handlePeriodChange("3m")}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: colors.text + "80" },
                    selectedPeriod === "3m" && {
                      color: colors.primary,
                      fontWeight: "600",
                    },
                  ]}
                >
                  {t("weightProgressChart.periods.month3")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === "6m" && [
                    styles.selectedPeriod,
                    { backgroundColor: colors.primary + "20" },
                  ],
                ]}
                onPress={() => handlePeriodChange("6m")}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: colors.text + "80" },
                    selectedPeriod === "6m" && {
                      color: colors.primary,
                      fontWeight: "600",
                    },
                  ]}
                >
                  {t("weightProgressChart.periods.month6")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === "all" && [
                    styles.selectedPeriod,
                    { backgroundColor: colors.primary + "20" },
                  ],
                ]}
                onPress={() => handlePeriodChange("all")}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: colors.text + "80" },
                    selectedPeriod === "all" && {
                      color: colors.primary,
                      fontWeight: "600",
                    },
                  ]}
                >
                  {t("weightProgressChart.periods.all")}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <Text
                  style={[styles.statLabel, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {t("weightProgressChart.stats.current")}
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {currentWeight}{" "}
                  <Text
                    style={[styles.statUnit, { color: colors.text + "60" }]}
                  >
                    {t("weightProgressChart.stats.kg")}
                  </Text>
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <Text
                  style={[styles.statLabel, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {t("weightProgressChart.stats.target")}
                </Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {nutritionInfo.targetWeight ? (
                    <>
                      {nutritionInfo.targetWeight}{" "}
                      <Text
                        style={[styles.statUnit, { color: colors.text + "60" }]}
                      >
                        {t("weightProgressChart.stats.kg")}
                      </Text>
                    </>
                  ) : (
                    <Text
                      style={[styles.statUnit, { color: colors.text + "60" }]}
                    >
                      {t("weightProgressChart.stats.notDefined")}
                    </Text>
                  )}
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <Text
                  style={[styles.statLabel, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {t("weightProgressChart.stats.difference")}
                </Text>
                <Text
                  style={[
                    styles.statValue,
                    weightDifference < 0
                      ? { color: "#EF476F" }
                      : weightDifference > 0
                      ? { color: "#06D6A0" }
                      : { color: colors.text },
                  ]}
                >
                  {weightDifference > 0 ? "+" : ""}
                  {weightDifference}{" "}
                  <Text
                    style={[styles.statUnit, { color: colors.text + "60" }]}
                  >
                    {t("weightProgressChart.stats.kg")}
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
              <Text style={[styles.emptyText, { color: colors.text + "50" }]}>
                {t("weightProgressChart.chart.noData")}
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
                {t("weightProgressChart.chart.weightEvolution")}
              </Text>
              <Text
                style={[styles.sectionSubtitle, { color: colors.text + "60" }]}
              >
                {getPeriodSubtitle()}
              </Text>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text
                  style={[styles.loadingText, { color: colors.text + "60" }]}
                >
                  {t("weightProgressChart.chart.loading")}
                </Text>
              </View>
            ) : (
              <View style={styles.chartContainer}>
                <LineChart
                  data={{
                    labels: labels,
                    datasets: [
                      {
                        data: weightData.length > 0 ? weightData : [0],
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
                  segments={4}
                />

                {nutritionInfo.targetWeight && (
                  <View style={styles.targetInfo}>
                    <Text
                      style={[
                        styles.targetLabel,
                        { color: colors.text + "80" },
                      ]}
                    >
                      {t("weightProgressChart.chart.weightTarget")}:
                    </Text>
                    <Text
                      style={[styles.targetValue, { color: colors.primary }]}
                    >
                      {nutritionInfo.targetWeight}{" "}
                      {t("weightProgressChart.stats.kg")}
                    </Text>
                  </View>
                )}

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
                      {t("weightProgressChart.chart.legendWeight")}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
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
  pressableArea: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
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
  emptyContainer: {
    marginVertical: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  emptyGradient: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  expandedContent: {
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
  chartContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  loadingContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  targetInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  targetLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 8,
  },
  targetValue: {
    fontSize: 18,
    fontWeight: "bold",
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
});
