import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import { useNutrition, DietType } from "../../context/NutritionContext";
import OnboardingLayout from "../../components/onboarding/OnboardingLayout";
import SelectionOption from "../../components/onboarding/SelectionOption";

export default function DietTypeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();
  const [selectedDietType, setSelectedDietType] = useState<
    DietType | undefined
  >(nutritionInfo.dietType);

  const handleNext = () => {
    if (selectedDietType) {
      updateNutritionInfo({ dietType: selectedDietType });
      router.push("/onboarding/referral" as any);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const dietTypeOptions = [
    {
      dietType: "classic" as DietType,
      title: "Clássica",
      description: "Inclui todos os grupos alimentares",
      icon: (
        <Ionicons
          name="restaurant-outline"
          size={28}
          color={selectedDietType === "classic" ? "white" : colors.text}
        />
      ),
    },
    {
      dietType: "pescatarian" as DietType,
      title: "Pescetariana",
      description: "Vegetais, ovos, laticínios e peixes",
      icon: (
        <Ionicons
          name="fish-outline"
          size={28}
          color={selectedDietType === "pescatarian" ? "white" : colors.text}
        />
      ),
    },
    {
      dietType: "vegetarian" as DietType,
      title: "Vegetariana",
      description: "Sem carnes, mas inclui ovos e laticínios",
      icon: (
        <Ionicons
          name="leaf-outline"
          size={28}
          color={selectedDietType === "vegetarian" ? "white" : colors.text}
        />
      ),
    },
    {
      dietType: "vegan" as DietType,
      title: "Vegana",
      description: "Apenas alimentos de origem vegetal",
      icon: (
        <Ionicons
          name="nutrition-outline"
          size={28}
          color={selectedDietType === "vegan" ? "white" : colors.text}
        />
      ),
    },
  ];

  return (
    <OnboardingLayout
      title="Qual seu tipo de dieta?"
      subtitle="Isso será usado para calibrar seu plano personalizado"
      currentStep={8}
      totalSteps={10}
      onBack={handleBack}
      onNext={handleNext}
      nextButtonDisabled={!selectedDietType}
    >
      <View style={styles.optionsContainer}>
        {dietTypeOptions.map((option) => (
          <SelectionOption
            key={option.dietType}
            title={option.title}
            description={option.description}
            icon={option.icon}
            isSelected={selectedDietType === option.dietType}
            onSelect={() => setSelectedDietType(option.dietType)}
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
