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
import { getFoodDetails, type EdamamFood } from "../../config/api";

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
  const [food, setFood] = useState<EdamamFood | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extrair parâmetros da refeição
  const foodId = params.foodId as string;
  const mealId = params.mealId as string;
  const mealName = params.mealName as string;

  useEffect(() => {
    loadFoodDetails();
  }, [foodId]);

  const loadFoodDetails = async () => {
    try {
      const details = await getFoodDetails(foodId);
      setFood(details);
    } catch (err) {
      setError("Erro ao carregar detalhes do alimento");
      console.error(err);
    } finally {
      setIsLoading(false);
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
    calories: Math.round(food.food.nutrients.ENERC_KCAL * multiplier),
    protein: Math.round(food.food.nutrients.PROCNT * multiplier * 10) / 10,
    carbs: Math.round(food.food.nutrients.CHOCDF * multiplier * 10) / 10,
    fat: Math.round(food.food.nutrients.FAT * multiplier * 10) / 10,
    fiber: food.food.nutrients.FIBTG
      ? Math.round(food.food.nutrients.FIBTG * multiplier * 10) / 10
      : 0,
  };

  const handleAddFood = async () => {
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
            style={[styles.portionContainer, { backgroundColor: colors.light }]}
          >
            <TextInput
              style={[styles.portionInput, { color: colors.text }]}
              value={portion}
              onChangeText={setPortion}
              keyboardType="numeric"
              maxLength={4}
            />
            <Text style={[styles.portionUnit, { color: colors.text }]}>g</Text>
          </View>

          {/* Macros Circles */}
          <View style={styles.macrosContainer}>
            <View style={styles.macroCircle}>
              <CircularProgress
                value={calculatedNutrients.calories}
                maxValue={2000}
                radius={40}
                duration={1000}
                progressValueColor={colors.text}
                activeStrokeColor={colors.primary}
                inActiveStrokeColor={colors.light}
                inActiveStrokeOpacity={0.2}
                valueSuffix=" kcal"
                titleStyle={{ fontSize: 16 }}
              />
              <Text style={[styles.macroLabel, { color: colors.text }]}>
                Calorias
              </Text>
            </View>

            <View style={styles.macroCircle}>
              <CircularProgress
                value={calculatedNutrients.protein}
                maxValue={50}
                radius={40}
                duration={1000}
                progressValueColor={colors.text}
                activeStrokeColor={"#FF6B6B"}
                inActiveStrokeColor={colors.light}
                inActiveStrokeOpacity={0.2}
                titleColor={colors.text + "80"}
                titleStyle={{ fontSize: 12 }}
                valueSuffix="g"
              />
              <Text style={[styles.macroLabel, { color: colors.text }]}>
                Proteína
              </Text>
            </View>

            <View style={styles.macroCircle}>
              <CircularProgress
                value={calculatedNutrients.carbs}
                maxValue={50}
                radius={40}
                duration={1000}
                progressValueColor={colors.text}
                activeStrokeColor={"#4ECDC4"}
                inActiveStrokeColor={colors.light}
                inActiveStrokeOpacity={0.2}
                titleColor={colors.text + "80"}
                titleStyle={{ fontSize: 12 }}
                valueSuffix="g"
              />
              <Text style={[styles.macroLabel, { color: colors.text }]}>
                Carboidratos
              </Text>
            </View>

            <View style={styles.macroCircle}>
              <CircularProgress
                value={calculatedNutrients.fat}
                maxValue={50}
                radius={40}
                duration={1000}
                progressValueColor={colors.text}
                activeStrokeColor={"#FFD93D"}
                inActiveStrokeColor={colors.light}
                inActiveStrokeOpacity={0.2}
                titleColor={colors.text + "80"}
                titleStyle={{ fontSize: 12 }}
                valueSuffix="g"
              />
              <Text style={[styles.macroLabel, { color: colors.text }]}>
                Gorduras
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
          </View>
        </MotiView>
      </ScrollView>

      {/* Add Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAddFood}
        >
          <Text style={styles.addButtonText}>Adicionar à Refeição</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  macroCircle: {
    alignItems: "center",
    width: "25%",
  },
  macroLabel: {
    fontSize: 12,
    marginTop: 8,
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
    marginBottom: 40,
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
});
