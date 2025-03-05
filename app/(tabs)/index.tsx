import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import Colors from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import DailyOverviewCard from "../../components/home/DailyOverviewCard";
import WeeklyCalendarStrip from "../../components/home/WeeklyCalendarStrip";
import QuickActionsCard from "../../components/home/QuickActionsCard";
import ProgressSummaryCard from "../../components/home/ProgressSummaryCard";
import RecentActivityCard from "../../components/home/RecentActivityCard";
import { useMeals } from "../../context/MealContext";
import { useWorkouts } from "../../context/WorkoutContext";
import * as Haptics from "expo-haptics";

// Definir interfaces para os tipos de dados
interface Food {
  id: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Exercise {
  id: string;
  sets: Array<{
    weight: number;
    reps: number;
  }>;
}

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { signOut, user } = useAuth();
  const { meals } = useMeals();
  const { workouts } = useWorkouts();

  // Dados de exemplo para alimentos e exercícios
  const [foods, setFoods] = useState<Food[]>([
    { id: "1", calories: 350, protein: 25, carbs: 30, fat: 12 },
    { id: "2", calories: 450, protein: 35, carbs: 40, fat: 15 },
  ]);

  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: "1",
      sets: [
        { weight: 60, reps: 12 },
        { weight: 65, reps: 10 },
        { weight: 70, reps: 8 },
      ],
    },
    {
      id: "2",
      sets: [
        { weight: 20, reps: 15 },
        { weight: 22.5, reps: 12 },
        { weight: 25, reps: 10 },
      ],
    },
  ]);

  const [nutritionInfo, setNutritionInfo] = useState({
    calories: 2500,
    protein: 150,
    carbs: 300,
    fat: 80,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Dados de exemplo para o calendário semanal
  const generateWeekDays = () => {
    const today = new Date();
    const days = [];

    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Dados de exemplo para treinos
      const workoutsForDay =
        i === 0
          ? [{ name: "Peito e Tríceps", color: "#1c9abe" }]
          : i === 1
          ? [{ name: "Pernas", color: "#4BB543" }]
          : i === -1
          ? [{ name: "Costas e Bíceps", color: "#FFC107" }]
          : [];

      // Dados de exemplo para refeições
      const mealsForDay =
        i === 0
          ? [
              { name: "Café da Manhã", completed: true },
              { name: "Almoço", completed: true },
              { name: "Lanche", completed: false },
              { name: "Jantar", completed: false },
            ]
          : i === -1
          ? [
              { name: "Café da Manhã", completed: true },
              { name: "Almoço", completed: true },
              { name: "Lanche", completed: true },
              { name: "Jantar", completed: true },
            ]
          : i === 1
          ? [
              { name: "Café da Manhã", completed: false },
              { name: "Almoço", completed: false },
              { name: "Lanche", completed: false },
              { name: "Jantar", completed: false },
            ]
          : [];

      days.push({
        date,
        workouts: workoutsForDay,
        meals: mealsForDay,
        isToday: i === 0,
        isSelected: i === 0,
      });
    }

    return days;
  };

  // Dados de exemplo para ações rápidas
  const quickActions = [
    {
      id: "1",
      title: "Adicionar Refeição",
      icon: "nutrition-outline",
      color: "#1c9abe",
      secondaryColor: "#00BFFF",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push("/(tabs)/nutrition");
      },
    },
    {
      id: "2",
      title: "Registrar Treino",
      icon: "barbell-outline",
      color: "#4BB543",
      secondaryColor: "#6FD869",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push("/(tabs)/training");
      },
    },
    {
      id: "3",
      title: "Registrar Peso",
      icon: "scale-outline",
      color: "#FFC107",
      secondaryColor: "#FFD54F",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Implementar navegação para tela de registro de peso
      },
    },
    {
      id: "4",
      title: "Adicionar Água",
      icon: "water-outline",
      color: "#0096FF",
      secondaryColor: "#00BFFF",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Implementar navegação para tela de registro de água
      },
    },
    {
      id: "5",
      title: "Definir Meta",
      icon: "flag-outline",
      color: "#FF5722",
      secondaryColor: "#FF7043",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Implementar navegação para tela de metas
      },
    },
    {
      id: "6",
      title: "Ver Progresso",
      icon: "trending-up-outline",
      color: "#9C27B0",
      secondaryColor: "#BA68C8",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Implementar navegação para tela de progresso
      },
    },
  ];

  // Dados de exemplo para o gráfico de progresso
  const progressData = {
    labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    datasets: [
      {
        data: [2100, 2300, 1950, 2200, 2400, 2000, 2150],
        color: (opacity = 1) => `rgba(28, 154, 190, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  // Dados de exemplo para atividades recentes
  const recentActivities = [
    {
      id: "1",
      type: "workout" as const,
      title: "Treino Concluído",
      description: "Peito e Tríceps - 8 exercícios, 24 séries",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
      icon: "barbell-outline",
      color: "#4BB543",
      onPress: () => {
        // Navegar para detalhes do treino
      },
    },
    {
      id: "2",
      type: "meal" as const,
      title: "Refeição Registrada",
      description: "Almoço - 650 kcal, 45g proteína",
      timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 horas atrás
      icon: "restaurant-outline",
      color: "#1c9abe",
      onPress: () => {
        // Navegar para detalhes da refeição
      },
    },
    {
      id: "3",
      type: "weight" as const,
      title: "Peso Atualizado",
      description: "78.5 kg (-0.5 kg esta semana)",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 horas atrás
      icon: "scale-outline",
      color: "#FFC107",
      onPress: () => {
        // Navegar para histórico de peso
      },
    },
    {
      id: "4",
      type: "goal" as const,
      title: "Meta Alcançada",
      description: "Treinou 4 dias consecutivos",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
      icon: "trophy-outline",
      color: "#FF5722",
      onPress: () => {
        // Navegar para metas
      },
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

  // Função para lidar com a seleção de data no calendário
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Implementar lógica para carregar dados da data selecionada
  };

  // Função para lidar com o logout
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  // Calcular totais diários de nutrição
  const calculateDayTotals = () => {
    // Em uma implementação real, você filtraria os alimentos pela data selecionada
    const totalCalories = foods.reduce(
      (sum: number, food: Food) => sum + food.calories,
      0
    );
    const totalProtein = foods.reduce(
      (sum: number, food: Food) => sum + food.protein,
      0
    );
    const totalCarbs = foods.reduce(
      (sum: number, food: Food) => sum + food.carbs,
      0
    );
    const totalFat = foods.reduce(
      (sum: number, food: Food) => sum + food.fat,
      0
    );

    return {
      calories: {
        consumed: totalCalories,
        target: nutritionInfo?.calories || 2500,
      },
      protein: {
        consumed: totalProtein,
        target: nutritionInfo?.protein || 150,
      },
      completedMeals: 2,
      totalMeals: 4,
    };
  };

  // Calcular totais diários de treino
  const calculateTrainingTotals = () => {
    // Em uma implementação real, você filtraria os exercícios pela data selecionada
    const totalSets = exercises.reduce(
      (sum: number, exercise: Exercise) => sum + exercise.sets.length,
      0
    );
    const totalVolume = exercises.reduce((sum: number, exercise: Exercise) => {
      return (
        sum +
        exercise.sets.reduce(
          (setSum: number, set) => setSum + set.weight * set.reps,
          0
        )
      );
    }, 0);

    return {
      completedWorkouts: 1,
      totalWorkouts: 1,
      totalVolume: totalVolume,
      totalDuration: 65, // em minutos
    };
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Cabeçalho */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Olá, {user?.displayName || "Atleta"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            Vamos acompanhar seu progresso
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.profileButton,
            { backgroundColor: colors.primary + "20" },
          ]}
          onPress={() => {
            // Navegar para perfil
          }}
        >
          <Ionicons name="person-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

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
        {/* Resumo Diário */}
        <DailyOverviewCard
          date={selectedDate}
          nutritionSummary={calculateDayTotals()}
          trainingSummary={calculateTrainingTotals()}
          onPressNutrition={() => router.push("/(tabs)/nutrition")}
          onPressTraining={() => router.push("/(tabs)/training")}
        />

        {/* Calendário Semanal */}
        <WeeklyCalendarStrip
          days={generateWeekDays()}
          onSelectDay={handleDateSelect}
          onPressViewMonth={() => {
            // Navegar para visualização de mês
          }}
        />

        {/* Ações Rápidas */}
        <QuickActionsCard actions={quickActions} />

        {/* Resumo de Progresso - Calorias */}
        <ProgressSummaryCard
          title="Consumo Calórico"
          subtitle="Últimos 7 dias"
          data={progressData}
          metricName="Média Diária"
          metricUnit="kcal"
          currentValue={2150}
          changePercentage={5}
          onPressViewMore={() => {
            // Navegar para detalhes de calorias
          }}
        />

        {/* Atividades Recentes */}
        <RecentActivityCard
          activities={recentActivities}
          onPressViewAll={() => {
            // Navegar para todas as atividades
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingVertical: 8,
  },
});
