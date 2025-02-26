import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import { useNutrition, Gender } from "../../context/NutritionContext";
import OnboardingLayout from "../../components/OnboardingLayout";
import SelectionOption from "../../components/SelectionOption";

export default function GenderScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();
  const [selectedGender, setSelectedGender] = useState<Gender | undefined>(
    nutritionInfo.gender
  );

  const handleNext = () => {
    if (selectedGender) {
      updateNutritionInfo({ gender: selectedGender });
      router.push("/onboarding/training-frequency");
    }
  };

  const handleBack = () => {
    router.back();
  };

  const genderOptions = [
    {
      gender: "male" as Gender,
      title: "Masculino",
      description: "",
      icon: (
        <Ionicons
          name="male-outline"
          size={24}
          color={selectedGender === "male" ? "white" : colors.text}
        />
      ),
    },
    {
      gender: "female" as Gender,
      title: "Feminino",
      description: "",
      icon: (
        <Ionicons
          name="female-outline"
          size={24}
          color={selectedGender === "female" ? "white" : colors.text}
        />
      ),
    },
    {
      gender: "other" as Gender,
      title: "Outro",
      description: "",
      icon: (
        <Ionicons
          name="person-outline"
          size={24}
          color={selectedGender === "other" ? "white" : colors.text}
        />
      ),
    },
  ];

  return (
    <OnboardingLayout
      title="Escolha seu gênero"
      subtitle="Isso será usado para calibrar seu plano personalizado"
      currentStep={1}
      totalSteps={10}
      onBack={handleBack}
      onNext={handleNext}
      nextButtonDisabled={!selectedGender}
    >
      <View style={styles.optionsContainer}>
        {genderOptions.map((option) => (
          <SelectionOption
            key={option.gender}
            title={option.title}
            description={option.description}
            icon={option.icon}
            isSelected={selectedGender === option.gender}
            onSelect={() => setSelectedGender(option.gender)}
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
