import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import {
  useNutrition,
  TrainingFrequency,
} from "../../context/NutritionContext";
import OnboardingLayout from "../../components/OnboardingLayout";
import SelectionOption from "../../components/SelectionOption";

export default function TrainingFrequencyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();
  const [selectedFrequency, setSelectedFrequency] = useState<
    TrainingFrequency | undefined
  >(nutritionInfo.trainingFrequency);

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
      title: "Sedentário",
      description: "Trabalho em escritório, pouca atividade física",
      icon: (
        <Ionicons
          name="briefcase-outline"
          size={28}
          color={selectedFrequency === "sedentary" ? "white" : colors.text}
        />
      ),
    },
    {
      frequency: "light" as TrainingFrequency,
      title: "Exercício Leve",
      description: "1-2 dias por semana",
      icon: (
        <Ionicons
          name="walk-outline"
          size={28}
          color={selectedFrequency === "light" ? "white" : colors.text}
        />
      ),
    },
    {
      frequency: "moderate" as TrainingFrequency,
      title: "Exercício Moderado",
      description: "3-5 dias por semana",
      icon: (
        <Ionicons
          name="walk-outline"
          size={28}
          color={selectedFrequency === "moderate" ? "white" : colors.text}
        />
      ),
    },
    {
      frequency: "intense" as TrainingFrequency,
      title: "Exercício Intenso",
      description: "6-7 dias por semana",
      icon: (
        <Ionicons
          name="barbell-outline"
          size={28}
          color={selectedFrequency === "intense" ? "white" : colors.text}
        />
      ),
    },
  ];

  return (
    <OnboardingLayout
      title="Qual seu nível de atividade física?"
      subtitle="Isso será usado para calibrar seu plano personalizado"
      currentStep={2}
      totalSteps={10}
      onBack={handleBack}
      onNext={handleNext}
      nextButtonDisabled={!selectedFrequency}
    >
      <View style={styles.optionsContainer}>
        {frequencyOptions.map((option) => (
          <SelectionOption
            key={option.frequency}
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
