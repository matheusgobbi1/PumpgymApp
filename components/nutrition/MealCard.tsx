import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useRouter } from "expo-router";
import { Food } from "../../context/MealContext";
import * as Haptics from "expo-haptics";
import { Swipeable } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInRight } from "react-native-reanimated";

interface MealCardProps {
  meal: {
    id: string;
    name: string;
    icon: string;
  };
  foods: Food[];
  mealTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  index: number;
  colors: any;
  onPress: () => void;
  onDeleteFood: (foodId: string) => Promise<void>;
}

const { width } = Dimensions.get("window");

export default function MealCard({
  meal,
  foods,
  mealTotals,
  index,
  colors,
  onPress,
  onDeleteFood,
}: MealCardProps) {
  const router = useRouter();

  const handleHapticFeedback = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Função para calcular a porcentagem de cada macronutriente
  const calculateMacroPercentage = (macro: number, total: number) => {
    if (!total) return 0;
    return (macro / total) * 100;
  };

  // Calcular calorias de cada macronutriente
  const proteinCalories = mealTotals.protein * 4;
  const carbsCalories = mealTotals.carbs * 4;
  const fatCalories = mealTotals.fat * 9;

  // Calcular porcentagens
  const proteinPercentage = calculateMacroPercentage(
    proteinCalories,
    mealTotals.calories
  );
  const carbsPercentage = calculateMacroPercentage(
    carbsCalories,
    mealTotals.calories
  );
  const fatPercentage = calculateMacroPercentage(
    fatCalories,
    mealTotals.calories
  );

  const renderFoodItem = (food: Food, foodIndex: number) => (
    <Swipeable
      key={food.id}
      renderRightActions={() => (
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: colors.danger }]}
          onPress={async () => {
            handleHapticFeedback();
            await onDeleteFood(food.id);
          }}
        >
          <Ionicons name="trash" size={24} color="white" />
        </TouchableOpacity>
      )}
    >
      <Animated.View
        entering={FadeInRight.delay(foodIndex * 100).duration(300)}
        style={[styles.foodItemContainer, { backgroundColor: colors.light }]}
      >
        <View style={styles.foodItemContent}>
          <View style={styles.foodItemLeft}>
            <View style={[styles.foodIconContainer, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons
                name="restaurant-outline"
                size={16}
                color={colors.primary}
              />
            </View>
            <View style={styles.foodTextContainer}>
              <Text style={[styles.foodName, { color: colors.text }]}>
                {food.name}
              </Text>
              <Text style={[styles.foodPortion, { color: colors.text + "99" }]}>
                {food.portion}g • {food.calories} kcal
              </Text>
            </View>
          </View>

          <View style={styles.macroIndicators}>
            {/* Proteína */}
            <View style={styles.macroIndicator}>
              <View style={[styles.macroIcon, { backgroundColor: colors.danger + "CC" }]}>
                <Text style={styles.macroIconText}>P</Text>
              </View>
              <Text style={[styles.macroValue, { color: colors.text + "99" }]}>
                {food.protein}g
              </Text>
            </View>

            {/* Carboidratos */}
            <View style={styles.macroIndicator}>
              <View style={[styles.macroIcon, { backgroundColor: colors.success + "CC" }]}>
                <Text style={styles.macroIconText}>C</Text>
              </View>
              <Text style={[styles.macroValue, { color: colors.text + "99" }]}>
                {food.carbs}g
              </Text>
            </View>

            {/* Gorduras */}
            <View style={styles.macroIndicator}>
              <View style={[styles.macroIcon, { backgroundColor: colors.warning + "CC" }]}>
                <Text style={styles.macroIconText}>G</Text>
              </View>
              <Text style={[styles.macroValue, { color: colors.text + "99" }]}>
                {food.fat}g
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Swipeable>
  );

  return (
    <MotiView
      style={[styles.mealCard, { backgroundColor: colors.light }]}
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", delay: index * 100 }}
    >
      <View style={styles.mealContent}>
        <TouchableOpacity
          style={styles.headerTouchable}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <View style={styles.mealHeader}>
            <View style={styles.mealTitleContainer}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Ionicons
                  name={meal.icon as any}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View>
                <Text style={[styles.mealTitle, { color: colors.text }]}>
                  {meal.name}
                </Text>
                {foods.length > 0 && (
                  <Text
                    style={[styles.foodCount, { color: colors.text + "80" }]}
                  >
                    {foods.length}{" "}
                    {foods.length === 1 ? "alimento" : "alimentos"}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.mealCaloriesContainer}>
              <Text style={[styles.mealCalories, { color: colors.primary }]}>
                {mealTotals.calories}
              </Text>
              <Text
                style={[styles.caloriesUnit, { color: colors.text + "80" }]}
              >
                kcal
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {foods.length > 0 && (
          <View style={[styles.macroProgressContainer, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.macroProgressBar,
                { backgroundColor: colors.danger + "CC" },
                { width: `${proteinPercentage}%` },
              ]}
            />
            <View
              style={[
                styles.macroProgressBar,
                { backgroundColor: colors.success + "CC" },
                { width: `${carbsPercentage}%` },
              ]}
            />
            <View
              style={[
                styles.macroProgressBar,
                { backgroundColor: colors.warning + "CC" },
                { width: `${fatPercentage}%` },
              ]}
            />
          </View>
        )}

        <View style={styles.foodsContainer}>
          {foods.length > 0 ? (
            <View style={styles.foodsList}>
              {foods.map((food, foodIndex) => renderFoodItem(food, foodIndex))}
            </View>
          ) : (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "timing", duration: 500 }}
              style={styles.emptyContainer}
            >
              <LinearGradient
                colors={[colors.light, colors.background]}
                style={styles.emptyGradient}
              >
                <Ionicons
                  name="restaurant-outline"
                  size={24}
                  color={colors.primary + "40"}
                />
                <Text style={[styles.emptyText, { color: colors.text + "60" }]}>
                  Adicione seu primeiro alimento
                </Text>
              </LinearGradient>
            </MotiView>
          )}
        </View>

        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={(e) => {
              e.stopPropagation();
              handleHapticFeedback();
              router.push({
                pathname: "/(add-food)",
                params: {
                  mealId: meal.id,
                  mealName: meal.name,
                },
              });
            }}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
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
    padding: 16,
  },
  headerTouchable: {
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  foodCount: {
    fontSize: 12,
    marginTop: 2,
  },
  mealCaloriesContainer: {
    alignItems: "flex-end",
  },
  mealCalories: {
    fontSize: 20,
    fontWeight: "700",
  },
  caloriesUnit: {
    fontSize: 12,
    marginTop: 2,
  },
  macroProgressContainer: {
    height: 4,
    flexDirection: "row",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 16,
  },
  macroProgressBar: {
    height: "100%",
  },
  foodsContainer: {
    minHeight: 50,
    marginBottom: 50, // Espaço para o botão
  },
  foodsList: {
    marginVertical: 8,
    gap: 8,
  },
  foodItemContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  foodItemContent: {
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  foodItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  foodIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  foodTextContainer: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  foodPortion: {
    fontSize: 12,
  },
  macroIndicators: {
    flexDirection: "row",
    gap: 8,
  },
  macroIndicator: {
    alignItems: "center",
  },
  macroIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  macroIconText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  macroValue: {
    fontSize: 10,
  },
  emptyContainer: {
    marginVertical: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  emptyGradient: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  addButtonContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
    zIndex: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
});
