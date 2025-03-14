import { FoodResponse } from "../types/food";
import {
  searchFoodsMockup,
  getFoodDetailsMockup,
} from "../data/foodDatabaseUtils";

// Função para buscar alimentos usando apenas o banco de dados local
export const searchFoods = async (query: string): Promise<FoodResponse> => {
  try {

    // Buscar no banco de dados local
    const results = searchFoodsMockup(query);

    return results;
  } catch (error: any) {
    console.error("Erro na busca local:", error);
    throw error;
  }
};

// Função para obter detalhes de um alimento usando apenas o banco de dados local
export const getFoodDetails = async (foodId: string): Promise<FoodResponse> => {
  try {

    // Buscar no banco de dados local
    const result = getFoodDetailsMockup(foodId);
    return result;
  } catch (error: any) {
    console.error("Erro ao obter detalhes localmente:", error);
    throw error;
  }
};
