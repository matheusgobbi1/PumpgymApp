import React, { useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Platform,
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
  subDays,
} from "date-fns";
import { MotiView } from "moti";
import Colors from "../../constants/Colors";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");
const DAYS_TO_SHOW = 35; // 30 dias antes + dia atual + 3 dias depois
const DAY_ITEM_WIDTH = 48.5; // Largura do item de dia (40px) + marginHorizontal (4px * 2)

interface CalendarProps {
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  // Função genérica para verificar se uma data tem conteúdo
  hasContent?: (date: Date) => boolean;
  // Props específicas (opcionais, para compatibilidade com código existente)
  workouts?: { [date: string]: any };
  weeklyTemplate?: { [dayOfWeek: number]: any };
  meals?: { [date: string]: any };
  getWorkoutsForDate?: (date: string) => any;
}

export default function Calendar({
  onSelectDate,
  selectedDate,
  hasContent,
  workouts = {},
  weeklyTemplate = {},
  meals = {},
  getWorkoutsForDate,
}: CalendarProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const scrollViewRef = useRef<ScrollView>(null);
  const initialScrollDone = useRef(false);

  // Inicializa as datas zerando o horário
  const today = useMemo(() => {
    return setMilliseconds(
      setSeconds(setMinutes(setHours(new Date(), 0), 0), 0),
      0
    );
  }, []);

  const startDate = useMemo(() => {
    // Começa 30 dias antes do dia atual
    return subDays(today, 30);
  }, [today]);

  // Cores do gradiente baseadas no tema
  const gradientColors = useMemo(() => {
    if (theme === "light") {
      return {
        start: colors.background,
        middle: `${colors.background}F0`, // 94% opacidade
        end: `${colors.background}00`, // 0% opacidade
      };
    } else {
      // No modo escuro, criamos um gradiente mais suave
      const bgColor = colors.background;
      return {
        start: bgColor,
        middle: `${bgColor}F0`, // 94% opacidade
        end: `${bgColor}00`, // 0% opacidade
      };
    }
  }, [theme, colors.background]);

  // Configurações do gradiente
  const gradientConfig = {
    leftStart: { x: 0, y: 0.5 },
    leftEnd: { x: 0.4, y: 0.5 },
    rightStart: { x: 0.7, y: 0.5 },
    rightEnd: { x: 1, y: 0.5 },
  };

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
  const scrollToDate = useCallback(
    (date: Date) => {
      const dateIndex = dates.findIndex((d) => isSameDay(d, date));
      if (dateIndex !== -1 && scrollViewRef.current) {
        const xOffset =
          dateIndex * DAY_ITEM_WIDTH - width / 2 + DAY_ITEM_WIDTH / 2;
        scrollViewRef.current.scrollTo({
          x: Math.max(0, xOffset),
          y: 0,
          animated: true,
        });
      }
    },
    [dates, width]
  );

  // Função para verificar se uma data tem conteúdo
  const checkHasContent = useCallback(
    (date: Date): boolean => {
      // Se a função hasContent for fornecida, usá-la
      if (hasContent) {
        return hasContent(date);
      }

      try {
        // Verificar treinos para a data usando getWorkoutsForDate
        const dateString = format(date, "yyyy-MM-dd");
        
        // Verificar refeições para a data (compatibilidade com tela de nutrição)
        if (meals && Object.keys(meals).length > 0) {
          // Verifica se existe a data no objeto meals e se há foods nela
          if (
            meals[dateString] && 
            Object.values(meals[dateString]).some(
              (foods: any) => Array.isArray(foods) && foods.length > 0
            )
          ) {
            return true;
          }
        }
        
        // Verificar treinos se não encontrou refeições
        const workoutsForDate = getWorkoutsForDate
          ? getWorkoutsForDate(dateString)
          : {};
        const hasWorkouts = workoutsForDate && Object.keys(workoutsForDate).length > 0;

        return hasWorkouts;
      } catch (error) {
        console.error("Erro ao verificar conteúdo para a data:", error);
        return false;
      }
    },
    [hasContent, getWorkoutsForDate, meals]
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
  const normalizedSelectedDate = useMemo(() => {
    return setMilliseconds(
      setSeconds(setMinutes(setHours(selectedDate, 0), 0), 0),
      0
    );
  }, [selectedDate]);

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

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <View style={styles.calendarContainer}>
          {/* Gradiente esquerdo - cobre toda a altura */}
          <View
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 150,
              zIndex: 1,
            }}
            pointerEvents="none"
          >
            <LinearGradient
              colors={[
                gradientColors.start,
                gradientColors.middle,
                gradientColors.end,
              ]}
              start={gradientConfig.leftStart}
              end={gradientConfig.leftEnd}
              style={{ width: "100%", height: "100%" }}
              pointerEvents="none"
            />
          </View>

          {/* Gradiente direito - cobre toda a altura */}
          <View
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 150,
              zIndex: 1,
            }}
            pointerEvents="none"
          >
            <LinearGradient
              colors={[
                gradientColors.end,
                gradientColors.middle,
                gradientColors.start,
              ]}
              start={gradientConfig.rightStart}
              end={gradientConfig.rightEnd}
              style={{ width: "100%", height: "100%" }}
              pointerEvents="none"
            />
          </View>

          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onLayout={initializeScroll}
            style={styles.scrollView}
            removeClippedSubviews={true}
          >
            {dates.map((date) => {
              const isSelected = isSameDay(date, normalizedSelectedDate);
              const isToday = isSameDay(date, today);
              const hasContentForDate = checkHasContent(date);

              // Determinar a cor de fundo do dia atual com base no tema
              const todayBackgroundColor =
                theme === "light" ? colors.light : "#333333";

              return (
                <View
                  key={`date-${date.toISOString()}`}
                  style={styles.dayColumn}
                >
                  <Text style={[styles.weekDayText, { color: colors.text }]}>
                    {format(date, "EEE").slice(0, 3)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDatePress(date)}
                    style={styles.dayButton}
                    activeOpacity={0.7}
                  >
                    <MotiView
                      style={[
                        styles.dayContainer,
                        isSelected && {
                          backgroundColor: colors.secondary,
                          
                        },
                        !isSelected &&
                          isToday && {
                            backgroundColor: todayBackgroundColor,
                          },
                        !isSelected &&
                          !isToday && {
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
                    {hasContentForDate && !isSelected && (
                      <View
                        style={[
                          styles.contentIndicator,
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
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  container: {
    width: "100%",
    backgroundColor: "transparent",
  },
  calendarContainer: {
    position: "relative",
    width: "100%",
    backgroundColor: "transparent",
  },
  scrollView: {
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  dayColumn: {
    alignItems: "center",
    marginHorizontal: 4,
    backgroundColor: "transparent",
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.5,
    textTransform: "lowercase",
  },
  dayButton: {
    alignItems: "center",
    paddingBottom: 8,
    backgroundColor: "transparent",
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
  contentIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: "absolute",
    bottom: 10,
  },
});
