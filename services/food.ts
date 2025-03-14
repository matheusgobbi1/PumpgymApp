import { FoodResponse } from "../types/food";
import {
  searchFoodsMockup,
  getFoodDetailsMockup,
} from "../data/foodDatabaseUtils";

// Função para buscar alimentos usando apenas o banco de dados local
export const searchFoods = async (query: string): Promise<FoodResponse> => {
  try {
    console.log("Buscando alimentos localmente para:", query);

    // Buscar no banco de dados local
    const results = searchFoodsMockup(query);

    console.log(
      `Encontrados ${
        results.items?.length || 0
      } alimentos no banco de dados local`
    );
    return results;
  } catch (error: any) {
    console.error("Erro na busca local:", error);
    throw error;
  }
};

// Função para obter detalhes de um alimento usando apenas o banco de dados local
export const getFoodDetails = async (foodId: string): Promise<FoodResponse> => {
  try {
    console.log("Buscando detalhes do alimento localmente para ID:", foodId);

    // Buscar no banco de dados local
    const result = getFoodDetailsMockup(foodId);

    console.log(
      `Encontrado ${result.items?.length || 0} alimento no banco de dados local`
    );
    return result;
  } catch (error: any) {
    console.error("Erro ao obter detalhes localmente:", error);
    throw error;
  }
};
