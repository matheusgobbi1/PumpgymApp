import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  InteractionManager,
  Platform,
} from "react-native";
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

export default function Profile() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { nutritionInfo } = useNutrition();
  const { user } = useAuth();

  // Referência para o ScrollView para permitir rolagem programática
  const scrollViewRef = useRef<ScrollView>(null);

  // Estado para controlar o carregamento
  const [isUIReady, setIsUIReady] = useState(false);

  // Calcular altura do header
  const headerHeight = Platform.OS === "ios" ? 70 : 60;

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
      } catch (error) {}
      return () => {};
    }, [])
  );

  // Renderizar o conteúdo da tela de forma condicional
  const renderScreenContent = () => {
    if (!isUIReady) {
      return (
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <View style={styles.loadingContainer}>
            {/* Você pode adicionar aqui qualquer UI de carregamento simples, se necessário */}
          </View>
        </View>
      );
    }

    return (
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          // Adicionar padding top para compensar header
          { paddingTop: headerHeight + 12 }, // +12 de padding original
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsContainer}>
          {/* Novo card de informações do perfil */}
          <ProfileInfoCard onEditPress={handleEditProfilePress} />

          {/* Resumo do plano nutricional */}
          <NutritionSummaryCard scrollViewRef={scrollViewRef} />

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
      {/* Container principal da tela com fundo transparente */}
      <View style={[styles.container, { backgroundColor: "transparent" }]}>
        {/* Header posicionado absolutamente no topo */}
        <View style={styles.headerWrapper}>
          <HomeHeader
            title={user?.email || t("common.user")}
            onFitLevelPress={() => router.push("/achievements-modal")}
          />
        </View>

        {/* Conteúdo da tela renderizado aqui */}
        {renderScreenContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative", // Para que o header absoluto funcione
  },
  // Wrapper para o header absoluto
  headerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1, // Header fica sobre o ScrollView
  },
  scrollView: {
    flex: 1,
    backgroundColor: "transparent", // ScrollView precisa ser transparente
  },
  scrollContent: {
    paddingBottom: 24,
    // paddingTop é aplicado dinamicamente (headerHeight + 12)
  },
  cardsContainer: {
    marginVertical: 0,
    paddingTop: 0,
    paddingHorizontal: 0, // Removido o padding horizontal que foi adicionado incorretamente
  },
  bottomPadding: {
    height: 80, // Altura suficiente para ficar acima da bottom tab
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
