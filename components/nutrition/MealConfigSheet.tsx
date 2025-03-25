import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { MotiView } from "moti";
import { Easing } from "react-native-reanimated";
import { useMeals } from "../../context/MealContext";
import ButtonNew from "../common/ButtonNew";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEYS } from "../../constants/keys";

const { width } = Dimensions.get("window");

// Definir interface para o tipo de refeição
interface MealType {
  id: string;
  name: string;
  icon: string;
  color: string;
  selected: boolean;
  isDefault?: boolean;
}

// Tipos de refeições pré-definidas
const DEFAULT_MEAL_TYPES: MealType[] = [
  {
    id: "breakfast",
    name: "Café da Manhã",
    icon: "sunny-outline",
    color:  "#FF6B6B",
    selected: false,
    isDefault: true,
  },
  {
    id: "morning_snack",
    name: "Lanche da Manhã",
    icon: "cafe-outline",
    color: "#FF9500",
    selected: false,
    isDefault: true,
  },
  {
    id: "lunch",
    name: "Almoço",
    icon: "restaurant-outline",
    color:  "#007AFF",
    selected: false,
    isDefault: true,
  },
  {
    id: "afternoon_snack",
    name: "Lanche da Tarde",
    icon: "ice-cream-outline",
    color: "#AF52DE",
    selected: false,
    isDefault: true,
  },
  {
    id: "dinner",
    name: "Jantar",
    icon: "moon-outline",
    color: "#5856D6",
    selected: false,
    isDefault: true,
  },
  {
    id: "supper",
    name: "Ceia",
    icon: "bed-outline",
    color:  "#34C759",
    selected: false,
    isDefault: true,
  },
];

interface MealConfigSheetProps {
  onMealConfigured: (meals: MealType[]) => void;
}

const MealConfigSheet = forwardRef<BottomSheetModal, MealConfigSheetProps>(
  ({ onMealConfigured }, ref) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const { mealTypes: existingMealTypes } = useMeals();
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useTranslation();

    // Ref para o bottom sheet
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    // Expor a referência para o componente pai
    useImperativeHandle(ref, () => {
      return bottomSheetModalRef.current!;
    });

    // Estados
    const [mealTypes, setMealTypes] = useState<MealType[]>([]);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    // Animações
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // Pontos de ancoragem do bottom sheet
    // Definimos apenas um snap point: 90% da altura da tela
    const snapPoints = useMemo(() => ["70%"], []);

    // Inicializar os tipos de refeições com os existentes ou os padrões
    useEffect(() => {
      const initializeMealTypes = () => {
        // Sempre inicializar com os tipos padrão, todos desmarcados
        const initialTypes = DEFAULT_MEAL_TYPES.map((type) => ({
          ...type,
          selected: false,
        }));

        // Se existirem tipos configurados, marcá-los como selecionados
        if (existingMealTypes.length > 0) {
          // Marcar os tipos existentes como selecionados
          initialTypes.forEach((type) => {
            const existingType = existingMealTypes.find(
              (et) => et.id === type.id
            );
            if (existingType) {
              type.selected = true;
            }
          });

          // Adicionar tipos personalizados que não estão nos padrões
          existingMealTypes.forEach((existingType) => {
            const isCustomType = !initialTypes.some(
              (dt) => dt.id === existingType.id
            );
            if (isCustomType) {
              initialTypes.push({
                id: existingType.id,
                name: existingType.name,
                icon: existingType.icon,
                color: existingType.color,
                selected: true,
              } as MealType);
            }
          });
        }

        setMealTypes(initialTypes);
        setIsLoading(false);
      };

      // Executar com um pequeno delay para evitar bloqueios na UI
      requestAnimationFrame(initializeMealTypes);
    }, [existingMealTypes]);

    // Detectar quando o teclado é aberto ou fechado
    useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener(
        "keyboardDidShow",
        () => {
          setKeyboardVisible(true);
        }
      );
      const keyboardDidHideListener = Keyboard.addListener(
        "keyboardDidHide",
        () => {
          setKeyboardVisible(false);
        }
      );

      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }, []);

    // Função para fechar o bottom sheet
    const closeBottomSheet = useCallback(() => {
      bottomSheetModalRef.current?.dismiss();
    }, []);

    // Função para quando o bottom sheet for fechado
    const handleSheetChanges = useCallback((index: number) => {
      // Quando o bottom sheet for fechado (index = -1), não fazemos nada
      // Remover a chamada ao callback para não criar refeições automaticamente
      if (index === -1) {
        // Apenas fechamos o modal sem criar refeições
        // O usuário precisa explicitamente clicar em "Confirmar" para criar as refeições
      }
    }, []);

    // Função para renderizar o backdrop (fundo escurecido)
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    // Função para selecionar/deselecionar uma refeição
    const toggleMealSelection = useCallback((id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setMealTypes((prev) =>
        prev.map((meal) =>
          meal.id === id ? { ...meal, selected: !meal.selected } : meal
        )
      );
    }, []);

    // Função para confirmar a configuração
    const confirmMealConfig = useCallback(() => {
      // Filtrar apenas as refeições selecionadas
      const selectedMeals = mealTypes.filter((meal) => meal.selected);

      if (selectedMeals.length === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Primeiro chamar o callback para atualizar o estado no contexto
      onMealConfigured(selectedMeals);

      // Então fechar o modal
      bottomSheetModalRef.current?.dismiss();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, [mealTypes, onMealConfigured]);

    // Verificar se há refeições selecionadas
    const hasMealsSelected = useMemo(() => {
      return mealTypes.some((meal) => meal.selected);
    }, [mealTypes]);

    // Efeito para animar a entrada do componente
    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    // Componente de renderização para cada item de refeição
    const renderMealItem = useCallback(
      (meal: MealType, index: number) => {
        return (
          <MotiView
            key={`meal-${meal.id}-${theme}`}
            style={styles.mealCardWrapper}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: "timing",
              duration: 300,
              delay: index * 50,
              easing: Easing.out(Easing.ease),
            }}
          >
            <TouchableOpacity
              style={[
                styles.mealCard,
                { backgroundColor: colors.card },
                meal.selected && {
                  backgroundColor: meal.color + "15",
                  borderWidth: 1,
                  borderColor: meal.color + "50",
                },
              ]}
              onPress={() => toggleMealSelection(meal.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.mealCardContent,
                  meal.selected && { backgroundColor: "transparent" },
                ]}
              >
                <View
                  style={[
                    styles.mealIconContainer,
                    {
                      backgroundColor: meal.selected
                        ? meal.color + "30"
                        : colors.background + "90",
                      borderWidth: 1,
                      borderColor: meal.selected
                        ? meal.color
                        : colors.border + "40",
                    },
                  ]}
                >
                  <Ionicons
                    name={meal.icon as any}
                    size={24}
                    color={meal.selected ? meal.color : colors.primary}
                  />
                </View>
                <View style={styles.mealInfo}>
                  <Text
                    style={[
                      styles.mealName,
                      {
                        color: colors.text,
                        fontWeight: meal.selected ? "700" : "600",
                      },
                    ]}
                  >
                    {t(`nutrition.mealTypes.${meal.id}`, {
                      defaultValue: meal.name,
                    })}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {}}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={20}
                    color={colors.text + "70"}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </MotiView>
        );
      },
      [colors, theme, toggleMealSelection, t]
    );

    // Adicionar um componente de carregamento
    if (isLoading) {
      return (
        <View
          style={[styles.loadingContainer, { backgroundColor: colors.card }]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t("nutrition.loading")}
          </Text>
        </View>
      );
    }

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        handleIndicatorStyle={{
          backgroundColor: colors.text + "50",
          width: 40,
        }}
        backgroundStyle={{
          backgroundColor: colors.background,
        }}
        enablePanDownToClose
        enableDismissOnClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="none"
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
      >
        <KeyboardAvoidingView
          style={[styles.container, { paddingBottom: insets.bottom }]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("nutrition.configSheet.title")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
              {t("nutrition.configSheet.subtitle")}
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Refeições pré-definidas */}
            <View style={styles.mealTypesContainer}>
              {mealTypes.map((meal, index) => renderMealItem(meal, index))}
            </View>
          </ScrollView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 15 }}
            style={[
              styles.footer,
              { borderTopColor: colors.text + "10" },
              { backgroundColor: colors.background },
            ]}
          >
            <ButtonNew
              title={t("nutrition.configSheet.confirm")}
              onPress={confirmMealConfig}
              variant="primary"
              disabled={!hasMealsSelected}
              style={styles.confirmButton}
              textStyle={styles.confirmButtonText}
              hapticFeedback="notification"
              size="large"
              rounded={true}
              elevation={3}
            />
          </MotiView>
        </KeyboardAvoidingView>
      </BottomSheetModal>
    );
  }
);

export default MealConfigSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mealTypesContainer: {
    marginBottom: 20,
  },
  mealCardWrapper: {
    marginBottom: 12,
  },
  mealCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  mealCardSelected: {
    elevation: 4,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  mealCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    minHeight: 70,
  },
  mealIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  mealInfo: {
    flex: 1,
    justifyContent: "center",
  },
  mealName: {
    fontSize: 16,
    fontWeight: "600",
  },
  editButton: {
    padding: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 27,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
    backgroundColor: Colors.light.background,
  },
  confirmButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
