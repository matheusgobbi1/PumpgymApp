import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import { useNutrition, Gender } from "../../context/NutritionContext";
import OnboardingLayout from "../../components/OnboardingLayout";
import SelectionOption from "../../components/SelectionOption";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../firebase/config";
import { signOut as firebaseSignOut } from "firebase/auth";

export default function GenderScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();
  const { signOut } = useAuth();
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
    Alert.alert(
      "Sair do onboarding",
      "Tem certeza que deseja voltar para a tela de login? Seu progresso não será salvo.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Voltar para login",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error("Erro ao voltar para login:", error);
            }
          },
        },
      ]
    );
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
          color={selectedGender === "male" ? colors.primary : colors.text}
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
          color={selectedGender === "female" ? colors.primary : colors.text}
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
          color={selectedGender === "other" ? colors.primary : colors.text}
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
