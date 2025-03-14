import React, { useState, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useRouter } from "expo-router";
import { Food, useMeals } from "../../context/MealContext";
import * as Haptics from "expo-haptics";
import { Swipeable } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";
import ConfirmationModal from "../ui/ConfirmationModal";

interface MealCardProps {
  meal: {
    id: string;
    name: string;
    icon: string;
    color: string;
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
  refreshKey?: number;
  showCopyOption?: boolean;
}

const { width } = Dimensions.get("window");

const MealCardComponent = ({
  meal,
  foods,
  mealTotals,
  index,
  onPress,
  onDeleteFood,
  onDeleteMeal,
  refreshKey,
  showCopyOption = false,
}: MealCardProps) => {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { meals, selectedDate, copyMealFromDate } = useMeals();
  const userId = user?.uid || "no-user";

  // Estados para controlar os modais de confirmação
  const [showDeleteMealModal, setShowDeleteMealModal] = useState(false);
  const [showDeleteFoodModal, setShowDeleteFoodModal] = useState(false);
  const [showCopyMealModal, setShowCopyMealModal] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");
  const [selectedSourceDate, setSelectedSourceDate] = useState<string>("");
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Função para obter datas anteriores que têm esta refeição
  const getPreviousDatesWithMeal = useCallback(() => {
    if (!meals) return [];

    // Filtrar datas anteriores à data selecionada
    return Object.keys(meals)
      .filter((date) => {
        // Verificar se a data é anterior à data selecionada
        return (
          date < selectedDate &&
          // Verificar se a refeição existe nesta data
          meals[date]?.[meal.id] &&
          // Verificar se a refeição tem alimentos
          meals[date][meal.id].length > 0
        );
      })
      .sort((a, b) => b.localeCompare(a)); // Ordenar por data decrescente (mais recente primeiro)
  }, [meals, selectedDate, meal.id]);

  // Função para obter a data mais recente com esta refeição
  const getMostRecentMealDate = useCallback(() => {
    const dates = getPreviousDatesWithMeal();
    return dates.length > 0 ? dates[0] : "";
  }, [getPreviousDatesWithMeal]);

  const handleHapticFeedback = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Função para calcular a porcentagem de cada macronutriente
  const calculateMacroPercentage = useCallback(
    (macro: number, total: number) => {
      if (!total) return 0;
      return (macro / total) * 100;
    },
    []
  );

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
  const carbsColor = colors.primary || "#2196F3"; // Azul
  const fatColor = colors.danger || "#FF3B30"; // Vermelho

  // Função para navegar para a tela de detalhes do alimento para edição
  const navigateToFoodDetails = useCallback(
    (food: Food) => {
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
          mode: "edit",
        },
      });
    },
    [router, meal.id, meal.name, handleHapticFeedback]
  );

  // Função para renderizar as ações de deslize à esquerda (editar)
  const renderLeftActions = useCallback(
    (food: Food) => (
      <View style={styles.swipeActionContainer}>
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: meal.color + "CC" }]}
          onPress={() => navigateToFoodDetails(food)}
        >
          <Ionicons name="create-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    ),
    [meal.color, navigateToFoodDetails]
  );

  // Função para renderizar as ações de deslize à direita para o card de refeição
  const renderMealRightActions = useCallback(() => {
    if (!onDeleteMeal) return null;

    return (
      <View style={styles.swipeActionContainer}>
        <TouchableOpacity
          style={[
            styles.swipeActionMeal,
            { backgroundColor: colors.danger + "E6" },
          ]}
          onPress={() => {
            handleHapticFeedback();
            // Pequeno timeout para melhorar a responsividade
            setTimeout(() => {
              setShowDeleteMealModal(true);
            }, 10);
          }}
        >
          <Ionicons name="trash-outline" size={22} color="white" />
          <Text style={styles.swipeActionText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    );
  }, [colors.danger, handleHapticFeedback, onDeleteMeal]);

  // Função para renderizar as ações de deslize à direita (excluir)
  const renderRightActions = useCallback(
    (foodId: string) => (
      <View style={styles.swipeActionContainer}>
        <TouchableOpacity
          style={[
            styles.swipeAction,
            { backgroundColor: colors.danger + "CC" },
          ]}
          onPress={() => {
            handleHapticFeedback();
            // Definir o ID do alimento selecionado primeiro e depois mostrar o modal
            setSelectedFoodId(foodId);
            // Pequeno timeout para garantir que o ID foi definido antes de mostrar o modal
            setTimeout(() => {
              setShowDeleteFoodModal(true);
            }, 10);
          }}
        >
          <Ionicons name="trash-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    ),
    [colors.danger, handleHapticFeedback]
  );

  const renderFoodItem = useCallback(
    (food: Food, foodIndex: number) => (
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
            foodIndex === foods.length - 1 && styles.lastFoodItem,
          ]}
        >
          <View style={styles.foodItemContent}>
            <View style={styles.foodItemLeft}>
              <View style={styles.foodTextContainer}>
                <Text style={[styles.foodName, { color: colors.text }]}>
                  {food.name}
                </Text>
                <Text
                  style={[styles.foodPortion, { color: colors.text + "80" }]}
                >
                  {food.portion}g • {food.calories} kcal
                </Text>
              </View>
            </View>

            <View style={styles.macroIndicators}>
              {/* Proteína */}
              <View style={styles.macroIndicator}>
                <View
                  style={[styles.macroBar, { backgroundColor: proteinColor }]}
                />
                <Text style={[styles.macroValue, { color: colors.text }]}>
                  <Text
                    style={[styles.macroLabel, { color: colors.text + "99" }]}
                  >
                    P{" "}
                  </Text>
                  {food.protein}
                </Text>
              </View>

              {/* Carboidratos */}
              <View style={styles.macroIndicator}>
                <View
                  style={[styles.macroBar, { backgroundColor: carbsColor }]}
                />
                <Text style={[styles.macroValue, { color: colors.text }]}>
                  <Text
                    style={[styles.macroLabel, { color: colors.text + "99" }]}
                  >
                    C{" "}
                  </Text>
                  {food.carbs}
                </Text>
              </View>

              {/* Gorduras */}
              <View style={styles.macroIndicator}>
                <View
                  style={[styles.macroBar, { backgroundColor: fatColor }]}
                />
                <Text style={[styles.macroValue, { color: colors.text }]}>
                  <Text
                    style={[styles.macroLabel, { color: colors.text + "99" }]}
                  >
                    G{" "}
                  </Text>
                  {food.fat}
                </Text>
              </View>
            </View>
          </View>
          {foodIndex < foods.length - 1 && (
            <View
              style={[styles.separator, { backgroundColor: colors.border }]}
            />
          )}
        </Animated.View>
      </Swipeable>
    ),
    [
      colors,
      foods.length,
      renderLeftActions,
      renderRightActions,
      proteinColor,
      carbsColor,
      fatColor,
    ]
  );

  const handleAddFood = useCallback(
    (e: any) => {
      e.stopPropagation();
      handleHapticFeedback();
      router.push({
        pathname: "/(add-food)",
        params: {
          mealId: meal.id,
          mealName: meal.name,
        },
      });
    },
    [handleHapticFeedback, meal.id, meal.name, router]
  );

  const handleDeleteMeal = useCallback(async () => {
    if (onDeleteMeal) {
      try {
        await onDeleteMeal(meal.id);
      } catch (error) {
        console.error("Erro ao excluir refeição:", error);
      }
    }
    setShowDeleteMealModal(false);
  }, [meal.id, onDeleteMeal]);

  const handleDeleteFood = useCallback(async () => {
    if (selectedFoodId) {
      try {
        await onDeleteFood(selectedFoodId);
      } catch (error) {
        console.error("Erro ao excluir alimento:", error);
      }
    }
    setShowDeleteFoodModal(false);
    setSelectedFoodId("");
  }, [selectedFoodId, onDeleteFood]);

  // Função para abrir o modal de cópia
  const openCopyModal = useCallback(() => {
    handleHapticFeedback();

    // Obter a data mais recente com esta refeição
    const mostRecentDate = getMostRecentMealDate();

    // Se houver uma data disponível, selecionar e abrir o modal
    if (mostRecentDate) {
      setSelectedSourceDate(mostRecentDate);
      setShowCopyMealModal(true);
    } else {
      // Notificar o usuário se não houver refeições anteriores
      Alert.alert(
        "Nenhuma refeição anterior",
        "Não há refeições anteriores para copiar."
      );
    }
  }, [getMostRecentMealDate, handleHapticFeedback]);

  // Função para copiar refeição de uma data anterior
  const handleCopyMeal = useCallback(async () => {
    if (!selectedSourceDate) return;

    try {
      await copyMealFromDate(selectedSourceDate, meal.id, meal.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCopyMealModal(false);

      // Mostrar mensagem de sucesso
      setShowCopySuccess(true);

      // Esconder a mensagem após 3 segundos
      setTimeout(() => {
        setShowCopySuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Erro ao copiar refeição:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [selectedSourceDate, meal.id, copyMealFromDate]);

  // Função para formatar a data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    // Formatar a data normalmente
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <>
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
              onPress={() => {
                handleHapticFeedback();
                router.push({
                  pathname: "/(add-food)",
                  params: {
                    mealId: meal.id,
                    mealName: meal.name,
                  },
                });
              }}
              activeOpacity={0.7}
            >
              <View style={styles.mealHeader}>
                <View style={styles.mealTitleContainer}>
                  <View
                    style={[
                      styles.mealIconContainer,
                      { backgroundColor: meal.color + "20" },
                    ]}
                  >
                    <Ionicons
                      name={meal.icon as any}
                      size={18}
                      color={meal.color}
                      style={styles.mealIcon}
                    />
                  </View>
                  <View>
                    <Text style={[styles.mealTitle, { color: colors.text }]}>
                      {meal.name}
                    </Text>
                    {foods.length > 0 && (
                      <Text
                        style={[
                          styles.foodCount,
                          { color: colors.text + "70" },
                        ]}
                      >
                        {foods.length}{" "}
                        {foods.length === 1 ? "alimento" : "alimentos"}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.mealCaloriesContainer}>
                  <Text style={[styles.mealCalories, { color: meal.color }]}>
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
              <View
                style={[
                  styles.macroProgressContainer,
                  { backgroundColor: colors.border },
                ]}
              >
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
                  {foods.map((food, foodIndex) =>
                    renderFoodItem(food, foodIndex)
                  )}
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
                    <Text
                      style={[styles.emptyText, { color: colors.text + "50" }]}
                    >
                      Adicione seu primeiro alimento
                    </Text>
                  </LinearGradient>
                </MotiView>
              )}

              {/* Mensagem de sucesso após copiar refeição */}
              {showCopySuccess && (
                <MotiView
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0, translateY: 10 }}
                  style={[
                    styles.successMessage,
                    { backgroundColor: meal.color + "20" },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={meal.color}
                  />
                  <Text
                    style={[styles.successMessageText, { color: meal.color }]}
                  >
                    Refeição copiada com sucesso!
                  </Text>
                </MotiView>
              )}
            </View>

            <View style={styles.addButtonContainer}>
              {getMostRecentMealDate() && showCopyOption && (
                <TouchableOpacity
                  style={[
                    styles.copyButton,
                    {
                      borderColor: meal.color,
                      backgroundColor: meal.color + "10",
                    },
                  ]}
                  onPress={openCopyModal}
                >
                  <Ionicons name="copy-outline" size={20} color={meal.color} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.addButton,
                  {
                    borderColor: meal.color,
                    backgroundColor: meal.color + "10",
                  },
                ]}
                onPress={handleAddFood}
              >
                <Ionicons name="add" size={20} color={meal.color} />
              </TouchableOpacity>
            </View>
          </View>
        </MotiView>
      </Swipeable>

      {/* Modal de confirmação para excluir refeição */}
      <ConfirmationModal
        visible={showDeleteMealModal}
        title="Excluir Refeição"
        message={`Tem certeza que deseja excluir a refeição "${meal.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmType="danger"
        icon="trash-outline"
        onConfirm={handleDeleteMeal}
        onCancel={() => setShowDeleteMealModal(false)}
      />

      {/* Modal de confirmação para excluir alimento */}
      <ConfirmationModal
        visible={showDeleteFoodModal}
        title="Excluir Alimento"
        message="Tem certeza que deseja excluir este alimento? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmType="danger"
        icon="trash-outline"
        onConfirm={handleDeleteFood}
        onCancel={() => {
          setShowDeleteFoodModal(false);
          setSelectedFoodId("");
        }}
      />

      {/* Modal para copiar refeição de data anterior */}
      <ConfirmationModal
        visible={showCopyMealModal}
        title={`Copiar ${meal.name} do dia anterior`}
        message={
          selectedSourceDate
            ? `Deseja copiar a refeição de ${formatDate(selectedSourceDate)}?`
            : "Não há refeições anteriores para copiar."
        }
        confirmText="Copiar"
        cancelText="Cancelar"
        confirmType="primary"
        icon="copy-outline"
        onConfirm={handleCopyMeal}
        onCancel={() => setShowCopyMealModal(false)}
      />
    </>
  );
};

// Aplicar memo após definir o componente
const MealCard = memo(MealCardComponent);

export default MealCard;

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
  mealIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  mealIcon: {
    // Remover marginRight pois agora está no container
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
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  copyButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "transparent",
    borderColor: "transparent",
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
  successMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: "center",
  },
  successMessageText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
});
