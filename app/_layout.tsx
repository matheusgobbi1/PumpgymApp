import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { Platform, View, StatusBar as RNStatusBar } from "react-native";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NutritionProvider } from "../context/NutritionContext";
import { WorkoutProvider } from "../context/WorkoutContext";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { ReminderProvider } from "../context/ReminderContext";
import { LanguageProvider } from "../context/LanguageContext";
import { MealProvider } from "../context/MealContext";
import "../i18n"; // Importando a configuração i18n
import "../firebase/config";
import OfflineNotice from "../components/notifications/OfflineNotice";
import Colors from "../constants/Colors";
import "react-native-reanimated";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export default function RootLayout() {
  useEffect(() => {
    // Verificar sincronização pendente na inicialização do app
    const checkPendingSyncOnStartup = async () => {
      try {
        // Importar dinamicamente para evitar problemas de circular import
        const { SyncService } = require("../services/SyncService");
        const { OfflineStorage } = require("../services/OfflineStorage");

        // Verificar se está online
        const isOnline = await SyncService.isOnline();
        if (!isOnline) return;

        // Verificar se há operações pendentes
        const pendingOps = await OfflineStorage.getPendingOperations();

        // Verificar se há datas de refeições modificadas
        const userData = await AsyncStorage.getItem("pumpgym_user_data");
        if (userData) {
          const user = JSON.parse(userData);
          const modifiedDatesKey = `@meals:${user.uid}:modified_dates`;
          const modifiedDatesStr = await AsyncStorage.getItem(modifiedDatesKey);
          const modifiedDates = modifiedDatesStr
            ? JSON.parse(modifiedDatesStr)
            : [];

          // Se existirem operações pendentes, sincronizar
          if (pendingOps.length > 0 || modifiedDates.length > 0) {
            console.log(
              "Operações pendentes encontradas na inicialização. Sincronizando..."
            );
            // Atraso para garantir que os contexts estejam inicializados
            setTimeout(async () => {
              await SyncService.syncAll();
              console.log("Sincronização na inicialização concluída");
            }, 3000);
          }
        }
      } catch (error) {
        console.error(
          "Erro ao verificar sincronização pendente na inicialização:",
          error
        );
      }
    };

    checkPendingSyncOnStartup();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <BottomSheetModalProvider>
                <NutritionProvider>
                  <MealProvider>
                    <WorkoutProvider>
                      <ReminderProvider>
                        <OfflineNotice />
                        <AppContent />
                      </ReminderProvider>
                    </WorkoutProvider>
                  </MealProvider>
                </NutritionProvider>
              </BottomSheetModalProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
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
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <RNStatusBar backgroundColor={colors.background} translucent={true} />

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
        <Stack.Screen
          name="progression-modal"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
      </Stack>
    </View>
  );
}
