import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { MotiView } from "moti";
import { searchFoods } from "../../services/food";
import { EdamamResponse, FoodHint } from "../../types/food";
import {
  translateFoodSearch,
  translateMeasure,
} from "../../utils/translateUtils";
import { debounce } from "lodash";
import { useMeals, Food } from "../../context/MealContext";
import * as Haptics from "expo-haptics";
import { v4 as uuidv4 } from "uuid";

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

// Componente de Skeleton para os itens da lista
const FoodItemSkeleton = ({ index }: { index: number }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <MotiView
      key={`skeleton-item-${index}-${theme}`}
      from={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        type: "timing",
        duration: 1000,
        loop: true,
        delay: index * 100,
      }}
      style={[styles.foodItem, { backgroundColor: colors.light }]}
    >
      <View style={styles.foodInfo}>
        <MotiView
          key={`skeleton-name-${index}-${theme}`}
          from={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{
            type: "timing",
            duration: 1000,
            loop: true,
          }}
          style={[
            styles.skeletonFoodName,
            { backgroundColor: colors.text + "20" },
          ]}
        />
        <MotiView
          key={`skeleton-category-${index}-${theme}`}
          from={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{
            type: "timing",
            duration: 1000,
            loop: true,
          }}
          style={[
            styles.skeletonFoodCategory,
            { backgroundColor: colors.text + "20" },
          ]}
        />
      </View>
      <MotiView
        key={`skeleton-button-${index}-${theme}`}
        from={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{
          type: "timing",
          duration: 1000,
          loop: true,
        }}
        style={[
          styles.skeletonAddButton,
          { backgroundColor: colors.text + "20" },
        ]}
      />
    </MotiView>
  );
};

// Componente de Skeleton para a lista de resultados
const SearchResultsSkeleton = () => {
  const { theme } = useTheme();
  
  return (
    <>
      {[...Array(5)].map((_, index) => (
        <FoodItemSkeleton key={`skeleton_${index}_${theme}`} index={index} />
      ))}
    </>
  );
};

export default function AddFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodHint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { meals, selectedDate, addFoodToMeal, saveMeals } = useMeals();
  const [recentlyAddedFoods, setRecentlyAddedFoods] = useState<
    {
      id: string;
      name: string;
      portion: number;
      mealName: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }[]
  >([]);

  // Adicionar estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});
  
  // Adicionar efeito para forçar re-renderização quando o tema mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

  // Extrair parâmetros da refeição
  const mealId = params.mealId as string;
  const mealName = params.mealName as string;
  const targetCalories = Number(params.targetCalories);
  const targetProtein = Number(params.targetProtein);
  const targetCarbs = Number(params.targetCarbs);
  const targetFat = Number(params.targetFat);

  // Obter alimentos adicionados recentemente
  useEffect(() => {
    if (meals) {
      const recentFoods: {
        id: string;
        name: string;
        portion: number;
        mealName: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      }[] = [];

      // Percorre todas as datas
      Object.keys(meals).forEach((date) => {
        // Percorre todas as refeições da data
        const mealsForDate = meals[date];
        if (mealsForDate) {
          Object.keys(mealsForDate).forEach((mealId) => {
            // Obtém o nome da refeição com base no ID
            let mealName = "";
            switch (mealId) {
              case "breakfast":
                mealName = "Café da Manhã";
                break;
              case "lunch":
                mealName = "Almoço";
                break;
              case "snack":
                mealName = "Lanche";
                break;
              case "dinner":
                mealName = "Jantar";
                break;
              default:
                mealName = "Refeição";
            }

            // Percorre todos os alimentos da refeição
            const foods = mealsForDate[mealId];
            if (Array.isArray(foods)) {
              foods.forEach((food) => {
                recentFoods.push({
                  id: food.id,
                  name: food.name,
                  portion: food.portion,
                  mealName: mealName,
                  calories: food.calories,
                  protein: food.protein,
                  carbs: food.carbs,
                  fat: food.fat,
                });
              });
            }
          });
        }
      });

      // Ordena por ordem de adição (assumindo que os mais recentes estão no final do array)
      // e limita a 5 itens
      setRecentlyAddedFoods(recentFoods.slice(-5).reverse());
    }
  }, [meals]);

  // Função de busca com debounce
  const debouncedSearch = debounce(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Traduz a query antes de fazer a busca
      const translatedQuery = await translateFoodSearch(query);
      console.log("Query original:", query);
      console.log("Query traduzida:", translatedQuery);

      const response = await searchFoods(translatedQuery);
      setSearchResults(response.hints || []);
    } catch (err) {
      setError("Erro ao buscar alimentos. Tente novamente.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, 500);

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery]);

  // Função para adicionar alimento diretamente
  const handleQuickAdd = async (food: {
    name: string;
    portion: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Adicionar o alimento à refeição
    addFoodToMeal(mealId, {
      id: uuidv4(),
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      portion: food.portion,
    });

    // Salvar as alterações
    await saveMeals();

    // Mostrar confirmação
    Alert.alert(
      "Alimento Adicionado",
      `${food.name} foi adicionado à refeição ${mealName}`,
      [{ text: "OK" }]
    );
  };

  // Função para adicionar alimento da pesquisa diretamente
  const handleQuickAddFromSearch = async (food: FoodHint) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Calcula os valores nutricionais baseado na porção padrão (100g)
    const calculatedNutrients = {
      calories: Math.round(food.food.nutrients.ENERC_KCAL),
      protein: Math.round(food.food.nutrients.PROCNT * 10) / 10,
      carbs: Math.round(food.food.nutrients.CHOCDF * 10) / 10,
      fat: Math.round(food.food.nutrients.FAT * 10) / 10,
    };

    // Adicionar o alimento à refeição
    addFoodToMeal(mealId, {
      id: uuidv4(),
      name: food.food.label,
      calories: calculatedNutrients.calories,
      protein: calculatedNutrients.protein,
      carbs: calculatedNutrients.carbs,
      fat: calculatedNutrients.fat,
      portion: 100, // Porção padrão de 100g
    });

    // Salvar as alterações
    await saveMeals();

    // Mostrar confirmação
    Alert.alert(
      "Alimento Adicionado",
      `${food.food.label} (100g) foi adicionado à refeição ${mealName}`,
      [{ text: "OK" }]
    );
  };

  const handleFoodSelect = (food: FoodHint) => {
    router.push({
      pathname: "/(add-food)/food-details",
      params: {
        foodId: food.food.foodId,
        mealId,
        mealName,
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
      },
    });
  };

  // Função para gerar um ID temporário para o alimento baseado no nome
  const generateTempFoodId = (foodName: string) => {
    // Remover espaços e caracteres especiais e converter para minúsculas
    return foodName.toLowerCase().replace(/[^a-z0-9]/g, "") + "_temp";
  };

  // Função para navegar para a tela de detalhes do alimento
  const navigateToFoodDetails = (food: {
    name: string;
    portion: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Gerar um ID temporário baseado no nome do alimento
    const tempFoodId = generateTempFoodId(food.name);

    router.push({
      pathname: "/(add-food)/food-details",
      params: {
        foodId: tempFoodId,
        mealId,
        mealName,
        // Passar dados adicionais para que a tela de detalhes possa exibir mesmo sem buscar na API
        foodName: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        portion: food.portion,
        isFromHistory: "true",
      },
    });
  };

  const renderSearchResults = () => {
    if (isLoading) {
      return <SearchResultsSkeleton />;
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {error}
          </Text>
        </View>
      );
    }

    if (searchResults.length === 0 && searchQuery.trim()) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Nenhum alimento encontrado
          </Text>
        </View>
      );
    }

    return searchResults.map((result, index) => {
      // Encontra a medida mais comum (geralmente a primeira após gramas)
      const commonMeasure =
        result.measures.find((m) => !m.label.toLowerCase().includes("gram")) ||
        result.measures[0];

      return (
        <MotiView
          key={`${result.food.foodId}_${index}_${theme}`}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: index * 100 }}
        >
          <TouchableOpacity
            key={`food-item-${result.food.foodId}-${theme}`}
            style={[styles.foodItem, { backgroundColor: colors.light }]}
            onPress={() => handleFoodSelect(result)}
          >
            <View style={styles.foodInfo}>
              <Text style={[styles.foodName, { color: colors.text }]}>
                {result.food.label}
              </Text>
              <Text
                style={[styles.foodCategory, { color: colors.text + "80" }]}
              >
                {result.food.categoryLabel}
                {commonMeasure &&
                  ` • ${Math.round(
                    commonMeasure.weight
                  )}g por ${translateMeasure(commonMeasure.label)}`}
              </Text>
            </View>
            <TouchableOpacity
              key={`add-button-${result.food.foodId}-${theme}`}
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => handleQuickAddFromSearch(result)}
            >
              <Ionicons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        </MotiView>
      );
    });
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
            Adicionar Alimento
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text + "80" }]}>
            {mealName}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View key={`search-container-${theme}`} style={[styles.searchContainer, { backgroundColor: colors.light }]}>
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
          <TouchableOpacity 
            key={`clear-search-${theme}`}
            onPress={() => setSearchQuery("")}
          >
            <Ionicons name="close-circle" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          key={`scan-button-${theme}`}
          style={[styles.quickActionButton, { backgroundColor: colors.light }]}
          onPress={() => router.push("/(add-food)/barcode-scanner")}
        >
          <Ionicons name="barcode-outline" size={24} color={colors.primary} />
          <Text style={[styles.quickActionText, { color: colors.text }]}>
            Escanear Código
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          key={`quick-add-button-${theme}`}
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

      <ScrollView
        style={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Histórico de Adições Recentes */}
        {recentlyAddedFoods.length > 0 && !searchQuery && (
          <View key={`recent-history-${theme}`} style={styles.recentHistorySection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Adicionados Recentemente
            </Text>

            {recentlyAddedFoods.map((food, index) => (
              <MotiView
                key={`recent_${food.id}_${index}_${theme}`}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: index * 50 }}
              >
                <TouchableOpacity
                  key={`recent-food-${food.id}-${theme}`}
                  style={[
                    styles.recentFoodItem,
                    { backgroundColor: colors.light },
                  ]}
                  onPress={() => navigateToFoodDetails(food)}
                >
                  <View style={styles.recentFoodInfo}>
                    <Text
                      style={[styles.recentFoodName, { color: colors.text }]}
                    >
                      {food.name}
                    </Text>
                    <Text
                      style={[
                        styles.recentFoodMeta,
                        { color: colors.text + "80" },
                      ]}
                    >
                      {food.portion}g • {food.mealName}
                    </Text>
                  </View>
                  <TouchableOpacity
                    key={`recent-add-button-${food.id}-${theme}`}
                    style={[
                      styles.addButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() =>
                      handleQuickAdd({
                        name: food.name,
                        portion: food.portion,
                        calories: food.calories,
                        protein: food.protein,
                        carbs: food.carbs,
                        fat: food.fat,
                      })
                    }
                  >
                    <Ionicons name="add" size={20} color="#FFF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>
        )}

        {/* Resultados da Busca */}
        {searchQuery.trim() && renderSearchResults()}
      </ScrollView>
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
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
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
  foodCategory: {
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
  skeletonFoodName: {
    height: 16,
    width: width * 0.4,
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonFoodCategory: {
    height: 14,
    width: width * 0.6,
    borderRadius: 7,
  },
  skeletonCalories: {
    height: 16,
    width: 60,
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonMacro: {
    height: 14,
    width: 30,
    borderRadius: 7,
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  recentHistorySection: {
    marginBottom: 20,
  },
  recentFoodItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  recentFoodInfo: {
    flex: 1,
  },
  recentFoodName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  recentFoodMeta: {
    fontSize: 14,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  skeletonAddButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
