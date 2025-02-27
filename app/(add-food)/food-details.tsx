import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
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

export default function FoodDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [portion, setPortion] = useState("100");
  const { addFoodToMeal, saveMeals } = useMeals();

  // Extrair parâmetros da refeição
  const mealId = params.mealId as string;
  const mealName = params.mealName as string;
  const targetCalories = Number(params.targetCalories);
  const targetProtein = Number(params.targetProtein);
  const targetCarbs = Number(params.targetCarbs);
  const targetFat = Number(params.targetFat);

  // Dados mockados do alimento (em produção viria da API/banco)
  const food = {
    id: "1",
    name: "Frango Grelhado",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    portion: "100g",
    details: {
      saturatedFat: 1.1,
      fiber: 0,
      sodium: 74,
      potassium: 256,
      vitaminA: 0,
      vitaminC: 0,
      calcium: 0,
      iron: 0.9,
    },
  };

  // Calcula os valores nutricionais baseado na porção
  const multiplier = Number(portion) / 100;
  const calculatedNutrients = {
    calories: Math.round(food.calories * multiplier),
    protein: Math.round(food.protein * multiplier * 10) / 10,
    carbs: Math.round(food.carbs * multiplier * 10) / 10,
    fat: Math.round(food.fat * multiplier * 10) / 10,
  };

  const handleAddFood = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Adicionar o alimento à refeição
    addFoodToMeal(mealId, {
      id: uuidv4(), // Gerar um ID único para o alimento
      name: food.name,
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
        {/* Food Info */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
          style={styles.foodInfo}
        >
          <Text style={[styles.foodName, { color: colors.text }]}>
            {food.name}
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
                title="kcal"
                titleColor={colors.text + "80"}
                titleStyle={{ fontSize: 12 }}
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
                title="g"
                titleColor={colors.text + "80"}
                titleStyle={{ fontSize: 12 }}
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
                title="g"
                titleColor={colors.text + "80"}
                titleStyle={{ fontSize: 12 }}
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
                title="g"
                titleColor={colors.text + "80"}
                titleStyle={{ fontSize: 12 }}
              />
              <Text style={[styles.macroLabel, { color: colors.text }]}>
                Gorduras
              </Text>
            </View>
          </View>

          {/* Detailed Nutrients */}
          <View
            style={[
              styles.detailedNutrients,
              { backgroundColor: colors.light },
            ]}
          >
            <Text style={[styles.detailsTitle, { color: colors.text }]}>
              Informação Nutricional
            </Text>

            <View style={styles.nutrientRow}>
              <Text style={[styles.nutrientLabel, { color: colors.text }]}>
                Gorduras Saturadas
              </Text>
              <Text style={[styles.nutrientValue, { color: colors.text }]}>
                {(food.details.saturatedFat * multiplier).toFixed(1)}g
              </Text>
            </View>

            <View style={styles.nutrientRow}>
              <Text style={[styles.nutrientLabel, { color: colors.text }]}>
                Fibras
              </Text>
              <Text style={[styles.nutrientValue, { color: colors.text }]}>
                {(food.details.fiber * multiplier).toFixed(1)}g
              </Text>
            </View>

            <View style={styles.nutrientRow}>
              <Text style={[styles.nutrientLabel, { color: colors.text }]}>
                Sódio
              </Text>
              <Text style={[styles.nutrientValue, { color: colors.text }]}>
                {Math.round(food.details.sodium * multiplier)}mg
              </Text>
            </View>

            <View style={styles.nutrientRow}>
              <Text style={[styles.nutrientLabel, { color: colors.text }]}>
                Potássio
              </Text>
              <Text style={[styles.nutrientValue, { color: colors.text }]}>
                {Math.round(food.details.potassium * multiplier)}mg
              </Text>
            </View>
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
  detailedNutrients: {
    padding: 20,
    borderRadius: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  nutrientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  nutrientLabel: {
    fontSize: 14,
  },
  nutrientValue: {
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
});
