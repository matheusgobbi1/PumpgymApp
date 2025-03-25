import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import Colors from "../../constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OnboardingLayout() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAnonymous, isNewUser, loading } = useAuth();
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Verificação inicial antes de renderizar qualquer conteúdo
  useEffect(() => {
    // Ignorar verificações enquanto estiver carregando
    if (loading) return;

    console.log("OnboardingLayout - Estado do usuário:", {
      userExists: !!user,
      isAnonymous: isAnonymous,
      isNewUser: isNewUser,
    });

    // Se o usuário está autenticado, não é anônimo e já completou o onboarding
    if (user && !isAnonymous && !isNewUser) {
      console.log("OnboardingLayout: Redirecionando para a tela principal");

      // Redirecionar para a tela principal e evitar renderização do conteúdo
      router.replace("/(tabs)");
    } else {
      // Permitir que o conteúdo seja renderizado para outros casos
      setInitialCheckDone(true);
    }
  }, [user, isAnonymous, isNewUser, loading, router]);

  // Se ainda estamos verificando ou ainda não terminamos as verificações iniciais, mostrar tela de carregamento
  if (loading || !initialCheckDone) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="complete-registration"
          options={{
            gestureEnabled: false,
            headerBackVisible: false,
            presentation: "modal",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
