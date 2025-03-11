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
import { MotiView, useAnimationState } from "moti";
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

  // Estado de animação para o efeito de pulsação do gradiente
  const gradientAnimationState = useAnimationState({
    from: {
      opacity: theme === "light" ? 0.92 : 0.95,
    },
    to: {
      opacity: 1,
    },
  });

  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});

  // Inicializa as datas zerando o horário
  const today = setMilliseconds(
    setSeconds(setMinutes(setHours(new Date(), 0), 0), 0),
    0
  );
  const startDate = startOfWeek(today, { locale: ptBR });

  // Cores do gradiente baseadas no tema
  const gradientColors = useMemo(() => {
    if (theme === "light") {
      return {
        start: "rgba(255, 255, 255, 1)",
        middle: "rgba(255, 255, 255, 0.95)",
        end: "rgba(255, 255, 255, 0)",
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

  // Configurações do gradiente baseadas no tema
  const gradientConfig = useMemo(() => {
    return {
      leftStart: { x: 0, y: 0.5 },
      leftEnd: { x: 0.4, y: 0.5 },
      rightStart: { x: 0.7, y: 0.5 },
      rightEnd: { x: 1, y: 0.5 },
    };
  }, []);

  // Estilos dinâmicos baseados no tema
  const dynamicStyles = useMemo(
    () => ({
      leftGradient: {
        position: "absolute" as const,
        left: 0,
        top: 0,
        bottom: 0,
        width: 150,
        zIndex: 1,
        opacity: 1,
      },
      rightGradient: {
        position: "absolute" as const,
        right: 0,
        top: 0,
        bottom: 0,
        width: 150,
        zIndex: 1,
        opacity: 1,
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
        const workoutsForDate = getWorkoutsForDate ? getWorkoutsForDate(dateString) : {};
        const hasWorkouts = Object.keys(workoutsForDate).length > 0;

        if (hasWorkouts) {
          return true;
        }

        // Verificar refeições para a data (compatibilidade com tela de nutrição)
        if (Object.keys(meals).length > 0) {
          return (
            meals[dateString] &&
            Object.values(meals[dateString]).some((foods: any) => foods.length > 0)
          );
        }

        return false;
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

  // Efeito para iniciar a animação de pulsação
  useEffect(() => {
    // Inicia a animação de pulsação
    const pulseInterval = setInterval(() => {
      if (gradientAnimationState.current === "from") {
        gradientAnimationState.transitionTo("to");
      } else {
        gradientAnimationState.transitionTo("from");
      }
    }, 3000);

    return () => clearInterval(pulseInterval);
  }, [gradientAnimationState]);

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
          <MotiView
            key={`left-gradient-${theme}`}
            state={gradientAnimationState}
            transition={{ 
              type: 'timing', 
              duration: 2000,
              delay: 0 
            }}
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 150, zIndex: 1 }}
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
              style={{ width: '100%', height: '100%' }}
              pointerEvents="none"
            />
          </MotiView>

          {/* Gradiente direito - cobre toda a altura */}
          <MotiView
            key={`right-gradient-${theme}`}
            state={gradientAnimationState}
            transition={{ 
              type: 'timing', 
              duration: 2000,
              delay: 0 
            }}
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 150, zIndex: 1 }}
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
              style={{ width: '100%', height: '100%' }}
              pointerEvents="none"
            />
          </MotiView>

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
              const hasContentForDate = checkHasContent(date);

              // Determinar a cor de fundo do dia atual com base no tema
              const todayBackgroundColor =
                theme === "light" ? colors.light : "#333333";

              return (
                <View
                  key={`${date.toISOString()}-${theme}`}
                  style={[styles.dayColumn, { backgroundColor: "transparent" }]}
                >
                  <Text style={[styles.weekDayText, { color: colors.text }]}>
                    {format(date, "EEE", { locale: ptBR }).slice(0, 3)}
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
    width: 150,
    zIndex: 1,
  },
  rightGradient: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 150,
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
  contentIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: "absolute",
    bottom: 10,
  },
}); 