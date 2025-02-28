import React, { useCallback, useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { MotiView } from "moti";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useMeals } from "../../context/MealContext";

const { width } = Dimensions.get("window");
const DAYS_TO_SHOW = 30;

interface CalendarProps {
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
}

export default function Calendar({
  onSelectDate,
  selectedDate,
}: CalendarProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { meals } = useMeals();

  // Inicializa as datas zerando o horário
  const today = setMilliseconds(
    setSeconds(setMinutes(setHours(new Date(), 0), 0), 0),
    0
  );
  const startDate = startOfWeek(today, { locale: ptBR });

  // Gera as datas do calendário
  const dates = useMemo(() => {
    return Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
      const date = addDays(startDate, i);
      // Zera o horário para evitar problemas de timezone
      return setMilliseconds(
        setSeconds(setMinutes(setHours(date, 0), 0), 0),
        0
      );
    });
  }, [startDate]);

  // Verifica se uma data tem refeições registradas
  const hasRegisteredMeals = useCallback(
    (date: Date) => {
      const dateString = format(date, "yyyy-MM-dd");
      return (
        meals[dateString] &&
        Object.values(meals[dateString]).some((foods) => foods.length > 0)
      );
    },
    [meals]
  );

  const handleDatePress = useCallback(
    (date: Date) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelectDate(date);
    },
    [onSelectDate]
  );

  // Zera o horário da data selecionada para comparação
  const normalizedSelectedDate = setMilliseconds(
    setSeconds(setMinutes(setHours(selectedDate, 0), 0), 0),
    0
  );

  return (
    <View style={styles.container}>
      <View style={styles.calendarContainer}>
        <LinearGradient
          colors={[colors.background, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.leftGradient}
        />
        <LinearGradient
          colors={["transparent", colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rightGradient}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {dates.map((date) => {
            const isSelected = isSameDay(date, normalizedSelectedDate);
            const isToday = isSameDay(date, today);
            const hasMeals = hasRegisteredMeals(date);

            return (
              <View key={date.toISOString()} style={styles.dayColumn}>
                <Text style={[styles.weekDayText, { color: colors.text }]}>
                  {format(date, "EEE", { locale: ptBR }).slice(0, 3)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDatePress(date)}
                  style={styles.dayButton}
                >
                  <MotiView
                    style={[
                      styles.dayContainer,
                      isSelected && {
                        backgroundColor: colors.primary,
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.35,
                        shadowRadius: 10,
                        elevation: 8,
                      },
                      !isSelected && {
                        backgroundColor: isToday ? colors.light : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: isSelected ? "#FFF" : colors.text,
                          opacity: isSelected ? 1 : isToday ? 1 : 0.7,
                        },
                      ]}
                    >
                      {format(date, "d")}
                    </Text>
                  </MotiView>
                  {hasMeals && !isSelected && (
                    <View
                      style={[
                        styles.mealIndicator,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
  },
  calendarContainer: {
    position: "relative",
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  dayColumn: {
    alignItems: "center",
    marginHorizontal: 4,
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.5,
    textTransform: "lowercase",
  },
  leftGradient: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 50,
    zIndex: 1,
  },
  rightGradient: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 50,
    zIndex: 1,
  },
  dayButton: {
    alignItems: "center",
    paddingBottom: 8,
  },
  dayContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 17,
    fontWeight: "600",
  },
  mealIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: "absolute",
    bottom: 10,
  },
});
