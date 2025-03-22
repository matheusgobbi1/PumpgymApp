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
  let savedLanguage = await AsyncStorage.getItem("userLanguage");

  // Se não houver idioma salvo, usar o idioma do dispositivo ou pt-BR como fallback
  if (!savedLanguage) {
    const deviceLanguage = Localization.locale;
    // Verificar se temos uma tradução para o idioma do dispositivo
    const languageCode = deviceLanguage.split("-")[0];
    savedLanguage =
      Object.keys(resources).find((code) => code.startsWith(languageCode)) ||
      "pt-BR";
  }

  await i18n.use(initReactI18next).init({
    compatibilityJSON: "v4", // Necessário para Android
    resources,
    lng: savedLanguage,
    fallbackLng: "pt-BR",
    interpolation: {
      escapeValue: false, // React já faz o escape
    },
  });

  return i18n;
};

// Inicializar
initI18n();

export default i18n;
