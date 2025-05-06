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
import { MotiView, AnimatePresence } from "moti";
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
    color: "#E53935",
    selected: false,
    isDefault: true,
  },
  {
    id: "pre_workout",
    name: "Pré-treino",
    icon: "flame-outline",
    color: "#FF9500",
    selected: false,
    isDefault: true,
  },
  {
    id: "lunch",
    name: "Almoço",
    icon: "restaurant-outline",
    color: "#007AFF",
    selected: false,
    isDefault: true,
  },
  {
    id: "post_workout",
    name: "Pós-treino",
    icon: "barbell-outline",
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
    color: "#34C759",
    selected: false,
    isDefault: true,
  },
];

// Definições de ícones e cores disponíveis
const AVAILABLE_ICONS: string[] = [
  "fast-food-outline",
  "pizza-outline",
  "cafe-outline",
  "beer-outline",
  "egg-outline",
  "fish-outline",
  "nutrition-outline",
  "ice-cream-outline",
  "restaurant-outline",
  "wine-outline",
  "leaf-outline",
  "water-outline",
  "sunny-outline",
  "moon-outline",
  "flame-outline",
  "barbell-outline",
  "bed-outline",
  "bowl-mix-outline", // Adicionado ícone MaterialCommunityIcons
  "food-apple-outline", // Adicionado ícone MaterialCommunityIcons
  "food-drumstick-outline", // Adicionado ícone MaterialCommunityIcons
  "glass-mug-variant", // Adicionado ícone MaterialCommunityIcons
];

const AVAILABLE_COLORS: string[] = [
  "#FF5252",
  "#E53935",
  "#C62828",
  "#FF8A80",
  "#FF9800",
  "#FB8C00",
  "#EF6C00",
  "#FFAB40",
  "#FFEB3B",
  "#FDD835",
  "#FBC02D",
  "#FFFF8D",
  "#4CAF50",
  "#43A047",
  "#2E7D32",
  "#69F0AE",
  "#00C853",
  "#00BCD4",
  "#00ACC1",
  "#00838F",
  "#18FFFF",
  "#00BFA5",
  "#2196F3",
  "#1E88E5",
  "#1565C0",
  "#448AFF",
  "#2962FF",
  "#9C27B0",
  "#8E24AA",
  "#6A1B9A",
  "#E040FB",
  "#E91E63",
  "#D81B60",
  "#AD1457",
  "#FF80AB",
  "#795548",
  "#6D4C41",
  "#4E342E",
  "#9E9E9E",
  "#757575",
  "#424242",
  "#BDBDBD",
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

    // Pontos de ancoragem do bottom sheet
    const snapPoints = useMemo(() => ["70%"], []);

    // Estados para controlar seletores
    const [showColorSelectorFor, setShowColorSelectorFor] = useState<
      string | null
    >(null);
    const [showIconSelectorFor, setShowIconSelectorFor] = useState<
      string | null
    >(null);

    // Inicializar os tipos de refeições com os existentes ou os padrões (CORRIGIDO 2)
    useEffect(() => {
      const initializeMealTypes = () => {
        const finalMealTypes: MealType[] = [];

        // Criar um mapa dos tipos existentes para acesso rápido
        const existingTypesMap = new Map<
          string,
          (typeof existingMealTypes)[0]
        >();
        existingMealTypes.forEach((et) => existingTypesMap.set(et.id, et));

        // Processar os tipos padrão
        DEFAULT_MEAL_TYPES.forEach((defaultType) => {
          const existingType = existingTypesMap.get(defaultType.id);
          if (existingType) {
            // Existe no contexto: usar dados salvos
            finalMealTypes.push({
              ...defaultType, // Mantém name, isDefault
              icon: existingType.icon,
              color: existingType.color || defaultType.color, // Fallback para cor padrão se salva for inválida
              selected: true,
            });
            // Remover do mapa para não processar duas vezes
            existingTypesMap.delete(defaultType.id);
          } else {
            // Não existe no contexto: usar padrão desmarcado
            finalMealTypes.push({
              ...defaultType,
              selected: false,
            });
          }
        });

        // Adicionar tipos personalizados restantes do mapa (que não estavam nos defaults)
        existingTypesMap.forEach((customType) => {
          finalMealTypes.push({
            id: customType.id,
            name: customType.name,
            icon: customType.icon,
            color: customType.color || "#CCCCCC", // Fallback genérico
            selected: true, // Se está no contexto, estava selecionado
            isDefault: false,
          });
        });

        setMealTypes(finalMealTypes);
        setIsLoading(false);
      };

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

    // Funções para alternar seletores
    const toggleColorSelector = useCallback((mealId: string) => {
      setShowColorSelectorFor((prev) => (prev === mealId ? null : mealId));
      setShowIconSelectorFor(null); // Fecha o outro seletor
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const toggleIconSelector = useCallback((mealId: string) => {
      setShowIconSelectorFor((prev) => (prev === mealId ? null : mealId));
      setShowColorSelectorFor(null); // Fecha o outro seletor
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    // Funções para atualizar estado local
    const updateMealColor = useCallback((mealId: string, color: string) => {
      setMealTypes((prev) =>
        prev.map((meal) => (meal.id === mealId ? { ...meal, color } : meal))
      );
      setShowColorSelectorFor(null); // Fecha o seletor
    }, []);

    const updateMealIcon = useCallback((mealId: string, icon: string) => {
      setMealTypes((prev) =>
        prev.map((meal) => (meal.id === mealId ? { ...meal, icon } : meal))
      );
      setShowIconSelectorFor(null); // Fecha o seletor
    }, []);

    // Função para confirmar a configuração
    const confirmMealConfig = useCallback(() => {
      // Filtrar apenas as refeições selecionadas
      const selectedMeals = mealTypes.filter((meal) => meal.selected);

      if (selectedMeals.length === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Chamar o callback para atualizar o estado no contexto
      onMealConfigured(selectedMeals);

      // Então fechar o modal
      bottomSheetModalRef.current?.dismiss();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, [mealTypes, onMealConfigured]);

    // Verificar se há refeições selecionadas
    const hasMealsSelected = useMemo(() => {
      return mealTypes.some((meal) => meal.selected);
    }, [mealTypes]);

    // Função para obter a cor da refeição selecionada
    // Se houver múltiplas refeições selecionadas, usamos a cor da última refeição selecionada
    const getSelectedMealColor = useCallback(() => {
      const selectedMeals = mealTypes.filter((m) => m.selected);

      if (selectedMeals.length === 0) {
        return undefined;
      }

      // Retorna a cor da última refeição selecionada
      return selectedMeals[selectedMeals.length - 1].color;
    }, [mealTypes]);

    // Verifica se há múltiplas refeições selecionadas
    const hasMultipleMealsSelected = useCallback(() => {
      return mealTypes.filter((m) => m.selected).length > 1;
    }, [mealTypes]);

    // Função para obter todas as cores das refeições selecionadas
    const getSelectedMealColors = useCallback(() => {
      return mealTypes.filter((m) => m.selected).map((m) => m.color);
    }, [mealTypes]);

    // Função para renderizar os indicadores de cor
    const renderColorIndicators = () => {
      const selectedColors = getSelectedMealColors();

      if (selectedColors.length === 0) return null;

      // Limitar o número de indicadores para não sobrecarregar a UI
      const maxIndicators = 4;
      const colorsToShow = selectedColors.slice(0, maxIndicators);
      const hasMore = selectedColors.length > maxIndicators;

      return (
        <View style={styles.colorIndicatorsContainer}>
          {colorsToShow.map((color, index) => (
            <View
              key={`color-${index}`}
              style={[
                styles.colorIndicator,
                {
                  backgroundColor: color,
                  // Um pequeno efeito de escalonamento para os círculos
                  transform: [{ scale: 1 - index * 0.05 }],
                  zIndex: colorsToShow.length - index,
                  marginLeft: index > 0 ? -6 : 0, // Sobreposição parcial
                },
              ]}
            />
          ))}
          {hasMore && (
            <View
              style={[
                styles.colorIndicatorMore,
                { backgroundColor: colors.text + "30" },
              ]}
            >
              <Text
                style={[styles.colorIndicatorMoreText, { color: colors.text }]}
              >
                +{selectedColors.length - maxIndicators}
              </Text>
            </View>
          )}
        </View>
      );
    };

    // Componente de renderização para cada item de refeição
    const renderMealItem = useCallback(
      (meal: MealType, index: number) => {
        const entryDirection = index % 2 === 0 ? -1 : 1;
        const isColorSelectorOpen = showColorSelectorFor === meal.id;
        const isIconSelectorOpen = showIconSelectorFor === meal.id;

        return (
          <MotiView
            key={`meal-${meal.id}-${theme}`}
            style={styles.mealCardWrapper}
            from={{
              opacity: 0,
              translateY: 50,
              translateX: entryDirection * 20,
              scale: 0.9,
              rotate: `${entryDirection * 5}deg`,
            }}
            animate={{
              opacity: 1,
              translateY: 0,
              translateX: 0,
              scale: 1,
              rotate: "0deg",
            }}
            transition={{
              type: "spring",
              delay: index * 100,
              damping: 15,
              mass: 0.8,
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
              onPress={() => {
                // Só permite selecionar/deselecionar se nenhum seletor estiver aberto
                if (!isColorSelectorOpen && !isIconSelectorOpen) {
                  toggleMealSelection(meal.id);
                }
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.mealCardContent,
                  meal.selected && { backgroundColor: "transparent" },
                ]}
              >
                {/* Ícone clicável para abrir seletor de ícones */}
                <TouchableOpacity
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
                  onPress={() => toggleIconSelector(meal.id)}
                >
                  <Ionicons
                    name={meal.icon as any}
                    size={24}
                    color={meal.selected ? meal.color : colors.primary}
                  />
                </TouchableOpacity>

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

                {/* Botão para abrir seletor de cores */}
                <TouchableOpacity
                  style={[
                    styles.colorPickerButton,
                    { backgroundColor: meal.color + "20" },
                  ]}
                  onPress={() => toggleColorSelector(meal.id)}
                >
                  <View
                    style={[
                      styles.colorPreview,
                      { backgroundColor: meal.color },
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {/* Seletor de Cores */}
              {isColorSelectorOpen && (
                <MotiView
                  from={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ type: "timing", duration: 200 }}
                  style={styles.inlineSelectorContainer}
                >
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.inlineSelectorList}
                  >
                    {AVAILABLE_COLORS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          meal.color === color && styles.optionSelected,
                        ]}
                        onPress={() => updateMealColor(meal.id, color)}
                      >
                        {meal.color === color && (
                          <Ionicons name="checkmark" size={18} color="#FFF" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </MotiView>
              )}

              {/* Seletor de Ícones */}
              {isIconSelectorOpen && (
                <MotiView
                  from={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ type: "timing", duration: 200 }}
                  style={styles.inlineSelectorContainer}
                >
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.inlineSelectorList}
                  >
                    {AVAILABLE_ICONS.map((iconName) => (
                      <TouchableOpacity
                        key={iconName}
                        style={[
                          styles.iconOption,
                          {
                            backgroundColor:
                              meal.icon === iconName
                                ? meal.color
                                : colors.background + "50",
                            borderColor:
                              meal.icon === iconName
                                ? meal.color
                                : colors.border + "50",
                          },
                        ]}
                        onPress={() => updateMealIcon(meal.id, iconName)}
                      >
                        <Ionicons
                          name={iconName as any}
                          size={22}
                          color={
                            meal.icon === iconName
                              ? theme === "dark"
                                ? "#000"
                                : "#FFF"
                              : colors.text + "80"
                          }
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </MotiView>
              )}
            </TouchableOpacity>
          </MotiView>
        );
      },
      [
        colors,
        theme,
        toggleMealSelection,
        t,
        showColorSelectorFor,
        showIconSelectorFor,
        toggleColorSelector,
        toggleIconSelector,
        updateMealColor,
        updateMealIcon,
      ]
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
            <View style={styles.mealTypesContainer}>
              <AnimatePresence>
                {mealTypes.map((meal, index) => renderMealItem(meal, index))}
              </AnimatePresence>
            </View>
          </ScrollView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 15, delay: 300 }}
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
              style={
                getSelectedMealColor()
                  ? {
                      backgroundColor: getSelectedMealColor(),
                      height: 56,
                      borderRadius: 28,
                      justifyContent: "center",
                      alignItems: "center",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                    }
                  : styles.confirmButton
              }
              textStyle={{
                color: theme === "dark" ? "#000000" : "#FFFFFF",
                fontWeight: "700",
                fontSize: 16,
                letterSpacing: -0.3,
              }}
              hapticFeedback="notification"
              size="large"
              rounded={true}
              elevation={0}
              leftComponent={renderColorIndicators()}
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
    fontSize: 35,
    fontWeight: "bold",
    marginBottom: 8,
    fontFamily: "Anton",
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  mealCardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingLeft: 16, // Ajuste para dar espaço ao botão de cor
    paddingRight: 10, // Ajuste para dar espaço ao botão de cor
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
    // Removido - substituído por colorPickerButton
    // padding: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 27,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
    backgroundColor: Colors.light.background,
    paddingBottom: 35,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  // Estilos para os indicadores de cor
  colorIndicatorsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "white",
  },
  colorIndicatorMore: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: -2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "white",
  },
  colorIndicatorMoreText: {
    fontSize: 9,
    fontWeight: "bold",
  },
  colorPickerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8, // Espaço entre nome e botão de cor
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)", // Borda sutil
  },
  inlineSelectorContainer: {
    paddingVertical: 10,
    // backgroundColor: 'rgba(0,0,0,0.03)', // Fundo sutil
    borderBottomLeftRadius: 16, // Arredondar cantos inferiores
    borderBottomRightRadius: 16,
    overflow: "hidden", // Garantir que o conteúdo não transborde
    marginTop: -1, // Sobrepor ligeiramente a linha inferior do cartão
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)", // Linha divisória sutil
  },
  inlineSelectorList: {
    paddingHorizontal: 16,
    paddingVertical: 6, // Espaçamento vertical interno
  },
  colorOption: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  iconOption: {
    width: 42, // Ligeiramente maior para ícones
    height: 42,
    borderRadius: 21,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  optionSelected: {
    borderWidth: 2.5, // Destaque maior
    borderColor: "#FFF", // Borda branca para destaque
    transform: [{ scale: 1.05 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});
