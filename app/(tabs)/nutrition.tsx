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
  Alert,
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
import ContextMenu, { MenuAction } from "../../components/shared/ContextMenu";

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
  const { refreshKey, triggerRefresh, isRefreshing } = useRefresh();
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
    saveMeals,
  } = useMeals();

  // Estado para forçar a recriação do MealConfigSheet
  const [mealConfigKey, setMealConfigKey] = useState(Date.now());

  // Estado para controlar a visibilidade do modal de confirmação
  const [resetModalVisible, setResetModalVisible] = useState(false);

  // Referência para o bottom sheet de configuração de refeições
  const mealConfigSheetRef = useRef<BottomSheetModal>(null);

  // Efeito para forçar atualização quando o status de configuração de refeições mudar
  useEffect(() => {
    if (hasMealTypesConfigured) {
      // Forçar atualização quando as refeições forem configuradas
      triggerRefresh();
    }
  }, [hasMealTypesConfigured, triggerRefresh]);

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
  useEffect(() => {
    if (params?.openMealConfig === "true") {
      // Pequeno atraso para garantir que o componente esteja montado
      const timer = setTimeout(() => {
        openMealConfigSheet();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [params, openMealConfigSheet]);

  // Função para lidar com a configuração de refeições
  const handleMealConfigured = useCallback(
    async (configuredMeals: MealTypeContext[]) => {
      try {
        // Verificar se há refeições selecionadas
        if (!configuredMeals || configuredMeals.length === 0) {
          console.error("Nenhuma refeição selecionada para configuração");
          return;
        }

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
        const success = await updateMealTypes(mealTypesToUpdate);

        if (success) {
          // Não precisamos chamar triggerRefresh() aqui pois o contexto já faz isso internamente
          // Apenas salvar os dados para garantir que persistam
          await saveMeals();

          // Feedback tátil de sucesso
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        console.error("Erro ao configurar refeições:", error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [updateMealTypes, saveMeals]
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
      // Primeiro fechar o modal para evitar problemas visuais
      setResetModalVisible(false);

      // Redefinir as refeições
      const success = await resetMealTypes();

      if (success) {
        // Forçar a recriação do componente MealConfigSheet
        setMealConfigKey(Date.now());

        // Não precisamos chamar triggerRefresh() aqui pois o contexto já faz isso

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert(
          "Erro",
          "Não foi possível redefinir as refeições. Tente novamente."
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error("Erro ao redefinir refeições:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Fechar o modal mesmo em caso de erro
      setResetModalVisible(false);

      // Mostrar alerta de erro
      Alert.alert(
        "Erro",
        "Ocorreu um erro ao redefinir refeições. Tente reiniciar o aplicativo."
      );
    }
  }, [resetMealTypes]);

  // Obter os tipos de refeições configuradas com uma técnica mais eficiente
  const configuredMealTypes = useMemo(() => {
    // Verificar se há tipos de refeição definidos
    if (!mealTypes || mealTypes.length === 0) {
      return [];
    }

    return mealTypes.map((type) => ({
      id: type.id,
      name: type.name,
      icon: type.icon,
      color:
        type.color || DEFAULT_MEAL_COLORS[type.id] || DEFAULT_MEAL_COLORS.other,
      foods: getFoodsForMeal(type.id),
    }));
  }, [mealTypes, getFoodsForMeal]); // Removemos refreshKey para evitar renderização desnecessária

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
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return; // Evitar múltiplos refreshes simultâneos

    try {
      setRefreshing(true);
      triggerRefresh();
      await saveMeals();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setRefreshing(false);
    }
  }, [isRefreshing, triggerRefresh, saveMeals]);

  // Adicionar ações do menu contextual para a tela de Nutrição
  const menuActions = useMemo<MenuAction[]>(
    () => [
      {
        id: "edit",
        label: "Editar Refeições",
        icon: "settings-outline",
        type: "default",
        onPress: openMealConfigSheet,
      },
      {
        id: "reset",
        label: "Redefinir Refeições",
        icon: "refresh-outline",
        type: "danger",
        onPress: handleResetMealTypes,
      },
    ],
    [openMealConfigSheet, handleResetMealTypes]
  );

  // Verificar se há configuração e conteúdo de refeições para mostrar o menu
  const isMenuVisible = useMemo(() => {
    return hasMealTypesConfigured && configuredMealTypes.length > 0;
  }, [hasMealTypesConfigured, configuredMealTypes]);

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

        {/* Menu contextual */}
        <ContextMenu actions={menuActions} isVisible={isMenuVisible} />

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

          {configuredMealTypes.length > 0 ? (
            <>
              {configuredMealTypes.map((meal, index) => (
                <MealCard
                  key={`meal-${meal.id}-${selectedDate}-${refreshKey}`}
                  meal={meal}
                  foods={meal.foods}
                  mealTotals={getMealTotals(meal.id)}
                  index={index}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  onDeleteFood={(foodId) => handleDeleteFood(meal.id, foodId)}
                  showCopyOption={true}
                />
              ))}
            </>
          ) : (
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Configure suas refeições para começar
            </Text>
          )}
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
  emptyText: {
    textAlign: "center",
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
});
