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
import { useRouter, useLocalSearchParams } from "expo-router";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import ContextMenu, { MenuAction } from "../../components/shared/ContextMenu";
import HomeHeader from "../../components/home/HomeHeader";
import { useTranslation } from "react-i18next";
import { Tabs } from "expo-router";

const { width } = Dimensions.get("window");

// Interface local para os tipos de refeição com a propriedade foods
interface MealType extends MealTypeContext {
  foods: any[];
  color: string;
}

// Cores padrão para os tipos de refeição
const DEFAULT_MEAL_COLORS: { [key: string]: string } = {
  breakfast: "#FF3B30", // Vermelho
  morning_snack: "#007AFF", // Azul
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
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
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
    copyMealFromDate,
  } = useMeals();

  // Estado para forçar a recriação do MealConfigSheet
  const [mealConfigKey, setMealConfigKey] = useState(Date.now());

  // Estado para controlar a visibilidade do modal de confirmação
  const [resetModalVisible, setResetModalVisible] = useState(false);

  // Novo estado para gerenciar modais
  const [modalInfo, setModalInfo] = useState({
    type: "",
    visible: false,
    mealId: "",
    foodId: "",
    mealName: "",
    sourceDate: "",
  });

  // Referência para o bottom sheet de configuração de refeições
  const mealConfigSheetRef = useRef<BottomSheetModal>(null);

  // Estado para armazenar o total de refeições
  const [totalMeals, setTotalMeals] = useState(0);

  // Calcular o total de refeições
  useEffect(() => {
    let mealCount = 0;
    Object.keys(meals).forEach((date) => {
      Object.keys(meals[date]).forEach((mealId) => {
        if (meals[date][mealId].length > 0) {
          mealCount++;
        }
      });
    });
    setTotalMeals(mealCount);
  }, [meals]);

  // Efeito para forçar atualização quando o status de configuração de refeições mudar
  useEffect(() => {
    if (hasMealTypesConfigured) {
      // As refeições foram configuradas, não precisamos mais do triggerRefresh
    }
  }, [hasMealTypesConfigured]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(format(date, "yyyy-MM-dd"));
  };

  const handleDeleteFood = useCallback(
    async (foodId: string) => {
      try {
        await removeFoodFromMeal(modalInfo.mealId, foodId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setModalInfo((prev) => ({ ...prev, visible: false }));
      }
    },
    [removeFoodFromMeal, modalInfo.mealId]
  );

  const handleDeleteMeal = useCallback(async (mealId: string) => {
    try {
      // Implementar função para deletar refeição se necessário
      console.log("Deletar refeição:", mealId);
    } catch (error) {
      console.error("Erro ao excluir refeição:", error);
    } finally {
      setModalInfo((prev) => ({ ...prev, visible: false }));
    }
  }, []);

  const handleCopyMeal = useCallback(async () => {
    if (!modalInfo.sourceDate || !modalInfo.mealId) return;

    try {
      await copyMealFromDate(
        modalInfo.sourceDate,
        modalInfo.mealId,
        modalInfo.mealId
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Erro ao copiar refeição:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setModalInfo((prev) => ({ ...prev, visible: false }));
    }
  }, [copyMealFromDate, modalInfo.sourceDate, modalInfo.mealId]);

  // Função para formatar a data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    // Determinar o idioma atual do app (usando o mesmo idioma do i18n)
    const currentLocale = t("language.name") === "Language" ? "en-US" : "pt-BR";

    // Formatar a data normalmente
    return date.toLocaleDateString(currentLocale, {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    });
  };

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
        } else {
          // Notificar erro se não for bem-sucedido
          Alert.alert(t("common.error"), t("nutrition.errors.configFailed"));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch (error) {
        console.error("Erro ao configurar refeições:", error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(t("common.error"), t("nutrition.errors.configError"));
      }
    },
    [updateMealTypes, saveMeals, t]
  );

  // Função para redefinir as refeições
  const handleResetMealTypes = useCallback(() => {
    // Fornecer feedback tátil imediatamente
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Mostrar o modal de confirmação imediatamente
    setResetModalVisible(true);
  }, []);

  // Função para confirmar a redefinição das refeições
  const confirmResetMealTypes = useCallback(async () => {
    try {
      // Fechar o modal imediatamente para melhor UX
      setResetModalVisible(false);

      // Pequeno delay para garantir que o modal foi fechado visualmente
      // antes de processar a lógica pesada de redefinição
      setTimeout(async () => {
        try {
          // Redefinir as refeições
          const success = await resetMealTypes();

          if (success) {
            // Forçar a recriação do componente MealConfigSheet
            setMealConfigKey(Date.now());
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            Alert.alert(t("common.error"), t("nutrition.errors.resetFailed"));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        } catch (error) {
          console.error("Erro ao redefinir refeições:", error);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

          // Mostrar alerta de erro
          Alert.alert(t("common.error"), t("nutrition.errors.resetError"));
        }
      }, 100);
    } catch (error) {
      console.error("Erro ao processar redefinição:", error);

      // Fechar o modal mesmo em caso de erro
      setResetModalVisible(false);
    }
  }, [resetMealTypes, t]);

  // Obter os tipos de refeições configuradas com uma técnica mais eficiente
  const configuredMealTypes = useMemo(() => {
    // Verificar se há tipos de refeição definidos
    if (!mealTypes || mealTypes.length === 0) {
      return [];
    }

    return mealTypes.map((type) => {
      // Obter foods de forma segura
      const foodsForMeal = getFoodsForMeal(type.id);
      
      // Garantir que foods seja sempre um array
      const validFoods = Array.isArray(foodsForMeal) ? foodsForMeal : [];
      
      return {
        id: type.id,
        name: type.name,
        icon: type.icon,
        color:
          type.color || DEFAULT_MEAL_COLORS[type.id] || DEFAULT_MEAL_COLORS.other,
        foods: validFoods,
      };
    });
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
          // Verificar se existe a data no objeto meals
          if (!meals || !meals[dateString]) {
            return false;
          }
          
          // Verificar se há foods com tamanho > 0 em qualquer refeição desta data
          return Object.values(meals[dateString]).some(
            (foods) => Array.isArray(foods) && foods.length > 0
          );
        }}
      />
    ),
    [selectedDate, handleDateSelect, meals]
  );

  // Adicionar ações do menu contextual para a tela de Nutrição
  const menuActions = useMemo<MenuAction[]>(
    () => [
      {
        id: "edit",
        label: t("nutrition.menu.editMeals"),
        icon: "settings-outline",
        type: "default",
        onPress: openMealConfigSheet,
      },
      {
        id: "reset",
        label: t("nutrition.menu.resetMeals"),
        icon: "refresh-outline",
        type: "danger",
        onPress: handleResetMealTypes,
      },
    ],
    [openMealConfigSheet, handleResetMealTypes, t]
  );

  // Verificar se há configuração e conteúdo de refeições para mostrar o menu
  const isMenuVisible = useMemo(() => {
    return hasMealTypesConfigured && configuredMealTypes.length > 0;
  }, [hasMealTypesConfigured, configuredMealTypes]);

  // Navegar para o perfil
  const navigateToProfile = useCallback(() => {
    router.push("/profile");
  }, [router]);

  // Renderizar os modais baseados no modalInfo
  const renderModals = () => {
    // Se não houver modal visível, não renderizar nada
    if (!modalInfo.visible) return null;

    switch (modalInfo.type) {
      case "deleteFood":
        return (
          <ConfirmationModal
            visible={modalInfo.visible}
            title={t("nutrition.deleteFood")}
            message={t("nutrition.deleteFoodConfirm")}
            confirmText={t("common.delete")}
            cancelText={t("common.cancel")}
            confirmType="danger"
            icon="trash-outline"
            onConfirm={() => handleDeleteFood(modalInfo.foodId)}
            onCancel={() =>
              setModalInfo((prev) => ({ ...prev, visible: false }))
            }
          />
        );

      case "deleteMeal":
        return (
          <ConfirmationModal
            visible={modalInfo.visible}
            title={t("nutrition.deleteMeal")}
            message={t("nutrition.deleteMealConfirm", {
              name: modalInfo.mealName,
            })}
            confirmText={t("common.delete")}
            cancelText={t("common.cancel")}
            confirmType="danger"
            icon="trash-outline"
            onConfirm={() => handleDeleteMeal(modalInfo.mealId)}
            onCancel={() =>
              setModalInfo((prev) => ({ ...prev, visible: false }))
            }
          />
        );

      case "copyMeal":
        return (
          <ConfirmationModal
            visible={modalInfo.visible}
            title={t("nutrition.copyMeal", {
              name: modalInfo.mealName || t("nutrition.meal"),
            })}
            message={
              modalInfo.sourceDate
                ? t("nutrition.copyMealFrom", {
                    date: formatDate(modalInfo.sourceDate),
                  })
                : t("nutrition.noPreviousMeals")
            }
            confirmText={t("common.copy")}
            cancelText={t("common.cancel")}
            confirmType="primary"
            icon="copy-outline"
            onConfirm={handleCopyMeal}
            onCancel={() =>
              setModalInfo((prev) => ({ ...prev, visible: false }))
            }
          />
        );

      default:
        return null;
    }
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
          <HomeHeader
            title={t("nutrition.title")}
            count={totalMeals}
            iconName="silverware-fork-knife"
            iconType="material"
            iconColor={colors.primary}
            iconBackgroundColor={colors.primary + "15"}
            showContextMenu={true}
            menuActions={menuActions}
            menuVisible={isMenuVisible}
          />

          {calendarComponent}

          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
          >
            {emptyStateComponent}
          </ScrollView>

          <MealConfigSheet
            ref={mealConfigSheetRef}
            onMealConfigured={handleMealConfigured}
            key={`meal-config-configured-${mealConfigKey}-${theme}`}
          />
        </View>

        {/* Modal de confirmação para redefinir refeições */}
        <ConfirmationModal
          visible={resetModalVisible}
          title={t("nutrition.resetModal.title")}
          message={t("nutrition.resetModal.message")}
          confirmText={t("nutrition.resetModal.confirm")}
          cancelText={t("nutrition.resetModal.cancel")}
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
          <HomeHeader
            title={t("nutrition.title")}
            count={totalMeals}
            iconName="silverware-fork-knife"
            iconType="material"
            iconColor={colors.primary}
            iconBackgroundColor={colors.primary + "15"}
            showContextMenu={true}
            menuActions={menuActions}
            menuVisible={isMenuVisible}
          />

          {calendarComponent}

          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
          >
            {emptyStateComponent}
          </ScrollView>

          <MealConfigSheet
            ref={mealConfigSheetRef}
            onMealConfigured={handleMealConfigured}
            key={`meal-config-configured-${mealConfigKey}-${theme}`}
          />
        </View>

        {/* Modal de confirmação para redefinir refeições */}
        <ConfirmationModal
          visible={resetModalVisible}
          title={t("nutrition.resetModal.title")}
          message={t("nutrition.resetModal.message")}
          confirmText={t("nutrition.resetModal.confirm")}
          cancelText={t("nutrition.resetModal.cancel")}
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
        <HomeHeader
          title={t("nutrition.title")}
          count={totalMeals}
          iconName="silverware-fork-knife"
          iconType="material"
          iconColor={colors.primary}
          iconBackgroundColor={colors.primary + "15"}
          showContextMenu={true}
          menuActions={menuActions}
          menuVisible={isMenuVisible}
        />

        {calendarComponent}

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
        >
          <MacrosCard dayTotals={dailyTotals} nutritionInfo={nutritionInfo} />

          {configuredMealTypes.length > 0 ? (
            <>
              {configuredMealTypes.map((meal, index) => (
                <MealCard
                  key={`meal-${meal.id}-${selectedDate}`}
                  meal={meal}
                  foods={meal.foods}
                  mealTotals={getMealTotals(meal.id)}
                  index={index}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  onDeleteFood={(foodId) => removeFoodFromMeal(meal.id, foodId)}
                  showCopyOption={true}
                  setModalInfo={setModalInfo}
                />
              ))}
            </>
          ) : (
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {t("nutrition.configureToStart")}
            </Text>
          )}
        </ScrollView>

        <MealConfigSheet
          ref={mealConfigSheetRef}
          onMealConfigured={handleMealConfigured}
          key={`meal-config-configured-${mealConfigKey}-${theme}`}
        />

        {/* Renderizar modais fora do ScrollView */}
        {renderModals()}

        {/* Modal de confirmação para redefinir refeições */}
        <ConfirmationModal
          visible={resetModalVisible}
          title={t("nutrition.resetModal.title")}
          message={t("nutrition.resetModal.message")}
          confirmText={t("nutrition.resetModal.confirm")}
          cancelText={t("nutrition.resetModal.cancel")}
          confirmType="danger"
          icon="refresh-outline"
          onConfirm={confirmResetMealTypes}
          onCancel={() => setResetModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
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
