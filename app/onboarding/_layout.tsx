import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";

export default function OnboardingLayout() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});
  
  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

  return (
    <View key={`onboarding-container-${theme}`} style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack
        key={`onboarding-stack-${theme}`}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
