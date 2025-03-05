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
    <View
      key={`onboarding-container-${theme}`}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Stack
        key={`onboarding-stack-${theme}`}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="loading"
          options={{
            gestureEnabled: false,
            headerBackVisible: false,
            headerLeft: () => null,
            animation: "fade",
            navigationBarHidden: true,
            presentation: "transparentModal",
          }}
        />
        <Stack.Screen
          name="complete-registration"
          options={{
            gestureEnabled: false,
            headerBackVisible: false,
            headerLeft: () => null,
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
