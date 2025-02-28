import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import { useNutrition, Goal } from "../../context/NutritionContext";
import OnboardingLayout from "../../components/onboarding/OnboardingLayout";
import SelectionOption from "../../components/onboarding/SelectionOption";

export default function GoalScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();
  const [selectedGoal, setSelectedGoal] = useState<Goal | undefined>(
    nutritionInfo.goal
  );

  const handleNext = () => {
    if (selectedGoal) {
      updateNutritionInfo({ goal: selectedGoal });
      router.push("/onboarding/weight-goal" as any);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const goalOptions = [
    {
      goal: "lose" as Goal,
      title: "Perder Peso",
      description: "Reduzir gordura corporal",
      icon: (
        <Ionicons
          name="trending-down-outline"
          size={28}
          color={selectedGoal === "lose" ? "white" : colors.text}
        />
      ),
    },
    {
      goal: "maintain" as Goal,
      title: "Manter Peso",
      description: "Manter composição corporal atual",
      icon: (
        <Ionicons
          name="reorder-two-outline"
          size={28}
          color={selectedGoal === "maintain" ? "white" : colors.text}
        />
      ),
    },
    {
      goal: "gain" as Goal,
      title: "Ganhar Massa",
      description: "Aumentar massa muscular",
      icon: (
        <Ionicons
          name="trending-up-outline"
          size={28}
          color={selectedGoal === "gain" ? "white" : colors.text}
        />
      ),
    },
  ];

  return (
    <OnboardingLayout
      title="Qual seu objetivo?"
      subtitle="Isso será usado para calibrar seu plano personalizado"
      currentStep={5}
      totalSteps={10}
      onBack={handleBack}
      onNext={handleNext}
      nextButtonDisabled={!selectedGoal}
    >
      <View style={styles.optionsContainer}>
        {goalOptions.map((option) => (
          <SelectionOption
            key={option.goal}
            title={option.title}
            description={option.description}
            icon={option.icon}
            isSelected={selectedGoal === option.goal}
            onSelect={() => setSelectedGoal(option.goal)}
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
