// Banco de dados de alimentos básicos para mockup
import { FoodItem, Food, FoodMeasure, FoodResponse } from "../types/food";

// Interface simplificada para os dados dos alimentos no banco de dados
export interface FoodData {
  id: string;
  name: string;
  nutrients: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  };
  measures: {
    id: string;
    label: string;
    weight: number;
  }[];
}

// Banco de dados de alimentos
export const foodDatabase: FoodData[] = [
  {
    id: "food_banana",
    name: "Banana",
    nutrients: {
      calories: 89,
      protein: 1.1,
      fat: 0.3,
      carbs: 22.8,
      fiber: 2.6
    },
    measures: [
      {
        id: "measure_banana_unit",
        label: "unidade média (118g)",
        weight: 118
      },
      {
        id: "measure_banana_100g",
        label: "100g",
        weight: 100
      }
    ],
  },
  {
    id: "food_apple",
    name: "Maçã",
    nutrients: {
      calories: 52,
      protein: 0.3,
      fat: 0.2,
      carbs: 14,
      fiber: 2.4
    },
    measures: [
      {
        id: "measure_apple_unit",
        label: "unidade média (182g)",
        weight: 182
      },
      {
        id: "measure_apple_100g",
        label: "100g",
        weight: 100
      }
    ],
  },
  {
    id: "food_rice",
    name: "Arroz branco cozido",
    nutrients: {
      calories: 130,
      protein: 2.7,
      fat: 0.3,
      carbs: 28.2,
      fiber: 0.4
    },
    measures: [
      {
        id: "measure_rice_cup",
        label: "1 xícara (158g)",
        weight: 158
      },
      {
        id: "measure_rice_100g",
        label: "100g",
        weight: 100
      }
    ],
  },
  {
    id: "food_beans",
    name: "Feijão preto cozido",
    nutrients: {
      calories: 132,
      protein: 8.9,
      fat: 0.5,
      carbs: 23.7,
      fiber: 8.7
    },
    measures: [
      {
        id: "measure_beans_cup",
        label: "1 xícara (172g)",
        weight: 172
      },
      {
        id: "measure_beans_100g",
        label: "100g",
        weight: 100
      }
    ],
  },
  {
    id: "food_chicken_breast",
    name: "Peito de frango cozido",
    nutrients: {
      calories: 165,
      protein: 31,
      fat: 3.6,
      carbs: 0,
      fiber: 0
    },
    measures: [
      {
        id: "measure_chicken_100g",
        label: "100g",
        weight: 100
      },
      {
        id: "measure_chicken_fillet",
        label: "1 filé (172g)",
        weight: 172
      }
    ],
  },
  {
    id: "food_milk",
    name: "Leite integral",
    nutrients: {
      calories: 61,
      protein: 3.2,
      fat: 3.3,
      carbs: 4.8,
      fiber: 0
    },
    measures: [
      {
        id: "measure_milk_cup",
        label: "1 copo (240ml)",
        weight: 244
      },
      {
        id: "measure_milk_100g",
        label: "100ml",
        weight: 100
      }
    ],
  },
  {
    id: "food_egg",
    name: "Ovo",
    nutrients: {
      calories: 143,
      protein: 12.6,
      fat: 9.5,
      carbs: 0.7,
      fiber: 0
    },
    measures: [
      {
        id: "measure_egg_unit",
        label: "1 unidade grande (50g)",
        weight: 50
      },
      {
        id: "measure_egg_100g",
        label: "100g",
        weight: 100
      }
    ],
  },
  {
    id: "food_bread",
    name: "Pão francês",
    nutrients: {
      calories: 289,
      protein: 9.4,
      fat: 1.8,
      carbs: 56.6,
      fiber: 2.7
    },
    measures: [
      {
        id: "measure_bread_unit",
        label: "1 unidade (50g)",
        weight: 50
      },
      {
        id: "measure_bread_100g",
        label: "100g",
        weight: 100
      }
    ],
  },
  {
    id: "food_potato",
    name: "Batata cozida",
    nutrients: {
      calories: 87,
      protein: 1.9,
      fat: 0.1,
      carbs: 20.1,
      fiber: 1.8
    },
    measures: [
      {
        id: "measure_potato_unit",
        label: "1 batata média (173g)",
        weight: 173
      },
      {
        id: "measure_potato_100g",
        label: "100g",
        weight: 100
      }
    ],
  },
  {
    id: "food_orange",
    name: "Laranja",
    nutrients: {
      calories: 43,
      protein: 0.9,
      fat: 0.1,
      carbs: 11.2,
      fiber: 2.4
    },
    measures: [
      {
        id: "measure_orange_unit",
        label: "1 laranja média (131g)",
        weight: 131
      },
      {
        id: "measure_orange_100g",
        label: "100g",
        weight: 100
      }
    ],
  },
  {
    id: "food_beef",
    name: "Carne bovina (acém)",
    nutrients: {
      calories: 250,
      protein: 26,
      fat: 17,
      carbs: 0,
      fiber: 0
    },
    measures: [
      {
        id: "measure_beef_100g",
        label: "100g",
        weight: 100
      },
      {
        id: "measure_beef_steak",
        label: "1 bife médio (150g)",
        weight: 150
      }
    ],
  },
  {
    id: "food_cheese",
    name: "Queijo mussarela",
    nutrients: {
      calories: 280,
      protein: 28,
      fat: 17,
      carbs: 3.1,
      fiber: 0
    },
    measures: [
      {
        id: "measure_cheese_slice",
        label: "1 fatia (28g)",
        weight: 28
      },
      {
        id: "measure_cheese_100g",
        label: "100g",
        weight: 100
      }
    ],
  },
  {
    id: "food_pasta",
    name: "Macarrão cozido",
    nutrients: {
      calories: 158,
      protein: 5.8,
      fat: 0.9,
      carbs: 31,
      fiber: 1.8
    },
    measures: [
      {
        id: "measure_pasta_cup",
        label: "1 xícara (140g)",
        weight: 140
      },
      {
        id: "measure_pasta_100g",
        label: "100g",
        weight: 100
      }
    ],
  },
  {
    id: "food_avocado",
    name: "Abacate",
    nutrients: {
      calories: 160,
      protein: 2,
      fat: 14.7,
      carbs: 8.5,
      fiber: 6.7
    },
    measures: [
      {
        id: "measure_avocado_half",
        label: "1/2 unidade (100g)",
        weight: 100
      },
      {
        id: "measure_avocado_whole",
        label: "1 unidade média (200g)",
        weight: 200
      }
    ],
  },
  {
    id: "food_yogurt",
    name: "Iogurte natural",
    nutrients: {
      calories: 59,
      protein: 3.5,
      fat: 3.3,
      carbs: 4.7,
      fiber: 0
    },
    measures: [
      {
        id: "measure_yogurt_cup",
        label: "1 copo (200g)",
        weight: 200
      },
      {
        id: "measure_yogurt_100g",
        label: "100g",
        weight: 100
      }
    ],
  }
];

// Funções auxiliares para pesquisa
export const searchFoodsMockup = (query: string): FoodResponse => {
  if (!query) {
    return { items: [] };
  }

  const normalizedQuery = query.toLowerCase().trim();
  
  // Dividir a consulta em palavras para pesquisa mais granular
  const queryWords = normalizedQuery.split(/\s+/);
  
  // Função para calcular uma pontuação de relevância para cada alimento
  const calculateRelevance = (foodName: string) => {
    const normalizedName = foodName.toLowerCase();
    let score = 0;
    
    // Correspondência exata tem pontuação máxima
    if (normalizedName === normalizedQuery) {
      return 100;
    }
    
    // Verificar se o nome começa com a consulta
    if (normalizedName.startsWith(normalizedQuery)) {
      score += 50;
    }
    
    // Verificar se o nome contém a consulta completa
    if (normalizedName.includes(normalizedQuery)) {
      score += 30;
    }
    
    // Verificar palavras individuais
    for (const word of queryWords) {
      if (word.length < 3) continue; // Ignorar palavras muito curtas
      
      if (normalizedName.includes(word)) {
        score += 20;
      }
      
      // Verificar início de palavras
      const nameWords = normalizedName.split(/\s+/);
      for (const nameWord of nameWords) {
        if (nameWord.startsWith(word)) {
          score += 10;
        }
      }
    }
    
    return score;
  };
  
  // Filtrar e ordenar os resultados por relevância
  const scoredResults = foodDatabase
    .map(food => ({
      food,
      score: calculateRelevance(food.name)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);
  
  return {
    items: scoredResults.map(item => convertToFoodItem(item.food))
  };
};

export const getFoodDetailsMockup = (foodId: string): FoodResponse => {
  const food = foodDatabase.find(food => food.id === foodId);
  
  if (!food) {
    return { items: [] };
  }

  return {
    items: [convertToFoodItem(food)]
  };
};

// Função para converter do formato do mockup para o formato FoodItem
const convertToFoodItem = (food: FoodData): FoodItem => {
  // Adaptar para a interface Food, adicionando campos padrão para compatibilidade
  const foodData: Food = {
    foodId: food.id,
    name: food.name,
    nutrients: {
      calories: food.nutrients.calories,
      protein: food.nutrients.protein,
      fat: food.nutrients.fat,
      carbs: food.nutrients.carbs,
      fiber: food.nutrients.fiber
    },
    // Valores padrão para campos obrigatórios mesmo que não usados na UI
    category: "Alimentos",
    categoryLabel: "Alimentos comuns",
    image: "",
    foodType: "Comum"
  };

  // Organizar as medidas - garantir que a primeira seja sempre 100g
  const sortedMeasures = [...food.measures].sort((a, b) => {
    // Colocar a medida de 100g em primeiro lugar
    if (a.weight === 100) return -1;
    if (b.weight === 100) return 1;
    return 0;
  });
  
  // Criar FoodItem compatível com a interface esperada pelas telas
  return {
    food_id: food.id,
    food_name: food.name,
    food_type: "Comum",
    food_url: "",
    servings: sortedMeasures.map(measure => ({
      serving_id: measure.id,
      serving_description: measure.label,
      metric_serving_amount: measure.weight,
      metric_serving_unit: "g",
      calories: Math.round(food.nutrients.calories * (measure.weight / 100)),
      protein: Math.round(food.nutrients.protein * (measure.weight / 100) * 10) / 10,
      fat: Math.round(food.nutrients.fat * (measure.weight / 100) * 10) / 10,
      carbohydrate: Math.round(food.nutrients.carbs * (measure.weight / 100) * 10) / 10,
      fiber: Math.round(food.nutrients.fiber * (measure.weight / 100) * 10) / 10
    }))
  };
}; 