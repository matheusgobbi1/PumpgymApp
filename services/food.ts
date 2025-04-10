import { FoodResponse } from "../types/food";
import {
  searchFoodsMockup,
  getFoodDetailsMockup,
} from "../data/foodDatabaseUtils";

// Cache para armazenar resultados de pesquisas recentes
const searchCache = new Map<string, FoodResponse>();

// Função para buscar alimentos - otimizada com cache
export const searchFoods = async (
  query: string,
  category?: string
): Promise<FoodResponse> => {
  try {
    // Criar uma chave única para o cache com a consulta e categoria
    const cacheKey = `${query}:${category || "all"}`;

    // Verificar se o resultado já está em cache
    if (searchCache.has(cacheKey)) {
      return searchCache.get(cacheKey) as FoodResponse;
    }

    // Usar o mockup para buscar os dados localmente
    const response = searchFoodsMockup(query, category);

    // Armazenar no cache
    searchCache.set(cacheKey, response);

    return response;
  } catch (error) {
    console.error("Erro ao buscar alimentos:", error);
    throw error;
  }
};

// Cache para detalhes de alimentos
const detailsCache = new Map<string, FoodResponse>();

// Função para obter detalhes de um alimento pelo ID - otimizada com cache
export const getFoodDetails = async (foodId: string): Promise<FoodResponse> => {
  try {
    // Verificar se o resultado já está em cache
    if (detailsCache.has(foodId)) {
      return detailsCache.get(foodId) as FoodResponse;
    }

    // Usar o mockup para buscar os dados localmente
    const response = getFoodDetailsMockup(foodId);

    // Armazenar no cache
    detailsCache.set(foodId, response);

    return response;
  } catch (error) {
    console.error("Erro ao obter detalhes do alimento:", error);
    throw error;
  }
};
