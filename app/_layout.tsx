import React, { useEffect, useState, useRef, useCallback } from "react";
import { Stack, SplashScreen } from "expo-router";
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
import { NotificationProvider } from "../context/NotificationContext";
import { ToastProvider } from "../components/common/ToastContext";
import "../i18n"; // Importando a configuração i18n
import i18n, { getLanguageStatus } from "../i18n"; // Importar getLanguageStatus para depuração
import "../firebase/config";
import Colors from "../constants/Colors";
import "react-native-reanimated";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import NotificationService from "../services/NotificationService";
import * as Font from "expo-font";

// Configurar como as notificações serão tratadas quando o app estiver em segundo plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// Evitar que a splash screen desapareça automaticamente
SplashScreen.preventAutoHideAsync();

// Componente para carregar o idioma antes da renderização da aplicação
function LanguageInitializer() {
  useEffect(() => {
    const initLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("userLanguage");
        if (savedLanguage && savedLanguage !== i18n.language) {
          await i18n.changeLanguage(savedLanguage);
        } else {
        }
      } catch (error) {}
    };

    initLanguage();

    // Imprimir status do i18n para depuração
  }, []);

  return null;
}

export default function RootLayout() {
  // Adicionar o listener para notificações
  useEffect(() => {
    // Lidar com notificações quando o app é aberto a partir de uma notificação
    const responseListener =
      Notifications.addNotificationResponseReceivedListener(
        async (response) => {
          const data = response.notification.request.content.data;

          // Processar ações específicas (completar, adiar)
          await NotificationService.handleNotificationAction(response);

          // Se tiver ID do lembrete e for uma ação de toque normal (sem botão específico)
          if (
            data &&
            data.reminderId &&
            response.actionIdentifier ===
              Notifications.DEFAULT_ACTION_IDENTIFIER
          ) {
            AsyncStorage.setItem("@open_reminder_id", String(data.reminderId));
          }
        }
      );

    return () => {
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

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
            // Atraso para garantir que os contexts estejam inicializados
            setTimeout(async () => {
              await SyncService.syncAll();
            }, 3000);
          }
        }
      } catch (error) {}
    };

    checkPendingSyncOnStartup();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <LanguageInitializer />
              <BottomSheetModalProvider>
                <NotificationProvider>
                  <WorkoutProvider>
                    <MealProvider>
                      <NutritionProvider>
                        <ReminderProvider>
                          <ToastProvider>
                            <AppContent />
                          </ToastProvider>
                        </ReminderProvider>
                      </NutritionProvider>
                    </MealProvider>
                  </WorkoutProvider>
                </NotificationProvider>
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
  const router = useRouter();

  // Carregar fontes
  const [fontsLoaded, fontError] = Font.useFonts({
    Anton: require("../assets/fonts/Anton-Regular.ttf"),
    PlayfairDisplay: require("../assets/fonts/static/PlayfairDisplay-Regular.ttf"),
    "PlayfairDisplay-Italic": require("../assets/fonts/static/PlayfairDisplay-Italic.ttf"),
    // Adicione outras fontes aqui se necessário
  });

  // Usar useCallback para memoizar a função onLayoutRootView
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Verificar se há intenção de abrir um lembrete específico
  useEffect(() => {
    const checkPendingNavigation = async () => {
      try {
        const reminderId = await AsyncStorage.getItem("@open_reminder_id");
        if (reminderId) {
          // Navegar para a tela do lembrete
          router.push({
            pathname: "/reminder-modal",
            params: { id: reminderId },
          });
          // Limpar a intenção para não reabrir em outros momentos
          await AsyncStorage.removeItem("@open_reminder_id");
        }
      } catch (error) {
        // Ignorar erros
      }
    };

    checkPendingNavigation();
  }, [router]);

  // Não renderizar nada até que as fontes estejam carregadas
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    // Adicionar onLayout para esconder a splash screen após o layout ser calculado
    <View
      style={{ flex: 1, backgroundColor: colors.background }}
      onLayout={onLayoutRootView}
    >
      {/* Configuração da StatusBar para Android e iOS */}
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <RNStatusBar backgroundColor={colors.background} translucent={true} />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "transparent",
          },
          // Configuração melhorada de animações
          animation: "simple_push",
          animationDuration: 200,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="(add-food)"
          options={{
            animation: "slide_from_right",
            animationDuration: 200,
            presentation: "card",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(add-exercise)"
          options={{
            animation: "slide_from_right",
            animationDuration: 200,
            presentation: "card",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="reminder-modal"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 200,
          }}
        />
        <Stack.Screen
          name="terms-of-use"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 200,
          }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 200,
          }}
        />
        <Stack.Screen
          name="about-modal"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 200,
          }}
        />
        <Stack.Screen
          name="progression-modal"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 200,
          }}
        />

        <Stack.Screen
          name="(add-exercise)/exercise-details"
          options={({ route }: { route: { params?: { mode?: string } } }) => ({
            presentation: route?.params?.mode === "edit" ? "card" : "modal",
            animation:
              route?.params?.mode === "edit" ? "fade" : "slide_from_bottom",
            animationDuration: 200,
          })}
        />
        <Stack.Screen
          name="nutrition-recommendation-modal"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 200,
          }}
        />
        <Stack.Screen
          name="meal-distribution-config"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 200,
          }}
        />
        <Stack.Screen
          name="diet-export-modal"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 200,
          }}
        />
        <Stack.Screen
          name="workout-export-modal"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            animationDuration: 200,
          }}
        />
      </Stack>
    </View>
  );
}
