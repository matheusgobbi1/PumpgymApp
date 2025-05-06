import React, { useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  VirtualizedList,
  StyleProp,
  ViewStyle,
} from "react-native";
import {
  format,
  addDays,
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

const DAYS_TO_SHOW = 35; // 30 dias antes + dia atual + 3 dias depois
const DAY_ITEM_WIDTH = 49; // Largura do item de dia (40px) + marginHorizontal (4px * 2)
const WINDOW_SIZE = 5; // Quantidade de dias visíveis por vez

// Pré-definir estilos que não dependem de props para evitar recálculos
const staticGradientConfig = {
  leftStart: { x: 0, y: 0.5 },
  leftEnd: { x: 0.2, y: 0.5 },
  rightStart: { x: 0.8, y: 0.5 },
  rightEnd: { x: 1, y: 0.5 },
};

const staticStyleProps = {
  leftGradientContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 150,
    zIndex: 1,
  } as StyleProp<ViewStyle>,
  rightGradientContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 150,
    zIndex: 1,
  } as StyleProp<ViewStyle>,
  gradientStyle: {
    width: "100%",
    height: "100%",
  } as ViewStyle,
};

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

// Componente do dia do calendário - agora com mais otimizações
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
    const dayNum = format(date, "d");

    // Memoizar a tradução do dia para evitar recálculos
    const dayTranslation = useMemo(() => {
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
    }, [dayOfWeek, t]);

    // Memoizar os estilos do container para evitar recálculos
    const containerStyle = useMemo(() => {
      if (isSelected) {
        return [styles.dayContainer, { backgroundColor: colors.primary }];
      } else if (isToday) {
        return [styles.dayContainer, { backgroundColor: todayBackgroundColor }];
      } else {
        return [styles.dayContainer, { backgroundColor: "transparent" }];
      }
    }, [isSelected, isToday, colors.primary, todayBackgroundColor]);

    // Memoizar os estilos do texto para evitar recálculos
    const textStyle = useMemo(() => {
      const textColor = isSelected
        ? theme === "dark"
          ? "#000"
          : "#FFF"
        : colors.text;

      return [
        styles.dayText,
        {
          color: textColor,
          opacity: isSelected ? 1 : isToday ? 1 : 0.7,
        },
      ];
    }, [isSelected, isToday, colors.text, theme]);

    // Eliminar chamada anônima no onPress
    const handlePress = useCallback(() => {
      onPress(date);
    }, [date, onPress]);

    return (
      <View style={styles.dayColumn}>
        <Text style={[styles.weekDayText, { color: colors.text }]}>
          {dayTranslation}
        </Text>
        <TouchableOpacity
          onPress={handlePress}
          style={styles.dayButton}
          activeOpacity={0.7}
        >
          <MotiView style={containerStyle}>
            <Text style={textStyle}>{dayNum}</Text>
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
  },
  // Comparador personalizado para o React.memo para evitar renderizações desnecessárias
  (prevProps, nextProps) => {
    // Comparar apenas as propriedades relevantes
    return (
      isSameDay(prevProps.date, nextProps.date) &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isToday === nextProps.isToday &&
      prevProps.hasContent === nextProps.hasContent &&
      prevProps.theme === nextProps.theme
    );
  }
);

// Componente dos gradientes
const GradientOverlay = React.memo(
  ({
    colors,
    position,
  }: {
    colors: [string, string, string];
    position: "left" | "right";
  }) => {
    const containerStyle =
      position === "left"
        ? staticStyleProps.leftGradientContainer
        : staticStyleProps.rightGradientContainer;

    // Garantir o tipo correto para o LinearGradient
    const gradientColors: [string, string, string] =
      position === "left" ? colors : [colors[2], colors[1], colors[0]];

    const config =
      position === "left"
        ? {
            start: staticGradientConfig.leftStart,
            end: staticGradientConfig.leftEnd,
          }
        : {
            start: staticGradientConfig.rightStart,
            end: staticGradientConfig.rightEnd,
          };

    return (
      <View style={containerStyle} pointerEvents="none">
        <LinearGradient
          colors={gradientColors}
          start={config.start}
          end={config.end}
          style={staticStyleProps.gradientStyle}
          pointerEvents="none"
        />
      </View>
    );
  }
);

const Calendar = ({
  onSelectDate,
  selectedDate,
  hasContent: hasContentProp,
  workouts = {},
  weeklyTemplate = {},
  meals = {},
  getWorkoutsForDate,
}: CalendarProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const listRef = useRef<VirtualizedList<Date>>(null);
  const initialScrollDone = useRef(false);
  const lastSelectedDateRef = useRef<Date | null>(null);

  // Normalizar datas uma vez para evitar recálculos constantes
  const today = useMemo(() => {
    return setMilliseconds(
      setSeconds(setMinutes(setHours(new Date(), 0), 0), 0),
      0
    );
  }, []);

  const startDate = useMemo(() => {
    return subDays(today, 30);
  }, [today]);

  // Memoizar as cores do gradiente para evitar recálculos
  const gradientColors = useMemo(() => {
    const bgColor = colors.background;
    // Definimos como uma tupla literal para atender ao requisito do LinearGradient
    return [bgColor, `${bgColor}F0`, `${bgColor}00`] as [
      string,
      string,
      string
    ];
  }, [colors.background]);

  // Gerar as datas com memoização
  const dates = useMemo(() => {
    return Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
      const date = addDays(startDate, i);
      return setMilliseconds(
        setSeconds(setMinutes(setHours(date, 0), 0), 0),
        0
      );
    });
  }, [startDate]);

  // Otimizar a função checkHasContent com melhor tratamento de erros
  const checkHasContent = useCallback(
    (date: Date): boolean => {
      if (hasContentProp) {
        return hasContentProp(date);
      }

      const dateString = format(date, "yyyy-MM-dd");

      // Verificar refeições
      if (meals && typeof meals === "object") {
        const mealForDate = meals[dateString];
        if (mealForDate && typeof mealForDate === "object") {
          const hasMealContent = Object.values(mealForDate).some(
            (foods: any) => Array.isArray(foods) && foods.length > 0
          );
          if (hasMealContent) return true;
        }
      }

      // Verificar treinos
      if (getWorkoutsForDate) {
        try {
          const workoutsForDate = getWorkoutsForDate(dateString);
          return Boolean(
            workoutsForDate && Object.keys(workoutsForDate).length > 0
          );
        } catch {
          return false;
        }
      }

      return false;
    },
    [hasContentProp, getWorkoutsForDate, meals]
  );

  // Normalizar a data selecionada para comparação
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

  // Otimizar o método de pressionar data
  const handleDatePress = useCallback(
    (date: Date) => {
      if (
        lastSelectedDateRef.current &&
        isSameDay(lastSelectedDateRef.current, date)
      ) {
        return; // Evitar re-renderizações desnecessárias
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      lastSelectedDateRef.current = date;
      onSelectDate(date);
      scrollToDate(date);
    },
    [onSelectDate, scrollToDate]
  );

  // Funções otimizadas para VirtualizedList
  const getItem = useCallback(
    (data: Date[], index: number): Date => dates[index],
    [dates]
  );

  const getItemCount = useCallback(() => DAYS_TO_SHOW, []);

  const keyExtractor = useCallback(
    (item: Date) => format(item, "yyyy-MM-dd"),
    []
  );

  // Renderização de item otimizada
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

  // Memoizar o cálculo do layout para evitar recálculos
  const getItemLayout = useCallback(
    (data: Date[] | null, index: number) => ({
      length: DAY_ITEM_WIDTH,
      offset: DAY_ITEM_WIDTH * index,
      index,
    }),
    []
  );

  const initializeScroll = useCallback(() => {
    if (!initialScrollDone.current) {
      requestAnimationFrame(() => {
        scrollToDate(normalizedSelectedDate);
        initialScrollDone.current = true;
      });
    }
  }, [normalizedSelectedDate, scrollToDate]);

  // Memoização do estilo do container para evitar recálculos
  const containerStyle = useMemo(
    () => [
      styles.outerContainer,
      { backgroundColor: `${colors.background}F0` },
    ],
    [colors.background]
  );

  return (
    <View style={containerStyle}>
      <View style={styles.container}>
        <View style={styles.calendarContainer}>
          {/* Componente de gradiente extraído para melhorar a legibilidade */}
          <GradientOverlay colors={gradientColors} position="left" />
          <GradientOverlay colors={gradientColors} position="right" />

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
            updateCellsBatchingPeriod={30}
            removeClippedSubviews={true}
            getItemLayout={getItemLayout}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 3,
            }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    overflow: "hidden",
    height: 70,
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
    paddingVertical: 0,
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
    marginBottom: 2,
  },
  dayButton: {
    alignItems: "center",
    paddingBottom: 0,
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
    bottom: 2,
  },
});

export default React.memo(Calendar);
