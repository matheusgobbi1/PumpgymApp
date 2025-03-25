import { Stack } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";

export default function WorkoutLayout() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="stats"
        options={{
          presentation: "modal",
          headerShown: false,
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}
