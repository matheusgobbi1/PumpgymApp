// Banco de dados de alimentos básicos
import { FoodData } from "../types/food";
import { tacoFoods } from "./tacoDatabase";
import { brandedFoods } from "./brandedFoods";

// Banco de dados de alimentos comuns
export const foodDatabase: FoodData[] = [
  // Frutas
  {
    id: "food_banana",
    name: "Banana",
    nutrients: {
      calories: 89,
      protein: 1.1,
      fat: 0.3,
      carbs: 22.8,
      fiber: 2.6,
    },
    measures: [
      {
        id: "measure_banana_unit",
        label: "unidade média (118g)",
        weight: 118,
      },
      {
        id: "measure_banana_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_apple",
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
        id: "measure_apple_unit",
        label: "unidade média (150g)",
        weight: 150,
      },
      {
        id: "measure_apple_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_orange",
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
        id: "measure_orange_unit",
        label: "unidade média (140g)",
        weight: 140,
      },
      {
        id: "measure_orange_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_acai",
    name: "Açaí",
    nutrients: {
      calories: 70,
      protein: 1.0,
      fat: 4.5,
      carbs: 6.2,
      fiber: 3.3,
    },
    measures: [
      {
        id: "measure_acai_bowl",
        label: "tigela pequena (200g)",
        weight: 200,
      },
      {
        id: "measure_acai_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_abacaxi",
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
        id: "measure_abacaxi_slice",
        label: "fatia média (100g)",
        weight: 100,
      },
      {
        id: "measure_abacaxi_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_manga",
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
        id: "measure_manga_unit",
        label: "unidade média (200g)",
        weight: 200,
      },
      {
        id: "measure_manga_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_goiaba",
    name: "Goiaba",
    nutrients: {
      calories: 68,
      protein: 2.6,
      fat: 1.0,
      carbs: 14.3,
      fiber: 5.4,
    },
    measures: [
      {
        id: "measure_goiaba_unit",
        label: "unidade média (140g)",
        weight: 140,
      },
      {
        id: "measure_goiaba_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },

  // Verduras e Legumes
  {
    id: "food_alface",
    name: "Alface",
    nutrients: {
      calories: 15,
      protein: 1.4,
      fat: 0.2,
      carbs: 2.9,
      fiber: 1.3,
    },
    measures: [
      {
        id: "measure_alface_cup",
        label: "xícara picada (55g)",
        weight: 55,
      },
      {
        id: "measure_alface_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_tomate",
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
        id: "measure_tomate_unit",
        label: "unidade média (123g)",
        weight: 123,
      },
      {
        id: "measure_tomate_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_cenoura",
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
        id: "measure_cenoura_unit",
        label: "unidade média (72g)",
        weight: 72,
      },
      {
        id: "measure_cenoura_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_mandioca",
    name: "Mandioca",
    nutrients: {
      calories: 160,
      protein: 1.4,
      fat: 0.3,
      carbs: 38.1,
      fiber: 1.9,
    },
    measures: [
      {
        id: "measure_mandioca_cup",
        label: "xícara cozida (206g)",
        weight: 206,
      },
      {
        id: "measure_mandioca_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_batata_doce",
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
        id: "measure_batata_doce_unit",
        label: "unidade média (130g)",
        weight: 130,
      },
      {
        id: "measure_batata_doce_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },

  // Carnes
  {
    id: "food_frango_peito",
    name: "Peito de Frango",
    nutrients: {
      calories: 165,
      protein: 31.0,
      fat: 3.6,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_frango_peito_fillet",
        label: "filé médio (100g)",
        weight: 100,
      },
      {
        id: "measure_frango_peito_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_carne_bovina",
    name: "Carne Bovina (Patinho)",
    nutrients: {
      calories: 187,
      protein: 26.7,
      fat: 8.1,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_carne_bovina_steak",
        label: "bife médio (100g)",
        weight: 100,
      },
      {
        id: "measure_carne_bovina_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_picanha",
    name: "Picanha",
    nutrients: {
      calories: 290,
      protein: 21.0,
      fat: 23.0,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_picanha_slice",
        label: "fatia média (100g)",
        weight: 100,
      },
      {
        id: "measure_picanha_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_linguica",
    name: "Linguiça Calabresa",
    nutrients: {
      calories: 320,
      protein: 15.0,
      fat: 29.0,
      carbs: 2.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_linguica_link",
        label: "gomo (80g)",
        weight: 80,
      },
      {
        id: "measure_linguica_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },

  // Grãos e Cereais
  {
    id: "food_arroz_branco",
    name: "Arroz Branco",
    nutrients: {
      calories: 130,
      protein: 2.7,
      fat: 0.3,
      carbs: 28.2,
      fiber: 0.4,
    },
    measures: [
      {
        id: "measure_arroz_branco_cup",
        label: "xícara cozido (158g)",
        weight: 158,
      },
      {
        id: "measure_arroz_branco_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_feijao_preto",
    name: "Feijão Preto",
    nutrients: {
      calories: 132,
      protein: 8.7,
      fat: 0.5,
      carbs: 23.7,
      fiber: 8.7,
    },
    measures: [
      {
        id: "measure_feijao_preto_cup",
        label: "xícara cozido (172g)",
        weight: 172,
      },
      {
        id: "measure_feijao_preto_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_feijao_carioca",
    name: "Feijão Carioca",
    nutrients: {
      calories: 128,
      protein: 7.6,
      fat: 0.6,
      carbs: 22.8,
      fiber: 8.5,
    },
    measures: [
      {
        id: "measure_feijao_carioca_cup",
        label: "xícara cozido (172g)",
        weight: 172,
      },
      {
        id: "measure_feijao_carioca_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_farofa",
    name: "Farofa",
    nutrients: {
      calories: 398,
      protein: 1.7,
      fat: 13.0,
      carbs: 67.0,
      fiber: 6.8,
    },
    measures: [
      {
        id: "measure_farofa_tbsp",
        label: "colher de sopa (15g)",
        weight: 15,
      },
      {
        id: "measure_farofa_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },

  // Laticínios
  {
    id: "food_queijo_minas",
    name: "Queijo Minas",
    nutrients: {
      calories: 264,
      protein: 17.0,
      fat: 21.0,
      carbs: 2.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_queijo_minas_slice",
        label: "fatia média (30g)",
        weight: 30,
      },
      {
        id: "measure_queijo_minas_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_requeijao",
    name: "Requeijão",
    nutrients: {
      calories: 290,
      protein: 9.0,
      fat: 28.0,
      carbs: 3.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_requeijao_tbsp",
        label: "colher de sopa (20g)",
        weight: 20,
      },
      {
        id: "measure_requeijao_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },

  // Pratos Típicos
  {
    id: "food_feijoada",
    name: "Feijoada",
    nutrients: {
      calories: 360,
      protein: 19.0,
      fat: 18.0,
      carbs: 30.0,
      fiber: 9.0,
    },
    measures: [
      {
        id: "measure_feijoada_bowl",
        label: "tigela média (250g)",
        weight: 250,
      },
      {
        id: "measure_feijoada_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_moqueca",
    name: "Moqueca de Peixe",
    nutrients: {
      calories: 185,
      protein: 18.0,
      fat: 10.0,
      carbs: 7.0,
      fiber: 2.0,
    },
    measures: [
      {
        id: "measure_moqueca_bowl",
        label: "porção média (250g)",
        weight: 250,
      },
      {
        id: "measure_moqueca_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_acaraje",
    name: "Acarajé",
    nutrients: {
      calories: 280,
      protein: 8.0,
      fat: 18.0,
      carbs: 22.0,
      fiber: 4.0,
    },
    measures: [
      {
        id: "measure_acaraje_unit",
        label: "unidade média (120g)",
        weight: 120,
      },
      {
        id: "measure_acaraje_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_pao_de_queijo",
    name: "Pão de Queijo",
    nutrients: {
      calories: 300,
      protein: 5.0,
      fat: 15.0,
      carbs: 36.0,
      fiber: 0.5,
    },
    measures: [
      {
        id: "measure_pao_de_queijo_unit",
        label: "unidade média (40g)",
        weight: 40,
      },
      {
        id: "measure_pao_de_queijo_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_coxinha",
    name: "Coxinha",
    nutrients: {
      calories: 290,
      protein: 9.0,
      fat: 16.0,
      carbs: 28.0,
      fiber: 1.0,
    },
    measures: [
      {
        id: "measure_coxinha_unit",
        label: "unidade média (80g)",
        weight: 80,
      },
      {
        id: "measure_coxinha_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_brigadeiro",
    name: "Brigadeiro",
    nutrients: {
      calories: 130,
      protein: 1.5,
      fat: 5.0,
      carbs: 20.0,
      fiber: 0.5,
    },
    measures: [
      {
        id: "measure_brigadeiro_unit",
        label: "unidade (20g)",
        weight: 20,
      },
      {
        id: "measure_brigadeiro_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_tapioca",
    name: "Tapioca",
    nutrients: {
      calories: 130,
      protein: 0.5,
      fat: 0.3,
      carbs: 32.0,
      fiber: 0.9,
    },
    measures: [
      {
        id: "measure_tapioca_unit",
        label: "unidade média (60g)",
        weight: 60,
      },
      {
        id: "measure_tapioca_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_acai_bowl",
    name: "Tigela de Açaí",
    nutrients: {
      calories: 210,
      protein: 3.0,
      fat: 6.0,
      carbs: 35.0,
      fiber: 4.0,
    },
    measures: [
      {
        id: "measure_acai_bowl_small",
        label: "tigela pequena (200g)",
        weight: 200,
      },
      {
        id: "measure_acai_bowl_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_guarana",
    name: "Guaraná",
    nutrients: {
      calories: 38,
      protein: 0.0,
      fat: 0.0,
      carbs: 10.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_guarana_can",
        label: "lata (350ml)",
        weight: 350,
      },
      {
        id: "measure_guarana_100ml",
        label: "100ml",
        weight: 100,
      },
    ],
  },
];

// Combinar todos os bancos de dados locais
export const combinedFoodDatabase: FoodData[] = [
  ...foodDatabase,
  ...tacoFoods,
  ...brandedFoods,
];
