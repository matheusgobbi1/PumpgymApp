import React, { useCallback, useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, InteractionManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import HomeHeader from "../../components/home/HomeHeader";
import ProfileInfoCard from "../../components/profile/ProfileInfoCard";
import NutritionSummaryCard from "../../components/profile/NutritionSummaryCard";
import ProfileOptionsCard from "../../components/profile/ProfileOptionsCard";
import { useRouter } from "expo-router";
import { useNutrition } from "../../context/NutritionContext";
import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useTabPreloader } from "../../hooks/useTabPreloader";
import TabPreloader from "../../components/TabPreloader";

export default function Profile() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { nutritionInfo } = useNutrition();
  const { user } = useAuth();

  // Estado para controlar o carregamento
  const [isUIReady, setIsUIReady] = useState(false);

  // Hook de precarregamento de tabs
  const { isReady } = useTabPreloader({
    delayMs: 150,
  });

  // Inicializar a UI após a renderização inicial
  useEffect(() => {
    if (isUIReady) return;

    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        setIsUIReady(true);
      }, 100);
    });
  }, [isUIReady]);

  // Função para navegar para a edição do perfil
  const handleEditProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/onboarding");
  };

  // Função para alternar o tema
  const handleThemeToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTheme();
  };

  // Função para navegar para a tela sobre nós
  const handleAboutPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/about-modal");
  };

  // Obter status do plano nutricional
  const getNutritionStatus = () => {
    if (!nutritionInfo.calories) {
      return t("profile.header.planNotConfigured");
    }

    if (
      nutritionInfo.gender &&
      nutritionInfo.height &&
      nutritionInfo.weight &&
      nutritionInfo.goal
    ) {
      return t("profile.header.planActive");
    }

    return t("profile.header.planIncomplete");
  };

  // Atualizar dados quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      try {
      } catch (error) {
      }
      return () => {};
    }, [])
  );

  // Renderizar o conteúdo da tela de forma condicional
  const renderScreenContent = () => {
    if (!isUIReady || !isReady) {
      return <TabPreloader message={t("common.loading")} />;
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsContainer}>
          {/* Novo card de informações do perfil */}
          <ProfileInfoCard onEditPress={handleEditProfilePress} />

          {/* Resumo do plano nutricional */}
          <NutritionSummaryCard />

          {/* Opções do perfil */}
          <ProfileOptionsCard
            onThemeToggle={handleThemeToggle}
            onAboutPress={handleAboutPress}
          />
        </View>

        {/* Espaço adicional para garantir que o conteúdo fique acima da bottom tab */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HomeHeader title={user?.email || t("common.user")} count={0} />

        {renderScreenContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    paddingTop: 12,
  },
  cardsContainer: {
    marginVertical: 0,
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  bottomPadding: {
    height: 80, // Altura suficiente para ficar acima da bottom tab
  },
});
