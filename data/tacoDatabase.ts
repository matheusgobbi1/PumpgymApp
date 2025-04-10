import { FoodData } from "../types/food";

// Alimentos da Tabela TACO (Tabela Brasileira de Composição de Alimentos)
// Fonte: https://www.nepa.unicamp.br/taco/
export const tacoFoods: (FoodData & {
  alternatives?: string[];
  portionDescription?: string;
})[] = [
  // Cereais e derivados
  {
    id: "taco_001",
    name: "Arroz branco cozido",
    category: "Grãos e Cereais",
    nutrients: {
      calories: 128,
      protein: 2.5,
      fat: 0.2,
      carbs: 28.1,
      fiber: 1.6,
    },
    measures: [
      {
        id: "measure_taco_001_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_001_colher",
        label: "colher de sopa cheia (25g)",
        weight: 25,
      },
      {
        id: "measure_taco_001_xicara",
        label: "xícara (160g)",
        weight: 160,
      },
    ],
    alternatives: ["taco_002", "taco_004", "food_arroz_branco"],
  },
  {
    id: "taco_002",
    name: "Arroz integral cozido",
    category: "Grãos e Cereais",
    nutrients: {
      calories: 124,
      protein: 2.6,
      fat: 1.0,
      carbs: 25.8,
      fiber: 2.7,
    },
    measures: [
      {
        id: "measure_taco_002_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_002_colher",
        label: "colher de sopa cheia (25g)",
        weight: 25,
      },
      {
        id: "measure_taco_002_xicara",
        label: "xícara (160g)",
        weight: 160,
      },
    ],
    alternatives: ["taco_001", "taco_004", "food_arroz_integral"],
  },
  {
    id: "taco_003",
    name: "Pão francês",
    category: "Pães",
    nutrients: {
      calories: 300,
      protein: 8.0,
      fat: 3.1,
      carbs: 58.6,
      fiber: 2.3,
    },
    measures: [
      {
        id: "measure_taco_003_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_003_unidade",
        label: "unidade (50g)",
        weight: 50,
        portionDescription: "1 unidade",
      },
    ],
    alternatives: ["taco_020", "food_pao_frances", "food_pao_forma"],
  },
  {
    id: "taco_004",
    name: "Macarrão, cozido",
    category: "Grãos e Cereais",
    nutrients: {
      calories: 122,
      protein: 3.9,
      fat: 1.3,
      carbs: 24.5,
      fiber: 1.6,
    },
    measures: [
      {
        id: "measure_taco_004_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_004_pegador",
        label: "pegador (110g)",
        weight: 110,
      },
      {
        id: "measure_taco_004_prato",
        label: "prato raso (220g)",
        weight: 220,
      },
    ],
    alternatives: ["taco_001", "taco_002", "food_macarrao"],
  },

  // Leguminosas
  {
    id: "taco_005",
    name: "Feijão preto cozido",
    category: "Leguminosas",
    nutrients: {
      calories: 77,
      protein: 4.5,
      fat: 0.5,
      carbs: 14.0,
      fiber: 8.4,
    },
    measures: [
      {
        id: "measure_taco_005_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_005_concha",
        label: "concha (80g)",
        weight: 80,
      },
      {
        id: "measure_taco_005_xicara",
        label: "xícara (180g)",
        weight: 180,
      },
    ],
    alternatives: ["taco_006", "food_feijao_preto", "food_feijao_carioca"],
  },
  {
    id: "taco_006",
    name: "Feijão carioca cozido",
    category: "Leguminosas",
    nutrients: {
      calories: 76,
      protein: 4.8,
      fat: 0.5,
      carbs: 13.6,
      fiber: 8.5,
    },
    measures: [
      {
        id: "measure_taco_006_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_006_concha",
        label: "concha (80g)",
        weight: 80,
      },
      {
        id: "measure_taco_006_xicara",
        label: "xícara (180g)",
        weight: 180,
      },
    ],
    alternatives: ["taco_005", "food_feijao_carioca", "food_feijao_preto"],
  },

  // Frutas
  {
    id: "taco_009",
    name: "Banana, prata",
    category: "Frutas",
    nutrients: {
      calories: 98,
      protein: 1.3,
      fat: 0.1,
      carbs: 26.0,
      fiber: 2.0,
    },
    measures: [
      {
        id: "measure_taco_009_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_009_unidade",
        label: "unidade (100g)",
        weight: 100,
      },
    ],
    alternatives: ["taco_010", "food_banana", "food_maca"],
  },
  {
    id: "taco_010",
    name: "Laranja, pêra",
    category: "Frutas",
    nutrients: {
      calories: 37,
      protein: 1.0,
      fat: 0.1,
      carbs: 8.9,
      fiber: 0.8,
    },
    measures: [
      {
        id: "measure_taco_010_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_010_unidade",
        label: "unidade (130g)",
        weight: 130,
      },
    ],
    alternatives: ["taco_009", "food_orange", "food_apple"],
  },

  // Carnes e ovos
  {
    id: "taco_011",
    name: "Acém cozido sem gordura",
    category: "Carnes",
    nutrients: {
      calories: 215,
      protein: 27.3,
      fat: 11.2,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_011_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_011_pedaco",
        label: "pedaço médio (100g)",
        weight: 100,
      },
    ],
    alternatives: ["taco_012", "taco_050", "taco_052"],
  },
  {
    id: "taco_012",
    name: "Peito de frango cozido sem pele",
    category: "Carnes",
    nutrients: {
      calories: 163,
      protein: 31.5,
      fat: 3.2,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_012_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_012_file",
        label: "filé médio (100g)",
        weight: 100,
      },
    ],
    alternatives: [
      "taco_054", // Coxa de frango assada com pele
      "taco_055", // Sobrecoxa de frango assada com pele
      "food_frango_peito", // Peito de frango (versão básica)
      "taco_041", // Atum fresco cru
      "taco_042", // Bacalhau salgado cru
      "taco_052", // Patinho grelhado sem gordura
      "food_peito_peru", // Peito de peru
      "food_tilapia", // Filé de tilápia
      "food_salmao", // Salmão
      "food_atum", // Atum em conserva
    ],
  },
  {
    id: "taco_013",
    name: "Ovo",
    category: "Ovos",
    nutrients: {
      calories: 146,
      protein: 13.3,
      fat: 9.5,
      carbs: 0.6,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_013_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_013_unidade",
        label: "unidade (50g)",
        weight: 50,
        portionDescription: "1 unidade",
      },
    ],
    alternatives: ["taco_064", "food_ovo", "food_clara_ovo"],
  },

  // Leite e derivados
  {
    id: "taco_014",
    name: "Leite integral",
    category: "Laticínios",
    nutrients: {
      calories: 61,
      protein: 3.2,
      fat: 3.3,
      carbs: 4.5,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_014_100g",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_taco_014_copo",
        label: "copo (200ml)",
        weight: 200,
      },
    ],
    alternatives: [
      "food_leite",
      "food_iogurte_natural",
      "food_leite_desnatado",
    ],
  },
  {
    id: "taco_015",
    name: "Queijo minas frescal",
    category: "Laticínios",
    nutrients: {
      calories: 264,
      protein: 17.4,
      fat: 20.2,
      carbs: 3.2,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_015_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_015_fatia",
        label: "fatia (30g)",
        weight: 30,
      },
    ],
    alternatives: [
      "food_queijo_minas",
      "food_requeijao",
      "food_queijo_cottage",
    ],
  },

  // Açúcares e doces
  {
    id: "taco_016",
    name: "Açúcar refinado",
    category: "Açúcares e Doces",
    nutrients: {
      calories: 387,
      protein: 0.0,
      fat: 0.0,
      carbs: 99.6,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_016_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_016_colher",
        label: "colher de sopa (10g)",
        weight: 10,
      },
    ],
  },

  // Bebidas
  {
    id: "taco_018",
    name: "Café, infusão 10%",
    category: "Bebidas",
    nutrients: {
      calories: 2,
      protein: 0.2,
      fat: 0.0,
      carbs: 0.3,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_018_100g",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_taco_018_xicara",
        label: "xícara (50ml)",
        weight: 50,
      },
    ],
  },

  {
    id: "taco_020",
    name: "Pão de queijo assado",
    category: "Pães",
    nutrients: {
      calories: 363,
      protein: 5.1,
      fat: 24.6,
      carbs: 30.8,
      fiber: 0.4,
    },
    measures: [
      {
        id: "measure_taco_020_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_020_unidade",
        label: "unidade (20g)",
        weight: 20,
      },
    ],
  },

  // Carnes Processadas
  {
    id: "taco_021",
    name: "Presunto cozido",
    category: "Carnes Processadas",
    nutrients: {
      calories: 109,
      protein: 14.5,
      fat: 5.2,
      carbs: 2.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_021_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_021_fatia",
        label: "fatia (15g)",
        weight: 15,
      },
    ],
    alternatives: ["taco_025", "taco_036", "taco_022"],
  },
  {
    id: "taco_022",
    name: "Mortadela",
    category: "Carnes Processadas",
    nutrients: {
      calories: 269,
      protein: 12.8,
      fat: 23.8,
      carbs: 2.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_022_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_022_fatia",
        label: "fatia (15g)",
        weight: 15,
      },
    ],
    alternatives: ["taco_021", "taco_036", "taco_040"],
  },
  {
    id: "taco_023",
    name: "Salsicha",
    category: "Carnes Processadas",
    nutrients: {
      calories: 257,
      protein: 13.5,
      fat: 22.2,
      carbs: 2.2,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_023_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_023_unidade",
        label: "unidade (50g)",
        weight: 50,
      },
    ],
    alternatives: ["taco_024", "taco_039", "taco_022"],
  },
  {
    id: "taco_024",
    name: "Linguiça de porco crua",
    category: "Carnes Processadas",
    nutrients: {
      calories: 227,
      protein: 16.0,
      fat: 18.0,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_024_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_024_gomo",
        label: "gomo (60g)",
        weight: 60,
      },
    ],
    alternatives: ["taco_039", "taco_023", "food_linguica"],
  },
  {
    id: "taco_025",
    name: "Peito de peru defumado",
    category: "Carnes Processadas",
    nutrients: {
      calories: 119,
      protein: 17.0,
      fat: 5.5,
      carbs: 1.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_025_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_025_fatia",
        label: "fatia (20g)",
        weight: 20,
      },
    ],
    alternatives: ["taco_021", "taco_036", "food_peito_peru"],
  },

  // Farinhas e Derivados
  {
    id: "taco_026",
    name: "Farinha de trigo",
    category: "Farinhas",
    nutrients: {
      calories: 360,
      protein: 9.8,
      fat: 1.4,
      carbs: 75.1,
      fiber: 2.3,
    },
    measures: [
      {
        id: "measure_taco_026_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_026_xicara",
        label: "xícara (120g)",
        weight: 120,
      },
      {
        id: "measure_taco_026_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
    ],
    alternatives: ["taco_028", "taco_029", "taco_030"],
  },
  {
    id: "taco_027",
    name: "Farinha de mandioca torrada",
    category: "Farinhas",
    nutrients: {
      calories: 361,
      protein: 1.2,
      fat: 0.3,
      carbs: 87.9,
      fiber: 6.4,
    },
    measures: [
      {
        id: "measure_taco_027_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_027_xicara",
        label: "xícara (120g)",
        weight: 120,
      },
      {
        id: "measure_taco_027_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
    ],
    alternatives: ["taco_028", "food_farofa", "food_mandioca"],
  },
  {
    id: "taco_028",
    name: "Farinha de milho amarela",
    category: "Farinhas",
    nutrients: {
      calories: 351,
      protein: 7.2,
      fat: 1.5,
      carbs: 79.1,
      fiber: 5.5,
    },
    measures: [
      {
        id: "measure_taco_028_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_028_xicara",
        label: "xícara (120g)",
        weight: 120,
      },
      {
        id: "measure_taco_028_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
    ],
    alternatives: ["taco_026", "taco_027", "food_milho_verde"],
  },
  {
    id: "taco_029",
    name: "Farinha de centeio integral",
    category: "Farinhas",
    nutrients: {
      calories: 336,
      protein: 12.5,
      fat: 1.8,
      carbs: 73.3,
      fiber: 15.5,
    },
    measures: [
      {
        id: "measure_taco_029_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_029_xicara",
        label: "xícara (120g)",
        weight: 120,
      },
      {
        id: "measure_taco_029_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
    ],
    alternatives: ["taco_026", "taco_030", "food_aveia"],
  },
  {
    id: "taco_030",
    name: "Farinha de aveia",
    category: "Farinhas",
    nutrients: {
      calories: 394,
      protein: 13.9,
      fat: 8.5,
      carbs: 66.6,
      fiber: 9.1,
    },
    measures: [
      {
        id: "measure_taco_030_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_030_xicara",
        label: "xícara (120g)",
        weight: 120,
      },
      {
        id: "measure_taco_030_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
    ],
    alternatives: ["taco_029", "food_aveia", "food_granola"],
  },

  // Oleaginosas
  {
    id: "taco_031",
    name: "Amendoim cru",
    category: "Oleaginosas",
    nutrients: {
      calories: 544,
      protein: 27.2,
      fat: 43.9,
      carbs: 20.3,
      fiber: 8.0,
    },
    measures: [
      {
        id: "measure_taco_031_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_031_xicara",
        label: "xícara (100g)",
        weight: 100,
      },
      {
        id: "measure_taco_031_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
    ],
    alternatives: ["taco_032", "taco_033", "taco_034"],
  },
  {
    id: "taco_032",
    name: "Castanha de caju torrada salgada",
    category: "Oleaginosas",
    nutrients: {
      calories: 570,
      protein: 18.5,
      fat: 46.3,
      carbs: 29.1,
      fiber: 3.0,
    },
    measures: [
      {
        id: "measure_taco_032_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_032_xicara",
        label: "xícara (100g)",
        weight: 100,
      },
      {
        id: "measure_taco_032_unidade",
        label: "unidade (3g)",
        weight: 3,
      },
    ],
  },
  {
    id: "taco_033",
    name: "Castanha do Pará crua",
    category: "Oleaginosas",
    nutrients: {
      calories: 643,
      protein: 14.5,
      fat: 63.5,
      carbs: 15.1,
      fiber: 7.9,
    },
    measures: [
      {
        id: "measure_taco_033_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_033_unidade",
        label: "unidade (5g)",
        weight: 5,
      },
      {
        id: "measure_taco_033_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
    ],
    alternatives: ["taco_031", "taco_034", "taco_035"],
  },
  {
    id: "taco_034",
    name: "Amêndoa crua",
    category: "Oleaginosas",
    nutrients: {
      calories: 579,
      protein: 21.3,
      fat: 49.9,
      carbs: 21.7,
      fiber: 12.7,
    },
    measures: [
      {
        id: "measure_taco_034_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_034_unidade",
        label: "unidade (1g)",
        weight: 1,
      },
      {
        id: "measure_taco_034_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
    ],
  },
  {
    id: "taco_035",
    name: "Noz crua",
    category: "Oleaginosas",
    nutrients: {
      calories: 620,
      protein: 14.4,
      fat: 59.4,
      carbs: 18.4,
      fiber: 5.2,
    },
    measures: [
      {
        id: "measure_taco_035_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_035_unidade",
        label: "unidade (5g)",
        weight: 5,
      },
      {
        id: "measure_taco_035_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
    ],
  },

  // Embutidos
  {
    id: "taco_036",
    name: "Apresuntado fatiado",
    category: "Carnes Processadas",
    nutrients: {
      calories: 129,
      protein: 13.5,
      fat: 8.0,
      carbs: 1.2,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_036_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_036_fatia",
        label: "fatia (15g)",
        weight: 15,
      },
    ],
  },
  {
    id: "taco_037",
    name: "Bacon defumado",
    category: "Carnes Processadas",
    nutrients: {
      calories: 541,
      protein: 27.0,
      fat: 48.2,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_037_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_037_fatia",
        label: "fatia (15g)",
        weight: 15,
      },
    ],
  },
  {
    id: "taco_038",
    name: "Copa tipo salame",
    category: "Carnes Processadas",
    nutrients: {
      calories: 432,
      protein: 20.3,
      fat: 39.2,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_038_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_038_fatia",
        label: "fatia (20g)",
        weight: 20,
      },
    ],
  },
  {
    id: "taco_039",
    name: "Linguiça de frango crua",
    category: "Carnes Processadas",
    nutrients: {
      calories: 219,
      protein: 14.8,
      fat: 17.5,
      carbs: 1.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_039_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_039_gomo",
        label: "gomo (60g)",
        weight: 60,
      },
    ],
  },
  {
    id: "taco_040",
    name: "Salame fatiado",
    category: "Carnes Processadas",
    nutrients: {
      calories: 398,
      protein: 25.8,
      fat: 32.5,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_040_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_040_fatia",
        label: "fatia (15g)",
        weight: 15,
      },
    ],
  },

  // Peixes e Frutos do Mar
  {
    id: "taco_041",
    name: "Atum fresco cru",
    category: "Peixes e Frutos do Mar",
    nutrients: {
      calories: 118,
      protein: 25.7,
      fat: 1.0,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_041_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_041_posta",
        label: "posta (100g)",
        weight: 100,
      },
    ],
    alternatives: ["taco_047", "taco_049", "taco_048"],
  },
  {
    id: "taco_042",
    name: "Bacalhau salgado cru",
    category: "Peixes e Frutos do Mar",
    nutrients: {
      calories: 138,
      protein: 29.0,
      fat: 1.4,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_042_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_042_posta",
        label: "posta (120g)",
        weight: 120,
      },
    ],
    alternatives: ["taco_045", "taco_046", "food_bacalhau"],
  },
  {
    id: "taco_043",
    name: "Cação cozido",
    category: "Peixes e Frutos do Mar",
    nutrients: {
      calories: 124,
      protein: 26.9,
      fat: 1.1,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_043_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_043_posta",
        label: "posta (100g)",
        weight: 100,
      },
    ],
  },
  {
    id: "taco_044",
    name: "Camarão cozido",
    category: "Peixes e Frutos do Mar",
    nutrients: {
      calories: 90,
      protein: 19.0,
      fat: 1.0,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_044_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_044_unidade",
        label: "unidade (8g)",
        weight: 8,
      },
      {
        id: "measure_taco_044_porcao",
        label: "porção (80g)",
        weight: 80,
      },
    ],
  },
  {
    id: "taco_045",
    name: "Filé de merluza cozido",
    category: "Peixes e Frutos do Mar",
    nutrients: {
      calories: 122,
      protein: 26.7,
      fat: 0.9,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_045_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_045_file",
        label: "filé médio (100g)",
        weight: 100,
      },
    ],
    alternatives: ["taco_046", "taco_049", "food_tilapia"],
  },
  {
    id: "taco_046",
    name: "Filé de pescada cru",
    category: "Peixes e Frutos do Mar",
    nutrients: {
      calories: 89,
      protein: 16.6,
      fat: 2.2,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_046_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_046_file",
        label: "filé médio (100g)",
        weight: 100,
      },
    ],
  },
  {
    id: "taco_047",
    name: "Filé de salmão cru",
    category: "Peixes e Frutos do Mar",
    nutrients: {
      calories: 170,
      protein: 19.2,
      fat: 10.2,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_047_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_047_file",
        label: "filé médio (100g)",
        weight: 100,
      },
    ],
    alternatives: ["taco_041", "taco_049", "food_salmao"],
  },
  {
    id: "taco_048",
    name: "Sardinha assada",
    category: "Peixes e Frutos do Mar",
    nutrients: {
      calories: 164,
      protein: 32.0,
      fat: 3.9,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_048_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_048_unidade",
        label: "unidade (25g)",
        weight: 25,
      },
    ],
  },
  {
    id: "taco_049",
    name: "Filé de tilápia grelhado",
    category: "Peixes e Frutos do Mar",
    nutrients: {
      calories: 129,
      protein: 26.2,
      fat: 2.7,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_049_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_049_file",
        label: "filé médio (100g)",
        weight: 100,
      },
    ],
  },

  // Carnes e Derivados (Complemento)
  {
    id: "taco_050",
    name: "Contra-filé grelhado",
    category: "Carnes",
    nutrients: {
      calories: 239,
      protein: 32.3,
      fat: 12.0,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_050_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_050_bife",
        label: "bife médio (100g)",
        weight: 100,
      },
    ],
    alternatives: ["taco_052", "taco_065", "taco_053"],
  },
  {
    id: "taco_051",
    name: "Costela bovina assada",
    category: "Carnes",
    nutrients: {
      calories: 373,
      protein: 28.8,
      fat: 28.8,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_051_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_051_pedaco",
        label: "pedaço médio (100g)",
        weight: 100,
      },
    ],
  },
  {
    id: "taco_052",
    name: "Patinho grelhado sem gordura",
    category: "Carnes",
    nutrients: {
      calories: 219,
      protein: 35.9,
      fat: 7.3,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_052_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_052_bife",
        label: "bife médio (100g)",
        weight: 100,
      },
    ],
    alternatives: ["taco_050", "taco_065", "food_carne_bovina"],
  },
  {
    id: "taco_053",
    name: "Picanha grelhada",
    category: "Carnes",
    nutrients: {
      calories: 289,
      protein: 27.8,
      fat: 19.2,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_053_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_053_fatia",
        label: "fatia (100g)",
        weight: 100,
      },
    ],
    alternatives: ["taco_050", "taco_065", "food_picanha"],
  },
  {
    id: "taco_054",
    name: "Coxa de frango assada com pele",
    category: "Carnes",
    nutrients: {
      calories: 215,
      protein: 26.9,
      fat: 12.0,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_054_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_054_unidade",
        label: "unidade (65g)",
        weight: 65,
      },
    ],
    alternatives: ["taco_055", "taco_012", "food_frango_peito"],
  },
  {
    id: "taco_055",
    name: "Sobrecoxa de frango assada com pele",
    category: "Carnes",
    nutrients: {
      calories: 232,
      protein: 27.5,
      fat: 13.6,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_055_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_055_unidade",
        label: "unidade(80g)",
        weight: 80,
      },
    ],
    alternatives: ["taco_054", "taco_012", "food_frango_peito"],
  },
  {
    id: "taco_056",
    name: "Lombo suíno assado",
    category: "Carnes",
    nutrients: {
      calories: 210,
      protein: 31.8,
      fat: 8.8,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_056_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_056_fatia",
        label: "fatia (100g)",
        weight: 100,
      },
    ],
    alternatives: ["taco_057", "taco_058", "food_linguica"],
  },
  {
    id: "taco_057",
    name: "Pernil suíno assado",
    category: "Carnes",
    nutrients: {
      calories: 262,
      protein: 29.8,
      fat: 15.8,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_057_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_057_fatia",
        label: "fatia (100g)",
        weight: 100,
      },
    ],
    alternatives: ["taco_056", "taco_058", "taco_059"],
  },
  {
    id: "taco_058",
    name: "Costela suína assada",
    category: "Carnes",
    nutrients: {
      calories: 397,
      protein: 25.8,
      fat: 32.8,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_058_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_058_pedaco",
        label: "pedaço médio (100g)",
        weight: 100,
      },
    ],
    alternatives: ["taco_056", "taco_057", "taco_051"],
  },
  {
    id: "taco_059",
    name: "Pernil de cordeiro assado",
    category: "Carnes",
    nutrients: {
      calories: 235,
      protein: 28.5,
      fat: 13.2,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_059_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_059_fatia",
        label: "fatia (100g)",
        weight: 100,
      },
    ],
    alternatives: ["taco_057", "taco_056", "taco_052"],
  },

  // Cacau e Derivados
  {
    id: "taco_060",
    name: "Cacau em pó 50%",
    category: "Açúcares e Doces",
    nutrients: {
      calories: 350,
      protein: 20.0,
      fat: 12.0,
      carbs: 45.0,
      fiber: 10.0,
    },
    measures: [
      {
        id: "measure_taco_060_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_060_colher",
        label: "colher de sopa (10g)",
        weight: 10,
      },
      {
        id: "measure_taco_060_xicara",
        label: "xícara (85g)",
        weight: 85,
      },
    ],
    alternatives: ["taco_061", "taco_062"],
  },
  {
    id: "taco_061",
    name: "Cacau em pó 70%",
    category: "Açúcares e Doces",
    nutrients: {
      calories: 380,
      protein: 22.0,
      fat: 15.0,
      carbs: 40.0,
      fiber: 12.0,
    },
    measures: [
      {
        id: "measure_taco_061_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_061_colher",
        label: "colher de sopa (10g)",
        weight: 10,
      },
      {
        id: "measure_taco_061_xicara",
        label: "xícara (85g)",
        weight: 85,
      },
    ],
    alternatives: ["taco_060", "taco_062"],
  },
  {
    id: "taco_062",
    name: "Cacau em pó 100%",
    category: "Açúcares e Doces",
    nutrients: {
      calories: 410,
      protein: 25.0,
      fat: 18.0,
      carbs: 35.0,
      fiber: 15.0,
    },
    measures: [
      {
        id: "measure_taco_062_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_062_colher",
        label: "colher de sopa (10g)",
        weight: 10,
      },
      {
        id: "measure_taco_062_xicara",
        label: "xícara (85g)",
        weight: 85,
      },
    ],
    alternatives: ["taco_060", "taco_061"],
  },
  {
    id: "taco_064",
    name: "Clara de ovo cozida",
    category: "Ovos",
    nutrients: {
      calories: 57,
      protein: 12.6,
      fat: 0.0,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_064_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_064_unidade",
        label: "unidade (30g)",
        weight: 30,
        portionDescription: "1 clara",
      },
    ],
    alternatives: ["taco_013", "food_clara_ovo", "food_albumina"],
  },
  {
    id: "taco_065",
    name: "Filé mignon grelhado",
    category: "Carnes",
    nutrients: {
      calories: 214,
      protein: 32.8,
      fat: 8.8,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_065_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_065_bife",
        label: "bife médio (100g)",
        weight: 100,
      },
    ],
    alternatives: ["taco_050", "taco_052", "food_file_mignon"],
  },

  // Frutas
  {
    id: "taco_066",
    name: "Abacate cru",
    category: "Frutas",
    nutrients: {
      calories: 96,
      protein: 1.2,
      fat: 8.4,
      carbs: 6.0,
      fiber: 6.3,
    },
    measures: [
      {
        id: "measure_taco_066_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_066_colher",
        label: "colher de sopa (30g)",
        weight: 30,
      },
      {
        id: "measure_taco_066_unidade",
        label: "unidade média (170g)",
        weight: 170,
        portionDescription: "1 unidade média",
      },
    ],
    alternatives: ["taco_009", "taco_010", "food_abacate"],
  },

  // Proteínas Vegetais
  {
    id: "taco_067",
    name: "Tofu",
    category: "Proteínas Vegetais",
    nutrients: {
      calories: 76,
      protein: 8.1,
      fat: 4.8,
      carbs: 1.2,
      fiber: 1.1,
    },
    measures: [
      {
        id: "measure_taco_067_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_067_fatia",
        label: "fatia (40g)",
        weight: 40,
      },
      {
        id: "measure_taco_067_xicara",
        label: "xícara (140g)",
        weight: 140,
      },
    ],
    alternatives: ["taco_068", "taco_069", "food_proteina_vegetal"],
  },
  {
    id: "taco_068",
    name: "Proteína texturizada de soja",
    category: "Proteínas Vegetais",
    nutrients: {
      calories: 341,
      protein: 46.5,
      fat: 1.0,
      carbs: 35.3,
      fiber: 23.0,
    },
    measures: [
      {
        id: "measure_taco_068_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_068_xicara",
        label: "xícara (40g)",
        weight: 40,
      },
      {
        id: "measure_taco_068_colher",
        label: "colher de sopa (7g)",
        weight: 7,
      },
    ],
    alternatives: ["taco_067", "taco_069", "food_soja"],
  },
  {
    id: "taco_069",
    name: "Seitan (glúten de trigo)",
    category: "Proteínas Vegetais",
    nutrients: {
      calories: 118,
      protein: 24.0,
      fat: 1.9,
      carbs: 4.4,
      fiber: 0.8,
    },
    measures: [
      {
        id: "measure_taco_069_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_069_porcao",
        label: "porção (80g)",
        weight: 80,
      },
      {
        id: "measure_taco_069_fatia",
        label: "fatia (25g)",
        weight: 25,
      },
    ],
    alternatives: ["taco_067", "taco_068", "food_seitan"],
  },
  {
    id: "taco_070",
    name: "Tempeh",
    category: "Proteínas Vegetais",
    nutrients: {
      calories: 192,
      protein: 18.2,
      fat: 10.8,
      carbs: 9.4,
      fiber: 5.4,
    },
    measures: [
      {
        id: "measure_taco_070_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_070_fatia",
        label: "fatia (50g)",
        weight: 50,
      },
      {
        id: "measure_taco_070_xicara",
        label: "xícara (166g)",
        weight: 166,
      },
    ],
    alternatives: ["taco_067", "taco_068", "taco_069"],
  },

  // Leguminosas
  {
    id: "taco_071",
    name: "Lentilha cozida",
    category: "Leguminosas",
    nutrients: {
      calories: 93,
      protein: 6.3,
      fat: 0.5,
      carbs: 16.3,
      fiber: 7.9,
    },
    measures: [
      {
        id: "measure_taco_071_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_071_concha",
        label: "concha (80g)",
        weight: 80,
      },
      {
        id: "measure_taco_071_colher",
        label: "colher de sopa (20g)",
        weight: 20,
      },
    ],
    alternatives: ["taco_005", "taco_006", "taco_072"],
  },
  {
    id: "taco_072",
    name: "Grão-de-bico cozido",
    category: "Leguminosas",
    nutrients: {
      calories: 121,
      protein: 7.0,
      fat: 2.1,
      carbs: 19.7,
      fiber: 8.1,
    },
    measures: [
      {
        id: "measure_taco_072_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_072_concha",
        label: "concha (80g)",
        weight: 80,
      },
      {
        id: "measure_taco_072_colher",
        label: "colher de sopa (25g)",
        weight: 25,
      },
    ],
    alternatives: ["taco_005", "taco_006", "taco_071"],
  },

  // Grãos e Cereais
  {
    id: "taco_073",
    name: "Quinoa cozida",
    category: "Grãos e Cereais",
    nutrients: {
      calories: 120,
      protein: 4.4,
      fat: 1.9,
      carbs: 21.3,
      fiber: 2.8,
    },
    measures: [
      {
        id: "measure_taco_073_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_073_xicara",
        label: "xícara (170g)",
        weight: 170,
      },
      {
        id: "measure_taco_073_colher",
        label: "colher de sopa (20g)",
        weight: 20,
      },
    ],
    alternatives: ["taco_001", "taco_002", "food_quinoa"],
  },

  // Sementes e Oleaginosas
  {
    id: "taco_074",
    name: "Semente de chia",
    category: "Sementes e Oleaginosas",
    nutrients: {
      calories: 486,
      protein: 16.5,
      fat: 30.7,
      carbs: 42.1,
      fiber: 34.4,
    },
    measures: [
      {
        id: "measure_taco_074_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_074_colher",
        label: "colher de sopa (10g)",
        weight: 10,
      },
      {
        id: "measure_taco_074_colher_cha",
        label: "colher de chá (5g)",
        weight: 5,
      },
    ],
    alternatives: ["taco_075", "food_chia", "taco_031"],
  },
  {
    id: "taco_075",
    name: "Semente de linhaça",
    category: "Sementes e Oleaginosas",
    nutrients: {
      calories: 495,
      protein: 14.1,
      fat: 32.3,
      carbs: 43.3,
      fiber: 22.3,
    },
    measures: [
      {
        id: "measure_taco_075_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_075_colher",
        label: "colher de sopa (10g)",
        weight: 10,
      },
      {
        id: "measure_taco_075_colher_cha",
        label: "colher de chá (5g)",
        weight: 5,
      },
    ],
    alternatives: ["taco_074", "food_linhaca", "taco_031"],
  },

  // Açúcares e Doces
  {
    id: "taco_076",
    name: "Mel",
    category: "Açúcares e Doces",
    nutrients: {
      calories: 309,
      protein: 0.3,
      fat: 0.0,
      carbs: 84.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_076_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_076_colher",
        label: "colher de sopa (20g)",
        weight: 20,
      },
      {
        id: "measure_taco_076_colher_cha",
        label: "colher de chá (7g)",
        weight: 7,
      },
    ],
    alternatives: ["taco_016", "food_mel", "food_agave"],
  },
];
