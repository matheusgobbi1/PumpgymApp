import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import { useNutrition, Goal } from "../../context/NutritionContext";
import OnboardingLayout from "../../components/onboarding/OnboardingLayout";
import SelectionOption from "../../components/onboarding/SelectionOption";
import { useTranslation } from "react-i18next";

export default function GoalScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();
  const { t } = useTranslation();
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
      title: t("onboarding.goal.options.lose.title"),
      description: t("onboarding.goal.options.lose.description"),
      icon: (
        <Ionicons
          name="trending-down-outline"
          size={28}
          color={selectedGoal === "lose" ? colors.primary : colors.text}
        />
      ),
    },
    {
      goal: "maintain" as Goal,
      title: t("onboarding.goal.options.maintain.title"),
      description: t("onboarding.goal.options.maintain.description"),
      icon: (
        <Ionicons
          name="reorder-two-outline"
          size={28}
          color={selectedGoal === "maintain" ? colors.primary : colors.text}
        />
      ),
    },
    {
      goal: "gain" as Goal,
      title: t("onboarding.goal.options.gain.title"),
      description: t("onboarding.goal.options.gain.description"),
      icon: (
        <Ionicons
          name="trending-up-outline"
          size={28}
          color={selectedGoal === "gain" ? colors.primary : colors.text}
        />
      ),
    },
  ];

  return (
    <OnboardingLayout
      title={t("onboarding.goal.title")}
      subtitle={t("onboarding.goal.subtitle")}
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
