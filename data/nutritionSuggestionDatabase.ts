import { v4 as uuidv4 } from 'uuid';

// Tipos de alimentos para sugestões
export interface FoodSuggestion {
  id: string;
  name: string;
  portion: number; // em gramas
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  substitutes?: string[]; // IDs de alimentos que podem substituir
  category: 'protein' | 'carb' | 'fat' | 'fruit' | 'vegetable' | 'dairy' | 'supplement';
  measurementUnit?: 'g' | 'unidade' | 'fatia' | 'colher'; // Unidade de medida (gramas por padrão)
  unitEquivalentInGrams?: number; // Quantos gramas equivalem a 1 unidade
}

export interface MealSuggestion {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  baseComposition: {
    protein?: boolean;
    carb?: boolean;
    fat?: boolean;
    fruit?: boolean;
    vegetable?: boolean;
    dairy?: boolean;
    supplement?: boolean;
  };
  defaultPortions: {
    protein?: number; // porcentagem da proteína total da refeição
    carb?: number; // porcentagem do carbo total da refeição
    fat?: number; // porcentagem da gordura total da refeição
  };
}

// Definições de refeições padrão
export const mealDefinitions: MealSuggestion[] = [
  {
    mealType: 'breakfast',
    baseComposition: {
      protein: true,
      carb: true,
      fat: true,
      fruit: true
    },
    defaultPortions: {
      protein: 0.25, // 25% da proteína diária
      carb: 0.25, // 25% do carbo diário
      fat: 0.25 // 25% da gordura diária
    }
  },
  {
    mealType: 'lunch',
    baseComposition: {
      protein: true,
      carb: true,
      fat: true,
      vegetable: true
    },
    defaultPortions: {
      protein: 0.35, // 35% da proteína diária
      carb: 0.35, // 35% do carbo diário
      fat: 0.30 // 30% da gordura diária
    }
  },
  {
    mealType: 'dinner',
    baseComposition: {
      protein: true,
      carb: true,
      fat: true,
      vegetable: true
    },
    defaultPortions: {
      protein: 0.30, // 30% da proteína diária
      carb: 0.30, // 30% do carbo diário
      fat: 0.30 // 30% da gordura diária
    }
  },
  {
    mealType: 'snack',
    baseComposition: {
      protein: true,
      carb: true,
      fat: true,
      fruit: true
    },
    defaultPortions: {
      protein: 0.10, // 10% da proteína diária
      carb: 0.10, // 10% do carbo diário
      fat: 0.15 // 15% da gordura diária
    }
  }
];

// Banco de dados de alimentos
export const foodDatabase: FoodSuggestion[] = [
  // Proteínas
  {
    id: uuidv4(),
    name: 'Ovo cozido',
    portion: 50, // 1 ovo médio
    calories: 78,
    protein: 6.3,
    carbs: 0.6,
    fat: 5.3,
    category: 'protein',
    substitutes: ['mussarela', 'iogurte', 'whey'],
    measurementUnit: 'unidade',
    unitEquivalentInGrams: 50 // um ovo médio = 50g
  },
  {
    id: 'mussarela',
    name: 'Queijo mussarela',
    portion: 30,
    calories: 90,
    protein: 6.7,
    carbs: 0.7,
    fat: 7.0,
    category: 'protein',
    substitutes: ['whey', 'iogurte']
  },
  {
    id: 'iogurte',
    name: 'Iogurte natural',
    portion: 100,
    calories: 59,
    protein: 3.5,
    carbs: 4.7,
    fat: 3.3,
    category: 'dairy',
    substitutes: ['mussarela', 'whey']
  },
  {
    id: 'frango',
    name: 'Filé de frango grelhado',
    portion: 100,
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    category: 'protein',
    substitutes: ['patinho', 'tilapia']
  },
  {
    id: 'patinho',
    name: 'Carne patinho',
    portion: 100,
    calories: 179,
    protein: 27,
    carbs: 0,
    fat: 7.1,
    category: 'protein',
    substitutes: ['frango', 'tilapia']
  },
  {
    id: 'tilapia',
    name: 'Filé de tilápia',
    portion: 100,
    calories: 128,
    protein: 26,
    carbs: 0,
    fat: 2.7,
    category: 'protein',
    substitutes: ['frango', 'patinho']
  },
  {
    id: 'whey',
    name: 'Whey protein',
    portion: 30,
    calories: 117,
    protein: 24,
    carbs: 2,
    fat: 1.5,
    category: 'supplement',
    substitutes: ['iogurte', 'mussarela']
  },

  // Carboidratos
  {
    id: 'pao-forma',
    name: 'Pão de forma integral',
    portion: 50, // 2 fatias
    calories: 128,
    protein: 5,
    carbs: 24,
    fat: 1.8,
    category: 'carb',
    substitutes: ['pao-frances', 'tapioca'],
    measurementUnit: 'fatia',
    unitEquivalentInGrams: 25 // uma fatia = 25g
  },
  {
    id: 'pao-frances',
    name: 'Pão francês',
    portion: 50,
    calories: 150,
    protein: 4.2,
    carbs: 29,
    fat: 2,
    category: 'carb',
    substitutes: ['pao-forma', 'tapioca'],
    measurementUnit: 'unidade',
    unitEquivalentInGrams: 50 // um pão francês = 50g
  },
  {
    id: 'tapioca',
    name: 'Tapioca',
    portion: 60,
    calories: 209,
    protein: 0.2,
    carbs: 52,
    fat: 0.1,
    category: 'carb',
    substitutes: ['pao-forma', 'pao-frances']
  },
  {
    id: 'arroz',
    name: 'Arroz branco cozido',
    portion: 100,
    calories: 130,
    protein: 2.7,
    carbs: 28.1,
    fat: 0.3,
    category: 'carb',
    substitutes: ['macarrao', 'batata-inglesa', 'batata-doce']
  },
  {
    id: 'macarrao',
    name: 'Macarrão cozido',
    portion: 100,
    calories: 158,
    protein: 5.8,
    carbs: 30.9,
    fat: 0.9,
    category: 'carb',
    substitutes: ['arroz', 'batata-inglesa', 'batata-doce']
  },
  {
    id: 'batata-inglesa',
    name: 'Batata inglesa cozida',
    portion: 100,
    calories: 86,
    protein: 1.7,
    carbs: 20.1,
    fat: 0.1,
    category: 'carb',
    substitutes: ['arroz', 'macarrao', 'batata-doce']
  },
  {
    id: 'batata-doce',
    name: 'Batata doce cozida',
    portion: 100,
    calories: 90,
    protein: 1.6,
    carbs: 20.7,
    fat: 0.1,
    category: 'carb',
    substitutes: ['arroz', 'macarrao', 'batata-inglesa']
  },
  {
    id: 'aveia',
    name: 'Aveia em flocos',
    portion: 30,
    calories: 117,
    protein: 4.8,
    carbs: 19.5,
    fat: 2.4,
    category: 'carb',
    substitutes: ['pao-forma', 'tapioca']
  },

  // Gorduras
  {
    id: 'azeite',
    name: 'Azeite de oliva',
    portion: 10, // 1 colher de sobremesa
    calories: 90,
    protein: 0,
    carbs: 0,
    fat: 10,
    category: 'fat',
    substitutes: ['pasta-amendoim', 'abacate']
  },
  {
    id: 'requeijao-light',
    name: 'Requeijão light',
    portion: 30,
    calories: 65,
    protein: 3.8,
    carbs: 2.2,
    fat: 5,
    category: 'fat',
    substitutes: ['creme-ricota', 'pasta-amendoim']
  },
  {
    id: 'creme-ricota',
    name: 'Creme de ricota',
    portion: 30,
    calories: 60,
    protein: 4.2,
    carbs: 1.5,
    fat: 4.5,
    category: 'fat',
    substitutes: ['requeijao-light', 'pasta-amendoim']
  },
  {
    id: 'pasta-amendoim',
    name: 'Pasta de amendoim',
    portion: 15,
    calories: 90,
    protein: 3.5,
    carbs: 3.5,
    fat: 7.5,
    category: 'fat',
    substitutes: ['requeijao-light', 'creme-ricota', 'abacate']
  },
  {
    id: 'abacate',
    name: 'Abacate',
    portion: 50,
    calories: 80,
    protein: 1,
    carbs: 4.2,
    fat: 7.4,
    category: 'fat',
    substitutes: ['pasta-amendoim', 'azeite']
  },

  // Frutas
  {
    id: 'banana',
    name: 'Banana',
    portion: 100,
    calories: 89,
    protein: 1.1,
    carbs: 22.8,
    fat: 0.3,
    category: 'fruit',
    substitutes: ['maca', 'laranja', 'mamao'],
    measurementUnit: 'unidade',
    unitEquivalentInGrams: 100 // uma banana média = 100g
  },
  {
    id: 'maca',
    name: 'Maçã',
    portion: 100,
    calories: 52,
    protein: 0.3,
    carbs: 13.8,
    fat: 0.2,
    category: 'fruit',
    substitutes: ['banana', 'laranja', 'mamao'],
    measurementUnit: 'unidade',
    unitEquivalentInGrams: 100 // uma maçã média = 100g
  },
  {
    id: 'laranja',
    name: 'Laranja',
    portion: 100,
    calories: 47,
    protein: 0.9,
    carbs: 11.8,
    fat: 0.1,
    category: 'fruit',
    substitutes: ['banana', 'maca', 'mamao'],
    measurementUnit: 'unidade',
    unitEquivalentInGrams: 100 // uma laranja média = 100g
  },
  {
    id: 'mamao',
    name: 'Mamão',
    portion: 100,
    calories: 43,
    protein: 0.5,
    carbs: 10.8,
    fat: 0.1,
    category: 'fruit',
    substitutes: ['banana', 'maca', 'laranja'],
    measurementUnit: 'unidade',
    unitEquivalentInGrams: 100 // uma fatia média = 100g
  },

  // Vegetais (sem contagem de macros significativa)
  {
    id: 'legumes-mix',
    name: 'Mix de legumes (à vontade)',
    portion: 100,
    calories: 25,
    protein: 1,
    carbs: 5,
    fat: 0,
    category: 'vegetable'
  },
  {
    id: 'salada-verde',
    name: 'Salada verde (à vontade)',
    portion: 100,
    calories: 15,
    protein: 1,
    carbs: 3,
    fat: 0,
    category: 'vegetable'
  }
];

// Configurações por tipo de refeição
export const mealTypeConfigs = {
  'breakfast': {
    defaultFoods: ['Ovo cozido', 'Pão de forma integral', 'Requeijão light', 'Banana'],
    baseMacroDistribution: {
      protein: 0.25, // 25% da proteína diária
      carbs: 0.25,   // 25% dos carboidratos diários
      fat: 0.25      // 25% da gordura diária
    }
  },
  'lunch': {
    defaultFoods: ['Filé de frango grelhado', 'Arroz branco cozido', 'Azeite de oliva', 'Mix de legumes (à vontade)'],
    baseMacroDistribution: {
      protein: 0.35,
      carbs: 0.35,
      fat: 0.30
    }
  },
  'dinner': {
    defaultFoods: ['Filé de frango grelhado', 'Batata doce cozida', 'Azeite de oliva', 'Salada verde (à vontade)'],
    baseMacroDistribution: {
      protein: 0.30,
      carbs: 0.30,
      fat: 0.30
    }
  },
  'snack': {
    defaultFoods: ['Iogurte natural', 'Aveia em flocos', 'Pasta de amendoim', 'Banana'],
    baseMacroDistribution: {
      protein: 0.10,
      carbs: 0.10,
      fat: 0.15
    }
  }
};

// Função para encontrar alimento pelo nome
export function findFoodByName(name: string): FoodSuggestion | undefined {
  return foodDatabase.find(food => food.name === name);
}

// Função para encontrar alimento pelo ID
export function findFoodById(id: string): FoodSuggestion | undefined {
  return foodDatabase.find(food => food.id === id);
}

// Função para obter substituições para um alimento
export function getFoodSubstitutes(foodId: string): FoodSuggestion[] {
  const food = findFoodById(foodId);
  if (!food || !food.substitutes) return [];
  
  return food.substitutes.map(subId => {
    const substitute = findFoodById(subId);
    return substitute as FoodSuggestion;
  }).filter(Boolean);
}

// Função para obter alimentos por categoria
export function getFoodsByCategory(category: FoodSuggestion['category']): FoodSuggestion[] {
  return foodDatabase.filter(food => food.category === category);
} 