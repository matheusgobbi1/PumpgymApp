import React, { useCallback, useMemo, useEffect, useState, useRef } from "react";
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
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useMeals } from "../../context/MealContext";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");
const DAYS_TO_SHOW = 30;
const DAY_ITEM_WIDTH = 48; // Largura do item de dia (40px) + marginHorizontal (4px * 2)

interface CalendarProps {
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
}

export default function Calendar({
  onSelectDate,
  selectedDate,
}: CalendarProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { meals } = useMeals();
  const scrollViewRef = useRef<ScrollView>(null);
  const initialScrollDone = useRef(false);
  
  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});

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

  // Função para centralizar uma data específica no ScrollView
  const scrollToDate = useCallback((date: Date) => {
    const dateIndex = dates.findIndex((d) => isSameDay(d, date));
    if (dateIndex !== -1 && scrollViewRef.current) {
      const xOffset = dateIndex * DAY_ITEM_WIDTH - (width / 2) + (DAY_ITEM_WIDTH / 2);
      scrollViewRef.current.scrollTo({ x: Math.max(0, xOffset), y: 0, animated: true });
    }
  }, [dates]);

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
      // Centraliza o dia selecionado
      scrollToDate(date);
    },
    [onSelectDate, scrollToDate]
  );

  // Zera o horário da data selecionada para comparação
  const normalizedSelectedDate = setMilliseconds(
    setSeconds(setMinutes(setHours(selectedDate, 0), 0), 0),
    0
  );

  // Centraliza o dia atual ou o dia selecionado na montagem inicial
  const initializeScroll = useCallback(() => {
    if (!initialScrollDone.current) {
      // Centraliza o dia atual ou o dia selecionado, dependendo do caso
      setTimeout(() => {
        scrollToDate(normalizedSelectedDate);
        initialScrollDone.current = true;
      }, 100);
    }
  }, [normalizedSelectedDate, scrollToDate]);

  // Efeito para inicializar a rolagem
  useEffect(() => {
    initializeScroll();
  }, [initializeScroll]);
  
  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    // Forçar re-renderização quando o tema mudar
    setForceUpdate({});
  }, [theme]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.calendarContainer, { backgroundColor: colors.background }]}>
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
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onLayout={initializeScroll}
          style={{ backgroundColor: colors.background }}
        >
          {dates.map((date) => {
            const isSelected = isSameDay(date, normalizedSelectedDate);
            const isToday = isSameDay(date, today);
            const hasMeals = hasRegisteredMeals(date);

            // Determinar a cor de fundo do dia atual com base no tema
            const todayBackgroundColor = theme === 'light' ? colors.light : '#333333';

            return (
              <View key={`${date.toISOString()}-${theme}`} style={[styles.dayColumn, { backgroundColor: colors.background }]}>
                <Text style={[styles.weekDayText, { color: colors.text }]}>
                  {format(date, "EEE", { locale: ptBR }).slice(0, 3)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDatePress(date)}
                  style={[styles.dayButton, { backgroundColor: colors.background }]}
                >
                  <MotiView
                    key={`day-${date.toISOString()}-${theme}`}
                    style={[
                      styles.dayContainer,
                      isSelected && {
                        backgroundColor: colors.primary,
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.25,
                        shadowRadius: 10,
                        elevation: 5,
                      },
                      !isSelected && isToday && {
                        backgroundColor: todayBackgroundColor,
                      },
                      !isSelected && !isToday && {
                        backgroundColor: "transparent",
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
