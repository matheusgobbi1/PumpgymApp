import React, { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import { useNutrition } from "../../context/NutritionContext";
import { validateMeasurements } from "../../utils/validations";
import OnboardingLayout from "../../components/OnboardingLayout";
import Input from "../../components/Input";

export default function MeasurementsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();

  const [height, setHeight] = useState<string>(
    nutritionInfo.height ? nutritionInfo.height.toString() : ""
  );
  const [weight, setWeight] = useState<string>(
    nutritionInfo.weight ? nutritionInfo.weight.toString() : ""
  );
  const [error, setError] = useState("");

  const handleNext = () => {
    if (height && weight) {
      const heightNum = parseFloat(height);
      const weightNum = parseFloat(weight);

      const validation = validateMeasurements(heightNum, weightNum);

      if (!validation.isValid) {
        setError(validation.message);
        return;
      }

      updateNutritionInfo({
        height: heightNum,
        weight: weightNum,
      });
      router.push("/onboarding/goal" as any);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isNextDisabled =
    !height ||
    !weight ||
    isNaN(parseFloat(height)) ||
    isNaN(parseFloat(weight));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <OnboardingLayout
        title="Altura & peso"
        subtitle="Isso será usado para calibrar seu plano personalizado"
        currentStep={4}
        totalSteps={10}
        onBack={handleBack}
        onNext={handleNext}
        nextButtonDisabled={isNextDisabled}
        error={error}
      >
        <View style={styles.inputsContainer}>
          <Input
            label="Altura (cm)"
            value={height}
            onChangeText={setHeight}
            placeholder="170"
            keyboardType="numeric"
          />

          <Input
            label="Peso (kg)"
            value={weight}
            onChangeText={setWeight}
            placeholder="70"
            keyboardType="numeric"
          />
        </View>
      </OnboardingLayout>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inputsContainer: {
    marginTop: 20,
  },
});
