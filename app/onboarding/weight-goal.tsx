import React, { useState } from "react";
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

      updateNutritionInfo({
        targetWeight: targetWeightNum,
        goal,
      });
      router.push("/onboarding/weight-change-rate" as any);
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
            placeholder="70"
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
                      ? "rgba(28, 154, 190, 0.1)"
                      : "rgba(255, 255, 255, 0.95)",
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: safeColorWithOpacity(getDifferenceColor(), 0.3),
                  shadowColor: theme === "dark" ? "#000" : colors.text,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: theme === "dark" ? 0.3 : 0.1,
                  shadowRadius: 8,
                  elevation: 5,
                  overflow: "hidden",
                },
              ]}
              from={{ opacity: 0, scale: 0.9, translateY: 10 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: "spring", delay: 300 }}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={
                    isDifferencePositive()
                      ? "trending-up"
                      : isDifferenceNegative()
                      ? "trending-down"
                      : "remove"
                  }
                  size={32}
                  color={getDifferenceColor()}
                  style={{ marginBottom: 8 }}
                />
              </View>

              <Text
                style={[
                  styles.differenceText,
                  {
                    color: getDifferenceColor(),
                    fontWeight: "700",
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

              <Text
                style={[
                  styles.differenceDescription,
                  { color: safeColorWithOpacity(colors.text, 0.56) },
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
                  styles.differenceFooter,
                  {
                    borderTopColor:
                      theme === "dark"
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.05)",
                    backgroundColor:
                      theme === "dark"
                        ? "rgba(0, 0, 0, 0.2)"
                        : "rgba(0, 0, 0, 0.02)",
                  },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={safeColorWithOpacity(colors.text, 0.44)}
                />
                <Text
                  style={[
                    styles.footerText,
                    { color: safeColorWithOpacity(colors.text, 0.44) },
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
    marginTop: 24,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 8,
  },
  differenceText: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  differenceDescription: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 16,
  },
  differenceFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    marginHorizontal: -20,
    marginBottom: -20,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 13,
    marginLeft: 6,
  },
});
