import React, { createContext, useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../i18n";

// Definição do tipo do contexto
type LanguageContextType = {
  currentLanguage: string;
  changeLanguage: (language: string) => Promise<void>;
};

// Criação do contexto
const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Provider Component
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  // Efeito para carregar o idioma salvo quando o componente monta
  useEffect(() => {
    const loadSavedLanguage = async () => {
      const savedLanguage = await AsyncStorage.getItem("userLanguage");
      if (savedLanguage) {
        await i18n.changeLanguage(savedLanguage);
        setCurrentLanguage(savedLanguage);
      }
    };

    loadSavedLanguage();
  }, []);

  // Função para mudar o idioma
  const changeLanguage = async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);
      await AsyncStorage.setItem("userLanguage", language);
    } catch (error) {
      console.error("Erro ao mudar o idioma:", error);
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook para usar o contexto
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage deve ser usado dentro de um LanguageProvider");
  }
  return context;
};
