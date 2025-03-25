import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useNutrition } from "../../context/NutritionContext";
import OnboardingLayout from "../../components/onboarding/OnboardingLayout";
import SelectionOption from "../../components/onboarding/SelectionOption";
import { onboardingStyles } from "../../components/onboarding/OnboardingStyles";
import { useTranslation } from "react-i18next";

export default function ReferralScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();
  const { t } = useTranslation();

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
    {
      id: "instagram",
      name: t("onboarding.referral.options.instagram"),
      icon: "logo-instagram",
    },
    {
      id: "facebook",
      name: t("onboarding.referral.options.facebook"),
      icon: "logo-facebook",
    },
    {
      id: "tiktok",
      name: t("onboarding.referral.options.tiktok"),
      icon: "logo-tiktok",
    },
    {
      id: "youtube",
      name: t("onboarding.referral.options.youtube"),
      icon: "logo-youtube",
    },
    {
      id: "google",
      name: t("onboarding.referral.options.google"),
      icon: "logo-google",
    },
  ];

  return (
    <OnboardingLayout
      title={t("onboarding.referral.title")}
      subtitle={t("onboarding.referral.subtitle")}
      currentStep={9}
      totalSteps={10}
      onBack={handleBack}
      onNext={handleNext}
      nextButtonDisabled={!referral}
    >
      <View style={styles.optionsContainer}>
        {referralOptions.map((option) => (
          <SelectionOption
            key={`referral-option-${option.id}-${theme}`}
            title={option.name}
            description=""
            icon={
              <Ionicons
                name={option.icon as any}
                size={24}
                color={referral === option.id ? colors.primary : colors.text}
              />
            }
            isSelected={referral === option.id}
            onSelect={() => setReferral(option.id)}
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
