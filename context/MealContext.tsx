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

interface MealTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealContextType {
  meals: { [date: string]: { [mealId: string]: Food[] } };
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  getMealTotals: (mealId: string) => MealTotals;
  getFoodsForMeal: (mealId: string) => Food[];
  getDayTotals: () => MealTotals;
  addFoodToMeal: (mealId: string, food: Food) => void;
  removeFoodFromMeal: (mealId: string, foodId: string) => Promise<void>;
  saveMeals: () => Promise<void>;
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

  // Carregar refeições do usuário
  useEffect(() => {
    if (user) {
      loadMeals();
    }
  }, [user]);

  const loadMeals = async () => {
    try {
      if (!user) return;

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

      // Adiciona o alimento à refeição
      updatedMeals[selectedDate][mealId].push(food);

      return updatedMeals;
    });
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
    const mealIds = ["breakfast", "lunch", "snack", "dinner"];
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

  return (
    <MealContext.Provider
      value={{
        meals,
        selectedDate,
        setSelectedDate,
        getMealTotals,
        getFoodsForMeal,
        getDayTotals,
        addFoodToMeal,
        removeFoodFromMeal,
        saveMeals,
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
