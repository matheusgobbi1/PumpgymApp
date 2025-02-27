import React, { useCallback, useMemo } from "react";
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
import Colors from "../constants/Colors";
import { useColorScheme } from "react-native";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

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
        <BlurView intensity={10} style={styles.leftBlur} tint={colorScheme} />
        <BlurView intensity={10} style={styles.rightBlur} tint={colorScheme} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {dates.map((date, index) => {
            const isSelected = isSameDay(date, normalizedSelectedDate);
            const isToday = isSameDay(date, today);

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
    paddingBottom: 20,
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
    marginBottom: 8,
    textTransform: "lowercase",
  },
  leftBlur: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    zIndex: 1,
  },
  rightBlur: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    zIndex: 1,
  },
  dayButton: {
    alignItems: "center",
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
});
