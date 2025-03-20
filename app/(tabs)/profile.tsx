import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
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

export default function Profile() {
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { nutritionInfo, saveNutritionInfo } = useNutrition();
  const { user } = useAuth();

  // Estado para controlar o refresh da tela
  const [refreshing, setRefreshing] = useState(false);

  // Estado para forçar re-renderização
  const [refreshKey, setRefreshKey] = useState(0);

  // Estado para contador de logins do usuário (login streak)
  const [loginCount, setLoginCount] = useState(0);

  // Efeito para definir o contador de logins
  useEffect(() => {
    // Simular um contador de logins com base no último dígito do UID, ou usar um valor fixo (7) para teste
    const uidLastDigit = user?.uid ? parseInt(user.uid.slice(-1)) : 0;
    setLoginCount(uidLastDigit > 0 ? uidLastDigit : 7);
  }, [user]);

  // Função para navegar para as configurações
  const handleSettingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/settings");
  };

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

  // Função para navegar para a tela de notificações
  const handleNotificationsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/notifications-modal");
  };

  // Função para navegar para a tela de privacidade e segurança
  const handlePrivacyPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/privacy-modal");
  };

  // Função para navegar para a tela sobre nós
  const handleAboutPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/about-modal");
  };

  // Função para navegar para a tela de ajuda e suporte
  const handleHelpPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/help-modal");
  };

  // Função para atualizar os dados
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await saveNutritionInfo();
      setRefreshKey((prev) => prev + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      // Mostrar mensagem de erro para o usuário
      Alert.alert(
        "Erro ao atualizar",
        "Não foi possível atualizar seus dados. Por favor, tente novamente mais tarde."
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setRefreshing(false);
    }
  };

  // Efeito para atualizar a tela quando os dados de nutrição mudarem
  useEffect(() => {
    try {
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Erro ao atualizar interface:", error);
    }
  }, [
    nutritionInfo.calories,
    nutritionInfo.protein,
    nutritionInfo.carbs,
    nutritionInfo.fat,
  ]);

  // Obter status do plano nutricional
  const getNutritionStatus = () => {
    if (!nutritionInfo.calories) {
      return "Plano não configurado";
    }

    if (
      nutritionInfo.gender &&
      nutritionInfo.height &&
      nutritionInfo.weight &&
      nutritionInfo.goal
    ) {
      return "Plano ativo";
    }

    return "Plano incompleto";
  };

  // Atualizar dados quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      try {
      } catch (error) {
        console.error("Erro ao atualizar tela:", error);
      }
      return () => {};
    }, [])
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HomeHeader title={user?.email || "Email não disponível"} count={0} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.cardsContainer}>
            {/* Novo card de informações do perfil */}
            <ProfileInfoCard
              onEditPress={handleEditProfilePress}
              key={`profile-info-${refreshKey}`}
            />

            {/* Resumo do plano nutricional */}
            <NutritionSummaryCard key={`nutrition-summary-${refreshKey}`} />

            {/* Opções do perfil */}
            <ProfileOptionsCard
              onThemeToggle={handleThemeToggle}
              onNotificationsPress={handleNotificationsPress}
              onPrivacyPress={handlePrivacyPress}
              onAboutPress={handleAboutPress}
              onHelpPress={handleHelpPress}
              key={`profile-options-${refreshKey}`}
            />
          </View>

          {/* Espaço adicional para garantir que o conteúdo fique acima da bottom tab */}
          <View style={styles.bottomPadding} />
        </ScrollView>
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
