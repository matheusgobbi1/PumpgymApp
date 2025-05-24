import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Pressable,
  Dimensions,
  InteractionManager,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { useWorkoutContext } from "../../context/WorkoutContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEYS } from "../../constants/keys";
import { useAuth } from "../../context/AuthContext";
import HomeHeader from "../../components/home/HomeHeader";
import ScreenTopGradient from "../../components/shared/ScreenTopGradient";

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

// Definir um tipo para as cores do tema
type ThemeColors = typeof Colors.light; // Ou typeof Colors.dark, a estrutura é a mesma

export default function HomeScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme] as ThemeColors;
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { workouts } = useWorkoutContext();
  const insets = useSafeAreaInsets();
  const headerTabsWrapperRef = useRef<View>(null);
  const [headerTabsHeight, setHeaderTabsHeight] = useState(0);

  const [isUIReady, setIsUIReady] = useState(false);
  const [activeTab, setActiveTab] = useState<"lembretes" | "progresso">(
    "lembretes"
  );
  const [isProgressTabInitialized, setIsProgressTabInitialized] =
    useState(false);
  const [currentSteps, setCurrentSteps] = useState<number | null>(null);

  // Inicializar a UI após a renderização inicial
  useEffect(() => {
    if (isUIReady) return;

    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        setIsUIReady(true);
      }, 100);
    });
  }, [isUIReady]);

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

  // Atualizar o streak no context de conquistas quando for calculado
  useEffect(() => {
    if (streak > 0) {
      // updateAchievementProgress("streak_days", streak);
    }
  }, [streak]);

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

  // Verificar conquistas quando a tela é carregada
  useEffect(() => {
    if (isUIReady) {
      // Pequeno delay para evitar congestionamento na inicialização
      const timer = setTimeout(() => {
        // checkAchievements();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isUIReady]);

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

  const handleNutritionChartPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Não é mais necessário navegar, pois abrimos o modal diretamente no componente
  }, []);

  const handleWorkoutChartPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navegar para a tela de treinos
    router.push("/(tabs)/training");
  }, [router]);

  const handleWeightChartPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Não é mais necessário navegar, pois abrimos o modal diretamente no componente
  }, []);

  const handleAchievementsPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navegar para a tela de conquistas
    router.push("/achievements-modal");
  }, [router]);

  const handleFitLevelPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/achievements-modal");
  }, [router]);

  // Renderização condicional e lazy loading dos componentes de progresso
  const renderProgressContent = useMemo(() => {
    if (!isUIReady) return null;

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
    isUIReady,
    isProgressTabInitialized,
  ]);

  // Renderização condicional dos componentes de lembretes
  const renderRemindersContent = useMemo(() => {
    if (!isUIReady) return null;

    return (
      <View
        style={[
          styles.tabContent,
          { display: activeTab === "lembretes" ? "flex" : "none" },
        ]}
      >
        {/* Cartão de consistência - substitui o AchievementsCard */}
        <View style={styles.cardContainer}>
          <MemoizedConsistencyScoreCard steps={currentSteps} />
        </View>
        <MemoizedDailyReminders />

        {/* Área em grid para os cards */}
        <View style={styles.gridContainer}>
          {/* Card de passos (esquerda) */}
          <MemoizedHealthStepsCard onStepsUpdate={setCurrentSteps} />

          {/* Card de consumo de água (direita) */}
          <MemoizedWaterIntakeCard />
        </View>
      </View>
    );
  }, [activeTab, isUIReady, currentSteps]);

  // Função para medir a altura do header + tabs
  const handleHeaderTabsLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== headerTabsHeight) {
      setHeaderTabsHeight(height);
    }
  };

  const scrollViewPaddingTop =
    headerTabsHeight > 0 ? headerTabsHeight + 5 : insets.top + 100; // Fallback inicial

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenTopGradient />
      <View
        ref={headerTabsWrapperRef}
        style={styles.headerTabsWrapper}
        onLayout={handleHeaderTabsLayout}
      >
        <View style={styles.headerWrapper}>
          <HomeHeader title={t("home.title")} />
        </View>
        <View
          style={[
            styles.tabsPositioner,
            { backgroundColor: `${colors.background}F0` },
          ]}
        >
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
                    color:
                      colors.text + (activeTab === "lembretes" ? "" : "80"),
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
                    color:
                      colors.text + (activeTab === "progresso" ? "" : "80"),
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
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: scrollViewPaddingTop }, // Usar padding dinâmico
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16} // Opcional: melhora performance de scroll events se for usar depois
      >
        {renderRemindersContent}
        {isProgressTabInitialized && renderProgressContent}
        {/* Adicionar padding inferior para a tab flutuante */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTabsWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerWrapper: {
    // O HomeHeader já tem seu próprio background e padding
  },
  tabsPositioner: {
    left: 0,
    right: 0,
  },
  tabContainer: {
    flexDirection: "row",
    marginTop: -10,
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
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
    marginBottom: 8,
  },
  bottomPadding: {
    height: 80, // Altura igual à das outras telas
  },
});
