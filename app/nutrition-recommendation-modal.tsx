import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useNutrition } from "../context/NutritionContext";
import { useMeals } from "../context/MealContext";
import Colors from "../constants/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import NutritionRecommendationCard from "../components/nutrition/NutritionRecommendationCard";
import FoodSuggestionCard from "../components/nutrition/FoodSuggestionCard";
import {
  generateMealDistribution,
  MealNutritionRecommendation,
} from "../utils/nutritionDistributionAlgorithm";
import { useTranslation } from "react-i18next";
import {
  getFoodSuggestionsByMealType,
  getMealSuggestionsByType,
  FoodSuggestion,
  MealSuggestion,
  adjustPortionsForNutrientNeeds,
} from "../data/foodSuggestionDatabase";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Food } from "../context/MealContext";
import { BlurView } from "expo-blur";
import { Print } from "expo-print";
import { FileSystem } from "expo-file-system";
import { Sharing } from "expo-sharing";
import { AppState } from "react-native";

// Interface para meal food
interface MealFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: number;
  unit: string;
  time: string;
  portionDescription: string;
}

// Interface para representar um item de alimento com seu original (para alternativas)
interface FoodItem {
  food: FoodSuggestion;
  portion: number;
}

// Interface para controlar seleção de alimentos e suas porções
interface SelectedFoodInfo {
  portion: number;
}

// Constantes para animação do header
const { width } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = 180;
const HEADER_MIN_HEIGHT = 55;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
const CARD_HEIGHT = 80; // Altura aproximada do card de recomendação

export default function NutritionRecommendationModal() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();
  const { mealId, mealName, mealColor } = useLocalSearchParams<{
    mealId: string;
    mealName: string;
    mealColor: string;
  }>();

  const { nutritionInfo } = useNutrition();
  const {
    mealTypes,
    meals,
    selectedDate,
    addFoodToMeal,
    updateFoodInMeal,
    removeFoodFromMeal,
  } = useMeals();

  // Referência e estado para animação do scroll
  const scrollY = useRef(new Animated.Value(0)).current;

  const [loading, setLoading] = useState(true);
  const [loadingMealSuggestions, setLoadingMealSuggestions] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipOpacity = useState(new Animated.Value(0))[0];
  const [recommendations, setRecommendations] = useState<
    MealNutritionRecommendation[]
  >([]);
  const [selectedMealRecommendation, setSelectedMealRecommendation] =
    useState<MealNutritionRecommendation | null>(null);
  const [selectedMealSuggestion, setSelectedMealSuggestion] =
    useState<MealSuggestion | null>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<
    Record<string, SelectedFoodInfo>
  >({});
  const [addedFoods, setAddedFoods] = useState<Food[]>([]);
  // Estado para controlar a porção atualizada de cada alimento
  const [foodPortions, setFoodPortions] = useState<Record<string, number>>({});

  // Calculando os valores de animação
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.5, HEADER_SCROLL_DISTANCE * 0.7],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });

  const heroContentOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.3, HEADER_SCROLL_DISTANCE * 0.5],
    outputRange: [1, 0.3, 0],
    extrapolate: "clamp",
  });

  const heroContentTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.5],
    outputRange: [0, -20],
    extrapolate: "clamp",
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.85],
    extrapolate: "clamp",
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -3],
    extrapolate: "clamp",
  });

  // Obter os totais atuais da refeição (incluindo alimentos já adicionados)
  const getCurrentMealTotals = () => {
    if (!meals || !selectedDate || !mealId) return undefined;

    const mealFoods = meals[selectedDate]?.[mealId as string] || [];

    if (mealFoods.length === 0) return undefined;

    // Calcular totais da refeição
    return mealFoods.reduce(
      (totals, food) => {
        return {
          calories: totals.calories + food.calories,
          protein: totals.protein + food.protein,
          carbs: totals.carbs + food.carbs,
          fat: totals.fat + food.fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  // Calcular nutrientes totais dos alimentos selecionados atualmente e alimentos com porções alteradas
  const calculateSelectedFoodsTotals = useMemo(() => {
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    // Função para adicionar nutrientes de um alimento aos totais
    const addFoodToTotals = (foodId: string, portion: number) => {
      const foodItem = foodItems.find((item) => item.food.id === foodId);
      if (!foodItem) return;

      const ratio = portion / 100;
      totals.calories += Math.round(foodItem.food.nutrients.calories * ratio);
      totals.protein +=
        Math.round(foodItem.food.nutrients.protein * ratio * 10) / 10;
      totals.carbs +=
        Math.round(foodItem.food.nutrients.carbs * ratio * 10) / 10;
      totals.fat += Math.round(foodItem.food.nutrients.fat * ratio * 10) / 10;
    };

    // Para cada alimento selecionado
    Object.keys(selectedFoods).forEach((foodId) => {
      const portion = foodPortions[foodId] || selectedFoods[foodId].portion;
      addFoodToTotals(foodId, portion);
    });

    return totals;
  }, [selectedFoods, foodItems, foodPortions]);

  // Combinar totais existentes com os selecionados para preview
  const combinedTotals = useMemo(() => {
    const existingTotals = getCurrentMealTotals() || {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    return {
      calories: existingTotals.calories + calculateSelectedFoodsTotals.calories,
      protein: existingTotals.protein + calculateSelectedFoodsTotals.protein,
      carbs: existingTotals.carbs + calculateSelectedFoodsTotals.carbs,
      fat: existingTotals.fat + calculateSelectedFoodsTotals.fat,
    };
  }, [meals, selectedDate, mealId, calculateSelectedFoodsTotals]);

  // Formatar números para exibição
  const formatNumber = (value: number, isCalorie = false) => {
    if (isCalorie) {
      // Para calorias, sem casas decimais
      return Math.round(value);
    } else {
      // Para macros, uma casa decimal
      return Math.round(value * 10) / 10;
    }
  };

  // Calcular nutrientes restantes
  const getRemainingNutrients = () => {
    if (!selectedMealRecommendation) return null;

    const currentTotals = getCurrentMealTotals();
    if (!currentTotals) {
      // Se não há alimentos, todo o valor recomendado está disponível
      return {
        calories: selectedMealRecommendation.calories,
        protein: selectedMealRecommendation.protein,
        carbs: selectedMealRecommendation.carbs,
        fat: selectedMealRecommendation.fat,
      };
    }

    // Calcular o quanto ainda falta para atingir a recomendação
    return {
      calories: Math.max(
        0,
        selectedMealRecommendation.calories - currentTotals.calories
      ),
      protein: Math.max(
        0,
        selectedMealRecommendation.protein - currentTotals.protein
      ),
      carbs: Math.max(
        0,
        selectedMealRecommendation.carbs - currentTotals.carbs
      ),
      fat: Math.max(0, selectedMealRecommendation.fat - currentTotals.fat),
    };
  };

  // Carregar as recomendações quando o componente montar
  useEffect(() => {
    generateRecommendations();
  }, [mealId, nutritionInfo, mealTypes, meals, selectedDate]);

  // Carregar template de refeição ao iniciar
  useEffect(() => {
    if (mealId) {
      setLoadingMealSuggestions(true);
      try {
        // Carregar sugestões de refeições para este tipo de refeição
        // Usar o tipo de dieta do usuário para filtrar sugestões compatíveis
        const mealSuggestions = getMealSuggestionsByType(
          mealId as string,
          nutritionInfo.dietType
        );

        // Selecionar a primeira sugestão de refeição por padrão
        if (mealSuggestions.length > 0) {
          setSelectedMealSuggestion(mealSuggestions[0]);

          // Carregar mais alimentos do template para garantir variedade de macronutrientes
          const mainFoodIds = mealSuggestions[0].foods.slice(0, 5); // Aumentado de 3 para 5 alimentos

          // Verificar se temos os macronutrientes principais representados
          const allMealFoods = getFoodSuggestionsByMealType(
            mealId as string,
            nutritionInfo.dietType
          );
          const macroTypes = {
            carbs: false,
            protein: false,
            fat: false,
          };

          // Verificar se os alimentos selecionados cobrem os principais macronutrientes
          mainFoodIds.forEach((foodId) => {
            const food = allMealFoods.find((f) => f.id === foodId);
            if (food) {
              if (food.nutrients.carbs > 15) macroTypes.carbs = true;
              if (food.nutrients.protein > 15) macroTypes.protein = true;
              if (food.nutrients.fat > 10) macroTypes.fat = true;
            }
          });

          // Adicionar alimentos para macronutrientes faltantes
          let additionalFoods: string[] = [];

          // Se não tiver carboidratos e for jantar, adicione um
          if (!macroTypes.carbs && mealId === "dinner") {
            const carbFood = allMealFoods.find(
              (f) =>
                f.nutrients.carbs > 15 &&
                !mainFoodIds.includes(f.id) &&
                (f.id.includes("arroz") ||
                  f.id.includes("batata") ||
                  f.id.includes("macarrao"))
            );
            if (carbFood) additionalFoods.push(carbFood.id);
          }

          // Se não tiver gordura saudável, adicione azeite
          if (!macroTypes.fat && (mealId === "lunch" || mealId === "dinner")) {
            const fatFood = allMealFoods.find(
              (f) => f.id === "sugg_azeite" && !mainFoodIds.includes(f.id)
            );
            if (fatFood) additionalFoods.push(fatFood.id);
          }

          // Adicionar opção de iogurte desnatado para lanche da manhã e da tarde se não estiver já incluído
          if (
            (mealId === "morning_snack" || mealId === "afternoon_snack") &&
            !mainFoodIds.includes("sugg_iogurte_desnatado")
          ) {
            const iogurteDesnatado = allMealFoods.find(
              (f) => f.id === "sugg_iogurte_desnatado"
            );
            if (
              iogurteDesnatado &&
              !mainFoodIds.some((id) => id.includes("iogurte"))
            ) {
              additionalFoods.push("sugg_iogurte_desnatado");
            }
          }

          // Combinar os IDs originais com os adicionais
          const completeIds = [...mainFoodIds, ...additionalFoods];

          // Para o lanche da tarde, remover a aveia da lista
          const filteredIds =
            mealId === "afternoon_snack"
              ? completeIds.filter((id) => !id.includes("aveia"))
              : completeIds;

          // Mapear os IDs dos alimentos para os objetos FoodSuggestion
          const foodItems: FoodItem[] = filteredIds
            .map((foodId) => {
              // Buscar o alimento no banco de dados
              const food = allMealFoods.find((food) => food.id === foodId);

              if (food) {
                return {
                  food,
                  portion: food.measures[0]?.weight || 100,
                };
              }

              // Se não encontrou o alimento, retornar undefined
              return undefined as unknown as FoodItem;
            })
            .filter(Boolean); // Remover undefined

          setFoodItems(foodItems);
        }
      } catch (error) {
        // Continuamos mesmo com erro na verificação
      }
    }
  }, [mealId]);

  const generateRecommendations = () => {
    setLoading(true);
    try {
      // Verificar se a distribuição personalizada é válida para todas as refeições atuais
      let useCustomDistribution = false;
      if (nutritionInfo.customMealDistribution?.length) {
        // Verificar se todas as refeições atuais têm configuração personalizada
        const currentMealIds = new Set(mealTypes.map((meal) => meal.id));
        const configuredMealIds = new Set(
          nutritionInfo.customMealDistribution.map((dist) => dist.mealId)
        );

        // Só usar a distribuição personalizada se todas as refeições existentes tiverem configuração
        useCustomDistribution = Array.from(currentMealIds).every((id) =>
          configuredMealIds.has(id)
        );
      }

      // Gerar recomendações para todas as refeições
      const allRecommendations = generateMealDistribution(
        nutritionInfo,
        mealTypes,
        useCustomDistribution ? nutritionInfo.customMealDistribution : undefined
      );
      setRecommendations(allRecommendations);

      // Filtrar apenas a recomendação para a refeição selecionada
      const currentMealRec = allRecommendations.find(
        (rec) => rec.mealId === mealId
      );
      if (currentMealRec) {
        setSelectedMealRecommendation(currentMealRec);
      }
    } catch (error) {
      // Tratar erro silenciosamente
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Alternar seleção de alimento
  const handleToggleFood = (foodId: string, portion?: number) => {
    const newSelectedFoods = { ...selectedFoods };

    if (newSelectedFoods[foodId]) {
      // Se já está selecionado, deselecionar
      delete newSelectedFoods[foodId];

      // Também remover da lista de porções
      const newFoodPortions = { ...foodPortions };
      delete newFoodPortions[foodId];
      setFoodPortions(newFoodPortions);
    } else {
      // Se não está selecionado, adicionar
      const newPortion =
        portion ||
        foodItems.find((item) => item.food.id === foodId)?.portion ||
        100;

      newSelectedFoods[foodId] = {
        portion: newPortion,
      };

      // Atualizar também o estado de porções
      setFoodPortions((prev) => ({
        ...prev,
        [foodId]: newPortion,
      }));
    }

    setSelectedFoods(newSelectedFoods);
  };

  // Atualizar a porção de um alimento
  const handleUpdatePortion = (foodId: string, portion: number) => {
    // Atualizar o estado de porções
    setFoodPortions((prev) => ({
      ...prev,
      [foodId]: portion,
    }));

    // Se o item estiver selecionado, atualizar também no selectedFoods
    if (selectedFoods[foodId]) {
      setSelectedFoods((prev) => ({
        ...prev,
        [foodId]: {
          ...prev[foodId],
          portion,
        },
      }));
    }
  };

  // Lidar com a substituição de um alimento
  const handleReplaceFood = (oldFoodId: string, newFood: FoodSuggestion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Para alimentos sugeridos no modal
    setFoodItems((currentItems) => {
      return currentItems.map((item) => {
        // Se for o item que estamos substituindo
        if (item.food.id === oldFoodId) {
          // Usar a porção calculada pelo FoodAlternativesModal se disponível
          // ou manter a porção original do item
          const newPortion = (newFood as any).selectedPortion || item.portion;

          // Criar novo item com o alimento substituto e a porção adequada
          const newItem = {
            food: newFood,
            portion: newPortion,
          };

          // Remover da seleção se estiver selecionado
          if (selectedFoods[oldFoodId]) {
            // Criar uma cópia do estado para manipulação
            const newSelectedFoods = { ...selectedFoods };
            // Remover o alimento antigo da seleção
            delete newSelectedFoods[oldFoodId];
            // Atualizar o estado
            setSelectedFoods(newSelectedFoods);
          }

          // Atualizar o estado de porções também
          // Remover o alimento antigo
          setFoodPortions((prev) => {
            const newPortions = { ...prev };
            // Remover o alimento antigo
            delete newPortions[oldFoodId];
            // Adicionar o novo alimento com a porção
            newPortions[newFood.id] = newItem.portion;
            return newPortions;
          });

          return newItem;
        }
        return item;
      });
    });
  };

  // Aplicar alimentos selecionados à refeição
  const handleApplySelectedFoods = async () => {
    if (Object.keys(selectedFoods).length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        t("nutrition.recommendation.alert.attention"),
        t("nutrition.recommendation.alert.selectAtLeastOne")
      );
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setApplying(true);

      // Lista para controlar quais alimentos foram atualizados
      const updatedFoodIds = new Set<string>();

      // Para cada alimento selecionado
      for (const foodId of Object.keys(selectedFoods)) {
        const foodInfo = selectedFoods[foodId];
        const foodItem = foodItems.find((item) => item.food.id === foodId);

        if (!foodItem) continue;

        // Usar a porção mais atualizada (do estado foodPortions ou do selectedFoods)
        const currentPortion = foodPortions[foodId] || foodInfo.portion;

        // Verificar se o alimento deve ser medido em unidades em vez de gramas
        const measures = foodItem.food.measures || [];
        let unit = "g"; // Valor padrão em gramas
        let portionDescription = `${currentPortion}g`;

        // Verificar se há medidas baseadas em unidades
        const unitBasedMeasure = measures.find(
          (measure) =>
            measure.label.includes("unidade") ||
            measure.label.includes("fatia") ||
            measure.label.includes("pão") ||
            measure.label.includes("bife") ||
            measure.label.includes("filé") ||
            measure.label.includes("gomo") ||
            measure.label.includes("pote") ||
            measure.label.includes("cookies") ||
            measure.label.includes("bolacha")
        );

        // Definir se é baseado em unidades pela medida ou pelo tipo de alimento
        const foodName = foodItem.food.name.toLowerCase();
        const isCommonUnitFood =
          foodName.includes("ovo") ||
          foodName.includes("cookie") ||
          foodName.includes("banana") ||
          foodName.includes("maçã") ||
          foodName.includes("pão") ||
          foodName.includes("pera") ||
          foodName.includes("bolacha") ||
          foodName.includes("fatia") ||
          foodName.includes("unidade");

        const isUnitBased =
          unitBasedMeasure &&
          (foodItem.food.id.match(
            /(pao|banana|maca|ovo|pera|laranja|melancia|fatia|bife|file|cookies|bolacha|unidade)/i
          ) ||
            isCommonUnitFood);

        if (isUnitBased && unitBasedMeasure) {
          // Extrair a unidade e o peso base da medida
          const baseWeight = unitBasedMeasure.weight || 100;
          let unitName = "unidade";

          if (unitBasedMeasure.label.includes("fatia")) {
            unitName = "fatia";
          } else if (unitBasedMeasure.label.includes("pote")) {
            unitName = "pote";
          } else if (unitBasedMeasure.label.includes("gomo")) {
            unitName = "gomo";
          } else if (
            unitBasedMeasure.label.includes("cookies") ||
            unitBasedMeasure.label.includes("bolacha")
          ) {
            unitName = unitBasedMeasure.label.includes("cookies")
              ? "cookie"
              : "bolacha";
          }

          // Calcular o número de unidades
          const units = currentPortion / baseWeight;
          // Arredondar para 1 casa decimal
          const roundedUnits = Math.round(units * 10) / 10;

          // Se temos uma quantidade razoável de unidades, usar essa unidade em vez de gramas
          if (units >= 0.5 && units <= 10) {
            unit = unitName;
            // Formatar a descrição da porção de forma mais natural: "5 unidades" em vez de "5x unidade"
            portionDescription = `${roundedUnits} ${unitName}${
              roundedUnits !== 1 ? "s" : ""
            }`;
          }
        }

        // Cálculo de nutrientes com base na porção selecionada
        const ratio = currentPortion / 100;
        const mealFood: MealFood = {
          id: foodItem.food.id,
          name: foodItem.food.name,
          calories: Math.round(foodItem.food.nutrients.calories * ratio),
          protein:
            Math.round(foodItem.food.nutrients.protein * ratio * 10) / 10,
          carbs: Math.round(foodItem.food.nutrients.carbs * ratio * 10) / 10,
          fat: Math.round(foodItem.food.nutrients.fat * ratio * 10) / 10,
          portion: currentPortion,
          unit: unit,
          portionDescription: portionDescription,
          time: new Date().toISOString(),
        };

        // Verificar se já existe um alimento com nome similar
        if (mealId && meals && selectedDate) {
          const currentMealFoods =
            meals[selectedDate]?.[mealId as string] || [];

          // Simplificar os nomes para fazer comparação mais robusta
          const simplifyName = (name: string) =>
            name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .replace(
                /(grelhado|assado|cozido|frito|desnatado|integral|light)/g,
                ""
              )
              .replace(/(pós|pos|em|pó|po|flocos|flocada|farinha|farelo)/g, "")
              .replace(/(zero|diet|sem|com|lactose|glúten|gluten)/g, "")
              .replace(
                /(peito|coxa|asa|sobrecoxa|filé|file|fatia|pedaço|pedaco)/g,
                ""
              )
              .replace(
                /(unidade|unid|und|grama|porção|porcao|porçao|porçao|g)/g,
                ""
              )
              .trim();

          const simplifiedNewName = simplifyName(mealFood.name);

          // Procurar por alimento similar com uma abordagem mais flexível
          const existingFoodIndex = currentMealFoods.findIndex((food) => {
            const simplifiedExistingName = simplifyName(food.name);
            // Verifica se há sobreposição de nomes suficiente para considerar o mesmo alimento
            // Um nome deve conter pelo menos 70% do outro para ser considerado similar
            return (
              (simplifiedNewName.includes(simplifiedExistingName) &&
                simplifiedExistingName.length >=
                  simplifiedNewName.length * 0.7) ||
              (simplifiedExistingName.includes(simplifiedNewName) &&
                simplifiedNewName.length >=
                  simplifiedExistingName.length * 0.7) ||
              // Verificar também se é o mesmo ID, caso o nome seja diferente
              food.id === mealFood.id
            );
          });

          if (existingFoodIndex !== -1) {
            // Se encontrou um alimento similar, somar a porção sugerida à existente
            const existingFood = currentMealFoods[existingFoodIndex];

            // Calcular a nova porção total (soma da existente com a sugerida)
            const newTotalPortion = existingFood.portion + currentPortion;

            // Calcular o valor nutricional por 1g do alimento existente
            const existingNutrientsPerGram = {
              calories: existingFood.calories / existingFood.portion,
              protein: existingFood.protein / existingFood.portion,
              carbs: existingFood.carbs / existingFood.portion,
              fat: existingFood.fat / existingFood.portion,
            };

            // Calcular o valor nutricional por 1g do alimento sugerido
            const suggestedNutrientsPerGram = {
              calories: mealFood.calories / mealFood.portion,
              protein: mealFood.protein / mealFood.portion,
              carbs: mealFood.carbs / mealFood.portion,
              fat: mealFood.fat / mealFood.portion,
            };

            // Calcular os novos valores nutricionais totais
            // (porção existente × valores por grama existentes) + (porção sugerida × valores por grama sugeridos)
            const updatedFood = {
              ...existingFood,
              portion: newTotalPortion,
              calories: Math.round(
                existingFood.portion * existingNutrientsPerGram.calories +
                  currentPortion * suggestedNutrientsPerGram.calories
              ),
              protein:
                Math.round(
                  (existingFood.portion * existingNutrientsPerGram.protein +
                    currentPortion * suggestedNutrientsPerGram.protein) *
                    10
                ) / 10,
              carbs:
                Math.round(
                  (existingFood.portion * existingNutrientsPerGram.carbs +
                    currentPortion * suggestedNutrientsPerGram.carbs) *
                    10
                ) / 10,
              fat:
                Math.round(
                  (existingFood.portion * existingNutrientsPerGram.fat +
                    currentPortion * suggestedNutrientsPerGram.fat) *
                    10
                ) / 10,
              // Atualizar descrição da porção
              portionDescription: isUnitBased
                ? // Para alimentos medidos em unidades, atualizar descrição
                  `${
                    Math.round(
                      (newTotalPortion / (unitBasedMeasure?.weight || 100)) * 10
                    ) / 10
                  } ${unit}${
                    Math.round(
                      (newTotalPortion / (unitBasedMeasure?.weight || 100)) * 10
                    ) /
                      10 !==
                    1
                      ? "s"
                      : ""
                  }`
                : // Para alimentos medidos em gramas
                  `${newTotalPortion}g`,
              // Atualizar timestamp para o mais recente
              time: new Date().toISOString(),
            };

            // Atualizar no MealContext
            updateFoodInMeal(mealId as string, updatedFood);
            updatedFoodIds.add(existingFood.id);
          } else {
            // Se não encontrou, adicionar como novo
            addFoodToMeal(mealId as string, mealFood);
          }
        } else {
          // Caso não tenhamos acesso ao estado das refeições, adicionar normalmente
          if (mealId) {
            addFoodToMeal(mealId as string, mealFood);
          }
        }
      }

      // Feedback de sucesso
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Voltar para a tela anterior
      router.back();
    } catch (error) {
      // Tratar erro silenciosamente
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        t("nutrition.recommendation.alert.error"),
        t("nutrition.recommendation.alert.addFailed")
      );
    } finally {
      setApplying(false);
    }
  };

  // Função para exibir o nome da refeição traduzido
  const getMealName = () => {
    return t(`nutrition.mealTypes.${mealId}`, {
      defaultValue: mealName as string,
    });
  };

  // Obter totais atuais da refeição
  const mealTotals = getCurrentMealTotals();

  // Obter nutrientes restantes
  const remainingNutrients = getRemainingNutrients();

  // Função para atualizar um alimento já adicionado
  const handleUpdateAddedFood = (foodId: string, updatedPortion: number) => {
    const updatedFoods = addedFoods.map((food) => {
      if (food.id === foodId) {
        // Calcular novos valores nutricionais baseados na nova porção
        const ratio = updatedPortion / food.portion;
        return {
          ...food,
          portion: updatedPortion,
          calories: Math.round(food.calories * ratio),
          protein: Math.round(food.protein * ratio * 10) / 10,
          carbs: Math.round(food.carbs * ratio * 10) / 10,
          fat: Math.round(food.fat * ratio * 10) / 10,
        };
      }
      return food;
    });

    setAddedFoods(updatedFoods);

    // Atualizar no MealContext
    if (mealId && typeof mealId === "string") {
      updatedFoods.forEach((food) => {
        updateFoodInMeal(mealId, food);
      });
    }
  };

  // Função para remover um alimento já adicionado
  const handleRemoveAddedFood = async (foodId: string) => {
    try {
      if (mealId && typeof mealId === "string") {
        await removeFoodFromMeal(mealId, foodId);
        setAddedFoods((prev) => prev.filter((food) => food.id !== foodId));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      // Tratar erro silenciosamente
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Funções para controlar o tooltip
  const showTooltipAnimation = () => {
    setShowTooltip(true);
    Animated.timing(tooltipOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hideTooltipAnimation = () => {
    Animated.timing(tooltipOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setShowTooltip(false));
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
      >
        {/* Header fixo que inclui gradiente */}
        <View style={styles.fixedHeaderContainer}>
          {/* Cabeçalho com gradiente colapsável */}
          <Animated.View
            style={[styles.gradientHeaderContainer, { height: headerHeight }]}
          >
            <LinearGradient
              colors={[
                mealColor as string,
                (mealColor + "90") as string,
                (mealColor + "40") as string,
              ]}
              style={[styles.headerGradient, { flex: 1 }]}
            >
              {/* Adicionar BlurView para o efeito de fundo */}
              <BlurView
                intensity={40}
                tint={theme === "dark" ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />

              {/* Cabeçalho de navegação */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  disabled={loading || applying}
                >
                  <Ionicons name="chevron-down" size={28} color="#FFF" />
                </TouchableOpacity>

                <Animated.Text
                  style={[
                    styles.headerTitle,
                    {
                      opacity: headerTitleOpacity,
                      transform: [
                        { scale: titleScale },
                        { translateY: titleTranslateY },
                      ],
                    },
                  ]}
                >
                  {getMealName()}
                </Animated.Text>

                {!loading && selectedMealRecommendation && (
                  <TouchableOpacity
                    style={styles.configButton}
                    onPress={() => router.push("/meal-distribution-config")}
                    accessibilityLabel={t(
                      "nutrition.recommendation.configButtonAccessibility",
                      "Configurar distribuição de refeições"
                    )}
                  >
                    <Ionicons name="settings-outline" size={22} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Conteúdo do cabeçalho - desaparece ao rolar */}
              <Animated.View
                style={[
                  styles.gradientContent,
                  {
                    opacity: heroContentOpacity,
                    transform: [{ translateY: heroContentTranslate }],
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="food-fork-drink"
                  size={32}
                  color="#fff"
                  style={styles.headerIcon}
                />
                <Text style={styles.headerGradientTitle}>{getMealName()}</Text>
                {selectedMealRecommendation && (
                  <Text style={styles.headerGradientSubtitle}>
                    {Math.round(selectedMealRecommendation.percentageOfDaily)}%{" "}
                    {t(
                      "nutrition.recommendation.ofDailyNeeds",
                      "do seu plano diário"
                    )}
                  </Text>
                )}
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          {/* Card de recomendação fixo abaixo do header */}
          {!loading && selectedMealRecommendation && (
            <View
              style={[
                styles.fixedCardContainer,
                { backgroundColor: colors.background },
              ]}
            >
              <NutritionRecommendationCard
                recommendation={selectedMealRecommendation}
                mealColor={mealColor as string}
                theme={theme}
                mealTotals={
                  Object.keys(selectedFoods).length > 0
                    ? combinedTotals
                    : mealTotals
                }
                isPreview={Object.keys(selectedFoods).length > 0}
                onConfigPress={() => router.push("/meal-distribution-config")}
              />
            </View>
          )}
        </View>

        <Animated.ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            {
              paddingTop: HEADER_MAX_HEIGHT + CARD_HEIGHT,
              // Garantir que mesmo com pouco conteúdo, o scroll funcione
              minHeight: Dimensions.get("window").height * 1.2,
            },
          ]}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={mealColor as string} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                {t("nutrition.recommendation.calculating")}
              </Text>
            </View>
          ) : selectedMealRecommendation ? (
            <>
              {/* Seção de alimentos já adicionados */}
              {addedFoods.length > 0 && (
                <View style={styles.suggestionsSection}>
                  <View style={styles.sectionHeaderContainer}>
                    <View style={styles.sectionTitleContainer}>
                      <View style={styles.titleSubtitleContainer}>
                        <Text
                          style={[styles.sectionTitle, { color: colors.text }]}
                        >
                          {t(
                            "nutrition.recommendation.addedFoods",
                            "Alimentos Adicionados"
                          )}
                        </Text>
                        <Text
                          style={[
                            styles.sectionSubtitle,
                            { color: colors.secondary },
                          ]}
                        >
                          {t("nutrition.recommendation.addedFoodsCount", {
                            count: addedFoods.length,
                            defaultValue: "{{count}} alimentos",
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {addedFoods.map((food, index) => (
                    <FoodSuggestionCard
                      key={`added-${food.id}`}
                      food={{
                        id: food.id.startsWith("sugg_")
                          ? food.id
                          : `sugg_${food.id}`,
                        name: food.name,
                        nutrients: {
                          calories: food.calories,
                          protein: food.protein,
                          carbs: food.carbs,
                          fat: food.fat,
                        },
                        measures: [
                          {
                            id: "current",
                            label: `${food.portion}g`,
                            weight: food.portion,
                          },
                        ],
                        alternatives: [],
                        mealTypes: [mealId as string],
                      }}
                      index={index}
                      mealColor={mealColor as string}
                      theme={theme}
                      isSelected={false}
                      portion={food.portion}
                      remainingNutrients={remainingNutrients || undefined}
                      onToggleSelection={() => handleRemoveAddedFood(food.id)}
                      onPortionChange={(portion) =>
                        handleUpdateAddedFood(food.id, portion)
                      }
                      isAddedFood={true}
                      mealId={mealId as string}
                    />
                  ))}
                </View>
              )}

              {/* Seção de alimentos sugeridos do template */}
              <View style={styles.suggestionsSection}>
                <View style={styles.sectionHeaderContainer}>
                  <View style={styles.sectionTitleContainer}>
                    <View style={styles.titleSubtitleContainer}>
                      <Text
                        style={[styles.sectionTitle, { color: colors.text }]}
                      >
                        {t("nutrition.recommendation.suggestedFoods")}
                      </Text>

                      {remainingNutrients && (
                        <Text
                          style={[
                            styles.sectionSubtitle,
                            { color: colors.secondary },
                          ]}
                        >
                          {t("nutrition.recommendation.remainingLabel", {
                            calories: formatNumber(remainingNutrients.calories),
                          })}
                        </Text>
                      )}
                    </View>

                    {selectedMealRecommendation && foodItems.length > 0 && (
                      <View style={styles.optimizeButtonContainer}>
                        <TouchableOpacity
                          style={[
                            styles.optimizeIconButton,
                            { backgroundColor: `${mealColor}10` },
                          ]}
                          onPress={optimizeFoodPortions}
                          onLongPress={showTooltipAnimation}
                          onPressOut={hideTooltipAnimation}
                          activeOpacity={0.6}
                          accessibilityLabel={t(
                            "nutrition.recommendation.optimizePortionsAccessibility",
                            "Otimizar porções dos alimentos automaticamente"
                          )}
                        >
                          <MaterialCommunityIcons
                            name="auto-fix"
                            size={22}
                            color={mealColor as string}
                          />
                        </TouchableOpacity>

                        {showTooltip && (
                          <Animated.View
                            style={[
                              styles.tooltip,
                              {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                opacity: tooltipOpacity,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.tooltipText,
                                { color: colors.text },
                              ]}
                            >
                              {t(
                                "nutrition.recommendation.optimizePortions",
                                "Otimizar porções automaticamente"
                              )}
                            </Text>
                          </Animated.View>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                {loadingMealSuggestions ? (
                  <ActivityIndicator
                    size="small"
                    color={mealColor as string}
                    style={styles.loadingFoods}
                  />
                ) : foodItems.length > 0 ? (
                  foodItems.map((foodItem, index) => (
                    <FoodSuggestionCard
                      key={foodItem.food.id}
                      food={foodItem.food}
                      isSelected={!!selectedFoods[foodItem.food.id]}
                      portion={
                        foodPortions[foodItem.food.id] || foodItem.portion
                      }
                      index={index}
                      mealColor={mealColor as string}
                      theme={theme}
                      remainingNutrients={remainingNutrients || undefined}
                      onToggleSelection={handleToggleFood}
                      onReplaceFood={handleReplaceFood}
                      onPortionChange={(portion) =>
                        handleUpdatePortion(foodItem.food.id, portion)
                      }
                    />
                  ))
                ) : (
                  <Text style={[styles.emptyText, { color: colors.secondary }]}>
                    {t("nutrition.recommendation.noFoodsFound")}
                  </Text>
                )}
              </View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="restaurant-outline"
                size={40}
                color={colors.secondary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {t("nutrition.recommendation.noDataTitle")}
              </Text>
              <Text style={[styles.emptyText, { color: colors.secondary }]}>
                {t("nutrition.recommendation.noDataDescription")}
              </Text>
            </View>
          )}
        </Animated.ScrollView>

        {/* Botão de ação - escolher entre fechar ou adicionar alimentos */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          {Object.keys(selectedFoods).length > 0 ? (
            <TouchableOpacity
              style={[
                styles.applyButton,
                {
                  backgroundColor: mealColor as string,
                  opacity: applying ? 0.6 : 1,
                },
              ]}
              onPress={handleApplySelectedFoods}
              disabled={applying}
            >
              {applying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.applyButtonText}>
                    {t("nutrition.recommendation.addSelectedFoods", {
                      count: Object.keys(selectedFoods).length,
                    })}
                  </Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#FFFFFF"
                    style={styles.applyButtonIcon}
                  />
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.closeFullButton,
                { backgroundColor: mealColor as string },
              ]}
              onPress={handleClose}
            >
              <Text style={styles.closeButtonText}>{t("common.close")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  fixedHeaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.5,
    color: "#FFF",
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  configButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  gradientHeaderContainer: {
    overflow: "hidden",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
  },
  headerGradient: {
    paddingHorizontal: 8,
  },
  gradientContent: {
    alignItems: "center",
    paddingTop: 5,
    paddingBottom: 25,
  },
  headerIcon: {
    marginBottom: 12,
  },
  headerGradientTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  headerGradientSubtitle: {
    fontSize: 16,
    color: "#FFF",
    opacity: 0.9,
  },
  fixedCardContainer: {
    zIndex: 9,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 140,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginHorizontal: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  closeFullButton: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  suggestionsSection: {
    paddingHorizontal: 16,
    marginTop: 0,
  },
  sectionHeaderContainer: {
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  titleSubtitleContainer: {
    flex: 1,
  },
  loadingFoods: {
    marginVertical: 20,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    marginBottom: 0,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  applyButtonIcon: {
    marginLeft: 8,
  },
  optimizeButtonContainer: {
    position: "relative",
  },
  optimizeIconButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    marginLeft: 10,
  },
  tooltip: {
    position: "absolute",
    top: 40,
    right: 0,
    width: 220,
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});
