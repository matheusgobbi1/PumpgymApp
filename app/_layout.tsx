import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useCallback } from "react";
import { useColorScheme, StatusBar, Platform, View } from "react-native";
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
import { ReminderProvider } from "../context/ReminderContext";

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
        } catch (e) {}
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
                      <ReminderProvider>
                        <AppContent />
                      </ReminderProvider>
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

function AppContent() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Configuração da StatusBar para Android e iOS */}
      <StatusBar
        backgroundColor={colors.background}
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
        translucent={true}
      />

      <OfflineNotice />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
          // Remover bordas e sombras
          animation: Platform.OS === "android" ? "fade_from_bottom" : undefined,
          presentation: "card",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(add-food)" />
        <Stack.Screen
          name="reminder-modal"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="terms-of-use"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
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
    </View>
  );
}
