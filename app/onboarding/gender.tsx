import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useNutrition, Gender } from "../../context/NutritionContext";
import OnboardingLayout from "../../components/onboarding/OnboardingLayout";
import SelectionOption from "../../components/onboarding/SelectionOption";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../firebase/config";
import { signOut as firebaseSignOut } from "firebase/auth";

export default function GenderScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();
  const { signOut } = useAuth();
  const [selectedGender, setSelectedGender] = useState<Gender | undefined>(
    nutritionInfo.gender
  );
  
  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});
  
  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

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
          key={`male-icon-${theme}`}
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
          key={`female-icon-${theme}`}
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
          key={`other-icon-${theme}`}
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
      <View key={`options-container-${theme}`} style={styles.optionsContainer}>
        {genderOptions.map((option) => (
          <SelectionOption
            key={`gender-option-${option.gender}-${theme}`}
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
