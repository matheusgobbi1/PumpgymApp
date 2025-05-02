import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  InteractionManager,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../constants/Colors";
import Calendar from "../../components/shared/Calendar";
import { useNutrition } from "../../context/NutritionContext";
import {
  useMeals,
  MealType as MealTypeContext,
} from "../../context/MealContext";
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
import { MenuAction } from "../../components/shared/ContextMenu";
import HomeHeader from "../../components/home/HomeHeader";
import { useTranslation } from "react-i18next";
import { useDateLocale } from "../../hooks/useDateLocale";

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

export default function NutritionScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo } = useNutrition();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { formatDateWithWeekday } = useDateLocale();

  // Estado para controlar o carregamento
  const [isUIReady, setIsUIReady] = useState(false);

  const {
    selectedDate,
    setSelectedDate,
    meals,
    getDayTotals,
    getMealTotals,
    getFoodsForMeal,
    removeFoodFromMeal,
    mealTypes,
    hasMealTypesConfigured,
    updateMealTypes,
    saveMeals,
    copyMealFromDate,
  } = useMeals();

  // Inicializar a UI após a renderização inicial
  useEffect(() => {
    if (isUIReady) return;

    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        setIsUIReady(true);
      }, 100);
    });
  }, [isUIReady]);

  // Estado para forçar a recriação do MealConfigSheet
  const [mealConfigKey] = useState(Date.now());

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setModalInfo((prev) => ({ ...prev, visible: false }));
    }
  }, [copyMealFromDate, modalInfo.sourceDate, modalInfo.mealId]);

  // Função para formatar a data para exibição
  const formatDate = (dateString: string) => {
    return formatDateWithWeekday(getLocalDate(dateString));
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
    } else if (params?.openMealConfig === "true") {
      // Tentar novamente após um pequeno atraso
      setTimeout(() => {
        if (mealConfigSheetRef.current) {
          mealConfigSheetRef.current.present();
          router.replace("/nutrition");
        }
      }, 500);
    }
  }, [mealConfigSheetRef, params, router]);

  // Tentar abrir o bottom sheet se o parâmetro estiver presente
  // Isso é executado uma vez durante a renderização inicial
  useEffect(() => {
    if (!isUIReady) return;

    if (params?.openMealConfig === "true") {
      // Pequeno atraso para garantir que o componente esteja montado
      const timer = setTimeout(() => {
        openMealConfigSheet();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [params, openMealConfigSheet, isUIReady]);

  // Função para lidar com a configuração de refeições
  const handleMealConfigured = useCallback(
    async (configuredMeals: MealTypeContext[]) => {
      try {
        // Verificar se há refeições selecionadas
        if (!configuredMeals || configuredMeals.length === 0) {
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
          await saveMeals();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Alert.alert(t("common.error"), t("nutrition.errors.configFailed"));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(t("common.error"), t("nutrition.errors.configError"));
      }
    },
    [updateMealTypes, saveMeals, t]
  );

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
          type.color ||
          DEFAULT_MEAL_COLORS[type.id] ||
          DEFAULT_MEAL_COLORS.other,
        foods: validFoods,
      };
    });
  }, [mealTypes, getFoodsForMeal]);

  // Verificar se deve mostrar o estado vazio
  const shouldShowEmptyState =
    !hasMealTypesConfigured || configuredMealTypes.length === 0;

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
        id: "macroDistribution",
        label: t(
          "nutrition.mealDistribution.configOption",
          "Distribuição Calórica"
        ),
        icon: "nutrition-outline",
        type: "default",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/meal-distribution-config");
        },
      },
      {
        id: "exportDiet",
        label: t("nutrition.export.menuOption", "Exportar Dieta"),
        icon: "share-social-outline",
        type: "default",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/diet-export-modal");
        },
      },
    ],
    [openMealConfigSheet, router, t]
  );

  // Verificar se há configuração e conteúdo de refeições para mostrar o menu
  const isMenuVisible = useMemo(() => {
    return hasMealTypesConfigured && configuredMealTypes.length > 0;
  }, [hasMealTypesConfigured, configuredMealTypes]);

  // Calcular alturas corretas
  const headerHeight = Platform.OS === "ios" ? 65 : 55; // Altura exata do HomeHeader
  const calendarHeight = 70; // Altura exata do Calendar

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
            onConfirm={() =>
              setModalInfo((prev) => ({ ...prev, visible: false }))
            }
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

  // Renderizar o conteúdo completo da tela de forma condicional
  const renderScreenContent = () => {
    if (!isUIReady) {
      return (
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <View style={styles.loadingContainer}>
            {/* Você pode adicionar aqui qualquer UI de carregamento simples, se necessário */}
          </View>
        </View>
      );
    }

    // Se não houver refeições configuradas, mostrar o estado vazio
    if (!hasMealTypesConfigured || configuredMealTypes.length === 0) {
      return (
        // Container relativo principal para conteúdo
        <View style={styles.contentWrapper}>
          {/* Calendário posicionado absolutamente abaixo do header */}
          <View style={[styles.calendarWrapper, { top: headerHeight }]}>
            {calendarComponent}
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollViewContent,
              // Padding top = altura EXATA do header + altura EXATA do calendário
              { paddingTop: headerHeight + calendarHeight }, // Sem offset adicional
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
          >
            {emptyStateComponent}

            {/* Espaço adicional para garantir que o conteúdo fique acima da bottom tab */}
            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>
      );
    }

    // Renderizar o conteúdo normal quando tudo estiver pronto
    return (
      // Container relativo principal para conteúdo
      <View style={styles.contentWrapper}>
        {/* Calendário posicionado absolutamente abaixo do header */}
        <View style={[styles.calendarWrapper, { top: headerHeight }]}>
          {calendarComponent}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollViewContent,
            // Padding top = altura EXATA do header + altura EXATA do calendário
            { paddingTop: headerHeight + calendarHeight }, // Sem offset adicional
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
        >
          <MacrosCard
            dayTotals={dailyTotals}
            nutritionInfo={nutritionInfo}
            date={selectedDate}
          />

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

          {/* Espaço adicional para garantir que o conteúdo fique acima da bottom tab */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      {/* Container principal da tela com fundo transparente */}
      <View style={[styles.container, { backgroundColor: "transparent" }]}>
        {/* Header posicionado absolutamente no topo */}
        <View style={styles.headerWrapper}>
          <HomeHeader
            title={t("nutrition.title")}
            showContextMenu={true}
            menuActions={menuActions}
            menuVisible={isMenuVisible}
          />
        </View>

        {/* Conteúdo da tela (ScrollView + Calendar) renderizado aqui */}
        {renderScreenContent()}

        {/* Renderizar modais fora do ScrollView e do container principal */}
        {renderModals()}
      </View>

      {/* BottomSheet continua fora do container principal */}
      <MealConfigSheet
        ref={mealConfigSheetRef}
        onMealConfigured={handleMealConfigured}
        key={`meal-config-configured-${mealConfigKey}-${theme}`}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative", // Para que o header absoluto funcione
  },
  // Wrapper para o header absoluto
  headerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10, // Garantir que fique sobre o ScrollView
  },
  // Wrapper para o conteúdo principal (ScrollView + Calendário)
  contentWrapper: {
    flex: 1,
    position: "relative", // Para que o calendário absoluto funcione
    marginTop: 0, // O espaço é criado pelo paddingTop do ScrollView
  },
  // Wrapper do calendário absoluto
  calendarWrapper: {
    position: "absolute",
    // top é definido inline (abaixo do header)
    left: 0,
    right: 0,
    zIndex: 1, // Calendário fica sobre o ScrollView, mas abaixo do header
    height: 70, // Definir altura fixa igual à do componente Calendar
  },
  scrollView: {
    flex: 1,
    backgroundColor: "transparent", // ScrollView precisa ser transparente
  },
  scrollViewContent: {
    paddingHorizontal: 16, // Padding horizontal aplicado aqui
    paddingBottom: 24,
    // paddingTop será adicionado dinamicamente
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomPadding: {
    height: 80, // Altura suficiente para ficar acima da bottom tab
  },
});
