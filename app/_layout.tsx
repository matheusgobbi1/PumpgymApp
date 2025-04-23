import React, { useEffect, useState, useRef } from "react";
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
import { NotificationProvider } from "../context/NotificationContext";
import {
  AchievementProvider,
  useAchievements,
} from "../context/AchievementContext";
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
import AchievementUnlockedToast from "../components/achievements/AchievementUnlockedToast";

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
                        <AchievementProvider>
                          <ReminderProvider>
                            <ToastProvider>
                              <AppContent />
                            </ToastProvider>
                          </ReminderProvider>
                        </AchievementProvider>
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

// Componente para gerenciar notificações de conquistas
function AchievementNotificationManager() {
  const { recentlyUnlocked, achievements, markUnlockedAsViewed } =
    useAchievements();
  const router = useRouter();
  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(
    new Set()
  );
  const [isInitialRender, setIsInitialRender] = useState(true);
  const prevRecentlyUnlockedLength = useRef(0);
  const initialCheckDone = useRef(false);

  // Carregar notificações já mostradas anteriormente
  useEffect(() => {
    const loadShownNotifications = async () => {
      try {
        const shownKey = "@pumpgym_shown_notifications";
        const shown = await AsyncStorage.getItem(shownKey);
        if (shown) {
          const shownIds = JSON.parse(shown) as string[];
          setShownNotifications(new Set(shownIds));
        }
      } catch (error) {
        console.error("Erro ao carregar notificações exibidas:", error);
      }
    };

    loadShownNotifications();
  }, []);

  // Salvar notificações mostradas (sem marcar como visualizadas)
  const saveShownNotification = async (id: string) => {
    try {
      const updatedShown = new Set(shownNotifications).add(id);
      const shownKey = "@pumpgym_shown_notifications";
      await AsyncStorage.setItem(
        shownKey,
        JSON.stringify(Array.from(updatedShown))
      );
      setShownNotifications(updatedShown);
    } catch (error) {
      console.error("Erro ao salvar notificações exibidas:", error);
    }
  };

  // Verificar se é o primeiro carregamento do app ou um reload
  useEffect(() => {
    const checkFirstLoad = async () => {
      try {
        const lastSessionKey = "@pumpgym_last_session";
        const currentSession = Date.now().toString();
        const lastSession = await AsyncStorage.getItem(lastSessionKey);

        // Se já houve uma sessão recente (menos de 1 minuto atrás), consideramos um reload
        const isReload =
          lastSession && Date.now() - parseInt(lastSession) < 60000;

        // Atualizar a última sessão
        await AsyncStorage.setItem(lastSessionKey, currentSession);

        // Se for reload, não mostrar notificações
        if (isReload) {
          setIsInitialRender(false);
        } else {
          // Dar um tempo mais curto para os contexts carregarem
          setTimeout(() => {
            setIsInitialRender(false);
          }, 500); // Reduzido de 2000ms para 500ms
        }
      } catch (error) {
        setIsInitialRender(false);
      }
    };

    checkFirstLoad();
  }, []);

  // Verificação inicial para conquistas não visualizadas
  useEffect(() => {
    if (
      isInitialRender &&
      recentlyUnlocked.length > 0 &&
      !initialCheckDone.current
    ) {
      // Verificar se há conquistas não visualizadas e não mostradas ainda
      const hasUnviewed = recentlyUnlocked.some(
        (item) => !item.viewed && !shownNotifications.has(item.id)
      );

      if (hasUnviewed) {
        // Reduzir o tempo de espera para 100ms, apenas para garantir carregamento dos outros componentes
        setTimeout(() => {
          setIsInitialRender(false);
          initialCheckDone.current = true;
        }, 100);
      }
    }
  }, [recentlyUnlocked, isInitialRender, shownNotifications]);

  // Reagir a mudanças na lista recentlyUnlocked
  useEffect(() => {
    // Se houver novas conquistas não visualizadas
    if (
      recentlyUnlocked.length > prevRecentlyUnlockedLength.current &&
      !currentNotification
    ) {
      // Se estamos na renderização inicial, forçar a finalização do estado inicial
      if (isInitialRender) {
        setIsInitialRender(false);
      }
    }

    prevRecentlyUnlockedLength.current = recentlyUnlocked.length;
  }, [recentlyUnlocked, currentNotification, isInitialRender]);

  // Mostrar toast para a primeira conquista não visualizada
  useEffect(() => {
    // Não mostrar notificações se for um reload ou durante a renderização inicial
    if (recentlyUnlocked.length === 0 || currentNotification || isInitialRender)
      return;

    // Encontrar a primeira conquista não visualizada que ainda não foi mostrada como notificação
    const unviewed = recentlyUnlocked.find(
      (item) => !item.viewed && !shownNotifications.has(item.id)
    );

    if (!unviewed) return;

    // Buscar os detalhes da conquista
    const achievement = achievements.find((a) => a.id === unviewed.id);
    if (!achievement) return;

    // Marcar como notificação já exibida, sem afetar o estado de visualização
    saveShownNotification(unviewed.id);

    // Configurar a notificação
    setCurrentNotification({
      id: unviewed.id,
      title: unviewed.id,
      description: achievement.description,
      icon: achievement.icon,
      color: achievement.badgeColor,
      points: achievement.fitPoints,
      uniqueKey: `${unviewed.id}-${Date.now()}`, // Garantir chave única
    });
  }, [
    recentlyUnlocked,
    currentNotification,
    achievements,
    shownNotifications,
    isInitialRender,
  ]);

  // Funções para lidar com interações do usuário
  const handleToastPress = () => {
    // Navegar para a tela de conquistas
    router.push("/achievements-modal");

    // Apenas fechar o toast, sem marcar como visualizada
    // A visualização ocorrerá quando o usuário clicar na conquista na tela de conquistas
    setCurrentNotification(null);
  };

  const handleToastDismiss = () => {
    // Apenas fechar o toast, sem marcar como visualizada
    // A visualização ocorrerá quando o usuário clicar na conquista na tela de conquistas
    setCurrentNotification(null);
  };

  // Renderizar o toast se houver uma notificação
  return currentNotification ? (
    <AchievementUnlockedToast
      key={currentNotification.uniqueKey}
      title={currentNotification.title}
      description={currentNotification.description}
      icon={currentNotification.icon}
      color={currentNotification.color}
      points={currentNotification.points}
      onPress={handleToastPress}
      onDismiss={handleToastDismiss}
    />
  ) : null;
}

function AppContent() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();

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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Configuração da StatusBar para Android e iOS */}
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <RNStatusBar backgroundColor={colors.background} translucent={true} />

      {/* Componente para mostrar notificações de conquistas */}
      <AchievementNotificationManager />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "transparent",
          },
          // Configuração melhorada de animações
          animation: "none",
          animationDuration: 100,
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
          name="achievements-modal"
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
              route?.params?.mode === "edit" ? "default" : "slide_from_bottom",
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
