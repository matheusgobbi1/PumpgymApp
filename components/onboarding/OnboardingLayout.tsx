import React, { ReactNode, useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import Button from "../common/Button";
import OnboardingHeader from "./OnboardingHeader";

interface OnboardingLayoutProps {
  title: string;
  subtitle?: string;
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  nextButtonTitle?: string;
  nextButtonDisabled?: boolean;
  children: ReactNode;
  error?: string;
}

export default function OnboardingLayout({
  title,
  subtitle,
  currentStep,
  totalSteps,
  onBack,
  onNext,
  nextButtonTitle = "Próximo",
  nextButtonDisabled = false,
  children,
  error,
}: OnboardingLayoutProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});

  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    // Forçar re-renderização quando o tema mudar
    setForceUpdate({});
  }, [theme]);

  return (
    <SafeAreaView
      key={`onboarding-layout-${theme}`}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <OnboardingHeader
        key={`onboarding-header-${theme}`}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}
      />

      <ScrollView
        key={`onboarding-scroll-${theme}`}
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View key={`onboarding-content-${theme}`} style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.text }]}>
              {subtitle}
            </Text>
          )}

          {error && (
            <View
              key={`error-container-${theme}`}
              style={styles.errorContainer}
            >
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {children}
        </View>
      </ScrollView>

      <View key={`footer-${theme}`} style={styles.footer}>
        <Button
          key={`next-button-${theme}`}
          title={nextButtonTitle}
          onPress={onNext}
          disabled={nextButtonDisabled}
          hapticFeedback={
            currentStep === totalSteps ? "notification" : "impact"
          }
          hapticIntensity={currentStep === totalSteps ? "heavy" : "medium"}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    opacity: 0.7,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 10 : 20,
  },
});
