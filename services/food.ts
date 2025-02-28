import axios from "axios";
import { EdamamResponse } from "../types/food";
import {
  translateFoodSearch,
  translateFoodResult,
} from "../utils/translateUtils";
import { EDAMAM_CONFIG } from "../config/api";

// Log de verificação inicial
console.log("Iniciando serviço food.ts com configuração:", {
  APP_ID: EDAMAM_CONFIG.APP_ID || "Não definido",
  BASE_URL: EDAMAM_CONFIG.BASE_URL,
  APP_KEY: EDAMAM_CONFIG.APP_KEY ? "Definido" : "Não definido",
});

// Configuração do cliente axios
const api = axios.create({
  baseURL: EDAMAM_CONFIG.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para validar a configuração antes de cada requisição
api.interceptors.request.use((config) => {
  // Log da requisição
  console.log("Interceptor - Configuração da requisição:", {
    url: config.url,
    method: config.method,
    params: {
      ...config.params,
      app_key: config.params?.app_key ? "***" : undefined,
    },
    headers: config.headers,
  });

  if (!EDAMAM_CONFIG.APP_ID || !EDAMAM_CONFIG.APP_KEY) {
    throw new Error("Credenciais da API Edamam não configuradas");
  }
  return config;
});

export const searchFoods = async (query: string): Promise<EdamamResponse> => {
  try {
    const translatedQuery = await translateFoodSearch(query);
    console.log("Query original:", query);
    console.log("Query traduzida:", translatedQuery);

    // Log dos parâmetros da requisição
    console.log("Parâmetros da busca:", {
      app_id: EDAMAM_CONFIG.APP_ID,
      ingr: translatedQuery,
      "nutrition-type": "logging",
    });

    const response = await api.get("/parser", {
      params: {
        app_id: EDAMAM_CONFIG.APP_ID,
        app_key: EDAMAM_CONFIG.APP_KEY,
        ingr: translatedQuery,
        "nutrition-type": "logging",
      },
    });

    console.log("Status da resposta:", response.status);
    console.log("Headers da resposta:", response.headers);

    // Traduz os resultados de volta para português
    const data = response.data;
    if (data.hints && data.hints.length > 0) {
      for (let hint of data.hints) {
        if (hint.food && hint.food.label) {
          hint.food.label = await translateFoodResult(hint.food.label);
        }
      }
    }

    return data;
  } catch (error: any) {
    console.error("Erro na busca:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        params: {
          ...error.config?.params,
          app_key: "***",
        },
      },
    });
    throw error;
  }
};

export const getFoodDetails = async (
  foodId: string
): Promise<EdamamResponse> => {
  try {
    // Log dos parâmetros da requisição
    console.log("Parâmetros dos detalhes:", {
      app_id: EDAMAM_CONFIG.APP_ID,
      foodId: foodId,
    });

    const response = await api.post(
      "/nutrients",
      {
        ingredients: [
          {
            quantity: 100,
            measureURI:
              "http://www.edamam.com/ontologies/edamam.owl#Measure_gram",
            foodId: foodId,
          },
        ],
      },
      {
        params: {
          app_id: EDAMAM_CONFIG.APP_ID,
          app_key: EDAMAM_CONFIG.APP_KEY,
        },
      }
    );

    console.log("Status da resposta (detalhes):", response.status);
    console.log("Headers da resposta (detalhes):", response.headers);

    return response.data;
  } catch (error: any) {
    console.error("Erro ao obter detalhes:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        params: {
          ...error.config?.params,
          app_key: "***",
        },
      },
    });
    throw error;
  }
};
