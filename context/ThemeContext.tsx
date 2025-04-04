import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeType = "light" | "dark";

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  useSystemTheme: boolean;
  setUseSystemTheme: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  useSystemTheme: true,
  setUseSystemTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = (useColorScheme() as ThemeType) || "light";
  const [theme, setTheme] = useState<ThemeType>("light");
  const [useSystemTheme, setUseSystemTheme] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Carregar preferências de tema do armazenamento
  useEffect(() => {
    const loadThemePreferences = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("theme");
        const storedUseSystemTheme = await AsyncStorage.getItem(
          "useSystemTheme"
        );

        if (storedUseSystemTheme !== null) {
          const useSystem = storedUseSystemTheme === "true";
          setUseSystemTheme(useSystem);

          if (useSystem) {
            setTheme(systemColorScheme);
          } else if (storedTheme !== null) {
            setTheme(storedTheme as ThemeType);
          }
        } else {
          // Configuração padrão: usar tema do sistema
          setTheme(systemColorScheme);
        }

        setIsInitialized(true);
      } catch (error) {
        setTheme(systemColorScheme);
        setIsInitialized(true);
      }
    };

    loadThemePreferences();
  }, [systemColorScheme]);

  // Atualizar tema quando o tema do sistema mudar (se useSystemTheme for true)
  useEffect(() => {
    if (useSystemTheme && isInitialized) {
      setTheme(systemColorScheme);
    }
  }, [systemColorScheme, useSystemTheme, isInitialized]);

  // Salvar preferências de tema
  useEffect(() => {
    if (isInitialized) {
      const saveThemePreferences = async () => {
        try {
          await AsyncStorage.setItem("theme", theme);
          await AsyncStorage.setItem(
            "useSystemTheme",
            useSystemTheme.toString()
          );
        } catch (error) {
        }
      };

      saveThemePreferences();
    }
  }, [theme, useSystemTheme, isInitialized]);

  // Memoizar a função de toggle para evitar recriações desnecessárias
  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    // Quando o usuário alterna manualmente o tema, desativamos o tema do sistema
    if (useSystemTheme) {
      setUseSystemTheme(false);
    }
  }, [theme, useSystemTheme]);

  // Memoizar a função de definir o uso do tema do sistema
  const handleSetUseSystemTheme = useCallback(
    (value: boolean) => {
      setUseSystemTheme(value);
      if (value) {
        setTheme(systemColorScheme);
      }
    },
    [systemColorScheme]
  );

  // Memoizar o valor do contexto para evitar re-renderizações desnecessárias
  const contextValue = useMemo(
    () => ({
      theme,
      toggleTheme,
      useSystemTheme,
      setUseSystemTheme: handleSetUseSystemTheme,
    }),
    [theme, toggleTheme, useSystemTheme, handleSetUseSystemTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
