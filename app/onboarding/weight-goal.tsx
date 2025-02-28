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
import { useColorScheme } from "react-native";
import { useNutrition } from "../../context/NutritionContext";
import { validateWeightGoal } from "../../utils/validations";
import OnboardingLayout from "../../components/onboarding/OnboardingLayout";
import Input from "../../components/common/Input";

export default function WeightGoalScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();

  const [targetWeight, setTargetWeight] = useState<string>(
    nutritionInfo.targetWeight ? nutritionInfo.targetWeight.toString() : ""
  );
  const [error, setError] = useState("");
  const [weightDifference, setWeightDifference] = useState<string>("");

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

  return (
    <KeyboardAvoidingView
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
        <View style={styles.inputContainer}>
          <Input
            label="Peso meta (kg)"
            value={targetWeight}
            onChangeText={setTargetWeight}
            placeholder="70"
            keyboardType="numeric"
          />

          {weightDifference && (
            <View style={styles.differenceContainer}>
              <Text style={[styles.differenceText, { color: colors.text }]}>
                {parseFloat(weightDifference) > 0
                  ? `Ganhar ${weightDifference} kg`
                  : parseFloat(weightDifference) < 0
                  ? `Perder ${Math.abs(parseFloat(weightDifference))} kg`
                  : "Manter o peso atual"}
              </Text>
            </View>
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
    marginTop: 16,
    alignItems: "center",
  },
  differenceText: {
    fontSize: 18,
    fontWeight: "500",
  },
});
