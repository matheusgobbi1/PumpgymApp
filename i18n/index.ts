import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Importando arquivos de tradução
import ptBR from "./locales/pt-BR/translation.json";
import enUS from "./locales/en-US/translation.json";

const resources = {
  "pt-BR": { translation: ptBR },
  "en-US": { translation: enUS },
};

const initI18n = async () => {
  // Tentar carregar o idioma salvo
  let savedLanguage;
  try {
    savedLanguage = await AsyncStorage.getItem("userLanguage");

    // Se não houver idioma salvo, usar o idioma do dispositivo ou pt-BR como fallback
    if (!savedLanguage) {
      const deviceLanguage = Localization.locale;
      // Verificar se temos uma tradução para o idioma do dispositivo
      const languageCode = deviceLanguage.split("-")[0];
      savedLanguage =
        Object.keys(resources).find((code) => code.startsWith(languageCode)) ||
        "pt-BR";

      // Salvar o idioma detectado para futuras referências
      await AsyncStorage.setItem("userLanguage", savedLanguage);
    }
  } catch (error) {
    console.error("Erro ao carregar idioma:", error);
    savedLanguage = "pt-BR"; // Fallback seguro
  }

  await i18n.use(initReactI18next).init({
    compatibilityJSON: "v4", // Necessário para Android
    resources,
    lng: savedLanguage,
    fallbackLng: "pt-BR",
    interpolation: {
      escapeValue: false, // React já faz o escape
    },
    react: {
      useSuspense: false, // Para evitar problemas com Suspense
    },
  });

  console.log("i18n inicializado com idioma:", i18n.language);
  return i18n;
};

// Inicializar
initI18n();

// Função de utilidade para debug do idioma atual
export const getLanguageStatus = () => {
  return {
    currentLanguage: i18n.language,
    changeLanguage: i18n.changeLanguage,
    isInitialized: i18n.isInitialized,
    available: Object.keys(resources),
  };
};

export default i18n;
