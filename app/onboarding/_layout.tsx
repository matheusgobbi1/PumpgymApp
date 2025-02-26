import React from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import Colors from "../../constants/Colors";

export default function OnboardingLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack
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
