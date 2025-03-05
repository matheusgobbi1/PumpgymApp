import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  StatusBar,
  SafeAreaView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import ProfileHeader from "../../components/profile/ProfileHeader";
import BodyStatsCard from "../../components/profile/BodyStatsCard";
import NutritionGoalsCard from "../../components/profile/NutritionGoalsCard";
import TrainingStatsCard from "../../components/profile/TrainingStatsCard";
import SettingsCard from "../../components/profile/SettingsCard";
import * as Haptics from "expo-haptics";

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, toggleTheme, useSystemTheme, setUseSystemTheme } = useTheme();
  const colors = Colors[theme];
  const { user, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Dados de exemplo para estatísticas do usuário
  const profileStats = [
    {
      label: "Treinos",
      value: "48",
      icon: "barbell-outline",
    },
    {
      label: "Refeições",
      value: "124",
      icon: "restaurant-outline",
    },
    {
      label: "Dias Ativos",
      value: "32",
      icon: "calendar-outline",
    },
  ];

  // Dados de exemplo para estatísticas corporais
  const bodyStats = [
    {
      label: "Peso",
      value: "78.5",
      unit: "kg",
      icon: "scale-outline",
    },
    {
      label: "Altura",
      value: "172",
      unit: "cm",
      icon: "resize-outline",
    },
    {
      label: "IMC",
      value: "26.5",
      unit: "",
      icon: "body-outline",
    },
    {
      label: "Gordura",
      value: "18.2",
      unit: "%",
      icon: "water-outline",
    },
  ];

  // Dados de exemplo para histórico de peso
  const weightHistory = {
    labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
    data: [82, 80.5, 79.8, 79.2, 78.7, 78.5],
  };

  // Dados de exemplo para metas nutricionais
  const nutritionGoals = [
    {
      name: "Calorias",
      current: 1850,
      target: 2200,
      unit: "kcal",
      icon: "flame-outline",
      color: "#FF5722",
    },
    {
      name: "Proteínas",
      current: 145,
      target: 150,
      unit: "g",
      icon: "nutrition-outline",
      color: "#4BB543",
    },
    {
      name: "Carboidratos",
      current: 180,
      target: 220,
      unit: "g",
      icon: "restaurant-outline",
      color: "#FFC107",
    },
    {
      name: "Gorduras",
      current: 55,
      target: 70,
      unit: "g",
      icon: "water-outline",
      color: "#1c9abe",
    },
  ];

  // Dados de exemplo para estatísticas de treino
  const trainingStats = [
    {
      label: "Volume Total",
      value: "12.5k kg",
      icon: "barbell-outline",
      change: 8,
    },
    {
      label: "Séries",
      value: "324",
      icon: "repeat-outline",
      change: 12,
    },
    {
      label: "Duração",
      value: "18h 45m",
      icon: "time-outline",
      change: 5,
    },
    {
      label: "Peso Máx.",
      value: "120 kg",
      icon: "trophy-outline",
      change: 10,
    },
  ];

  // Dados de exemplo para volume semanal de treino
  const weeklyVolume = {
    labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    data: [2500, 0, 3200, 0, 2800, 1500, 0],
  };

  // Dados de exemplo para configurações
  const settingsSections = [
    {
      title: "Aparência",
      items: [
        {
          id: "theme",
          title: "Tema Escuro",
          icon: "moon-outline",
          type: "toggle" as const,
          value: theme === "dark",
          onToggle: () => toggleTheme(),
        },
        {
          id: "systemTheme",
          title: "Usar Tema do Sistema",
          icon: "phone-portrait-outline",
          type: "toggle" as const,
          value: useSystemTheme,
          onToggle: (value) => setUseSystemTheme(value),
        },
      ],
    },
    {
      title: "Notificações",
      items: [
        {
          id: "reminders",
          title: "Lembretes de Treino",
          icon: "fitness-outline",
          type: "toggle" as const,
          value: true,
          onToggle: (value) => console.log("Lembretes de treino:", value),
        },
        {
          id: "mealReminders",
          title: "Lembretes de Refeição",
          icon: "restaurant-outline",
          type: "toggle" as const,
          value: true,
          onToggle: (value) => console.log("Lembretes de refeição:", value),
        },
      ],
    },
    {
      title: "Conta",
      items: [
        {
          id: "editProfile",
          title: "Editar Perfil",
          icon: "person-outline",
          type: "action" as const,
          onPress: () => handleEditProfile(),
        },
        {
          id: "changePassword",
          title: "Alterar Senha",
          icon: "lock-closed-outline",
          type: "action" as const,
          onPress: () => handleChangePassword(),
        },
        {
          id: "privacy",
          title: "Privacidade",
          icon: "shield-outline",
          type: "action" as const,
          onPress: () => handlePrivacySettings(),
        },
      ],
    },
  ];

  // Função para atualizar dados ao puxar para atualizar
  const onRefresh = async () => {
    setRefreshing(true);
    // Implementar lógica para atualizar dados
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  // Funções para lidar com ações do usuário
  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Implementar navegação para edição de perfil
    console.log("Editar perfil");
  };

  const handleChangePhoto = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Implementar lógica para alterar foto
    console.log("Alterar foto");
  };

  const handleChangePassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Implementar lógica para alterar senha
    console.log("Alterar senha");
  };

  const handlePrivacySettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Implementar navegação para configurações de privacidade
    console.log("Configurações de privacidade");
  };

  const handleUpdateWeight = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Implementar lógica para atualizar peso
    console.log("Atualizar peso");
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sair da Conta", "Tem certeza que deseja sair da sua conta?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error("Erro ao fazer logout:", error);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Cabeçalho do Perfil */}
        <ProfileHeader
          user={{
            displayName: user?.displayName || "Usuário",
            photoURL: user?.photoURL,
            email: user?.email || "usuario@exemplo.com",
          }}
          stats={profileStats}
          onEditProfile={handleEditProfile}
          onChangePhoto={handleChangePhoto}
        />

        {/* Estatísticas Corporais */}
        <BodyStatsCard
          stats={bodyStats}
          weightHistory={weightHistory}
          targetWeight={70}
          onPressViewMore={() => {
            // Navegar para detalhes de estatísticas corporais
          }}
          onPressUpdateWeight={handleUpdateWeight}
        />

        {/* Metas Nutricionais */}
        <NutritionGoalsCard
          goals={nutritionGoals}
          onPressEditGoals={() => {
            // Navegar para edição de metas nutricionais
            router.push("/macros-details");
          }}
          onPressViewDetails={() => {
            // Navegar para detalhes de nutrição
            router.push("/(tabs)/nutrition");
          }}
        />

        {/* Estatísticas de Treino */}
        <TrainingStatsCard
          stats={trainingStats}
          weeklyVolume={weeklyVolume}
          onPressViewHistory={() => {
            // Navegar para histórico de treino
            router.push("/(tabs)/training");
          }}
        />

        {/* Configurações */}
        <SettingsCard
          sections={settingsSections}
          onPressLogout={handleLogout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
});
