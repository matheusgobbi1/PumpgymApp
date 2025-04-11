import { FoodData } from "../types/food";
import { suggestDietSpecificAlternatives } from "../utils/nutritionDistributionAlgorithm";

// Tipo para definir alternativas para cada alimento
export interface FoodSuggestion extends FoodData {
  alternatives: string[]; // IDs das alternativas para este alimento
  mealTypes: string[]; // Tipos de refeição onde este alimento é recomendado
}

// Tipo que define uma sugestão de refeição completa
export interface MealSuggestion {
  id: string;
  name: string;
  description: string;
  foods: string[]; // IDs dos alimentos para esta sugestão
  mealType: string; // Tipo de refeição (breakfast, lunch, dinner, snack)
  thumbnailImage?: string; // URL opcional da imagem da refeição
  macrosTarget?: {
    caloriesMin: number; // Calorias mínimas para esta sugestão
    caloriesMax: number; // Calorias máximas para esta sugestão
    proteinMin: number; // Proteína mínima
    proteinMax: number; // Proteína máxima
    carbsMin: number; // Carboidratos mínimos
    carbsMax: number; // Carboidratos máximos
    fatMin: number; // Gorduras mínimas
    fatMax: number; // Gorduras máximas
  };
}

// IMPORTANTE: Todos os valores nutricionais abaixo são padronizados para 100g do alimento.
// Quando exibidos na interface, são automaticamente calculados com base na porção selecionada.
// As medidas em "measures" indicam porções comuns, mas os valores nutricionais em "nutrients"
// sempre representam 100g do alimento para manter consistência nos cálculos.

// Banco de dados de alimentos para sugestões
export const foodSuggestionDatabase: FoodSuggestion[] = [
  // === CARBOIDRATOS ===
  {
    id: "sugg_pao_frances",
    name: "Pão Francês",
    nutrients: {
      calories: 300,
      protein: 8.0,
      fat: 3.0,
      carbs: 58.6,
      fiber: 2.2,
    },
    measures: [
      {
        id: "measure_pao_frances_unidade",
        label: "unidade (50g)",
        weight: 50,
      },
      {
        id: "measure_pao_frances_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_tapioca", "sugg_pao_forma", "sugg_pao_integral"],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_tapioca",
    name: "Tapioca",
    nutrients: {
      calories: 360,
      protein: 0.5,
      fat: 0.3,
      carbs: 89.0,
      fiber: 1.8,
    },
    measures: [
      {
        id: "measure_tapioca_unidade",
        label: "unidade (50g)",
        weight: 50,
      },
      {
        id: "measure_tapioca_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_pao_frances", "sugg_pao_forma", "sugg_crepioca"],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_pao_forma",
    name: "Pão de Forma Integral",
    nutrients: {
      calories: 240,
      protein: 12.0,
      fat: 3.0,
      carbs: 43.0,
      fiber: 7.0,
    },
    measures: [
      {
        id: "measure_pao_forma_fatia",
        label: "fatia (30g)",
        weight: 30,
      },
      {
        id: "measure_pao_forma_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_pao_frances", "sugg_tapioca", "sugg_pao_integral"],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_pao_integral",
    name: "Pão Integral",
    nutrients: {
      calories: 247,
      protein: 13.0,
      fat: 3.4,
      carbs: 41.3,
      fiber: 7.4,
    },
    measures: [
      {
        id: "measure_pao_integral_fatia",
        label: "fatia (25g)",
        weight: 25,
      },
      {
        id: "measure_pao_integral_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_pao_frances", "sugg_pao_forma", "sugg_tapioca"],
    mealTypes: ["breakfast", "snack", "morning_snack", "afternoon_snack"],
  },
  {
    id: "sugg_crepioca",
    name: "Crepioca",
    nutrients: {
      calories: 188,
      protein: 8.8,
      fat: 6.2,
      carbs: 22.5,
      fiber: 1.5,
    },
    measures: [
      {
        id: "measure_crepioca_unidade",
        label: "unidade (80g)",
        weight: 80,
      },
      {
        id: "measure_crepioca_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_tapioca", "sugg_omelete", "sugg_panqueca_aveia"],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_panqueca_aveia",
    name: "Panqueca de Aveia",
    nutrients: {
      calories: 180,
      protein: 8.0,
      fat: 6.0,
      carbs: 24.0,
      fiber: 3.5,
    },
    measures: [
      {
        id: "measure_panqueca_aveia_unidade",
        label: "unidade (80g)",
        weight: 80,
      },
      {
        id: "measure_panqueca_aveia_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_crepioca", "sugg_tapioca", "sugg_aveia"],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_arroz",
    name: "Arroz Branco",
    nutrients: {
      calories: 128,
      protein: 2.5,
      fat: 0.2,
      carbs: 28.1,
      fiber: 1.6,
    },
    measures: [
      {
        id: "measure_arroz_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_arroz_colher",
        label: "colher de sopa cheia (25g)",
        weight: 25,
      },
      {
        id: "measure_arroz_xicara",
        label: "xícara (160g)",
        weight: 160,
      },
    ],
    alternatives: [
      "sugg_batata_doce",
      "sugg_macarrao",
      "sugg_batata_inglesa",
      "sugg_arroz_integral",
      "sugg_quinoa",
    ],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_arroz_integral",
    name: "Arroz Integral",
    nutrients: {
      calories: 124,
      protein: 2.6,
      fat: 1.0,
      carbs: 25.8,
      fiber: 2.7,
    },
    measures: [
      {
        id: "measure_arroz_integral_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_arroz_integral_colher",
        label: "colher de sopa cheia (25g)",
        weight: 25,
      },
      {
        id: "measure_arroz_integral_xicara",
        label: "xícara (160g)",
        weight: 160,
      },
    ],
    alternatives: ["sugg_arroz", "sugg_quinoa", "sugg_batata_doce"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_quinoa",
    name: "Quinoa Cozida",
    nutrients: {
      calories: 120,
      protein: 4.4,
      fat: 1.9,
      carbs: 21.3,
      fiber: 2.8,
    },
    measures: [
      {
        id: "measure_quinoa_colher",
        label: "colher de sopa (25g)",
        weight: 25,
      },
      {
        id: "measure_quinoa_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_arroz_integral", "sugg_arroz", "sugg_cuscuz"],
    mealTypes: ["lunch", "dinner", "breakfast"],
  },
  {
    id: "sugg_cuscuz",
    name: "Cuscuz de Milho",
    nutrients: {
      calories: 112,
      protein: 2.8,
      fat: 0.6,
      carbs: 23.9,
      fiber: 1.0,
    },
    measures: [
      {
        id: "measure_cuscuz_fatia",
        label: "fatia (100g)",
        weight: 100,
      },
      {
        id: "measure_cuscuz_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_tapioca", "sugg_arroz", "sugg_batata_doce"],
    mealTypes: ["breakfast", "lunch", "dinner"],
  },
  {
    id: "sugg_batata_doce",
    name: "Batata Doce",
    nutrients: {
      calories: 86,
      protein: 1.6,
      fat: 0.1,
      carbs: 20.1,
      fiber: 3.0,
    },
    measures: [
      {
        id: "measure_batata_doce_pedaco",
        label: "pedaço (100g)",
        weight: 100,
      },
      {
        id: "measure_batata_doce_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: [
      "sugg_arroz",
      "sugg_macarrao",
      "sugg_batata_inglesa",
      "sugg_inhame",
      "sugg_mandioca",
    ],
    mealTypes: ["lunch", "dinner", "breakfast"],
  },
  {
    id: "sugg_inhame",
    name: "Inhame Cozido",
    nutrients: {
      calories: 118,
      protein: 1.5,
      fat: 0.2,
      carbs: 27.6,
      fiber: 3.9,
    },
    measures: [
      {
        id: "measure_inhame_pedaco",
        label: "pedaço (100g)",
        weight: 100,
      },
      {
        id: "measure_inhame_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_batata_doce", "sugg_mandioca", "sugg_batata_inglesa"],
    mealTypes: ["lunch", "dinner", "breakfast"],
  },
  {
    id: "sugg_mandioca",
    name: "Mandioca Cozida",
    nutrients: {
      calories: 120,
      protein: 0.6,
      fat: 0.3,
      carbs: 28.8,
      fiber: 1.7,
    },
    measures: [
      {
        id: "measure_mandioca_pedaco",
        label: "pedaço (100g)",
        weight: 100,
      },
      {
        id: "measure_mandioca_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_batata_doce", "sugg_inhame", "sugg_batata_inglesa"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_macarrao",
    name: "Macarrão Cozido",
    nutrients: {
      calories: 122,
      protein: 3.9,
      fat: 1.3,
      carbs: 24.5,
      fiber: 1.6,
    },
    measures: [
      {
        id: "measure_macarrao_pegador",
        label: "pegador (110g)",
        weight: 110,
      },
      {
        id: "measure_macarrao_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_macarrao_prato",
        label: "prato raso (220g)",
        weight: 220,
      },
    ],
    alternatives: [
      "sugg_arroz",
      "sugg_batata_doce",
      "sugg_batata_inglesa",
      "sugg_macarrao_integral",
    ],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_macarrao_integral",
    name: "Macarrão Integral",
    nutrients: {
      calories: 124,
      protein: 6.3,
      fat: 1.2,
      carbs: 25.0,
      fiber: 4.5,
    },
    measures: [
      {
        id: "measure_macarrao_integral_pegador",
        label: "pegador cheio (100g)",
        weight: 100,
      },
      {
        id: "measure_macarrao_integral_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_macarrao", "sugg_arroz_integral", "sugg_quinoa"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_batata_inglesa",
    name: "Batata Inglesa",
    nutrients: {
      calories: 77,
      protein: 2.0,
      fat: 0.1,
      carbs: 17.5,
      fiber: 2.2,
    },
    measures: [
      {
        id: "measure_batata_inglesa_unidade",
        label: "unidade (120g)",
        weight: 120,
      },
      {
        id: "measure_batata_inglesa_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: [
      "sugg_arroz",
      "sugg_batata_doce",
      "sugg_macarrao",
      "sugg_mandioca",
      "sugg_inhame",
    ],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_aveia",
    name: "Aveia em Flocos",
    nutrients: {
      calories: 389,
      protein: 16.9,
      fat: 6.9,
      carbs: 66.3,
      fiber: 10.6,
    },
    measures: [
      {
        id: "measure_aveia_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
      {
        id: "measure_aveia_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_granola", "sugg_tapioca", "sugg_chia", "sugg_linhaça"],
    mealTypes: [
      "breakfast",
      "snack",
      "morning_snack",
      "afternoon_snack",
      "supper",
    ],
  },
  {
    id: "sugg_chia",
    name: "Semente de Chia",
    nutrients: {
      calories: 486,
      protein: 16.5,
      fat: 30.7,
      carbs: 42.1,
      fiber: 34.4,
    },
    measures: [
      {
        id: "measure_chia_colher",
        label: "colher de sopa (10g)",
        weight: 10,
      },
      {
        id: "measure_chia_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_linhaça", "sugg_aveia", "sugg_granola"],
    mealTypes: ["breakfast", "snack", "morning_snack", "afternoon_snack"],
  },
  {
    id: "sugg_linhaça",
    name: "Semente de Linhaça",
    nutrients: {
      calories: 534,
      protein: 18.3,
      fat: 42.2,
      carbs: 28.9,
      fiber: 27.3,
    },
    measures: [
      {
        id: "measure_linhaça_colher",
        label: "colher de sopa (10g)",
        weight: 10,
      },
      {
        id: "measure_linhaça_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_chia", "sugg_aveia", "sugg_granola"],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_granola",
    name: "Granola",
    nutrients: {
      calories: 471,
      protein: 10.2,
      fat: 20.0,
      carbs: 64.1,
      fiber: 8.4,
    },
    measures: [
      {
        id: "measure_granola_colher",
        label: "colher de sopa (10g)",
        weight: 10,
      },
      {
        id: "measure_granola_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_aveia", "sugg_tapioca", "sugg_musli"],
    mealTypes: ["breakfast", "snack", "morning_snack", "afternoon_snack"],
  },
  {
    id: "sugg_musli",
    name: "Muesli",
    nutrients: {
      calories: 395,
      protein: 12.0,
      fat: 10.0,
      carbs: 68.0,
      fiber: 10.0,
    },
    measures: [
      {
        id: "measure_musli_colher",
        label: "colher de sopa (10g)",
        weight: 10,
      },
      {
        id: "measure_musli_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_granola", "sugg_aveia", "sugg_chia"],
    mealTypes: ["breakfast", "snack"],
  },

  // === PROTEÍNAS ===
  {
    id: "sugg_ovo",
    name: "Ovo",
    nutrients: {
      calories: 146,
      protein: 13.3,
      fat: 9.5,
      carbs: 0.6,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_ovo_unidade",
        label: "unidade (50g)",
        weight: 50,
      },
      {
        id: "measure_ovo_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: [
      "sugg_iogurte_natural",
      "sugg_queijo_mussarela",
      "sugg_omelete",
      "sugg_clara_ovo",
    ],
    mealTypes: ["breakfast", "snack", "lunch", "dinner"],
  },
  {
    id: "sugg_clara_ovo",
    name: "Clara de Ovo",
    nutrients: {
      calories: 57,
      protein: 12.6,
      fat: 0.0,
      carbs: 0.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_clara_unidade",
        label: "unidade (30g)",
        weight: 30,
      },
      {
        id: "measure_clara_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_ovo", "sugg_whey", "sugg_frango"],
    mealTypes: ["breakfast", "snack", "lunch", "dinner"],
  },
  {
    id: "sugg_omelete",
    name: "Omelete com Legumes",
    nutrients: {
      calories: 154,
      protein: 10.6,
      fat: 11.5,
      carbs: 2.5,
      fiber: 0.7,
    },
    measures: [
      {
        id: "measure_omelete_porcao",
        label: "porção (100g)",
        weight: 100,
      },
      {
        id: "measure_omelete_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_ovo", "sugg_crepioca", "sugg_frango"],
    mealTypes: ["breakfast", "lunch", "dinner"],
  },
  {
    id: "sugg_iogurte_natural",
    name: "Iogurte Natural",
    nutrients: {
      calories: 61,
      protein: 3.5,
      fat: 3.3,
      carbs: 4.7,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_iogurte_natural_copo",
        label: "copo (170g)",
        weight: 170,
      },
      {
        id: "measure_iogurte_natural_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_iogurte_grego", "sugg_kefir", "sugg_queijo_cottage"],
    mealTypes: [
      "breakfast",
      "snack",
      "morning_snack",
      "afternoon_snack",
      "supper",
    ],
  },
  {
    id: "sugg_iogurte_grego",
    name: "Iogurte Grego",
    nutrients: {
      calories: 97,
      protein: 8.8,
      fat: 5.0,
      carbs: 4.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_iogurte_grego_pote",
        label: "pote pequeno (100g)",
        weight: 100,
      },
      {
        id: "measure_iogurte_grego_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_iogurte_natural", "sugg_skyr", "sugg_queijo_cottage"],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_skyr",
    name: "Skyr (Iogurte Islandês)",
    nutrients: {
      calories: 63,
      protein: 11.0,
      fat: 0.2,
      carbs: 4.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_skyr_pote",
        label: "pote pequeno (100g)",
        weight: 100,
      },
      {
        id: "measure_skyr_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: [
      "sugg_iogurte_grego",
      "sugg_iogurte_natural",
      "sugg_queijo_cottage",
    ],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_iogurte_desnatado",
    name: "Iogurte Desnatado",
    nutrients: {
      calories: 56,
      protein: 5.7,
      fat: 0.0,
      carbs: 7.8,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_iogurte_desnatado_pote",
        label: "pote pequeno (100g)",
        weight: 100,
      },
      {
        id: "measure_iogurte_desnatado_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_skyr", "sugg_iogurte_natural", "sugg_iogurte_grego"],
    mealTypes: [
      "breakfast",
      "snack",
      "morning_snack",
      "afternoon_snack",
      "supper",
    ],
  },
  {
    id: "sugg_queijo_mussarela",
    name: "Queijo Mussarela",
    nutrients: {
      calories: 280,
      protein: 22.0,
      fat: 21.0,
      carbs: 2.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_queijo_mussarela_fatia",
        label: "fatia (20g)",
        weight: 20,
      },
      {
        id: "measure_queijo_mussarela_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: [
      "sugg_ovo",
      "sugg_iogurte_natural",
      "sugg_queijo_cottage",
      "sugg_queijo_minas",
    ],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_queijo_cottage",
    name: "Queijo Cottage",
    nutrients: {
      calories: 103,
      protein: 11.1,
      fat: 4.3,
      carbs: 3.4,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_queijo_cottage_colher",
        label: "colher de sopa (20g)",
        weight: 20,
      },
      {
        id: "measure_queijo_cottage_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: [
      "sugg_requeijao_light",
      "sugg_queijo_minas",
      "sugg_iogurte_grego",
    ],
    mealTypes: [
      "breakfast",
      "snack",
      "morning_snack",
      "afternoon_snack",
      "supper",
    ],
  },
  {
    id: "sugg_queijo_minas",
    name: "Queijo Minas Frescal",
    nutrients: {
      calories: 264,
      protein: 17.4,
      fat: 20.2,
      carbs: 3.2,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_queijo_minas_fatia",
        label: "fatia (30g)",
        weight: 30,
      },
      {
        id: "measure_queijo_minas_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: [
      "sugg_queijo_cottage",
      "sugg_queijo_mussarela",
      "sugg_ricota",
    ],
    mealTypes: [
      "breakfast",
      "snack",
      "lunch",
      "morning_snack",
      "afternoon_snack",
    ],
  },
  {
    id: "sugg_ricota",
    name: "Ricota",
    nutrients: {
      calories: 174,
      protein: 11.3,
      fat: 13.0,
      carbs: 3.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_ricota_fatia",
        label: "fatia (30g)",
        weight: 30,
      },
      {
        id: "measure_ricota_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: [
      "sugg_queijo_cottage",
      "sugg_queijo_minas",
      "sugg_creme_ricota",
    ],
    mealTypes: ["breakfast", "snack", "lunch"],
  },
  {
    id: "sugg_creme_ricota",
    name: "Creme de Ricota Light",
    nutrients: {
      calories: 120,
      protein: 10.0,
      fat: 8.0,
      carbs: 2.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_creme_ricota_colher",
        label: "colher de sopa (20g)",
        weight: 20,
      },
      {
        id: "measure_creme_ricota_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_requeijao_light"],
    mealTypes: ["breakfast", "snack"],
  },

  // === FRUTAS ===
  {
    id: "sugg_mamao",
    name: "Mamão",
    nutrients: {
      calories: 43,
      protein: 0.5,
      fat: 0.1,
      carbs: 11.0,
      fiber: 1.7,
    },
    measures: [
      {
        id: "measure_mamao_fatia",
        label: "fatia (100g)",
        weight: 100,
      },
      {
        id: "measure_mamao_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: [
      "sugg_banana",
      "sugg_maca",
      "sugg_melao",
      "sugg_abacaxi",
      "sugg_manga",
    ],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_banana",
    name: "Banana",
    nutrients: {
      calories: 98,
      protein: 1.3,
      fat: 0.1,
      carbs: 26.0,
      fiber: 2.0,
    },
    measures: [
      {
        id: "measure_banana_unidade",
        label: "unidade (100g)",
        weight: 100,
      },
      {
        id: "measure_banana_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_maca", "sugg_pera", "sugg_mamao"],
    mealTypes: [
      "breakfast",
      "snack",
      "morning_snack",
      "afternoon_snack",
      "supper",
    ],
  },
  {
    id: "sugg_maca",
    name: "Maçã",
    nutrients: {
      calories: 52,
      protein: 0.3,
      fat: 0.2,
      carbs: 13.8,
      fiber: 2.4,
    },
    measures: [
      {
        id: "measure_maca_unidade",
        label: "unidade (150g)",
        weight: 150,
      },
      {
        id: "measure_maca_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_banana", "sugg_pera", "sugg_melao"],
    mealTypes: ["breakfast", "snack", "morning_snack", "afternoon_snack"],
  },
  {
    id: "sugg_melao",
    name: "Melão",
    nutrients: {
      calories: 34,
      protein: 0.8,
      fat: 0.2,
      carbs: 8.0,
      fiber: 0.9,
    },
    measures: [
      {
        id: "measure_melao_fatia",
        label: "fatia (100g)",
        weight: 100,
      },
      {
        id: "measure_melao_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: [
      "sugg_mamao",
      "sugg_banana",
      "sugg_maca",
      "sugg_melancia",
      "sugg_abacaxi",
    ],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_abacaxi",
    name: "Abacaxi",
    nutrients: {
      calories: 50,
      protein: 0.5,
      fat: 0.1,
      carbs: 13.1,
      fiber: 1.4,
    },
    measures: [
      {
        id: "measure_abacaxi_fatia",
        label: "fatia (100g)",
        weight: 100,
      },
      {
        id: "measure_abacaxi_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_melao", "sugg_manga", "sugg_mamao"],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_manga",
    name: "Manga",
    nutrients: {
      calories: 60,
      protein: 0.8,
      fat: 0.4,
      carbs: 15.0,
      fiber: 1.6,
    },
    measures: [
      {
        id: "measure_manga_fatia",
        label: "fatia (100g)",
        weight: 100,
      },
      {
        id: "measure_manga_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_abacaxi", "sugg_mamao", "sugg_banana"],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_melancia",
    name: "Melancia",
    nutrients: {
      calories: 30,
      protein: 0.6,
      fat: 0.2,
      carbs: 7.6,
      fiber: 0.4,
    },
    measures: [
      {
        id: "measure_melancia_fatia",
        label: "fatia (200g)",
        weight: 200,
      },
      {
        id: "measure_melancia_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_melao", "sugg_abacaxi", "sugg_laranja"],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_laranja",
    name: "Laranja",
    nutrients: {
      calories: 47,
      protein: 0.9,
      fat: 0.1,
      carbs: 11.8,
      fiber: 2.4,
    },
    measures: [
      {
        id: "measure_laranja_unidade",
        label: "unidade (150g)",
        weight: 150,
      },
      {
        id: "measure_laranja_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_maca", "sugg_pera", "sugg_kiwi"],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_pera",
    name: "Pera",
    nutrients: {
      calories: 57,
      protein: 0.4,
      fat: 0.1,
      carbs: 15.2,
      fiber: 3.1,
    },
    measures: [
      {
        id: "measure_pera_unidade",
        label: "unidade (150g)",
        weight: 150,
      },
      {
        id: "measure_pera_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_maca", "sugg_banana", "sugg_melao"],
    mealTypes: ["breakfast", "snack", "morning_snack", "afternoon_snack"],
  },
  {
    id: "sugg_kiwi",
    name: "Kiwi",
    nutrients: {
      calories: 61,
      protein: 1.1,
      fat: 0.5,
      carbs: 14.7,
      fiber: 3.0,
    },
    measures: [
      {
        id: "measure_kiwi_unidade",
        label: "unidade (80g)",
        weight: 80,
      },
      {
        id: "measure_kiwi_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_laranja", "sugg_morango", "sugg_pera"],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_morango",
    name: "Morango",
    nutrients: {
      calories: 32,
      protein: 0.7,
      fat: 0.3,
      carbs: 7.7,
      fiber: 2.0,
    },
    measures: [
      {
        id: "measure_morango_unidade",
        label: "unidades (10 un, ~100g)",
        weight: 100,
      },
      {
        id: "measure_morango_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_framboesa", "sugg_mirtilo", "sugg_amora"],
    mealTypes: ["breakfast", "snack", "morning_snack", "afternoon_snack"],
  },
  {
    id: "sugg_mirtilo",
    name: "Mirtilo (Blueberry)",
    nutrients: {
      calories: 57,
      protein: 0.7,
      fat: 0.3,
      carbs: 14.5,
      fiber: 2.4,
    },
    measures: [
      {
        id: "measure_mirtilo_xicara",
        label: "xícara (150g)",
        weight: 150,
      },
      {
        id: "measure_mirtilo_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_morango", "sugg_framboesa", "sugg_amora"],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_framboesa",
    name: "Framboesa",
    nutrients: {
      calories: 52,
      protein: 1.2,
      fat: 0.7,
      carbs: 11.9,
      fiber: 6.5,
    },
    measures: [
      {
        id: "measure_framboesa_xicara",
        label: "xícara (120g)",
        weight: 120,
      },
      {
        id: "measure_framboesa_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_mirtilo", "sugg_morango", "sugg_amora"],
    mealTypes: ["breakfast", "snack"],
  },

  // === LEGUMES E VERDURAS ===
  {
    id: "sugg_legumes",
    name: "Legumes (Mix)",
    nutrients: {
      calories: 25,
      protein: 1.5,
      fat: 0.2,
      carbs: 5.0,
      fiber: 2.5,
    },
    measures: [
      {
        id: "measure_legumes_porcao",
        label: "porção (100g)",
        weight: 100,
      },
      {
        id: "measure_legumes_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_salada_mista", "sugg_brocolis", "sugg_couve_flor"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_salada_mista",
    name: "Salada Mista",
    nutrients: {
      calories: 15,
      protein: 1.0,
      fat: 0.2,
      carbs: 3.0,
      fiber: 1.8,
    },
    measures: [
      {
        id: "measure_salada_porcao",
        label: "porção (100g)",
        weight: 100,
      },
      {
        id: "measure_salada_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_legumes", "sugg_folhas_verdes", "sugg_rucula"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_brocolis",
    name: "Brócolis",
    nutrients: {
      calories: 34,
      protein: 2.8,
      fat: 0.4,
      carbs: 6.6,
      fiber: 2.6,
    },
    measures: [
      {
        id: "measure_brocolis_porcao",
        label: "porção (100g)",
        weight: 100,
      },
      {
        id: "measure_brocolis_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_couve_flor", "sugg_espinafre", "sugg_legumes"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_couve_flor",
    name: "Couve-Flor",
    nutrients: {
      calories: 25,
      protein: 1.9,
      fat: 0.3,
      carbs: 5.0,
      fiber: 2.0,
    },
    measures: [
      {
        id: "measure_couve_flor_porcao",
        label: "porção (100g)",
        weight: 100,
      },
      {
        id: "measure_couve_flor_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_brocolis", "sugg_legumes", "sugg_abobrinha"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_espinafre",
    name: "Espinafre",
    nutrients: {
      calories: 23,
      protein: 2.9,
      fat: 0.4,
      carbs: 3.6,
      fiber: 2.2,
    },
    measures: [
      {
        id: "measure_espinafre_porcao",
        label: "porção (100g)",
        weight: 100,
      },
      {
        id: "measure_espinafre_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_rucula", "sugg_folhas_verdes", "sugg_couve"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_folhas_verdes",
    name: "Mix de Folhas Verdes",
    nutrients: {
      calories: 20,
      protein: 1.5,
      fat: 0.3,
      carbs: 3.0,
      fiber: 1.5,
    },
    measures: [
      {
        id: "measure_folhas_verdes_porcao",
        label: "porção (100g)",
        weight: 100,
      },
      {
        id: "measure_folhas_verdes_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_espinafre", "sugg_rucula", "sugg_salada_mista"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_rucula",
    name: "Rúcula",
    nutrients: {
      calories: 25,
      protein: 2.6,
      fat: 0.7,
      carbs: 3.7,
      fiber: 1.6,
    },
    measures: [
      {
        id: "measure_rucula_porcao",
        label: "porção (100g)",
        weight: 100,
      },
      {
        id: "measure_rucula_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_espinafre", "sugg_folhas_verdes", "sugg_couve"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_couve",
    name: "Couve",
    nutrients: {
      calories: 49,
      protein: 3.3,
      fat: 0.7,
      carbs: 10.0,
      fiber: 2.0,
    },
    measures: [
      {
        id: "measure_couve_porcao",
        label: "porção (100g)",
        weight: 100,
      },
      {
        id: "measure_couve_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_espinafre", "sugg_rucula", "sugg_folhas_verdes"],
    mealTypes: ["lunch", "dinner", "breakfast"],
  },
  {
    id: "sugg_abobrinha",
    name: "Abobrinha",
    nutrients: {
      calories: 17,
      protein: 1.2,
      fat: 0.3,
      carbs: 3.1,
      fiber: 1.0,
    },
    measures: [
      {
        id: "measure_abobrinha_porcao",
        label: "porção (100g)",
        weight: 100,
      },
      {
        id: "measure_abobrinha_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_legumes", "sugg_couve_flor", "sugg_pepino"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_pepino",
    name: "Pepino",
    nutrients: {
      calories: 15,
      protein: 0.7,
      fat: 0.1,
      carbs: 3.6,
      fiber: 0.5,
    },
    measures: [
      {
        id: "measure_pepino_unidade",
        label: "unidade (300g)",
        weight: 300,
      },
      {
        id: "measure_pepino_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_abobrinha", "sugg_tomate", "sugg_salada_mista"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_tomate",
    name: "Tomate",
    nutrients: {
      calories: 18,
      protein: 0.9,
      fat: 0.2,
      carbs: 3.9,
      fiber: 1.2,
    },
    measures: [
      {
        id: "measure_tomate_unidade",
        label: "unidade (120g)",
        weight: 120,
      },
      {
        id: "measure_tomate_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_pepino", "sugg_cenoura", "sugg_salada_mista"],
    mealTypes: [
      "lunch",
      "dinner",
      "breakfast",
      "morning_snack",
      "afternoon_snack",
    ],
  },

  // === GORDURAS ===
  {
    id: "sugg_requeijao_light",
    name: "Requeijão Light",
    nutrients: {
      calories: 140,
      protein: 8.0,
      fat: 10.0,
      carbs: 4.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_requeijao_light_colher",
        label: "colher de sopa (20g)",
        weight: 20,
      },
      {
        id: "measure_requeijao_light_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_creme_ricota", "sugg_cream_cheese_light"],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_cream_cheese_light",
    name: "Cream Cheese Light",
    nutrients: {
      calories: 150,
      protein: 7.0,
      fat: 12.0,
      carbs: 5.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_cream_cheese_light_colher",
        label: "colher de sopa (20g)",
        weight: 20,
      },
      {
        id: "measure_cream_cheese_light_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_requeijao_light", "sugg_creme_ricota"],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_abacate",
    name: "Abacate",
    nutrients: {
      calories: 160,
      protein: 2.0,
      fat: 14.7,
      carbs: 8.5,
      fiber: 6.7,
    },
    measures: [
      {
        id: "measure_abacate_fatia",
        label: "fatia (50g)",
        weight: 50,
      },
      {
        id: "measure_abacate_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_azeite", "sugg_castanha_do_para", "sugg_amendoa"],
    mealTypes: ["breakfast", "snack", "lunch", "dinner"],
  },
  {
    id: "sugg_azeite",
    name: "Azeite de Oliva Extra Virgem",
    nutrients: {
      calories: 884,
      protein: 0.0,
      fat: 100.0,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_azeite_colher",
        label: "colher de sopa (10g)",
        weight: 10,
      },
      {
        id: "measure_azeite_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_oleo_coco", "sugg_abacate", "sugg_manteiga_ghee"],
    mealTypes: ["breakfast", "lunch", "dinner"],
  },
  {
    id: "sugg_oleo_coco",
    name: "Óleo de Coco",
    nutrients: {
      calories: 862,
      protein: 0.0,
      fat: 100.0,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_oleo_coco_colher",
        label: "colher de sopa (10g)",
        weight: 10,
      },
      {
        id: "measure_oleo_coco_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_azeite", "sugg_manteiga_ghee", "sugg_abacate"],
    mealTypes: ["breakfast", "lunch", "dinner"],
  },
  {
    id: "sugg_manteiga_ghee",
    name: "Manteiga Ghee",
    nutrients: {
      calories: 876,
      protein: 0.0,
      fat: 99.8,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_manteiga_ghee_colher",
        label: "colher de chá (5g)",
        weight: 5,
      },
      {
        id: "measure_manteiga_ghee_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_azeite", "sugg_oleo_coco", "sugg_manteiga"],
    mealTypes: ["breakfast", "lunch", "dinner"],
  },
  {
    id: "sugg_amora",
    name: "Amora",
    nutrients: {
      calories: 43,
      protein: 1.4,
      fat: 0.5,
      carbs: 9.6,
      fiber: 5.3,
    },
    measures: [
      {
        id: "measure_amora_xicara",
        label: "xícara (144g)",
        weight: 144,
      },
      {
        id: "measure_amora_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_framboesa", "sugg_mirtilo", "sugg_morango"],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_cenoura",
    name: "Cenoura",
    nutrients: {
      calories: 41,
      protein: 0.9,
      fat: 0.2,
      carbs: 9.6,
      fiber: 2.8,
    },
    measures: [
      {
        id: "measure_cenoura_unidade",
        label: "unidade (80g)",
        weight: 80,
      },
      {
        id: "measure_cenoura_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_tomate", "sugg_brocolis", "sugg_abobrinha"],
    mealTypes: ["lunch", "dinner", "snack"],
  },
  {
    id: "sugg_frango",
    name: "Peito de Frango",
    nutrients: {
      calories: 165,
      protein: 31.0,
      fat: 3.6,
      carbs: 0.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_frango_file",
        label: "filé médio (100g)",
        weight: 100,
      },
      {
        id: "measure_frango_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: [
      "sugg_patinho",
      "sugg_tilapia",
      "sugg_coxa_frango",
      "sugg_peito_peru",
    ],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_coxa_frango",
    name: "Coxa de Frango (sem pele)",
    nutrients: {
      calories: 184,
      protein: 26.3,
      fat: 8.2,
      carbs: 0.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_coxa_frango_unidade",
        label: "unidade (80g)",
        weight: 80,
      },
      {
        id: "measure_coxa_frango_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_frango", "sugg_peito_peru", "sugg_patinho"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_peito_peru",
    name: "Peito de Peru",
    nutrients: {
      calories: 135,
      protein: 29.3,
      fat: 1.5,
      carbs: 0.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_peito_peru_fatia",
        label: "fatia (30g)",
        weight: 30,
      },
      {
        id: "measure_peito_peru_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_frango", "sugg_coxa_frango", "sugg_patinho"],
    mealTypes: ["breakfast", "lunch", "dinner", "snack"],
  },
  {
    id: "sugg_patinho",
    name: "Carne Bovina (Patinho)",
    nutrients: {
      calories: 187,
      protein: 26.7,
      fat: 8.1,
      carbs: 0.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_patinho_bife",
        label: "bife médio (100g)",
        weight: 100,
      },
      {
        id: "measure_patinho_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: [
      "sugg_frango",
      "sugg_tilapia",
      "sugg_alcatra",
      "sugg_file_mignon",
    ],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_alcatra",
    name: "Carne Bovina (Alcatra)",
    nutrients: {
      calories: 211,
      protein: 25.6,
      fat: 11.7,
      carbs: 0.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_alcatra_bife",
        label: "bife médio (100g)",
        weight: 100,
      },
      {
        id: "measure_alcatra_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_patinho", "sugg_file_mignon", "sugg_frango"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_file_mignon",
    name: "Filé Mignon",
    nutrients: {
      calories: 199,
      protein: 24.8,
      fat: 10.6,
      carbs: 0.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_file_mignon_bife",
        label: "bife médio (100g)",
        weight: 100,
      },
      {
        id: "measure_file_mignon_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_patinho", "sugg_alcatra", "sugg_frango"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_tilapia",
    name: "Filé de Tilápia",
    nutrients: {
      calories: 129,
      protein: 26.2,
      fat: 2.7,
      carbs: 0.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_tilapia_file",
        label: "filé médio (100g)",
        weight: 100,
      },
      {
        id: "measure_tilapia_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: [
      "sugg_frango",
      "sugg_patinho",
      "sugg_salmao",
      "sugg_bacalhau",
    ],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_salmao",
    name: "Salmão",
    nutrients: {
      calories: 208,
      protein: 20.4,
      fat: 13.4,
      carbs: 0.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_salmao_file",
        label: "filé médio (100g)",
        weight: 100,
      },
      {
        id: "measure_salmao_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_tilapia", "sugg_bacalhau", "sugg_atum"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_bacalhau",
    name: "Bacalhau",
    nutrients: {
      calories: 105,
      protein: 22.9,
      fat: 0.9,
      carbs: 0.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_bacalhau_posta",
        label: "posta (100g)",
        weight: 100,
      },
      {
        id: "measure_bacalhau_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_tilapia", "sugg_salmao", "sugg_atum"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_atum",
    name: "Atum (natural)",
    nutrients: {
      calories: 132,
      protein: 29.1,
      fat: 1.0,
      carbs: 0.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_atum_lata",
        label: "lata escorrida (120g)",
        weight: 120,
      },
      {
        id: "measure_atum_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_sardinha", "sugg_salmao", "sugg_frango"],
    mealTypes: ["lunch", "dinner", "snack"],
  },
  {
    id: "sugg_sardinha",
    name: "Sardinha (natural)",
    nutrients: {
      calories: 208,
      protein: 24.6,
      fat: 11.5,
      carbs: 0.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_sardinha_lata",
        label: "lata escorrida (84g)",
        weight: 84,
      },
      {
        id: "measure_sardinha_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_atum", "sugg_salmao", "sugg_tilapia"],
    mealTypes: ["lunch", "dinner", "snack"],
  },
  {
    id: "sugg_whey",
    name: "Whey Protein",
    nutrients: {
      calories: 370,
      protein: 80.0,
      fat: 3.0,
      carbs: 6.0,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_whey_scoop",
        label: "scoop (30g)",
        weight: 30,
      },
      {
        id: "measure_whey_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_albumina", "sugg_peito_peru", "sugg_queijo_cottage"],
    mealTypes: ["breakfast", "snack", "morning_snack", "afternoon_snack"],
  },
  {
    id: "sugg_albumina",
    name: "Albumina em Pó",
    nutrients: {
      calories: 371,
      protein: 82.4,
      fat: 0.5,
      carbs: 4.1,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_albumina_colher",
        label: "colher de sopa (10g)",
        weight: 10,
      },
      {
        id: "measure_albumina_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_whey", "sugg_clara_ovo"],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_proteina_vegetal",
    name: "Proteína Vegetal Texturizada",
    nutrients: {
      calories: 333,
      protein: 50.0,
      fat: 0.5,
      carbs: 35.0,
      fiber: 17.5,
    },
    measures: [
      {
        id: "measure_proteina_vegetal_colher",
        label: "colher de sopa hidratada (20g)",
        weight: 20,
      },
      {
        id: "measure_proteina_vegetal_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_tofu", "sugg_grao_bico", "sugg_lentilha"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_tofu",
    name: "Tofu",
    nutrients: {
      calories: 83,
      protein: 10.0,
      fat: 4.8,
      carbs: 1.9,
      fiber: 1.0,
    },
    measures: [
      {
        id: "measure_tofu_fatia",
        label: "fatia (100g)",
        weight: 100,
      },
      {
        id: "measure_tofu_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_proteina_vegetal", "sugg_grao_bico", "sugg_lentilha"],
    mealTypes: ["lunch", "dinner", "breakfast"],
  },
  {
    id: "sugg_grao_bico",
    name: "Grão de Bico",
    nutrients: {
      calories: 164,
      protein: 8.9,
      fat: 2.6,
      carbs: 27.4,
      fiber: 7.6,
    },
    measures: [
      {
        id: "measure_grao_bico_colher",
        label: "colher de sopa (20g)",
        weight: 20,
      },
      {
        id: "measure_grao_bico_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_lentilha", "sugg_feijao", "sugg_tofu"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_lentilha",
    name: "Lentilha",
    nutrients: {
      calories: 116,
      protein: 9.0,
      fat: 0.4,
      carbs: 20.1,
      fiber: 7.9,
    },
    measures: [
      {
        id: "measure_lentilha_colher",
        label: "colher de sopa (20g)",
        weight: 20,
      },
      {
        id: "measure_lentilha_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_grao_bico", "sugg_feijao", "sugg_proteina_vegetal"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_feijao",
    name: "Feijão",
    nutrients: {
      calories: 76,
      protein: 4.8,
      fat: 0.5,
      carbs: 13.6,
      fiber: 8.5,
    },
    measures: [
      {
        id: "measure_feijao_concha",
        label: "concha (80g)",
        weight: 80,
      },
      {
        id: "measure_feijao_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_feijao_xicara",
        label: "xícara (180g)",
        weight: 180,
      },
    ],
    alternatives: ["sugg_lentilha", "sugg_grao_bico", "sugg_feijao_preto"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_feijao_preto",
    name: "Feijão Preto",
    nutrients: {
      calories: 77,
      protein: 4.5,
      fat: 0.5,
      carbs: 14.0,
      fiber: 8.4,
    },
    measures: [
      {
        id: "measure_feijao_preto_concha",
        label: "concha (80g)",
        weight: 80,
      },
      {
        id: "measure_feijao_preto_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_feijao_preto_xicara",
        label: "xícara (180g)",
        weight: 180,
      },
    ],
    alternatives: ["sugg_feijao", "sugg_lentilha", "sugg_grao_bico"],
    mealTypes: ["lunch", "dinner"],
  },
  {
    id: "sugg_pasta_amendoim",
    name: "Pasta de Amendoim",
    nutrients: {
      calories: 588,
      protein: 25.0,
      fat: 50.0,
      carbs: 20.0,
      fiber: 8.0,
    },
    measures: [
      {
        id: "measure_pasta_amendoim_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
      {
        id: "measure_pasta_amendoim_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_abacate", "sugg_amendoa", "sugg_castanha_do_para"],
    mealTypes: ["breakfast", "snack", "morning_snack", "afternoon_snack"],
  },
  {
    id: "sugg_castanha_do_para",
    name: "Castanha do Pará",
    nutrients: {
      calories: 656,
      protein: 14.3,
      fat: 67.1,
      carbs: 11.7,
      fiber: 7.9,
    },
    measures: [
      {
        id: "measure_castanha_do_para_unidade",
        label: "unidade (4g)",
        weight: 4,
      },
      {
        id: "measure_castanha_do_para_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["sugg_amendoa", "sugg_abacate", "sugg_pasta_amendoim"],
    mealTypes: [
      "breakfast",
      "snack",
      "morning_snack",
      "afternoon_snack",
      "supper",
    ],
  },
  {
    id: "sugg_amendoa",
    name: "Amêndoa",
    nutrients: {
      calories: 575,
      protein: 21.2,
      fat: 49.4,
      carbs: 21.7,
      fiber: 12.2,
    },
    measures: [
      {
        id: "measure_amendoa_unidade",
        label: "unidade (1g)",
        weight: 1,
      },
      {
        id: "measure_amendoa_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: [
      "sugg_castanha_do_para",
      "sugg_abacate",
      "sugg_pasta_amendoim",
    ],
    mealTypes: ["breakfast", "snack"],
  },
  {
    id: "sugg_leite",
    name: "Leite Desnatado",
    nutrients: {
      calories: 34,
      protein: 3.1,
      fat: 0.35,
      carbs: 4.6,
      fiber: 0,
    },
    measures: [
      {
        id: "measure_leite_copo",
        label: "copo (200ml)",
        weight: 200,
      },
      {
        id: "measure_leite_100g",
        label: "100ml",
        weight: 100,
      },
    ],
    alternatives: ["sugg_iogurte_natural", "sugg_bebida_vegetal"],
    mealTypes: [
      "breakfast",
      "snack",
      "morning_snack",
      "afternoon_snack",
      "supper",
    ],
  },
];

// Banco de dados de sugestões de refeições completas
export const mealSuggestionDatabase: MealSuggestion[] = [
  // === CAFÉ DA MANHÃ ===
  {
    id: "meal_suggestion_breakfast_1",
    name: "Café da Manhã Tradicional",
    description:
      "Café da manhã balanceado e prático com boa fonte de proteínas e carboidratos",
    foods: [
      "sugg_pao_frances",
      "sugg_ovo",
      "sugg_requeijao_light",
      "sugg_mamao",
    ],
    mealType: "breakfast",
    macrosTarget: {
      caloriesMin: 400,
      caloriesMax: 500,
      proteinMin: 15,
      proteinMax: 25,
      carbsMin: 50,
      carbsMax: 70,
      fatMin: 10,
      fatMax: 18,
    },
  },
  {
    id: "meal_suggestion_breakfast_2",
    name: "Café da Manhã Fitness",
    description:
      "Opção mais leve e rica em proteínas para quem treina pela manhã",
    foods: ["sugg_tapioca", "sugg_ovo", "sugg_banana"],
    mealType: "breakfast",
    macrosTarget: {
      caloriesMin: 300,
      caloriesMax: 400,
      proteinMin: 15,
      proteinMax: 25,
      carbsMin: 45,
      carbsMax: 65,
      fatMin: 8,
      fatMax: 15,
    },
  },
  {
    id: "meal_suggestion_breakfast_3",
    name: "Café da Manhã Rápido",
    description: "Opção prática para dias corridos, mas com bons nutrientes",
    foods: ["sugg_iogurte_natural", "sugg_granola", "sugg_banana"],
    mealType: "breakfast",
    macrosTarget: {
      caloriesMin: 350,
      caloriesMax: 450,
      proteinMin: 12,
      proteinMax: 20,
      carbsMin: 55,
      carbsMax: 70,
      fatMin: 10,
      fatMax: 18,
    },
  },
  {
    id: "meal_suggestion_breakfast_5",
    name: "Café da Manhã Low Carb",
    description: "Opção com baixo teor de carboidratos para emagrecimento",
    foods: ["sugg_ovo", "sugg_abacate", "sugg_queijo_cottage", "sugg_tomate"],
    mealType: "breakfast",
    macrosTarget: {
      caloriesMin: 350,
      caloriesMax: 450,
      proteinMin: 20,
      proteinMax: 30,
      carbsMin: 10,
      carbsMax: 20,
      fatMin: 20,
      fatMax: 30,
    },
  },
  {
    id: "meal_suggestion_breakfast_6",
    name: "Café da Manhã Vegano",
    description: "Opção nutritiva à base de plantas",
    foods: ["sugg_tofu", "sugg_aveia", "sugg_chia", "sugg_banana"],
    mealType: "breakfast",
    macrosTarget: {
      caloriesMin: 400,
      caloriesMax: 500,
      proteinMin: 15,
      proteinMax: 25,
      carbsMin: 40,
      carbsMax: 60,
      fatMin: 15,
      fatMax: 25,
    },
  },

  // === ALMOÇO ===
  {
    id: "meal_suggestion_lunch_1",
    name: "Almoço Tradicional",
    description: "Opção balanceada com proteínas, carboidratos e vegetais",
    foods: ["sugg_arroz", "sugg_frango", "sugg_salada_mista", "sugg_azeite"],
    mealType: "lunch",
    macrosTarget: {
      caloriesMin: 500,
      caloriesMax: 600,
      proteinMin: 30,
      proteinMax: 40,
      carbsMin: 60,
      carbsMax: 80,
      fatMin: 10,
      fatMax: 20,
    },
  },
  {
    id: "meal_suggestion_lunch_2",
    name: "Almoço Low Carb",
    description:
      "Opção com menos carboidratos e mais proteínas para quem quer emagrecer",
    foods: [
      "sugg_patinho",
      "sugg_batata_doce",
      "sugg_salada_mista",
      "sugg_azeite",
    ],
    mealType: "lunch",
    macrosTarget: {
      caloriesMin: 450,
      caloriesMax: 550,
      proteinMin: 35,
      proteinMax: 45,
      carbsMin: 30,
      carbsMax: 50,
      fatMin: 15,
      fatMax: 25,
    },
  },
  {
    id: "meal_suggestion_lunch_3",
    name: "Almoço Pós-Treino",
    description:
      "Opção rica em proteínas e carboidratos para recuperação muscular",
    foods: ["sugg_frango", "sugg_batata_doce", "sugg_legumes"],
    mealType: "lunch",
    macrosTarget: {
      caloriesMin: 500,
      caloriesMax: 600,
      proteinMin: 35,
      proteinMax: 50,
      carbsMin: 50,
      carbsMax: 70,
      fatMin: 8,
      fatMax: 15,
    },
  },
  {
    id: "meal_suggestion_lunch_4",
    name: "Almoço Alto Proteico",
    description: "Refeição com foco em proteínas para hipertrofia",
    foods: [
      "sugg_file_mignon",
      "sugg_arroz_integral",
      "sugg_brocolis",
      "sugg_azeite",
    ],
    mealType: "lunch",
    macrosTarget: {
      caloriesMin: 550,
      caloriesMax: 650,
      proteinMin: 40,
      proteinMax: 50,
      carbsMin: 40,
      carbsMax: 60,
      fatMin: 15,
      fatMax: 25,
    },
  },
  {
    id: "meal_suggestion_lunch_5",
    name: "Almoço Mediterrâneo",
    description: "Refeição baseada na dieta mediterrânea para saúde geral",
    foods: [
      "sugg_salmao",
      "sugg_azeite",
      "sugg_quinoa",
      "sugg_tomate",
      "sugg_folhas_verdes",
    ],
    mealType: "lunch",
    macrosTarget: {
      caloriesMin: 500,
      caloriesMax: 600,
      proteinMin: 30,
      proteinMax: 40,
      carbsMin: 40,
      carbsMax: 55,
      fatMin: 20,
      fatMax: 30,
    },
  },
  {
    id: "meal_suggestion_lunch_6",
    name: "Almoço Vegetariano",
    description: "Opção nutritiva sem carnes e rica em proteínas vegetais",
    foods: ["sugg_proteina_vegetal", "sugg_arroz_integral", "sugg_legumes"],
    mealType: "lunch",
    macrosTarget: {
      caloriesMin: 450,
      caloriesMax: 550,
      proteinMin: 25,
      proteinMax: 35,
      carbsMin: 60,
      carbsMax: 75,
      fatMin: 10,
      fatMax: 20,
    },
  },

  // === JANTAR ===
  {
    id: "meal_suggestion_dinner_1",
    name: "Jantar Leve",
    description: "Refeição mais leve para a noite com foco em proteínas magras",
    foods: ["sugg_frango", "sugg_arroz", "sugg_legumes", "sugg_azeite"],
    mealType: "dinner",
    macrosTarget: {
      caloriesMin: 300,
      caloriesMax: 400,
      proteinMin: 25,
      proteinMax: 35,
      carbsMin: 20,
      carbsMax: 35,
      fatMin: 8,
      fatMax: 15,
    },
  },
  {
    id: "meal_suggestion_dinner_2",
    name: "Jantar Balanceado",
    description: "Opção equilibrada para o jantar com proteínas e carboidratos",
    foods: [
      "sugg_batata_inglesa",
      "sugg_frango",
      "sugg_salada_mista",
      "sugg_azeite",
    ],
    mealType: "dinner",
    macrosTarget: {
      caloriesMin: 400,
      caloriesMax: 500,
      proteinMin: 30,
      proteinMax: 40,
      carbsMin: 30,
      carbsMax: 50,
      fatMin: 10,
      fatMax: 18,
    },
  },
  {
    id: "meal_suggestion_dinner_3",
    name: "Jantar Cetogênico",
    description: "Jantar baixo em carboidratos e rico em gorduras boas",
    foods: ["sugg_salmao", "sugg_abacate", "sugg_azeite", "sugg_folhas_verdes"],
    mealType: "dinner",
    macrosTarget: {
      caloriesMin: 450,
      caloriesMax: 550,
      proteinMin: 25,
      proteinMax: 35,
      carbsMin: 5,
      carbsMax: 15,
      fatMin: 30,
      fatMax: 40,
    },
  },
  {
    id: "meal_suggestion_dinner_4",
    name: "Jantar Proteico",
    description: "Opção rica em proteínas para quem se exercita à noite",
    foods: [
      "sugg_arroz_integral",
      "sugg_peito_peru",
      "sugg_queijo_cottage",
      "sugg_legumes",
      "sugg_azeite",
    ],
    mealType: "dinner",
    macrosTarget: {
      caloriesMin: 350,
      caloriesMax: 450,
      proteinMin: 35,
      proteinMax: 45,
      carbsMin: 15,
      carbsMax: 25,
      fatMin: 15,
      fatMax: 25,
    },
  },
  {
    id: "meal_suggestion_dinner_5",
    name: "Jantar Vegetariano",
    description: "Opção balanceada à base de plantas",
    foods: ["sugg_tofu", "sugg_quinoa", "sugg_legumes", "sugg_azeite"],
    mealType: "dinner",
    macrosTarget: {
      caloriesMin: 350,
      caloriesMax: 450,
      proteinMin: 20,
      proteinMax: 30,
      carbsMin: 35,
      carbsMax: 50,
      fatMin: 15,
      fatMax: 25,
    },
  },

  // === LANCHES ===
  {
    id: "meal_suggestion_snack_1",
    name: "Lanche Pré-Treino",
    description: "Boa fonte de energia para antes do treino",
    foods: ["sugg_banana", "sugg_whey"],
    mealType: "snack",
    macrosTarget: {
      caloriesMin: 200,
      caloriesMax: 300,
      proteinMin: 20,
      proteinMax: 30,
      carbsMin: 20,
      carbsMax: 35,
      fatMin: 2,
      fatMax: 8,
    },
  },
  {
    id: "meal_suggestion_snack_2",
    name: "Lanche Pós-Treino",
    description: "Combinação de proteínas e carboidratos para recuperação",
    foods: ["sugg_whey", "sugg_aveia", "sugg_banana"],
    mealType: "snack",
    macrosTarget: {
      caloriesMin: 250,
      caloriesMax: 350,
      proteinMin: 25,
      proteinMax: 35,
      carbsMin: 25,
      carbsMax: 40,
      fatMin: 3,
      fatMax: 10,
    },
  },
  {
    id: "meal_suggestion_snack_3",
    name: "Lanche Saudável",
    description: "Opção nutritiva para lanche da tarde",
    foods: ["sugg_iogurte_natural", "sugg_granola", "sugg_maca"],
    mealType: "snack",
    macrosTarget: {
      caloriesMin: 200,
      caloriesMax: 300,
      proteinMin: 10,
      proteinMax: 20,
      carbsMin: 30,
      carbsMax: 40,
      fatMin: 5,
      fatMax: 12,
    },
  },
  {
    id: "meal_suggestion_snack_4",
    name: "Lanche Low Carb",
    description: "Opção com baixo teor de carboidratos",
    foods: ["sugg_queijo_minas", "sugg_ovo", "sugg_tomate"],
    mealType: "snack",
    macrosTarget: {
      caloriesMin: 200,
      caloriesMax: 300,
      proteinMin: 15,
      proteinMax: 25,
      carbsMin: 5,
      carbsMax: 15,
      fatMin: 10,
      fatMax: 20,
    },
  },
  {
    id: "meal_suggestion_snack_5",
    name: "Lanche Rico em Fibras",
    description: "Opção rica em fibras para melhorar a digestão",
    foods: ["sugg_pera", "sugg_chia", "sugg_iogurte_natural"],
    mealType: "snack",
    macrosTarget: {
      caloriesMin: 180,
      caloriesMax: 280,
      proteinMin: 8,
      proteinMax: 15,
      carbsMin: 25,
      carbsMax: 35,
      fatMin: 5,
      fatMax: 15,
    },
  },
  {
    id: "meal_suggestion_snack_6",
    name: "Lanche de Frutas Vermelhas",
    description: "Rico em antioxidantes e nutrientes",
    foods: ["sugg_iogurte_grego", "sugg_morango", "sugg_mirtilo", "sugg_aveia"],
    mealType: "snack",
    macrosTarget: {
      caloriesMin: 220,
      caloriesMax: 320,
      proteinMin: 15,
      proteinMax: 25,
      carbsMin: 25,
      carbsMax: 35,
      fatMin: 5,
      fatMax: 15,
    },
  },
  {
    id: "meal_suggestion_snack_7",
    name: "Lanche Proteico",
    description: "Ideal para recuperação muscular",
    foods: ["sugg_whey", "sugg_banana", "sugg_pasta_amendoim"],
    mealType: "snack",
    macrosTarget: {
      caloriesMin: 250,
      caloriesMax: 350,
      proteinMin: 25,
      proteinMax: 35,
      carbsMin: 20,
      carbsMax: 30,
      fatMin: 8,
      fatMax: 15,
    },
  },
  {
    id: "meal_suggestion_morning_snack_1",
    name: "Lanche da Manhã Proteico",
    description: "Combinação ideal de proteínas e energia para a manhã",
    foods: ["sugg_leite", "sugg_whey", "sugg_banana"],
    mealType: "morning_snack",
    macrosTarget: {
      caloriesMin: 180,
      caloriesMax: 280,
      proteinMin: 20,
      proteinMax: 30,
      carbsMin: 20,
      carbsMax: 30,
      fatMin: 2,
      fatMax: 8,
    },
  },
  {
    id: "meal_suggestion_morning_snack_2",
    name: "Lanche da Manhã Completo",
    description:
      "Equilíbrio perfeito entre proteínas, carboidratos e gorduras boas",
    foods: [
      "sugg_iogurte_natural",
      "sugg_aveia",
      "sugg_pasta_amendoim",
      "sugg_banana",
    ],
    mealType: "morning_snack",
    macrosTarget: {
      caloriesMin: 200,
      caloriesMax: 300,
      proteinMin: 12,
      proteinMax: 20,
      carbsMin: 25,
      carbsMax: 35,
      fatMin: 8,
      fatMax: 15,
    },
  },
  {
    id: "meal_suggestion_morning_snack_3",
    name: "Lanche da Manhã Energético",
    description: "Boost de energia para manter o foco até o almoço",
    foods: ["sugg_whey", "sugg_pasta_amendoim", "sugg_banana"],
    mealType: "morning_snack",
    macrosTarget: {
      caloriesMin: 220,
      caloriesMax: 320,
      proteinMin: 20,
      proteinMax: 30,
      carbsMin: 20,
      carbsMax: 30,
      fatMin: 8,
      fatMax: 15,
    },
  },
  {
    id: "meal_suggestion_morning_snack_4",
    name: "Lanche da Manhã Desnatado",
    description: "Opção com iogurte desnatado para menor ingestão de gorduras",
    foods: ["sugg_iogurte_desnatado", "sugg_whey", "sugg_banana"],
    mealType: "morning_snack",
    macrosTarget: {
      caloriesMin: 160,
      caloriesMax: 260,
      proteinMin: 20,
      proteinMax: 30,
      carbsMin: 20,
      carbsMax: 30,
      fatMin: 0,
      fatMax: 4,
    },
  },
  {
    id: "meal_suggestion_afternoon_snack_1",
    name: "Lanche da Tarde Alto Proteico",
    description: "Ideal para recuperação muscular após o treino",
    foods: ["sugg_whey", "sugg_banana", "sugg_pasta_amendoim"],
    mealType: "afternoon_snack",
    macrosTarget: {
      caloriesMin: 200,
      caloriesMax: 300,
      proteinMin: 20,
      proteinMax: 30,
      carbsMin: 20,
      carbsMax: 30,
      fatMin: 8,
      fatMax: 15,
    },
  },
  {
    id: "meal_suggestion_afternoon_snack_2",
    name: "Lanche da Tarde Equilibrado",
    description:
      "Composição balanceada para evitar picos de fome antes do jantar",
    foods: ["sugg_iogurte_natural", "sugg_pasta_amendoim", "sugg_banana"],
    mealType: "afternoon_snack",
    macrosTarget: {
      caloriesMin: 190,
      caloriesMax: 290,
      proteinMin: 10,
      proteinMax: 20,
      carbsMin: 20,
      carbsMax: 30,
      fatMin: 8,
      fatMax: 15,
    },
  },
  {
    id: "meal_suggestion_afternoon_snack_3",
    name: "Lanche da Tarde Completo",
    description: "Combinação de proteínas e gorduras boas",
    foods: ["sugg_leite", "sugg_pasta_amendoim"],
    mealType: "afternoon_snack",
    macrosTarget: {
      caloriesMin: 180,
      caloriesMax: 280,
      proteinMin: 10,
      proteinMax: 20,
      carbsMin: 15,
      carbsMax: 25,
      fatMin: 8,
      fatMax: 15,
    },
  },
  {
    id: "meal_suggestion_afternoon_snack_4",
    name: "Lanche da Tarde Balanceado",
    description:
      "Combinação de proteínas e gorduras saudáveis para um lanche completo",
    foods: ["sugg_iogurte_desnatado", "sugg_banana", "sugg_pasta_amendoim"],
    mealType: "afternoon_snack",
    macrosTarget: {
      caloriesMin: 200,
      caloriesMax: 300,
      proteinMin: 15,
      proteinMax: 25,
      carbsMin: 25,
      carbsMax: 35,
      fatMin: 8,
      fatMax: 15,
    },
  },
  {
    id: "meal_suggestion_supper_1",
    name: "Ceia Leve",
    description: "Opção leve antes de dormir",
    foods: ["sugg_iogurte_natural", "sugg_banana", "sugg_castanha_do_para"],
    mealType: "supper",
    macrosTarget: {
      caloriesMin: 150,
      caloriesMax: 250,
      proteinMin: 8,
      proteinMax: 15,
      carbsMin: 15,
      carbsMax: 25,
      fatMin: 5,
      fatMax: 10,
    },
  },
  {
    id: "meal_suggestion_supper_2",
    name: "Ceia Relaxante",
    description: "Ajuda a melhorar a qualidade do sono",
    foods: ["sugg_leite", "sugg_banana", "sugg_aveia"],
    mealType: "supper",
    macrosTarget: {
      caloriesMin: 150,
      caloriesMax: 250,
      proteinMin: 8,
      proteinMax: 15,
      carbsMin: 20,
      carbsMax: 30,
      fatMin: 3,
      fatMax: 8,
    },
  },
  {
    id: "meal_suggestion_supper_3",
    name: "Ceia Proteica",
    description: "Para recuperação muscular durante o sono",
    foods: ["sugg_queijo_cottage", "sugg_aveia", "sugg_castanha_do_para"],
    mealType: "supper",
    macrosTarget: {
      caloriesMin: 180,
      caloriesMax: 280,
      proteinMin: 15,
      proteinMax: 25,
      carbsMin: 15,
      carbsMax: 25,
      fatMin: 5,
      fatMax: 12,
    },
  },
];

// Função para obter sugestões de alimentos por tipo de refeição
export function getFoodSuggestionsByMealType(
  mealType: string,
  dietType?: "classic" | "pescatarian" | "vegetarian" | "vegan"
): FoodSuggestion[] {
  // Primeiro obtém todos os alimentos para este tipo de refeição
  const allFoods = foodSuggestionDatabase.filter((food) =>
    food.mealTypes.includes(mealType)
  );

  // Se não foi especificado tipo de dieta, retorna todos os alimentos
  if (!dietType || dietType === "classic") {
    return allFoods;
  }

  // Filtra por tipo de dieta
  return filterFoodsByDietType(allFoods, dietType);
}

// Nova função para filtrar alimentos por tipo de dieta
export function filterFoodsByDietType(
  foods: FoodSuggestion[],
  dietType: "classic" | "pescatarian" | "vegetarian" | "vegan"
): FoodSuggestion[] {
  // Se dieta for a clássica, retorna todos os alimentos
  if (dietType === "classic") {
    return foods;
  }

  return foods.filter((food) => {
    const id = food.id.toLowerCase();

    // Para dieta vegana, excluir todos os produtos de origem animal
    if (dietType === "vegan") {
      // Excluir carnes, peixes, ovos, laticínios
      if (
        id.includes("frango") ||
        id.includes("carne") ||
        id.includes("peixe") ||
        id.includes("tilapia") ||
        id.includes("salmao") ||
        id.includes("bacalhau") ||
        id.includes("atum") ||
        id.includes("sardinha") ||
        id.includes("ovo") ||
        id.includes("leite") ||
        id.includes("queijo") ||
        id.includes("requeijao") ||
        id.includes("whey") ||
        id.includes("patinho") ||
        id.includes("alcatra") ||
        id.includes("file_mignon") ||
        id.includes("coxa_frango") ||
        id.includes("peito_peru") ||
        id.includes("iogurte") ||
        id.includes("albumina")
      ) {
        return false;
      }
      return true;
    }

    // Para dieta vegetariana, excluir carnes e peixes, mas permitir laticínios e ovos
    if (dietType === "vegetarian") {
      if (
        id.includes("frango") ||
        id.includes("carne") ||
        id.includes("peixe") ||
        id.includes("tilapia") ||
        id.includes("salmao") ||
        id.includes("bacalhau") ||
        id.includes("atum") ||
        id.includes("sardinha") ||
        id.includes("patinho") ||
        id.includes("alcatra") ||
        id.includes("file_mignon") ||
        id.includes("coxa_frango") ||
        id.includes("peito_peru")
      ) {
        return false;
      }
      return true;
    }

    // Para dieta pescetariana, excluir carnes, mas permitir peixes, laticínios e ovos
    if (dietType === "pescatarian") {
      if (
        id.includes("frango") ||
        id.includes("carne") ||
        id.includes("patinho") ||
        id.includes("alcatra") ||
        id.includes("file_mignon") ||
        id.includes("coxa_frango") ||
        id.includes("peito_peru")
      ) {
        return false;
      }
      return true;
    }

    // Padrão: retornar o alimento
    return true;
  });
}

// Função para obter sugestões de refeições por tipo
export function getMealSuggestionsByType(
  mealType: string,
  dietType?: "classic" | "pescatarian" | "vegetarian" | "vegan"
): MealSuggestion[] {
  const suggestions = mealSuggestionDatabase.filter(
    (meal) => meal.mealType === mealType
  );

  // Se não há filtro de dieta, retornar todas as sugestões
  if (!dietType || dietType === "classic") {
    return suggestions;
  }

  // Para filtrar sugestões de refeições com base no tipo de dieta,
  // precisamos verificar se os alimentos na sugestão são compatíveis com a dieta
  return suggestions.filter((suggestion) => {
    // Para cada sugestão, verificar se todos os alimentos são compatíveis com a dieta
    const foodIds = suggestion.foods;
    const allFoodsSuggestions = foodIds
      .map((id) => foodSuggestionDatabase.find((food) => food.id === id))
      .filter(Boolean) as FoodSuggestion[];

    // Filtrar esses alimentos pelo tipo de dieta
    const compatibleFoods = filterFoodsByDietType(
      allFoodsSuggestions,
      dietType
    );

    // Se o número de alimentos compatíveis for menor que o original,
    // significa que alguns alimentos não são compatíveis com a dieta
    return compatibleFoods.length === allFoodsSuggestions.length;
  });
}

// Função para obter alternativas para um alimento específico
export function getFoodAlternatives(
  foodId: string,
  dietType?: "classic" | "pescatarian" | "vegetarian" | "vegan"
): FoodSuggestion[] {
  const food = foodSuggestionDatabase.find((item) => item.id === foodId);

  if (!food || !food.alternatives || food.alternatives.length === 0) {
    return [];
  }

  // Primeiro obter alternativas padrão
  let alternativeIds = [...food.alternatives];

  // Se tivermos um tipo de dieta específico, adicionar sugestões específicas para dieta
  if (dietType && dietType !== "classic") {
    // Obter substituições específicas para este tipo de alimento baseado na dieta
    const specificAlternatives = suggestDietSpecificAlternatives(
      dietType as "pescatarian" | "vegetarian" | "vegan",
      foodId
    );

    // Adicionar à lista de alternativas, garantindo que não existem duplicidades
    specificAlternatives.forEach((altId) => {
      if (!alternativeIds.includes(altId)) {
        alternativeIds.push(altId);
      }
    });
  }

  // Buscar os objetos de alimentos alternativos
  let alternatives = alternativeIds
    .map((altId) => foodSuggestionDatabase.find((item) => item.id === altId))
    .filter(Boolean) as FoodSuggestion[];

  // Se temos um tipo de dieta específico, filtrar as alternativas
  if (dietType && dietType !== "classic") {
    alternatives = filterFoodsByDietType(alternatives, dietType);
  }

  return alternatives;
}

// Função para ajustar porções com base nas necessidades nutricionais
export function adjustPortionsForNutrientNeeds(
  foods: FoodSuggestion[],
  targetCalories: number,
  targetProtein: number,
  targetCarbs: number,
  targetFat: number,
  dietType?: "classic" | "pescatarian" | "vegetarian" | "vegan",
  existingFoods: { id: string; name?: string; portion: number }[] = [] // Adicionando name opcional
): { food: FoodSuggestion; recommendedPortion: number }[] {
  if (foods.length === 0) return [];

  // Se temos um tipo de dieta especificado, filtrar os alimentos primeiro
  if (dietType && dietType !== "classic") {
    foods = filterFoodsByDietType(foods, dietType);

    // Se não sobrou nenhum alimento depois do filtro, retornar array vazio
    if (foods.length === 0) return [];
  }

  // Definir limites razoáveis para cada tipo de alimento
  const getReasonableLimits = (
    food: FoodSuggestion
  ): { min: number; max: number } => {
    // Detectar o tipo de alimento pela ID ou conteúdo nutricional
    const id = food.id.toLowerCase();
    const foodName = food.name.toLowerCase();

    // Verificar se já existe algum alimento similar nas escolhas do usuário (quando existingFoods for fornecido)
    if (existingFoods.length > 0) {
      let similarExists = false;

      for (const existingFood of existingFoods) {
        const existingId = existingFood.id.toLowerCase();
        // Utilizando name ou "" se não existir para compatibilidade
        const existingName = existingFood.name
          ? existingFood.name.toLowerCase()
          : "";

        // Verificar correspondência por nome
        if (
          // Proteínas
          ((foodName.includes("frango") ||
            foodName.includes("carne") ||
            foodName.includes("file") ||
            foodName.includes("patinho") ||
            foodName.includes("bovina")) &&
            (existingName.includes("frango") ||
              existingName.includes("carne") ||
              existingName.includes("file") ||
              existingName.includes("patinho") ||
              existingName.includes("bovina"))) ||
          // Ovos
          (foodName.includes("ovo") && existingName.includes("ovo")) ||
          // Laticínios
          ((foodName.includes("iogurte") ||
            foodName.includes("queijo") ||
            foodName.includes("requeijao")) &&
            (existingName.includes("iogurte") ||
              existingName.includes("queijo") ||
              existingName.includes("requeijao"))) ||
          // Carboidratos
          ((foodName.includes("pao") ||
            foodName.includes("arroz") ||
            foodName.includes("macarrao")) &&
            (existingName.includes("pao") ||
              existingName.includes("arroz") ||
              existingName.includes("macarrao"))) ||
          // Frutas
          ((foodName.includes("banana") ||
            foodName.includes("maca") ||
            foodName.includes("mamao") ||
            foodName.includes("melao") ||
            foodName.includes("manga") ||
            foodName.includes("abacaxi")) &&
            (existingName.includes("banana") ||
              existingName.includes("maca") ||
              existingName.includes("mamao") ||
              existingName.includes("melao") ||
              existingName.includes("manga") ||
              existingName.includes("abacaxi")))
        ) {
          similarExists = true;
          break;
        }

        // Verificar por ID também
        if (
          (id.includes("frango") ||
            id.includes("patinho") ||
            id.includes("file") ||
            id.includes("carne")) &&
          (existingId.includes("frango") ||
            existingId.includes("patinho") ||
            existingId.includes("file") ||
            existingId.includes("carne"))
        ) {
          similarExists = true;
          break;
        }

        if (id.includes("ovo") && existingId.includes("ovo")) {
          similarExists = true;
          break;
        }

        if (
          (id.includes("iogurte") ||
            id.includes("queijo") ||
            id.includes("requeijao")) &&
          (existingId.includes("iogurte") ||
            existingId.includes("queijo") ||
            existingId.includes("requeijao"))
        ) {
          similarExists = true;
          break;
        }

        if (
          (id.includes("pao") ||
            id.includes("arroz") ||
            id.includes("macarrao")) &&
          (existingId.includes("pao") ||
            existingId.includes("arroz") ||
            existingId.includes("macarrao"))
        ) {
          similarExists = true;
          break;
        }

        if (
          (id.includes("banana") ||
            id.includes("maca") ||
            id.includes("mamao") ||
            id.includes("melao") ||
            id.includes("manga") ||
            id.includes("abacaxi")) &&
          (existingId.includes("banana") ||
            existingId.includes("maca") ||
            existingId.includes("mamao") ||
            existingId.includes("melao") ||
            existingId.includes("manga") ||
            existingId.includes("abacaxi"))
        ) {
          similarExists = true;
          break;
        }

        // Verificar exatamente o mesmo alimento pelo ID
        if (food.id === existingFood.id) {
          similarExists = true;
          break;
        }
      }

      // Se já existe um alimento similar, permitir porção zero
      if (similarExists) {
        return { min: 0, max: 300 }; // Permitir zero, mas manter um máximo razoável
      }
    }

    // Continuar com as verificações normais de limites de alimentos
    // Pães - entre meia unidade e 5 unidades
    if (id.includes("pao")) {
      const basePortion =
        food.measures.find(
          (m) => m.label.includes("unidade") || m.label.includes("fatia")
        )?.weight || 50;
      return { min: basePortion * 0.5, max: basePortion * 5 };
    }

    // Ovos - entre meio e 5 ovos
    else if (id.includes("ovo")) {
      const basePortion =
        food.measures.find((m) => m.label.includes("unidade"))?.weight || 50;
      return { min: basePortion * 0.5, max: basePortion * 5 };
    }

    // Iogurte desnatado - entre 100g e 180g (porção mais razoável)
    else if (id.includes("iogurte_desnatado")) {
      return { min: 100, max: 180 };
    }

    // Iogurte em geral - entre 100g e 200g
    else if (id.includes("iogurte")) {
      return { min: 100, max: 200 };
    }

    // Whey Protein - entre 15g e 30g (1 scoop)
    else if (id.includes("whey")) {
      return { min: 15, max: 30 };
    }

    // Requeijão, cream cheese - entre 10g e 40g
    else if (id.includes("requeijao") || id.includes("cream_cheese")) {
      return { min: 10, max: 40 };
    }

    // Pasta de amendoim - entre 10g e 30g (reduzido para porções mais razoáveis)
    else if (id.includes("pasta_amendoim")) {
      return { min: 10, max: 30 };
    }

    // Banana - entre 50g e 120g (limitando para evitar excesso de porção)
    else if (id.includes("banana")) {
      const basePortion =
        food.measures.find((m) => m.label.includes("unidade"))?.weight || 100;
      return { min: basePortion * 0.5, max: basePortion * 1.2 };
    }

    // Frutas - entre 50g e 300g
    else if (
      id.includes("maca") ||
      id.includes("mamao") ||
      id.includes("melao") ||
      id.includes("manga") ||
      id.includes("abacaxi")
    ) {
      return { min: 50, max: 300 };
    }

    // Óleos e manteigas - entre 5g e 15g
    else if (
      id.includes("azeite") ||
      id.includes("oleo") ||
      id.includes("manteiga")
    ) {
      return { min: 5, max: 15 };
    }

    // Arroz, massas - entre 50g e 400g
    else if (id.includes("arroz") || id.includes("macarrao")) {
      return { min: 50, max: 400 };
    }

    // Feijão - entre 50g e 150g
    else if (id.includes("feijao")) {
      return { min: 50, max: 150 };
    }

    // Proteínas (carnes, frango) - entre 80g e 300g
    else if (
      id.includes("frango") ||
      id.includes("patinho") ||
      id.includes("file") ||
      id.includes("carne")
    ) {
      return { min: 80, max: 300 };
    }

    // Valores padrão para outros alimentos
    return { min: 20, max: 150 };
  };

  // Calcular nutrientes para uma determinada porção
  const calculateNutrients = (food: FoodSuggestion, portion: number) => {
    const ratio = portion / 100;
    return {
      calories: Math.round(food.nutrients.calories * ratio),
      protein: Math.round(food.nutrients.protein * ratio * 10) / 10,
      carbs: Math.round(food.nutrients.carbs * ratio * 10) / 10,
      fat: Math.round(food.nutrients.fat * ratio * 10) / 10,
    };
  };

  // Caracterizar cada alimento por seu perfil nutricional dominante
  const categorizeFoods = (foods: FoodSuggestion[]) => {
    return foods.map((food) => {
      const baseNutrients = food.nutrients;
      const totalMacros =
        baseNutrients.protein + baseNutrients.carbs + baseNutrients.fat;

      // Calcular a contribuição percentual de cada macronutriente
      const proteinPct =
        totalMacros > 0 ? baseNutrients.protein / totalMacros : 0;
      const carbsPct = totalMacros > 0 ? baseNutrients.carbs / totalMacros : 0;
      const fatPct = totalMacros > 0 ? baseNutrients.fat / totalMacros : 0;

      // Determinar o tipo dominante
      let dominantType = "balanced";
      if (proteinPct > 0.5) dominantType = "protein";
      else if (carbsPct > 0.5) dominantType = "carbs";
      else if (fatPct > 0.5) dominantType = "fat";

      const limits = getReasonableLimits(food);

      return {
        food,
        dominantType,
        proteinPct,
        carbsPct,
        fatPct,
        caloriesPerGram: baseNutrients.calories / 100,
        limits,
      };
    });
  };

  // Distribuição inicial proporcional dos macros
  const initialDistribution = () => {
    const categorizedFoods = categorizeFoods(foods);

    // Definir porções iniciais baseadas em valores mais equilibrados para alimentos específicos
    const result = categorizedFoods.map((foodInfo) => {
      const id = foodInfo.food.id.toLowerCase();
      const foodName = foodInfo.food.name.toLowerCase();

      // Verificar se já existe algum alimento similar nas escolhas do usuário (quando existingFoods for fornecido)
      if (existingFoods.length > 0) {
        let similarExists = false;

        for (const existingFood of existingFoods) {
          const existingId = existingFood.id.toLowerCase();
          // Utilizando name ou "" se não existir para compatibilidade
          const existingName = existingFood.name
            ? existingFood.name.toLowerCase()
            : "";

          // Verificar correspondência por nome
          if (
            // Proteínas
            ((foodName.includes("frango") ||
              foodName.includes("carne") ||
              foodName.includes("file") ||
              foodName.includes("patinho") ||
              foodName.includes("bovina")) &&
              (existingName.includes("frango") ||
                existingName.includes("carne") ||
                existingName.includes("file") ||
                existingName.includes("patinho") ||
                existingName.includes("bovina"))) ||
            // Ovos
            (foodName.includes("ovo") && existingName.includes("ovo")) ||
            // Laticínios
            ((foodName.includes("iogurte") ||
              foodName.includes("queijo") ||
              foodName.includes("requeijao")) &&
              (existingName.includes("iogurte") ||
                existingName.includes("queijo") ||
                existingName.includes("requeijao"))) ||
            // Carboidratos
            ((foodName.includes("pao") ||
              foodName.includes("arroz") ||
              foodName.includes("macarrao")) &&
              (existingName.includes("pao") ||
                existingName.includes("arroz") ||
                existingName.includes("macarrao"))) ||
            // Frutas
            ((foodName.includes("banana") ||
              foodName.includes("maca") ||
              foodName.includes("mamao") ||
              foodName.includes("melao") ||
              foodName.includes("manga") ||
              foodName.includes("abacaxi")) &&
              (existingName.includes("banana") ||
                existingName.includes("maca") ||
                existingName.includes("mamao") ||
                existingName.includes("melao") ||
                existingName.includes("manga") ||
                existingName.includes("abacaxi")))
          ) {
            similarExists = true;
            break;
          }

          // Verificar por ID também
          if (
            (id.includes("frango") ||
              id.includes("patinho") ||
              id.includes("file") ||
              id.includes("carne")) &&
            (existingId.includes("frango") ||
              existingId.includes("patinho") ||
              existingId.includes("file") ||
              existingId.includes("carne"))
          ) {
            similarExists = true;
            break;
          }

          if (id.includes("ovo") && existingId.includes("ovo")) {
            similarExists = true;
            break;
          }

          if (
            (id.includes("iogurte") ||
              id.includes("queijo") ||
              id.includes("requeijao")) &&
            (existingId.includes("iogurte") ||
              existingId.includes("queijo") ||
              existingId.includes("requeijao"))
          ) {
            similarExists = true;
            break;
          }

          if (
            (id.includes("pao") ||
              id.includes("arroz") ||
              id.includes("macarrao")) &&
            (existingId.includes("pao") ||
              existingId.includes("arroz") ||
              existingId.includes("macarrao"))
          ) {
            similarExists = true;
            break;
          }

          if (
            (id.includes("banana") ||
              id.includes("maca") ||
              id.includes("mamao") ||
              id.includes("melao") ||
              id.includes("manga") ||
              id.includes("abacaxi")) &&
            (existingId.includes("banana") ||
              existingId.includes("maca") ||
              existingId.includes("mamao") ||
              existingId.includes("melao") ||
              existingId.includes("manga") ||
              existingId.includes("abacaxi"))
          ) {
            similarExists = true;
            break;
          }

          // Verificar exatamente o mesmo alimento pelo ID
          if (foodInfo.food.id === existingFood.id) {
            similarExists = true;
            break;
          }
        }

        // Se já existe um alimento similar, começar com porção zero
        if (similarExists) {
          return {
            ...foodInfo,
            portion: 0,
          };
        }
      }

      let initialPortion = (foodInfo.limits.min + foodInfo.limits.max) / 2;

      // Ajustes específicos para certos alimentos
      if (id.includes("whey")) {
        initialPortion = 20;
      } else if (id.includes("pasta_amendoim")) {
        initialPortion = 15;
      } else if (id.includes("banana")) {
        initialPortion = 100;
      } else if (id.includes("iogurte_desnatado")) {
        initialPortion = 150;
      }

      return {
        ...foodInfo,
        portion: initialPortion,
      };
    });

    return result;
  };

  // Calcular a diferença entre nutrientes atuais e alvo
  const calculateNutrientDelta = (foodsWithPortions: any[]) => {
    const currentNutrients = foodsWithPortions.reduce(
      (total, item) => {
        const nutrients = calculateNutrients(item.food, item.portion);
        return {
          calories: total.calories + nutrients.calories,
          protein: total.protein + nutrients.protein,
          carbs: total.carbs + nutrients.carbs,
          fat: total.fat + nutrients.fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      calories: targetCalories - currentNutrients.calories,
      protein: targetProtein - currentNutrients.protein,
      carbs: targetCarbs - currentNutrients.carbs,
      fat: targetFat - currentNutrients.fat,
      total:
        Math.abs(targetCalories - currentNutrients.calories) +
        Math.abs(targetProtein - currentNutrients.protein) * 4 +
        Math.abs(targetCarbs - currentNutrients.carbs) * 4 +
        Math.abs(targetFat - currentNutrients.fat) * 9,
    };
  };

  // Algoritmo de otimização
  let currentDistribution = initialDistribution();
  let bestDistribution = [...currentDistribution];
  let bestDelta = calculateNutrientDelta(currentDistribution);
  let iterations = 0;
  const maxIterations = 200;

  while (iterations < maxIterations && bestDelta.total > 5) {
    iterations++;

    // Para cada alimento, tentamos ajustar a porção para melhorar o resultado
    for (let i = 0; i < currentDistribution.length; i++) {
      const current = { ...currentDistribution[i] };
      const delta = calculateNutrientDelta(currentDistribution);

      // Ajustar com base no que está faltando ou sobrando
      let adjustmentNeeded = 0;

      // Damos mais peso ao nutriente dominante deste alimento
      if (current.dominantType === "protein" && delta.protein !== 0) {
        adjustmentNeeded = delta.protein * 10;
      } else if (current.dominantType === "carbs" && delta.carbs !== 0) {
        adjustmentNeeded = delta.carbs * 5;
      } else if (current.dominantType === "fat" && delta.fat !== 0) {
        adjustmentNeeded = delta.fat * 15;
      } else {
        // Para alimentos balanceados, ajustamos com base nas calorias
        adjustmentNeeded = delta.calories / 4;
      }

      // Converter o ajuste necessário em gramas
      let gramsAdjustment = 0;
      if (current.dominantType === "protein") {
        gramsAdjustment =
          adjustmentNeeded / (current.food.nutrients.protein / 100);
      } else if (current.dominantType === "carbs") {
        gramsAdjustment =
          adjustmentNeeded / (current.food.nutrients.carbs / 100);
      } else if (current.dominantType === "fat") {
        gramsAdjustment = adjustmentNeeded / (current.food.nutrients.fat / 100);
      } else {
        gramsAdjustment = adjustmentNeeded / current.caloriesPerGram;
      }

      // Limitar o ajuste para evitar mudanças muito bruscas
      gramsAdjustment = Math.max(-20, Math.min(20, gramsAdjustment));

      // Aplicar o ajuste
      let newPortion = current.portion + gramsAdjustment;

      // Garantir que a porção esteja dentro dos limites razoáveis
      newPortion = Math.max(
        current.limits.min,
        Math.min(current.limits.max, newPortion)
      );

      // Arredondar para facilitar o uso
      if (newPortion < 10) {
        newPortion = Math.round(newPortion * 2) / 2; // Arredondar para 0.5g
      } else if (newPortion < 50) {
        newPortion = Math.round(newPortion); // Arredondar para 1g
      } else {
        newPortion = Math.round(newPortion / 5) * 5; // Arredondar para 5g
      }

      // Caso especial para ovos - arredondar para unidades inteiras
      if (
        current.food.id.includes("ovo") &&
        !current.food.id.includes("clara")
      ) {
        // Encontrar o peso da unidade de ovo (geralmente 50g)
        const unidadeOvo =
          current.food.measures.find((m) => m.label.includes("unidade"))
            ?.weight || 50;
        // Calcular quantidade em unidades e arredondar para inteiro
        const unidades = Math.round(newPortion / unidadeOvo);
        // Recalcular o peso em gramas
        newPortion = unidades * unidadeOvo;
      }

      // Aplicar nova porção
      const testDistribution = [...currentDistribution];
      testDistribution[i] = { ...current, portion: newPortion };

      // Verificar se o ajuste melhorou
      const newDelta = calculateNutrientDelta(testDistribution);

      // Se melhorou, atualizar a distribuição
      if (newDelta.total < bestDelta.total) {
        bestDelta = newDelta;
        bestDistribution = [...testDistribution];
        currentDistribution = [...testDistribution];

        // Se chegamos bem perto do alvo, podemos parar
        if (bestDelta.total < 5) break;
      }
    }
  }

  // Formatar resultado final
  return bestDistribution.map((item) => ({
    food: item.food,
    recommendedPortion: Math.round(item.portion),
  }));
}

// Função para ajustar porções considerando alimentos já existentes
export function adjustPortionsWithExistingFoods(
  foods: FoodSuggestion[],
  existingFoods: {
    id: string;
    name?: string; // Adicionando name como opcional para compatibilidade
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    portion: number;
  }[],
  targetCalories: number,
  targetProtein: number,
  targetCarbs: number,
  targetFat: number,
  dietType?: "classic" | "pescatarian" | "vegetarian" | "vegan"
): { food: FoodSuggestion; recommendedPortion: number }[] {
  if (foods.length === 0) return [];

  // Se temos um tipo de dieta especificado, filtrar os alimentos primeiro
  if (dietType && dietType !== "classic") {
    foods = filterFoodsByDietType(foods, dietType);

    // Se não sobrou nenhum alimento depois do filtro, retornar array vazio
    if (foods.length === 0) return [];
  }

  // Calcular nutrientes já consumidos dos alimentos existentes
  const existingNutrients = existingFoods.reduce(
    (total, food) => {
      return {
        calories: total.calories + food.calories,
        protein: total.protein + food.protein,
        carbs: total.carbs + food.carbs,
        fat: total.fat + food.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Calcular nutrientes restantes a serem adicionados
  const remainingCalories = Math.max(
    0,
    targetCalories - existingNutrients.calories
  );
  const remainingProtein = Math.max(
    0,
    targetProtein - existingNutrients.protein
  );
  const remainingCarbs = Math.max(0, targetCarbs - existingNutrients.carbs);
  const remainingFat = Math.max(0, targetFat - existingNutrients.fat);

  // Se todos os nutrientes já foram preenchidos, retornar porções mínimas
  if (
    remainingCalories <= 0 &&
    remainingProtein <= 0 &&
    remainingCarbs <= 0 &&
    remainingFat <= 0
  ) {
    return foods.map((food) => {
      const limits = getReasonableLimits(food);
      return {
        food,
        recommendedPortion: Math.round(limits.min),
      };
    });
  }

  // Definir limites razoáveis para cada tipo de alimento
  const getReasonableLimits = (
    food: FoodSuggestion
  ): { min: number; max: number } => {
    // Detectar o tipo de alimento pela ID ou conteúdo nutricional
    const id = food.id.toLowerCase();

    // Verificar se já existe algum alimento similar nas escolhas do usuário
    const hasSimilarFood = existingFoods.some((existingFood) => {
      const existingId = existingFood.id.toLowerCase();

      // Verificar por categoria similar (proteínas)
      if (
        (id.includes("frango") ||
          id.includes("patinho") ||
          id.includes("file") ||
          id.includes("carne")) &&
        (existingId.includes("frango") ||
          existingId.includes("patinho") ||
          existingId.includes("file") ||
          existingId.includes("carne"))
      ) {
        return true;
      }

      // Verificar por categoria similar (ovos)
      if (id.includes("ovo") && existingId.includes("ovo")) {
        return true;
      }

      // Verificar por categoria similar (laticínios)
      if (
        (id.includes("iogurte") ||
          id.includes("queijo") ||
          id.includes("requeijao")) &&
        (existingId.includes("iogurte") ||
          existingId.includes("queijo") ||
          existingId.includes("requeijao"))
      ) {
        return true;
      }

      // Verificar por categoria similar (carboidratos)
      if (
        (id.includes("pao") ||
          id.includes("arroz") ||
          id.includes("macarrao")) &&
        (existingId.includes("pao") ||
          existingId.includes("arroz") ||
          existingId.includes("macarrao"))
      ) {
        return true;
      }

      // Verificar por categoria similar (frutas)
      if (
        (id.includes("banana") ||
          id.includes("maca") ||
          id.includes("mamao") ||
          id.includes("melao") ||
          id.includes("manga") ||
          id.includes("abacaxi")) &&
        (existingId.includes("banana") ||
          existingId.includes("maca") ||
          existingId.includes("mamao") ||
          existingId.includes("melao") ||
          existingId.includes("manga") ||
          existingId.includes("abacaxi"))
      ) {
        return true;
      }

      // Verificar exatamente o mesmo alimento
      return food.id === existingFood.id;
    });

    // Se já existe um alimento similar, permitir porção zero
    if (hasSimilarFood) {
      return { min: 0, max: 300 }; // Permitir zero, mas manter um máximo razoável
    }

    // Pães - entre meia unidade e 5 unidades
    if (id.includes("pao")) {
      const basePortion =
        food.measures.find(
          (m) => m.label.includes("unidade") || m.label.includes("fatia")
        )?.weight || 50;
      return { min: basePortion * 0.5, max: basePortion * 5 };
    }

    // Ovos - entre meio e 5 ovos
    else if (id.includes("ovo")) {
      const basePortion =
        food.measures.find((m) => m.label.includes("unidade"))?.weight || 50;
      return { min: basePortion * 0.5, max: basePortion * 5 };
    }

    // Iogurte desnatado - entre 100g e 180g (porção mais razoável)
    else if (id.includes("iogurte_desnatado")) {
      return { min: 100, max: 180 };
    }

    // Iogurte em geral - entre 100g e 200g
    else if (id.includes("iogurte")) {
      return { min: 100, max: 200 };
    }

    // Whey Protein - entre 15g e 30g (1 scoop)
    else if (id.includes("whey")) {
      return { min: 15, max: 30 };
    }

    // Requeijão, cream cheese - entre 10g e 40g
    else if (id.includes("requeijao") || id.includes("cream_cheese")) {
      return { min: 10, max: 40 };
    }

    // Pasta de amendoim - entre 10g e 30g (reduzido para porções mais razoáveis)
    else if (id.includes("pasta_amendoim")) {
      return { min: 10, max: 30 };
    }

    // Banana - entre 50g e 120g (limitando para evitar excesso de porção)
    else if (id.includes("banana")) {
      const basePortion =
        food.measures.find((m) => m.label.includes("unidade"))?.weight || 100;
      return { min: basePortion * 0.5, max: basePortion * 1.2 };
    }

    // Frutas - entre 50g e 300g
    else if (
      id.includes("maca") ||
      id.includes("mamao") ||
      id.includes("melao") ||
      id.includes("manga") ||
      id.includes("abacaxi")
    ) {
      return { min: 50, max: 300 };
    }

    // Óleos e manteigas - entre 5g e 15g
    else if (
      id.includes("azeite") ||
      id.includes("oleo") ||
      id.includes("manteiga")
    ) {
      return { min: 5, max: 15 };
    }

    // Arroz, massas - entre 50g e 400g
    else if (id.includes("arroz") || id.includes("macarrao")) {
      return { min: 50, max: 400 };
    }

    // Feijão - entre 50g e 150g
    else if (id.includes("feijao")) {
      return { min: 50, max: 150 };
    }

    // Proteínas (carnes, frango) - entre 80g e 300g
    else if (
      id.includes("frango") ||
      id.includes("patinho") ||
      id.includes("file") ||
      id.includes("carne")
    ) {
      return { min: 80, max: 300 };
    }

    // Valores padrão para outros alimentos
    return { min: 20, max: 150 };
  };

  // Calcular nutrientes para uma determinada porção
  const calculateNutrients = (food: FoodSuggestion, portion: number) => {
    const ratio = portion / 100;
    return {
      calories: Math.round(food.nutrients.calories * ratio),
      protein: Math.round(food.nutrients.protein * ratio * 10) / 10,
      carbs: Math.round(food.nutrients.carbs * ratio * 10) / 10,
      fat: Math.round(food.nutrients.fat * ratio * 10) / 10,
    };
  };

  // Caracterizar cada alimento por seu perfil nutricional dominante
  const categorizeFoods = (foods: FoodSuggestion[]) => {
    return foods.map((food) => {
      const baseNutrients = food.nutrients;
      const totalMacros =
        baseNutrients.protein + baseNutrients.carbs + baseNutrients.fat;

      // Calcular a contribuição percentual de cada macronutriente
      const proteinPct =
        totalMacros > 0 ? baseNutrients.protein / totalMacros : 0;
      const carbsPct = totalMacros > 0 ? baseNutrients.carbs / totalMacros : 0;
      const fatPct = totalMacros > 0 ? baseNutrients.fat / totalMacros : 0;

      // Determinar o tipo dominante
      let dominantType = "balanced";
      if (proteinPct > 0.5) dominantType = "protein";
      else if (carbsPct > 0.5) dominantType = "carbs";
      else if (fatPct > 0.5) dominantType = "fat";

      const limits = getReasonableLimits(food);

      return {
        food,
        dominantType,
        proteinPct,
        carbsPct,
        fatPct,
        caloriesPerGram: baseNutrients.calories / 100,
        limits,
      };
    });
  };

  // Distribuição inicial proporcional dos macros, considerando o que resta
  const initialDistribution = () => {
    const categorizedFoods = categorizeFoods(foods);

    // Verificar alimentos que já estão incluídos nos existentes
    const existingFoodIds = new Set(existingFoods.map((food) => food.id));

    // Definir porções iniciais
    const result = categorizedFoods.map((foodInfo) => {
      const id = foodInfo.food.id.toLowerCase();
      const foodName = foodInfo.food.name.toLowerCase();

      // Se este alimento já existe nos adicionados, começar com porção zero
      if (existingFoodIds.has(foodInfo.food.id)) {
        return {
          ...foodInfo,
          portion: 0, // Alterando para começar com zero em vez do mínimo
        };
      }

      // Verificar se já existe algum alimento similar nas escolhas do usuário
      let similarExists = false;

      for (const existingFood of existingFoods) {
        const existingId = existingFood.id.toLowerCase();
        // Utilizando name ou "" se não existir para compatibilidade
        const existingName = existingFood.name
          ? existingFood.name.toLowerCase()
          : "";

        // Verificar correspondência por nome
        if (
          // Proteínas
          ((foodName.includes("frango") ||
            foodName.includes("carne") ||
            foodName.includes("file") ||
            foodName.includes("patinho") ||
            foodName.includes("bovina")) &&
            (existingName.includes("frango") ||
              existingName.includes("carne") ||
              existingName.includes("file") ||
              existingName.includes("patinho") ||
              existingName.includes("bovina"))) ||
          // Ovos
          (foodName.includes("ovo") && existingName.includes("ovo")) ||
          // Laticínios
          ((foodName.includes("iogurte") ||
            foodName.includes("queijo") ||
            foodName.includes("requeijao")) &&
            (existingName.includes("iogurte") ||
              existingName.includes("queijo") ||
              existingName.includes("requeijao"))) ||
          // Carboidratos
          ((foodName.includes("pao") ||
            foodName.includes("arroz") ||
            foodName.includes("macarrao")) &&
            (existingName.includes("pao") ||
              existingName.includes("arroz") ||
              existingName.includes("macarrao"))) ||
          // Frutas
          ((foodName.includes("banana") ||
            foodName.includes("maca") ||
            foodName.includes("mamao") ||
            foodName.includes("melao") ||
            foodName.includes("manga") ||
            foodName.includes("abacaxi")) &&
            (existingName.includes("banana") ||
              existingName.includes("maca") ||
              existingName.includes("mamao") ||
              existingName.includes("melao") ||
              existingName.includes("manga") ||
              existingName.includes("abacaxi")))
        ) {
          similarExists = true;
          break;
        }

        // Verificar por ID também
        if (
          (id.includes("frango") ||
            id.includes("patinho") ||
            id.includes("file") ||
            id.includes("carne")) &&
          (existingId.includes("frango") ||
            existingId.includes("patinho") ||
            existingId.includes("file") ||
            existingId.includes("carne"))
        ) {
          similarExists = true;
          break;
        }

        if (id.includes("ovo") && existingId.includes("ovo")) {
          similarExists = true;
          break;
        }

        if (
          (id.includes("iogurte") ||
            id.includes("queijo") ||
            id.includes("requeijao")) &&
          (existingId.includes("iogurte") ||
            existingId.includes("queijo") ||
            existingId.includes("requeijao"))
        ) {
          similarExists = true;
          break;
        }

        if (
          (id.includes("pao") ||
            id.includes("arroz") ||
            id.includes("macarrao")) &&
          (existingId.includes("pao") ||
            existingId.includes("arroz") ||
            existingId.includes("macarrao"))
        ) {
          similarExists = true;
          break;
        }

        if (
          (id.includes("banana") ||
            id.includes("maca") ||
            id.includes("mamao") ||
            id.includes("melao") ||
            id.includes("manga") ||
            id.includes("abacaxi")) &&
          (existingId.includes("banana") ||
            existingId.includes("maca") ||
            existingId.includes("mamao") ||
            existingId.includes("melao") ||
            existingId.includes("manga") ||
            existingId.includes("abacaxi"))
        ) {
          similarExists = true;
          break;
        }

        // Verificar exatamente o mesmo alimento pelo ID
        if (foodInfo.food.id === existingFood.id) {
          similarExists = true;
          break;
        }
      }

      // Se já existe um alimento similar, começar com porção zero
      if (similarExists) {
        return {
          ...foodInfo,
          portion: 0,
        };
      }

      let initialPortion = (foodInfo.limits.min + foodInfo.limits.max) / 2;

      // Ajustes específicos para certos alimentos
      if (id.includes("whey")) {
        initialPortion = 20;
      } else if (id.includes("pasta_amendoim")) {
        initialPortion = 15;
      } else if (id.includes("banana")) {
        initialPortion = 100;
      } else if (id.includes("iogurte_desnatado")) {
        initialPortion = 150;
      }

      return {
        ...foodInfo,
        portion: initialPortion,
      };
    });

    return result;
  };

  // Calcular a diferença entre nutrientes atuais e alvo, considerando os existentes
  const calculateNutrientDelta = (foodsWithPortions: any[]) => {
    const currentNutrients = foodsWithPortions.reduce(
      (total, item) => {
        const nutrients = calculateNutrients(item.food, item.portion);
        return {
          calories: total.calories + nutrients.calories,
          protein: total.protein + nutrients.protein,
          carbs: total.carbs + nutrients.carbs,
          fat: total.fat + nutrients.fat,
        };
      },
      {
        calories: existingNutrients.calories,
        protein: existingNutrients.protein,
        carbs: existingNutrients.carbs,
        fat: existingNutrients.fat,
      }
    );

    return {
      calories: targetCalories - currentNutrients.calories,
      protein: targetProtein - currentNutrients.protein,
      carbs: targetCarbs - currentNutrients.carbs,
      fat: targetFat - currentNutrients.fat,
      total:
        Math.abs(targetCalories - currentNutrients.calories) +
        Math.abs(targetProtein - currentNutrients.protein) * 4 +
        Math.abs(targetCarbs - currentNutrients.carbs) * 4 +
        Math.abs(targetFat - currentNutrients.fat) * 9,
    };
  };

  // Algoritmo de otimização
  let currentDistribution = initialDistribution();
  let bestDistribution = [...currentDistribution];
  let bestDelta = calculateNutrientDelta(currentDistribution);
  let iterations = 0;
  const maxIterations = 200;

  while (iterations < maxIterations && bestDelta.total > 5) {
    iterations++;

    // Para cada alimento, tentamos ajustar a porção para melhorar o resultado
    for (let i = 0; i < currentDistribution.length; i++) {
      const current = { ...currentDistribution[i] };
      const delta = calculateNutrientDelta(currentDistribution);

      // Ajustar com base no que está faltando ou sobrando
      let adjustmentNeeded = 0;

      // Damos mais peso ao nutriente dominante deste alimento
      if (current.dominantType === "protein" && delta.protein !== 0) {
        adjustmentNeeded = delta.protein * 10;
      } else if (current.dominantType === "carbs" && delta.carbs !== 0) {
        adjustmentNeeded = delta.carbs * 5;
      } else if (current.dominantType === "fat" && delta.fat !== 0) {
        adjustmentNeeded = delta.fat * 15;
      } else {
        // Para alimentos balanceados, ajustamos com base nas calorias
        adjustmentNeeded = delta.calories / 4;
      }

      // Converter o ajuste necessário em gramas
      let gramsAdjustment = 0;
      if (current.dominantType === "protein") {
        gramsAdjustment =
          adjustmentNeeded / (current.food.nutrients.protein / 100);
      } else if (current.dominantType === "carbs") {
        gramsAdjustment =
          adjustmentNeeded / (current.food.nutrients.carbs / 100);
      } else if (current.dominantType === "fat") {
        gramsAdjustment = adjustmentNeeded / (current.food.nutrients.fat / 100);
      } else {
        gramsAdjustment = adjustmentNeeded / current.caloriesPerGram;
      }

      // Limitar o ajuste para evitar mudanças muito bruscas
      gramsAdjustment = Math.max(-20, Math.min(20, gramsAdjustment));

      // Aplicar o ajuste
      let newPortion = current.portion + gramsAdjustment;

      // Garantir que a porção esteja dentro dos limites razoáveis
      newPortion = Math.max(
        current.limits.min,
        Math.min(current.limits.max, newPortion)
      );

      // Arredondar para facilitar o uso
      if (newPortion < 10) {
        newPortion = Math.round(newPortion * 2) / 2; // Arredondar para 0.5g
      } else if (newPortion < 50) {
        newPortion = Math.round(newPortion); // Arredondar para 1g
      } else {
        newPortion = Math.round(newPortion / 5) * 5; // Arredondar para 5g
      }

      // Caso especial para ovos - arredondar para unidades inteiras
      if (
        current.food.id.includes("ovo") &&
        !current.food.id.includes("clara")
      ) {
        // Encontrar o peso da unidade de ovo (geralmente 50g)
        const unidadeOvo =
          current.food.measures.find((m) => m.label.includes("unidade"))
            ?.weight || 50;
        // Calcular quantidade em unidades e arredondar para inteiro
        const unidades = Math.round(newPortion / unidadeOvo);
        // Recalcular o peso em gramas
        newPortion = unidades * unidadeOvo;
      }

      // Aplicar nova porção
      const testDistribution = [...currentDistribution];
      testDistribution[i] = { ...current, portion: newPortion };

      // Verificar se o ajuste melhorou
      const newDelta = calculateNutrientDelta(testDistribution);

      // Se melhorou, atualizar a distribuição
      if (newDelta.total < bestDelta.total) {
        bestDelta = newDelta;
        bestDistribution = [...testDistribution];
        currentDistribution = [...testDistribution];

        // Se chegamos bem perto do alvo, podemos parar
        if (bestDelta.total < 5) break;
      }
    }
  }

  // Formatar resultado final
  return bestDistribution.map((item) => ({
    food: item.food,
    recommendedPortion: Math.round(item.portion),
  }));
}
