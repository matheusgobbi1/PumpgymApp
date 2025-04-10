// Interfaces para nutrientes
export interface FoodNutrients {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  cholesterol?: number;
  saturated_fat?: number;
  trans_fat?: number;
}

// Interface para o banco de dados local de alimentos
export interface FoodData {
  id: string;
  name: string;
  nutrients: FoodNutrients;
  measures: {
    id: string;
    label: string;
    weight: number;
    portionDescription?: string;
  }[];
  brandName?: string;
  category?: string;
}

// Interface para alimentos
export interface Food {
  foodId: string;
  name: string;
  nutrients: FoodNutrients;
  category: string;
  categoryLabel: string;
  image?: string;
  brandName?: string;
  foodType?: string;
  foodUrl?: string;
}

// Interface para medidas
export interface FoodMeasure {
  id: string;
  label: string;
  weight: number;
  description?: string;
  metricAmount?: number;
  metricUnit?: string;
}

// Interface para porções de alimentos
export interface FoodServing {
  serving_id: string;
  serving_description: string;
  serving_url?: string;
  metric_serving_amount?: number;
  metric_serving_unit?: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrate: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  cholesterol?: number;
  saturated_fat?: number;
  trans_fat?: number;
}

// Interface para um item de alimento
export interface FoodItem {
  food_id: string;
  food_name: string;
  food_type: string;
  food_url: string;
  brand_name?: string;
  servings: FoodServing[];
}

// Interface para informações nutricionais detalhadas
export interface NutrientInfo {
  label: string;
  quantity: number;
  unit: string;
}

// Interface para nutrientes totais
export interface TotalNutrients {
  calories: NutrientInfo;
  protein: NutrientInfo;
  fat: NutrientInfo;
  carbs: NutrientInfo;
  fiber?: NutrientInfo;
  sodium?: NutrientInfo;
  sugar?: NutrientInfo;
  cholesterol?: NutrientInfo;
  saturated_fat?: NutrientInfo;
  trans_fat?: NutrientInfo;
  [key: string]: NutrientInfo | undefined;
}

// Interface para a resposta da API
export interface FoodResponse {
  items?: FoodItem[];
  error?: {
    code: number;
    message: string;
  };
}

// Interface para a resposta de busca da API FatSecret
export interface FatSecretSearchResponse {
  foods?: {
    food: FatSecretFood[] | FatSecretFood;
    max_results?: number;
    page_number?: number;
    total_results?: number;
  };
  error?: {
    code: number;
    message: string;
  };
}

// Interface para a resposta de detalhes da API FatSecret
export interface FatSecretFoodResponse {
  food?: FatSecretFood;
  error?: {
    code: number;
    message: string;
  };
}

// Interface para um alimento da API FatSecret
export interface FatSecretFood {
  food_id: string;
  food_name: string;
  food_description?: string;
  brand_name?: string;
  food_type?: string;
  food_url?: string;
  servings?: {
    serving: FoodServing[] | FoodServing;
  };
}

// Função para converter FatSecretFood para FoodItem
export function convertFatSecretToFoodItem(food: FatSecretFood): FoodItem {
  // Obter a primeira porção ou criar uma padrão
  let servings: FoodServing[] = [];

  if (food.servings && food.servings.serving) {
    if (Array.isArray(food.servings.serving)) {
      servings = food.servings.serving;
    } else {
      servings = [food.servings.serving];
    }
  } else if (food.food_description) {
    // Para resultados de pesquisa que só têm descrição, extrair informações nutricionais
    // Formato típico: "Per 1 bar - Calories: 250kcal | Fat: 12.00g | Carbs: 32.00g | Protein: 4.00g"
    const description = food.food_description;

    // Extrair porção (ex: "1 bar")
    const portionMatch = description.match(/Per\s+([^-]+)-/i);
    const portion = portionMatch ? portionMatch[1].trim() : "1 serving";

    // Extrair valores nutricionais usando regex
    const caloriesMatch = description.match(/Calories:\s+(\d+)/i);
    const fatMatch = description.match(/Fat:\s+([\d.]+)g/i);
    const carbsMatch = description.match(/Carbs:\s+([\d.]+)g/i);
    const proteinMatch = description.match(/Protein:\s+([\d.]+)g/i);

    // Extrair/estimar peso em gramas - se presente no nome do produto
    let weight = 0;
    // Procurar por padrão como "(1.86 oz)" no nome e converter para gramas
    const weightOzMatch = food.food_name.match(/\(([\d.]+)\s*oz\)/i);
    if (weightOzMatch) {
      // Converter onças para gramas (1 oz ≈ 28.35g)
      weight = Math.round(parseFloat(weightOzMatch[1]) * 28.35);
    }

    // Para produtos de dimensões conhecidas (Mini, Fun Size, etc.)
    if (food.food_name.includes("Fun Size")) {
      weight = weight || 20; // Aproximadamente 20g para Fun Size se não detectado
    } else if (food.food_name.includes("Mini")) {
      weight = weight || 15; // Aproximadamente 15g para Mini se não detectado
    } else if (portion.includes("bar") && !weight) {
      weight = 50; // Valor padrão para barras se nenhum peso for detectado
    }

    // Criar serving com dados extraídos
    servings = [
      {
        serving_id: "0",
        serving_description: portion,
        metric_serving_amount: weight,
        metric_serving_unit: "g",
        calories: caloriesMatch ? parseInt(caloriesMatch[1], 10) : 0,
        protein: proteinMatch ? parseFloat(proteinMatch[1]) : 0,
        fat: fatMatch ? parseFloat(fatMatch[1]) : 0,
        carbohydrate: carbsMatch ? parseFloat(carbsMatch[1]) : 0,
      },
    ];

    // Adicionar uma porção de 100g para compatibilidade, se tivermos peso
    if (weight > 0) {
      const scaleFactor = 100 / weight;
      servings.push({
        serving_id: "100g",
        serving_description: "100g",
        metric_serving_amount: 100,
        metric_serving_unit: "g",
        calories: Math.round(servings[0].calories * scaleFactor),
        protein: Math.round(servings[0].protein * scaleFactor * 10) / 10,
        fat: Math.round(servings[0].fat * scaleFactor * 10) / 10,
        carbohydrate:
          Math.round(servings[0].carbohydrate * scaleFactor * 10) / 10,
      });
    }
  } else {
    // Fallback para 100g se nenhuma informação nutricional estiver disponível
    servings = [
      {
        serving_id: "0",
        serving_description: "100g",
        metric_serving_amount: 100,
        metric_serving_unit: "g",
        calories: 0,
        protein: 0,
        fat: 0,
        carbohydrate: 0,
      },
    ];
  }

  // Converter para o formato FoodItem
  return {
    food_id: food.food_id,
    food_name: food.food_name,
    food_type: food.food_type || "",
    food_url: food.food_url || "",
    brand_name: food.brand_name,
    servings: servings,
  };
}

// Tipo para o estado de loading da busca
export type SearchStatus = "idle" | "loading" | "success" | "error";

// Para compatibilidade com o código existente
export type EdamamNutrients = FoodNutrients;
export type EdamamFood = Food;
export type EdamamMeasure = FoodMeasure;
export type FoodHint = FoodItem;
export type EdamamResponse = FoodResponse;
