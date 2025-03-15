import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeHeader from "../../components/home/HomeHeader";
import WorkoutProgressChart from "../../components/home/WorkoutProgressChart";
import NutritionProgressChart from "../../components/home/NutritionProgressChart";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useRefresh } from "../../context/RefreshContext";

export default function HomeScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { refreshKey, triggerRefresh, isRefreshing } = useRefresh();

  const handleProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/profile");
  };

  const handleRefresh = async () => {
    if (isRefreshing) return; // Evitar múltiplos refreshes simultâneos

    setRefreshing(true);
    // Usar o triggerRefresh do contexto para atualizar todos os componentes
    triggerRefresh();
    // Simular carregamento de dados
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleNutritionChartPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navegar para a tela de nutrição
    router.push("/(tabs)/nutrition");
  };

  const handleWorkoutChartPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navegar para a tela de treino
    router.push("/(tabs)/training");
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HomeHeader onProfilePress={handleProfilePress} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Gráfico de Progresso de Calorias */}
          <NutritionProgressChart
            onPress={handleNutritionChartPress}
            refreshKey={refreshKey}
          />

          {/* Gráfico de Progresso de Treino */}
          <WorkoutProgressChart
            onPress={handleWorkoutChartPress}
            refreshKey={refreshKey}
          />

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
  },
  bottomPadding: {
    height: 80, // Altura suficiente para ficar acima da bottom tab
  },
});
