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
  Platform,
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
import { useToast } from "../../components/common/ToastContext";

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

// Função para formatar corretamente a descrição da porção
const formatPortionDescription = (food: any): string => {
  if (!food.portionDescription) {
    return `${food.portion}g`;
  }

  // Verificar se a descrição da porção está no formato "Nx algo"
  const isMultipleFormat = food.portionDescription.includes("x ");
  if (!isMultipleFormat) {
    // Se não for no formato multiplicado, manter o formato original
    return food.portionDescription;
  }

  // Extrair partes da descrição
  const parts = food.portionDescription.split("x ");
  const multiplier = parseFloat(parts[0]);
  const description = parts[1];

  // Verificar se é unidade ou peso
  const isUnitBased =
    food.name
      .toLowerCase()
      .match(/(ovo|cookie|banana|maçã|maca|pão|pera|bolacha|fatia|unidade)/i) ||
    description.toLowerCase().match(/(unidade|pacote|embalagem|pote|fatia)/i);

  if (isUnitBased) {
    // Para unidades, manter formato "N unidades"
    let unitName = "unidade";
    if (description.toLowerCase().includes("fatia")) {
      unitName = "fatia";
    } else if (description.match(/pacote|embalagem|pote/i)) {
      unitName = description.toLowerCase().replace(/s$/, ""); // Remover 's' se houver
    }

    return `${multiplier} ${unitName}${multiplier > 1 ? "s" : ""}`;
  } else if (description.includes("g")) {
    // Para gramas, calcular o total
    const gramsValue = parseFloat(description.replace("g", ""));
    const totalGrams = multiplier * gramsValue;
    return `${totalGrams}g`;
  }

  // Para outros casos, manter o formato original
  return food.portionDescription;
};

// Item de alimento recente
const RecentFoodItem = React.memo(
  ({
    food,
    index,
    theme,
    mealColor,
    colors,
    navigateToFoodDetails,
    handleQuickAdd,
    t,
  }: {
    food: any;
    index: number;
    theme: string;
    mealColor: string;
    colors: any;
    navigateToFoodDetails: Function;
    handleQuickAdd: Function;
    t: Function;
  }) => (
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
          {
            backgroundColor: colors.light,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigateToFoodDetails(food);
        }}
      >
        <View style={styles.recentFoodInfo}>
          <Text style={[styles.recentFoodName, { color: colors.text }]}>
            {t(`foods.${food.id}`, { defaultValue: food.name })}
          </Text>
          <Text style={[styles.recentFoodMeta, { color: colors.text + "80" }]}>
            {food.portionDescription
              ? `${formatPortionDescription(food)} • ${food.calories} kcal`
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
  )
);

// Item de resultado de busca
const SearchResultItem = React.memo(
  ({
    result,
    index,
    theme,
    mealColor,
    colors,
    handleFoodSelect,
    handleQuickAddFromSearch,
    getServingDescription,
    t,
  }: {
    result: FoodItem;
    index: number;
    theme: string;
    mealColor: string;
    colors: any;
    handleFoodSelect: Function;
    handleQuickAddFromSearch: Function;
    getServingDescription: Function;
    t: Function;
  }) => (
    <MotiView
      key={`${result.food_id}_${index}_${theme}`}
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 100 }}
    >
      <TouchableOpacity
        key={`food-item-${result.food_id}-${theme}`}
        style={[
          styles.foodItem,
          {
            backgroundColor: colors.light,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          handleFoodSelect(result);
        }}
      >
        <View style={styles.foodInfo}>
          <Text style={[styles.foodName, { color: colors.text }]}>
            {t(`foods.${result.food_id}`, { defaultValue: result.food_name })}
          </Text>
          <Text style={[styles.foodCategory, { color: colors.text + "80" }]}>
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
  )
);

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
  const { showToast } = useToast();

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
        // Mostrar erro no toast
        showToast({
          message: t("nutrition.addFood.searchError"),
          type: "error",
          duration: 4000,
          position: "bottom",
        });
      }
    }, 300), // Reduzir o atraso do debounce de 500 para 300ms
    [t, showToast]
  );

  useEffect(() => {
    debouncedSearch(searchQuery, selectedCategory);
    return () => debouncedSearch.cancel();
  }, [searchQuery, selectedCategory, debouncedSearch]);

  // Função para adicionar alimento diretamente
  const handleQuickAdd = useCallback(
    async (food: {
      id: string;
      name: string;
      portion: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Verificar se já existe um alimento com este nome na refeição atual
      const currentFoods = meals[selectedDate]?.[mealId] || [];
      const existingFood = currentFoods.find(
        (item) => item.name.toLowerCase() === food.name.toLowerCase()
      );

      if (existingFood) {
        // Se já existe, incrementar a porção em vez de adicionar um novo
        const updatedFood = {
          ...existingFood,
          name: t(`foods.${existingFood.id}`, {
            defaultValue: existingFood.name,
          }),
          portion: existingFood.portion + food.portion,
          calories: Math.round(
            (existingFood.calories / existingFood.portion) *
              (existingFood.portion + food.portion)
          ),
          protein: parseFloat(
            (
              (existingFood.protein / existingFood.portion) *
              (existingFood.portion + food.portion)
            ).toFixed(1)
          ),
          carbs: parseFloat(
            (
              (existingFood.carbs / existingFood.portion) *
              (existingFood.portion + food.portion)
            ).toFixed(1)
          ),
          fat: parseFloat(
            (
              (existingFood.fat / existingFood.portion) *
              (existingFood.portion + food.portion)
            ).toFixed(1)
          ),
        };

        // Atualizar a descrição de porção, se existir
        if (existingFood.portionDescription) {
          const isMultipleFormat =
            existingFood.portionDescription.includes("x ");
          const isUnitBased = existingFood.name
            .toLowerCase()
            .match(
              /(ovo|cookie|banana|maçã|maca|pão|pera|bolacha|fatia|unidade)/i
            );

          if (isMultipleFormat) {
            // Se já está no formato "2x algo", apenas atualizar o número
            const parts = existingFood.portionDescription.split("x ");
            const multiplier = parseFloat(parts[0]);
            updatedFood.portionDescription = `${multiplier + 1}x ${parts[1]}`;
          } else if (isUnitBased) {
            // Se for baseado em unidades, criar formato mais natural
            let unitName = "unidade";
            if (existingFood.name.toLowerCase().includes("fatia"))
              unitName = "fatia";

            updatedFood.portionDescription = `2 ${unitName}s`;
          } else if (existingFood.portionDescription.includes("g")) {
            // Se for em gramas, atualizar o valor
            updatedFood.portionDescription = `${updatedFood.portion}g`;
          }
        }

        // Adicionar o alimento atualizado à refeição
        addFoodToMeal(mealId, updatedFood);

        // Mostrar toast de sucesso com mensagem específica para incremento
        showToast({
          message: t("nutrition.addFood.portionIncreased", {
            name: updatedFood.name,
          }),
          type: "success",
          position: "bottom",
        });
      } else {
        // Se não existir, adicionar como novo alimento
        const newFood: Food = {
          id: uuidv4(),
          name: t(`foods.${food.id}`, { defaultValue: food.name }),
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

        // Mostrar toast de sucesso
        showToast({
          message: t("nutrition.addFood.addedToMealToast", {
            name: newFood.name,
          }),
          type: "success",
          position: "bottom",
        });
      }
    },
    [
      mealId,
      addFoodToMeal,
      addToSearchHistory,
      showToast,
      t,
      meals,
      selectedDate,
    ]
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

  // Função para adicionar alimento da pesquisa diretamente
  const handleQuickAddFromSearch = useCallback(
    async (food: FoodItem) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Chamar getPreferredServing AQUI para obter a porção
      const preferredServing = getPreferredServing(food.servings);

      // Calcula os valores nutricionais baseado na porção preferida
      const calculatedNutrients = {
        calories: Math.round(preferredServing.calories),
        protein: Math.round(preferredServing.protein * 10) / 10,
        carbs: Math.round(preferredServing.carbohydrate * 10) / 10,
        fat: Math.round(preferredServing.fat * 10) / 10,
      };

      // Verificar se já existe um alimento com este nome na refeição atual
      const currentFoods = meals[selectedDate]?.[mealId] || [];
      const existingFood = currentFoods.find(
        (item) => item.name.toLowerCase() === food.food_name.toLowerCase()
      );

      if (existingFood) {
        // Se já existe, incrementar a porção em vez de adicionar um novo
        const newPortion = preferredServing.metric_serving_amount || 100; // Usar preferredServing obtido acima
        const updatedFood = {
          ...existingFood,
          name: t(`foods.${existingFood.id}`, {
            defaultValue: existingFood.name,
          }),
          portion: existingFood.portion + newPortion,
          calories: Math.round(
            (existingFood.calories / existingFood.portion) *
              (existingFood.portion + newPortion)
          ),
          protein: parseFloat(
            (
              (existingFood.protein / existingFood.portion) *
              (existingFood.portion + newPortion)
            ).toFixed(1)
          ),
          carbs: parseFloat(
            (
              (existingFood.carbs / existingFood.portion) *
              (existingFood.portion + newPortion)
            ).toFixed(1)
          ),
          fat: parseFloat(
            (
              (existingFood.fat / existingFood.portion) *
              (existingFood.portion + newPortion)
            ).toFixed(1)
          ),
        };

        // Atualizar a descrição de porção, se existir
        if (existingFood.portionDescription) {
          const isMultipleFormat =
            existingFood.portionDescription.includes("x ");
          const isUnitBased =
            existingFood.name
              .toLowerCase()
              .match(
                /(ovo|cookie|banana|maçã|maca|pão|pera|bolacha|fatia|unidade)/i
              ) ||
            (preferredServing.serving_description &&
              (preferredServing.serving_description
                .toLowerCase()
                .includes("unidade") ||
                preferredServing.serving_description
                  .toLowerCase()
                  .includes("fatia")));

          if (isMultipleFormat) {
            // Se já está no formato "2x algo", apenas atualizar o número
            const parts = existingFood.portionDescription.split("x ");
            const multiplier = parseFloat(parts[0]);
            updatedFood.portionDescription = `${multiplier + 1}x ${parts[1]}`;
          } else if (isUnitBased) {
            // Se for baseado em unidades, criar formato mais natural
            let unitName = "unidade";
            if (
              existingFood.name.toLowerCase().includes("fatia") ||
              (preferredServing.serving_description &&
                preferredServing.serving_description
                  .toLowerCase()
                  .includes("fatia"))
            ) {
              unitName = "fatia";
            }

            updatedFood.portionDescription = `2 ${unitName}s`;
          } else if (existingFood.portionDescription.includes("g")) {
            // Se for em gramas, atualizar o valor
            updatedFood.portionDescription = `${updatedFood.portion}g`;
          }
        }

        // Adicionar o alimento atualizado à refeição
        addFoodToMeal(mealId, updatedFood);

        // Mostrar toast de sucesso com mensagem específica para incremento
        showToast({
          message: t("nutrition.addFood.portionIncreased", {
            name: updatedFood.name,
          }),
          type: "success",
          position: "bottom",
        });
      } else {
        // Se não existir, adicionar como novo alimento
        const newFood: Food = {
          id: uuidv4(),
          name: t(`foods.${food.food_id}`, { defaultValue: food.food_name }),
          calories: calculatedNutrients.calories,
          protein: calculatedNutrients.protein,
          carbs: calculatedNutrients.carbs,
          fat: calculatedNutrients.fat,
          portion: preferredServing.metric_serving_amount || 100, // Usar preferredServing obtido acima
          portionDescription: preferredServing.serving_description, // Usar preferredServing obtido acima
        };

        // Adicionar o alimento à refeição
        addFoodToMeal(mealId, newFood);

        // Adicionar ao histórico de busca
        await addToSearchHistory(newFood);

        // Mostrar toast de sucesso
        showToast({
          message: t("nutrition.addFood.addedToMealToast", {
            name: newFood.name,
          }),
          type: "success",
          position: "bottom",
        });
      }
    },
    [
      mealId,
      addFoodToMeal,
      addToSearchHistory,
      showToast,
      t,
      getPreferredServing, // Manter como dependência
      meals,
      selectedDate,
    ]
  );

  // Função para exibir a descrição da porção de forma amigável
  const getServingDescription = useCallback(
    (food: FoodItem): string => {
      if (!food.servings || food.servings.length === 0) {
        return "100g • N/A kcal"; // Fallback
      }

      const preferredServing = getPreferredServing(food.servings);

      let displayDescription = "";
      const servingDescLower = preferredServing.serving_description?.toLowerCase();
      const metricAmount = preferredServing.metric_serving_amount;
      const metricUnit = preferredServing.metric_serving_unit;

      // Define uma descrição padrão baseada nos dados métricos, se disponíveis
      if (metricAmount && metricUnit) {
        displayDescription = `${Math.round(metricAmount)}${metricUnit}`;
      } else if (preferredServing.serving_description) {
        displayDescription = preferredServing.serving_description; // Usa a descrição se não houver dados métricos
      } else {
        displayDescription = "Porção"; // Fallback final
      }

      // Se uma serving_description existe e NÃO é apenas a representação em gramas,
      // prefira a serving_description por ser mais informativa.
      if (preferredServing.serving_description) {
        const isJustGrams =
          metricUnit === "g" &&
          metricAmount &&
          servingDescLower === `${Math.round(metricAmount)}g`;

        if (!isJustGrams) {
          // Se a descrição não for apenas o valor em gramas (ex: "1 unidade", "1 fatia (30g)"), use-a.
          displayDescription = preferredServing.serving_description;
        }
        // Caso contrário (isJustGrams é true), mantém a descrição métrica (ex: "100g")
      }

      return `${displayDescription} • ${Math.round(
        preferredServing.calories
      )} kcal`;
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
    const normalizedName = foodName.toLowerCase().replace(/[^a-z0-9]/g, "");
    return normalizedName + "_temp";
  };

  // Função para navegar para a tela de detalhes do alimento
  const navigateToFoodDetails = (food: {
    id: string;
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
        mealColor,
        // Passar dados adicionais para que a tela de detalhes possa exibir mesmo sem buscar na API
        foodName: t(`foods.${food.id}`, { defaultValue: food.name }),
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

  const renderSearchResults = useCallback(() => {
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
        <SearchResultItem
          key={`search-result-${result.food_id}-${index}`}
          result={result}
          index={index}
          theme={theme}
          mealColor={mealColor}
          colors={colors}
          handleFoodSelect={handleFoodSelect}
          handleQuickAddFromSearch={handleQuickAddFromSearch}
          getServingDescription={getServingDescription}
          t={t}
        />
      );
    });
  }, [
    searchResults,
    searchQuery,
    error,
    colors,
    theme,
    mealColor,
    t,
    router,
    mealId,
    handleFoodSelect,
    handleQuickAddFromSearch,
    getServingDescription,
  ]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      {/* Header */}
      <View
        style={[styles.header, { paddingTop: Platform.OS === "ios" ? 70 : 50 }]}
      >
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

      {/* Search Bar com borda */}
      <View
        key={`search-container-${theme}`}
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.light,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
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

      {/* Categoria Filter com bordas */}
      <View style={styles.filterWrapper}>
        <FoodCategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          mealColor={mealColor}
        />
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
                      borderWidth: 1,
                      borderColor: colors.border,
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
              <RecentFoodItem
                key={`recent-food-item-${food.id}-${index}`}
                food={food}
                index={index}
                theme={theme}
                mealColor={mealColor}
                colors={colors}
                navigateToFoodDetails={navigateToFoodDetails}
                handleQuickAdd={handleQuickAdd}
                t={t}
              />
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
    fontFamily: "Anton-Regular",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 20,
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
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    paddingBottom: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  foodItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#DADADA",
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
    borderWidth: 1,
    borderColor: "#DADADA",
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
    marginBottom: 12,
  },
  categoryFilterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 0,
    flexDirection: "row",
    height: 32,
  },
  categoryFilterItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0,
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 16,
  },
  addCustomButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addCustomButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});
