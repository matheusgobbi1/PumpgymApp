import { FoodData } from "../types/food";
import { combinedFoodDatabase } from "../data/foodDatabase";
import { FoodResponse, FoodItem, FoodServing } from "../types/food";

// Função para converter FoodData para FoodItem
const convertFoodDataToFoodItem = (food: FoodData): FoodItem => {
  // Criar servings a partir das measures
  const servings: FoodServing[] = food.measures.map((measure) => ({
    serving_id: measure.id,
    serving_description: measure.label,
    metric_serving_amount: measure.weight,
    metric_serving_unit: "g",
    calories: Math.round((food.nutrients.calories * measure.weight) / 100),
    protein:
      Math.round(((food.nutrients.protein * measure.weight) / 100) * 10) / 10,
    fat: Math.round(((food.nutrients.fat * measure.weight) / 100) * 10) / 10,
    carbohydrate:
      Math.round(((food.nutrients.carbs * measure.weight) / 100) * 10) / 10,
    fiber: food.nutrients.fiber
      ? Math.round(((food.nutrients.fiber * measure.weight) / 100) * 10) / 10
      : undefined,
  }));

  return {
    food_id: food.id,
    food_name: food.name,
    food_type: food.category || "Generic foods",
    food_url: "",
    brand_name: food.brandName,
    servings: servings,
  };
};

// Função para buscar alimentos no banco de dados local
export const searchLocalFoods = (query: string): FoodResponse => {
  if (!query || query.trim() === "") {
    return { items: [] };
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Buscar alimentos que contenham a query no nome
  const results = combinedFoodDatabase.filter((food) =>
    food.name.toLowerCase().includes(normalizedQuery)
  );

  // Converter para o formato FoodItem
  const items = results.map((food) => convertFoodDataToFoodItem(food));

  return { items };
};

// Função para obter detalhes de um alimento pelo ID
export const getLocalFoodDetails = (foodId: string): FoodResponse => {
  // Buscar alimento pelo ID
  const food = combinedFoodDatabase.find((food) => food.id === foodId);

  if (!food) {
    return { items: [] };
  }

  // Converter para o formato FoodItem
  const foodItem = convertFoodDataToFoodItem(food);

  return { items: [foodItem] };
};
