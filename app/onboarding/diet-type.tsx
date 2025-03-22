import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useNutrition, DietType } from "../../context/NutritionContext";
import OnboardingLayout from "../../components/onboarding/OnboardingLayout";
import SelectionOption from "../../components/onboarding/SelectionOption";
import { useTranslation } from "react-i18next";

export default function DietTypeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();
  const { t } = useTranslation();
  const [selectedDietType, setSelectedDietType] = useState<
    DietType | undefined
  >(nutritionInfo.dietType);

  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});

  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

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
      title: t("onboarding.dietType.options.classic.title"),
      description: t("onboarding.dietType.options.classic.description"),
      icon: (
        <Ionicons
          key={`classic-icon-${theme}`}
          name="restaurant-outline"
          size={28}
          color={selectedDietType === "classic" ? colors.primary : colors.text}
        />
      ),
    },
    {
      dietType: "pescatarian" as DietType,
      title: t("onboarding.dietType.options.pescatarian.title"),
      description: t("onboarding.dietType.options.pescatarian.description"),
      icon: (
        <Ionicons
          key={`pescatarian-icon-${theme}`}
          name="fish-outline"
          size={28}
          color={
            selectedDietType === "pescatarian" ? colors.primary : colors.text
          }
        />
      ),
    },
    {
      dietType: "vegetarian" as DietType,
      title: t("onboarding.dietType.options.vegetarian.title"),
      description: t("onboarding.dietType.options.vegetarian.description"),
      icon: (
        <Ionicons
          key={`vegetarian-icon-${theme}`}
          name="leaf-outline"
          size={28}
          color={
            selectedDietType === "vegetarian" ? colors.primary : colors.text
          }
        />
      ),
    },
    {
      dietType: "vegan" as DietType,
      title: t("onboarding.dietType.options.vegan.title"),
      description: t("onboarding.dietType.options.vegan.description"),
      icon: (
        <Ionicons
          key={`vegan-icon-${theme}`}
          name="nutrition-outline"
          size={28}
          color={selectedDietType === "vegan" ? colors.primary : colors.text}
        />
      ),
    },
  ];

  return (
    <OnboardingLayout
      title={t("onboarding.dietType.title")}
      subtitle={t("onboarding.dietType.subtitle")}
      currentStep={8}
      totalSteps={10}
      onBack={handleBack}
      onNext={handleNext}
      nextButtonDisabled={!selectedDietType}
    >
      <View key={`options-container-${theme}`} style={styles.optionsContainer}>
        {dietTypeOptions.map((option) => (
          <SelectionOption
            key={`diet-option-${option.dietType}-${theme}`}
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
