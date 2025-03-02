import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onSettings?: () => void;
}

export default function OnboardingHeader({
  currentStep,
  totalSteps,
  onBack,
  onSettings,
}: OnboardingHeaderProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});
  
  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

  return (
    <View key={`header-container-${theme}`} style={styles.header}>
      <TouchableOpacity key={`back-button-${theme}`} onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <View key={`progress-container-${theme}`} style={styles.progressContainer}>
        {[...Array(totalSteps)].map((_, index) => (
          <View
            key={`progress-bar-${index}-${theme}`}
            style={[
              styles.progressBar,
              {
                backgroundColor:
                  index < currentStep ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>
      <TouchableOpacity
        key={`settings-button-${theme}`}
        style={styles.settingsButton}
        onPress={onSettings || (() => {})}
      >
        <Ionicons name="settings-outline" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  settingsButton: {
    padding: 8,
  },
  progressContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  progressBar: {
    height: 4,
    flex: 1,
    borderRadius: 2,
  },
});
