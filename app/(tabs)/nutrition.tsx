import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import Colors from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import Calendar from "../../components/nutrition/Calendar";
import { useNutrition } from "../../context/NutritionContext";
import { useMeals } from "../../context/MealContext";
import { MotiView } from "moti";
import { format } from "date-fns";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import MealCard from "../../components/nutrition/MealCard";
import MacrosCard from "../../components/nutrition/MacrosCard";
import MealDetailsSheet from "../../components/nutrition/MealDetailsSheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { getLocalDate } from "../../utils/dateUtils";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

type MealType = {
  id: string;
  name: string;
  icon: string;
  foods: any[];
};

const MEAL_TYPES: MealType[] = [
  {
    id: "breakfast",
    name: "Café da Manhã",
    icon: "sunny-outline",
    foods: [],
  },
  {
    id: "lunch",
    name: "Almoço",
    icon: "restaurant-outline",
    foods: [],
  },
  {
    id: "snack",
    name: "Lanche",
    icon: "cafe-outline",
    foods: [],
  },
  {
    id: "dinner",
    name: "Jantar",
    icon: "moon-outline",
    foods: [],
  },
];

export default function NutritionScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { nutritionInfo } = useNutrition();
  const {
    selectedDate,
    setSelectedDate,
    meals,
    getDayTotals,
    getMealTotals,
    getFoodsForMeal,
    removeFoodFromMeal,
  } = useMeals();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealType | null>(null);

  // Snappoints para o BottomSheet
  const snapPoints = useMemo(() => ["70%"], []);

  // Callback quando o BottomSheet é fechado
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) setSelectedMeal(null);
  }, []);

  // Renderiza o backdrop do BottomSheet
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
      />
    ),
    []
  );

  const handleDateSelect = (date: Date) => {
    setSelectedDate(format(date, "yyyy-MM-dd"));
  };

  const handlePresentModalPress = useCallback((meal: MealType) => {
    setSelectedMeal(meal);
    bottomSheetModalRef.current?.present();
  }, []);

  const handleDismissModal = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleDeleteFood = useCallback(
    async (mealId: string, foodId: string) => {
      try {
        await removeFoodFromMeal(mealId, foodId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error("Erro ao deletar alimento:", error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [removeFoodFromMeal]
  );

  const dailyTotals = useMemo(() => {
    return getDayTotals();
  }, [getDayTotals, selectedDate, meals]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.calendarContainer}>
        <Calendar
          selectedDate={getLocalDate(selectedDate)}
          onSelectDate={handleDateSelect}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.summaryContainer}>
          <MacrosCard
            dayTotals={dailyTotals}
            nutritionInfo={nutritionInfo}
            colors={colors}
          />
        </View>

        <View style={styles.mealsContainer}>
          {MEAL_TYPES.map((meal, index) => (
            <MealCard
              key={meal.id}
              meal={meal}
              foods={getFoodsForMeal(meal.id)}
              mealTotals={getMealTotals(meal.id)}
              index={index}
              colors={colors}
              onPress={() => handlePresentModalPress(meal)}
              onDeleteFood={(foodId) => handleDeleteFood(meal.id, foodId)}
            />
          ))}
        </View>
      </ScrollView>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
        backdropComponent={renderBackdrop}
        onChange={handleSheetChanges}
      >
        {selectedMeal && (
          <MealDetailsSheet
            meal={selectedMeal}
            mealTotals={getMealTotals(selectedMeal.id)}
            foods={getFoodsForMeal(selectedMeal.id)}
            colors={colors}
            onDismiss={handleDismissModal}
          />
        )}
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarContainer: {
    zIndex: 10,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  mealsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
});
