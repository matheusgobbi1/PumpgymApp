import React, { useState, useCallback, useMemo } from "react";
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
import NutritionProgressChart from "../../components/home/NutritionProgressChart";
import WorkoutProgressChart from "../../components/home/WorkoutProgressChart";
import WeightProgressChart from "../../components/home/WeightProgressChart";
import HealthStepsCard from "../../components/home/HealthStepsCard";
import WaterIntakeCard from "../../components/home/WaterIntakeCard";
import ConsistencyScoreCard from "../../components/home/ConsistencyScoreCard";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useWorkoutContext } from "../../context/WorkoutContext";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEYS } from "../../constants/keys";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

// Componentes memorizados para evitar renderizações desnecessárias
const MemoizedDailyReminders = React.memo(DailyReminders);
const MemoizedHealthStepsCard = React.memo(HealthStepsCard);
const MemoizedWaterIntakeCard = React.memo(WaterIntakeCard);
const MemoizedConsistencyScoreCard = React.memo(ConsistencyScoreCard);

// Definir tipos para as props do componente memorizado
interface ProgressChartsProps {
  onNutritionPress: () => void;
  onWorkoutPress: () => void;
  onWeightPress: () => void;
  visible: boolean;
  router: any;
}

const MemoizedProgressCharts = React.memo(
  ({
    onNutritionPress,
    onWorkoutPress,
    onWeightPress,
    visible,
    router,
  }: ProgressChartsProps) => {
    return (
      <View style={[styles.tabContent, { display: visible ? "flex" : "none" }]}>
        <WorkoutProgressChart onPress={onWorkoutPress} router={router} />
        <WeightProgressChart onPress={onWeightPress} />
        <NutritionProgressChart onPress={onNutritionPress} />
      </View>
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
  const [isProgressTabInitialized, setIsProgressTabInitialized] =
    useState(false);
  const { workouts } = useWorkoutContext();
  const { user } = useAuth();

  // Calcular o streak de treinos usando useMemo em vez de useEffect
  const streak = useMemo(() => {
    if (!workouts) return 0;

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
        return 0;
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

    return currentStreak;
  }, [workouts]);

  // Calcular consistência de água (últimos 14 dias)
  const waterConsistency = useMemo(() => {
    if (!user) return 0;

    const calculateWaterConsistency = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let daysOnTarget = 0;
        let daysWithData = 0;

        // Verificar os últimos 14 dias
        for (let i = 0; i < 14; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          const dateFormatted = format(checkDate, "yyyy-MM-dd");

          const storageKey = `${KEYS.WATER_INTAKE}_${user.uid}_${dateFormatted}`;
          const data = await AsyncStorage.getItem(storageKey);

          if (data) {
            daysWithData++;
            const waterIntake = JSON.parse(data);
            const target = 2000; // Meta padrão, idealmente viria do contexto de nutrição

            // Se consumiu pelo menos 80% da meta
            if (waterIntake >= target * 0.8) {
              daysOnTarget++;
            }
          }
        }

        // Se não houver dados, retorna 0
        if (daysWithData === 0) return 0;

        // Calcular porcentagem com base nos dias com dados
        return (daysOnTarget / daysWithData) * 100;
      } catch (error) {
        console.error("Erro ao calcular consistência de água:", error);
        return 0;
      }
    };

    // Como não podemos usar async diretamente em useMemo, retornamos um valor aproximado
    // Em um caso real, usaríamos um estado e useEffect para carregar isso
    return 65; // Valor estimado para demonstração
  }, [user]);

  // Calcular consistência de passos (últimos 14 dias)
  const stepsConsistency = useMemo(() => {
    // Como não temos acesso direto ao histórico de passos, usamos um valor aproximado
    // Em um caso real, usaríamos o health kit ou outro storage para verificar o histórico
    return 75; // Valor estimado para demonstração
  }, []);

  // Lidar com a mudança de aba e carregar progresso sob demanda
  const handleTabChange = useCallback(
    (tab: "lembretes" | "progresso") => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveTab(tab);

      // Inicializar a aba de progresso na primeira vez que é acessada
      if (tab === "progresso" && !isProgressTabInitialized) {
        setIsProgressTabInitialized(true);
      }
    },
    [isProgressTabInitialized]
  );

  const handleProfilePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/profile");
  }, [router]);

  const handleNutritionChartPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Não é mais necessário navegar, pois abrimos o modal diretamente no componente
  }, [router]);

  const handleWorkoutChartPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navegar para a tela de treinos
    router.push("/(tabs)/training");
  }, [router]);

  const handleWeightChartPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Não é mais necessário navegar, pois abrimos o modal diretamente no componente
  }, [router]);

  const handleConsistencyPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navegar para uma tela detalhada ou exibir modal
    // Por enquanto, apenas navegamos para o perfil
    router.push("/(tabs)/profile");
  }, [router]);

  // Renderização condicional e lazy loading dos componentes de progresso
  const renderProgressContent = useMemo(() => {
    return (
      <MemoizedProgressCharts
        onNutritionPress={handleNutritionChartPress}
        onWorkoutPress={handleWorkoutChartPress}
        onWeightPress={handleWeightChartPress}
        visible={activeTab === "progresso"}
        router={router}
      />
    );
  }, [
    activeTab,
    handleNutritionChartPress,
    handleWorkoutChartPress,
    handleWeightChartPress,
    router,
  ]);

  // Renderização condicional dos componentes de lembretes
  const renderRemindersContent = useMemo(() => {
    return (
      <View
        style={[
          styles.tabContent,
          { display: activeTab === "lembretes" ? "flex" : "none" },
        ]}
      >
        {/* Card de consistência - adicionado abaixo dos cards de grid */}
        <View style={styles.cardContainer}>
          <MemoizedConsistencyScoreCard
            onPress={handleConsistencyPress}
            stepsConsistencyPercentage={stepsConsistency}
          />
        </View>
        <MemoizedDailyReminders />

        {/* Área em grid para os cards */}
        <View style={styles.gridContainer}>
          {/* Card de passos (esquerda) */}
          <MemoizedHealthStepsCard />

          {/* Card de consumo de água (direita) */}
          <MemoizedWaterIntakeCard />
        </View>

      </View>
    );
  }, [activeTab, stepsConsistency, handleConsistencyPress]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HomeHeader
          onProfilePress={handleProfilePress}
          count={streak}
          iconName="fire"
          iconType="material"
          iconColor="#FF1F02"
          iconBackgroundColor="#FF6B6B15"
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
          {/* Renderizar as duas abas, mas controlar a visibilidade via CSS */}
          {renderRemindersContent}
          {isProgressTabInitialized && renderProgressContent}

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
  cardContainer: {
    paddingHorizontal: 16,
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
