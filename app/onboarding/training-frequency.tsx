import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import {
  useNutrition,
  TrainingFrequency,
} from "../../context/NutritionContext";
import OnboardingLayout from "../../components/onboarding/OnboardingLayout";
import SelectionOption from "../../components/onboarding/SelectionOption";
import { useTranslation } from "react-i18next";

export default function TrainingFrequencyScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();
  const { t } = useTranslation();

  const [selectedFrequency, setSelectedFrequency] = useState<
    TrainingFrequency | undefined
  >(nutritionInfo.trainingFrequency);

  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});

  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

  const handleNext = () => {
    if (selectedFrequency) {
      updateNutritionInfo({ trainingFrequency: selectedFrequency });
      router.push("/onboarding/birth-date" as any);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const frequencyOptions = [
    {
      frequency: "sedentary" as TrainingFrequency,
      title: t("onboarding.trainingFrequency.options.sedentary.title"),
      description: t(
        "onboarding.trainingFrequency.options.sedentary.description"
      ),
      icon: (
        <Ionicons
          key={`sedentary-icon-${theme}`}
          name="briefcase-outline"
          size={28}
          color={
            selectedFrequency === "sedentary" ? colors.primary : colors.text
          }
        />
      ),
    },
    {
      frequency: "light" as TrainingFrequency,
      title: t("onboarding.trainingFrequency.options.light.title"),
      description: t("onboarding.trainingFrequency.options.light.description"),
      icon: (
        <Ionicons
          key={`light-icon-${theme}`}
          name="walk-outline"
          size={28}
          color={selectedFrequency === "light" ? colors.primary : colors.text}
        />
      ),
    },
    {
      frequency: "moderate" as TrainingFrequency,
      title: t("onboarding.trainingFrequency.options.moderate.title"),
      description: t(
        "onboarding.trainingFrequency.options.moderate.description"
      ),
      icon: (
        <Ionicons
          key={`moderate-icon-${theme}`}
          name="walk-outline"
          size={28}
          color={
            selectedFrequency === "moderate" ? colors.primary : colors.text
          }
        />
      ),
    },
    {
      frequency: "intense" as TrainingFrequency,
      title: t("onboarding.trainingFrequency.options.intense.title"),
      description: t(
        "onboarding.trainingFrequency.options.intense.description"
      ),
      icon: (
        <Ionicons
          key={`intense-icon-${theme}`}
          name="barbell-outline"
          size={28}
          color={selectedFrequency === "intense" ? colors.primary : colors.text}
        />
      ),
    },
  ];

  return (
    <OnboardingLayout
      title={t("onboarding.trainingFrequency.title")}
      subtitle={t("onboarding.trainingFrequency.subtitle")}
      currentStep={2}
      totalSteps={10}
      onBack={handleBack}
      onNext={handleNext}
      nextButtonDisabled={!selectedFrequency}
    >
      <View key={`options-container-${theme}`} style={styles.optionsContainer}>
        {frequencyOptions.map((option) => (
          <SelectionOption
            key={`frequency-option-${option.frequency}-${theme}`}
            title={option.title}
            description={option.description}
            icon={option.icon}
            isSelected={selectedFrequency === option.frequency}
            onSelect={() => setSelectedFrequency(option.frequency)}
            variant="outlined"
          />
        ))}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    marginTop: 20,
  },
});
