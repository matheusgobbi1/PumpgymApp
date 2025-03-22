import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ActivityIndicator } from "react-native";
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
import { useTranslation } from "react-i18next";

export default function GenderScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();
  const { signOut, user, isAnonymous, isNewUser, loading } = useAuth();
  const { t } = useTranslation();

  const [selectedGender, setSelectedGender] = useState<Gender | undefined>(
    nutritionInfo.gender
  );
  // Estado para controlar se o conteúdo deve ser renderizado
  const [shouldRender, setShouldRender] = useState(false);
  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});

  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

  // Verificação inicial do estado do usuário antes de renderizar o conteúdo
  useEffect(() => {
    // Se a autenticação ainda está carregando, não faça nada
    if (loading) return;

    console.log("GenderScreen - Estado do usuário:", {
      userExists: !!user,
      userId: user?.uid,
      isAnonymous,
      isNewUser,
      hasGender: !!nutritionInfo.gender,
    });

    // Se usuário está autenticado, não é anônimo e já completou o onboarding
    if (user && !isAnonymous && !isNewUser) {
      console.log("Redirecionando para a tela principal da tela de gênero");
      router.replace("/(tabs)");
      return;
    }

    // Somente renderize se o usuário deve estar nesta tela
    if ((user && isAnonymous) || (user && !isAnonymous && isNewUser)) {
      setShouldRender(true);
    }
  }, [user, isAnonymous, isNewUser, nutritionInfo.gender, router, loading]);

  const handleNext = () => {
    if (selectedGender) {
      updateNutritionInfo({ gender: selectedGender });
      router.push("/onboarding/training-frequency");
    }
  };

  const handleBack = () => {
    Alert.alert(
      t("onboarding.gender.exitAlert.title"),
      t("onboarding.gender.exitAlert.message"),
      [
        {
          text: t("onboarding.gender.exitAlert.cancel"),
          style: "cancel",
        },
        {
          text: t("onboarding.gender.exitAlert.confirm"),
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
      title: t("onboarding.gender.options.male"),
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
      title: t("onboarding.gender.options.female"),
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
      title: t("onboarding.gender.options.other"),
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

  // Se não devemos renderizar ainda, mostrar uma tela em branco
  if (!shouldRender) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <OnboardingLayout
      title={t("onboarding.gender.title")}
      subtitle={t("onboarding.gender.subtitle")}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
