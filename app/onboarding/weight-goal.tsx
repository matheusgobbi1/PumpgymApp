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

export default function WeightGoalScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();

  const [targetWeight, setTargetWeight] = useState<string>(
    nutritionInfo.targetWeight ? nutritionInfo.targetWeight.toString() : ""
  );
  const [error, setError] = useState("");
  const [weightDifference, setWeightDifference] = useState<string>("");

  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});

  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

  useEffect(() => {
    if (targetWeight && nutritionInfo.weight) {
      const targetWeightNum = parseFloat(targetWeight);
      const currentWeight = nutritionInfo.weight;

      if (!isNaN(targetWeightNum)) {
        const diff = targetWeightNum - currentWeight;
        setWeightDifference(diff.toFixed(1));
      } else {
        setWeightDifference("");
      }
    } else {
      setWeightDifference("");
    }
  }, [targetWeight, nutritionInfo.weight]);

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
    if (parseFloat(weightDifference) > 0) return colors.success;
    if (parseFloat(weightDifference) < 0) return colors.danger;
    return colors.primary;
  };

  return (
    <KeyboardAvoidingView
      key={`keyboard-view-${theme}`}
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <OnboardingLayout
        title="Qual é o seu peso ideal?"
        subtitle="Defina uma meta realista para alcançar seus objetivos"
        currentStep={6}
        totalSteps={10}
        onBack={handleBack}
        onNext={handleNext}
        nextButtonDisabled={isNextDisabled}
        error={error}
      >
        <View key={`input-container-${theme}`} style={styles.inputContainer}>
          <Input
            key={`weight-input-${theme}`}
            label="Peso meta (kg)"
            value={targetWeight}
            onChangeText={setTargetWeight}
            placeholder="70"
            keyboardType="numeric"
            rightIcon="scale-outline"
            iconColor={colors.primary}
            inputContainerStyle={{
              borderRadius: 12,
              borderColor: colors.primary + "40",
              backgroundColor:
                theme === "dark"
                  ? "rgba(28, 154, 190, 0.05)"
                  : "rgba(255, 255, 255, 0.8)",
            }}
          />

          {weightDifference && (
            <MotiView
              key={`difference-container-${theme}`}
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
                  borderColor: getDifferenceColor() + "30",
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
                  key={`difference-icon-${theme}`}
                  name={
                    parseFloat(weightDifference) > 0
                      ? "trending-up"
                      : parseFloat(weightDifference) < 0
                      ? "trending-down"
                      : "remove"
                  }
                  size={32}
                  color={getDifferenceColor()}
                  style={{ marginBottom: 8 }}
                />
              </View>

              <Text
                key={`difference-text-${theme}`}
                style={[
                  styles.differenceText,
                  {
                    color: getDifferenceColor(),
                    fontWeight: "700",
                  },
                ]}
              >
                {parseFloat(weightDifference) > 0
                  ? `Ganhar ${weightDifference} kg`
                  : parseFloat(weightDifference) < 0
                  ? `Perder ${Math.abs(parseFloat(weightDifference))} kg`
                  : "Manter o peso atual"}
              </Text>

              <Text
                key={`difference-description-${theme}`}
                style={[
                  styles.differenceDescription,
                  { color: colors.text + "90" },
                ]}
              >
                {parseFloat(weightDifference) > 0
                  ? "Você precisará aumentar sua ingestão calórica"
                  : parseFloat(weightDifference) < 0
                  ? "Você precisará reduzir sua ingestão calórica"
                  : "Continue com sua ingestão calórica atual"}
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
                  color={colors.text + "70"}
                />
                <Text
                  style={[styles.footerText, { color: colors.text + "70" }]}
                >
                  {parseFloat(weightDifference) > 0
                    ? "Recomendamos ganho de 0.5kg por semana"
                    : parseFloat(weightDifference) < 0
                    ? "Recomendamos perda de 0.5kg por semana"
                    : "Manter o peso é uma ótima meta!"}
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
