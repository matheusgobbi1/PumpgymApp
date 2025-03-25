import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
}

export default function OnboardingHeader({
  currentStep,
  totalSteps,
  onBack,
}: OnboardingHeaderProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack();
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top > 0 ? insets.top : 16,
          height: (insets.top > 0 ? insets.top : 16) + 56, // Altura base + insets
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.contentContainer}>
        {/* Botão de voltar */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>

        {/* Stepper centralizado */}
        <View style={styles.stepperContainer}>
          <View style={styles.progressBarsContainer}>
            {Array.from({ length: totalSteps }).map((_, index) => (
              <View
                key={`progress-${index}`}
                style={[
                  styles.progressBar,
                  {
                    backgroundColor:
                      index < currentStep ? colors.primary : colors.border,
                    marginRight: index < totalSteps - 1 ? 8 : 0,
                    width: totalSteps > 8 ? 16 : 24, // Ajustar tamanho para muitas etapas
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Espaço vazio para equilibrar o layout */}
        <View style={styles.spacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    width: "100%",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  stepperContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBarsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
  spacer: {
    width: 40,
  },
  progressBar: {
    height: 4,
    width: 24,
    borderRadius: 2,
  },
});
