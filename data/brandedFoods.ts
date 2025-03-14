import { FoodData } from "../types/food";

// Alimentos de marcas específicas para o banco de dados
export const brandedFoods: FoodData[] = [
  // Pães
  {
    id: "brand_pao_wickbold_integral",
    name: "Pão Integral Wickbold",
    nutrients: {
      calories: 122,
      protein: 6.3,
      fat: 1.7,
      carbs: 20.0,
      fiber: 3.5,
    },
    measures: [
      {
        id: "measure_pao_wickbold_integral_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_wickbold_integral_fatia",
        label: "fatia (25g)",
        weight: 25,
      },
      {
        id: "measure_pao_wickbold_integral_porcao",
        label: "porção (50g - 2 fatias)",
        weight: 50,
      },
    ],
  },
  {
    id: "brand_pao_pullman_tradicional",
    name: "Pão de Forma Tradicional Pullman",
    nutrients: {
      calories: 130,
      protein: 4.5,
      fat: 2.5,
      carbs: 24.0,
      fiber: 1.8,
    },
    measures: [
      {
        id: "measure_pao_pullman_tradicional_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_pullman_tradicional_fatia",
        label: "fatia (25g)",
        weight: 25,
      },
    ],
  },
  {
    id: "brand_pao_visconti_7graos",
    name: "Pão 7 Grãos Visconti",
    nutrients: {
      calories: 125,
      protein: 7.0,
      fat: 2.2,
      carbs: 21.0,
      fiber: 4.5,
    },
    measures: [
      {
        id: "measure_pao_visconti_7graos_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_visconti_7graos_fatia",
        label: "fatia (25g)",
        weight: 25,
      },
    ],
  },
  {
    id: "brand_pao_nutrella_12graos",
    name: "Pão 12 Grãos Nutrella",
    nutrients: {
      calories: 128,
      protein: 7.2,
      fat: 2.5,
      carbs: 20.5,
      fiber: 5.0,
    },
    measures: [
      {
        id: "measure_pao_nutrella_12graos_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_nutrella_12graos_fatia",
        label: "fatia (25g)",
        weight: 25,
      },
    ],
  },
  {
    id: "brand_pao_panco_brioche",
    name: "Pão Brioche Panco",
    nutrients: {
      calories: 310,
      protein: 8.0,
      fat: 9.0,
      carbs: 50.0,
      fiber: 2.0,
    },
    measures: [
      {
        id: "measure_pao_panco_brioche_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_panco_brioche_fatia",
        label: "fatia (30g)",
        weight: 30,
      },
    ],
  },
  {
    id: "brand_pao_bauduco_australiano",
    name: "Pão Australiano Bauduco",
    nutrients: {
      calories: 290,
      protein: 9.0,
      fat: 6.0,
      carbs: 52.0,
      fiber: 3.0,
    },
    measures: [
      {
        id: "measure_pao_bauduco_australiano_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_bauduco_australiano_fatia",
        label: "fatia (25g)",
        weight: 25,
      },
    ],
  },
  {
    id: "brand_pao_wickbold_12graos",
    name: "Pão 12 Grãos Wickbold",
    nutrients: {
      calories: 124,
      protein: 6.8,
      fat: 2.0,
      carbs: 21.0,
      fiber: 4.2,
    },
    measures: [
      {
        id: "measure_pao_wickbold_12graos_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_wickbold_12graos_fatia",
        label: "fatia (25g)",
        weight: 25,
      },
    ],
  },
  {
    id: "brand_pao_pullman_centeio",
    name: "Pão de Centeio Pullman",
    nutrients: {
      calories: 120,
      protein: 4.8,
      fat: 1.5,
      carbs: 23.0,
      fiber: 2.5,
    },
    measures: [
      {
        id: "measure_pao_pullman_centeio_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_pullman_centeio_fatia",
        label: "fatia (25g)",
        weight: 25,
      },
    ],
  },
  {
    id: "brand_pao_panco_integral_light",
    name: "Pão Integral Light Panco",
    nutrients: {
      calories: 110,
      protein: 5.2,
      fat: 1.2,
      carbs: 20.0,
      fiber: 3.0,
    },
    measures: [
      {
        id: "measure_pao_panco_integral_light_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_panco_integral_light_fatia",
        label: "fatia (25g)",
        weight: 25,
      },
    ],
  },

  // Novas marcas de pão
  {
    id: "brand_pao_wickbold_sem_gluten",
    name: "Pão Sem Glúten Wickbold",
    nutrients: {
      calories: 240,
      protein: 3.2,
      fat: 5.1,
      carbs: 46.0,
      fiber: 2.8,
    },
    measures: [
      {
        id: "measure_pao_wickbold_sem_gluten_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_wickbold_sem_gluten_fatia",
        label: "fatia (30g)",
        weight: 30,
      },
      {
        id: "measure_pao_wickbold_sem_gluten_pacote",
        label: "pacote (300g)",
        weight: 300,
      },
    ],
  },
  {
    id: "brand_pao_seven_boys_milho",
    name: "Pão de Milho Seven Boys",
    nutrients: {
      calories: 265,
      protein: 7.5,
      fat: 3.8,
      carbs: 51.0,
      fiber: 2.2,
    },
    measures: [
      {
        id: "measure_pao_seven_boys_milho_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_seven_boys_milho_fatia",
        label: "fatia (25g)",
        weight: 25,
      },
      {
        id: "measure_pao_seven_boys_milho_unidade",
        label: "unidade (500g)",
        weight: 500,
      },
    ],
  },
  {
    id: "brand_pao_artesano_pullman",
    name: "Pão Artesano Pullman",
    nutrients: {
      calories: 278,
      protein: 8.0,
      fat: 4.2,
      carbs: 52.0,
      fiber: 1.9,
    },
    measures: [
      {
        id: "measure_pao_artesano_pullman_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_artesano_pullman_fatia",
        label: "fatia (35g)",
        weight: 35,
      },
      {
        id: "measure_pao_artesano_pullman_pacote",
        label: "pacote (500g)",
        weight: 500,
      },
    ],
  },
  {
    id: "brand_pao_forma_integral_plusvita",
    name: "Pão de Forma Integral PlusVita",
    nutrients: {
      calories: 118,
      protein: 6.0,
      fat: 1.8,
      carbs: 21.0,
      fiber: 3.8,
    },
    measures: [
      {
        id: "measure_pao_forma_integral_plusvita_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_forma_integral_plusvita_fatia",
        label: "fatia (25g)",
        weight: 25,
      },
      {
        id: "measure_pao_forma_integral_plusvita_pacote",
        label: "pacote (500g)",
        weight: 500,
      },
    ],
  },
  {
    id: "brand_pao_sirio_sadia",
    name: "Pão Sírio Sadia",
    nutrients: {
      calories: 270,
      protein: 9.0,
      fat: 1.5,
      carbs: 56.0,
      fiber: 2.0,
    },
    measures: [
      {
        id: "measure_pao_sirio_sadia_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_sirio_sadia_unidade",
        label: "unidade (75g)",
        weight: 75,
      },
      {
        id: "measure_pao_sirio_sadia_pacote",
        label: "pacote (300g - 4 unidades)",
        weight: 300,
      },
    ],
  },
  {
    id: "brand_pao_hamburguer_panco",
    name: "Pão de Hambúrguer Panco",
    nutrients: {
      calories: 300,
      protein: 8.5,
      fat: 5.0,
      carbs: 54.0,
      fiber: 2.2,
    },
    measures: [
      {
        id: "measure_pao_hamburguer_panco_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_hamburguer_panco_unidade",
        label: "unidade (50g)",
        weight: 50,
      },
      {
        id: "measure_pao_hamburguer_panco_pacote",
        label: "pacote (300g - 6 unidades)",
        weight: 300,
      },
    ],
  },
  {
    id: "brand_pao_frances_congelado_forno_minas",
    name: "Pão Francês Congelado Forno de Minas",
    nutrients: {
      calories: 300,
      protein: 8.0,
      fat: 3.0,
      carbs: 59.0,
      fiber: 2.5,
    },
    measures: [
      {
        id: "measure_pao_frances_congelado_forno_minas_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_frances_congelado_forno_minas_unidade",
        label: "unidade (50g)",
        weight: 50,
      },
      {
        id: "measure_pao_frances_congelado_forno_minas_pacote",
        label: "pacote (500g - 10 unidades)",
        weight: 500,
      },
    ],
  },
  {
    id: "brand_pao_bisnaguinha_pullman",
    name: "Pão Bisnaguinha Pullman",
    nutrients: {
      calories: 310,
      protein: 8.0,
      fat: 6.0,
      carbs: 56.0,
      fiber: 1.8,
    },
    measures: [
      {
        id: "measure_pao_bisnaguinha_pullman_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_bisnaguinha_pullman_unidade",
        label: "unidade (20g)",
        weight: 20,
      },
      {
        id: "measure_pao_bisnaguinha_pullman_pacote",
        label: "pacote (300g - 15 unidades)",
        weight: 300,
      },
    ],
  },
  {
    id: "brand_pao_hot_dog_wickbold",
    name: "Pão de Hot Dog Wickbold",
    nutrients: {
      calories: 290,
      protein: 8.0,
      fat: 4.5,
      carbs: 53.0,
      fiber: 2.0,
    },
    measures: [
      {
        id: "measure_pao_hot_dog_wickbold_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_hot_dog_wickbold_unidade",
        label: "unidade (50g)",
        weight: 50,
      },
      {
        id: "measure_pao_hot_dog_wickbold_pacote",
        label: "pacote (350g - 7 unidades)",
        weight: 350,
      },
    ],
  },
  {
    id: "brand_pao_ciabatta_bauducco",
    name: "Pão Ciabatta Bauducco",
    nutrients: {
      calories: 295,
      protein: 9.5,
      fat: 3.8,
      carbs: 56.0,
      fiber: 2.5,
    },
    measures: [
      {
        id: "measure_pao_ciabatta_bauducco_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pao_ciabatta_bauducco_unidade",
        label: "unidade (80g)",
        weight: 80,
      },
      {
        id: "measure_pao_ciabatta_bauducco_pacote",
        label: "pacote (320g - 4 unidades)",
        weight: 320,
      },
    ],
  },

  // Whey Protein
  {
    id: "brand_whey_growth_chocolate",
    name: "Whey Protein Growth Chocolate",
    nutrients: {
      calories: 112,
      protein: 24.0,
      fat: 1.5,
      carbs: 3.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_whey_growth_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_whey_growth_chocolate_scoop",
        label: "scoop (30g)",
        weight: 30,
      },
    ],
  },
  {
    id: "brand_whey_integralmedica_baunilha",
    name: "Whey Protein Integral Médica Baunilha",
    nutrients: {
      calories: 114,
      protein: 25.0,
      fat: 1.0,
      carbs: 2.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_whey_integralmedica_baunilha_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_whey_integralmedica_baunilha_scoop",
        label: "scoop (30g)",
        weight: 30,
      },
    ],
  },
  {
    id: "brand_whey_maxTitanium_morango",
    name: "Whey Protein Max Titanium Morango",
    nutrients: {
      calories: 135,
      protein: 25.5,
      fat: 1.2,
      carbs: 2.5,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_whey_maxTitanium_morango_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_whey_maxTitanium_morango_scoop",
        label: "scoop (30g)",
        weight: 30,
      },
      {
        id: "measure_whey_maxTitanium_morango_porcao",
        label: "porção (40g)",
        weight: 40,
      },
    ],
  },
  {
    id: "brand_whey_blackSkull_cookies",
    name: "Whey Protein Black Skull Cookies",
    nutrients: {
      calories: 122,
      protein: 24.0,
      fat: 1.8,
      carbs: 3.5,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_whey_blackSkull_cookies_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_whey_blackSkull_cookies_scoop",
        label: "scoop (30g)",
        weight: 30,
      },
    ],
  },
  {
    id: "brand_whey_darkness_chocolate",
    name: "Whey Protein Darkness Chocolate",
    nutrients: {
      calories: 125,
      protein: 23.0,
      fat: 2.0,
      carbs: 4.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_whey_darkness_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_whey_darkness_chocolate_scoop",
        label: "scoop (30g)",
        weight: 30,
      },
    ],
  },
  {
    id: "brand_whey_max_titanium_chocolate",
    name: "Whey Protein Max Titanium Chocolate",
    nutrients: {
      calories: 120,
      protein: 25.0,
      fat: 1.5,
      carbs: 3.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_whey_max_titanium_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_whey_max_titanium_chocolate_scoop",
        label: "scoop (30g)",
        weight: 30,
      },
      {
        id: "measure_whey_max_titanium_chocolate_porcao",
        label: "porção (40g)",
        weight: 40,
      },
    ],
  },
  {
    id: "brand_whey_probiotica_baunilha",
    name: "Whey Protein Probiótica Baunilha",
    nutrients: {
      calories: 120,
      protein: 24.0,
      fat: 1.8,
      carbs: 3.2,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_whey_probiotica_baunilha_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_whey_probiotica_baunilha_scoop",
        label: "scoop (30g)",
        weight: 30,
      },
    ],
  },
  {
    id: "brand_whey_dymatize_iso100_chocolate",
    name: "Whey Protein Dymatize ISO-100 Chocolate",
    nutrients: {
      calories: 116,
      protein: 25.0,
      fat: 0.5,
      carbs: 2.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_whey_dymatize_iso100_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_whey_dymatize_iso100_chocolate_scoop",
        label: "scoop (32g)",
        weight: 32,
      },
    ],
  },

  // Novas marcas de Whey Protein
  {
    id: "brand_whey_optimum_nutrition_gold_standard",
    name: "Whey Protein Optimum Nutrition Gold Standard",
    nutrients: {
      calories: 120,
      protein: 24.0,
      fat: 1.5,
      carbs: 3.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_whey_optimum_nutrition_gold_standard_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_whey_optimum_nutrition_gold_standard_scoop",
        label: "scoop (30g)",
        weight: 30,
      },
      {
        id: "measure_whey_optimum_nutrition_gold_standard_porcao",
        label: "porção (40g)",
        weight: 40,
      },
    ],
  },
  {
    id: "brand_whey_essential_nutrition_chocolate",
    name: "Whey Protein Essential Nutrition Chocolate",
    nutrients: {
      calories: 118,
      protein: 25.0,
      fat: 1.2,
      carbs: 2.5,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_whey_essential_nutrition_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_whey_essential_nutrition_chocolate_scoop",
        label: "scoop (30g)",
        weight: 30,
      },
      {
        id: "measure_whey_essential_nutrition_chocolate_sachê",
        label: "sachê (35g)",
        weight: 35,
      },
    ],
  },
  {
    id: "brand_whey_dux_nutrition_baunilha",
    name: "Whey Protein Dux Nutrition Baunilha",
    nutrients: {
      calories: 115,
      protein: 24.5,
      fat: 1.0,
      carbs: 2.8,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_whey_dux_nutrition_baunilha_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_whey_dux_nutrition_baunilha_scoop",
        label: "scoop (30g)",
        weight: 30,
      },
    ],
  },
  {
    id: "brand_whey_athletica_nutrition_morango",
    name: "Whey Protein Athletica Nutrition Morango",
    nutrients: {
      calories: 122,
      protein: 23.0,
      fat: 1.8,
      carbs: 3.5,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_whey_athletica_nutrition_morango_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_whey_athletica_nutrition_morango_scoop",
        label: "scoop (30g)",
        weight: 30,
      },
      {
        id: "measure_whey_athletica_nutrition_morango_sachê",
        label: "sachê (35g)",
        weight: 35,
      },
    ],
  },
  {
    id: "brand_whey_muscle_pharm_combat_cookies",
    name: "Whey Protein MusclePharm Combat Cookies",
    nutrients: {
      calories: 130,
      protein: 25.0,
      fat: 1.5,
      carbs: 4.0,
      fiber: 0.5,
    },
    measures: [
      {
        id: "measure_whey_muscle_pharm_combat_cookies_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_whey_muscle_pharm_combat_cookies_scoop",
        label: "scoop (34g)",
        weight: 34,
      },
    ],
  },
  {
    id: "brand_whey_syntha6_bsn_chocolate",
    name: "Whey Protein Syntha-6 BSN Chocolate",
    nutrients: {
      calories: 140,
      protein: 22.0,
      fat: 2.0,
      carbs: 6.0,
      fiber: 1.0,
    },
    measures: [
      {
        id: "measure_whey_syntha6_bsn_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_whey_syntha6_bsn_chocolate_scoop",
        label: "scoop (47g)",
        weight: 47,
      },
    ],
  },
  {
    id: "brand_whey_iso_pure_zero_carb_baunilha",
    name: "Whey Protein Isopure Zero Carb Baunilha",
    nutrients: {
      calories: 110,
      protein: 25.0,
      fat: 0.5,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_whey_iso_pure_zero_carb_baunilha_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_whey_iso_pure_zero_carb_baunilha_scoop",
        label: "scoop (31g)",
        weight: 31,
      },
    ],
  },
  {
    id: "brand_whey_nutrata_isolate_chocolate",
    name: "Whey Protein Nutrata Isolate Chocolate",
    nutrients: {
      calories: 112,
      protein: 27.0,
      fat: 0.3,
      carbs: 1.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_whey_nutrata_isolate_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_whey_nutrata_isolate_chocolate_scoop",
        label: "scoop (30g)",
        weight: 30,
      },
    ],
  },
  {
    id: "brand_whey_new_millen_iso_protein_cookies",
    name: "Whey Protein New Millen Iso Protein Cookies",
    nutrients: {
      calories: 114,
      protein: 26.0,
      fat: 0.8,
      carbs: 1.5,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_whey_new_millen_iso_protein_cookies_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_whey_new_millen_iso_protein_cookies_scoop",
        label: "scoop (30g)",
        weight: 30,
      },
      {
        id: "measure_whey_new_millen_iso_protein_cookies_sachê",
        label: "sachê (35g)",
        weight: 35,
      },
    ],
  },
  {
    id: "brand_whey_vitafor_isowhey_baunilha",
    name: "Whey Protein Vitafor IsoWhey Baunilha",
    nutrients: {
      calories: 113,
      protein: 25.5,
      fat: 0.6,
      carbs: 1.8,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_whey_vitafor_isowhey_baunilha_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_whey_vitafor_isowhey_baunilha_scoop",
        label: "scoop (30g)",
        weight: 30,
      },
      {
        id: "measure_whey_vitafor_isowhey_baunilha_sachê",
        label: "sachê (40g)",
        weight: 40,
      },
    ],
  },

  // Pasta de Amendoim
  {
    id: "brand_pasta_amendoim_drpeanut_tradicional",
    name: "Pasta de Amendoim Dr. Peanut Tradicional",
    nutrients: {
      calories: 600,
      protein: 25.0,
      fat: 50.0,
      carbs: 16.0,
      fiber: 8.0,
    },
    measures: [
      {
        id: "measure_pasta_amendoim_drpeanut_tradicional_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pasta_amendoim_drpeanut_tradicional_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
    ],
  },
  {
    id: "brand_pasta_amendoim_powerone_chocolate",
    name: "Pasta de Amendoim Power One Chocolate",
    nutrients: {
      calories: 580,
      protein: 23.0,
      fat: 48.0,
      carbs: 20.0,
      fiber: 6.0,
    },
    measures: [
      {
        id: "measure_pasta_amendoim_powerone_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pasta_amendoim_powerone_chocolate_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
    ],
  },
  {
    id: "brand_pasta_amendoim_vitapower_chocolate",
    name: "Pasta de Amendoim Vita Power Chocolate",
    nutrients: {
      calories: 590,
      protein: 24.0,
      fat: 49.0,
      carbs: 18.0,
      fiber: 7.0,
    },
    measures: [
      {
        id: "measure_pasta_amendoim_vitapower_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pasta_amendoim_vitapower_chocolate_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
    ],
  },
  {
    id: "brand_pasta_amendoim_mandubim_cookies",
    name: "Pasta de Amendoim Mandubim Cookies",
    nutrients: {
      calories: 585,
      protein: 23.0,
      fat: 48.0,
      carbs: 19.0,
      fiber: 6.5,
    },
    measures: [
      {
        id: "measure_pasta_amendoim_mandubim_cookies_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_pasta_amendoim_mandubim_cookies_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
    ],
  },

  // Granolas
  {
    id: "brand_granola_maeterra_tradicional",
    name: "Granola Tradicional Mãe Terra",
    nutrients: {
      calories: 430,
      protein: 10.0,
      fat: 14.0,
      carbs: 68.0,
      fiber: 9.0,
    },
    measures: [
      {
        id: "measure_granola_maeterra_tradicional_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_granola_maeterra_tradicional_xicara",
        label: "xícara (40g)",
        weight: 40,
      },
    ],
  },
  {
    id: "brand_granola_kelloggs_frutas",
    name: "Granola com Frutas Kellogg's",
    nutrients: {
      calories: 380,
      protein: 8.0,
      fat: 10.0,
      carbs: 70.0,
      fiber: 7.0,
    },
    measures: [
      {
        id: "measure_granola_kelloggs_frutas_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_granola_kelloggs_frutas_xicara",
        label: "xícara (40g)",
        weight: 40,
      },
    ],
  },

  // Bebidas
  {
    id: "brand_bebida_gatorade_laranja",
    name: "Gatorade Sabor Laranja",
    nutrients: {
      calories: 32,
      protein: 0.0,
      fat: 0.0,
      carbs: 8.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_gatorade_laranja_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_gatorade_laranja_garrafa",
        label: "garrafa (500ml)",
        weight: 500,
      },
    ],
  },
  {
    id: "brand_bebida_redbull_tradicional",
    name: "Red Bull Energy Drink",
    nutrients: {
      calories: 45,
      protein: 0.0,
      fat: 0.0,
      carbs: 11.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_redbull_tradicional_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_redbull_tradicional_lata",
        label: "lata (250ml)",
        weight: 250,
      },
    ],
  },
  {
    id: "brand_bebida_yopro_morango",
    name: "Iogurte YoPRO Morango",
    nutrients: {
      calories: 53,
      protein: 9.5,
      fat: 0.0,
      carbs: 3.5,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_yopro_morango_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_bebida_yopro_morango_pote",
        label: "pote (160g)",
        weight: 160,
      },
    ],
  },
  {
    id: "brand_bebida_yopro_banana",
    name: "Iogurte YoPRO Banana",
    nutrients: {
      calories: 55,
      protein: 9.5,
      fat: 0.0,
      carbs: 4.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_yopro_banana_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_bebida_yopro_banana_pote",
        label: "pote (160g)",
        weight: 160,
      },
    ],
  },
  {
    id: "brand_bebida_whey_shake_chocolate",
    name: "Whey Shake Chocolate",
    nutrients: {
      calories: 110,
      protein: 15.0,
      fat: 3.0,
      carbs: 8.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_whey_shake_chocolate_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_whey_shake_chocolate_garrafa",
        label: "garrafa (250ml)",
        weight: 250,
      },
    ],
  },
  {
    id: "brand_bebida_whey_zero_morango",
    name: "Whey Zero Bebida Láctea Morango",
    nutrients: {
      calories: 85,
      protein: 15.0,
      fat: 0.0,
      carbs: 6.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_whey_zero_morango_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_whey_zero_morango_garrafa",
        label: "garrafa (250ml)",
        weight: 250,
      },
    ],
  },
  {
    id: "brand_bebida_wheyfer_chocolate",
    name: "Wheyfer Bebida Láctea Chocolate",
    nutrients: {
      calories: 130,
      protein: 18.0,
      fat: 2.5,
      carbs: 12.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_wheyfer_chocolate_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_wheyfer_chocolate_garrafa",
        label: "garrafa (250ml)",
        weight: 250,
      },
    ],
  },
  {
    id: "brand_leite_piracanjuba_desnatado",
    name: "Leite Desnatado Piracanjuba",
    nutrients: {
      calories: 34,
      protein: 3.1,
      fat: 0.35,
      carbs: 4.6,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_leite_piracanjuba_desnatado_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_leite_piracanjuba_desnatado_copo",
        label: "copo (200ml)",
        weight: 200,
      },
      {
        id: "measure_leite_piracanjuba_desnatado_litro",
        label: "litro (1000ml)",
        weight: 1000,
      },
    ],
  },

  // Barras de Proteína
  {
    id: "brand_barra_proteina_integralmedica_chocolate",
    name: "Barra de Proteína Integral Médica Chocolate",
    nutrients: {
      calories: 190,
      protein: 14.0,
      fat: 7.7,
      carbs: 17.0,
      fiber: 2.9,
    },
    measures: [
      {
        id: "measure_barra_proteina_integralmedica_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_integralmedica_chocolate_unidade",
        label: "unidade (45g)",
        weight: 45,
      },
    ],
  },
  {
    id: "brand_barra_proteina_vo2_chocolate",
    name: "Barra de Proteína VO2 Chocolate",
    nutrients: {
      calories: 112,
      protein: 9.0,
      fat: 3.5,
      carbs: 13.0,
      fiber: 1.6,
    },
    measures: [
      {
        id: "measure_barra_proteina_vo2_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_vo2_chocolate_unidade",
        label: "unidade (30g)",
        weight: 30,
      },
    ],
  },
  {
    id: "brand_barra_proteina_probiotica_cookies",
    name: "Barra de Proteína Probiótica Cookies",
    nutrients: {
      calories: 230,
      protein: 18.0,
      fat: 9.0,
      carbs: 24.0,
      fiber: 1.5,
    },
    measures: [
      {
        id: "measure_barra_proteina_probiotica_cookies_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_probiotica_cookies_unidade",
        label: "unidade (33g)",
        weight: 33,
      },
    ],
  },
  {
    id: "brand_barra_proteina_max_titanium_chocolate",
    name: "Barra de Proteína Max Titanium Chocolate",
    nutrients: {
      calories: 200,
      protein: 20.0,
      fat: 8.0,
      carbs: 15.0,
      fiber: 2.0,
    },
    measures: [
      {
        id: "measure_barra_proteina_max_titanium_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_max_titanium_chocolate_unidade",
        label: "unidade (40g)",
        weight: 40,
      },
    ],
  },
  {
    id: "brand_barra_proteina_darkness_cookies",
    name: "Barra de Proteína Darkness Cookies",
    nutrients: {
      calories: 210,
      protein: 16.0,
      fat: 7.5,
      carbs: 22.0,
      fiber: 1.8,
    },
    measures: [
      {
        id: "measure_barra_proteina_darkness_cookies_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_darkness_cookies_unidade",
        label: "unidade (45g)",
        weight: 45,
      },
    ],
  },
  {
    id: "brand_barra_proteina_protein_crisp_peanut",
    name: "Barra de Proteína Protein Crisp Peanut Butter",
    nutrients: {
      calories: 180,
      protein: 15.0,
      fat: 6.0,
      carbs: 19.0,
      fiber: 2.5,
    },
    measures: [
      {
        id: "measure_barra_proteina_protein_crisp_peanut_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_protein_crisp_peanut_unidade",
        label: "unidade (45g)",
        weight: 45,
      },
    ],
  },
  {
    id: "brand_barra_proteina_protein_crisp_chocolate",
    name: "Barra de Proteína Protein Crisp Chocolate",
    nutrients: {
      calories: 175,
      protein: 15.0,
      fat: 5.5,
      carbs: 19.0,
      fiber: 2.3,
    },
    measures: [
      {
        id: "measure_barra_proteina_protein_crisp_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_protein_crisp_chocolate_unidade",
        label: "unidade (45g)",
        weight: 45,
      },
    ],
  },
  {
    id: "brand_barra_proteina_integralmedica_best_whey_chocolate",
    name: "Barra de Proteína Best Whey Integral Médica Chocolate",
    nutrients: {
      calories: 140,
      protein: 12.0,
      fat: 4.5,
      carbs: 16.0,
      fiber: 1.8,
    },
    measures: [
      {
        id: "measure_barra_proteina_integralmedica_best_whey_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_integralmedica_best_whey_chocolate_unidade",
        label: "unidade (32g)",
        weight: 32,
      },
    ],
  },
  {
    id: "brand_barra_proteina_integralmedica_best_whey_coco",
    name: "Barra de Proteína Best Whey Integral Médica Coco",
    nutrients: {
      calories: 138,
      protein: 12.0,
      fat: 4.3,
      carbs: 16.0,
      fiber: 1.7,
    },
    measures: [
      {
        id: "measure_barra_proteina_integralmedica_best_whey_coco_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_integralmedica_best_whey_coco_unidade",
        label: "unidade (32g)",
        weight: 32,
      },
    ],
  },
  {
    id: "brand_barra_proteina_battle_snacks_cookies",
    name: "Barra de Proteína Battle Snacks Cookies & Cream",
    nutrients: {
      calories: 205,
      protein: 20.0,
      fat: 7.0,
      carbs: 17.0,
      fiber: 2.5,
    },
    measures: [
      {
        id: "measure_barra_proteina_battle_snacks_cookies_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_battle_snacks_cookies_unidade",
        label: "unidade (60g)",
        weight: 60,
      },
    ],
  },
  {
    id: "brand_barra_proteina_battle_snacks_chocolate",
    name: "Barra de Proteína Battle Snacks Chocolate",
    nutrients: {
      calories: 200,
      protein: 20.0,
      fat: 6.5,
      carbs: 17.0,
      fiber: 2.3,
    },
    measures: [
      {
        id: "measure_barra_proteina_battle_snacks_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_battle_snacks_chocolate_unidade",
        label: "unidade (60g)",
        weight: 60,
      },
    ],
  },
  {
    id: "brand_barra_proteina_ohyeah_chocolate",
    name: "Barra de Proteína Oh Yeah! Chocolate",
    nutrients: {
      calories: 230,
      protein: 20.0,
      fat: 8.0,
      carbs: 22.0,
      fiber: 1.0,
    },
    measures: [
      {
        id: "measure_barra_proteina_ohyeah_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_ohyeah_chocolate_unidade",
        label: "unidade (60g)",
        weight: 60,
      },
    ],
  },
  {
    id: "brand_barra_proteina_ohyeah_cookies",
    name: "Barra de Proteína Oh Yeah! Cookies & Cream",
    nutrients: {
      calories: 235,
      protein: 20.0,
      fat: 8.5,
      carbs: 22.0,
      fiber: 1.0,
    },
    measures: [
      {
        id: "measure_barra_proteina_ohyeah_cookies_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_ohyeah_cookies_unidade",
        label: "unidade (60g)",
        weight: 60,
      },
    ],
  },
  {
    id: "brand_barra_proteina_quest_chocolate",
    name: "Barra de Proteína Quest Chocolate Chip Cookie Dough",
    nutrients: {
      calories: 190,
      protein: 21.0,
      fat: 8.0,
      carbs: 21.0,
      fiber: 14.0,
    },
    measures: [
      {
        id: "measure_barra_proteina_quest_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_quest_chocolate_unidade",
        label: "unidade (60g)",
        weight: 60,
      },
    ],
  },
  {
    id: "brand_barra_proteina_quest_cookies",
    name: "Barra de Proteína Quest Cookies & Cream",
    nutrients: {
      calories: 180,
      protein: 20.0,
      fat: 7.0,
      carbs: 22.0,
      fiber: 14.0,
    },
    measures: [
      {
        id: "measure_barra_proteina_quest_cookies_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_quest_cookies_unidade",
        label: "unidade (60g)",
        weight: 60,
      },
    ],
  },
  {
    id: "brand_barra_proteina_max_titanium_cookies",
    name: "Barra de Proteína Max Titanium Cookies & Cream",
    nutrients: {
      calories: 205,
      protein: 20.0,
      fat: 8.5,
      carbs: 15.0,
      fiber: 2.0,
    },
    measures: [
      {
        id: "measure_barra_proteina_max_titanium_cookies_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_max_titanium_cookies_unidade",
        label: "unidade (40g)",
        weight: 40,
      },
    ],
  },
  {
    id: "brand_barra_proteina_darkness_chocolate",
    name: "Barra de Proteína Darkness Chocolate",
    nutrients: {
      calories: 205,
      protein: 16.0,
      fat: 7.0,
      carbs: 22.0,
      fiber: 1.8,
    },
    measures: [
      {
        id: "measure_barra_proteina_darkness_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_darkness_chocolate_unidade",
        label: "unidade (45g)",
        weight: 45,
      },
    ],
  },
  {
    id: "brand_barra_proteina_probiotica_chocolate",
    name: "Barra de Proteína Probiótica Chocolate",
    nutrients: {
      calories: 225,
      protein: 18.0,
      fat: 8.5,
      carbs: 24.0,
      fiber: 1.5,
    },
    measures: [
      {
        id: "measure_barra_proteina_probiotica_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_probiotica_chocolate_unidade",
        label: "unidade (33g)",
        weight: 33,
      },
    ],
  },
  {
    id: "brand_barra_proteina_vo2_cookies",
    name: "Barra de Proteína VO2 Cookies & Cream",
    nutrients: {
      calories: 115,
      protein: 9.0,
      fat: 3.8,
      carbs: 13.0,
      fiber: 1.6,
    },
    measures: [
      {
        id: "measure_barra_proteina_vo2_cookies_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_vo2_cookies_unidade",
        label: "unidade (30g)",
        weight: 30,
      },
    ],
  },
  {
    id: "brand_barra_proteina_probar_chocolate",
    name: "Barra de Proteína ProBar Base Chocolate",
    nutrients: {
      calories: 290,
      protein: 20.0,
      fat: 10.0,
      carbs: 37.0,
      fiber: 5.0,
    },
    measures: [
      {
        id: "measure_barra_proteina_probar_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_probar_chocolate_unidade",
        label: "unidade (70g)",
        weight: 70,
      },
    ],
  },
  {
    id: "brand_barra_proteina_probar_cookies",
    name: "Barra de Proteína ProBar Base Cookies & Cream",
    nutrients: {
      calories: 295,
      protein: 20.0,
      fat: 10.5,
      carbs: 37.0,
      fiber: 5.0,
    },
    measures: [
      {
        id: "measure_barra_proteina_probar_cookies_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_probar_cookies_unidade",
        label: "unidade (70g)",
        weight: 70,
      },
    ],
  },
  {
    id: "brand_barra_proteina_clif_chocolate",
    name: "Barra de Proteína Clif Builder's Chocolate",
    nutrients: {
      calories: 270,
      protein: 20.0,
      fat: 8.0,
      carbs: 30.0,
      fiber: 4.0,
    },
    measures: [
      {
        id: "measure_barra_proteina_clif_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_clif_chocolate_unidade",
        label: "unidade (68g)",
        weight: 68,
      },
    ],
  },
  {
    id: "brand_barra_proteina_clif_cookies",
    name: "Barra de Proteína Clif Builder's Cookies & Cream",
    nutrients: {
      calories: 275,
      protein: 20.0,
      fat: 8.5,
      carbs: 30.0,
      fiber: 4.0,
    },
    measures: [
      {
        id: "measure_barra_proteina_clif_cookies_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_clif_cookies_unidade",
        label: "unidade (68g)",
        weight: 68,
      },
    ],
  },
  {
    id: "brand_barra_proteina_prozis_chocolate",
    name: "Barra de Proteína Prozis Chocolate",
    nutrients: {
      calories: 160,
      protein: 15.0,
      fat: 5.0,
      carbs: 17.0,
      fiber: 2.0,
    },
    measures: [
      {
        id: "measure_barra_proteina_prozis_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_prozis_chocolate_unidade",
        label: "unidade (40g)",
        weight: 40,
      },
    ],
  },
  {
    id: "brand_barra_proteina_prozis_cookies",
    name: "Barra de Proteína Prozis Cookies & Cream",
    nutrients: {
      calories: 165,
      protein: 15.0,
      fat: 5.5,
      carbs: 17.0,
      fiber: 2.0,
    },
    measures: [
      {
        id: "measure_barra_proteina_prozis_cookies_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_barra_proteina_prozis_cookies_unidade",
        label: "unidade (40g)",
        weight: 40,
      },
    ],
  },

  // Tapioca
  {
    id: "brand_tapioca_amafil_granulada",
    name: "Tapioca Granulada Amafil",
    nutrients: {
      calories: 351,
      protein: 0.5,
      fat: 0.1,
      carbs: 86.0,
      fiber: 0.6,
    },
    measures: [
      {
        id: "measure_tapioca_amafil_granulada_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_tapioca_amafil_granulada_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
      {
        id: "measure_tapioca_amafil_granulada_disco",
        label: "disco médio (60g)",
        weight: 60,
      },
    ],
  },
  {
    id: "brand_tapioca_yoki_hidratada",
    name: "Tapioca Hidratada Yoki",
    nutrients: {
      calories: 345,
      protein: 0.3,
      fat: 0.2,
      carbs: 85.0,
      fiber: 0.5,
    },
    measures: [
      {
        id: "measure_tapioca_yoki_hidratada_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_tapioca_yoki_hidratada_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
      {
        id: "measure_tapioca_yoki_hidratada_disco",
        label: "disco médio (60g)",
        weight: 60,
      },
    ],
  },
  {
    id: "brand_tapioca_pinduca_goma",
    name: "Goma de Tapioca Pinduca",
    nutrients: {
      calories: 348,
      protein: 0.4,
      fat: 0.1,
      carbs: 86.5,
      fiber: 0.5,
    },
    measures: [
      {
        id: "measure_tapioca_pinduca_goma_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_tapioca_pinduca_goma_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
      {
        id: "measure_tapioca_pinduca_goma_disco",
        label: "disco médio (60g)",
        weight: 60,
      },
    ],
  },
  {
    id: "brand_tapioca_amafil_pronta",
    name: "Tapioca Pronta Amafil",
    nutrients: {
      calories: 351,
      protein: 0.5,
      fat: 0.1,
      carbs: 86.0,
      fiber: 0.6,
    },
    measures: [
      {
        id: "measure_tapioca_amafil_pronta_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_tapioca_amafil_pronta_unidade",
        label: "unidade média (60g)",
        weight: 60,
      },
    ],
  },

  // Requeijão
  {
    id: "brand_requeijao_vigor_tradicional",
    name: "Requeijão Cremoso Vigor Tradicional",
    nutrients: {
      calories: 270,
      protein: 9.0,
      fat: 25.0,
      carbs: 4.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_requeijao_vigor_tradicional_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_requeijao_vigor_tradicional_colher",
        label: "colher de sopa (20g)",
        weight: 20,
      },
    ],
  },
  {
    id: "brand_requeijao_catupiry_tradicional",
    name: "Requeijão Catupiry Tradicional",
    nutrients: {
      calories: 280,
      protein: 8.5,
      fat: 26.0,
      carbs: 4.5,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_requeijao_catupiry_tradicional_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_requeijao_catupiry_tradicional_colher",
        label: "colher de sopa (30g)",
        weight: 30,
      },
    ],
  },
  {
    id: "brand_requeijao_tirolez_light",
    name: "Requeijão Tirolez Light",
    nutrients: {
      calories: 160,
      protein: 10.0,
      fat: 12.0,
      carbs: 5.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_requeijao_tirolez_light_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_requeijao_tirolez_light_colher",
        label: "colher de sopa (20g)",
        weight: 20,
      },
    ],
  },

  // Queijos
  {
    id: "brand_queijo_polenghi_mussarela",
    name: "Queijo Mussarela Polenghi",
    nutrients: {
      calories: 300,
      protein: 22.0,
      fat: 23.0,
      carbs: 2.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_queijo_polenghi_mussarela_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_queijo_polenghi_mussarela_fatia",
        label: "fatia (25g)",
        weight: 25,
      },
    ],
  },
  {
    id: "brand_queijo_tirolez_prato",
    name: "Queijo Prato Tirolez",
    nutrients: {
      calories: 360,
      protein: 25.0,
      fat: 28.0,
      carbs: 1.5,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_queijo_tirolez_prato_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_queijo_tirolez_prato_fatia",
        label: "fatia (25g)",
        weight: 25,
      },
    ],
  },
  {
    id: "brand_queijo_vigor_minas_frescal",
    name: "Queijo Minas Frescal Vigor",
    nutrients: {
      calories: 240,
      protein: 17.0,
      fat: 18.0,
      carbs: 2.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_queijo_vigor_minas_frescal_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_queijo_vigor_minas_frescal_fatia",
        label: "fatia (30g)",
        weight: 30,
      },
    ],
  },
  {
    id: "brand_queijo_president_brie",
    name: "Queijo Brie President",
    nutrients: {
      calories: 330,
      protein: 20.0,
      fat: 28.0,
      carbs: 0.5,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_queijo_president_brie_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_queijo_president_brie_fatia",
        label: "fatia (20g)",
        weight: 20,
      },
    ],
  },
  {
    id: "brand_queijo_galbani_gorgonzola",
    name: "Queijo Gorgonzola Galbani",
    nutrients: {
      calories: 350,
      protein: 21.0,
      fat: 30.0,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_queijo_galbani_gorgonzola_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_queijo_galbani_gorgonzola_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
    ],
  },
  {
    id: "brand_queijo_sadia_parmesao_ralado",
    name: "Queijo Parmesão Ralado Sadia",
    nutrients: {
      calories: 400,
      protein: 35.0,
      fat: 28.0,
      carbs: 1.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_queijo_sadia_parmesao_ralado_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_queijo_sadia_parmesao_ralado_colher",
        label: "colher de sopa (10g)",
        weight: 10,
      },
    ],
  },
  {
    id: "brand_queijo_philadelphia_cream_cheese",
    name: "Cream Cheese Philadelphia",
    nutrients: {
      calories: 250,
      protein: 6.0,
      fat: 24.0,
      carbs: 4.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_queijo_philadelphia_cream_cheese_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_queijo_philadelphia_cream_cheese_colher",
        label: "colher de sopa (15g)",
        weight: 15,
      },
    ],
  },
  {
    id: "brand_queijo_catupiry_tradicional",
    name: "Queijo Catupiry Tradicional",
    nutrients: {
      calories: 280,
      protein: 8.5,
      fat: 26.0,
      carbs: 4.5,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_queijo_catupiry_tradicional_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_queijo_catupiry_tradicional_colher",
        label: "colher de sopa (30g)",
        weight: 30,
      },
    ],
  },

  // Arroz
  {
    id: "brand_arroz_tio_joao_integral",
    name: "Arroz Integral Tio João",
    nutrients: {
      calories: 124,
      protein: 2.6,
      fat: 1.0,
      carbs: 25.8,
      fiber: 2.7,
    },
    measures: [
      {
        id: "measure_arroz_tio_joao_integral_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_arroz_tio_joao_integral_colher",
        label: "colher de sopa (25g)",
        weight: 25,
      },
      {
        id: "measure_arroz_tio_joao_integral_porcao",
        label: "porção (50g)",
        weight: 50,
      },
    ],
  },

  // Cereais Matinais
  {
    id: "brand_cereal_nesfit_tradicional",
    name: "Cereal Matinal Nesfit Tradicional",
    nutrients: {
      calories: 110,
      protein: 3.0,
      fat: 1.0,
      carbs: 23.0,
      fiber: 2.5,
    },
    measures: [
      {
        id: "measure_cereal_nesfit_tradicional_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_cereal_nesfit_tradicional_xicara",
        label: "xícara (30g)",
        weight: 30,
      },
    ],
  },
  {
    id: "brand_cereal_nescau_chocolate",
    name: "Cereal Matinal Nescau Chocolate",
    nutrients: {
      calories: 120,
      protein: 1.6,
      fat: 1.2,
      carbs: 26.0,
      fiber: 1.8,
    },
    measures: [
      {
        id: "measure_cereal_nescau_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_cereal_nescau_chocolate_xicara",
        label: "xícara (30g)",
        weight: 30,
      },
    ],
  },

  // Biscoitos Proteicos
  {
    id: "brand_cookie_belive_chocolate",
    name: "Cookie Proteico Belive Chocolate",
    nutrients: {
      calories: 130,
      protein: 12.0,
      fat: 6.0,
      carbs: 15.0,
      fiber: 3.0,
    },
    measures: [
      {
        id: "measure_cookie_belive_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_cookie_belive_chocolate_unidade",
        label: "unidade (30g)",
        weight: 30,
      },
    ],
  },
  {
    id: "brand_cookie_max_protein_chocolate",
    name: "Cookie Max Protein Chocolate",
    nutrients: {
      calories: 145,
      protein: 15.0,
      fat: 7.0,
      carbs: 12.0,
      fiber: 2.5,
    },
    measures: [
      {
        id: "measure_cookie_max_protein_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_cookie_max_protein_chocolate_unidade",
        label: "unidade (35g)",
        weight: 35,
      },
    ],
  },

  // Iogurtes Proteicos
  {
    id: "brand_iogurte_whey_zero_morango",
    name: "Iogurte Whey Zero Morango Verde Campo",
    nutrients: {
      calories: 80,
      protein: 15.0,
      fat: 0.0,
      carbs: 5.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_whey_zero_morango_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_whey_zero_morango_pote",
        label: "pote (250g)",
        weight: 250,
      },
    ],
  },
  {
    id: "brand_iogurte_whey_protein_baunilha",
    name: "Iogurte Whey Protein Baunilha Vigor",
    nutrients: {
      calories: 85,
      protein: 14.0,
      fat: 0.5,
      carbs: 6.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_whey_protein_baunilha_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_whey_protein_baunilha_pote",
        label: "pote (250g)",
        weight: 250,
      },
    ],
  },

  // Novos Iogurtes
  {
    id: "brand_iogurte_danone_natural",
    name: "Iogurte Natural Danone",
    nutrients: {
      calories: 59,
      protein: 3.8,
      fat: 3.0,
      carbs: 4.7,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_danone_natural_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_danone_natural_pote",
        label: "pote (170g)",
        weight: 170,
      },
    ],
  },
  {
    id: "brand_iogurte_activia_morango",
    name: "Iogurte Activia Morango",
    nutrients: {
      calories: 85,
      protein: 2.9,
      fat: 2.4,
      carbs: 13.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_activia_morango_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_activia_morango_pote",
        label: "pote (120g)",
        weight: 120,
      },
    ],
  },
  {
    id: "brand_iogurte_activia_probioticos",
    name: "Iogurte Activia Probióticos Natural",
    nutrients: {
      calories: 74,
      protein: 3.7,
      fat: 3.0,
      carbs: 8.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_activia_probioticos_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_activia_probioticos_pote",
        label: "pote (120g)",
        weight: 120,
      },
    ],
  },
  {
    id: "brand_iogurte_nestle_grego_tradicional",
    name: "Iogurte Grego Nestlé Tradicional",
    nutrients: {
      calories: 130,
      protein: 5.8,
      fat: 7.0,
      carbs: 11.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_nestle_grego_tradicional_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_nestle_grego_tradicional_pote",
        label: "pote (90g)",
        weight: 90,
      },
    ],
  },
  {
    id: "brand_iogurte_nestle_grego_frutas_vermelhas",
    name: "Iogurte Grego Nestlé Frutas Vermelhas",
    nutrients: {
      calories: 140,
      protein: 5.5,
      fat: 6.8,
      carbs: 14.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_nestle_grego_frutas_vermelhas_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_nestle_grego_frutas_vermelhas_pote",
        label: "pote (90g)",
        weight: 90,
      },
    ],
  },
  {
    id: "brand_iogurte_vigor_grego_mel",
    name: "Iogurte Grego Vigor com Mel",
    nutrients: {
      calories: 145,
      protein: 5.0,
      fat: 7.0,
      carbs: 16.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_vigor_grego_mel_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_vigor_grego_mel_pote",
        label: "pote (100g)",
        weight: 100,
      },
    ],
  },
  {
    id: "brand_iogurte_batavo_grego_zero_baunilha",
    name: "Iogurte Grego Zero Batavo Baunilha",
    nutrients: {
      calories: 65,
      protein: 8.0,
      fat: 0.0,
      carbs: 9.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_batavo_grego_zero_baunilha_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_batavo_grego_zero_baunilha_pote",
        label: "pote (100g)",
        weight: 100,
      },
    ],
  },
  {
    id: "brand_iogurte_itambe_ninho_morango",
    name: "Iogurte Ninho Morango Itambé",
    nutrients: {
      calories: 92,
      protein: 2.8,
      fat: 2.5,
      carbs: 14.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_itambe_ninho_morango_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_itambe_ninho_morango_pote",
        label: "pote (170g)",
        weight: 170,
      },
    ],
  },
  {
    id: "brand_iogurte_itambe_fit_light_morango",
    name: "Iogurte Fit Light Morango Itambé",
    nutrients: {
      calories: 45,
      protein: 5.0,
      fat: 0.0,
      carbs: 6.5,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_itambe_fit_light_morango_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_itambe_fit_light_morango_pote",
        label: "pote (170g)",
        weight: 170,
      },
    ],
  },
  {
    id: "brand_iogurte_danone_grego_coco",
    name: "Iogurte Grego Danone Coco",
    nutrients: {
      calories: 135,
      protein: 5.5,
      fat: 6.5,
      carbs: 14.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_danone_grego_coco_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_danone_grego_coco_pote",
        label: "pote (100g)",
        weight: 100,
      },
    ],
  },
  {
    id: "brand_iogurte_skyr_vigor_tradicional",
    name: "Iogurte Skyr Vigor Tradicional",
    nutrients: {
      calories: 63,
      protein: 12.0,
      fat: 0.0,
      carbs: 4.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_skyr_vigor_tradicional_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_skyr_vigor_tradicional_pote",
        label: "pote (150g)",
        weight: 150,
      },
    ],
  },
  {
    id: "brand_iogurte_skyr_vigor_maca_canela",
    name: "Iogurte Skyr Vigor Maçã e Canela",
    nutrients: {
      calories: 68,
      protein: 11.0,
      fat: 0.0,
      carbs: 6.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_skyr_vigor_maca_canela_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_skyr_vigor_maca_canela_pote",
        label: "pote (150g)",
        weight: 150,
      },
    ],
  },
  {
    id: "brand_iogurte_whey_protein_chocolate_verde_campo",
    name: "Iogurte Whey Protein Chocolate Verde Campo",
    nutrients: {
      calories: 82,
      protein: 15.0,
      fat: 0.0,
      carbs: 5.5,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_whey_protein_chocolate_verde_campo_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_whey_protein_chocolate_verde_campo_pote",
        label: "pote (250g)",
        weight: 250,
      },
    ],
  },
  {
    id: "brand_iogurte_whey_protein_coco_verde_campo",
    name: "Iogurte Whey Protein Coco Verde Campo",
    nutrients: {
      calories: 81,
      protein: 15.0,
      fat: 0.0,
      carbs: 5.3,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_whey_protein_coco_verde_campo_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_whey_protein_coco_verde_campo_pote",
        label: "pote (250g)",
        weight: 250,
      },
    ],
  },
  {
    id: "brand_iogurte_yopro_cookies_cream",
    name: "Iogurte YoPRO Cookies & Cream",
    nutrients: {
      calories: 55,
      protein: 9.5,
      fat: 0.0,
      carbs: 4.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_yopro_cookies_cream_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_yopro_cookies_cream_pote",
        label: "pote (160g)",
        weight: 160,
      },
    ],
  },
  {
    id: "brand_iogurte_yopro_coco",
    name: "Iogurte YoPRO Coco",
    nutrients: {
      calories: 54,
      protein: 9.5,
      fat: 0.0,
      carbs: 3.7,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_yopro_coco_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_yopro_coco_pote",
        label: "pote (160g)",
        weight: 160,
      },
    ],
  },
  {
    id: "brand_iogurte_yopro_chocolate",
    name: "Iogurte YoPRO Chocolate",
    nutrients: {
      calories: 56,
      protein: 9.5,
      fat: 0.0,
      carbs: 4.2,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_yopro_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_yopro_chocolate_pote",
        label: "pote (160g)",
        weight: 160,
      },
    ],
  },
  {
    id: "brand_iogurte_batavo_proteina_baunilha",
    name: "Iogurte Batavo Proteína+ Baunilha",
    nutrients: {
      calories: 75,
      protein: 12.0,
      fat: 0.0,
      carbs: 8.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_batavo_proteina_baunilha_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_batavo_proteina_baunilha_pote",
        label: "pote (170g)",
        weight: 170,
      },
    ],
  },
  {
    id: "brand_iogurte_batavo_proteina_morango",
    name: "Iogurte Batavo Proteína+ Morango",
    nutrients: {
      calories: 76,
      protein: 12.0,
      fat: 0.0,
      carbs: 8.2,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_batavo_proteina_morango_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_batavo_proteina_morango_pote",
        label: "pote (170g)",
        weight: 170,
      },
    ],
  },
  {
    id: "brand_iogurte_nestle_natural_integral",
    name: "Iogurte Nestlé Natural Integral",
    nutrients: {
      calories: 60,
      protein: 3.5,
      fat: 3.0,
      carbs: 5.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_nestle_natural_integral_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_nestle_natural_integral_pote",
        label: "pote (170g)",
        weight: 170,
      },
    ],
  },

  // Snacks Saudáveis
  {
    id: "brand_snack_nuts_castanha_para",
    name: "Castanha do Pará Natural Jasmine",
    nutrients: {
      calories: 656,
      protein: 14.0,
      fat: 67.0,
      carbs: 12.0,
      fiber: 7.0,
    },
    measures: [
      {
        id: "measure_snack_nuts_castanha_para_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_snack_nuts_castanha_para_porcao",
        label: "porção (15g)",
        weight: 15,
      },
    ],
  },
  {
    id: "brand_snack_mix_nuts_mae_terra",
    name: "Mix de Nuts Mãe Terra",
    nutrients: {
      calories: 580,
      protein: 18.0,
      fat: 48.0,
      carbs: 22.0,
      fiber: 8.0,
    },
    measures: [
      {
        id: "measure_snack_mix_nuts_mae_terra_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_snack_mix_nuts_mae_terra_porcao",
        label: "porção (25g)",
        weight: 25,
      },
    ],
  },

  // Temperos e Condimentos
  {
    id: "brand_tempero_mrs_taste_everything",
    name: "Tempero Mrs Taste Everything But The",
    nutrients: {
      calories: 0,
      protein: 0.0,
      fat: 0.0,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_tempero_mrs_taste_everything_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_tempero_mrs_taste_everything_colher",
        label: "colher de chá (1g)",
        weight: 1,
      },
    ],
  },
  {
    id: "brand_tempero_sazon_fit",
    name: "Tempero Sazón Fit",
    nutrients: {
      calories: 0,
      protein: 0.0,
      fat: 0.0,
      carbs: 0.2,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_tempero_sazon_fit_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_tempero_sazon_fit_sache",
        label: "sachê (1g)",
        weight: 1,
      },
    ],
  },

  // Bebidas Vegetais
  {
    id: "brand_bebida_ades_amendoas",
    name: "Bebida de Amêndoas AdeS Original",
    nutrients: {
      calories: 28,
      protein: 1.0,
      fat: 1.1,
      carbs: 4.4,
      fiber: 0.3,
    },
    measures: [
      {
        id: "measure_bebida_ades_amendoas_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_ades_amendoas_copo",
        label: "copo (200ml)",
        weight: 200,
      },
    ],
  },
  {
    id: "brand_bebida_a_tal_castanha",
    name: "Bebida de Castanha A Tal da Castanha Original",
    nutrients: {
      calories: 32,
      protein: 1.2,
      fat: 1.3,
      carbs: 4.8,
      fiber: 0.4,
    },
    measures: [
      {
        id: "measure_bebida_a_tal_castanha_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_a_tal_castanha_copo",
        label: "copo (200ml)",
        weight: 200,
      },
    ],
  },

  // Novas bebidas
  {
    id: "brand_bebida_coca_cola_zero",
    name: "Coca-Cola Zero",
    nutrients: {
      calories: 0,
      protein: 0.0,
      fat: 0.0,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_coca_cola_zero_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_coca_cola_zero_lata",
        label: "lata (350ml)",
        weight: 350,
      },
      {
        id: "measure_bebida_coca_cola_zero_garrafa",
        label: "garrafa (600ml)",
        weight: 600,
      },
    ],
  },
  {
    id: "brand_bebida_coca_cola_tradicional",
    name: "Coca-Cola Tradicional",
    nutrients: {
      calories: 42,
      protein: 0.0,
      fat: 0.0,
      carbs: 10.6,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_coca_cola_tradicional_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_coca_cola_tradicional_lata",
        label: "lata (350ml)",
        weight: 350,
      },
      {
        id: "measure_bebida_coca_cola_tradicional_garrafa",
        label: "garrafa (600ml)",
        weight: 600,
      },
    ],
  },
  {
    id: "brand_bebida_suco_laranja_natural",
    name: "Suco de Laranja Natural",
    nutrients: {
      calories: 45,
      protein: 0.7,
      fat: 0.2,
      carbs: 10.4,
      fiber: 0.4,
    },
    measures: [
      {
        id: "measure_bebida_suco_laranja_natural_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_suco_laranja_natural_copo",
        label: "copo (200ml)",
        weight: 200,
      },
    ],
  },
  {
    id: "brand_bebida_agua_coco_kero_coco",
    name: "Água de Coco Kero Coco",
    nutrients: {
      calories: 22,
      protein: 0.0,
      fat: 0.0,
      carbs: 5.3,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_agua_coco_kero_coco_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_agua_coco_kero_coco_caixinha",
        label: "caixinha (200ml)",
        weight: 200,
      },
      {
        id: "measure_bebida_agua_coco_kero_coco_garrafa",
        label: "garrafa (1L)",
        weight: 1000,
      },
    ],
  },
  {
    id: "brand_bebida_suco_uva_integral_aurora",
    name: "Suco de Uva Integral Aurora",
    nutrients: {
      calories: 69,
      protein: 0.0,
      fat: 0.0,
      carbs: 16.5,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_suco_uva_integral_aurora_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_suco_uva_integral_aurora_copo",
        label: "copo (200ml)",
        weight: 200,
      },
      {
        id: "measure_bebida_suco_uva_integral_aurora_garrafa",
        label: "garrafa (1L)",
        weight: 1000,
      },
    ],
  },
  {
    id: "brand_bebida_monster_energy_tradicional",
    name: "Monster Energy Tradicional",
    nutrients: {
      calories: 48,
      protein: 0.0,
      fat: 0.0,
      carbs: 12.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_monster_energy_tradicional_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_monster_energy_tradicional_lata",
        label: "lata (473ml)",
        weight: 473,
      },
    ],
  },
  {
    id: "brand_bebida_monster_energy_zero",
    name: "Monster Energy Zero Ultra",
    nutrients: {
      calories: 3,
      protein: 0.0,
      fat: 0.0,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_monster_energy_zero_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_monster_energy_zero_lata",
        label: "lata (473ml)",
        weight: 473,
      },
    ],
  },
  {
    id: "brand_bebida_cafe_3coracoes_tradicional",
    name: "Café 3 Corações Tradicional",
    nutrients: {
      calories: 2,
      protein: 0.2,
      fat: 0.0,
      carbs: 0.3,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_cafe_3coracoes_tradicional_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_cafe_3coracoes_tradicional_xicara",
        label: "xícara (50ml)",
        weight: 50,
      },
    ],
  },
  {
    id: "brand_bebida_cha_verde_leao",
    name: "Chá Verde Leão",
    nutrients: {
      calories: 1,
      protein: 0.0,
      fat: 0.0,
      carbs: 0.2,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_cha_verde_leao_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_cha_verde_leao_xicara",
        label: "xícara (200ml)",
        weight: 200,
      },
    ],
  },
  {
    id: "brand_bebida_suco_del_valle_nectar_laranja",
    name: "Suco Del Valle Néctar Laranja",
    nutrients: {
      calories: 54,
      protein: 0.0,
      fat: 0.0,
      carbs: 13.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_suco_del_valle_nectar_laranja_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_suco_del_valle_nectar_laranja_caixinha",
        label: "caixinha (200ml)",
        weight: 200,
      },
      {
        id: "measure_bebida_suco_del_valle_nectar_laranja_garrafa",
        label: "garrafa (1L)",
        weight: 1000,
      },
    ],
  },
  {
    id: "brand_bebida_suco_del_valle_nectar_uva",
    name: "Suco Del Valle Néctar Uva",
    nutrients: {
      calories: 58,
      protein: 0.0,
      fat: 0.0,
      carbs: 14.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_suco_del_valle_nectar_uva_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_suco_del_valle_nectar_uva_caixinha",
        label: "caixinha (200ml)",
        weight: 200,
      },
      {
        id: "measure_bebida_suco_del_valle_nectar_uva_garrafa",
        label: "garrafa (1L)",
        weight: 1000,
      },
    ],
  },
  {
    id: "brand_bebida_leite_condensado_moca",
    name: "Leite Condensado Moça",
    nutrients: {
      calories: 330,
      protein: 7.0,
      fat: 8.0,
      carbs: 55.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_leite_condensado_moca_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_bebida_leite_condensado_moca_colher",
        label: "colher de sopa (20g)",
        weight: 20,
      },
      {
        id: "measure_bebida_leite_condensado_moca_lata",
        label: "lata (395g)",
        weight: 395,
      },
    ],
  },
  {
    id: "brand_bebida_leite_integral_itambe",
    name: "Leite Integral Itambé",
    nutrients: {
      calories: 60,
      protein: 3.2,
      fat: 3.3,
      carbs: 4.6,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_leite_integral_itambe_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_leite_integral_itambe_copo",
        label: "copo (200ml)",
        weight: 200,
      },
      {
        id: "measure_bebida_leite_integral_itambe_litro",
        label: "litro (1000ml)",
        weight: 1000,
      },
    ],
  },
  {
    id: "brand_bebida_leite_semidesnatado_itambe",
    name: "Leite Semidesnatado Itambé",
    nutrients: {
      calories: 48,
      protein: 3.2,
      fat: 2.0,
      carbs: 4.6,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_leite_semidesnatado_itambe_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_leite_semidesnatado_itambe_copo",
        label: "copo (200ml)",
        weight: 200,
      },
      {
        id: "measure_bebida_leite_semidesnatado_itambe_litro",
        label: "litro (1000ml)",
        weight: 1000,
      },
    ],
  },
  {
    id: "brand_bebida_leite_zero_lactose_piracanjuba",
    name: "Leite Zero Lactose Piracanjuba",
    nutrients: {
      calories: 59,
      protein: 3.2,
      fat: 3.2,
      carbs: 4.7,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_leite_zero_lactose_piracanjuba_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_leite_zero_lactose_piracanjuba_copo",
        label: "copo (200ml)",
        weight: 200,
      },
      {
        id: "measure_bebida_leite_zero_lactose_piracanjuba_litro",
        label: "litro (1000ml)",
        weight: 1000,
      },
    ],
  },
  {
    id: "brand_bebida_achocolatado_nescau_pronto",
    name: "Achocolatado Nescau Pronto",
    nutrients: {
      calories: 80,
      protein: 2.1,
      fat: 1.4,
      carbs: 15.0,
      fiber: 0.7,
    },
    measures: [
      {
        id: "measure_bebida_achocolatado_nescau_pronto_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_achocolatado_nescau_pronto_caixinha",
        label: "caixinha (200ml)",
        weight: 200,
      },
    ],
  },
  {
    id: "brand_bebida_achocolatado_toddynho",
    name: "Achocolatado Toddynho",
    nutrients: {
      calories: 83,
      protein: 2.0,
      fat: 2.0,
      carbs: 14.0,
      fiber: 0.5,
    },
    measures: [
      {
        id: "measure_bebida_achocolatado_toddynho_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_achocolatado_toddynho_caixinha",
        label: "caixinha (200ml)",
        weight: 200,
      },
    ],
  },
  {
    id: "brand_bebida_suco_verde_detox",
    name: "Suco Verde Detox",
    nutrients: {
      calories: 35,
      protein: 1.2,
      fat: 0.3,
      carbs: 7.5,
      fiber: 1.8,
    },
    measures: [
      {
        id: "measure_bebida_suco_verde_detox_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_suco_verde_detox_copo",
        label: "copo (300ml)",
        weight: 300,
      },
    ],
  },
  {
    id: "brand_bebida_cerveja_heineken",
    name: "Cerveja Heineken",
    nutrients: {
      calories: 42,
      protein: 0.4,
      fat: 0.0,
      carbs: 3.2,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_cerveja_heineken_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_cerveja_heineken_lata",
        label: "lata (350ml)",
        weight: 350,
      },
      {
        id: "measure_bebida_cerveja_heineken_long_neck",
        label: "long neck (330ml)",
        weight: 330,
      },
    ],
  },
  {
    id: "brand_bebida_cerveja_skol",
    name: "Cerveja Skol",
    nutrients: {
      calories: 43,
      protein: 0.6,
      fat: 0.0,
      carbs: 3.5,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_cerveja_skol_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_cerveja_skol_lata",
        label: "lata (350ml)",
        weight: 350,
      },
      {
        id: "measure_bebida_cerveja_skol_long_neck",
        label: "long neck (330ml)",
        weight: 330,
      },
    ],
  },
  {
    id: "brand_bebida_vinho_tinto_seco",
    name: "Vinho Tinto Seco",
    nutrients: {
      calories: 70,
      protein: 0.1,
      fat: 0.0,
      carbs: 2.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_bebida_vinho_tinto_seco_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_vinho_tinto_seco_taca",
        label: "taça (150ml)",
        weight: 150,
      },
      {
        id: "measure_bebida_vinho_tinto_seco_garrafa",
        label: "garrafa (750ml)",
        weight: 750,
      },
    ],
  },

  // Cereais
  {
    id: "brand_cereal_nesfit_tradicional",
    name: "Cereal Matinal Nesfit Tradicional",
    nutrients: {
      calories: 110,
      protein: 3.0,
      fat: 1.0,
      carbs: 23.0,
      fiber: 2.5,
    },
    measures: [
      {
        id: "measure_cereal_nesfit_tradicional_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_cereal_nesfit_tradicional_xicara",
        label: "xícara (30g)",
        weight: 30,
      },
    ],
  },
  {
    id: "brand_cereal_nescau_chocolate",
    name: "Cereal Matinal Nescau Chocolate",
    nutrients: {
      calories: 120,
      protein: 1.6,
      fat: 1.2,
      carbs: 26.0,
      fiber: 1.8,
    },
    measures: [
      {
        id: "measure_cereal_nescau_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_cereal_nescau_chocolate_xicara",
        label: "xícara (30g)",
        weight: 30,
      },
    ],
  },

  // Biscoitos Proteicos
  {
    id: "brand_cookie_belive_chocolate",
    name: "Cookie Proteico Belive Chocolate",
    nutrients: {
      calories: 130,
      protein: 12.0,
      fat: 6.0,
      carbs: 15.0,
      fiber: 3.0,
    },
    measures: [
      {
        id: "measure_cookie_belive_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_cookie_belive_chocolate_unidade",
        label: "unidade (30g)",
        weight: 30,
      },
    ],
  },
  {
    id: "brand_cookie_max_protein_chocolate",
    name: "Cookie Max Protein Chocolate",
    nutrients: {
      calories: 145,
      protein: 15.0,
      fat: 7.0,
      carbs: 12.0,
      fiber: 2.5,
    },
    measures: [
      {
        id: "measure_cookie_max_protein_chocolate_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_cookie_max_protein_chocolate_unidade",
        label: "unidade (35g)",
        weight: 35,
      },
    ],
  },

  // Iogurtes Proteicos
  {
    id: "brand_iogurte_whey_zero_morango",
    name: "Iogurte Whey Zero Morango Verde Campo",
    nutrients: {
      calories: 80,
      protein: 15.0,
      fat: 0.0,
      carbs: 5.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_whey_zero_morango_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_whey_zero_morango_pote",
        label: "pote (250g)",
        weight: 250,
      },
    ],
  },
  {
    id: "brand_iogurte_whey_protein_baunilha",
    name: "Iogurte Whey Protein Baunilha Vigor",
    nutrients: {
      calories: 85,
      protein: 14.0,
      fat: 0.5,
      carbs: 6.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_iogurte_whey_protein_baunilha_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_iogurte_whey_protein_baunilha_pote",
        label: "pote (250g)",
        weight: 250,
      },
    ],
  },

  // Snacks Saudáveis
  {
    id: "brand_snack_nuts_castanha_para",
    name: "Castanha do Pará Natural Jasmine",
    nutrients: {
      calories: 656,
      protein: 14.0,
      fat: 67.0,
      carbs: 12.0,
      fiber: 7.0,
    },
    measures: [
      {
        id: "measure_snack_nuts_castanha_para_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_snack_nuts_castanha_para_porcao",
        label: "porção (15g)",
        weight: 15,
      },
    ],
  },
  {
    id: "brand_snack_mix_nuts_mae_terra",
    name: "Mix de Nuts Mãe Terra",
    nutrients: {
      calories: 580,
      protein: 18.0,
      fat: 48.0,
      carbs: 22.0,
      fiber: 8.0,
    },
    measures: [
      {
        id: "measure_snack_mix_nuts_mae_terra_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_snack_mix_nuts_mae_terra_porcao",
        label: "porção (25g)",
        weight: 25,
      },
    ],
  },

  // Temperos e Condimentos
  {
    id: "brand_tempero_mrs_taste_everything",
    name: "Tempero Mrs Taste Everything But The",
    nutrients: {
      calories: 0,
      protein: 0.0,
      fat: 0.0,
      carbs: 0.0,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_tempero_mrs_taste_everything_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_tempero_mrs_taste_everything_colher",
        label: "colher de chá (1g)",
        weight: 1,
      },
    ],
  },
  {
    id: "brand_tempero_sazon_fit",
    name: "Tempero Sazón Fit",
    nutrients: {
      calories: 0,
      protein: 0.0,
      fat: 0.0,
      carbs: 0.2,
      fiber: 0.0,
    },
    measures: [
      {
        id: "measure_tempero_sazon_fit_100g",
        label: "100g",
        weight: 100,
      },
      {
        id: "measure_tempero_sazon_fit_sache",
        label: "sachê (1g)",
        weight: 1,
      },
    ],
  },

  // Bebidas Vegetais
  {
    id: "brand_bebida_ades_amendoas",
    name: "Bebida de Amêndoas AdeS Original",
    nutrients: {
      calories: 28,
      protein: 1.0,
      fat: 1.1,
      carbs: 4.4,
      fiber: 0.3,
    },
    measures: [
      {
        id: "measure_bebida_ades_amendoas_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_ades_amendoas_copo",
        label: "copo (200ml)",
        weight: 200,
      },
    ],
  },
  {
    id: "brand_bebida_a_tal_castanha",
    name: "Bebida de Castanha A Tal da Castanha Original",
    nutrients: {
      calories: 32,
      protein: 1.2,
      fat: 1.3,
      carbs: 4.8,
      fiber: 0.4,
    },
    measures: [
      {
        id: "measure_bebida_a_tal_castanha_100ml",
        label: "100ml",
        weight: 100,
      },
      {
        id: "measure_bebida_a_tal_castanha_copo",
        label: "copo (200ml)",
        weight: 200,
      },
    ],
  },
];
