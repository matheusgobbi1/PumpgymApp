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

  // Se name não existir (não deveria acontecer se filtrado antes), usar ID como fallback
  const foodName = food.name ?? food.id;

  return {
    food_id: food.id,
    food_name: foodName, // Usar nome verificado ou ID
    food_type: food.category || "Generic foods",
    food_url: "",
    brand_name: food.brandName,
    servings: servings,
  };
};

// Função para buscar alimentos no banco de dados local
export const searchLocalFoods = (query: string): FoodResponse => {
  if (!query || query.trim() === "") {
    // Retorna todos os itens COM nome se a query for vazia
    const items = combinedFoodDatabase
      .filter(
        (food): food is FoodData & { name: string } =>
          typeof food.name === "string"
      )
      .map(convertFoodDataToFoodItem);
    return { items };
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Buscar alimentos que TENHAM nome e contenham a query no nome
  const results = combinedFoodDatabase.filter(
    (
      food
    ): food is FoodData & {
      name: string;
    } =>
      typeof food.name === "string" &&
      food.name.toLowerCase().includes(normalizedQuery)
  );

  // Converter para o formato FoodItem (agora seguro, pois filtramos itens sem nome)
  const items = results.map((food) => convertFoodDataToFoodItem(food));

  return { items };
};

// Função para obter detalhes de um alimento pelo ID
export const getLocalFoodDetails = (foodId: string): FoodResponse => {
  // Buscar alimento pelo ID
  const food = combinedFoodDatabase.find((food) => food.id === foodId);

  // Verificar se o alimento foi encontrado E se possui a propriedade 'name'
  if (!food || typeof food.name !== "string") {
    return { items: [] }; // Retorna vazio se não achar ou não tiver nome
  }

  // Converter para o formato FoodItem (agora seguro, pois name existe)
  // O cast implícito funciona aqui devido à verificação acima
  const foodItem = convertFoodDataToFoodItem(food);

  return { items: [foodItem] };
};
