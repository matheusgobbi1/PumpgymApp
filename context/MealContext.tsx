import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";
import { OfflineStorage } from "../services/OfflineStorage";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEYS } from "../constants/keys";

// Tipos
export interface Food {
  id: string;
  name: string;
  portion: number;
  portionDescription?: string; // Descrição opcional da porção (ex: "1 barra", "1 unidade")
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number; // Adicionando fibra como propriedade opcional
}

export interface MealType {
  id: string;
  name: string;
  icon: string;
  color?: string;
}

interface MealTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealContextType {
  meals: { [date: string]: { [mealId: string]: Food[] } };
  mealTypes: MealType[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  getMealTotals: (mealId: string) => MealTotals;
  getFoodsForMeal: (mealId: string) => Food[];
  getDayTotals: () => MealTotals;
  addFoodToMeal: (mealId: string, food: Food) => void;
  updateFoodInMeal: (mealId: string, updatedFood: Food) => void;
  removeFoodFromMeal: (mealId: string, foodId: string) => Promise<void>;
  saveMeals: () => Promise<void>;
  addMealType: (id: string, name: string, icon: string) => void;
  updateMealTypes: (mealTypes: MealType[]) => Promise<boolean>;
  hasMealTypesConfigured: boolean;
  searchHistory: Food[];
  addToSearchHistory: (food: Food) => Promise<void>;
  clearSearchHistory: () => Promise<void>;
  copyMealFromDate: (
    sourceDate: string,
    sourceMealId: string,
    targetMealId: string
  ) => Promise<void>;
}

const MealContext = createContext<MealContextType | undefined>(undefined);

export function MealProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [meals, setMeals] = useState<{
    [date: string]: { [mealId: string]: Food[] };
  }>({});
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [hasMealTypesConfigured, setHasMealTypesConfigured] =
    useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<Food[]>([]);

  // Resetar o estado quando o usuário mudar
  const resetState = useCallback(() => {
    setMeals({});
    setMealTypes([]);
    setHasMealTypesConfigured(false);
    setSearchHistory([]);
  }, []);

  // Carregar refeições do usuário
  useEffect(() => {
    if (user) {
      // Limpar dados do usuário anterior antes de carregar os novos
      resetState();
      loadMeals();
      loadMealTypes();
    } else {
      // Limpar dados quando não houver usuário (logout)
      resetState();
    }
  }, [user?.uid]); // Usar user.uid como dependência para detectar mudança de usuário

  // Carregar histórico de busca
  useEffect(() => {
    const loadSearchHistory = async () => {
      if (user) {
        try {
          const history = await OfflineStorage.loadSearchHistory(user.uid);
          setSearchHistory(history);
        } catch (error) {
          console.error("Erro ao carregar histórico de busca:", error);
        }
      }
    };

    loadSearchHistory();
  }, [user?.uid]);

  // Carregar refeições quando a data selecionada mudar
  useEffect(() => {
    if (user) {
      const loadMealsForSelectedDate = async () => {
        try {
          // Se já temos dados para a data selecionada em nosso estado, não precisamos recarregar
          if (meals[selectedDate]) {
            return;
          }

          // Tentar carregar dados do storage local
          const localMeals = await OfflineStorage.loadMealsData(
            user.uid,
            selectedDate
          );

          if (localMeals && Object.keys(localMeals).length > 0) {
            // Se encontrou dados locais, usar eles (preservando o estado atual de outras datas)
            setMeals((prevMeals) => ({
              ...prevMeals,
              [selectedDate]: localMeals,
            }));
          } else {
            // Verificar conexão com a internet antes de tentar acessar o Firebase
            const isOnline = await OfflineStorage.isOnline();

            if (isOnline) {
              // Se está online, tentar buscar do Firebase
              try {
                const mealDoc = await getDoc(
                  doc(db, "users", user.uid, "meals", selectedDate)
                );

                if (mealDoc.exists()) {
                  const mealData = mealDoc.data() as {
                    [mealId: string]: Food[];
                  };
                  // Atualizar o estado preservando outras datas
                  setMeals((prevMeals) => ({
                    ...prevMeals,
                    [selectedDate]: mealData,
                  }));

                  // Salvar no storage local para futuras consultas
                  await OfflineStorage.saveMealsData(
                    user.uid,
                    selectedDate,
                    mealData
                  );
                } else {
                  // Inicializar com objeto vazio quando não existem dados no Firestore
                  setMeals((prevMeals) => ({
                    ...prevMeals,
                    [selectedDate]: {},
                  }));
                }
              } catch (error) {
                // Inicializar com objeto vazio em caso de erro
                setMeals((prevMeals) => ({
                  ...prevMeals,
                  [selectedDate]: {},
                }));
              }
            } else {
              // Se está offline, inicializar com objeto vazio
              setMeals((prevMeals) => ({
                ...prevMeals,
                [selectedDate]: {},
              }));
            }
          }
        } catch (error) {
          // Garantir que temos um objeto vazio em caso de erro
          setMeals((prevMeals) => ({
            ...prevMeals,
            [selectedDate]: {},
          }));
        }
      };

      loadMealsForSelectedDate();
    }
  }, [selectedDate, user?.uid, meals]);

  const loadMeals = useCallback(async () => {
    try {
      if (!user) return;

      // Limpar dados existentes antes de carregar
      setMeals({});

      // Verificar conexão com a internet antes de tentar acessar o Firebase
      const isOnline = await OfflineStorage.isOnline();

      // Primeiro tentar carregar todas as refeições do armazenamento local
      try {
        const localMealsKeys = await AsyncStorage.getAllKeys();
        const mealKeys = localMealsKeys.filter(
          (key) =>
            key.startsWith(`${KEYS.MEALS_KEY}${user.uid}:`) &&
            // Filtrar chaves que terminam com data válida YYYY-MM-DD
            /:\d{4}-\d{2}-\d{2}$/.test(key)
        );

        if (mealKeys.length > 0) {
          const localMealsData: {
            [date: string]: { [mealId: string]: Food[] };
          } = {};

          // Obter todos os dados locais de refeições
          for (const key of mealKeys) {
            const parts = key.split(":");
            if (parts.length >= 3) {
              const dateString = parts[parts.length - 1];
              // Verificar se a data está no formato correto antes de buscar os dados
              if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                const mealData = await OfflineStorage.loadMealsData(
                  user.uid,
                  dateString
                );
                if (mealData && Object.keys(mealData).length > 0) {
                  localMealsData[dateString] = mealData;
                }
              }
            }
          }

          if (Object.keys(localMealsData).length > 0) {
            setMeals(localMealsData);
            return; // Retornar se os dados foram carregados localmente
          }
        }
      } catch (localError) {
        console.error("Erro ao carregar refeições locais:", localError);
      }

      if (isOnline) {
        // Se está online, buscar todas as refeições do Firebase
        try {
          // Buscar todas as refeições do usuário
          const mealsRef = collection(db, "users", user.uid, "meals");
          const mealsSnap = await getDocs(mealsRef);

          const mealsData: { [date: string]: { [mealId: string]: Food[] } } =
            {};

          mealsSnap.forEach((doc) => {
            // Verificar se o ID do documento parece uma data válida (YYYY-MM-DD)
            if (/^\d{4}-\d{2}-\d{2}$/.test(doc.id)) {
              const docData = doc.data();

              // Verificar e limpar os dados antes de adicioná-los ao estado
              const cleanedMealData: { [mealId: string]: Food[] } = {};

              // Processar apenas as chaves que não são metadados
              Object.keys(docData).forEach((mealId) => {
                // Ignorar metadados comuns como data, updatedAt, etc.
                const knownMetadata = [
                  "data",
                  "date",
                  "updatedAt",
                  "createdAt",
                  "userId",
                  "user_id",
                ];
                if (knownMetadata.includes(mealId)) {
                  return;
                }

                // Verificar se o valor é um array
                if (Array.isArray(docData[mealId])) {
                  // Validar cada item do array
                  const validFoods = docData[mealId].filter((food: any) => {
                    return (
                      food &&
                      typeof food === "object" &&
                      typeof food.id === "string" &&
                      typeof food.name === "string" &&
                      !isNaN(Number(food.calories)) &&
                      !isNaN(Number(food.protein)) &&
                      !isNaN(Number(food.carbs)) &&
                      !isNaN(Number(food.fat)) &&
                      !isNaN(Number(food.portion))
                    );
                  });

                  cleanedMealData[mealId] = validFoods;
                }
              });

              // Adicionar apenas se houver refeições válidas
              if (Object.keys(cleanedMealData).length > 0) {
                mealsData[doc.id] = cleanedMealData;
              }
            }
          });

          setMeals(mealsData);

          // Salvar todos os dados carregados no armazenamento local
          for (const [date, mealData] of Object.entries(mealsData)) {
            await OfflineStorage.saveMealsData(user.uid, date, mealData);
          }
        } catch (firebaseError) {
          // Em caso de erro, garantir que os dados estejam limpos
          setMeals({});
        }
      } else {
        // Se está offline, log informativo
        // Já tentamos carregar dados locais e não temos, então mantemos vazio
      }
    } catch (error) {
      // Em caso de erro, garantir que os dados estejam limpos
      setMeals({});
    }
  }, [user, setMeals]);

  const loadMealTypes = useCallback(async () => {
    try {
      if (!user) return;

      // Limpar dados existentes antes de carregar
      setMealTypes([]);
      setHasMealTypesConfigured(false);

      // Primeiro tentar carregar do AsyncStorage
      try {
        const localMealTypes = await AsyncStorage.getItem(
          `${KEYS.MEAL_TYPES}:${user.uid}`
        );

        if (localMealTypes) {
          const parsedMealTypes = JSON.parse(localMealTypes) as MealType[];

          if (
            parsedMealTypes &&
            Array.isArray(parsedMealTypes) &&
            parsedMealTypes.length > 0
          ) {
            setMealTypes(parsedMealTypes);
            setHasMealTypesConfigured(true);
            return; // Retornar se já carregou do storage local
          }
        }
      } catch (localError) {
        console.error(
          "Erro ao carregar tipos de refeição do AsyncStorage:",
          localError
        );
      }

      // Verificar conexão com a internet antes de tentar acessar o Firebase
      const isOnline = await OfflineStorage.isOnline();

      if (isOnline) {
        // Se está online, tentar do Firebase
        try {
          // Buscar os tipos de refeições do usuário
          const mealTypesDoc = await getDoc(
            doc(db, "users", user.uid, "config", "mealTypes")
          );

          if (
            mealTypesDoc.exists() &&
            mealTypesDoc.data().types &&
            mealTypesDoc.data().types.length > 0
          ) {
            const mealTypesData = mealTypesDoc.data().types as MealType[];
            setMealTypes(mealTypesData);
            setHasMealTypesConfigured(true);

            // Salvar no AsyncStorage para uso offline
            try {
              await AsyncStorage.setItem(
                `${KEYS.MEAL_TYPES}:${user.uid}`,
                JSON.stringify(mealTypesData)
              );
            } catch (saveError) {
              console.error(
                "Erro ao salvar tipos de refeição no AsyncStorage:",
                saveError
              );
            }
          } else {
            setHasMealTypesConfigured(false);
          }
        } catch (firebaseError) {
          // Em caso de erro, garantir que os dados estejam limpos
          setMealTypes([]);
          setHasMealTypesConfigured(false);
        }
      }
    } catch (error) {
      // Em caso de erro, garantir que os dados estejam limpos
      setMealTypes([]);
      setHasMealTypesConfigured(false);
    }
  }, [user, setMealTypes, setHasMealTypesConfigured]);

  const addMealType = async (id: string, name: string, icon: string) => {
    try {
      // Verificar se o tipo de refeição já existe
      const existingType = mealTypes.find((type) => type.id === id);

      if (existingType) return;

      const newMealType: MealType = { id, name, icon };

      // Adicionar ao estado
      const updatedTypes = [...mealTypes, newMealType];
      setMealTypes(updatedTypes);

      // Salvar no AsyncStorage para persistência local
      if (user) {
        try {
          await AsyncStorage.setItem(
            `${KEYS.MEAL_TYPES}:${user.uid}`,
            JSON.stringify(updatedTypes)
          );
        } catch (storageError) {
          // Erro ao salvar tipo de refeição no AsyncStorage
        }

        // Salvar no Firestore se o usuário estiver autenticado
        try {
          await setDoc(
            doc(db, "users", user.uid, "config", "mealTypes"),
            { types: updatedTypes },
            { merge: true }
          );
        } catch (firebaseError) {
          // Erro ao salvar no Firebase, dados mantidos localmente
        }

        setHasMealTypesConfigured(true);
      }
    } catch (error) {
      // Erro ao adicionar tipo de refeição
    }
  };

  // Função para atualizar todos os tipos de refeições de uma vez
  const updateMealTypes = async (newMealTypes: MealType[]) => {
    try {
      // Identificar quais tipos de refeição foram removidos
      const currentMealTypeIds = mealTypes.map((type) => type.id);
      const newMealTypeIds = newMealTypes.map((type) => type.id);
      const removedMealTypeIds = currentMealTypeIds.filter(
        (id) => !newMealTypeIds.includes(id)
      );

      // Limpar os alimentos das refeições removidas
      if (removedMealTypeIds.length > 0) {
        setMeals((prevMeals) => {
          const updatedMeals = { ...prevMeals };

          // Percorrer todas as datas e remover as refeições que não existem mais
          Object.keys(updatedMeals).forEach((date) => {
            if (updatedMeals[date]) {
              // Para cada refeição removida, remover seus alimentos
              removedMealTypeIds.forEach((mealId) => {
                if (updatedMeals[date][mealId]) {
                  delete updatedMeals[date][mealId];
                }
              });
            }
          });

          return updatedMeals;
        });
      }

      // Atualizar os tipos de refeições
      setMealTypes(newMealTypes);

      if (newMealTypes.length > 0) {
        setHasMealTypesConfigured(true);
      } else {
        setHasMealTypesConfigured(false);
      }

      // Primeiro salvar no AsyncStorage para persistência local
      if (user) {
        try {
          await AsyncStorage.setItem(
            `${KEYS.MEAL_TYPES}:${user.uid}`,
            JSON.stringify(newMealTypes)
          );
        } catch (storageError) {
          // Ignorar erro de armazenamento local
        }

        // Depois tentar salvar no Firebase
        try {
          await setDoc(
            doc(db, "users", user.uid, "config", "mealTypes"),
            { types: newMealTypes },
            { merge: true }
          );

          // Salvar as alterações nas refeições após atualizar os tipos
          await saveMeals();
        } catch (firebaseError) {
          // Ignorar erro de Firebase, dados mantidos localmente
        }

        // Usar a função global se estiver disponível
        if ((global as any).updateNutritionMealTypes) {
          const mealTypeIds = newMealTypes.map((mealType) => mealType.id);
          (global as any).updateNutritionMealTypes(mealTypeIds);
        }
      }

      return true; // Retornar true para indicar sucesso
    } catch (error) {
      return false; // Retornar false para indicar falha
    }
  };

  const addFoodToMeal = (mealId: string, food: Food) => {
    setMeals((prevMeals) => {
      const updatedMeals = { ...prevMeals };

      // Inicializa a data se não existir
      if (!updatedMeals[selectedDate]) {
        updatedMeals[selectedDate] = {};
      }

      // Inicializa a refeição se não existir
      if (!updatedMeals[selectedDate][mealId]) {
        updatedMeals[selectedDate][mealId] = [];
      }

      // Verificar se o alimento já existe (para edição)
      const existingFoodIndex = updatedMeals[selectedDate][mealId].findIndex(
        (existingFood) => existingFood.id === food.id
      );

      if (existingFoodIndex !== -1) {
        // Atualizar o alimento existente
        const updatedFoods = [...updatedMeals[selectedDate][mealId]];
        updatedFoods[existingFoodIndex] = food;
        updatedMeals[selectedDate][mealId] = updatedFoods;
      } else {
        // Adicionar novo alimento
        updatedMeals[selectedDate][mealId] = [
          ...updatedMeals[selectedDate][mealId],
          food,
        ];
      }

      return updatedMeals;
    });

    // Salvar as alterações imediatamente com um pequeno delay
    // para garantir que o estado foi atualizado
    setTimeout(() => {
      saveMeals().catch(() => {
        // Ignorar erro ao salvar
      });
    }, 100);
  };

  const removeFoodFromMeal = async (mealId: string, foodId: string) => {
    try {
      setMeals((prevMeals) => {
        const updatedMeals = { ...prevMeals };
        if (updatedMeals[selectedDate]?.[mealId]) {
          updatedMeals[selectedDate][mealId] = updatedMeals[selectedDate][
            mealId
          ].filter((food) => food.id !== foodId);
        }
        return updatedMeals;
      });

      // Salvar alterações no Firestore com delay para garantir atualização do estado
      setTimeout(async () => {
        try {
          await saveMeals();
        } catch {
          // Ignorar erro ao salvar
        }
      }, 100);
    } catch (error) {
      // Propagar o erro para quem chamou a função
      throw error;
    }
  };

  const saveMeals = async () => {
    try {
      if (!user) return;

      // Primeiro salvar localmente para garantir persistência
      await OfflineStorage.saveMealsData(
        user.uid,
        selectedDate,
        meals[selectedDate] || {}
      );

      // Verificar conexão antes de tentar salvar no Firebase
      const isOnline = await OfflineStorage.isOnline();

      // Salvar no Firestore se o usuário estiver autenticado, não for anônimo e estiver online
      if (isOnline && user.uid && user.uid !== "anonymous") {
        try {
          // Salvar apenas a data selecionada
          await setDoc(
            doc(db, "users", user.uid, "meals", selectedDate),
            meals[selectedDate] || {}
          );
        } catch {
          // Ignorar erro do Firebase, dados mantidos localmente
        }
      }
    } catch {
      // Ignorar erro geral ao salvar refeições
    }
  };

  const getMealTotals = (mealId: string): MealTotals => {
    try {
      // Verificar se o mealId é uma string válida
      if (!mealId || typeof mealId !== "string") {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      // Verificar se o mealId corresponde a um tipo de refeição configurado
      const isMealTypeConfigured = mealTypes.some((type) => type.id === mealId);
      if (!isMealTypeConfigured) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      // Verificar se a data selecionada existe nos dados de refeições
      if (!meals || !meals[selectedDate]) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      // Obter os alimentos para a refeição
      const mealFoods = meals[selectedDate]?.[mealId];

      // Verificação de segurança para garantir que mealFoods seja sempre um array
      if (!mealFoods) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      if (!Array.isArray(mealFoods)) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      // Filtrar para garantir que só processamos objetos Food válidos
      const validFoods = mealFoods.filter(
        (food) =>
          food &&
          typeof food === "object" &&
          !isNaN(Number(food.calories)) &&
          !isNaN(Number(food.protein)) &&
          !isNaN(Number(food.carbs)) &&
          !isNaN(Number(food.fat))
      );

      // Calcular os totais de forma segura
      return validFoods.reduce(
        (acc, food) => ({
          calories: acc.calories + (Number(food.calories) || 0),
          protein: acc.protein + (Number(food.protein) || 0),
          carbs: acc.carbs + (Number(food.carbs) || 0),
          fat: acc.fat + (Number(food.fat) || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
    } catch (error) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
  };

  const getFoodsForMeal = (mealId: string): Food[] => {
    try {
      // Verificar se o mealId é uma string válida
      if (!mealId || typeof mealId !== "string") {
        return [];
      }

      // Verificar se o mealId corresponde a um tipo de refeição configurado
      const isMealTypeConfigured = mealTypes.some((type) => type.id === mealId);
      if (!isMealTypeConfigured) {
        return [];
      }

      // Verificar se a data selecionada existe nos dados de refeições
      if (!meals || !meals[selectedDate]) {
        return [];
      }

      const foods = meals[selectedDate]?.[mealId];

      // Se não há alimentos, retornar array vazio
      if (!foods) {
        return [];
      }

      // Garantir que sempre retorne um array
      if (!Array.isArray(foods)) {
        return [];
      }

      // Filtrar para garantir que só retornamos objetos Food válidos
      return foods.filter(
        (food) =>
          food &&
          typeof food === "object" &&
          typeof food.id === "string" &&
          typeof food.name === "string" &&
          !isNaN(Number(food.calories)) &&
          !isNaN(Number(food.protein)) &&
          !isNaN(Number(food.carbs)) &&
          !isNaN(Number(food.fat)) &&
          !isNaN(Number(food.portion))
      );
    } catch (error) {
      return [];
    }
  };

  const getDayTotals = (): MealTotals => {
    try {
      // Usar os IDs de refeição do dia atual ou os tipos de refeição configurados
      const currentDayMeals = meals[selectedDate] || {};
      let mealIds: string[] = [];

      if (Object.keys(currentDayMeals).length > 0) {
        // Filtramos as chaves para garantir que não estamos processando metadados
        // e que apenas consideramos refeições que existem na configuração atual
        const validMealTypeIds = mealTypes.map((type) => type.id);

        mealIds = Object.keys(currentDayMeals).filter((id) => {
          const knownMetadata = [
            "data",
            "date",
            "updatedAt",
            "createdAt",
            "userId",
            "user_id",
          ];
          // Somente incluir o ID se não for metadado E se for um tipo de refeição atual
          return !knownMetadata.includes(id) && validMealTypeIds.includes(id);
        });
      } else if (Array.isArray(mealTypes) && mealTypes.length > 0) {
        // Se não temos refeições, mas temos tipos configurados, usar esses IDs
        mealIds = mealTypes.map((type) => type.id);
      }

      // Se não temos IDs válidos, retornar zeros
      if (!mealIds.length) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      return mealIds.reduce(
        (acc, mealId) => {
          try {
            const mealTotals = getMealTotals(mealId);
            return {
              calories: acc.calories + (mealTotals.calories || 0),
              protein: acc.protein + (mealTotals.protein || 0),
              carbs: acc.carbs + (mealTotals.carbs || 0),
              fat: acc.fat + (mealTotals.fat || 0),
            };
          } catch (error) {
            // Em caso de erro, retornar os acumuladores sem adicionar nada
            return acc;
          }
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
    } catch (error) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
  };

  const addToSearchHistory = async (food: Food) => {
    if (!user) return;

    try {
      // Preservar a porção exata do alimento adicionado
      // Remover duplicatas pelo nome e manter apenas os 10 itens mais recentes
      const updatedHistory = [
        food,
        ...searchHistory.filter(
          (item) => item.name.toLowerCase() !== food.name.toLowerCase()
        ),
      ].slice(0, 10);

      // Atualizar estado imediatamente para refletir a mudança na UI
      setSearchHistory(updatedHistory);

      // Persistir o histórico entre sessões
      await OfflineStorage.saveSearchHistory(user.uid, updatedHistory);
    } catch {
      // Ignorar erro ao adicionar ao histórico
    }
  };

  const clearSearchHistory = async () => {
    if (!user) return;

    try {
      setSearchHistory([]);
      await OfflineStorage.clearSearchHistory(user.uid);
    } catch {
      // Ignorar erro ao limpar histórico
    }
  };

  // Função para copiar uma refeição de uma data para outra
  const copyMealFromDate = async (
    sourceDate: string,
    sourceMealId: string,
    targetMealId: string
  ) => {
    try {
      if (!user) return;

      // Verificar se a refeição de origem existe
      if (!meals[sourceDate]?.[sourceMealId]) {
        throw new Error("Refeição de origem não encontrada");
      }

      // Obter os alimentos da refeição de origem
      const sourceFoods = [...meals[sourceDate][sourceMealId]];

      // Gerar novos IDs para os alimentos copiados para evitar conflitos
      const copiedFoods = sourceFoods.map((food) => ({
        ...food,
        id: uuidv4(), // Gerar novo ID para cada alimento
      }));

      // Atualizar o estado
      setMeals((prevMeals) => {
        const updatedMeals = { ...prevMeals };

        // Inicializar a data de destino se não existir
        if (!updatedMeals[selectedDate]) {
          updatedMeals[selectedDate] = {};
        }

        // Inicializar a refeição de destino se não existir
        if (!updatedMeals[selectedDate][targetMealId]) {
          updatedMeals[selectedDate][targetMealId] = [];
        }

        // Adicionar os alimentos copiados à refeição de destino
        updatedMeals[selectedDate][targetMealId] = [
          ...updatedMeals[selectedDate][targetMealId],
          ...copiedFoods,
        ];

        return updatedMeals;
      });

      // Salvar as alterações
      await saveMeals();
    } catch (error) {
      // Erro ao copiar refeição
      throw error;
    }
  };

  // Adicionar a função de atualizar alimento em uma refeição
  const updateFoodInMeal = useCallback(
    (mealId: string, updatedFood: Food) => {
      // Primeiro atualizamos o estado
      setMeals((prevMeals) => {
        const updatedMeals = { ...prevMeals };

        // Verificar se a data e refeição existem
        if (
          !updatedMeals[selectedDate] ||
          !updatedMeals[selectedDate][mealId]
        ) {
          return prevMeals; // Retorna o estado anterior se não existir
        }

        // Encontrar o índice do alimento pelo ID
        const foodIndex = updatedMeals[selectedDate][mealId].findIndex(
          (food) => food.id === updatedFood.id
        );

        // Se o alimento foi encontrado, atualizá-lo
        if (foodIndex !== -1) {
          const updatedFoods = [...updatedMeals[selectedDate][mealId]];
          updatedFoods[foodIndex] = updatedFood;
          updatedMeals[selectedDate][mealId] = updatedFoods;
        }

        return updatedMeals;
      });

      // Usar setTimeout para garantir que o estado foi atualizado antes de salvar
      setTimeout(async () => {
        try {
          await saveMeals();
        } catch {
          // Ignorar erro ao salvar
        }
      }, 100);
    },
    [selectedDate, meals, user]
  );

  // Memorizando o valor do contexto para evitar re-renderizações desnecessárias
  const contextValue = useMemo(
    () => ({
      meals,
      mealTypes,
      selectedDate,
      setSelectedDate,
      getMealTotals,
      getFoodsForMeal,
      getDayTotals,
      addFoodToMeal,
      updateFoodInMeal,
      removeFoodFromMeal,
      saveMeals,
      addMealType,
      updateMealTypes,
      hasMealTypesConfigured,
      searchHistory,
      addToSearchHistory,
      clearSearchHistory,
      copyMealFromDate,
    }),
    [
      meals,
      mealTypes,
      selectedDate,
      getMealTotals,
      getFoodsForMeal,
      getDayTotals,
      addFoodToMeal,
      updateFoodInMeal,
      removeFoodFromMeal,
      saveMeals,
      addMealType,
      updateMealTypes,
      hasMealTypesConfigured,
      searchHistory,
      addToSearchHistory,
      clearSearchHistory,
      copyMealFromDate,
    ]
  );

  return (
    <MealContext.Provider value={contextValue}>{children}</MealContext.Provider>
  );
}

export function useMeals() {
  const context = useContext(MealContext);
  if (context === undefined) {
    throw new Error("useMeals must be used within a MealProvider");
  }
  return context;
}

// Mantido por compatibilidade com código existente
export const useMealContext = useMeals;
