import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { MotiView } from "moti";
import { searchFoods } from "../../services/food";
import { FoodItem, FoodServing } from "../../types/food";
import { translateMeasure } from "../../utils/translateUtils";
import { debounce } from "lodash";
import { useMeals, Food } from "../../context/MealContext";
import * as Haptics from "expo-haptics";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "react-i18next";
import { getFoodCategories } from "../../data/foodDatabaseUtils";

const { width } = Dimensions.get("window");

interface RecentFoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  portionDescription?: string;
}

const recentFoods: RecentFoodItem[] = [
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

// Otimizar o componente de filtro de categoria para usar memo
const FoodCategoryFilter = React.memo(
  ({
    selectedCategory,
    onSelectCategory,
    mealColor,
  }: {
    selectedCategory: string | null;
    onSelectCategory: (category: string | null) => void;
    mealColor: string;
  }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { t } = useTranslation();

    // Usar useMemo para evitar recriação do array de categorias a cada renderização
    const foodCategories = useMemo(() => getFoodCategories(), []);

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryFilterContainer}
      >
        <TouchableOpacity
          style={[
            styles.categoryFilterItem,
            selectedCategory === null && {
              backgroundColor: mealColor + "20",
            },
          ]}
          onPress={() => onSelectCategory(null)}
        >
          <Text
            style={[
              styles.categoryFilterText,
              {
                color:
                  selectedCategory === null ? mealColor : colors.text + "80",
              },
            ]}
          >
            {t("exercise.allCategories")}
          </Text>
        </TouchableOpacity>

        {foodCategories.map((category, index) => (
          <TouchableOpacity
            key={`category-${index}`}
            style={[
              styles.categoryFilterItem,
              selectedCategory === category && {
                backgroundColor: mealColor + "20",
              },
            ]}
            onPress={() => onSelectCategory(category)}
          >
            <Text
              style={[
                styles.categoryFilterText,
                {
                  color:
                    selectedCategory === category
                      ? mealColor
                      : colors.text + "80",
                },
              ]}
            >
              {t(`nutrition.categories.${category}`, {
                defaultValue: category,
              })}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }
);

// Adicionar função para remover acentos de um texto
const removeAccents = (text: string) => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

export default function AddFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const {
    meals,
    selectedDate,
    addFoodToMeal,
    saveMeals,
    searchHistory,
    addToSearchHistory,
    clearSearchHistory,
  } = useMeals();
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

  // Extrair parâmetros da refeição
  const mealId = params.mealId as string;
  const mealName = params.mealName as string;
  const mealColor = (params.mealColor as string) || colors.primary;
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

  // Função para selecionar uma categoria - otimizada para evitar re-renderizações desnecessárias
  const handleSelectCategory = useCallback(
    (category: string | null) => {
      if (category === selectedCategory) return; // Evitar re-renderização se a categoria for a mesma

      setSelectedCategory(category);

      // Usar requestAnimationFrame para separar a operação de renderização e processamento
      requestAnimationFrame(() => {
        searchFoods(searchQuery, category || undefined)
          .then((response) => {
            setSearchResults(response.items || []);
          })
          .catch((err) => {
            setError(t("nutrition.addFood.searchError"));
          });
      });
    },
    [searchQuery, selectedCategory, t]
  );

  // Função de busca com debounce - melhorar o desempenho
  const debouncedSearch = useCallback(
    debounce(async (query: string, category: string | null) => {
      if (!query.trim() && !category) {
        setSearchResults([]);
        return;
      }

      try {
        // Remover acentos na consulta antes de enviar
        const normalizedQuery = removeAccents(query);
        const response = await searchFoods(
          normalizedQuery,
          category || undefined
        );
        setSearchResults(response.items || []);
      } catch (err) {
        setError(t("nutrition.addFood.searchError"));
      }
    }, 300), // Reduzir o atraso do debounce de 500 para 300ms
    [t]
  );

  useEffect(() => {
    debouncedSearch(searchQuery, selectedCategory);
    return () => debouncedSearch.cancel();
  }, [searchQuery, selectedCategory, debouncedSearch]);

  // Função para adicionar alimento diretamente
  const handleQuickAdd = useCallback(
    async (food: {
      name: string;
      portion: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const newFood: Food = {
        id: uuidv4(),
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        portion: food.portion,
      };

      // Adicionar o alimento à refeição
      addFoodToMeal(mealId, newFood);

      // Adicionar ao histórico de busca
      await addToSearchHistory(newFood);
    },
    [mealId, addFoodToMeal, addToSearchHistory]
  );

  // Função para adicionar alimento da pesquisa diretamente
  const handleQuickAddFromSearch = useCallback(
    async (food: FoodItem) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Encontrar a porção mais adequada para exibição
      const preferredServing = getPreferredServing(food.servings);

      // Calcula os valores nutricionais baseado na porção preferida
      const calculatedNutrients = {
        calories: Math.round(preferredServing.calories),
        protein: Math.round(preferredServing.protein * 10) / 10,
        carbs: Math.round(preferredServing.carbohydrate * 10) / 10,
        fat: Math.round(preferredServing.fat * 10) / 10,
      };

      const newFood: Food = {
        id: uuidv4(),
        name: food.food_name,
        calories: calculatedNutrients.calories,
        protein: calculatedNutrients.protein,
        carbs: calculatedNutrients.carbs,
        fat: calculatedNutrients.fat,
        portion: preferredServing.metric_serving_amount || 100,
        portionDescription: preferredServing.serving_description,
      };

      // Adicionar o alimento à refeição
      addFoodToMeal(mealId, newFood);

      // Adicionar ao histórico de busca
      await addToSearchHistory(newFood);
    },
    [mealId, addFoodToMeal, addToSearchHistory]
  );

  // Função para obter a porção preferida para exibição
  const getPreferredServing = useCallback(
    (servings: FoodServing[]): FoodServing => {
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
          serving.serving_description.toLowerCase().includes("clara") ||
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
    },
    []
  );

  // Função para exibir a descrição da porção de forma amigável
  const getServingDescription = useCallback(
    (food: FoodItem): string => {
      if (!food.servings || food.servings.length === 0) {
        return "100g";
      }

      const preferredServing = getPreferredServing(food.servings);

      // Se for uma porção especial (não apenas gramas), mostrar a descrição e calorias
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
          preferredServing.serving_description.toLowerCase().includes("pote") ||
          preferredServing.serving_description
            .toLowerCase()
            .includes("garrafa") ||
          preferredServing.serving_description.toLowerCase().includes("lata") ||
          preferredServing.serving_description.toLowerCase().includes("copo") ||
          preferredServing.serving_description.toLowerCase().includes("bar") ||
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
        return `${preferredServing.serving_description} • ${preferredServing.calories} kcal`;
      }

      // Para porções em gramas que não são 100g, mostrar o peso
      if (
        preferredServing.metric_serving_amount &&
        preferredServing.metric_serving_amount !== 100 &&
        preferredServing.serving_description.toLowerCase().includes("g")
      ) {
        return `${preferredServing.serving_description} • ${preferredServing.calories} kcal`;
      }

      // Para 100g, mostrar apenas o peso
      return `${Math.round(
        preferredServing.metric_serving_amount || 100
      )}g por porção`;
    },
    [getPreferredServing]
  );

  const handleFoodSelect = (food: FoodItem) => {
    router.push({
      pathname: "/(add-food)/food-details",
      params: {
        foodId: food.food_id,
        mealId,
        mealName,
        mealColor,
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
    fiber?: number;
    portionDescription?: string;
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
        portionDescription: food.portionDescription || "",
        fiber: food.fiber?.toString() || "",
        isFromHistory: "true",
      },
    });
  };

  const renderSearchResults = () => {
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
            {t("nutrition.addFood.noFoodFound")}
          </Text>
          <TouchableOpacity
            style={[styles.addCustomButton, { backgroundColor: mealColor }]}
            onPress={() => {
              router.push({
                pathname: "/(add-food)/quick-add",
                params: {
                  mealId,
                  mealColor,
                  customName: searchQuery,
                },
              });
            }}
          >
            <Text style={styles.addCustomButtonText}>
              {t("nutrition.addFood.quickAdd")}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Limitar a 15 resultados
    const limitedResults = searchResults.slice(0, 15);

    return limitedResults.map((result, index) => {
      // Verificar se o resultado tem as propriedades necessárias
      if (!result.food_name) {
        return null;
      }

      return (
        <MotiView
          key={`${result.food_id}_${index}_${theme}`}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: index * 50 }}
        >
          <TouchableOpacity
            key={`food-item-${result.food_id}-${theme}`}
            style={[styles.foodItem, { backgroundColor: colors.light }]}
            onPress={() => handleFoodSelect(result)}
          >
            <View style={styles.foodInfo}>
              <Text style={[styles.foodName, { color: colors.text }]}>
                {result.food_name}
              </Text>
              <Text
                style={[styles.foodCategory, { color: colors.text + "80" }]}
              >
                {getServingDescription(result)}
              </Text>
            </View>
            <TouchableOpacity
              key={`add-button-${result.food_id}-${theme}`}
              style={[styles.addButton, { backgroundColor: mealColor }]}
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
            {t("nutrition.addFood.title")}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text + "80" }]}>
            {t(`nutrition.mealTypes.${mealId}`, { defaultValue: mealName })}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View
        key={`search-container-${theme}`}
        style={[styles.searchContainer, { backgroundColor: colors.light }]}
      >
        <Ionicons
          name="search"
          size={20}
          color={colors.text}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t("nutrition.addFood.searchPlaceholder")}
          placeholderTextColor={colors.text + "80"}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          spellCheck={false}
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

      {/* Categoria Filter */}
      <View style={styles.filterWrapper}>
        <FoodCategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          mealColor={mealColor}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <View style={styles.quickActionWrapper}>
          <TouchableOpacity
            key={`scan-button-${theme}`}
            style={[
              styles.quickActionButton,
              { backgroundColor: colors.light },
            ]}
            disabled={true}
          >
            <Ionicons
              name="barcode-outline"
              size={24}
              color={colors.text + "40"}
            />
            <Text
              style={[styles.quickActionText, { color: colors.text + "40" }]}
            >
              {t("nutrition.addFood.scanCode")}
            </Text>
          </TouchableOpacity>
          <View
            style={[
              styles.comingSoonOverlay,
              { backgroundColor: colors.background + "70" },
            ]}
          >
            <Text style={[styles.comingSoonText, { color: colors.primary }]}>
              Em breve
            </Text>
          </View>
        </View>

        <TouchableOpacity
          key={`quick-add-button-${theme}`}
          style={[styles.quickActionButton, { backgroundColor: colors.light }]}
          onPress={() =>
            router.push({
              pathname: "/(add-food)/quick-add",
              params: {
                mealId,
                mealColor,
              },
            })
          }
        >
          <Ionicons
            name="add-circle-outline"
            size={24}
            color={colors.primary}
          />
          <Text style={[styles.quickActionText, { color: colors.text }]}>
            {t("nutrition.addFood.quickAdd")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Histórico de Adições Recentes */}
        {searchHistory.length > 0 && !searchQuery && !selectedCategory && (
          <View
            key={`recent-history-${theme}`}
            style={styles.recentHistorySection}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("nutrition.addFood.recentlyAdded")}
              </Text>
              <TouchableOpacity onPress={clearSearchHistory}>
                <View
                  style={[
                    styles.clearHistoryWrapper,
                    {
                      backgroundColor: colors.light,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.clearHistoryText,
                      { color: colors.text + "80" },
                    ]}
                  >
                    {t("nutrition.addFood.clear")}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {searchHistory.map((food, index) => (
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
                      {food.portionDescription
                        ? `${food.portionDescription} • ${food.calories} kcal`
                        : `${food.portion}g • ${food.calories} kcal`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    key={`recent-add-button-${food.id}-${theme}`}
                    style={[styles.addButton, { backgroundColor: mealColor }]}
                    onPress={() => handleQuickAdd(food)}
                  >
                    <Ionicons name="add" size={20} color="#FFF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>
        )}

        {/* Resultados da Busca */}
        {(searchQuery.trim() || selectedCategory) && renderSearchResults()}
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
    marginBottom: 10,
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
  quickActionWrapper: {
    flex: 1,
    position: "relative",
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  clearHistoryWrapper: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearHistoryText: {
    fontSize: 14,
    fontWeight: "400",
  },
  // Estilos para o filtro de categoria
  filterWrapper: {
    height: 32,
    marginBottom: 10,
    marginTop: 0,
  },
  categoryFilterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 0,
    flexDirection: "row",
    height: 32,
  },
  categoryFilterItem: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 16,
  },
  comingSoonOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  comingSoonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  addCustomButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  addCustomButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
