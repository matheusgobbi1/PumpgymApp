import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useNutrition } from "../../context/NutritionContext";
import { validateWeightGoal } from "../../utils/validations";
import OnboardingLayout from "../../components/onboarding/OnboardingLayout";
import Input from "../../components/common/Input";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function WeightGoalScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();
  const { t } = useTranslation();

  const [targetWeight, setTargetWeight] = useState<string>(
    nutritionInfo.targetWeight ? nutritionInfo.targetWeight.toString() : ""
  );
  const [error, setError] = useState("");
  const [weightDifference, setWeightDifference] = useState<string>("");

  // Formatar o peso atual para exibição
  const currentWeightFormatted = nutritionInfo.weight
    ? `${nutritionInfo.weight} kg`
    : "";

  // Gerar um placeholder baseado no objetivo do usuário
  const getWeightSuggestion = () => {
    if (!nutritionInfo.weight) return "ex: 70";

    if (nutritionInfo.goal === "lose") {
      // Para perda de peso, sugerir 10% abaixo do peso atual (arredondado)
      return `ex: ${Math.round(nutritionInfo.weight * 0.9)}`;
    } else if (nutritionInfo.goal === "gain") {
      // Para ganho de peso, sugerir 10% acima do peso atual (arredondado)
      return `ex: ${Math.round(nutritionInfo.weight * 1.1)}`;
    } else {
      // Para manter, sugerir o peso atual
      return `ex: ${nutritionInfo.weight}`;
    }
  };

  // Função para atualizar a diferença de peso quando o peso alvo muda
  const updateWeightDifference = (value: string) => {
    setTargetWeight(value);

    if (value && nutritionInfo.weight) {
      const targetWeightNum = parseFloat(value);
      const currentWeight = nutritionInfo.weight;

      if (!isNaN(targetWeightNum) && isFinite(targetWeightNum)) {
        const diff = targetWeightNum - currentWeight;
        setWeightDifference(diff.toFixed(1));
      } else {
        setWeightDifference("");
      }
    } else {
      setWeightDifference("");
    }
  };

  // Preencher automaticamente o campo de peso alvo com o peso atual se o objetivo for manter o peso
  useEffect(() => {
    if (nutritionInfo.goal === "maintain" && nutritionInfo.weight) {
      // Definir o targetWeight como o peso atual
      const currentWeight = nutritionInfo.weight.toString();

      // Atualizar o estado local do componente
      setTargetWeight(currentWeight);
      updateWeightDifference(currentWeight);

      // Atualizar o estado global de nutrição
      updateNutritionInfo({
        targetWeight: nutritionInfo.weight,
        weightChangeRate: 0,
      });
    }
  }, [nutritionInfo.goal, nutritionInfo.weight]);

  const handleNext = () => {
    if (targetWeight && nutritionInfo.weight) {
      const targetWeightNum = parseFloat(targetWeight);

      const validation = validateWeightGoal(
        nutritionInfo.weight,
        targetWeightNum
      );

      if (!validation.isValid) {
        setError(validation.message);
        return;
      }

      // Determinar o objetivo com base na diferença de peso
      let goal: "lose" | "maintain" | "gain" = "maintain";
      if (targetWeightNum < nutritionInfo.weight) {
        goal = "lose";
      } else if (targetWeightNum > nutritionInfo.weight) {
        goal = "gain";
      }

      // Atualizar informações de nutrição com o peso alvo
      updateNutritionInfo({
        targetWeight: targetWeightNum,
        goal,
      });

      // Se o objetivo for manter o peso, definir uma taxa de mudança zero e pular para tipo de dieta
      if (goal === "maintain") {
        updateNutritionInfo({ weightChangeRate: 0 });
        router.push("/onboarding/diet-type" as any);
      } else {
        router.push("/onboarding/weight-change-rate" as any);
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isNextDisabled = !targetWeight || isNaN(parseFloat(targetWeight));

  // Função para obter a cor baseada na diferença de peso
  const getDifferenceColor = () => {
    const diff = parseFloat(weightDifference);
    if (!isNaN(diff) && isFinite(diff) && diff > 0) return colors.success;
    if (!isNaN(diff) && isFinite(diff) && diff < 0) return colors.danger;
    return colors.primary;
  };

  // Função segura para verificar se a diferença é positiva
  const isDifferencePositive = () => {
    const diff = parseFloat(weightDifference);
    return !isNaN(diff) && isFinite(diff) && diff > 0;
  };

  // Função segura para verificar se a diferença é negativa
  const isDifferenceNegative = () => {
    const diff = parseFloat(weightDifference);
    return !isNaN(diff) && isFinite(diff) && diff < 0;
  };

  // Função segura para obter o valor absoluto da diferença
  const getAbsoluteDifference = () => {
    const diff = parseFloat(weightDifference);
    return !isNaN(diff) && isFinite(diff) ? Math.abs(diff) : 0;
  };

  // Função segura para formatar cores com opacidade
  const safeColorWithOpacity = (color: string, opacity: number) => {
    try {
      // Limitar a opacidade entre 0 e 1
      const safeOpacity = Math.min(1, Math.max(0, opacity));

      // Converter para um valor hexadecimal entre 00 e FF
      const opacityHex = Math.round(safeOpacity * 255)
        .toString(16)
        .padStart(2, "0");

      return `${color}${opacityHex}`;
    } catch (error) {
      // Em caso de erro, retornar a cor original
      return color;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <OnboardingLayout
        title={t("onboarding.weightGoal.title")}
        subtitle={t("onboarding.weightGoal.subtitle")}
        currentStep={6}
        totalSteps={10}
        onBack={handleBack}
        onNext={handleNext}
        nextButtonDisabled={isNextDisabled}
        error={error}
      >
        <View style={styles.inputContainer}>
          <Input
            label={t("onboarding.weightGoal.targetWeight")}
            value={targetWeight}
            onChangeText={updateWeightDifference}
            placeholder={getWeightSuggestion()}
            keyboardType="numeric"
            rightIcon="scale-outline"
            iconColor={colors.primary}
            inputContainerStyle={{
              borderRadius: 12,
              borderColor: safeColorWithOpacity(colors.primary, 0.25),
              backgroundColor:
                theme === "dark"
                  ? "rgba(28, 154, 190, 0.05)"
                  : "rgba(255, 255, 255, 0.8)",
            }}
          />

          {weightDifference && (
            <MotiView
              style={[
                styles.differenceContainer,
                {
                  backgroundColor:
                    theme === "dark"
                      ? "rgba(28, 154, 190, 0.08)"
                      : "rgba(255, 255, 255, 0.95)",
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: safeColorWithOpacity(getDifferenceColor(), 0.2),
                  shadowColor: theme === "dark" ? "#000" : colors.text,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: theme === "dark" ? 0.2 : 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                },
              ]}
              from={{ opacity: 0, translateY: 5 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 300 }}
            >
              <View style={styles.differenceHeader}>
                <Ionicons
                  name={
                    isDifferencePositive()
                      ? "trending-up-outline"
                      : isDifferenceNegative()
                      ? "trending-down-outline"
                      : "remove-outline"
                  }
                  size={22}
                  color={getDifferenceColor()}
                />
                <Text
                  style={[
                    styles.differenceText,
                    {
                      color: getDifferenceColor(),
                      fontWeight: "600",
                      marginLeft: 8,
                    },
                  ]}
                >
                  {isDifferencePositive()
                    ? t("onboarding.weightGoal.weightDifference.gain", {
                        weight: weightDifference,
                      })
                    : isDifferenceNegative()
                    ? t("onboarding.weightGoal.weightDifference.lose", {
                        weight: getAbsoluteDifference(),
                      })
                    : t("onboarding.weightGoal.weightDifference.maintain")}
                </Text>
              </View>

              <Text
                style={[
                  styles.differenceDescription,
                  { color: colors.text, opacity: 0.7 },
                ]}
              >
                {isDifferencePositive()
                  ? t("onboarding.weightGoal.weightDifference.gainDescription")
                  : isDifferenceNegative()
                  ? t("onboarding.weightGoal.weightDifference.loseDescription")
                  : t(
                      "onboarding.weightGoal.weightDifference.maintainDescription"
                    )}
              </Text>

              <View
                style={[
                  styles.recommendationContainer,
                  {
                    backgroundColor:
                      theme === "dark"
                        ? "rgba(0, 0, 0, 0.15)"
                        : "rgba(0, 0, 0, 0.03)",
                    borderRadius: 8,
                    padding: 10,
                    marginTop: 12,
                  },
                ]}
              >
                <View style={styles.recommendationRow}>
                  <Ionicons
                    name="information-circle-outline"
                    size={15}
                    color={safeColorWithOpacity(colors.text, 0.6)}
                  />
                  <Text
                    style={[
                      styles.recommendationText,
                      { color: safeColorWithOpacity(colors.text, 0.6) },
                    ]}
                  >
                    {isDifferencePositive()
                      ? t(
                          "onboarding.weightGoal.weightDifference.gainRecommendation"
                        )
                      : isDifferenceNegative()
                      ? t(
                          "onboarding.weightGoal.weightDifference.loseRecommendation"
                        )
                      : t(
                          "onboarding.weightGoal.weightDifference.maintainRecommendation"
                        )}
                  </Text>
                </View>
              </View>
            </MotiView>
          )}
        </View>
      </OnboardingLayout>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginTop: 20,
  },
  differenceContainer: {
    marginTop: 20,
    width: "100%",
  },
  differenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  differenceText: {
    fontSize: 16,
    fontWeight: "600",
  },
  differenceDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  recommendationContainer: {
    width: "100%",
  },
  recommendationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  recommendationText: {
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
});
