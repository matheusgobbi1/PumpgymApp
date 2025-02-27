import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { Food } from "../context/MealContext";

interface MealDetailsSheetProps {
  meal: {
    id: string;
    name: string;
    icon: string;
  };
  mealTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  foods: Food[];
  colors: any;
  onDismiss: () => void;
}

const { width } = Dimensions.get("window");

export default function MealDetailsSheet({
  meal,
  mealTotals,
  foods,
  colors,
  onDismiss,
}: MealDetailsSheetProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name={meal.icon as any} size={32} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>{meal.name}</Text>
      </View>

      <View style={styles.macroCards}>
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 500, delay: 100 }}
          style={[styles.macroCard, { backgroundColor: colors.light }]}
        >
          <Text style={[styles.macroValue, { color: colors.text }]}>
            {mealTotals.calories}
          </Text>
          <Text style={[styles.macroLabel, { color: colors.text }]}>
            Calorias
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 500, delay: 200 }}
          style={[styles.macroCard, { backgroundColor: colors.light }]}
        >
          <Text style={[styles.macroValue, { color: colors.text }]}>
            {mealTotals.protein}g
          </Text>
          <Text style={[styles.macroLabel, { color: colors.text }]}>
            Proteína
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 500, delay: 300 }}
          style={[styles.macroCard, { backgroundColor: colors.light }]}
        >
          <Text style={[styles.macroValue, { color: colors.text }]}>
            {mealTotals.carbs}g
          </Text>
          <Text style={[styles.macroLabel, { color: colors.text }]}>
            Carboidratos
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 500, delay: 400 }}
          style={[styles.macroCard, { backgroundColor: colors.light }]}
        >
          <Text style={[styles.macroValue, { color: colors.text }]}>
            {mealTotals.fat}g
          </Text>
          <Text style={[styles.macroLabel, { color: colors.text }]}>
            Gorduras
          </Text>
        </MotiView>
      </View>

      <View style={styles.foodListContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Alimentos
        </Text>
        <ScrollView style={styles.foodListScroll}>
          {foods.map((food, index) => (
            <MotiView
              key={food.id}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: index * 100 }}
              style={[styles.foodListItem, { backgroundColor: colors.light }]}
            >
              <View>
                <Text style={[styles.foodListItemName, { color: colors.text }]}>
                  {food.name}
                </Text>
                <Text
                  style={[
                    styles.foodListItemPortion,
                    { color: colors.text + "80" },
                  ]}
                >
                  {food.portion}g
                </Text>
              </View>
              <Text
                style={[styles.foodListItemCalories, { color: colors.text }]}
              >
                {food.calories} kcal
              </Text>
            </MotiView>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  macroCards: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  macroCard: {
    flex: 1,
    minWidth: width / 2 - 26,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  macroValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  foodListContainer: {
    flex: 1,
  },
  foodListScroll: {
    flex: 1,
  },
  foodListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  foodListItemName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  foodListItemPortion: {
    fontSize: 14,
  },
  foodListItemCalories: {
    fontSize: 16,
    fontWeight: "600",
  },
});
