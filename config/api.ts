

// Configuração da API Edamam
export const EDAMAM_CONFIG = {
  APP_ID: process.env.EXPO_PUBLIC_EDAMAM_APP_ID || "",
  APP_KEY: process.env.EXPO_PUBLIC_EDAMAM_APP_KEY || "",
  BASE_URL: "https://api.edamam.com/api/food-database/v2",
} as const;

// Interface para os resultados da API
export interface EdamamFood {
  food: {
    foodId: string;
    label: string;
    nutrients: {
      ENERC_KCAL: number; // calories
      PROCNT: number; // protein
      FAT: number; // fat
      CHOCDF: number; // carbs
      FIBTG?: number; // fiber
    };
    category: string;
    categoryLabel: string;
    image?: string;
  };
}

// Função para buscar alimentos
export async function searchFoods(query: string): Promise<EdamamFood[]> {
  try {
    const response = await fetch(
      `${EDAMAM_CONFIG.BASE_URL}/parser?app_id=${
        EDAMAM_CONFIG.APP_ID
      }&app_key=${EDAMAM_CONFIG.APP_KEY}&ingr=${encodeURIComponent(
        query
      )}&lang=pt-BR`
    );

    if (!response.ok) {
      throw new Error("Erro ao buscar alimentos");
    }

    const data = await response.json();
    return data.hints || [];
  } catch (error) {
    console.error("Erro na busca de alimentos:", error);
    throw error;
  }
}

import { FoodHint } from "../types/food";

// Função para obter detalhes de um alimento específico
export async function getFoodDetails(foodId: string): Promise<FoodHint | null> {
  try {
    const response = await fetch(
      `${EDAMAM_CONFIG.BASE_URL}/parser?app_id=${EDAMAM_CONFIG.APP_ID}&app_key=${EDAMAM_CONFIG.APP_KEY}&ingr=${foodId}&lang=pt-BR`
    );

    if (!response.ok) {
      throw new Error("Erro ao buscar detalhes do alimento");
    }

    const data = await response.json();
    if (data.hints && data.hints.length > 0) {
      return data.hints[0];
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar detalhes do alimento:", error);
    throw error;
  }
}

// Validação das variáveis de ambiente
if (!EDAMAM_CONFIG.APP_ID || !EDAMAM_CONFIG.APP_KEY) {
  console.error("Erro de configuração:", {
    APP_ID: EDAMAM_CONFIG.APP_ID ? "Definido" : "Não definido",
    APP_KEY: EDAMAM_CONFIG.APP_KEY ? "Definido" : "Não definido",
  });
  throw new Error(
    "As variáveis de ambiente EXPO_PUBLIC_EDAMAM_APP_ID e EXPO_PUBLIC_EDAMAM_APP_KEY são obrigatórias."
  );
}

