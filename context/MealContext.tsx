import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  getDocs,
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
  saveMeals: () => Promise<void>;
  addMealType: (id: string, name: string, icon: string) => void;
  resetMealTypes: () => Promise<void>;
  updateMealTypes: (mealTypes: MealType[]) => Promise<void>;
  hasMealTypesConfigured: boolean;
  searchHistory: Food[];
  addToSearchHistory: (food: Food) => Promise<void>;
  clearSearchHistory: () => Promise<void>;
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
  const [hasMealTypesConfigured, setHasMealTypesConfigured] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<Food[]>([]);

  // Resetar o estado quando o usuário mudar
  const resetState = () => {
    setMeals({});
    setMealTypes([]);
    setHasMealTypesConfigured(false);
  };

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

  const loadMeals = async () => {
    try {
      if (!user) return;

      console.log("Carregando refeições para o usuário:", user.uid);

      // Limpar dados existentes antes de carregar
      setMeals({});

      // Buscar todas as refeições do usuário
      const mealsRef = collection(db, "users", user.uid, "meals");
      const mealsSnap = await getDocs(mealsRef);

      const mealsData: { [date: string]: { [mealId: string]: Food[] } } = {};

      mealsSnap.forEach((doc) => {
        mealsData[doc.id] = doc.data() as { [mealId: string]: Food[] };
      });
      
      setMeals(mealsData);
    } catch (error) {
      console.error("Erro ao carregar refeições:", error);
      // Em caso de erro, garantir que os dados estejam limpos
      setMeals({});
    }
  };

  const loadMealTypes = async () => {
    try {
      if (!user) return;

      // Limpar dados existentes antes de carregar
      setMealTypes([]);
      setHasMealTypesConfigured(false);

      // Buscar os tipos de refeições do usuário
      const mealTypesDoc = await getDoc(doc(db, "users", user.uid, "config", "mealTypes"));

      if (mealTypesDoc.exists() && mealTypesDoc.data().types && mealTypesDoc.data().types.length > 0) {
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
  };

  const addMealType = async (id: string, name: string, icon: string) => {
    try {
      // Verificar se o tipo de refeição já existe
      const existingType = mealTypes.find(type => type.id === id);
      
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
  };

  // Função para redefinir os tipos de refeições
  const resetMealTypes = async () => {
    try {
      setMealTypes([]);
      setHasMealTypesConfigured(false);
      
      if (user) {
        await setDoc(
          doc(db, "users", user.uid, "config", "mealTypes"),
          { types: [] },
          { merge: true }
        );
      }
    } catch (error) {
      console.error("Erro ao redefinir tipos de refeições:", error);
    }
  };

  // Função para atualizar todos os tipos de refeições de uma vez
  const updateMealTypes = async (newMealTypes: MealType[]) => {
    try {
      // Log para depuração
      console.log('Atualizando tipos de refeições:', newMealTypes.map(m => m.name).join(', '));
      
      setMealTypes(newMealTypes);
      
      if (newMealTypes.length > 0) {
        setHasMealTypesConfigured(true);
      } else {
        setHasMealTypesConfigured(false);
      }
      
      if (user) {
        await setDoc(
          doc(db, "users", user.uid, "config", "mealTypes"),
          { types: newMealTypes },
          { merge: true }
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar tipos de refeições:", error);
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
          food
        ];
      }

      return updatedMeals;
    });
    
    // Salvar as alterações imediatamente
    saveMeals();
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

      // Salvar alterações no Firestore
      await saveMeals();
    } catch (error) {
      console.error("Erro ao remover alimento:", error);
      throw error;
    }
  };

  const saveMeals = async () => {
    try {
      if (!user) return;

      // Salvar apenas a data selecionada
      await setDoc(
        doc(db, "users", user.uid, "meals", selectedDate),
        meals[selectedDate] || {}
      );
    } catch (error) {
      console.error("Erro ao salvar refeições:", error);
    }
  };

  const getMealTotals = (mealId: string): MealTotals => {
    const mealFoods = meals[selectedDate]?.[mealId] || [];
    return mealFoods.reduce(
      (acc, food) => ({
        calories: acc.calories + food.calories,
        protein: acc.protein + food.protein,
        carbs: acc.carbs + food.carbs,
        fat: acc.fat + food.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const getFoodsForMeal = (mealId: string): Food[] => {
    return meals[selectedDate]?.[mealId] || [];
  };

  const getDayTotals = (): MealTotals => {
    // Usar os IDs de refeição do dia atual ou os tipos de refeição configurados
    const currentDayMeals = meals[selectedDate] || {};
    const mealIds = Object.keys(currentDayMeals).length > 0 
      ? Object.keys(currentDayMeals) 
      : mealTypes.map(type => type.id);
    
    return mealIds.reduce(
      (acc, mealId) => {
        const mealTotals = getMealTotals(mealId);
        return {
          calories: acc.calories + mealTotals.calories,
          protein: acc.protein + mealTotals.protein,
          carbs: acc.carbs + mealTotals.carbs,
          fat: acc.fat + mealTotals.fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const addToSearchHistory = async (food: Food) => {
    if (!user) return;

    try {
      // Preservar a porção exata do alimento adicionado
      // Remover duplicatas pelo ID e manter apenas os 10 itens mais recentes
      const updatedHistory = [
        food, 
        ...searchHistory.filter(item => item.id !== food.id)
      ].slice(0, 10);
      
      // Atualizar estado imediatamente para refletir a mudança na UI
      setSearchHistory(updatedHistory);
      
      // Persistir o histórico entre sessões
      await OfflineStorage.saveSearchHistory(user.uid, updatedHistory);
    } catch (error) {
      console.error("Erro ao adicionar ao histórico de busca:", error);
    }
  };

  const clearSearchHistory = async () => {
    if (!user) return;

    try {
      setSearchHistory([]);
      await OfflineStorage.clearSearchHistory(user.uid);
    } catch (error) {
      console.error("Erro ao limpar histórico de busca:", error);
    }
  };

  return (
    <MealContext.Provider
      value={{
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
      }}
    >
      {children}
    </MealContext.Provider>
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
