import React, { useState, useCallback, memo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  UIManager,
  LayoutAnimation,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Food, useMeals } from "../../context/MealContext";
import * as Haptics from "expo-haptics";
import { Swipeable } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useNutrition } from "../../context/NutritionContext";

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
  showCopyOption?: boolean;
  // Novas props para gerenciamento externo de modais
  setModalInfo: (info: any) => void;
}

const { width } = Dimensions.get("window");

// Habilitar LayoutAnimation para Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const MealCardComponent = ({
  meal,
  foods,
  mealTotals,
  index,
  onPress,
  onDeleteFood,
  onDeleteMeal,
  showCopyOption = false,
  setModalInfo,
}: MealCardProps) => {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { meals, selectedDate, copyMealFromDate } = useMeals();
  const userId = user?.uid || "no-user";
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  const { t } = useTranslation();
  const { nutritionInfo } = useNutrition();

  // Removendo os estados de modal daqui, já que serão gerenciados no componente pai
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [selectedSourceDate, setSelectedSourceDate] = useState<string>("");

  // Estado para rastrear o Swipeable atualmente aberto
  const [activeSwipeable, setActiveSwipeable] = useState<string | null>(null);

  // Efeito para limpar as referências quando o componente é desmontado
  useEffect(() => {
    return () => {
      // Fechar todos os swipeables quando o componente for desmontado
      Array.from(swipeableRefs.current.entries()).forEach(([_, swipeable]) => {
        if (swipeable) {
          swipeable.close();
        }
      });
      // Limpar as referências
      swipeableRefs.current.clear();
    };
  }, []);

  // Função para fechar todos os Swipeables exceto o ativo
  const closeOtherSwipeables = useCallback((currentId: string) => {
    Array.from(swipeableRefs.current.entries()).forEach(([id, swipeable]) => {
      if (id !== currentId && swipeable) {
        swipeable.close();
      }
    });
  }, []);

  // Função para lidar com o swipe aberto
  const handleSwipeableOpen = useCallback(
    (foodId: string) => {
      setActiveSwipeable(foodId);
      closeOtherSwipeables(foodId);
    },
    [closeOtherSwipeables]
  );

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
    // Usar requestAnimationFrame para desacoplar do thread principal
    requestAnimationFrame(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });
  }, []);

  // Função para navegar para a tela de detalhes do alimento para edição
  const navigateToFoodDetails = useCallback(
    (food: Food) => {
      handleHapticFeedback();

      // Limpar o estado do swipeable ativo
      setActiveSwipeable(null);

      // Navegar para a tela de detalhes do alimento com os dados do alimento
      router.push({
        pathname: "/(add-food)/food-details",
        params: {
          mealId: meal.id,
          mealName: meal.name,
          mealColor: meal.color,
          isFromHistory: "true",
          foodName: food.name,
          calories: food.calories.toString(),
          protein: food.protein.toString(),
          carbs: food.carbs.toString(),
          fat: food.fat.toString(),
          portion: food.portion.toString(),
          foodId: food.id,
          mode: "edit",
          fiber: food.fiber?.toString() || "",
        },
      });
    },
    [router, meal.id, meal.name, meal.color, handleHapticFeedback]
  );

  // Função para renderizar as ações de deslize à esquerda (editar)
  const renderLeftActions = useCallback(
    (food: Food) => (
      <View style={styles.swipeActionContainer}>
        <TouchableOpacity
          style={[
            styles.swipeAction,
            styles.swipeActionLeft,
            { backgroundColor: colors.primary + "CC" },
          ]}
          onPress={() => {
            // Fechar o swipeable após a ação
            if (swipeableRefs.current.has(food.id)) {
              swipeableRefs.current.get(food.id)?.close();
            }
            navigateToFoodDetails(food);
          }}
        >
          <Ionicons name="create-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    ),
    [colors.primary, navigateToFoodDetails]
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

            // Limpar qualquer swipeable aberto
            if (activeSwipeable && swipeableRefs.current.has(activeSwipeable)) {
              swipeableRefs.current.get(activeSwipeable)?.close();
              setActiveSwipeable(null);
            }

            // Chamar a função que mostrará o modal no componente pai
            setModalInfo({
              type: "deleteMeal",
              mealId: meal.id,
              mealName: meal.name,
              visible: true,
              // Incluir callback para limpeza após exclusão
              onSuccess: () => {
                // Limpar todas as referências de swipeable após excluir a refeição
                swipeableRefs.current.clear();
                setActiveSwipeable(null);
              },
            });
          }}
        >
          <Ionicons name="trash-outline" size={22} color="white" />
          <Text style={styles.swipeActionText}>{t("common.delete")}</Text>
        </TouchableOpacity>
      </View>
    );
  }, [
    colors.danger,
    handleHapticFeedback,
    meal.id,
    meal.name,
    onDeleteMeal,
    setModalInfo,
    t,
    activeSwipeable,
  ]);

  // Função para renderizar as ações de deslize à direita (excluir)
  const renderRightActions = useCallback(
    (foodId: string) => (
      <View style={styles.swipeActionContainer}>
        <TouchableOpacity
          style={[
            styles.swipeAction,
            styles.swipeActionRight,
            { backgroundColor: colors.danger + "CC" },
          ]}
          onPress={() => {
            handleHapticFeedback();

            // Fechar o swipeable após a ação
            if (swipeableRefs.current.has(foodId)) {
              swipeableRefs.current.get(foodId)?.close();
            }

            // Chamar a função que mostrará o modal no componente pai
            setModalInfo({
              type: "deleteFood",
              foodId: foodId,
              mealId: meal.id,
              visible: true,
              // Incluir callback para limpeza após exclusão
              onSuccess: () => {
                // Limpar a referência do swipeable excluído
                if (swipeableRefs.current.has(foodId)) {
                  swipeableRefs.current.delete(foodId);
                }
                // Limpar o estado ativo se for o mesmo que estamos excluindo
                if (activeSwipeable === foodId) {
                  setActiveSwipeable(null);
                }
              },
            });
          }}
        >
          <Ionicons name="trash-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    ),
    [
      colors.danger,
      handleHapticFeedback,
      meal.id,
      setModalInfo,
      activeSwipeable,
    ]
  );

  // Função auxiliar para formatar a descrição da porção de forma mais natural
  const formatPortionDescription = useCallback(
    (food: Food) => {
      // Se já temos uma descrição de porção formatada, usar
      if (food.portionDescription) {
        // Verificar se é um formato de tipo "2x 50g" e se o alimento parece ser baseado em unidades
        const isMultipleFormat = food.portionDescription.includes("x ");
        const foodName = food.name.toLowerCase();
        const isCommonUnitFood =
          foodName.includes("ovo") ||
          foodName.includes("cookie") ||
          foodName.includes("banana") ||
          foodName.includes("maçã") ||
          foodName.includes("maca") ||
          foodName.includes("pão") ||
          foodName.includes("pera") ||
          foodName.includes("bolacha") ||
          foodName.includes("fatia") ||
          foodName.includes("unidade");

        // Se for um formato "2x algo"
        if (isMultipleFormat) {
          // Extrair o multiplicador (número antes do 'x')
          const multiplier = parseFloat(food.portionDescription.split("x ")[0]);
          const restOfDescription = food.portionDescription.split("x ")[1];

          // Se for um alimento baseado em unidades
          if (isCommonUnitFood) {
            // Determinar a unidade baseada no nome do alimento
            let unitName = "unidade";
            if (foodName.includes("fatia")) unitName = "fatia";
            else if (foodName.includes("pão")) unitName = "unidade";

            // Retornar formato natural: "2 unidades" em vez de "2x 50g"
            return `${multiplier} ${unitName}${multiplier !== 1 ? "s" : ""}`;
          }
          // Se for baseado em gramas (exemplo: "2x 100g")
          else if (restOfDescription && restOfDescription.includes("g")) {
            // Extrair o valor em gramas (número antes do 'g')
            const gramsValue = parseFloat(restOfDescription.replace("g", ""));
            // Calcular o total em gramas (multiplicador x valor)
            const totalGrams = multiplier * gramsValue;
            // Retornar o total em gramas: "200g" em vez de "2x 100g"
            return `${totalGrams}g`;
          }
        }

        return food.portionDescription;
      }

      // Fallback para o formato padrão
      return `${food.portion}${t("nutrition.units.gram")}`;
    },
    [t]
  );

  const renderFoodItem = useCallback(
    (food: Food, foodIndex: number) => (
      <Swipeable
        key={`food-${food.id}-${foodIndex}`}
        renderLeftActions={() => renderLeftActions(food)}
        renderRightActions={() => renderRightActions(food.id)}
        friction={2}
        overshootRight={false}
        overshootLeft={false}
        onSwipeableOpen={() => handleSwipeableOpen(food.id)}
        ref={(ref) => {
          if (ref) {
            swipeableRefs.current.set(food.id, ref);
          } else {
            swipeableRefs.current.delete(food.id);
          }
        }}
      >
        <View
          style={[
            styles.foodItemContainer,
            { backgroundColor: colors.light },
            foodIndex === 0 && styles.firstFoodItem,
            foodIndex === foods.length - 1 && styles.lastFoodItem,
          ]}
        >
          <View
            style={styles.foodItemContent}
            onTouchStart={() => {
              // Se houver algum swipeable aberto, fechá-lo
              if (
                activeSwipeable &&
                swipeableRefs.current.has(activeSwipeable)
              ) {
                swipeableRefs.current.get(activeSwipeable)?.close();
                setActiveSwipeable(null);
              }
            }}
          >
            <View style={styles.foodItemLeft}>
              <View style={styles.foodTextContainer}>
                <Text style={[styles.foodName, { color: colors.text }]}>
                  {food.name}
                </Text>
                <Text
                  style={[styles.foodPortion, { color: colors.text + "80" }]}
                >
                  {formatPortionDescription(food)} • {food.calories}{" "}
                  {t("nutrition.units.kcal")}
                </Text>
              </View>
            </View>

            <View style={styles.macroValues}>
              <Text style={[styles.macroText, { color: colors.text + "80" }]}>
                {t("nutrition.macros.protein_short")}{" "}
                <Text style={[styles.macroNumber, { color: colors.text }]}>
                  {food.protein}
                </Text>
                {"   "}
                {t("nutrition.macros.carbs_short")}{" "}
                <Text style={[styles.macroNumber, { color: colors.text }]}>
                  {food.carbs}
                </Text>
                {"   "}
                {t("nutrition.macros.fat_short")}{" "}
                <Text style={[styles.macroNumber, { color: colors.text }]}>
                  {food.fat}
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </Swipeable>
    ),
    [
      colors,
      foods.length,
      renderLeftActions,
      renderRightActions,
      t,
      activeSwipeable,
      handleSwipeableOpen,
      formatPortionDescription,
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
          mealColor: meal.color,
        },
      });
    },
    [handleHapticFeedback, meal.id, meal.name, meal.color, router]
  );

  // Função para abrir o modal de cópia
  const openCopyModal = useCallback(() => {
    handleHapticFeedback();

    // Obter a data mais recente com esta refeição
    const mostRecentDate = getMostRecentMealDate();

    // Se houver uma data disponível, selecionar e abrir o modal
    if (mostRecentDate) {
      setSelectedSourceDate(mostRecentDate);
      // Chamar a função que mostrará o modal no componente pai
      setModalInfo({
        type: "copyMeal",
        mealId: meal.id,
        mealName: meal.name,
        sourceDate: mostRecentDate,
        visible: true,
      });
    } else {
      // Notificar o usuário se não houver refeições anteriores
      Alert.alert(
        t("nutrition.noPreviousMealTitle"),
        t("nutrition.noPreviousMeals")
      );
    }
  }, [
    getMostRecentMealDate,
    handleHapticFeedback,
    meal.id,
    meal.name,
    setModalInfo,
    t,
  ]);

  // Função para copiar refeição de uma data anterior
  const handleCopyMeal = useCallback(async () => {
    if (!selectedSourceDate) return;

    try {
      await copyMealFromDate(selectedSourceDate, meal.id, meal.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Mostrar mensagem de sucesso
      setShowCopySuccess(true);

      // Esconder a mensagem após 3 segundos
      setTimeout(() => {
        setShowCopySuccess(false);
      }, 3000);
    } catch (error) {}
  }, [selectedSourceDate, meal.id, copyMealFromDate]);

  return (
    <>
      <Swipeable
        renderRightActions={renderMealRightActions}
        friction={2}
        overshootRight={false}
        containerStyle={styles.swipeableContainer}
      >
        <View
          key={`meal-card-${meal.id}-${index}`}
          style={[
            styles.mealCard,
            {
              backgroundColor: colors.light,
              borderWidth: 1,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.mealContent}>
            <TouchableOpacity
              style={styles.headerTouchable}
              onPress={() => {
                handleHapticFeedback();
                router.push({
                  pathname: "/nutrition-recommendation-modal",
                  params: {
                    mealId: meal.id,
                    mealName: meal.name,
                    mealColor: meal.color,
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
                      {t(`nutrition.mealTypes.${meal.id}`, {
                        defaultValue: meal.name,
                      })}
                    </Text>
                    <Text style={[styles.mealCalories, { color: meal.color }]}>
                      {mealTotals.calories}{" "}
                      <Text
                        style={[
                          styles.caloriesUnit,
                          { color: colors.text + "70" },
                        ]}
                      >
                        {t("nutrition.units.kcal")}
                      </Text>
                    </Text>
                  </View>
                </View>
                <View style={styles.actionButtonsContainer}>
                  {/* Botão de cópia */}
                  {getMostRecentMealDate() && showCopyOption && (
                    <TouchableOpacity
                      style={[
                        styles.headerActionButton,
                        {
                          borderColor: meal.color,
                          backgroundColor: meal.color + "10",
                        },
                      ]}
                      onPress={() => {
                        requestAnimationFrame(() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light
                          );
                          openCopyModal();
                        });
                      }}
                    >
                      <Ionicons
                        name="copy-outline"
                        size={20}
                        color={meal.color}
                      />
                    </TouchableOpacity>
                  )}

                  {/* Novo botão de recomendação nutricional */}
                  <TouchableOpacity
                    style={[
                      styles.headerActionButton,
                      {
                        borderColor: meal.color,
                        backgroundColor: meal.color + "10",
                      },
                    ]}
                    onPress={() => {
                      requestAnimationFrame(() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push({
                          pathname: "/nutrition-recommendation-modal",
                          params: {
                            mealId: meal.id,
                            mealName: meal.name,
                            mealColor: meal.color,
                          },
                        });
                      });
                    }}
                  >
                    <Ionicons
                      name="nutrition-outline"
                      size={20}
                      color={meal.color}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.headerActionButton,
                      {
                        borderColor: meal.color,
                        backgroundColor: meal.color + "10",
                      },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      requestAnimationFrame(() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push({
                          pathname: "/(add-food)",
                          params: {
                            mealId: meal.id,
                            mealName: meal.name,
                            mealColor: meal.color,
                          },
                        });
                      });
                    }}
                  >
                    <Ionicons name="add" size={20} color={meal.color} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.foodsContainer}>
              {foods.length > 0 ? (
                <View key={`foods-list-${meal.id}`} style={styles.foodsList}>
                  {foods.map((food, foodIndex) =>
                    renderFoodItem(food, foodIndex)
                  )}
                </View>
              ) : (
                <View
                  key={`empty-container-${meal.id}`}
                  style={styles.emptyContainer}
                >
                  <LinearGradient
                    colors={[colors.light, colors.background]}
                    style={styles.emptyGradient}
                  >
                    <Ionicons
                      name="restaurant-outline"
                      size={20}
                      color={colors.text + "30"}
                      style={{ marginBottom: 6 }}
                    />
                    <Text
                      style={[styles.emptyText, { color: colors.text + "50" }]}
                    >
                      {t("nutrition.addFirstFood")}
                    </Text>
                  </LinearGradient>
                </View>
              )}

              {/* Mensagem de sucesso após copiar refeição */}
              {showCopySuccess && (
                <View
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
                    {t("nutrition.mealCopiedSuccess")}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Swipeable>
    </>
  );
};

// Aplicar memo após definir o componente
const MealCard = memo(MealCardComponent);

export default MealCard;

const styles = StyleSheet.create({
  mealCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  swipeableContainer: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
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
  mealIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  mealIcon: {
    // Estilo melhorado no container
  },
  mealTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  mealCalories: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 3,
  },
  caloriesUnit: {
    fontSize: 11,
    fontWeight: "normal",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  foodsContainer: {
    minHeight: 50,
  },
  foodsList: {
    marginVertical: 0,
    marginHorizontal: -16, // Ajustado para o novo padding do card
  },
  foodItemContainer: {
    overflow: "hidden",
  },
  firstFoodItem: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastFoodItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
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
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  foodPortion: {
    fontSize: 12,
    letterSpacing: -0.1,
  },
  macroValues: {
    alignItems: "flex-end",
  },
  macroText: {
    fontSize: 11,
    fontWeight: "400",
  },
  macroNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
  },
  emptyContainer: {
    marginVertical: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  emptyGradient: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.8,
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
  },
  swipeActionLeft: {
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  swipeActionRight: {
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  swipeActionMeal: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    backgroundColor: "rgba(255, 59, 48, 0.9)",
    paddingHorizontal: 10,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  swipeActionText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
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
    borderRadius: 12,
    marginTop: 10,
    alignSelf: "center",
  },
  successMessageText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
    letterSpacing: -0.2,
  },
});
