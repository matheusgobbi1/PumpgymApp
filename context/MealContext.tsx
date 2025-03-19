import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";
import { OfflineStorage } from "../services/OfflineStorage";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

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
}

export interface Meal {
  id: string;
  name: string;
  icon: string;
  foods: Food[];
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
  removeFoodFromMeal: (mealId: string, foodId: string) => Promise<void>;
  saveMeals: () => Promise<boolean>;
  addMealType: (id: string, name: string, icon: string) => void;
  resetMealTypes: () => Promise<boolean>;
  updateMealTypes: (mealTypes: MealType[]) => Promise<boolean>;
  hasMealTypesConfigured: boolean;
  searchHistory: Food[];
  addToSearchHistory: (food: Food) => Promise<void>;
  clearSearchHistory: () => Promise<void>;
  copyMealFromDate: (
    sourceDate: string,
    sourceMealId: string,
    targetMealId: string
  ) => Promise<boolean>;
  foodsForSelectedDate: { [mealId: string]: Food[] };
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
  const [contextVersion, setContextVersion] = useState(0);

  // Resetar o estado quando o usuário mudar
  const resetState = useCallback(() => {
    setMeals({});
    setMealTypes([]);
    setHasMealTypesConfigured(false);
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
  }, [user?.uid, resetState]); // Usar user.uid como dependência para detectar mudança de usuário

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

  const loadMeals = useCallback(async () => {
    try {
      if (!user) return;

      // Limpar dados existentes antes de carregar
      setMeals({});

      // Primeiro carregar todas as datas salvas localmente
      const datesWithMeals = await OfflineStorage.getDatesWithMeals(user.uid);
      const localMealsData: { [date: string]: { [mealId: string]: Food[] } } =
        {};

      // Carregar dados de todas as datas
      for (const date of datesWithMeals) {
        const localData = await OfflineStorage.loadMealsData(user.uid, date);
        if (localData) {
          localMealsData[date] = localData;
        }
      }

      // Atualizar estado com dados locais primeiro
      if (Object.keys(localMealsData).length > 0) {
        setMeals(localMealsData);
      }

      // Tentar sincronizar com Firestore se houver conexão
      try {
        const mealsRef = collection(db, "users", user.uid, "meals");
        const mealsSnap = await getDocs(mealsRef);

        const firestoreData: { [date: string]: { [mealId: string]: Food[] } } =
          {};

        mealsSnap.forEach((doc) => {
          firestoreData[doc.id] = doc.data() as { [mealId: string]: Food[] };
        });

        // Mesclar dados do Firestore com dados locais
        const mergedData = { ...localMealsData, ...firestoreData };
        setMeals(mergedData);

        // Atualizar dados locais com dados do Firestore
        Object.entries(firestoreData).forEach(async ([date, mealData]) => {
          await OfflineStorage.saveMealsData(user.uid, date, mealData);
        });
      } catch (error) {
        console.error(
          "Erro ao sincronizar com Firestore, usando dados locais:",
          error
        );
      }
    } catch (error) {
      console.error("Erro ao carregar refeições:", error);
    }
  }, [user]);

  const loadMealTypes = useCallback(async () => {
    try {
      if (!user) return;

      // Limpar dados existentes antes de carregar
      setMealTypes([]);
      setHasMealTypesConfigured(false);

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
      } else {
        setHasMealTypesConfigured(false);
      }
    } catch (error) {
      console.error("Erro ao carregar tipos de refeições:", error);
      // Em caso de erro, garantir que os dados estejam limpos
      setMealTypes([]);
      setHasMealTypesConfigured(false);
    }
  }, [user]);

  const addMealType = useCallback(
    async (id: string, name: string, icon: string) => {
      try {
        // Verificar se o tipo de refeição já existe
        const existingType = mealTypes.find((type) => type.id === id);

        if (existingType) return;

        const newMealType: MealType = { id, name, icon };

        // Adicionar ao estado
        const updatedTypes = [...mealTypes, newMealType];
        setMealTypes(updatedTypes);

        // Salvar no Firestore se o usuário estiver autenticado
        if (user) {
          await setDoc(
            doc(db, "users", user.uid, "config", "mealTypes"),
            { types: updatedTypes },
            { merge: true }
          );
          setHasMealTypesConfigured(true);
        }
      } catch (error) {
        console.error("Erro ao adicionar tipo de refeição:", error);
      }
    },
    [mealTypes, user]
  );

  // Função para atualizar os tipos de refeições
  const updateMealTypes = useCallback(
    async (newMealTypes: MealType[]) => {
      try {
        if (!newMealTypes || !Array.isArray(newMealTypes)) {
          console.error(
            "Tipos de refeição inválidos fornecidos:",
            newMealTypes
          );
          return false;
        }

        // Criar uma cópia segura dos dados
        const safeTypes = newMealTypes.map((type) => ({
          id: type.id || `type_${Date.now()}`,
          name: type.name || "Refeição",
          icon: type.icon || "restaurant-outline",
          color: type.color || "#FF9500",
        }));

        // Atualização em lote para evitar múltiplas renderizações
        const batchUpdates = () => {
          // Atualizar estado
          setHasMealTypesConfigured(safeTypes.length > 0);
          setMealTypes(safeTypes);
          // Incrementar a versão do contexto para forçar atualização nas dependências
          setContextVersion((prev) => prev + 1);
        };

        // Executar atualizações de estado em lote
        batchUpdates();

        // Salvar no Firestore se o usuário estiver autenticado
        if (user) {
          try {
            await setDoc(
              doc(db, "users", user.uid, "config", "mealTypes"),
              { types: safeTypes },
              { merge: true }
            );
          } catch (firestoreError) {
            console.error(
              "Erro ao salvar tipos de refeição no Firestore:",
              firestoreError
            );
            // Continuar mesmo com erro no Firestore
          }
        }

        return true;
      } catch (error) {
        console.error("Erro ao atualizar tipos de refeições:", error);
        return false;
      }
    },
    [user]
  );

  // Função para redefinir os tipos de refeições
  const resetMealTypes = useCallback(async () => {
    try {
      // Atualizações em lote para evitar flashes
      const batchUpdates = () => {
        // Limpar tipos de refeições
        setMealTypes([]);
        setHasMealTypesConfigured(false);
        // Limpar também as refeições do usuário, já que os tipos foram removidos
        setMeals({});
        // Limpar o histórico de busca
        setSearchHistory([]);
        // Forçar atualização do contexto para refletir as mudanças
        setContextVersion((prev) => prev + 1);
      };

      // Executar atualizações de estado em lote
      batchUpdates();

      // Remover dados do Firestore
      if (user) {
        await setDoc(doc(db, "users", user.uid, "config", "mealTypes"), {
          types: [],
        });

        // Também limpar os dados de refeições no Firestore
        const mealsRef = collection(db, "users", user.uid, "meals");
        const mealsSnap = await getDocs(mealsRef);

        const batch = writeBatch(db);
        mealsSnap.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Executar batch para remover todos os documentos
        await batch.commit();

        // Limpar dados locais
        try {
          // Usar a nova função para limpar todas as refeições de uma vez
          await OfflineStorage.clearAllMealsData(user.uid);
          // Limpar também o histórico de comidas salvo localmente
          await OfflineStorage.saveSearchHistory(user.uid, []);
        } catch (innerError) {
          console.error("Erro ao limpar dados locais:", innerError);

          // Fallback: Se a função clearAllMealsData falhar, tentar método alternativo
          try {
            // Obter todas as datas com refeições de forma segura
            const datesWithMeals = await OfflineStorage.getDatesWithMeals(
              user.uid
            );

            if (datesWithMeals && Array.isArray(datesWithMeals)) {
              // Limpar os dados para cada data
              for (let i = 0; i < datesWithMeals.length; i++) {
                const date = datesWithMeals[i];
                await OfflineStorage.saveMealsData(user.uid, date, {});
              }
            }
          } catch (fallbackError) {
            console.error(
              "Erro no método alternativo de limpeza:",
              fallbackError
            );
          }
        }
      }

      return true;
    } catch (error) {
      console.error("Erro ao redefinir tipos de refeições:", error);
      return false;
    }
  }, [user]);

  // Adicionar uma comida a uma refeição
  const addFoodToMeal = useCallback(
    (mealId: string, food: Food) => {
      setMeals((prevMeals) => {
        // Criar uma cópia profunda do estado atual (necessário para objetos aninhados)
        const updatedMeals = JSON.parse(JSON.stringify(prevMeals));

        // Garantir que a data selecionada existe
        if (!updatedMeals[selectedDate]) {
          updatedMeals[selectedDate] = {};
        }

        // Garantir que a refeição existe
        if (!updatedMeals[selectedDate][mealId]) {
          updatedMeals[selectedDate][mealId] = [];
        }

        // Adicionar a comida à refeição
        updatedMeals[selectedDate][mealId].push(food);

        return updatedMeals;
      });
    },
    [selectedDate]
  );

  // Remover uma comida de uma refeição
  const removeFoodFromMeal = useCallback(
    async (mealId: string, foodId: string) => {
      setMeals((prevMeals) => {
        const updatedMeals = JSON.parse(JSON.stringify(prevMeals));

        // Verificar se a data e refeição existem
        if (updatedMeals[selectedDate] && updatedMeals[selectedDate][mealId]) {
          // Filtrar a comida pelo ID
          updatedMeals[selectedDate][mealId] = updatedMeals[selectedDate][
            mealId
          ].filter((food: Food) => food.id !== foodId);
        }

        return updatedMeals;
      });
    },
    [selectedDate]
  );

  // Salvar refeições no Firestore e localStorage
  const saveMeals = useCallback(async () => {
    try {
      if (!user) return false;

      try {
        // Verificar se a data selecionada existe nos dados de refeições
        const mealsForDate = meals[selectedDate] || {};

        // Criar uma cópia segura dos dados antes de salvar
        const safeData = {};

        // Converter manualmente para um objeto seguro
        Object.keys(mealsForDate).forEach((mealId) => {
          safeData[mealId] = Array.isArray(mealsForDate[mealId])
            ? [...mealsForDate[mealId]]
            : [];
        });

        // Salvar dados localmente primeiro
        await OfflineStorage.saveMealsData(user.uid, selectedDate, safeData);

        // Salvar no Firestore
        await setDoc(
          doc(db, "users", user.uid, "meals", selectedDate),
          safeData,
          { merge: true }
        );
      } catch (saveError) {
        console.error("Erro ao salvar dados de refeições:", saveError);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao salvar refeições:", error);
      return false;
    }
  }, [user, selectedDate, meals]);

  // Obter os totais para uma refeição específica
  const getMealTotals = useCallback(
    (mealId: string): MealTotals => {
      const emptyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

      if (!meals[selectedDate] || !meals[selectedDate][mealId]) {
        return emptyTotals;
      }

      return meals[selectedDate][mealId].reduce(
        (totals, food) => ({
          calories: totals.calories + food.calories,
          protein: totals.protein + food.protein,
          carbs: totals.carbs + food.carbs,
          fat: totals.fat + food.fat,
        }),
        emptyTotals
      );
    },
    [meals, selectedDate]
  );

  // Obter comidas para uma refeição específica
  const getFoodsForMeal = useCallback(
    (mealId: string): Food[] => {
      return meals[selectedDate]?.[mealId] || [];
    },
    [meals, selectedDate]
  );

  // Obter totais do dia
  const getDayTotals = useCallback((): MealTotals => {
    const emptyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    if (!meals[selectedDate]) {
      return emptyTotals;
    }

    let dayTotals = { ...emptyTotals };

    Object.keys(meals[selectedDate]).forEach((mealId) => {
      const mealTotals = getMealTotals(mealId);
      dayTotals.calories += mealTotals.calories;
      dayTotals.protein += mealTotals.protein;
      dayTotals.carbs += mealTotals.carbs;
      dayTotals.fat += mealTotals.fat;
    });

    return dayTotals;
  }, [meals, selectedDate, getMealTotals]);

  // Adicionar comida ao histórico de busca
  const addToSearchHistory = useCallback(
    async (food: Food) => {
      try {
        if (!user) return;

        // Verificar se a comida já existe no histórico - atualizar se existir
        const existingIndex = searchHistory.findIndex(
          (item) => item.id === food.id
        );

        let updatedHistory = [...searchHistory];

        if (existingIndex >= 0) {
          // Remover a entrada existente
          updatedHistory.splice(existingIndex, 1);
        }

        // Adicionar a nova comida no início da lista
        updatedHistory = [food, ...updatedHistory];

        // Limitar o histórico a 50 itens
        if (updatedHistory.length > 50) {
          updatedHistory = updatedHistory.slice(0, 50);
        }

        // Atualizar estado
        setSearchHistory(updatedHistory);

        // Salvar histórico localmente
        await OfflineStorage.saveSearchHistory(user.uid, updatedHistory);
      } catch (error) {
        console.error("Erro ao adicionar ao histórico de busca:", error);
      }
    },
    [user, searchHistory]
  );

  // Limpar o histórico de busca
  const clearSearchHistory = useCallback(async () => {
    try {
      if (!user) return;

      // Limpar estado
      setSearchHistory([]);

      // Limpar dados locais
      await OfflineStorage.saveSearchHistory(user.uid, []);
    } catch (error) {
      console.error("Erro ao limpar histórico de busca:", error);
    }
  }, [user]);

  // Copiar refeição de uma data para outra
  const copyMealFromDate = useCallback(
    async (sourceDate: string, sourceMealId: string, targetMealId: string) => {
      try {
        // Verificar se a data e a refeição de origem existem
        if (!meals[sourceDate] || !meals[sourceDate][sourceMealId]) {
          console.error("Refeição de origem não encontrada");
          return false;
        }

        // Obter comidas da refeição de origem
        const sourceFoods = [...meals[sourceDate][sourceMealId]];

        // Atualizar o estado
        setMeals((prevMeals) => {
          // Criar uma cópia profunda do estado atual
          const updatedMeals = JSON.parse(JSON.stringify(prevMeals));

          // Garantir que a data de destino existe
          if (!updatedMeals[selectedDate]) {
            updatedMeals[selectedDate] = {};
          }

          // Garantir que a refeição de destino existe
          if (!updatedMeals[selectedDate][targetMealId]) {
            updatedMeals[selectedDate][targetMealId] = [];
          }

          // Adicionar as comidas à refeição de destino
          sourceFoods.forEach((food) => {
            // Gerar um novo ID para cada comida copiada para evitar conflitos
            const foodCopy = { ...food, id: uuidv4() };
            updatedMeals[selectedDate][targetMealId].push(foodCopy);
          });

          return updatedMeals;
        });

        // Salvar as alterações
        await saveMeals();

        return true;
      } catch (error) {
        console.error("Erro ao copiar refeição:", error);
        return false;
      }
    },
    [meals, selectedDate, saveMeals]
  );

  // Memorizar as comidas para a data selecionada
  const foodsForSelectedDate = useMemo(() => {
    return meals[selectedDate] || {};
  }, [meals, selectedDate]);

  // Memorizar o valor do contexto para evitar re-renderizações desnecessárias
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
      removeFoodFromMeal,
      saveMeals,
      addMealType,
      resetMealTypes,
      updateMealTypes,
      hasMealTypesConfigured,
      searchHistory,
      addToSearchHistory,
      clearSearchHistory,
      copyMealFromDate,
      foodsForSelectedDate,
    }),
    [
      meals,
      mealTypes,
      selectedDate,
      getMealTotals,
      getFoodsForMeal,
      getDayTotals,
      addFoodToMeal,
      removeFoodFromMeal,
      saveMeals,
      addMealType,
      resetMealTypes,
      updateMealTypes,
      hasMealTypesConfigured,
      searchHistory,
      addToSearchHistory,
      clearSearchHistory,
      copyMealFromDate,
      foodsForSelectedDate,
      contextVersion, // Incluir na dependência para forçar atualizações
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

export function useMealContext() {
  return useMeals();
}
