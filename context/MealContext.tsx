import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
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

export interface MealContextType {
  meals: Record<string, Record<string, Food[]>>;
  mealTypes: MealType[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  getMealTotals: (mealId: string) => MealTotals;
  getFoodsForMeal: (mealId: string) => Food[];
  getDayTotals: () => MealTotals;
  addFoodToMeal: (mealId: string, food: Food) => Promise<void> | void;
  addFoodsToMeal: (mealId: string, foods: Food[]) => Promise<void>;
  updateFoodInMeal: (mealId: string, updatedFood: Food) => void;
  removeFoodFromMeal: (mealId: string, foodId: string) => Promise<void>;
  saveMeals: () => Promise<void>;
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
  ) => Promise<void>;
  getDailyTotals: () => { calories: number; protein: number; carbs: number; fat: number };
  getMealsList: () => { id: string; name: string }[];
  addMeal: (mealName: string) => Promise<string | null>;
  deleteMeal: (mealId: string) => Promise<boolean>;
  reorderMeals: (mealIds: string[]) => Promise<void>;
  loadingStatus: 'idle' | 'loading' | 'success' | 'error';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            console.log(
              "Refeições para a data selecionada carregadas localmente"
            );
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
                console.error(
                  "Erro ao carregar refeições da data selecionada:",
                  error
                );
                // Inicializar com objeto vazio em caso de erro
                setMeals((prevMeals) => ({
                  ...prevMeals,
                  [selectedDate]: {},
                }));
              }
            } else {
              // Se está offline, inicializar com objeto vazio
              console.log("Dispositivo offline. Usando dados locais vazios.");
              setMeals((prevMeals) => ({
                ...prevMeals,
                [selectedDate]: {},
              }));
            }
          }
        } catch (error) {
          console.error(
            "Erro ao carregar refeições para a data selecionada:",
            error
          );
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
        const mealKeys = localMealsKeys.filter(key => 
          key.startsWith(`${KEYS.MEALS_KEY}${user.uid}:`) && 
          // Filtrar chaves que terminam com data válida YYYY-MM-DD
          /:\d{4}-\d{2}-\d{2}$/.test(key)
        );
        
        if (mealKeys.length > 0) {
          const localMealsData: { [date: string]: { [mealId: string]: Food[] } } = {};
          
          // Obter todos os dados locais de refeições
          for (const key of mealKeys) {
            const parts = key.split(':');
            if (parts.length >= 3) {
              const dateString = parts[parts.length - 1];
              // Verificar se a data está no formato correto antes de buscar os dados
              if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                const mealData = await OfflineStorage.loadMealsData(user.uid, dateString);
                if (mealData && Object.keys(mealData).length > 0) {
                  localMealsData[dateString] = mealData;
                }
              }
            }
          }
          
          if (Object.keys(localMealsData).length > 0) {
            setMeals(localMealsData);
            console.log("Todas as refeições carregadas do armazenamento local com sucesso");
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

          const mealsData: { [date: string]: { [mealId: string]: Food[] } } = {};

          mealsSnap.forEach((doc) => {
            // Verificar se o ID do documento parece uma data válida (YYYY-MM-DD)
            if (/^\d{4}-\d{2}-\d{2}$/.test(doc.id)) {
              const docData = doc.data();
              
              // Verificar e limpar os dados antes de adicioná-los ao estado
              const cleanedMealData: { [mealId: string]: Food[] } = {};
              
              // Processar apenas as chaves que não são metadados
              Object.keys(docData).forEach((mealId) => {
                // Ignorar metadados comuns como data, updatedAt, etc.
                const knownMetadata = ['data', 'date', 'updatedAt', 'createdAt', 'userId', 'user_id'];
                if (knownMetadata.includes(mealId)) {
                  return;
                }
                
                // Verificar se o valor é um array
                if (Array.isArray(docData[mealId])) {
                  // Validar cada item do array
                  const validFoods = docData[mealId].filter((food: any) => {
                    return (
                      food && 
                      typeof food === 'object' && 
                      typeof food.id === 'string' && 
                      typeof food.name === 'string' &&
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
          console.log("Todas as refeições carregadas e limpas do Firebase com sucesso");

          // Salvar todos os dados carregados no armazenamento local
          for (const [date, mealData] of Object.entries(mealsData)) {
            await OfflineStorage.saveMealsData(user.uid, date, mealData);
          }
        } catch (firebaseError) {
          console.error("Erro ao carregar refeições do Firebase:", firebaseError);
          // Em caso de erro, garantir que os dados estejam limpos
          setMeals({});
        }
      } else {
        // Se está offline, log informativo
        console.log("Dispositivo offline. Não foi possível carregar dados do Firebase.");
        // Já tentamos carregar dados locais e não temos, então mantemos vazio
      }
    } catch (error) {
      console.error("Erro ao carregar refeições:", error);
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
        console.log("Tentando carregar tipos de refeição do AsyncStorage...");
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
            console.log(
              "Tipos de refeição carregados do AsyncStorage com sucesso"
            );
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
              console.log(
                "Tipos de refeição do Firebase salvos no AsyncStorage"
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
          console.error(
            "Erro ao carregar tipos de refeições do Firebase:",
            firebaseError
          );
          // Em caso de erro, garantir que os dados estejam limpos
          setMealTypes([]);
          setHasMealTypesConfigured(false);
        }
      } else {
        // Se está offline, log informativo
        console.log(
          "Dispositivo offline. Não foi possível carregar tipos de refeição do Firebase."
        );
        // Já tentamos carregar dados locais e não temos, então mantemos vazio
      }
    } catch (error) {
      console.error("Erro ao carregar tipos de refeições:", error);
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
          console.error(
            "Erro ao salvar tipo de refeição no AsyncStorage:",
            storageError
          );
        }

        // Salvar no Firestore se o usuário estiver autenticado
        try {
          await setDoc(
            doc(db, "users", user.uid, "config", "mealTypes"),
            { types: updatedTypes },
            { merge: true }
          );
          console.log("Tipos de refeição atualizados no Firebase com sucesso");
        } catch (firebaseError) {
          console.error(
            "Erro ao salvar no Firebase, dados mantidos localmente:",
            firebaseError
          );
        }

        setHasMealTypesConfigured(true);
      }
    } catch (error) {
      console.error("Erro ao adicionar tipo de refeição:", error);
    }
  };

  // Função para redefinir os tipos de refeições
  const resetMealTypes = async () => {
    try {
      // Limpar tipos de refeições
      setMealTypes([]);
      setHasMealTypesConfigured(false);

      // Limpar também os dados de refeições
      setMeals({});

      if (user) {
        // Primeiro limpar no AsyncStorage
        try {
          await AsyncStorage.removeItem(`${KEYS.MEAL_TYPES}:${user.uid}`);
        } catch (storageError) {
          console.error(
            "Erro ao limpar tipos de refeição do AsyncStorage:",
            storageError
          );
        }

        // Depois tentar limpar no Firebase
        try {
          // Atualizar tipos de refeições no Firestore
          await setDoc(
            doc(db, "users", user.uid, "config", "mealTypes"),
            { types: [] },
            { merge: true }
          );

          // Também limpar as refeições no Firestore se necessário
          // Isso pode ser opcional dependendo do seu caso de uso
          const mealsRef = collection(db, "users", user.uid, "meals");
          const mealsSnap = await getDocs(mealsRef);

          // Excluir cada documento de refeição
          const batch = writeBatch(db);
          mealsSnap.forEach((doc) => {
            batch.delete(doc.ref);
          });

          await batch.commit();
        } catch (firebaseError) {
          console.error(
            "Erro ao limpar tipos de refeição no Firebase:",
            firebaseError
          );
        }
      }

      return true; // Retornar true para indicar sucesso
    } catch (error) {
      console.error("Erro ao redefinir tipos de refeições:", error);
      return false; // Retornar false para indicar falha
    }
  };

  // Função para atualizar todos os tipos de refeições de uma vez
  const updateMealTypes = async (newMealTypes: MealType[]) => {
    try {
      setMealTypes(newMealTypes);

      if (newMealTypes.length > 0) {
        setHasMealTypesConfigured(true);
      } else {
        setHasMealTypesConfigured(false);
      }

      // Primeiro salvar no AsyncStorage para persistência local
      if (user) {
        try {
          console.log("Salvando tipos de refeição no AsyncStorage...");
          await AsyncStorage.setItem(
            `${KEYS.MEAL_TYPES}:${user.uid}`,
            JSON.stringify(newMealTypes)
          );

          // Verificar se os dados foram salvos
          const savedData = await AsyncStorage.getItem(
            `${KEYS.MEAL_TYPES}:${user.uid}`
          );
          if (!savedData) {
            console.warn(
              "Falha ao verificar persistência dos tipos de refeição"
            );
            // Tentar novamente uma vez
            await AsyncStorage.setItem(
              `${KEYS.MEAL_TYPES}:${user.uid}`,
              JSON.stringify(newMealTypes)
            );
          }
        } catch (storageError) {
          console.error(
            "Erro ao salvar tipos de refeição no AsyncStorage:",
            storageError
          );
        }

        // Depois tentar salvar no Firebase
        try {
          await setDoc(
            doc(db, "users", user.uid, "config", "mealTypes"),
            { types: newMealTypes },
            { merge: true }
          );
          console.log(
            "Tipos de refeição sincronizados com Firebase com sucesso"
          );
        } catch (firebaseError) {
          console.error(
            "Erro ao salvar no Firebase, dados mantidos localmente:",
            firebaseError
          );
          // Continuar, pois os dados foram salvos no AsyncStorage
        }
      }

      return true; // Retornar true para indicar sucesso
    } catch (error) {
      console.error("Erro ao atualizar tipos de refeições:", error);
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
      saveMeals().catch((error) => {
        console.error("Erro ao salvar após adicionar alimento:", error);
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
        } catch (saveError) {
          console.error("Erro ao salvar após remover alimento:", saveError);
        }
      }, 100);
    } catch (error) {
      console.error("Erro ao remover alimento:", error);
      throw error;
    }
  };

  const saveMeals = async () => {
    try {
      if (!user) return;

      // Primeiro salvar localmente para garantir persistência
      const key = `${KEYS.MEALS_KEY}${user.uid}:${selectedDate}`;
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
          console.log("Refeições sincronizadas com Firebase com sucesso");
        } catch (firebaseError) {
          console.error(
            "Erro ao salvar no Firebase, dados mantidos localmente:",
            firebaseError
          );
        }
      } else if (!isOnline) {
        console.log("Dispositivo offline. Dados salvos apenas localmente.");
      }
    } catch (error) {
      console.error("Erro ao salvar refeições:", error);
    }
  };

  const getMealTotals = (mealId: string): MealTotals => {
    try {
      // Verificar se o mealId é uma string válida
      if (!mealId || typeof mealId !== 'string') {
        console.warn(`mealId inválido: ${mealId}`);
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      
      // Obter os alimentos para a refeição
      const mealFoods = meals[selectedDate]?.[mealId];
      
      // Verificação de segurança para garantir que mealFoods seja sempre um array
      if (!mealFoods) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      
      if (!Array.isArray(mealFoods)) {
        console.warn(`mealFoods para mealId=${mealId} não é um array: ${typeof mealFoods}`);
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      
      // Filtrar para garantir que só processamos objetos Food válidos
      const validFoods = mealFoods.filter(food => 
        food && 
        typeof food === 'object' && 
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
      console.error(`Erro ao calcular totais para mealId=${mealId}:`, error);
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
  };

  const getFoodsForMeal = (mealId: string): Food[] => {
    try {
      // Verificar se o mealId é uma string válida
      if (!mealId || typeof mealId !== 'string') {
        console.warn(`mealId inválido em getFoodsForMeal: ${mealId}`);
        return [];
      }
      
      const foods = meals[selectedDate]?.[mealId];
      
      // Se não há alimentos, retornar array vazio
      if (!foods) {
        return [];
      }
      
      // Garantir que sempre retorne um array
      if (!Array.isArray(foods)) {
        console.warn(`foods para mealId=${mealId} não é um array: ${typeof foods}`);
        return [];
      }
      
      // Filtrar para garantir que só retornamos objetos Food válidos
      return foods.filter(food => 
        food && 
        typeof food === 'object' && 
        typeof food.id === 'string' && 
        typeof food.name === 'string' &&
        !isNaN(Number(food.calories)) &&
        !isNaN(Number(food.protein)) &&
        !isNaN(Number(food.carbs)) &&
        !isNaN(Number(food.fat)) &&
        !isNaN(Number(food.portion))
      );
    } catch (error) {
      console.error(`Erro ao obter alimentos para mealId=${mealId}:`, error);
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
        mealIds = Object.keys(currentDayMeals).filter(id => {
          const knownMetadata = ['data', 'date', 'updatedAt', 'createdAt', 'userId', 'user_id'];
          return !knownMetadata.includes(id);
        });
      } else if (Array.isArray(mealTypes) && mealTypes.length > 0) {
        // Se não temos refeições, mas temos tipos configurados, usar esses IDs
        mealIds = mealTypes.map(type => type.id);
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
            console.error(`Erro ao calcular totais para refeição ${mealId}:`, error);
            // Em caso de erro, retornar os acumuladores sem adicionar nada
            return acc;
          }
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
    } catch (error) {
      console.error("Erro ao calcular totais do dia:", error);
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
      console.error("Erro ao copiar refeição:", error);
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
          // Salvar diretamente no Firestore para garantir que os dados estejam atualizados
          if (!user) return;

          // Obter os dados atualizados do estado
          const updatedMeals = { ...meals };

          // Verificar se a estrutura existe e se o alimento foi atualizado
          if (updatedMeals[selectedDate]?.[mealId]) {
            // Salvar no Firestore
            await setDoc(
              doc(db, "users", user.uid, "meals", selectedDate),
              updatedMeals[selectedDate],
              { merge: true }
            );

            console.log("Alimento atualizado e salvo com sucesso");
          }
        } catch (error) {
          console.error("Erro ao salvar após atualizar alimento:", error);
        }
      }, 100);
    },
    [selectedDate, meals, user]
  );

  // Função para adicionar múltiplos alimentos a uma refeição de uma vez
  const addFoodsToMeal = async (mealId: string, foods: Food[]): Promise<void> => {
    if (!user) return;
    
    try {
      // Verificar se a refeição existe para a data selecionada
      if (!meals[selectedDate]) {
        setMeals((prevMeals) => ({
          ...prevMeals,
          [selectedDate]: {},
        }));
      }
      
      if (!meals[selectedDate]?.[mealId]) {
        setMeals((prevMeals) => ({
          ...prevMeals,
          [selectedDate]: {
            ...prevMeals[selectedDate],
            [mealId]: [],
          },
        }));
      }
      
      // Adicionar os alimentos à refeição
      setMeals((prevMeals) => {
        const updatedMeals = { ...prevMeals };
        if (!updatedMeals[selectedDate]) {
          updatedMeals[selectedDate] = {};
        }
        if (!updatedMeals[selectedDate][mealId]) {
          updatedMeals[selectedDate][mealId] = [];
        }
        
        updatedMeals[selectedDate][mealId] = [
          ...updatedMeals[selectedDate][mealId],
          ...foods
        ];
        
        return updatedMeals;
      });
      
      // Salvar no Firestore
      try {
        const updatedMealData = {
          ...meals[selectedDate],
          [mealId]: [...(meals[selectedDate]?.[mealId] || []), ...foods],
        };
        
        await setDoc(
          doc(db, "users", user.uid, "meals", selectedDate),
          updatedMealData
        );
        
        // Salvar localmente
        await AsyncStorage.setItem(
          `${KEYS.MEALS_KEY}${user.uid}_${selectedDate}`,
          JSON.stringify(updatedMealData)
        );
      } catch (error) {
        console.error("Erro ao salvar refeições no Firestore:", error);
      }
    } catch (error) {
      console.error("Erro ao adicionar múltiplos alimentos:", error);
    }
  };

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
      addFoodsToMeal,
      updateFoodInMeal,
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
      getDailyTotals: getDayTotals,
      getMealsList: () => Object.keys(meals[selectedDate] || {}).map(mealId => ({ id: mealId, name: Object.keys(meals[selectedDate][mealId] || {})[0] })),
      addMeal: async (mealName: string) => {
        const newMealId = uuidv4();
        setMeals((prevMeals) => ({
          ...prevMeals,
          [selectedDate]: {
            ...prevMeals[selectedDate],
            [newMealId]: [{ id: newMealId, name: mealName, portion: 0, calories: 0, protein: 0, carbs: 0, fat: 0 }],
          },
        }));
        return newMealId;
      },
      deleteMeal: async (mealId: string) => {
        setMeals((prevMeals) => {
          const updatedMeals = { ...prevMeals };
          if (updatedMeals[selectedDate]) {
            const updatedDateMeals = { ...updatedMeals[selectedDate] };
            // Usando delete para remover a propriedade em vez de atribuir undefined
            delete updatedDateMeals[mealId];
            updatedMeals[selectedDate] = updatedDateMeals;
          }
          return updatedMeals;
        });
        return true;
      },
      reorderMeals: async (mealIds: string[]) => {
        setMeals((prevMeals) => ({
          ...prevMeals,
          [selectedDate]: Object.fromEntries(Object.entries(prevMeals[selectedDate] || {}).filter(([id]) => mealIds.includes(id))),
        }));
      },
      loadingStatus: 'idle' as 'idle' | 'loading' | 'success' | 'error',
    }),
    [
      meals,
      mealTypes,
      selectedDate,
      getMealTotals,
      getFoodsForMeal,
      getDayTotals,
      addFoodToMeal,
      addFoodsToMeal,
      updateFoodInMeal,
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
