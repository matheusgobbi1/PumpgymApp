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
}

const { width } = Dimensions.get("window");

export default function MealCard({
  meal,
  foods,
  mealTotals,
  index,
  colors,
  onPress,
}: MealCardProps) {
  const router = useRouter();

  return (
    <MotiView
      style={[styles.mealCard, { backgroundColor: colors.light }]}
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", delay: index * 100 }}
    >
      <TouchableOpacity
        style={styles.mealContent}
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

        {foods.length > 0 ? (
          <View style={styles.foodsList}>
            {foods.map((food) => (
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
            Nenhum alimento adicionado
          </Text>
        )}

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
      </TouchableOpacity>
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
  foodItem: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
    marginVertical: 12,
  },
  addButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
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
});
