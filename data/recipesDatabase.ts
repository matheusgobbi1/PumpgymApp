import { v4 as uuidv4 } from "uuid";

// Definição das interfaces
export interface RecipeFood {
  id: string;
  name: string;
  portion: number;
  portionDescription?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: MealCategory;
  tags: string[];
  calorieRange: {
    min: number;
    max: number;
  };
  foods: RecipeFood[];
  preparationTime?: number; // em minutos
  difficulty?: "fácil" | "médio" | "difícil";
  isPopular?: boolean;
}

// Categorias de refeições
export type MealCategory =
  | "breakfast"
  | "lunch"
  | "snack"
  | "dinner"
  | "supper";

// Receitas para o café da manhã
const breakfastRecipes: Recipe[] = [
  {
    id: "breakfast_oatmeal",
    name: "Aveia com Frutas",
    description: "Aveia com banana e mel",
    icon: "sunny-outline",
    category: "breakfast",
    tags: ["saudável", "rápido", "vegetariano"],
    calorieRange: {
      min: 250,
      max: 350,
    },
    foods: [
      { id: "taco_030", name: "Farinha de aveia", portion: 50 },
      { id: "food_banana", name: "Banana", portion: 100 },
      { id: "taco_016", name: "Mel", portion: 15 },
    ],
    preparationTime: 5,
    difficulty: "fácil",
    isPopular: true,
  },
  {
    id: "breakfast_eggs",
    name: "Café Proteico",
    description: "Ovos com torrada e queijo",
    icon: "sunny-outline",
    category: "breakfast",
    tags: ["proteico", "tradicional"],
    calorieRange: {
      min: 350,
      max: 450,
    },
    foods: [
      { id: "taco_013", name: "Ovos", portion: 100 },
      { id: "taco_003", name: "Pão francês", portion: 50 },
      { id: "taco_015", name: "Queijo minas", portion: 30 },
    ],
    preparationTime: 10,
    difficulty: "fácil",
  },
  {
    id: "breakfast_pancakes",
    name: "Panquecas de Aveia",
    description: "Panquecas com frutas vermelhas",
    icon: "sunny-outline",
    category: "breakfast",
    tags: ["saudável", "doce", "vegetariano"],
    calorieRange: {
      min: 300,
      max: 400,
    },
    foods: [
      { id: "taco_030", name: "Farinha de aveia", portion: 60 },
      { id: "taco_013", name: "Ovos", portion: 50 },
      { id: "food_apple", name: "Frutas vermelhas", portion: 80 },
      { id: "taco_016", name: "Mel", portion: 10 },
    ],
    preparationTime: 15,
    difficulty: "médio",
  },
  {
    id: "breakfast_smoothie",
    name: "Smoothie Proteico",
    description: "Smoothie de banana com proteína",
    icon: "cafe-outline",
    category: "breakfast",
    tags: ["saudável", "proteico", "rápido"],
    calorieRange: {
      min: 200,
      max: 300,
    },
    foods: [
      { id: "food_banana", name: "Banana", portion: 100 },
      { id: "taco_014", name: "Leite", portion: 200 },
      { id: "taco_041", name: "Atum", portion: 30 },
    ],
    preparationTime: 5,
    difficulty: "fácil",
  },
  {
    id: "breakfast_tapioca",
    name: "Tapioca com Queijo",
    description: "Tapioca recheada com queijo branco",
    icon: "sunny-outline",
    category: "breakfast",
    tags: ["low carb", "regional", "sem glúten"],
    calorieRange: {
      min: 200,
      max: 300,
    },
    foods: [
      { id: "taco_030", name: "Tapioca", portion: 40 },
      { id: "taco_015", name: "Queijo minas", portion: 50 },
    ],
    preparationTime: 8,
    difficulty: "fácil",
    isPopular: true,
  },
];

// Receitas para o almoço
const lunchRecipes: Recipe[] = [
  {
    id: "lunch_chicken",
    name: "Frango com Arroz",
    description: "Peito de frango com arroz e legumes",
    icon: "restaurant-outline",
    category: "lunch",
    tags: ["proteico", "tradicional"],
    calorieRange: {
      min: 450,
      max: 600,
    },
    foods: [
      { id: "taco_012", name: "Frango, peito", portion: 150 },
      { id: "taco_001", name: "Arroz branco", portion: 150 },
      { id: "food_tomate", name: "Tomate", portion: 50 },
      { id: "food_alface", name: "Alface", portion: 30 },
    ],
    preparationTime: 25,
    difficulty: "médio",
    isPopular: true,
  },
  {
    id: "lunch_beef",
    name: "Carne com Batata",
    description: "Carne bovina com batata doce",
    icon: "restaurant-outline",
    category: "lunch",
    tags: ["proteico", "tradicional"],
    calorieRange: {
      min: 500,
      max: 650,
    },
    foods: [
      { id: "taco_050", name: "Carne contra-filé", portion: 150 },
      { id: "food_batata_doce", name: "Batata doce", portion: 150 },
      { id: "food_alface", name: "Alface", portion: 50 },
    ],
    preparationTime: 30,
    difficulty: "médio",
  },
  {
    id: "lunch_salad",
    name: "Salada Completa",
    description: "Mix de folhas com frango e grãos",
    icon: "leaf-outline",
    category: "lunch",
    tags: ["saudável", "leve", "lowcarb"],
    calorieRange: {
      min: 350,
      max: 450,
    },
    foods: [
      { id: "taco_012", name: "Frango, peito", portion: 100 },
      { id: "food_alface", name: "Mix de folhas", portion: 100 },
      { id: "food_tomate", name: "Tomate", portion: 50 },
      { id: "taco_020", name: "Grão de bico", portion: 50 },
      { id: "taco_016", name: "Azeite", portion: 10 },
    ],
    preparationTime: 15,
    difficulty: "fácil",
  },
  {
    id: "lunch_pasta",
    name: "Macarrão com Molho",
    description: "Espaguete com molho de tomate e carne moída",
    icon: "restaurant-outline",
    category: "lunch",
    tags: ["tradicional", "carboidratos"],
    calorieRange: {
      min: 550,
      max: 700,
    },
    foods: [
      { id: "taco_001", name: "Espaguete", portion: 100 },
      { id: "taco_050", name: "Carne moída", portion: 100 },
      { id: "food_tomate", name: "Molho de tomate", portion: 100 },
    ],
    preparationTime: 20,
    difficulty: "médio",
  },
  {
    id: "lunch_fish",
    name: "Salmão com Legumes",
    description: "Filé de salmão com mix de legumes",
    icon: "restaurant-outline",
    category: "lunch",
    tags: ["saudável", "proteico", "omega-3"],
    calorieRange: {
      min: 400,
      max: 550,
    },
    foods: [
      { id: "taco_047", name: "Salmão", portion: 150 },
      { id: "food_tomate", name: "Mix de legumes", portion: 150 },
      { id: "taco_016", name: "Azeite", portion: 10 },
    ],
    preparationTime: 25,
    difficulty: "médio",
  },
];

// Receitas para lanches
const snackRecipes: Recipe[] = [
  {
    id: "snack_yogurt",
    name: "Iogurte com Granola",
    description: "Iogurte com granola e frutas",
    icon: "cafe-outline",
    category: "snack",
    tags: ["saudável", "rápido", "leve"],
    calorieRange: {
      min: 200,
      max: 300,
    },
    foods: [
      { id: "taco_014", name: "Iogurte natural", portion: 170 },
      { id: "food_banana", name: "Banana", portion: 50 },
      { id: "taco_032", name: "Granola", portion: 30 },
    ],
    preparationTime: 3,
    difficulty: "fácil",
    isPopular: true,
  },
  {
    id: "snack_protein",
    name: "Lanche Proteico",
    description: "Atum com torrada integral",
    icon: "fitness-outline",
    category: "snack",
    tags: ["proteico", "lowcarb"],
    calorieRange: {
      min: 250,
      max: 350,
    },
    foods: [
      { id: "taco_041", name: "Atum", portion: 80 },
      { id: "taco_003", name: "Torrada integral", portion: 30 },
    ],
    preparationTime: 5,
    difficulty: "fácil",
  },
  {
    id: "snack_fruit_salad",
    name: "Salada de Frutas",
    description: "Mix de frutas com granola",
    icon: "nutrition-outline",
    category: "snack",
    tags: ["saudável", "vegetariano", "doce"],
    calorieRange: {
      min: 150,
      max: 250,
    },
    foods: [
      { id: "food_banana", name: "Banana", portion: 50 },
      { id: "food_apple", name: "Maçã", portion: 50 },
      { id: "food_apple", name: "Laranja", portion: 50 },
      { id: "taco_032", name: "Granola", portion: 20 },
    ],
    preparationTime: 10,
    difficulty: "fácil",
  },
  {
    id: "snack_protein_bar",
    name: "Barra Proteica",
    description: "Barra de proteína com castanhas",
    icon: "fitness-outline",
    category: "snack",
    tags: ["proteico", "rápido", "pré-treino"],
    calorieRange: {
      min: 180,
      max: 250,
    },
    foods: [{ id: "taco_032", name: "Barra proteica", portion: 60 }],
    preparationTime: 1,
    difficulty: "fácil",
  },
  {
    id: "snack_avocado_toast",
    name: "Torrada com Abacate",
    description: "Torrada integral com pasta de abacate",
    icon: "cafe-outline",
    category: "snack",
    tags: ["saudável", "gordura boa"],
    calorieRange: {
      min: 200,
      max: 300,
    },
    foods: [
      { id: "taco_003", name: "Torrada integral", portion: 30 },
      { id: "taco_031", name: "Abacate", portion: 50 },
      { id: "food_apple", name: "Limão", portion: 5 },
    ],
    preparationTime: 5,
    difficulty: "fácil",
  },
];

// Receitas para o jantar
const dinnerRecipes: Recipe[] = [
  {
    id: "dinner_fish",
    name: "Peixe com Legumes",
    description: "Filé de peixe com legumes",
    icon: "moon-outline",
    category: "dinner",
    tags: ["leve", "saudável", "proteico"],
    calorieRange: {
      min: 350,
      max: 450,
    },
    foods: [
      { id: "taco_047", name: "Salmão", portion: 150 },
      { id: "food_batata_doce", name: "Batata doce", portion: 100 },
      { id: "food_alface", name: "Alface", portion: 50 },
    ],
    preparationTime: 20,
    difficulty: "médio",
    isPopular: true,
  },
  {
    id: "dinner_omelette",
    name: "Omelete de Legumes",
    description: "Omelete com queijo e vegetais",
    icon: "moon-outline",
    category: "dinner",
    tags: ["proteico", "lowcarb", "rápido"],
    calorieRange: {
      min: 250,
      max: 350,
    },
    foods: [
      { id: "taco_013", name: "Ovos", portion: 100 },
      { id: "taco_015", name: "Queijo", portion: 30 },
      { id: "food_tomate", name: "Tomate", portion: 50 },
      { id: "food_alface", name: "Espinafre", portion: 30 },
    ],
    preparationTime: 10,
    difficulty: "fácil",
  },
  {
    id: "dinner_soup",
    name: "Sopa de Legumes",
    description: "Sopa leve com frango e legumes",
    icon: "water-outline",
    category: "dinner",
    tags: ["leve", "quente", "saudável"],
    calorieRange: {
      min: 200,
      max: 300,
    },
    foods: [
      { id: "taco_012", name: "Frango desfiado", portion: 80 },
      { id: "food_tomate", name: "Cenoura", portion: 50 },
      { id: "food_batata_doce", name: "Batata", portion: 50 },
      { id: "food_tomate", name: "Abobrinha", portion: 50 },
    ],
    preparationTime: 25,
    difficulty: "médio",
  },
  {
    id: "dinner_salad_chicken",
    name: "Salada com Frango",
    description: "Salada verde com peito de frango grelhado",
    icon: "leaf-outline",
    category: "dinner",
    tags: ["leve", "proteico", "lowcarb"],
    calorieRange: {
      min: 300,
      max: 400,
    },
    foods: [
      { id: "taco_012", name: "Frango, peito", portion: 120 },
      { id: "food_alface", name: "Mix de folhas", portion: 80 },
      { id: "food_tomate", name: "Tomate", portion: 50 },
      { id: "food_tomate", name: "Pepino", portion: 50 },
      { id: "taco_016", name: "Azeite", portion: 10 },
    ],
    preparationTime: 15,
    difficulty: "fácil",
  },
  {
    id: "dinner_quinoa",
    name: "Bowl de Quinoa",
    description: "Bowl de quinoa com legumes e frango",
    icon: "moon-outline",
    category: "dinner",
    tags: ["saudável", "balanceado", "proteico"],
    calorieRange: {
      min: 350,
      max: 450,
    },
    foods: [
      { id: "taco_001", name: "Quinoa", portion: 100 },
      { id: "taco_012", name: "Frango, peito", portion: 100 },
      { id: "food_tomate", name: "Mix de legumes", portion: 100 },
    ],
    preparationTime: 20,
    difficulty: "médio",
  },
];

// Receitas para ceia
const supperRecipes: Recipe[] = [
  {
    id: "supper_light",
    name: "Ceia Leve",
    description: "Frutas com castanhas",
    icon: "bed-outline",
    category: "supper",
    tags: ["leve", "saudável", "rápido"],
    calorieRange: {
      min: 100,
      max: 200,
    },
    foods: [
      { id: "food_apple", name: "Maçã", portion: 150 },
      { id: "taco_031", name: "Amendoim", portion: 20 },
    ],
    preparationTime: 2,
    difficulty: "fácil",
    isPopular: true,
  },
  {
    id: "supper_tea_biscuits",
    name: "Chá com Biscoitos",
    description: "Chá de camomila com biscoitos integrais",
    icon: "cafe-outline",
    category: "supper",
    tags: ["leve", "relaxante", "simples"],
    calorieRange: {
      min: 80,
      max: 150,
    },
    foods: [
      { id: "taco_014", name: "Chá de camomila", portion: 200 },
      { id: "taco_003", name: "Biscoitos integrais", portion: 30 },
    ],
    preparationTime: 5,
    difficulty: "fácil",
  },
  {
    id: "supper_yogurt_light",
    name: "Iogurte Desnatado",
    description: "Iogurte desnatado com canela",
    icon: "water-outline",
    category: "supper",
    tags: ["leve", "proteico", "simples"],
    calorieRange: {
      min: 80,
      max: 130,
    },
    foods: [
      { id: "taco_014", name: "Iogurte desnatado", portion: 100 },
      { id: "taco_016", name: "Canela", portion: 2 },
    ],
    preparationTime: 1,
    difficulty: "fácil",
  },
  {
    id: "supper_milk",
    name: "Leite Morno",
    description: "Leite morno com mel",
    icon: "bed-outline",
    category: "supper",
    tags: ["relaxante", "tradicional", "simples"],
    calorieRange: {
      min: 100,
      max: 150,
    },
    foods: [
      { id: "taco_014", name: "Leite", portion: 200 },
      { id: "taco_016", name: "Mel", portion: 10 },
    ],
    preparationTime: 3,
    difficulty: "fácil",
  },
  {
    id: "supper_protein_pudding",
    name: "Pudim Proteico",
    description: "Pudim de proteína com baixas calorias",
    icon: "nutrition-outline",
    category: "supper",
    tags: ["proteico", "doce", "lowcarb"],
    calorieRange: {
      min: 120,
      max: 180,
    },
    foods: [
      { id: "taco_041", name: "Whey protein", portion: 30 },
      { id: "taco_014", name: "Leite", portion: 100 },
      { id: "taco_031", name: "Sementes de chia", portion: 10 },
    ],
    preparationTime: 5,
    difficulty: "fácil",
  },
];

// Combinar todas as receitas
export const allRecipes: Recipe[] = [
  ...breakfastRecipes,
  ...lunchRecipes,
  ...snackRecipes,
  ...dinnerRecipes,
  ...supperRecipes,
];

// Função para obter receitas por categoria
export const getRecipesByCategory = (category: MealCategory): Recipe[] => {
  return allRecipes.filter((recipe) => recipe.category === category);
};

// Função para obter receitas recomendadas com base nas calorias disponíveis
export const getRecommendedRecipes = (
  availableCalories: number,
  category?: MealCategory
): Recipe[] => {
  let filteredRecipes = category
    ? allRecipes.filter((recipe) => recipe.category === category)
    : allRecipes;

  // Filtrar por receitas que se encaixam nas calorias disponíveis
  return filteredRecipes.filter((recipe) => {
    // Se tiver muito poucas calorias disponíveis, mostrar apenas receitas muito leves
    if (availableCalories < 150) {
      return recipe.calorieRange.min < 150;
    }

    // Para quantidade normal de calorias, mostrar receitas que se encaixam
    return (
      recipe.calorieRange.min <= availableCalories &&
      recipe.calorieRange.max <= availableCalories * 1.2
    );
  });
};

// Função para pesquisar receitas por tags ou nome
export const searchRecipes = (query: string): Recipe[] => {
  const lowercaseQuery = query.toLowerCase();
  return allRecipes.filter((recipe) => {
    // Pesquisar no nome
    if (recipe.name.toLowerCase().includes(lowercaseQuery)) return true;

    // Pesquisar na descrição
    if (recipe.description.toLowerCase().includes(lowercaseQuery)) return true;

    // Pesquisar nas tags
    if (recipe.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)))
      return true;

    // Pesquisar nos alimentos
    if (
      recipe.foods.some((food) =>
        food.name.toLowerCase().includes(lowercaseQuery)
      )
    )
      return true;

    return false;
  });
};

// Função para obter receitas populares
export const getPopularRecipes = (): Recipe[] => {
  return allRecipes.filter((recipe) => recipe.isPopular);
};

// Função para obter receitas de baixa caloria
export const getLowCalorieRecipes = (): Recipe[] => {
  return allRecipes.filter((recipe) => recipe.calorieRange.max < 250);
};

// Função para obter receitas rápidas (menos de 10 minutos)
export const getQuickRecipes = (): Recipe[] => {
  return allRecipes.filter(
    (recipe) => recipe.preparationTime && recipe.preparationTime <= 10
  );
};
