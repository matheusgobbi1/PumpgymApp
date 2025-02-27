import React, { createContext, useState, useContext, ReactNode } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";
import { OfflineStorage } from "../services/OfflineStorage";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

// Tipos
export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: number;
  unit: string;
}

export interface Meal {
  id: string;
  name: string;
  icon: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  foods: Food[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface DayMeals {
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

interface MealContextType {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  meals: Meal[];
  addFoodToMeal: (mealId: string, food: Food) => void;
  removeFoodFromMeal: (mealId: string, foodId: string) => void;
  getMealTotals: (mealId: string) => {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  getDayTotals: () => {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  saveMeals: () => Promise<void>;
  loadMeals: (date: Date) => Promise<void>;
}

const MealContext = createContext<MealContextType | undefined>(undefined);

export const useMeals = () => {
  const context = useContext(MealContext);
  if (!context) {
    throw new Error("useMeals deve ser usado dentro de um MealProvider");
  }
  return context;
};

const DEFAULT_MEALS: Meal[] = [
  {
    id: "breakfast",
    name: "Café da Manhã",
    icon: "sunny-outline",
    targetCalories: 0,
    targetProtein: 0,
    targetCarbs: 0,
    targetFat: 0,
    foods: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  },
  {
    id: "lunch",
    name: "Almoço",
    icon: "restaurant-outline",
    targetCalories: 0,
    targetProtein: 0,
    targetCarbs: 0,
    targetFat: 0,
    foods: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  },
  {
    id: "snack",
    name: "Lanche",
    icon: "cafe-outline",
    targetCalories: 0,
    targetProtein: 0,
    targetCarbs: 0,
    targetFat: 0,
    foods: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  },
  {
    id: "dinner",
    name: "Jantar",
    icon: "moon-outline",
    targetCalories: 0,
    targetProtein: 0,
    targetCarbs: 0,
    targetFat: 0,
    foods: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  },
];

interface MealProviderProps {
  children: ReactNode;
}

export const MealProvider = ({ children }: MealProviderProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meals, setMeals] = useState<Meal[]>(DEFAULT_MEALS);
  const { user } = useAuth();

  // Adicionar alimento a uma refeição
  const addFoodToMeal = (mealId: string, food: Food) => {
    setMeals((currentMeals) => {
      return currentMeals.map((meal) => {
        if (meal.id === mealId) {
          const updatedFoods = [...meal.foods, { ...food, id: uuidv4() }];
          const totals = calculateMealTotals(updatedFoods);
          return {
            ...meal,
            foods: updatedFoods,
            ...totals,
          };
        }
        return meal;
      });
    });
  };

  // Remover alimento de uma refeição
  const removeFoodFromMeal = (mealId: string, foodId: string) => {
    setMeals((currentMeals) => {
      return currentMeals.map((meal) => {
        if (meal.id === mealId) {
          const updatedFoods = meal.foods.filter((food) => food.id !== foodId);
          const totals = calculateMealTotals(updatedFoods);
          return {
            ...meal,
            foods: updatedFoods,
            ...totals,
          };
        }
        return meal;
      });
    });
  };

  // Calcular totais de uma refeição
  const calculateMealTotals = (foods: Food[]) => {
    return foods.reduce(
      (acc, food) => {
        return {
          totalCalories: acc.totalCalories + food.calories,
          totalProtein: acc.totalProtein + food.protein,
          totalCarbs: acc.totalCarbs + food.carbs,
          totalFat: acc.totalFat + food.fat,
        };
      },
      { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
    );
  };

  // Obter totais de uma refeição específica
  const getMealTotals = (mealId: string) => {
    const meal = meals.find((m) => m.id === mealId);
    if (!meal) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

    return {
      calories: meal.totalCalories,
      protein: meal.totalProtein,
      carbs: meal.totalCarbs,
      fat: meal.totalFat,
    };
  };

  // Obter totais do dia
  const getDayTotals = () => {
    return meals.reduce(
      (acc, meal) => {
        return {
          calories: acc.calories + meal.totalCalories,
          protein: acc.protein + meal.totalProtein,
          carbs: acc.carbs + meal.totalCarbs,
          fat: acc.fat + meal.totalFat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  // Salvar refeições no Firebase/Storage local
  const saveMeals = async () => {
    if (!user) return;

    const dateStr = currentDate.toISOString().split("T")[0];
    const mealsData = {
      date: dateStr,
      meals,
      ...getDayTotals(),
    };

    try {
      const isOnline = await OfflineStorage.isOnline();

      if (isOnline) {
        await setDoc(doc(db, "users", user.uid, "meals", dateStr), mealsData);
      }

      // Sempre salvar localmente
      await OfflineStorage.saveMealsData(user.uid, dateStr, mealsData);
    } catch (error) {
      console.error("Erro ao salvar refeições:", error);
    }
  };

  // Carregar refeições do Firebase/Storage local
  const loadMeals = async (date: Date) => {
    if (!user) return;

    const dateStr = date.toISOString().split("T")[0];

    try {
      const isOnline = await OfflineStorage.isOnline();
      let mealsData;

      if (isOnline) {
        const docRef = doc(db, "users", user.uid, "meals", dateStr);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          mealsData = docSnap.data();
        }
      }

      if (!mealsData) {
        // Tentar carregar dados locais
        mealsData = await OfflineStorage.loadMealsData(user.uid, dateStr);
      }

      if (mealsData) {
        setMeals(mealsData.meals);
      } else {
        // Se não houver dados, usar refeições padrão
        setMeals(DEFAULT_MEALS);
      }
    } catch (error) {
      console.error("Erro ao carregar refeições:", error);
      setMeals(DEFAULT_MEALS);
    }
  };

  return (
    <MealContext.Provider
      value={{
        currentDate,
        setCurrentDate,
        meals,
        addFoodToMeal,
        removeFoodFromMeal,
        getMealTotals,
        getDayTotals,
        saveMeals,
        loadMeals,
      }}
    >
      {children}
    </MealContext.Provider>
  );
};
