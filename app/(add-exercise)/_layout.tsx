import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function AddExerciseLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="exercise-details"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
          gestureDirection: "vertical",
          contentStyle: { backgroundColor: "transparent" },
          gestureEnabled: true,
          fullScreenGestureEnabled: Platform.OS === "ios",
        }}
      />
    </Stack>
  );
}
