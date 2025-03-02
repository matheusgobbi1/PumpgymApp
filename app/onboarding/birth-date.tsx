import React, { useState, useRef, useEffect } from "react";
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

const { height } = Dimensions.get("window");
const ITEM_HEIGHT = 52;

export default function BirthDateScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();

  // Definir estados iniciais como null para indicar que nenhuma opção está selecionada
  const [selectedMonth, setSelectedMonth] = useState<number | null>(
    nutritionInfo.birthDate ? nutritionInfo.birthDate.getMonth() : null
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(
    nutritionInfo.birthDate ? nutritionInfo.birthDate.getDate() : null
  );
  const [selectedYear, setSelectedYear] = useState<number | null>(
    nutritionInfo.birthDate ? nutritionInfo.birthDate.getFullYear() : null
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

      updateNutritionInfo({ birthDate });
      router.push("/onboarding/measurements" as any);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

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
      title="Quando você nasceu?"
      subtitle="Isso será usado para calibrar seu plano personalizado"
      currentStep={3}
      totalSteps={10}
      onBack={handleBack}
      onNext={handleNext}
      nextButtonDisabled={!isNextEnabled}
      error={error}
    >
      <View key={`date-selection-container-${theme}`} style={styles.dateSelectionContainer}>
        <View key={`month-column-${theme}`} style={styles.dateColumn}>
          <Text key={`month-label-${theme}`} style={[styles.dateLabel, { color: colors.text }]}>Mês</Text>
          <View
            key={`month-picker-container-${theme}`}
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
              key={`month-scroll-${theme}`}
              style={styles.dateScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
            >
              {months.map((month, index) => (
                <TouchableOpacity
                  key={`month-${index}-${theme}`}
                  style={[
                    styles.dateItem,
                    {
                      backgroundColor: selectedMonth === index 
                        ? (theme === 'dark' ? 'rgba(28, 154, 190, 0.1)' : 'rgba(28, 154, 190, 0.05)')
                        : "transparent",
                      borderWidth: selectedMonth === index ? 2 : 0,
                      borderColor: selectedMonth === index ? colors.primary : "transparent",
                    },
                  ]}
                  onPress={() => setSelectedMonth(index)}
                  activeOpacity={0.7}
                >
                  <Text
                    key={`month-text-${index}-${theme}`}
                    style={[
                      styles.dateItemText,
                      {
                        color: selectedMonth === index ? colors.primary : colors.text,
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
        </View>

        <View key={`day-column-${theme}`} style={styles.dateColumn}>
          <Text key={`day-label-${theme}`} style={[styles.dateLabel, { color: colors.text }]}>Dia</Text>
          <View
            key={`day-picker-container-${theme}`}
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
              key={`day-scroll-${theme}`}
              style={styles.dateScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
            >
              {days.map((day) => (
                <TouchableOpacity
                  key={`day-${day}-${theme}`}
                  style={[
                    styles.dateItem,
                    {
                      backgroundColor: selectedDay === day 
                        ? (theme === 'dark' ? 'rgba(28, 154, 190, 0.1)' : 'rgba(28, 154, 190, 0.05)')
                        : "transparent",
                      borderWidth: selectedDay === day ? 2 : 0,
                      borderColor: selectedDay === day ? colors.primary : "transparent",
                    },
                  ]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.7}
                >
                  <Text
                    key={`day-text-${day}-${theme}`}
                    style={[
                      styles.dateItemText,
                      {
                        color: selectedDay === day ? colors.primary : colors.text,
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
        </View>

        <View key={`year-column-${theme}`} style={styles.dateColumn}>
          <Text key={`year-label-${theme}`} style={[styles.dateLabel, { color: colors.text }]}>Ano</Text>
          <View
            key={`year-picker-container-${theme}`}
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
              key={`year-scroll-${theme}`}
              style={styles.dateScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
            >
              {years.map((year) => (
                <TouchableOpacity
                  key={`year-${year}-${theme}`}
                  style={[
                    styles.dateItem,
                    {
                      backgroundColor: selectedYear === year 
                        ? (theme === 'dark' ? 'rgba(28, 154, 190, 0.1)' : 'rgba(28, 154, 190, 0.05)')
                        : "transparent",
                      borderWidth: selectedYear === year ? 2 : 0,
                      borderColor: selectedYear === year ? colors.primary : "transparent",
                    },
                  ]}
                  onPress={() => setSelectedYear(year)}
                  activeOpacity={0.7}
                >
                  <Text
                    key={`year-text-${year}-${theme}`}
                    style={[
                      styles.dateItemText,
                      {
                        color: selectedYear === year ? colors.primary : colors.text,
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
        </View>
      </View>
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
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 16,
  },
  datePickerContainer: {
    borderRadius: 16,
    overflow: "hidden",
    width: "90%",
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
    paddingHorizontal: 8,
  },
  dateItemText: {
    fontSize: 18,
    fontWeight: "500",
  },
});
