import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useNutrition } from "../../context/NutritionContext";
import OnboardingLayout from "../../components/onboarding/OnboardingLayout";
import { MotiView } from "moti";

export default function ReferralScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();

  const [referral, setReferral] = useState<string>(
    nutritionInfo.referral || ""
  );
  
  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});
  
  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

  const handleNext = () => {
    updateNutritionInfo({ referral });
    router.push("/onboarding/loading" as any);
  };

  const handleBack = () => {
    router.back();
  };

  const referralOptions = [
    { id: "instagram", name: "Instagram", icon: "logo-instagram" },
    { id: "facebook", name: "Facebook", icon: "logo-facebook" },
    { id: "tiktok", name: "TikTok", icon: "logo-tiktok" },
    { id: "youtube", name: "Youtube", icon: "logo-youtube" },
    { id: "google", name: "Google", icon: "logo-google" },
    { id: "tv", name: "TV", icon: "tv-outline" },
  ];

  return (
    <OnboardingLayout
      title="Onde você ouviu falar de nós?"
      subtitle=""
      currentStep={9}
      totalSteps={10}
      onBack={handleBack}
      onNext={handleNext}
      nextButtonDisabled={!referral}
    >
      <MotiView
        key={`options-container-${theme}`}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.optionsContainer}
      >
        {referralOptions.map((option) => (
          <MotiView
            key={`referral-option-${option.id}-${theme}`}
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 100 + referralOptions.indexOf(option) * 50 }}
          >
            <TouchableOpacity
              style={[
                styles.optionContainer,
                {
                  backgroundColor:
                    referral === option.id ? colors.primary : theme === 'dark' ? colors.dark : colors.light,
                  borderColor:
                    referral === option.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setReferral(option.id)}
            >
              <Ionicons
                name={option.icon as any}
                size={24}
                color={referral === option.id ? "white" : colors.text}
                style={styles.optionIcon}
              />
              <Text
                style={[
                  styles.optionText,
                  { color: referral === option.id ? "white" : colors.text },
                ]}
              >
                {option.name}
              </Text>
            </TouchableOpacity>
          </MotiView>
        ))}
      </MotiView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    gap: 12,
    marginTop: 20,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionIcon: {
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
