import React, { createContext, useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../i18n";

// Definição do tipo do contexto
type LanguageContextType = {
  currentLanguage: string;
  changeLanguage: (language: string) => Promise<void>;
  isSwitchingLanguage: boolean;
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
  const [isSwitchingLanguage, setIsSwitchingLanguage] = useState(false);
  const { i18n: i18nInstance } = useTranslation();

  // Efeito para carregar o idioma salvo quando o componente monta
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("userLanguage");
        if (savedLanguage && savedLanguage !== i18nInstance.language) {
          await i18nInstance.changeLanguage(savedLanguage);
          setCurrentLanguage(savedLanguage);
          console.log("Idioma carregado do storage:", savedLanguage);
        } else {
          // Se não houver idioma salvo ou for o mesmo, apenas atualize o estado
          setCurrentLanguage(i18nInstance.language);
          console.log("Usando idioma atual:", i18nInstance.language);
        }
      } catch (error) {
        console.error("Erro ao carregar idioma salvo:", error);
      }
    };

    loadSavedLanguage();
  }, [i18nInstance]);

  // Função para mudar o idioma
  const changeLanguage = async (language: string) => {
    if (language === currentLanguage) return;

    try {
      setIsSwitchingLanguage(true);
      console.log("Mudando idioma para:", language);

      // Salvar no AsyncStorage antes de mudar no i18n
      await AsyncStorage.setItem("userLanguage", language);

      // Mudar o idioma no i18n
      await i18nInstance.changeLanguage(language);
      setCurrentLanguage(language);
    } catch (error) {
      console.error("Erro ao mudar o idioma:", error);
    } finally {
      setIsSwitchingLanguage(false);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        isSwitchingLanguage,
      }}
    >
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
