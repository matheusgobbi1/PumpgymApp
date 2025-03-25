import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { MotiView } from "moti";
import CircularProgress from "react-native-circular-progress-indicator";
import { useMeals } from "../../context/MealContext";
import * as Haptics from "expo-haptics";
import { v4 as uuidv4 } from "uuid";
import { getFoodDetails } from "../../services/food";
import { FoodItem, FoodServing } from "../../types/food";
import Slider from "@react-native-community/slider";
import { useTranslation } from "react-i18next";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const { width } = Dimensions.get("window");

const LoadingSkeleton = () => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.foodInfo}>
        {/* Nome do Alimento Skeleton */}
        <MotiView
          key={`skeleton-title-${theme}`}
          from={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{
            type: "timing",
            duration: 1000,
            loop: true,
          }}
          style={[styles.skeletonTitle, { backgroundColor: colors.light }]}
        />

        {/* Input Porção Skeleton */}
        <MotiView
          key={`skeleton-portion-${theme}`}
          from={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{
            type: "timing",
            duration: 1000,
            loop: true,
          }}
          style={[styles.skeletonPortion, { backgroundColor: colors.light }]}
        />

        {/* Macros Circles Skeleton */}
        <View style={styles.macrosContainer}>
          {[...Array(4)].map((_, index) => (
            <View
              key={`macro-circle-${index}-${theme}`}
              style={styles.macroCircle}
            >
              <MotiView
                key={`skeleton-circle-${index}-${theme}`}
                from={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{
                  type: "timing",
                  duration: 1000,
                  loop: true,
                  delay: index * 100,
                }}
                style={[
                  styles.skeletonCircle,
                  { backgroundColor: colors.light },
                ]}
              />
              <MotiView
                key={`skeleton-label-${index}-${theme}`}
                from={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{
                  type: "timing",
                  duration: 1000,
                  loop: true,
                  delay: index * 100,
                }}
                style={[
                  styles.skeletonLabel,
                  { backgroundColor: colors.light },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Informações Adicionais Skeleton */}
        <MotiView
          key={`skeleton-info-${theme}`}
          from={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{
            type: "timing",
            duration: 1000,
            loop: true,
          }}
          style={[styles.skeletonInfo, { backgroundColor: colors.light }]}
        />
      </View>
    </ScrollView>
  );
};

export default function FoodDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();
  const [portion, setPortion] = useState("100");
  const [numberOfPortions, setNumberOfPortions] = useState("1");
  const [isCustomPortion, setIsCustomPortion] = useState(true);
  const { addFoodToMeal, updateFoodInMeal, saveMeals, addToSearchHistory } =
    useMeals();
  const [food, setFood] = useState<FoodItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromHistory, setIsFromHistory] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Estado para controlar se os gráficos devem ser renderizados
  const [shouldRenderCharts, setShouldRenderCharts] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const [, setForceUpdate] = useState({});

  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

  // Efeito para garantir que os gráficos sejam renderizados após o componente montar
  useEffect(() => {
    if (!isLoading && food) {
      // Pequeno atraso para garantir que a UI esteja pronta
      const timer = setTimeout(() => {
        setShouldRenderCharts(true);
        // Forçar atualização do componente
        setForceUpdate({});

        // Adicionar requestAnimationFrame para garantir a renderização no próximo frame
        requestAnimationFrame(() => {
          setForceUpdate({});
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isLoading, food]);

  // Efeito para atualizar os gráficos quando a porção mudar
  useEffect(() => {
    if (!isLoading && food) {
      // Forçar atualização após mudança na porção
      requestAnimationFrame(() => {
        setForceUpdate({});
      });
    }
  }, [portion]);

  // Extrair parâmetros da refeição
  const foodId = params.foodId as string;
  const mealId = params.mealId as string;
  const mealName = params.mealName as string;
  const mode = params.mode as string;
  const mealColor = (params.mealColor as string) || colors.primary;

  // Extrair parâmetros adicionais para alimentos do histórico
  const foodName = params.foodName as string;
  const foodCalories = Number(params.calories || 0);
  const foodProtein = Number(params.protein || 0);
  const foodCarbs = Number(params.carbs || 0);
  const foodFat = Number(params.fat || 0);
  const foodPortion = Number(params.portion || 100);
  const foodPortionDescription = params.portionDescription as string;

  useEffect(() => {
    // Verificar se estamos no modo de edição
    if (mode === "edit") {
      setIsEditMode(true);
    }

    // Verificar se o alimento vem do histórico
    if (params.isFromHistory === "true") {
      setIsFromHistory(true);

      // Se estamos no modo de edição, usar os valores passados
      if (isEditMode) {
        setPortion(foodPortion.toString());
      }

      // Se temos uma descrição de porção personalizada, desabilitar o modo de porção customizada
      if (
        foodPortionDescription &&
        foodPortionDescription !== `${foodPortion}g`
      ) {
        setIsCustomPortion(false);
      }

      // Criar um objeto de alimento com os dados passados via parâmetros
      const historyFood: FoodItem = {
        food_id: foodId,
        food_name: foodName,
        food_type: "Generic foods",
        food_url: "",
        servings: [
          {
            serving_id: "0",
            serving_description: foodPortionDescription || `${foodPortion}g`,
            metric_serving_amount: foodPortion,
            metric_serving_unit: "g",
            calories: foodCalories,
            protein: foodProtein,
            carbohydrate: foodCarbs,
            fat: foodFat,
          },
        ],
      };

      setFood(historyFood);
      setIsLoading(false);
    } else {
      // Se não for do histórico, carregar dados da API normalmente
      loadFoodDetails();
    }
  }, [foodId, params.isFromHistory, isEditMode]);

  // Função para obter a porção preferida para exibição
  const getPreferredServing = (servings: FoodServing[]): FoodServing => {
    if (!servings || servings.length === 0) {
      // Fallback para uma porção padrão se não houver nenhuma
      return {
        serving_id: "default",
        serving_description: "100g",
        metric_serving_amount: 100,
        metric_serving_unit: "g",
        calories: 0,
        protein: 0,
        fat: 0,
        carbohydrate: 0,
      };
    }

    // Verificar se há uma porção de embalagem (como "1 unidade", "1 pacote", etc.)
    const packageServing = servings.find(
      (serving) =>
        serving.serving_description.toLowerCase().includes("unidade") ||
        serving.serving_description.toLowerCase().includes("pacote") ||
        serving.serving_description.toLowerCase().includes("embalagem") ||
        serving.serving_description.toLowerCase().includes("pote") ||
        serving.serving_description.toLowerCase().includes("garrafa") ||
        serving.serving_description.toLowerCase().includes("lata") ||
        serving.serving_description.toLowerCase().includes("copo") ||
        serving.serving_description.toLowerCase().includes("bar") ||
        serving.serving_description.toLowerCase().includes("piece") ||
        serving.serving_description.toLowerCase().includes("scoop") ||
        serving.serving_description.toLowerCase().includes("fatia") ||
        (serving.serving_description.toLowerCase().includes("g") &&
          !serving.serving_description.toLowerCase().includes("100g"))
    );

    // Se encontrou uma porção de embalagem, use-a
    if (packageServing) {
      return packageServing;
    }

    // Caso contrário, use a primeira porção (geralmente 100g)
    return servings[0];
  };

  const loadFoodDetails = async () => {
    try {
      const response = await getFoodDetails(foodId);
      if (response.items && response.items.length > 0) {
        const foodItem = response.items[0];
        setFood(foodItem);

        // Use a porção real do alimento em vez de forçar 100g
        if (foodItem.servings && foodItem.servings.length > 0) {
          // Determinar qual porção usar
          const preferredServing = getPreferredServing(foodItem.servings);

          // Se temos uma descrição específica como "1 bar" e um peso real, use-o
          if (
            preferredServing.serving_description &&
            (preferredServing.serving_description
              .toLowerCase()
              .includes("unidade") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("pacote") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("embalagem") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("pote") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("garrafa") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("lata") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("copo") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("bar") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("piece") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("scoop") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("fatia") ||
              !preferredServing.serving_description.toLowerCase().includes("g"))
          ) {
            // Se temos um peso real em gramas, use-o
            if (preferredServing.metric_serving_amount) {
              setPortion(formatNumber(preferredServing.metric_serving_amount));
              // Como é uma porção específica (ex: 1 barra), permitimos ajuste
              setIsCustomPortion(true);
            } else {
              // Caso contrário, use 100g como fallback
              setPortion("100");
              setIsCustomPortion(true);
            }
          } else {
            // Para outros alimentos, use 100g como padrão
            setPortion("100");
            setIsCustomPortion(true);
          }
        } else {
          // Se não tiver serving information, use 100g como padrão
          setPortion("100");
          setIsCustomPortion(true);
        }
      } else {
        setError(t("nutrition.foodDetails.foodNotFound"));
      }
    } catch (err) {
      setError(t("nutrition.foodDetails.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  // Função para formatar números eliminando zeros desnecessários
  const formatNumber = (value: number | string): string => {
    // Converter para número
    const num = typeof value === "string" ? parseFloat(value) : value;

    // Se for NaN ou indefinido, retornar 0
    if (isNaN(num)) return "0";

    // Se o valor é inteiro, retorna sem casas decimais
    if (num === Math.floor(num)) {
      return num.toString();
    }

    // Caso contrário, limita a 1 casa decimal e remove zeros à direita
    return num.toFixed(1).replace(/\.0$/, "");
  };

  const handleSliderChange = (value: number) => {
    // Arredonda para o número inteiro mais próximo
    const roundedValue = Math.round(value);
    setPortion(formatNumber(roundedValue));
    setIsCustomPortion(true);

    // Feedback tátil leve ao ajustar o slider
    if (roundedValue % 10 === 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Função para incrementar o número de porções
  const incrementPortions = () => {
    const currentValue = parseFloat(numberOfPortions);
    if (isNaN(currentValue)) {
      setNumberOfPortions("1");
    } else {
      // Arredondar para 1 casa decimal para evitar valores estranhos
      const newValue = Math.round((currentValue + 0.5) * 10) / 10;
      setNumberOfPortions(formatNumber(newValue));
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Função para decrementar o número de porções
  const decrementPortions = () => {
    const currentValue = parseFloat(numberOfPortions);
    if (isNaN(currentValue) || currentValue <= 0.5) {
      setNumberOfPortions("0.5");
    } else {
      // Arredondar para 1 casa decimal para evitar valores estranhos
      const newValue = Math.round((currentValue - 0.5) * 10) / 10;
      setNumberOfPortions(formatNumber(newValue));
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderMacrosCircles = () => {
    // Como removemos os gráficos circulares, esta função não é mais necessária
    // Retornamos null ou um componente vazio
    return null;
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top", "bottom"]}
      >
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            key={`back-button-${theme}`}
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.card }]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {mealName}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <LoadingSkeleton />
      </SafeAreaView>
    );
  }

  if (error || !food) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.errorText, { color: colors.danger }]}>
          {error || t("nutrition.foodDetails.genericError")}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={loadFoodDetails}
        >
          <Text style={styles.retryButtonText}>
            {t("nutrition.foodDetails.tryAgain")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Modificar o cálculo de nutrientes para considerar o número de porções
  const calculatedNutrients = (() => {
    if (!food || !food.servings || food.servings.length === 0) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      };
    }

    const selectedServing = food.servings[0]; // Sempre usar o primeiro serving
    const portionsMultiplier = parseFloat(numberOfPortions) || 1;

    // Cálculo para porção personalizada em gramas * número de porções
    const baseAmount = selectedServing.metric_serving_amount || 100;
    const weightMultiplier =
      (Number(portion) / baseAmount) * portionsMultiplier;

    return {
      calories: Math.round(selectedServing.calories * weightMultiplier) || 0,
      protein:
        Math.round(selectedServing.protein * weightMultiplier * 10) / 10 || 0,
      carbs:
        Math.round(selectedServing.carbohydrate * weightMultiplier * 10) / 10 ||
        0,
      fat: Math.round(selectedServing.fat * weightMultiplier * 10) / 10 || 0,
      fiber: selectedServing.fiber
        ? Math.round(selectedServing.fiber * weightMultiplier * 10) / 10
        : 0,
    };
  })();

  // Calcula a contribuição de cada macronutriente para as calorias totais
  const proteinCalories = calculatedNutrients.protein * 4; // 4 calorias por grama de proteína
  const carbsCalories = calculatedNutrients.carbs * 4; // 4 calorias por grama de carboidrato
  const fatCalories = calculatedNutrients.fat * 9; // 9 calorias por grama de gordura

  // Calcula as porcentagens de cada macronutriente
  const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;

  // Usar o total de calorias dos macros para calcular as porcentagens
  // Isso garante que a soma seja 100%
  const proteinPercentage =
    totalMacroCalories > 0
      ? Math.round((proteinCalories / totalMacroCalories) * 100)
      : 0;

  const carbsPercentage =
    totalMacroCalories > 0
      ? Math.round((carbsCalories / totalMacroCalories) * 100)
      : 0;

  const fatPercentage =
    totalMacroCalories > 0
      ? Math.round((fatCalories / totalMacroCalories) * 100)
      : 0;

  // Ajuste para garantir que a soma seja exatamente 100%
  let adjustedProteinPercentage = proteinPercentage;
  let adjustedCarbsPercentage = carbsPercentage;
  let adjustedFatPercentage = fatPercentage;

  // Se a soma não for 100%, ajustar o maior valor
  const sum = proteinPercentage + carbsPercentage + fatPercentage;
  if (sum !== 100 && sum > 0) {
    if (
      proteinPercentage >= carbsPercentage &&
      proteinPercentage >= fatPercentage
    ) {
      adjustedProteinPercentage = 100 - carbsPercentage - fatPercentage;
    } else if (
      carbsPercentage >= proteinPercentage &&
      carbsPercentage >= fatPercentage
    ) {
      adjustedCarbsPercentage = 100 - proteinPercentage - fatPercentage;
    } else {
      adjustedFatPercentage = 100 - proteinPercentage - carbsPercentage;
    }

    // Garantir que nenhum valor seja negativo
    adjustedProteinPercentage = Math.max(0, adjustedProteinPercentage);
    adjustedCarbsPercentage = Math.max(0, adjustedCarbsPercentage);
    adjustedFatPercentage = Math.max(0, adjustedFatPercentage);

    // Se após os ajustes a soma ainda não for 100%, distribuir a diferença
    const adjustedSum =
      adjustedProteinPercentage +
      adjustedCarbsPercentage +
      adjustedFatPercentage;
    if (adjustedSum !== 100 && adjustedSum > 0) {
      // Encontrar o maior valor para ajustar
      if (
        adjustedProteinPercentage >= adjustedCarbsPercentage &&
        adjustedProteinPercentage >= adjustedFatPercentage
      ) {
        adjustedProteinPercentage =
          100 - adjustedCarbsPercentage - adjustedFatPercentage;
      } else if (
        adjustedCarbsPercentage >= adjustedProteinPercentage &&
        adjustedCarbsPercentage >= adjustedFatPercentage
      ) {
        adjustedCarbsPercentage =
          100 - adjustedProteinPercentage - adjustedFatPercentage;
      } else {
        adjustedFatPercentage =
          100 - adjustedProteinPercentage - adjustedCarbsPercentage;
      }
    }
  }

  const handleAddFood = async () => {
    if (!food && !isFromHistory) return; // Verificar se food existe antes de prosseguir

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Obter a descrição da porção
    let portionDescription = `${portion}g`;
    const portionsMultiplier = parseFloat(numberOfPortions) || 1;

    // Verificar se temos uma descrição especial de porção (como "1 bar")
    const hasSpecialServing =
      food?.servings &&
      food.servings[0]?.serving_description &&
      (food.servings[0].serving_description.toLowerCase().includes("unidade") ||
        food.servings[0].serving_description.toLowerCase().includes("pacote") ||
        food.servings[0].serving_description
          .toLowerCase()
          .includes("embalagem") ||
        food.servings[0].serving_description.toLowerCase().includes("pote") ||
        food.servings[0].serving_description
          .toLowerCase()
          .includes("garrafa") ||
        food.servings[0].serving_description.toLowerCase().includes("lata") ||
        food.servings[0].serving_description.toLowerCase().includes("copo") ||
        food.servings[0].serving_description.toLowerCase().includes("bar") ||
        food.servings[0].serving_description.toLowerCase().includes("piece") ||
        !food.servings[0].serving_description.toLowerCase().includes("g"));

    if (hasSpecialServing) {
      // Se temos uma porção especial (como "1 bar"), usar essa descrição
      if (portionsMultiplier === 1) {
        portionDescription = food.servings[0].serving_description;
      } else {
        portionDescription = `${numberOfPortions}x ${food.servings[0].serving_description}`;
      }
    } else if (portionsMultiplier !== 1) {
      // Se for apenas uma porção em gramas e temos múltiplas porções
      portionDescription = `${numberOfPortions}x ${portion}g`;
    }

    const newFood = {
      id: isEditMode && foodId ? foodId : uuidv4(),
      name: food ? food.food_name : foodName,
      calories: calculatedNutrients.calories,
      protein: calculatedNutrients.protein,
      carbs: calculatedNutrients.carbs,
      fat: calculatedNutrients.fat,
      portion: hasSpecialServing
        ? Number(food.servings[0].metric_serving_amount || portion) *
          portionsMultiplier
        : Number(portion) * portionsMultiplier,
      portionDescription: portionDescription,
    };

    // Verificar se estamos editando um alimento existente ou adicionando um novo
    if (isEditMode && foodId) {
      // Atualizar o alimento existente
      updateFoodInMeal(mealId, newFood);
    } else {
      // Adicionar novo alimento à refeição
      addFoodToMeal(mealId, newFood);
    }

    // Adicionar ao histórico com a porção exata em que foi adicionado
    await addToSearchHistory(newFood);

    // Salvar as alterações
    await saveMeals();

    // Voltar para a tela anterior
    router.back();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header Redesenhado */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          key={`back-button-${theme}`}
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.card }]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {mealName}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
        onScroll={() => {
          if (!shouldRenderCharts) {
            setShouldRenderCharts(true);
            setForceUpdate({});
          }
        }}
        scrollEventThrottle={16}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      >
        {isLoading ? (
          <LoadingSkeleton />
        ) : food ? (
          <MotiView
            key={`food-details-${food.food_id}-${theme}`}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 300 }}
            style={styles.foodInfo}
          >
            {/* Nome do Alimento com Design Melhorado */}
            <Text
              style={[
                styles.foodName,
                {
                  color: colors.text,
                  backgroundColor: mealColor + "08",
                  borderRadius: 30,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                },
              ]}
            >
              {food.food_name}
            </Text>

            {/* Card Unificado */}
            <View
              style={[styles.unifiedCard, { backgroundColor: colors.card }]}
            >
              {/* Seção Principal - Calorias e Macros */}
              <View style={styles.mainInfoSection}>
                {/* Calorias no centro */}
                <View style={styles.caloriesContainer}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: mealColor + "15" },
                    ]}
                  >
                    <Ionicons
                      name="flame"
                      size={26}
                      color={mealColor}
                    />
                  </View>
                  <Text style={[styles.caloriesValue, { color: mealColor }]}>
                    {formatNumber(calculatedNutrients.calories)}
                  </Text>
                  <Text
                    style={[styles.caloriesUnit, { color: colors.text + "80" }]}
                  >
                    kcal
                  </Text>
                </View>

                {/* Macros em grid de 2x2 */}
                <View style={styles.macrosGrid}>
                  <View style={styles.macroItem}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: "#FF6B6B15" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="food-steak"
                        size={18}
                        color="#FF6B6B"
                      />
                    </View>
                    <View>
                      <Text style={[styles.macroName, { color: colors.text }]}>
                        {t("common.nutrition.protein")}
                      </Text>
                      <Text style={[styles.macroValue, { color: "#FF6B6B" }]}>
                        {formatNumber(calculatedNutrients.protein)}g
                      </Text>
                    </View>
                  </View>

                  <View style={styles.macroItem}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: "#4ECDC415" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="bread-slice"
                        size={18}
                        color="#4ECDC4"
                      />
                    </View>
                    <View>
                      <Text style={[styles.macroName, { color: colors.text }]}>
                        {t("common.nutrition.carbs")}
                      </Text>
                      <Text style={[styles.macroValue, { color: "#4ECDC4" }]}>
                        {formatNumber(calculatedNutrients.carbs)}g
                      </Text>
                    </View>
                  </View>

                  <View style={styles.macroItem}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: "#FFD93D15" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="oil"
                        size={18}
                        color="#FFD93D"
                      />
                    </View>
                    <View>
                      <Text style={[styles.macroName, { color: colors.text }]}>
                        {t("common.nutrition.fat")}
                      </Text>
                      <Text style={[styles.macroValue, { color: "#FFD93D" }]}>
                        {formatNumber(calculatedNutrients.fat)}g
                      </Text>
                    </View>
                  </View>

                  {food.servings[0].fiber ? (
                    <View style={styles.macroItem}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: "#A0D99515" },
                        ]}
                      >
                        <Ionicons name="cellular" size={18} color="#A0D995" />
                      </View>
                      <View>
                        <Text
                          style={[styles.macroName, { color: colors.text }]}
                        >
                          {t("nutrition.foodDetails.fiber")}
                        </Text>
                        <Text style={[styles.macroValue, { color: "#A0D995" }]}>
                          {formatNumber(calculatedNutrients.fiber)}g
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.macroItem}></View>
                  )}
                </View>
              </View>

              {/* Separador */}
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />

              {/* Seção de Controles */}
              <View style={styles.controlsSection}>
                {/* Porções e Peso */}
                <View style={styles.quantityControls}>
                  {/* Número de porções */}
                  <View style={styles.portionControl}>
                    <Text style={[styles.controlLabel, { color: colors.text }]}>
                      Porções
                    </Text>
                    <View style={styles.portionCounter}>
                      <TouchableOpacity
                        style={[
                          styles.counterButton,
                          {
                            backgroundColor: mealColor + "15",
                            borderWidth: 1,
                            borderColor: mealColor + "30",
                          },
                        ]}
                        onPress={decrementPortions}
                      >
                        <Ionicons name="remove" size={18} color={mealColor} />
                      </TouchableOpacity>

                      <TextInput
                        style={[
                          styles.portionCounterInput,
                          { color: colors.text },
                        ]}
                        value={numberOfPortions}
                        onChangeText={(text) => {
                          // Substituir vírgula por ponto
                          const sanitizedText = text.replace(",", ".");

                          // Se o texto estiver vazio, definir como vazio
                          if (sanitizedText === "") {
                            setNumberOfPortions("");
                            return;
                          }

                          // Verificar se é um número válido
                          if (!/^[0-9]*\.?[0-9]*$/.test(sanitizedText)) {
                            return; // Ignorar entradas que não são números
                          }

                          // Converter para número e verificar se está entre 0.5 e 99
                          const numValue = parseFloat(sanitizedText);
                          if (!isNaN(numValue) && numValue <= 99) {
                            // Não formatar enquanto o usuário está digitando
                            setNumberOfPortions(sanitizedText);
                          }
                        }}
                        onBlur={() => {
                          // Ao perder o foco, formatar corretamente o número
                          if (numberOfPortions === "") {
                            setNumberOfPortions("1");
                          } else {
                            // Garantir valor mínimo de 0.5
                            const numValue = parseFloat(numberOfPortions);
                            const validValue = isNaN(numValue)
                              ? 1
                              : Math.max(0.5, numValue);
                            setNumberOfPortions(formatNumber(validValue));
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={4}
                      />

                      <TouchableOpacity
                        style={[
                          styles.counterButton,
                          {
                            backgroundColor: mealColor + "15",
                            borderWidth: 1,
                            borderColor: mealColor + "30",
                          },
                        ]}
                        onPress={incrementPortions}
                      >
                        <Ionicons name="add" size={18} color={mealColor} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Tamanho da porção */}
                  <View style={styles.weightControl}>
                    <Text style={[styles.controlLabel, { color: colors.text }]}>
                      Peso (g)
                    </Text>
                    <View style={styles.weightInputContainer}>
                      <TextInput
                        style={[styles.weightInput, { color: colors.text }]}
                        value={portion}
                        onChangeText={(text) => {
                          // Substituir vírgula por ponto
                          const sanitizedText = text.replace(",", ".");

                          // Se o texto estiver vazio, definir como vazio
                          if (sanitizedText === "") {
                            setPortion("");
                            return;
                          }

                          // Verificar se é um número válido
                          if (!/^[0-9]*\.?[0-9]*$/.test(sanitizedText)) {
                            return; // Ignorar entradas que não são números
                          }

                          // Converter para número e verificar se está entre 1 e 9999
                          const numValue = parseFloat(sanitizedText);
                          if (!isNaN(numValue) && numValue <= 9999) {
                            // Não formatar enquanto o usuário está digitando
                            setPortion(sanitizedText);
                          }

                          setIsCustomPortion(true);
                        }}
                        onBlur={() => {
                          // Ao perder o foco, formatar corretamente o número
                          if (portion === "") {
                            setPortion("0");
                          } else {
                            setPortion(formatNumber(portion));
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={5}
                      />
                      <Text style={[styles.weightUnit, { color: colors.text }]}>
                        g
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Slider para ajuste de porção integrado */}
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={10}
                    maximumValue={500}
                    step={5}
                    value={Number(portion)}
                    onValueChange={handleSliderChange}
                    minimumTrackTintColor={mealColor}
                    maximumTrackTintColor={colors.border + "60"}
                    thumbTintColor={mealColor}
                  />
                  <View style={styles.sliderLabelsContainer}>
                    <Text
                      style={[
                        styles.sliderLabel,
                        { color: colors.text + "80" },
                      ]}
                    >
                      10g
                    </Text>
                    <Text
                      style={[
                        styles.sliderLabel,
                        { color: colors.text + "80" },
                      ]}
                    >
                      500g
                    </Text>
                  </View>
                </View>

                {/* Texto de ajuda */}
                {food.servings[0].serving_description && (
                  <Text
                    style={[styles.helperText, { color: colors.text + "80" }]}
                  >
                    {food.servings[0].serving_description
                      .toLowerCase()
                      .includes("bar") ||
                    food.servings[0].serving_description
                      .toLowerCase()
                      .includes("piece") ||
                    food.servings[0].serving_description
                      .toLowerCase()
                      .includes("unit") ||
                    food.servings[0].serving_description
                      .toLowerCase()
                      .includes("unidade") ||
                    food.servings[0].serving_description
                      .toLowerCase()
                      .includes("pacote") ||
                    food.servings[0].serving_description
                      .toLowerCase()
                      .includes("embalagem") ||
                    food.servings[0].serving_description
                      .toLowerCase()
                      .includes("pote") ||
                    food.servings[0].serving_description
                      .toLowerCase()
                      .includes("garrafa") ||
                    food.servings[0].serving_description
                      .toLowerCase()
                      .includes("lata") ||
                    food.servings[0].serving_description
                      .toLowerCase()
                      .includes("copo")
                      ? `${numberOfPortions}x ${food.servings[0].serving_description}`
                      : `Total: ${formatNumber(
                          Number(portion) * parseFloat(numberOfPortions || "0")
                        )}g`}
                  </Text>
                )}
              </View>
            </View>
          </MotiView>
        ) : null}
      </ScrollView>

      {/* Add Button */}
      {food && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 200 }}
          style={styles.bottomContainer}
        >
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: mealColor }]}
            onPress={handleAddFood}
          >
            <Text style={styles.addButtonText}>
              {isEditMode
                ? t("nutrition.foodDetails.updateMeal")
                : t("nutrition.foodDetails.addToMeal")}
            </Text>
            <Ionicons
              name={isEditMode ? "checkmark-circle" : "add-circle"}
              size={20}
              color="#FFF"
              style={styles.addButtonIcon}
            />
          </TouchableOpacity>
        </MotiView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  foodInfo: {
    padding: 8,
  },
  foodName: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: -0.5,
    alignSelf: "center",
  },
  // Card Unificado
  unifiedCard: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  // Seção Principal com Calorias e Macros
  mainInfoSection: {
    padding: 20,
  },
  caloriesContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  caloriesValue: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  caloriesUnit: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  // Macros em Grid
  macrosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  macroItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 15,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  macroName: {
    fontSize: 14,
    fontWeight: "600",
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  // Divider
  divider: {
    height: 1,
    width: "100%",
  },
  // Seção de Controles
  controlsSection: {
    padding: 20,
  },
  quantityControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  portionControl: {
    width: "48%",
  },
  weightControl: {
    width: "48%",
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  portionCounter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  portionCounterInput: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    width: 50,
  },
  weightInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  weightInput: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    width: 70,
  },
  weightUnit: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 4,
  },
  sliderContainer: {
    marginBottom: 10,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  helperText: {
    fontSize: 13,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  // Botão de adicionar
  bottomContainer: {
    padding: 16,
    paddingBottom: 12,
  },
  addButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  addButtonIcon: {
    marginLeft: 8,
  },
  // Skeleton
  skeletonTitle: {
    height: 32,
    borderRadius: 16,
    marginBottom: 20,
    width: width * 0.6,
    alignSelf: "center",
  },
  skeletonPortion: {
    height: 56,
    borderRadius: 12,
    marginBottom: 20,
    width: width * 0.4,
    alignSelf: "center",
  },
  skeletonCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  skeletonLabel: {
    height: 12,
    width: 60,
    borderRadius: 6,
  },
  skeletonInfo: {
    height: 120,
    borderRadius: 16,
    marginTop: 20,
  },
  macrosContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  macroCircle: {
    alignItems: "center",
    width: width * 0.3,
  },
});
