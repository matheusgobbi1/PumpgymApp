import React, { ReactNode } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../constants/Colors";
import { useColorScheme } from "react-native";
import Button from "./Button";
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
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <OnboardingHeader
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}
      />

      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.text }]}>
              {subtitle}
            </Text>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {children}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={nextButtonTitle}
          onPress={onNext}
          disabled={nextButtonDisabled}
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
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    opacity: 0.7,
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
    paddingBottom: Platform.OS === "ios" ? 32 : 24,
  },
});
