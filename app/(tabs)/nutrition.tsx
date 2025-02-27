import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import Colors from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import Calendar from "../../components/Calendar";
import { useNutrition } from "../../context/NutritionContext";
import { useMeals } from "../../context/MealContext";
import CircularProgress from "react-native-circular-progress-indicator";
import { MotiView } from "moti";
import { Link } from "expo-router";

const { width } = Dimensions.get("window");

export default function NutritionScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { nutritionInfo } = useNutrition();
  const { currentDate, setCurrentDate, meals, getDayTotals, getMealTotals } =
    useMeals();

  const calculateProgress = (consumed: number, target: number) => {
    if (!target) return 0;
    return Math.min((consumed / target) * 100, 100);
  };

  const dayTotals = getDayTotals();

  const renderMealCard = (meal: (typeof meals)[0], index: number) => {
    const mealTotals = getMealTotals(meal.id);
    return (
      <MotiView
        key={meal.id}
        style={[styles.mealCard, { backgroundColor: colors.light }]}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", delay: index * 100 }}
      >
        <Link
          href={{
            pathname: "/(add-food)",
            params: {
              mealId: meal.id,
              mealName: meal.name,
              targetCalories: meal.targetCalories,
              targetProtein: meal.targetProtein,
              targetCarbs: meal.targetCarbs,
              targetFat: meal.targetFat,
            },
          }}
          asChild
        >
          <TouchableOpacity style={styles.mealContent}>
            <View style={styles.mealHeader}>
              <View style={styles.mealTitleContainer}>
                <Ionicons
                  name={meal.icon as any}
                  size={24}
                  color={colors.primary}
                />
                <Text style={[styles.mealTitle, { color: colors.text }]}>
                  {meal.name}
                </Text>
              </View>
              <Text style={[styles.mealCalories, { color: colors.text }]}>
                {mealTotals.calories}/{meal.targetCalories} kcal
              </Text>
            </View>

            {meal.foods.length > 0 ? (
              <View style={styles.foodsList}>
                {meal.foods.map((food) => (
                  <Text
                    key={food.id}
                    style={[styles.foodItem, { color: colors.text }]}
                  >
                    {food.name} - {food.portion}g
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Toque para adicionar alimentos
              </Text>
            )}

            <View style={styles.macroProgress}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progress,
                    {
                      backgroundColor: colors.dark,
                      width: `${calculateProgress(
                        mealTotals.protein,
                        meal.targetProtein
                      )}%`,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progress,
                    {
                      backgroundColor: colors.dark,
                      width: `${calculateProgress(
                        mealTotals.carbs,
                        meal.targetCarbs
                      )}%`,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progress,
                    {
                      backgroundColor: colors.dark,
                      width: `${calculateProgress(
                        mealTotals.fat,
                        meal.targetFat
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Link>
      </MotiView>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.calendarContainer}>
        <Calendar selectedDate={currentDate} onSelectDate={setCurrentDate} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.summaryContainer}>
          <MotiView
            style={[styles.summaryCard, { backgroundColor: colors.light }]}
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", delay: 100 }}
          >
            <View style={styles.macroRow}>
              {/* Calorias */}
              <View style={styles.macroItem}>
                <CircularProgress
                  value={calculateProgress(
                    dayTotals.calories,
                    nutritionInfo.calories || 0
                  )}
                  radius={30}
                  duration={1000}
                  progressValueColor={colors.text}
                  maxValue={100}
                  title="kcal"
                  titleColor={colors.text}
                  titleStyle={{ fontSize: 8 }}
                  activeStrokeColor={colors.dark}
                  inActiveStrokeColor={colors.border}
                  inActiveStrokeOpacity={0.2}
                />
                <Text style={[styles.macroLabel, { color: colors.text }]}>
                  {dayTotals.calories}/{nutritionInfo.calories || 0} kcal
                </Text>
              </View>

              {/* Proteína */}
              <View style={styles.macroItem}>
                <CircularProgress
                  value={calculateProgress(
                    dayTotals.protein,
                    nutritionInfo.protein || 0
                  )}
                  radius={30}
                  duration={1000}
                  progressValueColor={colors.text}
                  maxValue={100}
                  title="g"
                  titleColor={colors.text}
                  titleStyle={{ fontSize: 8 }}
                  activeStrokeColor={colors.dark}
                  inActiveStrokeColor={colors.border}
                  inActiveStrokeOpacity={0.2}
                />
                <Text style={[styles.macroLabel, { color: colors.text }]}>
                  {dayTotals.protein}/{nutritionInfo.protein || 0}g Prot
                </Text>
              </View>

              {/* Carboidratos */}
              <View style={styles.macroItem}>
                <CircularProgress
                  value={calculateProgress(
                    dayTotals.carbs,
                    nutritionInfo.carbs || 0
                  )}
                  radius={30}
                  duration={1000}
                  progressValueColor={colors.text}
                  maxValue={100}
                  title="g"
                  titleColor={colors.text}
                  titleStyle={{ fontSize: 8 }}
                  activeStrokeColor={colors.dark}
                  inActiveStrokeColor={colors.border}
                  inActiveStrokeOpacity={0.2}
                />
                <Text style={[styles.macroLabel, { color: colors.text }]}>
                  {dayTotals.carbs}/{nutritionInfo.carbs || 0}g Carb
                </Text>
              </View>

              {/* Gorduras */}
              <View style={styles.macroItem}>
                <CircularProgress
                  value={calculateProgress(
                    dayTotals.fat,
                    nutritionInfo.fat || 0
                  )}
                  radius={30}
                  duration={1000}
                  progressValueColor={colors.text}
                  maxValue={100}
                  title="g"
                  titleColor={colors.text}
                  titleStyle={{ fontSize: 8 }}
                  activeStrokeColor={colors.dark}
                  inActiveStrokeColor={colors.border}
                  inActiveStrokeOpacity={0.2}
                />
                <Text style={[styles.macroLabel, { color: colors.text }]}>
                  {dayTotals.fat}/{nutritionInfo.fat || 0}g Gord
                </Text>
              </View>
            </View>
          </MotiView>
        </View>

        {/* Lista de Refeições */}
        <View style={styles.mealsContainer}>
          {meals.map((meal, index) => renderMealCard(meal, index))}
        </View>
      </ScrollView>
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
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  macroItem: {
    alignItems: "center",
  },
  macroLabel: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "600",
  },
  mealsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  mealCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  mealContent: {
    padding: 20,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  mealTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: "600",
  },
  foodsList: {
    marginVertical: 8,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
    marginVertical: 12,
  },
  macroProgress: {
    marginTop: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 3,
    flexDirection: "row",
    overflow: "hidden",
  },
  progress: {
    height: "100%",
  },
  foodItem: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
});
