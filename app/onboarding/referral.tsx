import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import { useNutrition } from "../../context/NutritionContext";
import OnboardingLayout from "../../components/onboarding/OnboardingLayout";

export default function ReferralScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();

  const [referral, setReferral] = useState<string>(
    nutritionInfo.referral || ""
  );

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
      <View style={styles.optionsContainer}>
        {referralOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionContainer,
              {
                backgroundColor:
                  referral === option.id ? colors.primary : colors.light,
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
        ))}
      </View>
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
