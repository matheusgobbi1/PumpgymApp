// Log de todas as variáveis de ambiente disponíveis
console.log("Todas as variáveis de ambiente:", {
  ...process.env,
  // Ocultando valores sensíveis
  EXPO_PUBLIC_EDAMAM_APP_KEY: process.env.EXPO_PUBLIC_EDAMAM_APP_KEY
    ? "***"
    : undefined,
});

// Configuração da API Edamam
export const EDAMAM_CONFIG = {
  APP_ID: process.env.EXPO_PUBLIC_EDAMAM_APP_ID || "",
  APP_KEY: process.env.EXPO_PUBLIC_EDAMAM_APP_KEY || "",
  BASE_URL: "https://api.edamam.com/api/food-database/v2",
} as const;

// Log dos valores exatos que estão sendo usados
console.log("Valores exatos das variáveis:", {
  EXPO_PUBLIC_EDAMAM_APP_ID: process.env.EXPO_PUBLIC_EDAMAM_APP_ID,
  EXPO_PUBLIC_EDAMAM_APP_KEY: process.env.EXPO_PUBLIC_EDAMAM_APP_KEY
    ? "***"
    : undefined,
});

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

// Log de configuração final
console.log("Configuração Edamam carregada:", {
  APP_ID: EDAMAM_CONFIG.APP_ID,
  BASE_URL: EDAMAM_CONFIG.BASE_URL,
  APP_KEY: "***********",
});
