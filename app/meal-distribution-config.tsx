import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { useNutrition } from "../context/NutritionContext";
import { useMeals } from "../context/MealContext";
import Colors from "../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import {
  CustomMealDistribution,
  generateMealDistribution,
} from "../utils/nutritionDistributionAlgorithm";
import ButtonNew from "../components/common/ButtonNew";
import MealDistributionCard from "../components/nutrition/MealDistributionCard";

// Interface para percentuais de macronutrientes
interface MacroPercentages {
  protein: number;
  carbs: number;
  fat: number;
}

// Estendendo a interface CustomMealDistribution para incluir macros
interface EnhancedMealDistribution extends CustomMealDistribution {
  macros: MacroPercentages;
}

export default function MealDistributionConfigScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();

  const {
    nutritionInfo,
    saveCustomMealDistribution,
    resetCustomMealDistribution,
  } = useNutrition();
  const { mealTypes } = useMeals();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [distributions, setDistributions] = useState<
    EnhancedMealDistribution[]
  >([]);
  const [totalPercentage, setTotalPercentage] = useState(100);
  const [errorMessage, setErrorMessage] = useState("");

  // Função para criar distribuição balanceada usando o algoritmo central
  const createBalancedDistribution = useCallback(() => {
    // Usar o algoritmo central para gerar a distribuição
    const recommendations = generateMealDistribution(nutritionInfo, mealTypes);

    // Converter para o formato EnhancedMealDistribution
    let newDistributions = recommendations.map((rec) => ({
      mealId: rec.mealId,
      percentage: Math.round(rec.percentageOfDaily),
      macros: { protein: 30, carbs: 40, fat: 30 },
    }));

    // Verificar se o total é exatamente 100%
    const total = newDistributions.reduce(
      (acc, dist) => acc + dist.percentage,
      0
    );

    // Se não for 100%, ajustar para garantir que some exatamente 100
    if (total !== 100) {
      // Ordenar pela diferença entre percentual arredondado e exato (maior diferença primeiro)
      const originalRecommendations = [...recommendations];
      const sortedIndices = originalRecommendations
        .map((rec, index) => ({
          index,
          diff: Math.abs(
            Math.round(rec.percentageOfDaily) - rec.percentageOfDaily
          ),
        }))
        .sort((a, b) => b.diff - a.diff)
        .map((item) => item.index);

      if (total > 100) {
        // Reduzir os valores para atingir 100%
        let excess = total - 100;
        for (let i = 0; i < sortedIndices.length && excess > 0; i++) {
          const index = sortedIndices[i];
          if (newDistributions[index].percentage > 1) {
            newDistributions[index].percentage--;
            excess--;
          }
        }
      } else if (total < 100) {
        // Aumentar os valores para atingir 100%
        let deficit = 100 - total;
        for (let i = 0; i < sortedIndices.length && deficit > 0; i++) {
          const index = sortedIndices[i];
          newDistributions[index].percentage++;
          deficit--;
        }
      }
    }

    return newDistributions;
  }, [nutritionInfo, mealTypes]);

  // Inicializar a distribuição
  useEffect(() => {
    if (mealTypes.length > 0) {
      // Evitar inicialização repetida
      setLoading(true);

      const timer = setTimeout(() => {
        try {
          let newDistributions: EnhancedMealDistribution[] = [];

          // Se já existe uma distribuição personalizada, verificar se todas as refeições estão incluídas
          if (nutritionInfo.customMealDistribution?.length) {
            // Converter para o formato estendido
            const enhancedDistributions =
              nutritionInfo.customMealDistribution.map((dist) => {
                return {
                  ...dist,
                  macros: (dist as EnhancedMealDistribution).macros || {
                    protein: 30,
                    carbs: 40,
                    fat: 30,
                  },
                };
              });

            // Verificar se todas as refeições têm uma distribuição
            const allMealsHaveDistribution = mealTypes.every((meal) =>
              enhancedDistributions.some((dist) => dist.mealId === meal.id)
            );

            // Verificar se temos distribuições extras para refeições que não existem mais
            const hasExtraDistributions = enhancedDistributions.some(
              (dist) => !mealTypes.some((meal) => meal.id === dist.mealId)
            );

            if (allMealsHaveDistribution && !hasExtraDistributions) {
              // Se todas as refeições têm distribuição e não temos distribuições extras,
              // podemos usar a distribuição existente
              newDistributions = enhancedDistributions;
            } else {
              // Se alguma refeição não tem distribuição ou temos distribuições extras,
              // criar uma distribuição balanceada usando o algoritmo central
              newDistributions = createBalancedDistribution();
            }
          } else {
            // Caso não exista distribuição personalizada, criar uma distribuição balanceada
            newDistributions = createBalancedDistribution();
          }

          setDistributions(newDistributions);

          // Calcular o total
          const total = newDistributions.reduce(
            (acc, dist) => acc + dist.percentage,
            0
          );
          setTotalPercentage(total);

          // Definir mensagem de erro se necessário
          if (total !== 100) {
            setErrorMessage(
              t(
                "nutrition.mealDistribution.totalError",
                "O total deve ser 100%"
              )
            );
          } else {
            setErrorMessage("");
          }
        } catch (error) {
          console.error("Erro ao inicializar distribuição:", error);
        } finally {
          setLoading(false);
        }
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [
    mealTypes,
    nutritionInfo.customMealDistribution,
    t,
    createBalancedDistribution,
  ]);

  // Atualizar a porcentagem de uma refeição
  const updatePercentage = useCallback(
    (mealId: string, value: string) => {
      try {
        // Converter para número e validar
        const parsedValue = parseInt(value.replace(/[^0-9]/g, ""));

        if (isNaN(parsedValue)) {
          return;
        }

        // Atualizar a distribuição
        setDistributions((prevDistributions) => {
          const newDistributions = prevDistributions.map((dist) => {
            if (dist.mealId === mealId) {
              return { ...dist, percentage: parsedValue };
            }
            return dist;
          });

          // Calcular o total
          const total = newDistributions.reduce(
            (acc, dist) => acc + dist.percentage,
            0
          );
          setTotalPercentage(total);

          // Definir mensagem de erro se necessário
          if (total !== 100) {
            setErrorMessage(
              t(
                "nutrition.mealDistribution.totalError",
                "O total deve ser 100%"
              )
            );
          } else {
            setErrorMessage("");
          }

          return newDistributions;
        });
      } catch (error) {
        console.error("Erro ao atualizar porcentagem:", error);
      }
    },
    [t]
  );

  // Atualizar os macronutrientes de uma refeição
  const updateMacroPercentages = useCallback(
    (mealId: string, macros: MacroPercentages) => {
      try {
        // Validar se os macros somam 100%
        const macroTotal = macros.protein + macros.carbs + macros.fat;

        if (macroTotal !== 100) {
          console.warn(
            "Macronutrientes não somam 100%, ajustando automaticamente"
          );
          // Ajuste automático já feito no componente de cartão
        }

        // Atualizar a distribuição
        setDistributions((prevDistributions) => {
          return prevDistributions.map((dist) => {
            if (dist.mealId === mealId) {
              return { ...dist, macros };
            }
            return dist;
          });
        });
      } catch (error) {
        console.error("Erro ao atualizar macronutrientes:", error);
      }
    },
    []
  );

  // Distribuir igualmente usando o algoritmo central
  const distributeEqually = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Calcular a porcentagem igual para cada refeição
    const equalPercentage = Math.floor(100 / mealTypes.length);

    // Calcular o resto para distribuir entre as primeiras refeições
    const remainder = 100 - equalPercentage * mealTypes.length;

    // Criar nova distribuição com percentagens iguais
    const newDistributions = mealTypes.map((meal, index) => {
      // Adicionar 1% extra para as primeiras 'remainder' refeições
      const percentage =
        index < remainder ? equalPercentage + 1 : equalPercentage;

      // Encontrar a distribuição existente para manter os macros
      const existingDistribution = distributions.find(
        (dist) => dist.mealId === meal.id
      );
      const macros = existingDistribution?.macros || {
        protein: 30,
        carbs: 40,
        fat: 30,
      };

      return {
        mealId: meal.id,
        percentage,
        macros,
      };
    });

    setDistributions(newDistributions);

    // Calcular o novo total
    const total = newDistributions.reduce(
      (acc, dist) => acc + dist.percentage,
      0
    );

    setTotalPercentage(total);

    // Verificar se o total é 100%
    if (total !== 100) {
      setErrorMessage(
        t("nutrition.mealDistribution.totalError", "O total deve ser 100%")
      );
    } else {
      setErrorMessage("");
    }
  }, [mealTypes, distributions, t]);

  // Salvar as configurações
  const handleSave = useCallback(async () => {
    try {
      if (totalPercentage !== 100) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          t("common.attention"),
          t("nutrition.mealDistribution.totalError", "O total deve ser 100%")
        );
        return;
      }

      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Salvar a distribuição estendida
      await saveCustomMealDistribution(distributions);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        t("common.error"),
        t(
          "nutrition.mealDistribution.saveError",
          "Não foi possível salvar a configuração"
        )
      );
    } finally {
      setSaving(false);
    }
  }, [distributions, totalPercentage, t, saveCustomMealDistribution, router]);

  // Resetar para a distribuição padrão
  const handleReset = useCallback(async () => {
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await resetCustomMealDistribution();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        t("common.error"),
        t(
          "nutrition.mealDistribution.resetError",
          "Não foi possível resetar a configuração"
        )
      );
    } finally {
      setSaving(false);
    }
  }, [resetCustomMealDistribution, t, router]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: 0,
        },
      ]}
      edges={["bottom"]}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            paddingTop: 12, // Adicionando um pequeno espaçamento no topo
          },
        ]}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          disabled={saving}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t("nutrition.mealDistribution.title", "Distribuição Calórica")}
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {/* Total Bar - Movido para fora da ScrollView */}
      {!loading && (
        <View style={styles.totalBarWrapper}>
          <View
            style={[
              styles.totalBar,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.totalText, { color: colors.text }]}>
              {t("nutrition.mealDistribution.total", "Total")}
            </Text>
            <View style={styles.totalValueContainer}>
              <Text
                style={[
                  styles.totalPercentage,
                  {
                    color:
                      totalPercentage === 100 ? colors.success : colors.danger,
                  },
                ]}
              >
                {totalPercentage}%
              </Text>
              {errorMessage ? (
                <Text
                  style={[styles.inlineErrorMessage, { color: colors.danger }]}
                >
                  {errorMessage}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t("common.loading", "Carregando...")}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.infoContainer}>
            <Text style={[styles.subtitle, { color: colors.text }]}>
              {t(
                "nutrition.mealDistribution.subtitle",
                "Personalize a distribuição calórica entre suas refeições"
              )}
            </Text>
          </View>

          <View style={styles.distributionContainer}>
            {/* Cabeçalho da tabela */}
            <View style={styles.tableHeader}>
              <Text
                style={[styles.tableHeaderText, { color: colors.text + "99" }]}
              >
                {t("nutrition.mealDistribution.mealType", "Tipo de Refeição")}
              </Text>
              <Text
                style={[styles.tableHeaderText, { color: colors.text + "99" }]}
              >
                {t("nutrition.mealDistribution.percentage", "Porcentagem (%)")}
              </Text>
            </View>

            {/* Lista de refeições */}
            {mealTypes.map((meal, index) => {
              const distribution = distributions.find(
                (d) => d.mealId === meal.id
              );
              const percentage = distribution?.percentage || 0;
              const macros = distribution?.macros || {
                protein: 30,
                carbs: 40,
                fat: 30,
              };

              return (
                <MealDistributionCard
                  key={meal.id}
                  meal={meal}
                  percentage={percentage}
                  onPercentageChange={updatePercentage}
                  macroPercentages={macros}
                  onMacroPercentagesChange={updateMacroPercentages}
                  themeColors={{
                    text: colors.text,
                    border: colors.border,
                    card: colors.card,
                    primary: colors.primary,
                  }}
                  index={index}
                />
              );
            })}

            {/* Botões de ação secundários */}
            <View style={styles.secondaryButtonsContainer}>
              {/* Botão para distribuir igualmente */}
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flex: 1,
                  },
                ]}
                onPress={distributeEqually}
                disabled={saving}
              >
                <Ionicons
                  name="refresh-outline"
                  size={18}
                  color={colors.primary}
                  style={styles.secondaryButtonIcon}
                />
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: colors.primary },
                  ]}
                >
                  {t(
                    "nutrition.mealDistribution.distributeEqually",
                    "Distribuir igualmente"
                  )}
                </Text>
              </TouchableOpacity>

              {/* Botão para resetar para padrão (minimalista) */}
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flex: 1,
                  },
                ]}
                onPress={handleReset}
                disabled={saving}
              >
                <Ionicons
                  name="arrow-undo-outline"
                  size={18}
                  color={colors.text + "80"}
                  style={styles.secondaryButtonIcon}
                />
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: colors.text + "80" },
                  ]}
                >
                  {t(
                    "nutrition.mealDistribution.resetDefault",
                    "Resetar padrão"
                  )}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Botão de salvar no rodapé */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <ButtonNew
          title={
            totalPercentage === 100
              ? t("common.save", "Salvar")
              : t(
                  "nutrition.mealDistribution.totalMustBe100",
                  "Total deve ser 100%"
                )
          }
          onPress={handleSave}
          loading={saving}
          disabled={totalPercentage !== 100}
          size="large"
          fullWidth={true}
          elevation={2}
          rounded={true}
          style={{ marginBottom: 20 }}
          textStyle={{ color: theme === "light" ? "#FFFFFF" : "#000000" }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    padding: 8,
  },
  totalBarWrapper: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    zIndex: 10,
  },
  totalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  totalValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  inlineErrorMessage: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  distributionContainer: {
    marginHorizontal: 16,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  totalText: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalPercentage: {
    fontSize: 16,
    fontWeight: "700",
  },
  errorMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  secondaryButtonsContainer: {
    marginTop: 16,
    marginBottom: 24,
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryButtonIcon: {
    marginRight: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
});
