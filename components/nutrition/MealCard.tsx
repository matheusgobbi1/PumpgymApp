import React, { useState, useEffect } from "react";
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
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";

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
  onPress: () => void;
  onDeleteFood: (foodId: string) => Promise<void>;
  onDeleteMeal?: (mealId: string) => Promise<void>;
}

const { width } = Dimensions.get("window");

export default function MealCard({
  meal,
  foods,
  mealTotals,
  index,
  onPress,
  onDeleteFood,
  onDeleteMeal,
}: MealCardProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const userId = user?.uid || 'no-user';
  
  // Efeito para forçar a re-renderização quando o tema mudar ou o usuário mudar
  useEffect(() => {
    // Não é necessário fazer nada aqui, o React já vai re-renderizar quando as props mudarem
  }, [theme, userId, foods]);

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

  // Cores dos macronutrientes usando as cores do tema
  const proteinColor = colors.success || "#4CAF50"; // Verde
  
  const carbsColor = colors.primary || "#2196F3";   // Azul
  const fatColor = colors.danger || "#FF3B30";     // Vermelho
  

  // Função para navegar para a tela de detalhes do alimento para edição
  const navigateToFoodDetails = (food: Food) => {
    handleHapticFeedback();
    
    // Navegar para a tela de detalhes do alimento com os dados do alimento
    router.push({
      pathname: "/(add-food)/food-details",
      params: {
        mealId: meal.id,
        mealName: meal.name,
        isFromHistory: "true",
        foodName: food.name,
        calories: food.calories.toString(),
        protein: food.protein.toString(),
        carbs: food.carbs.toString(),
        fat: food.fat.toString(),
        portion: food.portion.toString(),
        foodId: food.id,
        mode: 'edit'
      },
    });
  };

  // Função para renderizar as ações de deslize à esquerda (editar)
  const renderLeftActions = (food: Food) => (
    <View style={styles.swipeActionContainer}>
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: colors.primary + "CC" }]}
        onPress={() => navigateToFoodDetails(food)}
      >
        <Ionicons name="create-outline" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  // Função para renderizar as ações de deslize à direita para o card de refeição
  const renderMealRightActions = () => {
    if (!onDeleteMeal) return null;
    
    return (
      <View style={styles.swipeActionContainer}>
        <TouchableOpacity
          style={[styles.swipeActionMeal, { backgroundColor: colors.danger + "E6" }]}
          onPress={async () => {
            handleHapticFeedback();
            if (onDeleteMeal) {
              await onDeleteMeal(meal.id);
            }
          }}
        >
          <Ionicons name="trash-outline" size={22} color="white" />
          <Text style={styles.swipeActionText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Função para renderizar as ações de deslize à direita (excluir)
  const renderRightActions = (foodId: string) => (
    <View style={styles.swipeActionContainer}>
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: colors.danger + "CC" }]}
        onPress={async () => {
          handleHapticFeedback();
          await onDeleteFood(foodId);
        }}
      >
        <Ionicons name="trash-outline" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderFoodItem = (food: Food, foodIndex: number) => (
    <Swipeable
      key={`food-${food.id}-${foodIndex}`}
      renderRightActions={() => renderRightActions(food.id)}
      renderLeftActions={() => renderLeftActions(food)}
      friction={2}
      overshootRight={false}
      overshootLeft={false}
    >
      <Animated.View
        entering={FadeInRight.delay(foodIndex * 100).duration(300)}
        style={[
          styles.foodItemContainer, 
          { backgroundColor: colors.light },
          foodIndex === 0 && styles.firstFoodItem,
          foodIndex === foods.length - 1 && styles.lastFoodItem
        ]}
      >
        <View style={styles.foodItemContent}>
          <View style={styles.foodItemLeft}>
            <View style={styles.foodTextContainer}>
              <Text style={[styles.foodName, { color: colors.text }]}>
                {food.name}
              </Text>
              <Text style={[styles.foodPortion, { color: colors.text + "80" }]}>
                {food.portion}g • {food.calories} kcal
              </Text>
            </View>
          </View>

          <View style={styles.macroIndicators}>
            {/* Proteína */}
            <View style={styles.macroIndicator}>
              <View style={[styles.macroBar, { backgroundColor: proteinColor }]} />
              <Text style={[styles.macroValue, { color: colors.text }]}>
                <Text style={[styles.macroLabel, { color: colors.text + "99" }]}>P </Text>
                {food.protein}
              </Text>
            </View>

            {/* Carboidratos */}
            <View style={styles.macroIndicator}>
              <View style={[styles.macroBar, { backgroundColor: carbsColor }]} />
              <Text style={[styles.macroValue, { color: colors.text }]}>
                <Text style={[styles.macroLabel, { color: colors.text + "99" }]}>C </Text>
                {food.carbs}
              </Text>
            </View>

            {/* Gorduras */}
            <View style={styles.macroIndicator}>
              <View style={[styles.macroBar, { backgroundColor: fatColor }]} />
              <Text style={[styles.macroValue, { color: colors.text }]}>
                <Text style={[styles.macroLabel, { color: colors.text + "99" }]}>G </Text>
                {food.fat}
              </Text>
            </View>
          </View>
        </View>
        {foodIndex < foods.length - 1 && (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
      </Animated.View>
    </Swipeable>
  );

  return (
    <Swipeable
      renderRightActions={renderMealRightActions}
      friction={2}
      overshootRight={false}
      containerStyle={styles.swipeableContainer}
    >
      <MotiView
        key={`meal-card-${meal.id}-${index}`}
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
                  size={18}
                  color={colors.tint}
                  style={styles.mealIcon}
                />
                <View>
                  <Text style={[styles.mealTitle, { color: colors.text }]}>
                    {meal.name}
                  </Text>
                  {foods.length > 0 && (
                    <Text
                      style={[styles.foodCount, { color: colors.text + "70" }]}
                    >
                      {foods.length}{" "}
                      {foods.length === 1 ? "alimento" : "alimentos"}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.mealCaloriesContainer}>
                <Text style={[styles.mealCalories, { color: colors.tint }]}>
                  {mealTotals.calories}
                </Text>
                <Text
                  style={[styles.caloriesUnit, { color: colors.text + "70" }]}
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
                  { backgroundColor: proteinColor },
                  { width: `${proteinPercentage}%` },
                ]}
              />
              <View
                style={[
                  styles.macroProgressBar,
                  { backgroundColor: carbsColor },
                  { width: `${carbsPercentage}%` },
                ]}
              />
              <View
                style={[
                  styles.macroProgressBar,
                  { backgroundColor: fatColor },
                  { width: `${fatPercentage}%` },
                ]}
              />
            </View>
          )}

          <View style={styles.foodsContainer}>
            {foods.length > 0 ? (
              <View key={`foods-list-${meal.id}`} style={styles.foodsList}>
                {foods.map((food, foodIndex) => renderFoodItem(food, foodIndex))}
              </View>
            ) : (
              <MotiView
                key={`empty-container-${meal.id}`}
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: "timing", duration: 500 }}
                style={styles.emptyContainer}
              >
                <LinearGradient
                  colors={[colors.light, colors.background]}
                  style={styles.emptyGradient}
                >
                  <Text style={[styles.emptyText, { color: colors.text + "50" }]}>
                    Adicione seu primeiro alimento
                  </Text>
                </LinearGradient>
              </MotiView>
            )}
          </View>

          <View style={styles.addButtonContainer}>
            <TouchableOpacity
              style={[styles.addButton, { borderColor: colors.tint }]}
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
              <Ionicons name="add" size={20} color={colors.tint} />
            </TouchableOpacity>
          </View>
        </View>
      </MotiView>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  mealCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  swipeableContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  mealContent: {
    padding: 20,
    paddingBottom: 20,
  },
  headerTouchable: {
    marginBottom: 14,
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
  mealIcon: {
    marginRight: 12,
  },
  mealTitle: {
    fontSize: 16,
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
    fontSize: 18,
    fontWeight: "600",
  },
  caloriesUnit: {
    fontSize: 11,
    marginTop: 2,
  },
  macroProgressContainer: {
    height: 3,
    flexDirection: "row",
    borderRadius: 1.5,
    overflow: "hidden",
    marginBottom: 18,
  },
  macroProgressBar: {
    height: "100%",
  },
  foodsContainer: {
    minHeight: 50,
    marginBottom: 50, // Espaço para o botão
  },
  foodsList: {
    marginVertical: 0,
    marginHorizontal: -20, // Estender além do padding do card
  },
  foodItemContainer: {
    overflow: "hidden",
  },
  firstFoodItem: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  lastFoodItem: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  foodItemContent: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  foodItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  foodTextContainer: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  foodPortion: {
    fontSize: 11,
  },
  macroIndicators: {
    flexDirection: "row",
    gap: 20,
  },
  macroIndicator: {
    alignItems: "center",
    width: 32,
  },
  macroBar: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  macroValue: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  emptyContainer: {
    marginVertical: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  emptyGradient: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  addButtonContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
    zIndex: 1,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  swipeActionContainer: {
    height: "100%",
    justifyContent: "center",
    overflow: "hidden",
  },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    height: "100%",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  swipeActionMeal: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    backgroundColor: "rgba(255, 59, 48, 0.9)",
    paddingHorizontal: 10,
  },
  swipeActionText: {
    color: "white",
    fontSize: 10,
    marginTop: 4,
  },
  separator: {
    height: 1,
    opacity: 0.3,
    marginHorizontal: 16,
  },
});
