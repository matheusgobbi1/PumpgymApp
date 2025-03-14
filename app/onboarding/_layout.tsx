import React from "react";
import { View, StyleSheet, StatusBar, Platform } from "react-native";
import { Stack } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OnboardingLayout() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        },
      ]}
    >
      <StatusBar
        backgroundColor={colors.background}
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
        translucent={true}
      />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: {
            backgroundColor: colors.background,
          },
          presentation: "card",
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
