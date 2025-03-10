import { FoodResponse, FatSecretSearchResponse, FatSecretFoodResponse, convertFatSecretToFoodItem, FoodItem } from "../types/food";
import { FATSECRET_CONFIG, getFatSecretToken } from "../config/api";
import { searchFoodsMockup, getFoodDetailsMockup } from "../data/foodDatabase";

// Função para buscar alimentos usando a API FatSecret
export const searchFoods = async (query: string): Promise<FoodResponse> => {
  try {
    console.log("Query original:", query);
    
    // Primeiro buscar no banco de dados local
    const localResults = searchFoodsMockup(query);
    
    // Se não houver query, retornar vazio
    if (!query) {
      return { items: [] };
    }

    // Tentar API FatSecret 
    try {
      // Obter token de acesso
      const token = await getFatSecretToken();
      
      // Construir URL com parâmetros
      const params = new URLSearchParams({
        method: "foods.search",
        search_expression: query,
        format: "json",
        max_results: "20",
      });
      
      const url = `${FATSECRET_CONFIG.BASE_URL}?${params.toString()}`;
      
      console.log("URL da requisição:", url);
      console.log("Parâmetros:", Object.fromEntries(params.entries()));
      
      // Fazer requisição com timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      
      console.log("Status da resposta:", response.status);
      console.log("Headers da resposta:", Object.fromEntries([...response.headers.entries()]));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro na resposta:", errorText);
        throw new Error(`Erro na busca: ${response.status} - ${errorText}`);
      }
      
      // Converter a resposta para JSON
      const responseText = await response.text();
      console.log("Resposta da API (texto):", responseText);
      
      const data: FatSecretSearchResponse = JSON.parse(responseText);
      console.log("Resposta da API (JSON):", JSON.stringify(data, null, 2));
      
      // Verificar se há um erro na resposta
      if (data.error) {
        throw new Error(`Erro da API: ${data.error.code} - ${data.error.message}`);
      }
      
      const apiResults: FoodItem[] = [];

      if (data.foods && data.foods.food) {
        // Verificar se é um array ou um único objeto
        const foods = Array.isArray(data.foods.food) ? data.foods.food : [data.foods.food];
        
        console.log(`Encontrados ${foods.length} alimentos na busca`);
        
        // Converter cada alimento para o formato FoodItem
        apiResults.push(...foods.map(food => convertFatSecretToFoodItem(food)));
      } else {
        console.log("Nenhum alimento encontrado na resposta da API");
      }

      // Combinar resultados locais com resultados da API
      // Evitar duplicações baseadas no ID (embora improvável devido aos diferentes formatos)
      const localIds = new Set(localResults.items?.map(item => item.food_id) || []);
      const filteredApiResults = apiResults.filter(item => !localIds.has(item.food_id));
      
      // Priorizar resultados locais colocando-os no início da lista
      const combinedResults: FoodResponse = {
        items: [
          ...(localResults.items || []),
          ...filteredApiResults
        ]
      };
      
      console.log(`Retornando ${combinedResults.items?.length || 0} resultados combinados`);
      return combinedResults;
    } catch (error) {
      console.warn("Erro ao usar a API FatSecret. Usando apenas resultados locais:", error);
      // Em caso de erro na API, usar apenas o mockup local
      return localResults;
    }
  } catch (error: any) {
    console.error("Erro na busca:", error);
    throw error;
  }
};

// Função para obter detalhes de um alimento usando a API FatSecret
export const getFoodDetails = async (
  foodId: string
): Promise<FoodResponse> => {
  try {
    // Tentar API FatSecret primeiro
    try {
      // Obter token de acesso
      const token = await getFatSecretToken();
      
      // Construir URL com parâmetros
      const params = new URLSearchParams({
        method: "food.get.v2",
        food_id: foodId,
        format: "json",
        flag_default_serving: "true",
      });
      
      const url = `${FATSECRET_CONFIG.BASE_URL}?${params.toString()}`;
      
      console.log("URL da requisição de detalhes:", url);
      console.log("Parâmetros (detalhes):", Object.fromEntries(params.entries()));
      
      // Fazer requisição com timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      
      console.log("Status da resposta (detalhes):", response.status);
      console.log("Headers da resposta (detalhes):", Object.fromEntries([...response.headers.entries()]));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro na resposta (detalhes):", errorText);
        throw new Error(`Erro ao obter detalhes: ${response.status} - ${errorText}`);
      }
      
      // Converter a resposta para JSON
      const responseText = await response.text();
      console.log("Resposta da API (detalhes - texto):", responseText);
      
      const data: FatSecretFoodResponse = JSON.parse(responseText);
      console.log("Resposta da API (detalhes - JSON):", JSON.stringify(data, null, 2));
      
      // Verificar se há um erro na resposta
      if (data.error) {
        throw new Error(`Erro da API: ${data.error.code} - ${data.error.message}`);
      }

      const result: FoodResponse = { items: [] };

      if (data.food) {
        // Converter o alimento para o formato FoodItem
        const foodItem = convertFatSecretToFoodItem(data.food);
        result.items = [foodItem];
      }

      return result;
    } catch (error) {
      console.warn("Erro ao usar a API FatSecret para detalhes. Usando mockup local:", error);
      // Em caso de erro na API, usar o mockup local
      return getFoodDetailsMockup(foodId);
    }
  } catch (error: any) {
    console.error("Erro ao obter detalhes:", error);
    throw error;
  }
};
