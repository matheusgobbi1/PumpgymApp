// Configuração da API FatSecret
export const FATSECRET_CONFIG = {
  CLIENT_ID: process.env.EXPO_PUBLIC_FATSECRET_CLIENT_ID || "",
  CLIENT_SECRET: process.env.EXPO_PUBLIC_FATSECRET_CLIENT_SECRET || "",
  BASE_URL: "https://platform.fatsecret.com/rest/server.api",
  AUTH_URL: "https://oauth.fatsecret.com/connect/token",
} as const;

// Interface para os resultados da API FatSecret
export interface FatSecretFood {
  food_id: string;
  food_name: string;
  food_description?: string;
  brand_name?: string;
  food_type?: string;
  food_url?: string;
}

export interface FatSecretNutrients {
  calories: number;
  protein: number;
  fat: number;
  carbohydrate: number;
  fiber?: number;
}

export interface FatSecretServing {
  serving_id: string;
  serving_description: string;
  serving_url?: string;
  metric_serving_amount?: number;
  metric_serving_unit?: string;
  measurement_description?: string;
  number_of_units?: number;
  serving_nutrients: FatSecretNutrients;
}

export interface FatSecretFoodDetails {
  food_id: string;
  food_name: string;
  food_type?: string;
  brand_name?: string;
  food_url?: string;
  servings: {
    serving: FatSecretServing[] | FatSecretServing;
  };
}

// Função para obter token de acesso
export async function getFatSecretToken(): Promise<string> {
  try {
    
    // Criar credenciais Basic Auth usando btoa (Base64) em vez de Buffer
    const credentialsString = `${FATSECRET_CONFIG.CLIENT_ID}:${FATSECRET_CONFIG.CLIENT_SECRET}`;
    const credentials = btoa(credentialsString);
    
    const params = new URLSearchParams({
      grant_type: "client_credentials",
      scope: "basic",
    });
    
    const response = await fetch(FATSECRET_CONFIG.AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
      },
      body: params.toString(),
    });

    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao obter token de acesso: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    throw error;
  }
}

// Validação das variáveis de ambiente
if (!FATSECRET_CONFIG.CLIENT_ID || !FATSECRET_CONFIG.CLIENT_SECRET) {
  throw new Error(
    "As variáveis de ambiente EXPO_PUBLIC_FATSECRET_CLIENT_ID e EXPO_PUBLIC_FATSECRET_CLIENT_SECRET são obrigatórias."
  );
}

