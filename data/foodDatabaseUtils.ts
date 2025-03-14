import { FoodData } from "../types/food";
import { combinedFoodDatabase } from "./foodDatabase";
import { FoodResponse, FoodItem, FoodServing } from "../types/food";

// Função para converter FoodData para FoodItem
export const convertFoodDataToFoodItem = (food: FoodData): FoodItem => {
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

  // Reordenar as porções para priorizar embalagens e unidades
  const reorderedServings = [...servings].sort((a, b) => {
    // Verificar se a porção é uma embalagem ou unidade
    const isPackageA =
      a.serving_description.toLowerCase().includes("unidade") ||
      a.serving_description.toLowerCase().includes("pacote") ||
      a.serving_description.toLowerCase().includes("embalagem") ||
      a.serving_description.toLowerCase().includes("pote") ||
      a.serving_description.toLowerCase().includes("garrafa") ||
      a.serving_description.toLowerCase().includes("lata") ||
      a.serving_description.toLowerCase().includes("copo");

    const isPackageB =
      b.serving_description.toLowerCase().includes("unidade") ||
      b.serving_description.toLowerCase().includes("pacote") ||
      b.serving_description.toLowerCase().includes("embalagem") ||
      b.serving_description.toLowerCase().includes("pote") ||
      b.serving_description.toLowerCase().includes("garrafa") ||
      b.serving_description.toLowerCase().includes("lata") ||
      b.serving_description.toLowerCase().includes("copo");

    // Se ambos são embalagens ou nenhum é, manter a ordem original
    if (isPackageA === isPackageB) {
      // Se nenhum é embalagem, priorizar porções diferentes de 100g
      if (!isPackageA) {
        const is100gA = a.serving_description.toLowerCase().includes("100g");
        const is100gB = b.serving_description.toLowerCase().includes("100g");

        if (is100gA && !is100gB) return 1;
        if (!is100gA && is100gB) return -1;
      }
      return 0;
    }

    // Priorizar embalagens
    return isPackageA ? -1 : 1;
  });

  return {
    food_id: food.id,
    food_name: food.name,
    food_type: food.category || "Generic foods",
    food_url: "",
    brand_name: food.brandName,
    servings: reorderedServings,
  };
};

// Função para buscar alimentos no banco de dados local
export const searchFoodsMockup = (query: string): FoodResponse => {
  if (!query || query.trim() === "") {
    return { items: [] };
  }

  const normalizedQuery = query.toLowerCase().trim();
  // Dividir a consulta em palavras-chave individuais
  const keywords = normalizedQuery
    .split(/\s+/)
    .filter((keyword) => keyword.length > 1);

  // Buscar alimentos que contenham todas as palavras-chave no nome, em qualquer ordem
  const results = combinedFoodDatabase.filter((food) => {
    const normalizedName = food.name.toLowerCase();
    // Verificar se todas as palavras-chave estão presentes no nome do alimento
    return keywords.every((keyword) => normalizedName.includes(keyword));
  });

  // Converter para o formato FoodItem
  const items = results.map((food) => convertFoodDataToFoodItem(food));

  return { items };
};

// Função para obter detalhes de um alimento pelo ID
export const getFoodDetailsMockup = (foodId: string): FoodResponse => {
  // Buscar alimento pelo ID
  const food = combinedFoodDatabase.find((food) => food.id === foodId);

  if (!food) {
    return { items: [] };
  }

  // Converter para o formato FoodItem
  const foodItem = convertFoodDataToFoodItem(food);

  return { items: [foodItem] };
};
