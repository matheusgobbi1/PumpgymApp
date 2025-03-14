import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useCallback } from "react";
import { useColorScheme } from "react-native";
import { AuthProvider } from "../context/AuthContext";
import { NutritionProvider } from "../context/NutritionContext";
import { MealProvider } from "../context/MealContext";
import { WorkoutProvider } from "../context/WorkoutContext";
import { RefreshProvider } from "../context/RefreshContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Colors from "../constants/Colors";
import OfflineNotice from "../components/notifications/OfflineNotice";
import "react-native-reanimated";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Ocultar a splash screen quando as fontes estiverem carregadas
  const onLayoutRootView = useCallback(async () => {
    if (loaded) {
      // Ocultar a splash screen nativa do Expo
      await SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Garantir que a splash screen seja ocultada mesmo se houver problemas
  useEffect(() => {
    if (loaded) {
      onLayoutRootView();

      // Timeout de segurança para garantir que a splash screen seja ocultada
      const timeoutId = setTimeout(async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.log("Erro ao ocultar splash screen:", e);
        }
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
  }, [loaded, onLayoutRootView]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <ThemeProvider>
            <AuthProvider>
              <NutritionProvider>
                <MealProvider>
                  <WorkoutProvider>
                    <RefreshProvider>
                      <OfflineNotice />
                      <StackNavigator />
                    </RefreshProvider>
                  </WorkoutProvider>
                </MealProvider>
              </NutritionProvider>
            </AuthProvider>
          </ThemeProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function StackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors[theme].background,
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(add-food)" />
      <Stack.Screen
        name="notifications-modal"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="privacy-modal"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="about-modal"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="help-modal"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}
