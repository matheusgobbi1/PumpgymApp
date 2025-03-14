import { FoodData } from "../types/food";

// Alimentos da Tabela TACO (Tabela Brasileira de Composição de Alimentos)
// Fonte: https://www.nepa.unicamp.br/taco/
export const tacoFoods: FoodData[] = [
  // Cereais e derivados
  {
    id: "taco_001",
    name: "Arroz, tipo 1, cozido",
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
  },
  {
    id: "taco_002",
    name: "Arroz integral, cozido",
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
  },
  {
    id: "taco_003",
    name: "Pão francês",
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
      },
    ],
  },
  {
    id: "taco_004",
    name: "Macarrão, cozido",
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
  },

  // Leguminosas
  {
    id: "taco_005",
    name: "Feijão preto, cozido",
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
        label: "concha média (80g)",
        weight: 80,
      },
      {
        id: "measure_taco_005_xicara",
        label: "xícara (180g)",
        weight: 180,
      },
    ],
  },
  {
    id: "taco_006",
    name: "Feijão carioca, cozido",
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
        label: "concha média (80g)",
        weight: 80,
      },
      {
        id: "measure_taco_006_xicara",
        label: "xícara (180g)",
        weight: 180,
      },
    ],
  },

  // Hortaliças
  {
    id: "taco_007",
    name: "Alface, crespa, crua",
    nutrients: {
      calories: 11,
      protein: 1.3,
      fat: 0.2,
      carbs: 1.7,
      fiber: 1.8,
    },
    measures: [
      {
        id: "measure_taco_007_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_007_folha",
        label: "folha média (10g)",
        weight: 10,
      },
      {
        id: "measure_taco_007_prato",
        label: "prato (80g)",
        weight: 80,
      },
    ],
  },
  {
    id: "taco_008",
    name: "Tomate, com semente, cru",
    nutrients: {
      calories: 15,
      protein: 0.9,
      fat: 0.2,
      carbs: 3.1,
      fiber: 1.2,
    },
    measures: [
      {
        id: "measure_taco_008_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_008_unidade",
        label: "unidade média (90g)",
        weight: 90,
      },
      {
        id: "measure_taco_008_fatia",
        label: "fatia média (15g)",
        weight: 15,
      },
    ],
  },

  // Frutas
  {
    id: "taco_009",
    name: "Banana, prata",
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
        label: "unidade média (100g)",
        weight: 100,
      },
    ],
  },
  {
    id: "taco_010",
    name: "Laranja, pêra",
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
        label: "unidade média (130g)",
        weight: 130,
      },
    ],
  },

  // Carnes e ovos
  {
    id: "taco_011",
    name: "Carne bovina, acém, sem gordura, cozida",
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
  },
  {
    id: "taco_012",
    name: "Frango, peito, sem pele, cozido",
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
  },
  {
    id: "taco_013",
    name: "Ovo, de galinha, inteiro, cozido",
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
        label: "unidade média (50g)",
        weight: 50,
      },
    ],
  },

  // Leite e derivados
  {
    id: "taco_014",
    name: "Leite, de vaca, integral",
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
  },
  {
    id: "taco_015",
    name: "Queijo, minas, frescal",
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
        label: "fatia média (30g)",
        weight: 30,
      },
    ],
  },

  // Açúcares e doces
  {
    id: "taco_016",
    name: "Açúcar, refinado",
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

  // Óleos e gorduras
  {
    id: "taco_017",
    name: "Azeite, de oliva, extra virgem",
    nutrients: {
      calories: 884,
      protein: 0.0,
      fat: 100.0,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_taco_017_100g",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_taco_017_colher",
        label: "colher de sopa (10ml)",
        weight: 10,
      },
    ],
  },

  // Bebidas
  {
    id: "taco_018",
    name: "Café, infusão 10%",
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

  // Alimentos preparados
  {
    id: "taco_019",
    name: "Feijoada",
    nutrients: {
      calories: 117,
      protein: 6.6,
      fat: 5.1,
      carbs: 12.5,
      fiber: 5.1,
    },
    measures: [
      {
        id: "measure_taco_019_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_taco_019_concha",
        label: "concha média (140g)",
        weight: 140,
      },
    ],
  },
  {
    id: "taco_020",
    name: "Pão de queijo, assado",
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
        label: "unidade média (20g)",
        weight: 20,
      },
    ],
  },

  // Carnes Processadas
  {
    id: "taco_021",
    name: "Presunto, cozido",
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
        label: "fatia média (15g)",
        weight: 15,
      },
    ],
  },
  {
    id: "taco_022",
    name: "Mortadela",
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
        label: "fatia média (15g)",
        weight: 15,
      },
    ],
  },
  {
    id: "taco_023",
    name: "Salsicha",
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
        label: "unidade média (50g)",
        weight: 50,
      },
    ],
  },
  {
    id: "taco_024",
    name: "Linguiça, porco, crua",
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
  },
  {
    id: "taco_025",
    name: "Peito de peru, defumado",
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
  },

  // Farinhas e Derivados
  {
    id: "taco_026",
    name: "Farinha, de trigo, tipo 1",
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
  },
  {
    id: "taco_027",
    name: "Farinha, de mandioca, torrada",
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
  },
  {
    id: "taco_028",
    name: "Farinha, de milho, amarela",
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
  },
  {
    id: "taco_029",
    name: "Farinha, de centeio, integral",
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
  },
  {
    id: "taco_030",
    name: "Farinha, de aveia",
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
  },

  // Oleaginosas
  {
    id: "taco_031",
    name: "Amendoim, cru",
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
  },
  {
    id: "taco_032",
    name: "Castanha de caju, torrada, salgada",
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
    name: "Castanha do Pará, crua",
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
        label: "unidade média (5g)",
        weight: 5,
      },
      {
        id: "measure_taco_033_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
    ],
  },
  {
    id: "taco_034",
    name: "Amêndoa, crua",
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
    name: "Noz, crua",
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
    name: "Apresuntado",
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
        label: "fatia média (15g)",
        weight: 15,
      },
    ],
  },
  {
    id: "taco_037",
    name: "Bacon, defumado",
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
        label: "fatia média (15g)",
        weight: 15,
      },
    ],
  },
  {
    id: "taco_038",
    name: "Copa (tipo salame)",
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
    name: "Linguiça, frango, crua",
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
    name: "Salame",
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
    name: "Atum, fresco, cru",
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
        label: "posta média (100g)",
        weight: 100,
      },
    ],
  },
  {
    id: "taco_042",
    name: "Bacalhau, salgado, cru",
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
        label: "posta média (120g)",
        weight: 120,
      },
    ],
  },
  {
    id: "taco_043",
    name: "Cação, posta, cozida",
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
        label: "posta média (100g)",
        weight: 100,
      },
    ],
  },
  {
    id: "taco_044",
    name: "Camarão, cozido",
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
        label: "unidade média (8g)",
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
    name: "Merluza, filé, cozido",
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
  },
  {
    id: "taco_046",
    name: "Pescada, filé, cru",
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
    name: "Salmão, filé, cru",
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
  },
  {
    id: "taco_048",
    name: "Sardinha, assada",
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
        label: "unidade média (25g)",
        weight: 25,
      },
    ],
  },
  {
    id: "taco_049",
    name: "Tilápia, filé, cru",
    nutrients: {
      calories: 96,
      protein: 20.1,
      fat: 1.3,
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
    name: "Carne bovina, contra-filé, grelhado",
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
  },
  {
    id: "taco_051",
    name: "Carne bovina, costela, assada",
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
    name: "Carne bovina, patinho, sem gordura, grelhado",
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
  },
  {
    id: "taco_053",
    name: "Carne bovina, picanha, grelhada",
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
        label: "fatia média (100g)",
        weight: 100,
      },
    ],
  },
  {
    id: "taco_054",
    name: "Frango, coxa, com pele, assada",
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
        label: "unidade média (65g)",
        weight: 65,
      },
    ],
  },
  {
    id: "taco_055",
    name: "Frango, sobrecoxa, com pele, assada",
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
        label: "unidade média (80g)",
        weight: 80,
      },
    ],
  },
  {
    id: "taco_056",
    name: "Carne suína, lombo, assado",
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
        label: "fatia média (100g)",
        weight: 100,
      },
    ],
  },
  {
    id: "taco_057",
    name: "Carne suína, pernil, assado",
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
        label: "fatia média (100g)",
        weight: 100,
      },
    ],
  },
  {
    id: "taco_058",
    name: "Carne suína, costela, assada",
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
  },
  {
    id: "taco_059",
    name: "Cordeiro, pernil, assado",
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
        label: "fatia média (100g)",
        weight: 100,
      },
    ],
  },
];
