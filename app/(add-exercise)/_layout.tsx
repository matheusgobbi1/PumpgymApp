import { Stack } from "expo-router";

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
          headerShown: true,
          presentation: "modal",
          animation: "slide_from_bottom",
          gestureEnabled: true,
          gestureDirection: "vertical",
        }}
      />
    </Stack>
  );
} 