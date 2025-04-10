import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useNutrition } from "../../context/NutritionContext";
import { validateBirthDate } from "../../utils/validations";
import OnboardingLayout from "../../components/onboarding/OnboardingLayout";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const { height } = Dimensions.get("window");
const ITEM_HEIGHT = 52;

export default function BirthDateScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();
  const { t } = useTranslation();

  // Definir estados iniciais como null para indicar que nenhuma opção está selecionada
  const [selectedMonth, setSelectedMonth] = useState<number | null>(
    nutritionInfo.birthDate && nutritionInfo.birthDate instanceof Date
      ? nutritionInfo.birthDate.getMonth()
      : null
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(
    nutritionInfo.birthDate && nutritionInfo.birthDate instanceof Date
      ? nutritionInfo.birthDate.getDate()
      : null
  );
  const [selectedYear, setSelectedYear] = useState<number | null>(
    nutritionInfo.birthDate && nutritionInfo.birthDate instanceof Date
      ? nutritionInfo.birthDate.getFullYear()
      : null
  );
  const [error, setError] = useState("");

  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});

  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

  // Refs para os ScrollViews
  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);

  // Verificar se o botão "Próximo" deve estar habilitado
  const isNextEnabled =
    selectedMonth !== null && selectedDay !== null && selectedYear !== null;

  // Função para obter o número de dias em um mês
  const getDaysInMonth = (
    month: number | null,
    year: number | null
  ): number => {
    if (month === null || year === null) return 31; // Default para 31 dias quando nenhum mês/ano selecionado

    // Meses com 31 dias: Jan (0), Mar (2), Mai (4), Jul (6), Ago (7), Out (9), Dez (11)
    if ([0, 2, 4, 6, 7, 9, 11].includes(month)) {
      return 31;
    }

    // Fevereiro (1)
    if (month === 1) {
      // Verificar se é ano bissexto
      const isLeapYear =
        (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      return isLeapYear ? 29 : 28;
    }

    // Meses com 30 dias: Abr (3), Jun (5), Set (8), Nov (10)
    return 30;
  };

  // Recalcular os dias disponíveis quando o mês ou ano mudar
  const availableDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [selectedMonth, selectedYear]);

  // Atualizar o dia selecionado se for inválido para o novo mês
  useEffect(() => {
    if (
      selectedDay !== null &&
      selectedMonth !== null &&
      selectedYear !== null
    ) {
      const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
      if (selectedDay > daysInMonth) {
        setSelectedDay(null);
      }
    }
  }, [selectedMonth, selectedYear]);

  const handleNext = () => {
    if (
      selectedMonth !== null &&
      selectedDay !== null &&
      selectedYear !== null
    ) {
      const birthDate = new Date(selectedYear, selectedMonth, selectedDay);
      const validation = validateBirthDate(birthDate);

      if (!validation.isValid) {
        setError(validation.message);
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updateNutritionInfo({ birthDate });
      router.push("/onboarding/measurements" as any);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.back();
  };

  const handleSelectMonth = (index: number) => {
    Haptics.selectionAsync();
    setSelectedMonth(index);
  };

  const handleSelectDay = (day: number) => {
    Haptics.selectionAsync();
    setSelectedDay(day);
  };

  const handleSelectYear = (year: number) => {
    Haptics.selectionAsync();
    setSelectedYear(year);
  };

  // Obter nomes dos meses a partir das traduções
  const months = [
    t("months.1"),
    t("months.2"),
    t("months.3"),
    t("months.4"),
    t("months.5"),
    t("months.6"),
    t("months.7"),
    t("months.8"),
    t("months.9"),
    t("months.10"),
    t("months.11"),
    t("months.12"),
  ];

  // Gerar anos de 1950 até o ano atual
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1950 + 1 },
    (_, i) => currentYear - i
  );

  // Rolar para a posição selecionada quando o componente montar
  useEffect(() => {
    if (selectedMonth !== null && monthScrollRef.current) {
      monthScrollRef.current.scrollTo({
        y: selectedMonth * ITEM_HEIGHT,
        animated: false,
      });
    }
    if (selectedDay !== null && dayScrollRef.current) {
      dayScrollRef.current.scrollTo({
        y: (selectedDay - 1) * ITEM_HEIGHT,
        animated: false,
      });
    }
    if (selectedYear !== null && yearScrollRef.current) {
      const yearIndex = years.findIndex((y) => y === selectedYear);
      if (yearIndex >= 0) {
        yearScrollRef.current.scrollTo({
          y: yearIndex * ITEM_HEIGHT,
          animated: false,
        });
      }
    }
  }, []);

  return (
    <OnboardingLayout
      title={t("onboarding.birthDate.title")}
      subtitle={t("onboarding.birthDate.subtitle")}
      currentStep={3}
      totalSteps={10}
      onBack={handleBack}
      onNext={handleNext}
      nextButtonDisabled={!isNextEnabled}
      error={error}
    >
      <Animated.View
        style={styles.dateSelectionContainer}
        entering={FadeInDown.duration(600).springify()}
      >
        <Animated.View
          style={[styles.dateColumn, { flex: 1.2 }]}
          entering={FadeInDown.delay(100).duration(500)}
        >
          <Text style={[styles.dateLabel, { color: colors.text }]}>
            {t("onboarding.birthDate.month")}
          </Text>
          <View
            style={[
              styles.datePickerContainer,
              {
                backgroundColor: theme === "dark" ? "#1c1c1e" : "#f5f5f5",
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
          >
            <ScrollView
              ref={monthScrollRef}
              style={styles.dateScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
            >
              {months.map((month, index) => (
                <TouchableOpacity
                  key={`month-${index}`}
                  style={[
                    styles.dateItem,
                    {
                      backgroundColor:
                        selectedMonth === index
                          ? colors.primary + "20"
                          : "transparent",
                      borderWidth: selectedMonth === index ? 1 : 0,
                      borderColor:
                        selectedMonth === index
                          ? colors.primary
                          : "transparent",
                    },
                  ]}
                  onPress={() => handleSelectMonth(index)}
                  activeOpacity={0.7}
                >
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.dateItemText,
                      {
                        color:
                          selectedMonth === index
                            ? colors.primary
                            : colors.text,
                        fontWeight: selectedMonth === index ? "600" : "500",
                      },
                    ]}
                  >
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>

        <Animated.View
          style={styles.dateColumn}
          entering={FadeInDown.delay(200).duration(500)}
        >
          <Text style={[styles.dateLabel, { color: colors.text }]}>
            {t("onboarding.birthDate.day")}
          </Text>
          <View
            style={[
              styles.datePickerContainer,
              {
                backgroundColor: theme === "dark" ? "#1c1c1e" : "#f5f5f5",
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
          >
            <ScrollView
              ref={dayScrollRef}
              style={styles.dateScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
            >
              {availableDays.map((day) => (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.dateItem,
                    {
                      backgroundColor:
                        selectedDay === day
                          ? colors.primary + "20"
                          : "transparent",
                      borderWidth: selectedDay === day ? 1 : 0,
                      borderColor:
                        selectedDay === day ? colors.primary : "transparent",
                    },
                  ]}
                  onPress={() => handleSelectDay(day)}
                  activeOpacity={0.7}
                >
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.dateItemText,
                      {
                        color:
                          selectedDay === day ? colors.primary : colors.text,
                        fontWeight: selectedDay === day ? "600" : "500",
                      },
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>

        <Animated.View
          style={styles.dateColumn}
          entering={FadeInDown.delay(300).duration(500)}
        >
          <Text style={[styles.dateLabel, { color: colors.text }]}>
            {t("onboarding.birthDate.year")}
          </Text>
          <View
            style={[
              styles.datePickerContainer,
              {
                backgroundColor: theme === "dark" ? "#1c1c1e" : "#f5f5f5",
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
          >
            <ScrollView
              ref={yearScrollRef}
              style={styles.dateScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
            >
              {years.map((year) => (
                <TouchableOpacity
                  key={`year-${year}`}
                  style={[
                    styles.dateItem,
                    {
                      backgroundColor:
                        selectedYear === year
                          ? colors.primary + "20"
                          : "transparent",
                      borderWidth: selectedYear === year ? 1 : 0,
                      borderColor:
                        selectedYear === year ? colors.primary : "transparent",
                    },
                  ]}
                  onPress={() => handleSelectYear(year)}
                  activeOpacity={0.7}
                >
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.dateItemText,
                      {
                        color:
                          selectedYear === year ? colors.primary : colors.text,
                        fontWeight: selectedYear === year ? "600" : "500",
                      },
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      </Animated.View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  dateSelectionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  dateColumn: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 2,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 16,
  },
  datePickerContainer: {
    borderRadius: 16,
    overflow: "hidden",
    width: "95%",
    height: Math.min(height * 0.3, 250), // Ajuste responsivo para diferentes tamanhos de tela
  },
  dateScrollView: {
    height: "100%",
  },
  scrollViewContent: {
    paddingVertical: 8,
  },
  dateItem: {
    width: "100%",
    height: ITEM_HEIGHT,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
    paddingHorizontal: 4,
  },
  dateItemText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});
