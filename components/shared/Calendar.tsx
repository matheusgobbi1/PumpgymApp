import React, { useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  VirtualizedList,
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
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");
const DAYS_TO_SHOW = 35; // 30 dias antes + dia atual + 3 dias depois
const DAY_ITEM_WIDTH = 49; // Largura do item de dia (40px) + marginHorizontal (4px * 2)
const WINDOW_SIZE = 7; // Quantidade de dias visíveis por vez

interface CalendarProps {
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  hasContent?: (date: Date) => boolean;
  workouts?: { [date: string]: any };
  weeklyTemplate?: { [dayOfWeek: number]: any };
  meals?: { [date: string]: any };
  getWorkoutsForDate?: (date: string) => any;
}

interface CalendarDayProps {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  hasContent: boolean;
  onPress: (date: Date) => void;
  colors: (typeof Colors)[keyof typeof Colors];
  theme: "light" | "dark";
}

// Componente do dia do calendário
const CalendarDay = React.memo(
  ({
    date,
    isSelected,
    isToday,
    hasContent,
    onPress,
    colors,
    theme,
  }: CalendarDayProps) => {
    const { t } = useTranslation();
    const todayBackgroundColor = theme === "light" ? colors.light : "#333333";
    const dayOfWeek = format(date, "eee").toLowerCase();

    // Mapeia o formato 'eee' para a chave de tradução correta
    const getDayTranslation = () => {
      type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

      const shortDays: Record<DayKey, string> = {
        sun: t("dates.weekdays.shortSunday"),
        mon: t("dates.weekdays.shortMonday"),
        tue: t("dates.weekdays.shortTuesday"),
        wed: t("dates.weekdays.shortWednesday"),
        thu: t("dates.weekdays.shortThursday"),
        fri: t("dates.weekdays.shortFriday"),
        sat: t("dates.weekdays.shortSaturday"),
      };

      const key = dayOfWeek.substring(0, 3) as DayKey;
      return shortDays[key] || format(date, "EEE").slice(0, 3);
    };

    return (
      <View style={styles.dayColumn}>
        <Text style={[styles.weekDayText, { color: colors.text }]}>
          {getDayTranslation()}
        </Text>
        <TouchableOpacity
          onPress={() => onPress(date)}
          style={styles.dayButton}
          activeOpacity={0.7}
        >
          <MotiView
            style={[
              styles.dayContainer,
              isSelected && {
                backgroundColor: colors.primary,
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
                  color: isSelected
                    ? theme === "dark"
                      ? "#000" // Preto no modo escuro
                      : "#FFF" // Branco no modo claro
                    : colors.text, // Cor padrão para outros dias
                  opacity: isSelected ? 1 : isToday ? 1 : 0.7,
                },
              ]}
            >
              {format(date, "d")}
            </Text>
          </MotiView>
          {hasContent && !isSelected && (
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
  }
);

export default function Calendar({
  onSelectDate,
  selectedDate,
  hasContent: hasContentProp,
  workouts = {},
  weeklyTemplate = {},
  meals = {},
  getWorkoutsForDate,
}: CalendarProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const listRef = useRef<VirtualizedList<Date>>(null);
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

  const checkHasContent = useCallback(
    (date: Date): boolean => {
      if (hasContentProp) {
        return hasContentProp(date);
      }
      try {
        const dateString = format(date, "yyyy-MM-dd");
        if (meals && Object.keys(meals).length > 0) {
          if (
            meals[dateString] &&
            Object.values(meals[dateString]).some(
              (foods: any) => Array.isArray(foods) && foods.length > 0
            )
          ) {
            return true;
          }
        }
        const workoutsForDate = getWorkoutsForDate
          ? getWorkoutsForDate(dateString)
          : {};
        return workoutsForDate && Object.keys(workoutsForDate).length > 0;
      } catch (error) {
        return false;
      }
    },
    [hasContentProp, getWorkoutsForDate, meals]
  );

  // Zera o horário da data selecionada para comparação
  const normalizedSelectedDate = useMemo(() => {
    return setMilliseconds(
      setSeconds(setMinutes(setHours(selectedDate, 0), 0), 0),
      0
    );
  }, [selectedDate]);

  // Função para centralizar uma data específica no VirtualizedList
  const scrollToDate = useCallback(
    (date: Date) => {
      const dateIndex = dates.findIndex((d) => isSameDay(d, date));
      if (dateIndex !== -1 && listRef.current) {
        listRef.current.scrollToIndex({
          index: dateIndex,
          animated: true,
          viewPosition: 0.5,
        });
      }
    },
    [dates]
  );

  const handleDatePress = useCallback(
    (date: Date) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelectDate(date);
      scrollToDate(date);
    },
    [onSelectDate, scrollToDate]
  );

  const getItem = (data: Date[], index: number): Date => dates[index];
  const getItemCount = () => DAYS_TO_SHOW;
  const keyExtractor = (item: Date) => format(item, "yyyy-MM-dd");

  const renderItem = useCallback(
    ({ item: date }: { item: Date }) => {
      const isSelected = isSameDay(date, normalizedSelectedDate);
      const isToday = isSameDay(date, today);
      const hasContentForDate = checkHasContent(date);

      return (
        <CalendarDay
          date={date}
          isSelected={isSelected}
          isToday={isToday}
          hasContent={hasContentForDate}
          onPress={handleDatePress}
          colors={colors}
          theme={theme}
        />
      );
    },
    [
      normalizedSelectedDate,
      today,
      checkHasContent,
      handleDatePress,
      colors,
      theme,
    ]
  );

  const initializeScroll = useCallback(() => {
    if (!initialScrollDone.current) {
      setTimeout(() => {
        scrollToDate(normalizedSelectedDate);
        initialScrollDone.current = true;
      }, 100);
    }
  }, [normalizedSelectedDate, scrollToDate]);

  return (
    <View
      style={[
        styles.outerContainer,
        { backgroundColor: `${colors.background}E0` },
      ]}
    >
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

          <VirtualizedList<Date>
            ref={listRef}
            horizontal
            data={dates}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItem={getItem}
            getItemCount={getItemCount}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onLayout={initializeScroll}
            windowSize={WINDOW_SIZE}
            initialNumToRender={WINDOW_SIZE}
            maxToRenderPerBatch={WINDOW_SIZE}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
              length: DAY_ITEM_WIDTH,
              offset: DAY_ITEM_WIDTH * index,
              index,
            })}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    overflow: "hidden",
    height: 80, // Altura fixa reduzida
  },
  container: {
    width: "100%",
    backgroundColor: "transparent",
    height: "100%",
  },
  calendarContainer: {
    position: "relative",
    width: "100%",
    backgroundColor: "transparent",
    height: "100%",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 2, // Reduzir o padding vertical
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
    marginBottom: 2, // Adicionar margem menor
  },
  dayButton: {
    alignItems: "center",
    paddingBottom: 2, // Reduzir padding inferior
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
    bottom: 2, // Ajustar posição do indicador
  },
});
