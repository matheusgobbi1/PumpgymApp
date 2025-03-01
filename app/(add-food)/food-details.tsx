import React, { useState, useEffect } from "react";
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
import { useColorScheme } from "react-native";
import { MotiView } from "moti";
import CircularProgress from "react-native-circular-progress-indicator";
import { useMeals } from "../../context/MealContext";
import * as Haptics from "expo-haptics";
import { v4 as uuidv4 } from "uuid";
import { getFoodDetails } from "../../config/api";
import { FoodHint } from "../../types/food";
import Slider from "@react-native-community/slider";

const { width } = Dimensions.get("window");

const LoadingSkeleton = () => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.foodInfo}>
        {/* Nome do Alimento Skeleton */}
        <MotiView
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
            <View key={index} style={styles.macroCircle}>
              <MotiView
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
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [portion, setPortion] = useState("100");
  const { addFoodToMeal, saveMeals } = useMeals();
  const [food, setFood] = useState<FoodHint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromHistory, setIsFromHistory] = useState(false);

  // Extrair parâmetros da refeição
  const foodId = params.foodId as string;
  const mealId = params.mealId as string;
  const mealName = params.mealName as string;

  // Extrair parâmetros adicionais para alimentos do histórico
  const foodName = params.foodName as string;
  const foodCalories = Number(params.calories || 0);
  const foodProtein = Number(params.protein || 0);
  const foodCarbs = Number(params.carbs || 0);
  const foodFat = Number(params.fat || 0);
  const foodPortion = Number(params.portion || 100);

  useEffect(() => {
    // Verificar se o alimento vem do histórico
    if (params.isFromHistory === "true") {
      setIsFromHistory(true);
      setPortion(foodPortion.toString());

      // Criar um objeto de alimento com os dados passados via parâmetros
      const historyFood: FoodHint = {
        food: {
          foodId: foodId,
          label: foodName,
          nutrients: {
            ENERC_KCAL: foodCalories,
            PROCNT: foodProtein,
            CHOCDF: foodCarbs,
            FAT: foodFat,
            FIBTG: 0, // Valor padrão para fibras
          },
          category: "Generic foods",
          categoryLabel: "Alimento do histórico",
          image: "",
        },
        measures: [],
      };

      setFood(historyFood);
      setIsLoading(false);
    } else {
      // Se não for do histórico, carregar dados da API normalmente
      loadFoodDetails();
    }
  }, [foodId, params.isFromHistory]);

  const loadFoodDetails = async () => {
    try {
      const details = await getFoodDetails(foodId);
      if (details) {
        setFood(details);
      } else {
        setError("Alimento não encontrado");
      }
    } catch (err) {
      setError("Erro ao carregar detalhes do alimento");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSliderChange = (value: number) => {
    // Arredonda para o número inteiro mais próximo
    const roundedValue = Math.round(value);
    setPortion(roundedValue.toString());

    // Feedback tátil leve ao ajustar o slider
    if (roundedValue % 10 === 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top", "bottom"]}
      >
        <View style={styles.header}>
          <TouchableOpacity
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

  // Calcula os valores nutricionais baseado na porção
  const multiplier = Number(portion) / 100;
  const calculatedNutrients = {
    calories: Math.round(food.food.nutrients.ENERC_KCAL * multiplier) || 0,
    protein: Math.round(food.food.nutrients.PROCNT * multiplier * 10) / 10 || 0,
    carbs: Math.round(food.food.nutrients.CHOCDF * multiplier * 10) / 10 || 0,
    fat: Math.round(food.food.nutrients.FAT * multiplier * 10) / 10 || 0,
    fiber: food.food.nutrients.FIBTG
      ? Math.round(food.food.nutrients.FIBTG * multiplier * 10) / 10
      : 0,
  };

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
    if (!food) return; // Verificar se food existe antes de prosseguir

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Adicionar o alimento à refeição
    addFoodToMeal(mealId, {
      id: uuidv4(),
      name: food.food.label,
      calories: calculatedNutrients.calories,
      protein: calculatedNutrients.protein,
      carbs: calculatedNutrients.carbs,
      fat: calculatedNutrients.fat,
      portion: Number(portion),
    });

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

      <ScrollView showsVerticalScrollIndicator={false}>
        {food && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 500 }}
            style={styles.foodInfo}
          >
            <Text style={[styles.foodName, { color: colors.text }]}>
              {food.food.label}
            </Text>

            {/* Portion Input */}
            <View
              style={[
                styles.portionContainer,
                { backgroundColor: colors.light },
              ]}
            >
              <TextInput
                style={[styles.portionInput, { color: colors.text }]}
                value={portion}
                onChangeText={setPortion}
                keyboardType="numeric"
                maxLength={4}
              />
              <Text style={[styles.portionUnit, { color: colors.text }]}>
                g
              </Text>
            </View>

            {/* Slider para ajuste de porção */}
            <View style={styles.sliderContainer}>
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
            <View style={styles.caloriesContainer}>
              <Text style={[styles.caloriesTitle, { color: colors.text }]}>
                Calorias Totais
              </Text>
              <Text style={[styles.caloriesValue, { color: colors.primary }]}>
                {calculatedNutrients.calories} kcal
              </Text>
            </View>

            {/* Macros Circles */}
            <View style={styles.macrosContainer}>
              <View style={styles.macroCircle}>
                <CircularProgress
                  value={adjustedProteinPercentage}
                  maxValue={100}
                  radius={40}
                  duration={1000}
                  progressValueColor={colors.text}
                  activeStrokeColor={"#FF6B6B"}
                  inActiveStrokeColor={colors.light}
                  inActiveStrokeOpacity={0.2}
                  title={`${calculatedNutrients.protein}g`}
                  titleColor={colors.text}
                  titleStyle={{ fontSize: 14 }}
                  valueSuffix="%"
                />
                <Text style={[styles.macroLabel, { color: colors.text }]}>
                  Proteína
                </Text>
                <Text
                  style={[styles.macroCalories, { color: colors.text + "80" }]}
                >
                  {Math.round(proteinCalories)} kcal
                </Text>
              </View>

              <View style={styles.macroCircle}>
                <CircularProgress
                  value={adjustedCarbsPercentage}
                  maxValue={100}
                  radius={40}
                  duration={1000}
                  progressValueColor={colors.text}
                  activeStrokeColor={"#4ECDC4"}
                  inActiveStrokeColor={colors.light}
                  inActiveStrokeOpacity={0.2}
                  title={`${calculatedNutrients.carbs}g`}
                  titleColor={colors.text}
                  titleStyle={{ fontSize: 14 }}
                  valueSuffix="%"
                />
                <Text style={[styles.macroLabel, { color: colors.text }]}>
                  Carboidratos
                </Text>
                <Text
                  style={[styles.macroCalories, { color: colors.text + "80" }]}
                >
                  {Math.round(carbsCalories)} kcal
                </Text>
              </View>

              <View style={styles.macroCircle}>
                <CircularProgress
                  value={adjustedFatPercentage}
                  maxValue={100}
                  radius={40}
                  duration={1000}
                  progressValueColor={colors.text}
                  activeStrokeColor={"#FFD93D"}
                  inActiveStrokeColor={colors.light}
                  inActiveStrokeOpacity={0.2}
                  title={`${calculatedNutrients.fat}g`}
                  titleColor={colors.text}
                  titleStyle={{ fontSize: 14 }}
                  valueSuffix="%"
                />
                <Text style={[styles.macroLabel, { color: colors.text }]}>
                  Gorduras
                </Text>
                <Text
                  style={[styles.macroCalories, { color: colors.text + "80" }]}
                >
                  {Math.round(fatCalories)} kcal
                </Text>
              </View>
            </View>

            {/* Additional Info */}
            <View
              style={[styles.additionalInfo, { backgroundColor: colors.light }]}
            >
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Informações Adicionais
              </Text>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>
                  Categoria
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {food.food.categoryLabel}
                </Text>
              </View>

              {food.food.nutrients.FIBTG && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    Fibras
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {calculatedNutrients.fiber}g
                  </Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>
                  Distribuição Calórica
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  P: {adjustedProteinPercentage}% | C: {adjustedCarbsPercentage}
                  % | G: {adjustedFatPercentage}%
                </Text>
              </View>
            </View>
          </MotiView>
        )}
      </ScrollView>

      {/* Add Button */}
      {food && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
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
});
