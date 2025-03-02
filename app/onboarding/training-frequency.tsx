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

export default function TrainingFrequencyScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();
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
      title: "Sedentário",
      description: "Trabalho em escritório, pouca atividade física",
      icon: (
        <Ionicons
          key={`sedentary-icon-${theme}`}
          name="briefcase-outline"
          size={28}
          color={selectedFrequency === "sedentary" ? colors.primary : colors.text}
        />
      ),
    },
    {
      frequency: "light" as TrainingFrequency,
      title: "Exercício Leve",
      description: "1-2 dias por semana",
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
      title: "Exercício Moderado",
      description: "3-5 dias por semana",
      icon: (
        <Ionicons
          key={`moderate-icon-${theme}`}
          name="walk-outline"
          size={28}
          color={selectedFrequency === "moderate" ? colors.primary : colors.text}
        />
      ),
    },
    {
      frequency: "intense" as TrainingFrequency,
      title: "Exercício Intenso",
      description: "6-7 dias por semana",
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
      title="Qual seu nível de atividade física?"
      subtitle="Isso será usado para calibrar seu plano personalizado"
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
