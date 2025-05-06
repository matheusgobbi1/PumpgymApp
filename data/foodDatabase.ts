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
    category: "Frutas",
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
        label: "unidade (118g)",
        weight: 118,
      },
      {
        id: "measure_banana_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_apple", "food_orange", "food_mamao"],
  },
  {
    id: "food_apple",
    name: "Maçã",
    category: "Frutas",
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
        label: "unidade (150g)",
        weight: 150,
      },
      {
        id: "measure_apple_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_banana", "food_orange", "food_pera"],
  },
  {
    id: "food_orange",
    name: "Laranja",
    category: "Frutas",
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
        label: "unidade (140g)",
        weight: 140,
      },
      {
        id: "measure_orange_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_apple", "food_banana", "food_mamao"],
  },
  {
    id: "food_acai",
    category: "Frutas",
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
    alternatives: ["food_morango", "food_uva", "food_acai_bowl"],
  },
  {
    id: "food_abacaxi",
    category: "Frutas",
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
        label: "fatia (100g)",
        weight: 100,
      },
      {
        id: "measure_abacaxi_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_manga", "food_mamao", "food_melao"],
  },
  {
    id: "food_manga",
    category: "Frutas",
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
        label: "unidade (200g)",
        weight: 200,
      },
      {
        id: "measure_manga_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_abacaxi", "food_mamao", "food_banana"],
  },
  {
    id: "food_goiaba",
    category: "Frutas",
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
        label: "unidade (140g)",
        weight: 140,
      },
      {
        id: "measure_goiaba_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_mamao",
    category: "Frutas",
    nutrients: {
      calories: 43,
      protein: 0.5,
      fat: 0.3,
      carbs: 10.8,
      fiber: 1.7,
    },
    measures: [
      {
        id: "measure_mamao_slice",
        label: "fatia (170g)",
        weight: 170,
      },
      {
        id: "measure_mamao_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_melao",
    category: "Frutas",
    nutrients: {
      calories: 34,
      protein: 0.8,
      fat: 0.2,
      carbs: 8.0,
      fiber: 0.9,
    },
    measures: [
      {
        id: "measure_melao_slice",
        label: "fatia (160g)",
        weight: 160,
      },
      {
        id: "measure_melao_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_morango",
    category: "Frutas",
    nutrients: {
      calories: 32,
      protein: 0.7,
      fat: 0.3,
      carbs: 7.7,
      fiber: 2.0,
    },
    measures: [
      {
        id: "measure_morango_cup",
        label: "xícara (144g)",
        weight: 144,
      },
      {
        id: "measure_morango_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_uva",
    category: "Frutas",
    nutrients: {
      calories: 69,
      protein: 0.6,
      fat: 0.2,
      carbs: 18.0,
      fiber: 0.9,
    },
    measures: [
      {
        id: "measure_uva_cup",
        label: "xícara (151g)",
        weight: 151,
      },
      {
        id: "measure_uva_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },

  // Verduras e Legumes
  {
    id: "food_alface",
    name: "Alface Crespa",
    category: "Verduras e Legumes",
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
    alternatives: ["food_rucula", "food_espinafre", "food_mix_folhas_verdes"],
  },
  {
    id: "food_tomate",
    name: "Tomate",
    category: "Verduras e Legumes",
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
        label: "unidade (123g)",
        weight: 123,
      },
      {
        id: "measure_tomate_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_pimentao", "food_pepino", "food_abobrinha"],
  },
  {
    id: "food_cenoura",
    category: "Verduras e Legumes",
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
        label: "unidade (72g)",
        weight: 72,
      },
      {
        id: "measure_cenoura_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_brocolis", "food_abobrinha", "food_batata_doce"],
  },
  {
    id: "food_mandioca",
    category: "Verduras e Legumes",
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
    category: "Verduras e Legumes",
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
        label: "unidade (130g)",
        weight: 130,
      },
      {
        id: "measure_batata_doce_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_brocolis",
    name: "Brócolis Cozido",
    category: "Verduras e Legumes",
    nutrients: {
      calories: 34,
      protein: 2.8,
      fat: 0.4,
      carbs: 6.6,
      fiber: 2.6,
    },
    measures: [
      {
        id: "measure_brocolis_cup",
        label: "xícara picada (91g)",
        weight: 91,
      },
      {
        id: "measure_brocolis_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_couve_flor", "food_espinafre", "food_couve"],
  },
  {
    id: "food_couve_flor",
    category: "Verduras e Legumes",
    nutrients: {
      calories: 25,
      protein: 1.9,
      fat: 0.3,
      carbs: 5.0,
      fiber: 2.0,
    },
    measures: [
      {
        id: "measure_couve_flor_cup",
        label: "xícara picada (107g)",
        weight: 107,
      },
      {
        id: "measure_couve_flor_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_brocolis", "food_couve", "food_repolho"],
  },
  {
    id: "food_pepino",
    category: "Verduras e Legumes",
    nutrients: {
      calories: 15,
      protein: 0.6,
      fat: 0.1,
      carbs: 3.6,
      fiber: 0.5,
    },
    measures: [
      {
        id: "measure_pepino_unit",
        label: "unidade (300g)",
        weight: 300,
      },
      {
        id: "measure_pepino_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_tomate", "food_abobrinha", "food_pimentao"],
  },
  {
    id: "food_batata",
    category: "Verduras e Legumes",
    nutrients: {
      calories: 77,
      protein: 2.0,
      fat: 0.1,
      carbs: 17.5,
      fiber: 2.2,
    },
    measures: [
      {
        id: "measure_batata_unit",
        label: "unidade (173g)",
        weight: 173,
      },
      {
        id: "measure_batata_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_batata_doce", "food_mandioca", "food_inhame"],
  },

  // Carnes
  {
    id: "food_frango_peito",
    name: "Peito de Frango Grelhado",
    category: "Carnes",
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
        label: "filé (100g)",
        weight: 100,
      },
      {
        id: "measure_frango_peito_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_carne_bovina", "food_picanha"],
  },
  {
    id: "food_carne_bovina",
    category: "Carnes",
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
        label: "bife (100g)",
        weight: 100,
      },
      {
        id: "measure_carne_bovina_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_frango_peito", "food_picanha"],
  },
  {
    id: "food_picanha",
    category: "Carnes",
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
        label: "fatia (100g)",
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
    category: "Carnes",
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
    category: "Grãos e Cereais",
    nutrients: {
      calories: 130,
      protein: 2.7,
      fat: 0.3,
      carbs: 28.2,
      fiber: 0.4,
    },
    measures: [
      {
        id: "measure_arroz_branco_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_batata", "food_mandioca", "food_batata_doce"],
  },
  {
    id: "food_feijao_preto",
    category: "Grãos e Cereais",
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
    alternatives: ["food_feijao_carioca", "food_ervilha", "food_lentilha"],
  },
  {
    id: "food_feijao_carioca",
    category: "Grãos e Cereais",
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
    alternatives: ["food_feijao_preto", "food_ervilha", "food_lentilha"],
  },
  {
    id: "food_farofa",
    category: "Grãos e Cereais",
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
    category: "Laticínios",
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
        label: "fatia (30g)",
        weight: 30,
      },
      {
        id: "measure_queijo_minas_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_requeijao", "food_queijo_cottage", "food_ricota"],
  },
  {
    id: "food_requeijao",
    category: "Laticínios",
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
    alternatives: ["food_queijo_minas", "food_cream_cheese", "food_ricota"],
  },

  // Pratos Típicos
  {
    id: "food_feijoada",
    category: "Pratos Típicos",
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
        label: "tigela (250g)",
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
    category: "Pratos Típicos",
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
        label: "porção (250g)",
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
    category: "Pratos Típicos",
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
        label: "unidade (120g)",
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
    category: "Pratos Típicos",
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
        label: "unidade (40g)",
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
    category: "Pratos Típicos",
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
        label: "unidade (80g)",
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
    category: "Pratos Típicos",
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
    category: "Pratos Típicos",
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
        label: "unidade (60g)",
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
    id: "food_guarana",
    category: "Bebidas",
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

  // Mix de Legumes e Saladas
  {
    id: "food_mix_legumes",
    category: "Saladas e Mix",
    nutrients: {
      calories: 45,
      protein: 2.5,
      fat: 0.3,
      carbs: 9.5,
      fiber: 3.2,
    },
    measures: [
      {
        id: "measure_mix_legumes_cup",
        label: "xícara (140g)",
        weight: 140,
      },
      {
        id: "measure_mix_legumes_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: [
      "food_salada_mista",
      "food_legumes_cozidos",
      "food_mix_folhas_verdes",
    ],
  },
  {
    id: "food_salada_mista",
    category: "Saladas e Mix",
    nutrients: {
      calories: 20,
      protein: 1.5,
      fat: 0.2,
      carbs: 4.0,
      fiber: 2.0,
    },
    measures: [
      {
        id: "measure_salada_mista_bowl",
        label: "tigela (200g)",
        weight: 200,
      },
      {
        id: "measure_salada_mista_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: [
      "food_mix_legumes",
      "food_mix_folhas_verdes",
      "food_salada_tropical",
    ],
  },
  {
    id: "food_rucula",
    category: "Verduras e Legumes",
    nutrients: {
      calories: 25,
      protein: 2.6,
      fat: 0.7,
      carbs: 3.7,
      fiber: 1.6,
    },
    measures: [
      {
        id: "measure_rucula_cup",
        label: "xícara (20g)",
        weight: 20,
      },
      {
        id: "measure_rucula_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_alface", "food_espinafre", "food_mix_folhas_verdes"],
  },
  {
    id: "food_espinafre",
    category: "Verduras e Legumes",
    nutrients: {
      calories: 23,
      protein: 2.9,
      fat: 0.4,
      carbs: 3.6,
      fiber: 2.2,
    },
    measures: [
      {
        id: "measure_espinafre_cup",
        label: "xícara (30g)",
        weight: 30,
      },
      {
        id: "measure_espinafre_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_rucula", "food_couve", "food_alface"],
  },
  {
    id: "food_couve",
    category: "Verduras e Legumes",
    nutrients: {
      calories: 33,
      protein: 3.3,
      fat: 0.7,
      carbs: 6.7,
      fiber: 2.0,
    },
    measures: [
      {
        id: "measure_couve_cup",
        label: "xícara picada (35g)",
        weight: 35,
      },
      {
        id: "measure_couve_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_espinafre", "food_brocolis", "food_couve_flor"],
  },
  {
    id: "food_abobrinha",
    category: "Verduras e Legumes",
    nutrients: {
      calories: 17,
      protein: 1.2,
      fat: 0.3,
      carbs: 3.1,
      fiber: 1.0,
    },
    measures: [
      {
        id: "measure_abobrinha_unit",
        label: "unidade (200g)",
        weight: 200,
      },
      {
        id: "measure_abobrinha_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_pepino", "food_berinjela", "food_chuchu"],
  },
  {
    id: "food_berinjela",
    category: "Verduras e Legumes",
    nutrients: {
      calories: 25,
      protein: 1.0,
      fat: 0.2,
      carbs: 6.0,
      fiber: 3.0,
    },
    measures: [
      {
        id: "measure_berinjela_unit",
        label: "unidade (250g)",
        weight: 250,
      },
      {
        id: "measure_berinjela_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_abobrinha", "food_chuchu", "food_quiabo"],
  },
  {
    id: "food_chuchu",
    category: "Verduras e Legumes",
    nutrients: {
      calories: 19,
      protein: 0.7,
      fat: 0.1,
      carbs: 4.4,
      fiber: 1.7,
    },
    measures: [
      {
        id: "measure_chuchu_unit",
        label: "unidade (200g)",
        weight: 200,
      },
      {
        id: "measure_chuchu_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_abobrinha", "food_berinjela", "food_vagem"],
  },
  {
    id: "food_quiabo",
    category: "Verduras e Legumes",
    nutrients: {
      calories: 33,
      protein: 1.9,
      fat: 0.2,
      carbs: 7.0,
      fiber: 3.2,
    },
    measures: [
      {
        id: "measure_quiabo_cup",
        label: "xícara (100g)",
        weight: 100,
      },
      {
        id: "measure_quiabo_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_vagem", "food_berinjela", "food_chuchu"],
  },
  {
    id: "food_pimentao",
    category: "Verduras e Legumes",
    nutrients: {
      calories: 20,
      protein: 0.9,
      fat: 0.2,
      carbs: 4.6,
      fiber: 1.7,
    },
    measures: [
      {
        id: "measure_pimentao_unit",
        label: "unidade (120g)",
        weight: 120,
      },
      {
        id: "measure_pimentao_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_tomate", "food_pepino", "food_abobrinha"],
  },
  {
    id: "food_salada_cesar",
    category: "Saladas e Mix",
    nutrients: {
      calories: 130,
      protein: 7.0,
      fat: 7.0,
      carbs: 10.0,
      fiber: 2.5,
    },
    measures: [
      {
        id: "measure_salada_cesar_bowl",
        label: "tigela (250g)",
        weight: 250,
      },
      {
        id: "measure_salada_cesar_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: [
      "food_salada_mista",
      "food_mix_folhas_verdes",
      "food_salada_tropical",
    ],
  },
  {
    id: "food_mix_folhas_verdes",
    category: "Saladas e Mix",
    nutrients: {
      calories: 18,
      protein: 1.8,
      fat: 0.3,
      carbs: 3.2,
      fiber: 1.8,
    },
    measures: [
      {
        id: "measure_mix_folhas_verdes_cup",
        label: "xícara (30g)",
        weight: 30,
      },
      {
        id: "measure_mix_folhas_verdes_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_alface", "food_rucula", "food_espinafre"],
  },
  {
    id: "food_salada_tropical",
    category: "Saladas e Mix",
    nutrients: {
      calories: 45,
      protein: 1.0,
      fat: 0.5,
      carbs: 10.0,
      fiber: 2.5,
    },
    measures: [
      {
        id: "measure_salada_tropical_bowl",
        label: "tigela (200g)",
        weight: 200,
      },
      {
        id: "measure_salada_tropical_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_legumes_cozidos",
    category: "Saladas e Mix",
    nutrients: {
      calories: 55,
      protein: 2.0,
      fat: 0.4,
      carbs: 12.0,
      fiber: 3.5,
    },
    measures: [
      {
        id: "measure_legumes_cozidos_cup",
        label: "xícara (150g)",
        weight: 150,
      },
      {
        id: "measure_legumes_cozidos_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_vagem",
    category: "Verduras e Legumes",
    nutrients: {
      calories: 31,
      protein: 1.8,
      fat: 0.2,
      carbs: 7.0,
      fiber: 3.4,
    },
    measures: [
      {
        id: "measure_vagem_cup",
        label: "xícara (125g)",
        weight: 125,
      },
      {
        id: "measure_vagem_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_milho_verde",
    category: "Verduras e Legumes",
    nutrients: {
      calories: 96,
      protein: 3.4,
      fat: 1.5,
      carbs: 21.0,
      fiber: 2.4,
    },
    measures: [
      {
        id: "measure_milho_verde_cup",
        label: "xícara (160g)",
        weight: 160,
      },
      {
        id: "measure_milho_verde_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_ervilha",
    category: "Verduras e Legumes",
    nutrients: {
      calories: 81,
      protein: 5.4,
      fat: 0.4,
      carbs: 14.5,
      fiber: 5.1,
    },
    measures: [
      {
        id: "measure_ervilha_cup",
        label: "xícara (160g)",
        weight: 160,
      },
      {
        id: "measure_ervilha_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },

  // Óleos e Gorduras
  {
    id: "food_azeite",
    category: "Óleos e Gorduras",
    nutrients: {
      calories: 884,
      protein: 0.0,
      fat: 100.0,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_azeite_tbsp",
        label: "colher de sopa (15g)",
        weight: 15,
      },
      {
        id: "measure_azeite_tsp",
        label: "colher de chá (5)",
        weight: 5,
      },
      {
        id: "measure_azeite_100g",
        label: "100g",
        weight: 100,
      },
    ],
  },
  {
    id: "food_hot_roll",
    nutrients: {
      calories: 175,
      protein: 3.8,
      fat: 3.66,
      carbs: 30.71,
      fiber: 0.5,
    },
    measures: [
      {
        id: "measure_hot_roll_unit",
        label: "pedaço (29g)",
        weight: 29,
      },
      {
        id: "measure_hot_roll_portion",
        label: "porção (125g)",
        weight: 125,
      },
      {
        id: "measure_hot_roll_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_uramaki", "food_sushi_salmao", "food_temaki_salmao"],
  },
  {
    id: "food_uramaki",
    nutrients: {
      calories: 170,
      protein: 6.0,
      fat: 5.0,
      carbs: 27.0,
      fiber: 0.5,
    },
    measures: [
      {
        id: "measure_uramaki_unit",
        label: "unidade (35g)",
        weight: 35,
      },
      {
        id: "measure_uramaki_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_hot_roll", "food_sushi_salmao", "food_temaki_salmao"],
  },
  {
    id: "food_temaki_salmao",
    nutrients: {
      calories: 174,
      protein: 6.67,
      fat: 1.3,
      carbs: 33.05,
      fiber: 0.9,
    },
    measures: [
      {
        id: "measure_temaki_unit",
        label: "unidade (100g)",
        weight: 100,
      },
      {
        id: "measure_temaki_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_hot_roll", "food_uramaki", "food_sushi_salmao"],
  },
  {
    id: "food_sushi_salmao",
    nutrients: {
      calories: 146,
      protein: 5.8,
      fat: 1.2,
      carbs: 28.5,
      fiber: 0.3,
    },
    measures: [
      {
        id: "measure_sushi_unit",
        label: "unidade (30g)",
        weight: 30,
      },
      {
        id: "measure_sushi_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_uramaki", "food_hot_roll", "food_temaki_salmao"],
  },
  {
    id: "food_sashimi_salmao",
    nutrients: {
      calories: 208,
      protein: 22.0,
      fat: 13.0,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_sashimi_unit",
        label: "fatia (15g)",
        weight: 15,
      },
      {
        id: "measure_sashimi_100g",
        label: "100g",
        weight: 100,
      },
    ],
    alternatives: ["food_sushi_salmao", "food_temaki_salmao", "food_hot_roll"],
  },
];

// Combinar todos os bancos de dados locais
export const combinedFoodDatabase: FoodData[] = [
  ...foodDatabase,
  ...tacoFoods,
  ...brandedFoods,
];
