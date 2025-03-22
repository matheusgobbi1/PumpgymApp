import React, { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useNutrition } from "../../context/NutritionContext";
import { validateMeasurements } from "../../utils/validations";
import OnboardingLayout from "../../components/onboarding/OnboardingLayout";
import Input from "../../components/common/Input";
import { useTranslation } from "react-i18next";

export default function MeasurementsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();
  const { t } = useTranslation();

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
        title={t("onboarding.measurements.title")}
        subtitle={t("onboarding.measurements.subtitle")}
        currentStep={4}
        totalSteps={10}
        onBack={handleBack}
        onNext={handleNext}
        nextButtonDisabled={isNextDisabled}
        error={error}
      >
        <View style={styles.inputsContainer}>
          <Input
            label={t("onboarding.measurements.height")}
            value={height}
            onChangeText={setHeight}
            placeholder="170"
            keyboardType="numeric"
            rightIcon="body-outline"
          />

          <Input
            label={t("onboarding.measurements.weight")}
            value={weight}
            onChangeText={setWeight}
            placeholder="70"
            keyboardType="numeric"
            rightIcon="scale-outline"
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
