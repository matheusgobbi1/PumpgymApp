import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MotiView, AnimatePresence } from "moti";
import Colors from "../constants/Colors";
import { useColorScheme } from "react-native";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { useMeals } from "../context/MealContext";

const { width } = Dimensions.get("window");
const DAYS_TO_SHOW = 30; // Mostra 30 dias

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
  const today = new Date();
  const startDate = startOfWeek(today, { locale: ptBR });
  const { loadMeals, meals } = useMeals();
  const [markedDates, setMarkedDates] = useState<Date[]>([]);

  const dates = Array.from({ length: DAYS_TO_SHOW }, (_, i) =>
    addDays(startDate, i)
  );

  useEffect(() => {
    // Aqui você pode implementar a lógica para carregar as datas marcadas
    // Por enquanto, vamos apenas marcar os dias que têm refeições com alimentos
    const datesWithMeals = meals.some((meal) => meal.foods.length > 0)
      ? [selectedDate]
      : [];
    setMarkedDates(datesWithMeals);
  }, [meals, selectedDate]);

  const isDateMarked = (date: Date) =>
    markedDates.some((markedDate) => isSameDay(markedDate, date));

  const handleDatePress = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectDate(date);
    loadMeals(date);
  };

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
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, today);
            const isMarked = isDateMarked(date);

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
                    animate={{
                      scale: isSelected ? 1 : 0.95,
                      translateY: isSelected ? -8 : 0,
                    }}
                    transition={{
                      type: "spring",
                      damping: 15,
                      mass: 0.8,
                      stiffness: 120,
                    }}
                  >
                    <AnimatePresence>
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
                            backgroundColor: isToday
                              ? colors.light
                              : "transparent",
                          },
                        ]}
                        from={{
                          opacity: 0,
                          scale: 0.8,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                        }}
                        transition={{
                          type: "timing",
                          duration: 250,
                          delay: index * 50,
                        }}
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
                        {isMarked && (
                          <MotiView
                            from={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              type: "spring",
                              damping: 20,
                              delay: index * 50 + 100,
                            }}
                            style={[
                              styles.dot,
                              {
                                backgroundColor: isSelected
                                  ? "#FFF"
                                  : colors.success,
                              },
                            ]}
                          />
                        )}
                      </MotiView>
                    </AnimatePresence>
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
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
