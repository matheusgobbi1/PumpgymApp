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
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import Calendar from "../../components/shared/Calendar";
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
import { useRefresh } from "../../context/RefreshContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import ConfirmationModal from "../../components/ui/ConfirmationModal";

const { width } = Dimensions.get("window");

// Interface local para os tipos de refeição com a propriedade foods
interface MealType extends MealTypeContext {
  foods: any[];
  color: string;
}

// Cores padrão para os tipos de refeição
const DEFAULT_MEAL_COLORS: { [key: string]: string } = {
  breakfast: "#FF9500", // Laranja
  morning_snack: "#FF3B30", // Vermelho
  lunch: "#34C759", // Verde
  afternoon_snack: "#AF52DE", // Roxo
  dinner: "#5856D6", // Índigo
  supper: "#007AFF", // Azul
  snack: "#5AC8FA", // Azul claro
  other: "#FFCC00", // Amarelo
};

const MEAL_TYPES: MealType[] = [
  {
    id: "breakfast",
    name: "Café da Manhã",
    icon: "sunny-outline",
    foods: [],
    color: DEFAULT_MEAL_COLORS["breakfast"],
  },
  {
    id: "lunch",
    name: "Almoço",
    icon: "restaurant-outline",
    foods: [],
    color: DEFAULT_MEAL_COLORS["lunch"],
  },
  {
    id: "snack",
    name: "Lanche",
    icon: "cafe-outline",
    foods: [],
    color: DEFAULT_MEAL_COLORS["snack"],
  },
  {
    id: "dinner",
    name: "Jantar",
    icon: "moon-outline",
    foods: [],
    color: DEFAULT_MEAL_COLORS["dinner"],
  },
];

export default function NutritionScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo } = useNutrition();
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useRefresh();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
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

  // Estado para controlar a visibilidade do modal de confirmação
  const [resetModalVisible, setResetModalVisible] = useState(false);

  // Ref para o bottom sheet de configuração de refeições
  const mealConfigSheetRef = useRef<BottomSheetModal>(null);

  // Verificar se a referência do bottom sheet está sendo inicializada
  useEffect(() => {

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
        // Atualizar o gráfico de progresso após remover o alimento
        triggerRefresh();
      } catch (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [removeFoodFromMeal, triggerRefresh]
  );

  const dailyTotals = useMemo(() => {
    return getDayTotals();
  }, [getDayTotals, selectedDate, meals]);

  // Função para abrir o bottom sheet de configuração de refeições
  const openMealConfigSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Verificar se a referência existe antes de chamar o método present
    if (mealConfigSheetRef.current) {
      mealConfigSheetRef.current.present();

      // Se o parâmetro openMealConfig estiver presente, limpar a URL
      if (params?.openMealConfig === "true") {
        router.replace("/nutrition");
      }
    } else {
      console.error("Referência do bottom sheet é null em NutritionScreen");

      // Tentar novamente após um pequeno atraso
      if (params?.openMealConfig === "true") {
        setTimeout(() => {
          if (mealConfigSheetRef.current) {
            mealConfigSheetRef.current.present();
            router.replace("/nutrition");
          } else {
            console.error(
              "MealConfigSheet ref ainda não disponível após segunda tentativa"
            );
          }
        }, 500);
      }
    }
  }, [mealConfigSheetRef, params, router]);

  // Tentar abrir o bottom sheet se o parâmetro estiver presente
  // Isso é executado uma vez durante a renderização inicial
  // em vez de usar useEffect
  useMemo(() => {
    if (params?.openMealConfig === "true") {
      // Pequeno atraso para garantir que o componente esteja montado
      setTimeout(() => {
        openMealConfigSheet();
      }, 100);
    }
  }, [params, openMealConfigSheet]);

  // Função para lidar com a configuração de refeições
  const handleMealConfigured = useCallback(
    (configuredMeals: MealTypeContext[]) => {
      // Converter as refeições configuradas para o formato esperado pelo contexto
      const mealTypesToUpdate = configuredMeals.map(
        (meal: MealTypeContext) => ({
          id: meal.id,
          name: meal.name,
          icon: meal.icon,
          color:
            meal.color ||
            DEFAULT_MEAL_COLORS[meal.id] ||
            DEFAULT_MEAL_COLORS.other,
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
    // Mostrar o modal de confirmação
    setResetModalVisible(true);
  }, []);

  // Função para confirmar a redefinição das refeições
  const confirmResetMealTypes = useCallback(async () => {
    try {
      // Primeiro, redefinir as refeições
      await resetMealTypes();

      // Forçar a recriação do componente MealConfigSheet
      setMealConfigKey(Date.now());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Erro ao redefinir refeições:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [resetMealTypes]);

  // Obter os tipos de refeições configuradas
  const configuredMealTypes = useMemo(() => {
    return mealTypes.map((type) => ({
      id: type.id,
      name: type.name,
      icon: type.icon,
      color:
        type.color || DEFAULT_MEAL_COLORS[type.id] || DEFAULT_MEAL_COLORS.other,
      foods: [],
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
        meals={meals}
        hasContent={(date) => {
          const dateString = format(date, "yyyy-MM-dd");
          return (
            meals[dateString] &&
            Object.values(meals[dateString]).some((foods) => foods.length > 0)
          );
        }}
      />
    ),
    [selectedDate, handleDateSelect, meals]
  );

  // Função para lidar com o pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    // Usar o triggerRefresh do contexto para atualizar todos os componentes
    triggerRefresh();
    // Simular carregamento de dados
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
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

        {/* Modal de confirmação para redefinir refeições */}
        <ConfirmationModal
          visible={resetModalVisible}
          title="Redefinir Refeições"
          message="Tem certeza que deseja redefinir todos os tipos de refeição? Esta ação não pode ser desfeita."
          confirmText="Redefinir"
          cancelText="Cancelar"
          confirmType="danger"
          icon="refresh-outline"
          onConfirm={confirmResetMealTypes}
          onCancel={() => setResetModalVisible(false)}
        />
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {emptyStateComponent}
          </ScrollView>
        </View>

        {/* Modal de confirmação para redefinir refeições */}
        <ConfirmationModal
          visible={resetModalVisible}
          title="Redefinir Refeições"
          message="Tem certeza que deseja redefinir todos os tipos de refeição? Esta ação não pode ser desfeita."
          confirmText="Redefinir"
          cancelText="Cancelar"
          confirmType="danger"
          icon="refresh-outline"
          onConfirm={confirmResetMealTypes}
          onCancel={() => setResetModalVisible(false)}
        />
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
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

      {/* Modal de confirmação para redefinir refeições */}
      <ConfirmationModal
        visible={resetModalVisible}
        title="Redefinir Refeições"
        message="Tem certeza que deseja redefinir todos os tipos de refeição? Esta ação não pode ser desfeita."
        confirmText="Redefinir"
        cancelText="Cancelar"
        confirmType="danger"
        icon="refresh-outline"
        onConfirm={confirmResetMealTypes}
        onCancel={() => setResetModalVisible(false)}
      />
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
