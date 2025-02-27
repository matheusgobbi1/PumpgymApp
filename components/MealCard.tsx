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
import { Food } from "../context/MealContext";
import * as Haptics from "expo-haptics";
import { Swipeable } from "react-native-gesture-handler";

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

  const renderFoodItem = (food: Food) => (
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
      <View
        style={[styles.foodItemContainer, { backgroundColor: colors.light }]}
      >
        <Text style={[styles.foodItem, { color: colors.text }]}>
          {food.name} - {food.portion}g
        </Text>
      </View>
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
              {mealTotals.calories} kcal
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.foodsContainer}>
          {foods.length > 0 ? (
            <View style={styles.foodsList}>{foods.map(renderFoodItem)}</View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Nenhum alimento adicionado
            </Text>
          )}
        </View>

        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={(e) => {
              e.stopPropagation();
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
  mealTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: "600",
  },
  foodsContainer: {
    minHeight: 50,
    marginBottom: 50, // Espaço para o botão
  },
  foodsList: {
    marginVertical: 8,
  },
  foodItem: {
    fontSize: 14,
    opacity: 0.8,
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
    marginVertical: 12,
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
  },
  foodItemContainer: {
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
});
