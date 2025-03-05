import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import Calendar from "../../components/nutrition/Calendar";
import { useNutrition } from "../../context/NutritionContext";
import {
  useMeals,
  MealType as MealTypeContext,
} from "../../context/MealContext";
import { MotiView } from "moti";
import { format } from "date-fns";
import MealCard from "../../components/nutrition/MealCard";
import MacrosCard from "../../components/nutrition/MacrosCard";
import { getLocalDate } from "../../utils/dateUtils";
import * as Haptics from "expo-haptics";
import EmptyNutritionState from "../../components/nutrition/EmptyNutritionState";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import MealConfigSheet from "../../components/nutrition/MealConfigSheet";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

// Interface local para os tipos de refeição com a propriedade foods
interface MealType extends MealTypeContext {
  foods: any[];
}

const MEAL_TYPES: MealType[] = [
  {
    id: "breakfast",
    name: "Café da Manhã",
    icon: "sunny-outline",
    foods: [],
  },
  {
    id: "lunch",
    name: "Almoço",
    icon: "restaurant-outline",
    foods: [],
  },
  {
    id: "snack",
    name: "Lanche",
    icon: "cafe-outline",
    foods: [],
  },
  {
    id: "dinner",
    name: "Jantar",
    icon: "moon-outline",
    foods: [],
  },
];

export default function NutritionScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo } = useNutrition();
  const { user } = useAuth();
  const {
    selectedDate,
    setSelectedDate,
    meals,
    getDayTotals,
    getMealTotals,
    getFoodsForMeal,
    removeFoodFromMeal,
    addMealType,
    mealTypes,
    hasMealTypesConfigured,
    resetMealTypes,
    updateMealTypes,
  } = useMeals();

  // Estado para forçar a recriação do MealConfigSheet
  const [mealConfigKey, setMealConfigKey] = useState(Date.now());

  // Ref para o bottom sheet de configuração de refeições
  const mealConfigSheetRef = useRef<BottomSheetModal>(null);

  // Verificar se a referência do bottom sheet está sendo inicializada
  useEffect(() => {
    console.log(
      "MealConfigSheet ref inicializado:",
      !!mealConfigSheetRef.current
    );

    return () => {};
  }, [hasMealTypesConfigured]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(format(date, "yyyy-MM-dd"));
  };

  const handleDeleteFood = useCallback(
    async (mealId: string, foodId: string) => {
      try {
        await removeFoodFromMeal(mealId, foodId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error("Erro ao deletar alimento:", error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [removeFoodFromMeal]
  );

  const dailyTotals = useMemo(() => {
    return getDayTotals();
  }, [getDayTotals, selectedDate, meals]);

  // Função para abrir o bottom sheet de configuração de refeições
  const openMealConfigSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log("Tentando abrir o bottom sheet");

    // Verificar se a referência existe antes de chamar o método present
    if (mealConfigSheetRef.current) {
      mealConfigSheetRef.current.present();
    } else {
      console.error("Referência do bottom sheet é null em NutritionScreen");
    }
  }, []);

  // Função para lidar com a configuração de refeições
  const handleMealConfigured = useCallback(
    (configuredMeals: MealTypeContext[]) => {
      // Log para depuração
      console.log(
        "Refeições recebidas para configuração:",
        configuredMeals.map((m: MealTypeContext) => m.name).join(", ")
      );

      // Converter as refeições configuradas para o formato esperado pelo contexto
      const mealTypesToUpdate = configuredMeals.map(
        (meal: MealTypeContext) => ({
          id: meal.id,
          name: meal.name,
          icon: meal.icon,
        })
      );

      // Atualizar todos os tipos de refeições de uma vez
      updateMealTypes(mealTypesToUpdate);
    },
    [updateMealTypes]
  );

  // Função para redefinir as refeições
  const handleResetMealTypes = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    // Primeiro, redefinir as refeições
    await resetMealTypes();

    // Forçar a recriação do componente MealConfigSheet
    setMealConfigKey(Date.now());

    console.log("Refeições redefinidas");
  }, [resetMealTypes]);

  // Obter os tipos de refeições configuradas
  const configuredMealTypes = useMemo(() => {
    return mealTypes.map((type) => ({
      id: type.id,
      name: type.name,
      icon: type.icon,
    }));
  }, [mealTypes]);

  // Memoizar o componente EmptyNutritionState para evitar re-renderizações desnecessárias
  const emptyStateComponent = useMemo(
    () => (
      <EmptyNutritionState
        onMealConfigured={handleMealConfigured}
        onOpenMealConfig={openMealConfigSheet}
      />
    ),
    [handleMealConfigured, openMealConfigSheet]
  );

  // Memoizar o componente Calendar para evitar re-renderizações desnecessárias
  const calendarComponent = useMemo(
    () => (
      <Calendar
        selectedDate={getLocalDate(selectedDate)}
        onSelectDate={handleDateSelect}
      />
    ),
    [selectedDate, handleDateSelect]
  );

  // Se não houver refeições configuradas, mostrar o estado vazio
  if (!hasMealTypesConfigured) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top"]}
      >
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          {calendarComponent}

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
          >
            {emptyStateComponent}
          </ScrollView>

          {/* Bottom Sheet para configuração de refeições quando não há refeições configuradas */}
          <MealConfigSheet
            ref={mealConfigSheetRef}
            onMealConfigured={handleMealConfigured}
            key={`meal-config-empty-${mealConfigKey}-${theme}`}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Verificar se há tipos de refeições configurados
  if (configuredMealTypes.length === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top"]}
      >
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          {calendarComponent}

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
          >
            {emptyStateComponent}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {calendarComponent}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
        >
          <MacrosCard dayTotals={dailyTotals} nutritionInfo={nutritionInfo} />

          {configuredMealTypes.map((meal, index) => (
            <MealCard
              key={`meal-${meal.id}-${user?.uid || "no-user"}`}
              meal={meal}
              foods={getFoodsForMeal(meal.id)}
              mealTotals={getMealTotals(meal.id)}
              index={index}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                console.log(`Meal ${meal.name} pressed`);
              }}
              onDeleteFood={(foodId) => handleDeleteFood(meal.id, foodId)}
            />
          ))}

          {/* Botão para redefinir refeições */}
          <TouchableOpacity
            key={`reset-button-${theme}`}
            style={[styles.resetButton, { borderColor: colors.border }]}
            onPress={handleResetMealTypes}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            <Text style={[styles.resetButtonText, { color: colors.text }]}>
              Redefinir Refeições
            </Text>
          </TouchableOpacity>

          {/* Botão para editar refeições */}
          <TouchableOpacity
            key={`edit-button-${theme}`}
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={openMealConfigSheet}
          >
            <Ionicons name="settings-outline" size={20} color="white" />
            <Text style={styles.editButtonText}>Editar Refeições</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Bottom Sheet para configuração de refeições quando há refeições configuradas */}
        <MealConfigSheet
          ref={mealConfigSheetRef}
          onMealConfigured={handleMealConfigured}
          key={`meal-config-configured-${mealConfigKey}-${theme}`}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 100,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 20,
    marginBottom: 12,
  },
  resetButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
});
