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
  const [portion, setPortion] = useState("100");
  const [numberOfPortions, setNumberOfPortions] = useState("1");
  const [isCustomPortion, setIsCustomPortion] = useState(true);
  const { addFoodToMeal, saveMeals, addToSearchHistory } = useMeals();
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
        setError("Alimento não encontrado");
      }
    } catch (err) {
      setError("Erro ao carregar detalhes do alimento");
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
    // Sempre renderizar os gráficos com as porcentagens exatas
    const proteinValue = shouldRenderCharts
      ? adjustedProteinPercentage
      : adjustedProteinPercentage;
    const carbsValue = shouldRenderCharts
      ? adjustedCarbsPercentage
      : adjustedCarbsPercentage;
    const fatValue = shouldRenderCharts
      ? adjustedFatPercentage
      : adjustedFatPercentage;

    return (
      <View
        key={`macros-container-${theme}-${portion}`}
        style={styles.macrosContainer}
      >
        <View
          key={`protein-circle-${theme}-${portion}`}
          style={styles.macroCircle}
        >
          <CircularProgress
            key={`protein-progress-${theme}-${portion}-${proteinValue}`}
            value={proteinValue}
            maxValue={100}
            radius={40}
            duration={300}
            delay={0}
            progressValueColor={colors.text}
            activeStrokeColor={"#FF6B6B"}
            inActiveStrokeColor={colors.light}
            inActiveStrokeOpacity={0.2}
            title={`${formatNumber(calculatedNutrients.protein)}g`}
            titleColor={colors.text}
            titleStyle={{ fontSize: 14 }}
            valueSuffix="%"
          />
          <Text style={[styles.macroLabel, { color: colors.text }]}>
            Proteína
          </Text>
          <Text style={[styles.macroCalories, { color: colors.text + "80" }]}>
            {formatNumber(Math.round(proteinCalories))} kcal
          </Text>
        </View>

        <View
          key={`carbs-circle-${theme}-${portion}`}
          style={styles.macroCircle}
        >
          <CircularProgress
            key={`carbs-progress-${theme}-${portion}-${carbsValue}`}
            value={carbsValue}
            maxValue={100}
            radius={40}
            duration={300}
            delay={0}
            progressValueColor={colors.text}
            activeStrokeColor={"#4ECDC4"}
            inActiveStrokeColor={colors.light}
            inActiveStrokeOpacity={0.2}
            title={`${formatNumber(calculatedNutrients.carbs)}g`}
            titleColor={colors.text}
            titleStyle={{ fontSize: 14 }}
            valueSuffix="%"
          />
          <Text style={[styles.macroLabel, { color: colors.text }]}>
            Carboidratos
          </Text>
          <Text style={[styles.macroCalories, { color: colors.text + "80" }]}>
            {formatNumber(Math.round(carbsCalories))} kcal
          </Text>
        </View>

        <View key={`fat-circle-${theme}-${portion}`} style={styles.macroCircle}>
          <CircularProgress
            key={`fat-progress-${theme}-${portion}-${fatValue}`}
            value={fatValue}
            maxValue={100}
            radius={40}
            duration={300}
            delay={0}
            progressValueColor={colors.text}
            activeStrokeColor={"#FFD93D"}
            inActiveStrokeColor={colors.light}
            inActiveStrokeOpacity={0.2}
            title={`${formatNumber(calculatedNutrients.fat)}g`}
            titleColor={colors.text}
            titleStyle={{ fontSize: 14 }}
            valueSuffix="%"
          />
          <Text style={[styles.macroLabel, { color: colors.text }]}>
            Gorduras
          </Text>
          <Text style={[styles.macroCalories, { color: colors.text + "80" }]}>
            {formatNumber(Math.round(fatCalories))} kcal
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top", "bottom"]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            key={`back-button-${theme}`}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Detalhes do Alimento
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.text + "80" }]}
            >
              {mealName}
            </Text>
          </View>
          <View style={{ width: 24 }} />
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
          {error || "Erro ao carregar alimento"}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={loadFoodDetails}
        >
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
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

    // Adicionar o alimento à refeição
    addFoodToMeal(mealId, newFood);

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          key={`back-button-${theme}`}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Detalhes do Alimento
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text + "80" }]}>
            {mealName}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        onScroll={() => {
          // Forçar atualização apenas se os gráficos ainda não estiverem renderizados
          if (!shouldRenderCharts) {
            setShouldRenderCharts(true);
            setForceUpdate({});
          }
        }}
        scrollEventThrottle={16}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      >
        {food && (
          <MotiView
            key={`food-details-${food.food_id}-${theme}`}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 500 }}
            style={styles.foodInfo}
          >
            <Text style={[styles.foodName, { color: colors.text }]}>
              {food.food_name}
            </Text>

            {/* Contador de Número de Porções */}
            <View
              key={`portion-counter-${theme}`}
              style={[
                styles.portionCounterContainer,
                { backgroundColor: colors.light },
              ]}
            >
              <Text
                style={[styles.portionCounterLabel, { color: colors.text }]}
              >
                Quantidade
              </Text>
              <View style={styles.portionCounter}>
                <TouchableOpacity
                  style={[
                    styles.counterButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={decrementPortions}
                >
                  <Ionicons name="remove" size={20} color="#FFF" />
                </TouchableOpacity>

                <TextInput
                  style={[styles.portionCounterInput, { color: colors.text }]}
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
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={incrementPortions}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  styles.portionCounterHelper,
                  { color: colors.text + "80" },
                ]}
              >
                {food.servings[0].serving_description &&
                (food.servings[0].serving_description
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
                    .includes("copo"))
                  ? // Se for uma porção especial como "1 bar", mostre essa informação
                    `${numberOfPortions}x ${
                      food.servings[0].serving_description
                    } (${formatNumber(food.servings[0].calories)} kcal cada)`
                  : // Para outros casos, mostre a equivalência em gramas
                    `${numberOfPortions}x ${portion}g = ${formatNumber(
                      Number(portion) * parseFloat(numberOfPortions || "0")
                    )}g total`}
              </Text>
            </View>

            {/* Portion Input para gramas */}
            <View
              key={`portion-container-${theme}`}
              style={[
                styles.portionContainer,
                { backgroundColor: colors.light },
              ]}
            >
              <TextInput
                style={[styles.portionInput, { color: colors.text }]}
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
              <Text style={[styles.portionUnit, { color: colors.text }]}>
                g
              </Text>
            </View>

            {/* Slider para ajuste de porção */}
            <View
              key={`slider-container-${theme}`}
              style={styles.sliderContainer}
            >
              <Text style={[styles.sliderLabel, { color: colors.text + "80" }]}>
                10g
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={10}
                maximumValue={500}
                step={5}
                value={Number(portion)}
                onValueChange={handleSliderChange}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.light}
                thumbTintColor={colors.primary}
              />
              <Text style={[styles.sliderLabel, { color: colors.text + "80" }]}>
                500g
              </Text>
            </View>

            {/* Calorias Totais */}
            <View
              key={`calories-container-${theme}`}
              style={styles.caloriesContainer}
            >
              <Text style={[styles.caloriesTitle, { color: colors.text }]}>
                Calorias Totais
              </Text>
              <Text style={[styles.caloriesValue, { color: colors.primary }]}>
                {formatNumber(calculatedNutrients.calories)} kcal
              </Text>
            </View>

            {/* Macros Circles */}
            {renderMacrosCircles()}

            {/* Additional Info */}
            <View
              key={`additional-info-${theme}`}
              style={[styles.additionalInfo, { backgroundColor: colors.light }]}
            >
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Informações Adicionais
              </Text>

              {food.servings[0].fiber && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    Fibras
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {formatNumber(calculatedNutrients.fiber)}g
                  </Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>
                  Distribuição Calórica
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  P: {formatNumber(adjustedProteinPercentage)}% | C:{" "}
                  {formatNumber(adjustedCarbsPercentage)}% | G:{" "}
                  {formatNumber(adjustedFatPercentage)}%
                </Text>
              </View>
            </View>
          </MotiView>
        )}
      </ScrollView>

      {/* Add Button */}
      {food && (
        <View key={`bottom-container-${theme}`} style={styles.bottomContainer}>
          <TouchableOpacity
            key={`add-button-${theme}`}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddFood}
          >
            <Text style={styles.addButtonText}>Adicionar à Refeição</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  foodInfo: {
    padding: 20,
  },
  foodName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  portionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  portionInput: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    width: 80,
  },
  portionUnit: {
    fontSize: 20,
    marginLeft: 8,
  },
  macrosContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  macroCircle: {
    alignItems: "center",
    width: width * 0.3,
  },
  macroLabel: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  macroCalories: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
  additionalInfo: {
    padding: 20,
    borderRadius: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  addButton: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
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
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  sliderLabel: {
    fontSize: 12,
  },
  caloriesContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  caloriesTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  caloriesValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  portionCounterContainer: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
  },
  portionCounterLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    textAlign: "center",
  },
  portionCounter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  portionCounterInput: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    width: 80,
    marginHorizontal: 10,
  },
  portionCounterHelper: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
});
