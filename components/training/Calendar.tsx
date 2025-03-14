import React, {
  useCallback,
  useMemo,
  useEffect,
  useState,
  useRef,
} from "react";
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
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");
const DAYS_TO_SHOW = 30;
const DAY_ITEM_WIDTH = 48; // Largura do item de dia (40px) + marginHorizontal (4px * 2)

interface CalendarProps {
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  workouts?: { [date: string]: any }; // Propriedade opcional para verificar se há treinos específicos
  weeklyTemplate?: { [dayOfWeek: number]: any }; // Propriedade opcional para verificar se há treinos no template semanal
  getWorkoutsForDate?: (date: string) => any; // Função para obter treinos para uma data
}

export default function Calendar({
  onSelectDate,
  selectedDate,
  workouts = {},
  weeklyTemplate = {},
  getWorkoutsForDate,
}: CalendarProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const scrollViewRef = useRef<ScrollView>(null);
  const initialScrollDone = useRef(false);

  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});

  // Inicializa as datas zerando o horário
  const today = setMilliseconds(
    setSeconds(setMinutes(setHours(new Date(), 0), 0), 0),
    0
  );
  const startDate = startOfWeek(today, { weekStartsOn: 0 });

  // Cores do gradiente baseadas no tema
  const gradientColors = useMemo(() => {
    if (theme === "light") {
      // No modo light, usamos cores muito sutis
      return {
        start: "rgba(250, 250, 250, 1)", // Quase branco
        middle: "rgba(250, 250, 250, 0.6)", // Com transparência
        end: "rgba(250, 250, 250, 0)", // Totalmente transparente
      };
    } else {
      // No modo dark, mantemos o comportamento original
      return {
        start: colors.background,
        middle: colors.background,
        end: "transparent",
      };
    }
  }, [theme, colors.background]);

  // Configurações do gradiente baseadas no tema
  const gradientConfig = useMemo(() => {
    if (theme === "light") {
      return {
        leftStart: { x: 0, y: 0.5 },
        leftEnd: { x: 1, y: 0.5 },
        rightStart: { x: 0, y: 0.5 },
        rightEnd: { x: 1, y: 0.5 },
      };
    } else {
      return {
        leftStart: { x: -0.1, y: 0.5 },
        leftEnd: { x: 1, y: 0.5 },
        rightStart: { x: 0, y: 0.5 },
        rightEnd: { x: 1.2, y: 0.5 },
      };
    }
  }, [theme]);

  // Estilos dinâmicos baseados no tema
  const dynamicStyles = useMemo(
    () => ({
      leftGradient: {
        position: "absolute" as const,
        left: 0,
        top: 0,
        bottom: 0,
        width: theme === "light" ? 80 : 60,
        zIndex: 1,
        opacity: theme === "light" ? 0.7 : 1, // Reduz a opacidade no modo light
      },
      rightGradient: {
        position: "absolute" as const,
        right: 0,
        top: 0,
        bottom: 0,
        width: theme === "light" ? 80 : 60,
        zIndex: 1,
        opacity: theme === "light" ? 0.7 : 1, // Reduz a opacidade no modo light
      },
      calendarContainer: {
        position: "relative" as const,
        width: "100%" as any,
        backgroundColor: "transparent" as const,
        ...(theme === "light" && {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.03,
          shadowRadius: 8,
          elevation: 1,
          borderRadius: 12,
          borderWidth: 0,
        }),
      },
      scrollView: {
        backgroundColor: "transparent" as const,
        ...(theme === "light" && {
          borderRadius: 12,
        }),
      },
      outerContainer: {
        overflow: "hidden" as const,
        ...(theme === "light" && {
          borderRadius: 12,
        }),
      },
    }),
    [theme]
  );

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
    [dates]
  );

  // Função para verificar se uma data tem treinos
  const checkHasWorkouts = useCallback(
    (date: Date) => {
      try {
        // Verificar treinos para a data usando getWorkoutsForDate
        if (getWorkoutsForDate) {
          const dateString = format(date, "yyyy-MM-dd");
          const workoutsForDate = getWorkoutsForDate(dateString);
          const hasWorkouts = Object.keys(workoutsForDate).length > 0;
          return hasWorkouts;
        }

        // Fallback para o método antigo se getWorkoutsForDate não estiver disponível
        // Verificar treinos específicos para a data
        const dateString = format(date, "yyyy-MM-dd");
        const hasSpecificWorkouts =
          workouts &&
          workouts[dateString] &&
          Object.keys(workouts[dateString]).length > 0;

        if (hasSpecificWorkouts) {
          return true;
        }

        // Verificar treinos no template semanal para o dia da semana
        const dayOfWeek = date.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
        const hasTemplateWorkouts =
          weeklyTemplate &&
          weeklyTemplate[dayOfWeek] &&
          Object.keys(weeklyTemplate[dayOfWeek]).length > 0;

        return hasTemplateWorkouts;
      } catch (error) {
        console.error("Erro ao verificar treinos para a data:", error);
        return false;
      }
    },
    [workouts, weeklyTemplate, getWorkoutsForDate]
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
    <View style={[styles.outerContainer, dynamicStyles.outerContainer]}>
      <View
        key={`calendar-container-${theme}`}
        style={[
          styles.container,
          {
            backgroundColor: "transparent",
          },
        ]}
      >
        <View
          style={[styles.calendarContainer, dynamicStyles.calendarContainer]}
        >
          {/* Gradiente esquerdo - cobre toda a altura */}
          <LinearGradient
            colors={[
              gradientColors.start,
              gradientColors.middle,
              gradientColors.end,
            ]}
            start={gradientConfig.leftStart}
            end={gradientConfig.leftEnd}
            style={dynamicStyles.leftGradient}
            pointerEvents="none"
          />

          {/* Gradiente direito - cobre toda a altura */}
          <LinearGradient
            colors={[
              gradientColors.end,
              gradientColors.middle,
              gradientColors.start,
            ]}
            start={gradientConfig.rightStart}
            end={gradientConfig.rightEnd}
            style={dynamicStyles.rightGradient}
            pointerEvents="none"
          />

          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onLayout={initializeScroll}
            style={dynamicStyles.scrollView}
          >
            {dates.map((date) => {
              const isSelected = isSameDay(date, normalizedSelectedDate);
              const isToday = isSameDay(date, today);
              const hasWorkouts = checkHasWorkouts(date);

              // Determinar a cor de fundo do dia atual com base no tema
              const todayBackgroundColor =
                theme === "light" ? colors.light : "#333333";

              return (
                <View
                  key={`${date.toISOString()}-${theme}`}
                  style={[styles.dayColumn, { backgroundColor: "transparent" }]}
                >
                  <Text style={[styles.weekDayText, { color: colors.text }]}>
                    {format(date, "EEE").slice(0, 3)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDatePress(date)}
                    style={[
                      styles.dayButton,
                      { backgroundColor: "transparent" },
                    ]}
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
                    {hasWorkouts && !isSelected && (
                      <View
                        style={[
                          styles.workoutIndicator,
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
  },
  container: {
    width: "100%",
  },
  calendarContainer: {
    position: "relative",
    width: "100%",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 5,
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
    width: 60,
    zIndex: 1,
  },
  rightGradient: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 60,
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
  workoutIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: "absolute",
    bottom: 10,
  },
});
