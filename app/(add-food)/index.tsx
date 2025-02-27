import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import { MotiView } from "moti";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
}

const recentFoods: FoodItem[] = [
  {
    id: "1",
    name: "Frango Grelhado",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    portion: "100g",
  },
  {
    id: "2",
    name: "Arroz Branco",
    calories: 130,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
    portion: "100g",
  },
  {
    id: "3",
    name: "Batata Doce",
    calories: 86,
    protein: 1.6,
    carbs: 20,
    fat: 0.1,
    portion: "100g",
  },
];

export default function AddFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [searchQuery, setSearchQuery] = useState("");

  // Extrair parâmetros da refeição
  const mealId = params.mealId as string;
  const mealName = params.mealName as string;
  const targetCalories = Number(params.targetCalories);
  const targetProtein = Number(params.targetProtein);
  const targetCarbs = Number(params.targetCarbs);
  const targetFat = Number(params.targetFat);

  const handleFoodSelect = (food: FoodItem) => {
    // Navegar para a tela de detalhes do alimento com os parâmetros da refeição
    router.push({
      pathname: "/(add-food)/food-details",
      params: {
        foodId: food.id,
        mealId,
        mealName,
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
      },
    });
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
            Adicionar Alimento
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text + "80" }]}>
            {mealName}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.light }]}>
        <Ionicons
          name="search"
          size={20}
          color={colors.text}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar alimento..."
          placeholderTextColor={colors.text + "80"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: colors.light }]}
          onPress={() => router.push("/(add-food)/barcode-scanner")}
        >
          <Ionicons name="barcode-outline" size={24} color={colors.primary} />
          <Text style={[styles.quickActionText, { color: colors.text }]}>
            Escanear Código
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: colors.light }]}
          onPress={() => router.push("/(add-food)/quick-add")}
        >
          <Ionicons
            name="add-circle-outline"
            size={24}
            color={colors.primary}
          />
          <Text style={[styles.quickActionText, { color: colors.text }]}>
            Adição Rápida
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Foods Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Alimentos Recentes
        </Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {recentFoods.map((food, index) => (
            <MotiView
              key={food.id}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: index * 100 }}
            >
              <TouchableOpacity
                style={[styles.foodItem, { backgroundColor: colors.light }]}
                onPress={() => handleFoodSelect(food)}
              >
                <View style={styles.foodInfo}>
                  <Text style={[styles.foodName, { color: colors.text }]}>
                    {food.name}
                  </Text>
                  <Text
                    style={[styles.foodPortion, { color: colors.text + "80" }]}
                  >
                    {food.portion}
                  </Text>
                </View>
                <View style={styles.foodMacros}>
                  <Text style={[styles.calories, { color: colors.text }]}>
                    {food.calories} kcal
                  </Text>
                  <View style={styles.macroRow}>
                    <Text style={[styles.macro, { color: colors.text + "80" }]}>
                      P: {food.protein}g
                    </Text>
                    <Text style={[styles.macro, { color: colors.text + "80" }]}>
                      C: {food.carbs}g
                    </Text>
                    <Text style={[styles.macro, { color: colors.text + "80" }]}>
                      G: {food.fat}g
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text + "40"}
                />
              </TouchableOpacity>
            </MotiView>
          ))}
        </ScrollView>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  foodItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  foodPortion: {
    fontSize: 14,
  },
  foodMacros: {
    alignItems: "flex-end",
    marginRight: 12,
  },
  calories: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  macroRow: {
    flexDirection: "row",
    gap: 8,
  },
  macro: {
    fontSize: 14,
  },
});
