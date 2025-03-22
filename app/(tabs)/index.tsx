import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Pressable,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import HomeHeader from "../../components/home/HomeHeader";
import DailyReminders from "../../components/home/DailyReminders";
import WorkoutProgressChart from "../../components/home/WorkoutProgressChart";
import NutritionProgressChart from "../../components/home/NutritionProgressChart";
import HealthStepsCard from "../../components/home/HealthStepsCard";
import WaterIntakeCard from "../../components/home/WaterIntakeCard";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useWorkoutContext } from "../../context/WorkoutContext";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

// Componentes memorizados para evitar renderizações desnecessárias
const MemoizedDailyReminders = React.memo(DailyReminders);
const MemoizedHealthStepsCard = React.memo(HealthStepsCard);
const MemoizedWaterIntakeCard = React.memo(WaterIntakeCard);

// Definir tipos para as props do componente memorizado
interface ProgressChartsProps {
  onWorkoutPress: () => void;
  onNutritionPress: () => void;
}

const MemoizedProgressCharts = React.memo(
  ({ onWorkoutPress, onNutritionPress }: ProgressChartsProps) => {
    return (
      <>
        <WorkoutProgressChart onPress={onWorkoutPress} />

        <NutritionProgressChart onPress={onNutritionPress} />
      </>
    );
  }
);

export default function HomeScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"lembretes" | "progresso">(
    "lembretes"
  );
  const [hasLoadedProgresso, setHasLoadedProgresso] = useState(false);
  const { workouts } = useWorkoutContext();
  const [streak, setStreak] = useState(0);

  // Calcular o streak de treinos
  useEffect(() => {
    if (!workouts) return;

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verificar se há treino hoje
    const todayFormatted = format(today, "yyyy-MM-dd");
    const hasTodayWorkout =
      workouts[todayFormatted] &&
      Object.keys(workouts[todayFormatted]).length > 0 &&
      Object.values(workouts[todayFormatted]).some(
        (exercises) => exercises.length > 0
      );

    // Se não houver treino hoje, verificar ontem
    if (!hasTodayWorkout) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayFormatted = format(yesterday, "yyyy-MM-dd");

      const hasYesterdayWorkout =
        workouts[yesterdayFormatted] &&
        Object.keys(workouts[yesterdayFormatted]).length > 0 &&
        Object.values(workouts[yesterdayFormatted]).some(
          (exercises) => exercises.length > 0
        );

      if (!hasYesterdayWorkout) {
        setStreak(0);
        return;
      }
    }

    // Contar dias consecutivos com treinos
    let checkDate = new Date(today);
    if (!hasTodayWorkout) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    let keepCounting = true;
    while (keepCounting) {
      const dateFormatted = format(checkDate, "yyyy-MM-dd");

      const hasWorkoutOnDate =
        workouts[dateFormatted] &&
        Object.keys(workouts[dateFormatted]).length > 0 &&
        Object.values(workouts[dateFormatted]).some(
          (exercises) => exercises.length > 0
        );

      if (hasWorkoutOnDate) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        keepCounting = false;
      }
    }

    setStreak(currentStreak);
  }, [workouts]);

  // Quando a aba progresso for selecionada pela primeira vez, marcamos como carregada
  useEffect(() => {
    if (activeTab === "progresso" && !hasLoadedProgresso) {
      setHasLoadedProgresso(true);
    }
  }, [activeTab]);

  const handleProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/profile");
  };

  const handleNutritionChartPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navegar para a tela de nutrição
    router.push("/(tabs)/nutrition");
  }, [router]);

  const handleWorkoutChartPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navegar para a tela de treino
    router.push("/(tabs)/training");
  }, [router]);

  const handleTabChange = (tab: "lembretes" | "progresso") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HomeHeader
          onProfilePress={handleProfilePress}
          count={streak}
          iconName="flame-outline"
          iconColor={colors.warning}
        />

        {/* Seletor de abas */}
        <View style={styles.tabContainer}>
          <Pressable
            onPress={() => handleTabChange("lembretes")}
            style={[
              styles.tabButton,
              activeTab === "lembretes" && [
                styles.activeTabButton,
                { borderBottomColor: colors.primary },
              ],
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: colors.text + (activeTab === "lembretes" ? "" : "80"),
                },
                activeTab === "lembretes" && {
                  color: colors.primary,
                  fontWeight: "600",
                },
              ]}
            >
              {t("home.reminders")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabChange("progresso")}
            style={[
              styles.tabButton,
              activeTab === "progresso" && [
                styles.activeTabButton,
                { borderBottomColor: colors.primary },
              ],
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: colors.text + (activeTab === "progresso" ? "" : "80"),
                },
                activeTab === "progresso" && {
                  color: colors.primary,
                  fontWeight: "600",
                },
              ]}
            >
              {t("home.progress")}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "lembretes" ? (
            <>
              <MemoizedDailyReminders />

              {/* Área em grid para os cards */}
              <View style={styles.gridContainer}>
                {/* Card de passos (esquerda) */}
                <MemoizedHealthStepsCard />

                {/* Card de consumo de água (direita) */}
                <MemoizedWaterIntakeCard />
              </View>
            </>
          ) : (
            <>
              {/* Só renderiza os componentes de progresso quando a aba for acessada pelo menos uma vez */}
              {hasLoadedProgresso && (
                <MemoizedProgressCharts
                  onWorkoutPress={handleWorkoutChartPress}
                  onNutritionPress={handleNutritionChartPress}
                />
              )}
            </>
          )}

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
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
  },
  tabContent: {
    width: "100%",
  },
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  placeholderCard: {
    width: (width - 48) / 2, // Metade da largura da tela menos o padding
    height: (width - 48) / 2,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
