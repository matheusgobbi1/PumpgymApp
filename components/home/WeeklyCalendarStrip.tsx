import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";

const { width } = Dimensions.get("window");
const DAY_WIDTH = 60;

interface DayData {
  date: Date;
  workouts: {
    name: string;
    color: string;
  }[];
  meals: {
    name: string;
    completed: boolean;
  }[];
  isToday: boolean;
  isSelected: boolean;
}

interface WeeklyCalendarStripProps {
  days: DayData[];
  onSelectDay: (date: Date) => void;
  onPressViewMonth: () => void;
}

export default function WeeklyCalendarStrip({
  days,
  onSelectDay,
  onPressViewMonth,
}: WeeklyCalendarStripProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Formatar dia da semana
  const formatWeekday = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
      .format(date)
      .slice(0, 3);
  };

  // Renderizar indicadores de treino
  const renderWorkoutIndicators = (
    workouts: { name: string; color: string }[]
  ) => {
    if (workouts.length === 0) return null;

    return (
      <View style={styles.indicatorsContainer}>
        {workouts.slice(0, 2).map((workout, index) => (
          <View
            key={`workout-${index}`}
            style={[
              styles.workoutIndicator,
              { backgroundColor: workout.color },
            ]}
          />
        ))}
        {workouts.length > 2 && (
          <View
            style={[
              styles.workoutIndicator,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Text style={[styles.indicatorText, { color: colors.light }]}>
              +{workouts.length - 2}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Renderizar indicadores de refeição
  const renderMealIndicators = (
    meals: { name: string; completed: boolean }[]
  ) => {
    if (meals.length === 0) return null;

    const completedMeals = meals.filter((meal) => meal.completed).length;
    const percentage = (completedMeals / meals.length) * 100;

    return (
      <View style={styles.mealProgressContainer}>
        <View
          style={[styles.mealProgressBar, { backgroundColor: colors.border }]}
        >
          <View
            style={[
              styles.mealProgressFill,
              {
                width: `${percentage}%`,
                backgroundColor:
                  percentage === 100
                    ? colors.success
                    : percentage > 50
                    ? colors.primary
                    : colors.warning,
              },
            ]}
          />
        </View>
        <Text style={[styles.mealProgressText, { color: colors.secondary }]}>
          {completedMeals}/{meals.length}
        </Text>
      </View>
    );
  };

  // Renderizar cada dia
  const renderDay = (day: DayData, index: number) => {
    const dayNumber = day.date.getDate();
    const month = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(
      day.date
    );

    return (
      <TouchableOpacity
        key={`day-${index}`}
        style={[
          styles.dayContainer,
          day.isSelected && {
            borderColor: colors.primary,
            backgroundColor: colors.primary + "10",
          },
        ]}
        onPress={() => onSelectDay(day.date)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.weekday,
            { color: day.isToday ? colors.primary : colors.secondary },
          ]}
        >
          {formatWeekday(day.date)}
        </Text>
        <View
          style={[
            styles.dateCircle,
            day.isToday && { backgroundColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.dateNumber,
              {
                color: day.isToday ? colors.light : colors.text,
              },
            ]}
          >
            {dayNumber}
          </Text>
        </View>
        {day.isToday && (
          <Text style={[styles.todayLabel, { color: colors.primary }]}>
            Hoje
          </Text>
        )}
        {renderWorkoutIndicators(day.workouts)}
        {renderMealIndicators(day.meals)}
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(400)}>
      <MotiView
        style={[
          styles.container,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 400 }}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Calendário Semanal
          </Text>
          <TouchableOpacity
            style={[styles.viewMonthButton, { borderColor: colors.border }]}
            onPress={onPressViewMonth}
          >
            <Text style={[styles.viewMonthText, { color: colors.primary }]}>
              Ver Mês
            </Text>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {days.map(renderDay)}
        </ScrollView>
      </MotiView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  viewMonthButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  viewMonthText: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  dayContainer: {
    width: DAY_WIDTH,
    marginHorizontal: 4,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    padding: 8,
  },
  weekday: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: "600",
  },
  todayLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
  },
  indicatorsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 4,
    height: 8,
  },
  workoutIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  indicatorText: {
    fontSize: 6,
    fontWeight: "bold",
  },
  mealProgressContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 6,
  },
  mealProgressBar: {
    width: "80%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  mealProgressFill: {
    height: "100%",
  },
  mealProgressText: {
    fontSize: 10,
    marginTop: 2,
  },
});
