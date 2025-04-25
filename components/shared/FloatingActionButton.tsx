import React, { useRef, useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Text,
  Dimensions,
  Pressable,
  ScrollView,
  Alert,
  Platform,
  InteractionManager,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useMeals, MealType } from "../../context/MealContext";
import { useNutrition } from "../../context/NutritionContext";
import { useWorkoutContext, WorkoutType } from "../../context/WorkoutContext";
import { validateWeight } from "../../utils/validations";
import WorkoutIcon from "./WorkoutIcon";

const { width } = Dimensions.get("window");
const FAB_SIZE = 65;
const TABBAR_WIDTH = width * 0.85;
const TABBAR_HEIGHT = 70;
const TABBAR_BORDER_RADIUS = 40;
const TABBAR_HORIZONTAL_MARGIN = width * 0.075;
const BOTTOM_POSITION_INITIAL = 10;
const DEFAULT_ICON_SIZE = 30;
const MENU_ICON_SIZE = 28;
const CONTROL_ICON_SIZE = 30;
const CONTROL_BUTTON_BG = "rgb(75, 75, 75)";
const CONTROL_ICON_COLOR = "#FFFFFF";
const CONTROL_BUTTON_SIZE = 54;
const CONTROL_BUTTON_RADIUS = 26;

const triggerHaptic = (
  type: "light" | "medium" | "error" | "success" = "light"
) => {
  if (Platform.OS !== "android") return;

  try {
    switch (type) {
      case "light":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "error":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case "success":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
    }
  } catch (error) {
    // Ignora erros de feedback tátil
  }
};

export default function FloatingActionButton() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { mealTypes } = useMeals();
  const {
    currentWaterIntake,
    addWater,
    removeWater,
    dailyWaterGoal,
    updateNutritionInfo,
    saveNutritionInfo,
    nutritionInfo,
  } = useNutrition();
  const { selectedWorkoutTypes, startWorkoutForDate } = useWorkoutContext();

  // Estado único para controle de animação
  const animationProgress = useRef(new Animated.Value(0)).current;

  // Estados
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentMode, setContentMode] = useState<
    "default" | "mealTypes" | "water" | "workoutTypes" | "updateWeight"
  >("default");
  const [adjustingWeight, setAdjustingWeight] = useState<number>(
    nutritionInfo.weight || 0
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [contentOpacity, setContentOpacity] = useState(0);

  // Calcula a posição dinâmica do botão
  const dynamicBottom = useMemo(
    () => (insets.bottom > 0 ? insets.bottom : BOTTOM_POSITION_INITIAL),
    [insets.bottom]
  );

  // Interpola valores de animação com base no progresso
  const animatedStyles = useMemo(() => {
    const widthAnim = animationProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [FAB_SIZE, TABBAR_WIDTH],
    });

    const height = animationProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [FAB_SIZE, TABBAR_HEIGHT],
    });

    const borderRadius = animationProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [FAB_SIZE / 2, TABBAR_BORDER_RADIUS],
    });

    const left = animationProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [(width - FAB_SIZE) / 2, TABBAR_HORIZONTAL_MARGIN],
    });

    const bottom = animationProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [
        dynamicBottom + (TABBAR_HEIGHT - FAB_SIZE) / 2,
        dynamicBottom,
      ],
    });

    // Removendo a rotação, apenas controlando a opacidade
    const opacity = animationProgress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0, 0],
    });

    return { width: widthAnim, height, borderRadius, left, bottom, opacity };
  }, [animationProgress, dynamicBottom, width]);

  // Controla a expansão do FAB
  const toggleExpand = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    const expanding = !isExpanded;

    // Feedback tátil
    if (Platform.OS === "android") {
      triggerHaptic(expanding ? "medium" : "light");
    }

    // Animação suave
    Animated.timing(animationProgress, {
      toValue: expanding ? 1 : 0,
      duration: 250, // Reduzindo para 250ms para ficar mais rápido
      useNativeDriver: false,
    }).start(() => {
      setIsExpanded(expanding);
      setIsAnimating(false);

      if (expanding) {
        setContentOpacity(1);
      } else {
        // Resetar estados quando colapsar
        InteractionManager.runAfterInteractions(() => {
          setContentMode("default");
          setAdjustingWeight(nutritionInfo.weight || 0);
          setContentOpacity(0);
        });
      }
    });

    // Fade do conteúdo mais rápido
    if (expanding) {
      // Atrasa um pouco a exibição do conteúdo para animação mais suave, mas mais rápido
      setTimeout(() => {
        setContentOpacity(1);
      }, 100);
    } else {
      setContentOpacity(0);
    }
  }, [isExpanded, isAnimating, animationProgress, nutritionInfo.weight]);

  // Muda o modo de conteúdo com fade mais rápido
  const changeContentMode = useCallback(
    (newMode: typeof contentMode) => {
      if (contentMode === newMode) return;

      // Fade out rápido
      setContentOpacity(0);

      // Troca o modo após um breve delay, mas mais rápido
      setTimeout(() => {
        setContentMode(newMode);

        if (newMode === "updateWeight") {
          setAdjustingWeight(nutritionInfo.weight || 0);
        }

        // Fade in imediato
        setContentOpacity(1);
      }, 50);
    },
    [contentMode, nutritionInfo.weight]
  );

  // Ajusta o peso
  const adjustWeight = useCallback((amount: number) => {
    setAdjustingWeight((prevWeight) => {
      const newWeight = Math.max(0, prevWeight + amount);
      return Math.round(newWeight * 10) / 10;
    });
  }, []);

  // Atualiza o peso
  const handleUpdateWeight = useCallback(async () => {
    const validationResult = validateWeight(adjustingWeight);

    if (!validationResult.isValid) {
      Alert.alert(
        "Erro",
        validationResult.message || t("validation.invalidWeight")
      );
      triggerHaptic("error");
      return;
    }

    if (adjustingWeight === nutritionInfo.weight) {
      toggleExpand();
      return;
    }

    try {
      await updateNutritionInfo({ weight: adjustingWeight });
      await saveNutritionInfo();
      triggerHaptic("success");
      toggleExpand();
    } catch (error) {
      console.error("Failed to save weight:", error);
      Alert.alert(
        "Erro",
        t("errors.saveWeightError") || "Não foi possível salvar o peso."
      );
      triggerHaptic("error");
    }
  }, [
    adjustingWeight,
    updateNutritionInfo,
    saveNutritionInfo,
    toggleExpand,
    t,
    nutritionInfo.weight,
  ]);

  // Opções do menu principal
  const menuOptions = useMemo(
    () => [
      {
        icon: "barbell-outline" as const,
        label: t("training.menu.newWorkout", "Novo Treino"),
        onPress: () => {
          if (selectedWorkoutTypes.length > 0) {
            changeContentMode("workoutTypes");
          } else {
            toggleExpand();
            router.push("/training?openWorkoutConfig=true");
          }
        },
      },
      {
        icon: "nutrition-outline" as const,
        label: t("nutrition.menu.newMeal", "Nova Refeição"),
        onPress: () => {
          changeContentMode("mealTypes");
        },
      },
      {
        icon: "scale-outline" as const,
        label: t("weight.update", "Atualizar Peso"),
        onPress: () => {
          setAdjustingWeight(nutritionInfo.weight || 0);
          changeContentMode("updateWeight");
        },
      },
      {
        icon: "water-outline" as const,
        label: t("waterIntake.title", "Registrar Água"),
        onPress: () => {
          changeContentMode("water");
        },
      },
    ],
    [
      t,
      selectedWorkoutTypes,
      changeContentMode,
      toggleExpand,
      router,
      nutritionInfo.weight,
    ]
  );

  // Navega para adicionar comida
  const navigateToAddFood = useCallback(
    (meal: MealType) => {
      toggleExpand();
      setTimeout(() => {
        router.push({
          pathname: "/(add-food)",
          params: {
            mealId: meal.id,
            mealName: meal.name,
            mealColor: meal.color || colors.primary,
          },
        });
      }, 150);
    },
    [router, colors.primary, toggleExpand]
  );

  // Inicia um treino
  const handleStartWorkout = useCallback(
    async (workoutType: WorkoutType) => {
      await startWorkoutForDate(workoutType.id);
      toggleExpand();
      setTimeout(() => {
        router.push({
          pathname: "/(add-exercise)",
          params: {
            workoutId: workoutType.id,
            workoutName: workoutType.name,
            workoutColor: workoutType.color,
          },
        });
      }, 150);
    },
    [startWorkoutForDate, toggleExpand, router]
  );

  // Adiciona água
  const handleAddWater = useCallback(() => {
    addWater();
  }, [addWater]);

  // Remove água
  const handleRemoveWater = useCallback(() => {
    removeWater();
  }, [removeWater]);

  return (
    <>
      {isExpanded && (
        <Pressable
          style={styles.invisibleBackdrop}
          onPress={toggleExpand}
          accessible={true}
          accessibilityLabel={t("accessibility.closeMenu", "Fechar menu")}
        />
      )}

      <Animated.View
        style={[
          styles.container,
          {
            width: animatedStyles.width,
            height: animatedStyles.height,
            borderRadius: animatedStyles.borderRadius,
            bottom: animatedStyles.bottom,
            left: animatedStyles.left,
            backgroundColor: colors.primary,
          },
        ]}
      >
        {/* Botão principal */}
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              opacity: animatedStyles.opacity,
              // Removendo a transformação de rotação
            },
          ]}
          pointerEvents={isExpanded ? "none" : "auto"}
        >
          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggleExpand}
            disabled={isAnimating}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessible={true}
            accessibilityLabel={t("accessibility.openMenu", "Abrir menu")}
          >
            <Ionicons
              name="add"
              size={DEFAULT_ICON_SIZE}
              color={colors.background}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Conteúdo expandido */}
        <View
          style={[styles.content, { opacity: contentOpacity }]}
          pointerEvents={isExpanded ? "auto" : "none"}
        >
          {contentMode === "default" && (
            <View style={styles.defaultMenu}>
              {menuOptions.map((option, index) => (
                <TouchableOpacity
                  key={`option-${index}`}
                  style={styles.menuItem}
                  onPress={option.onPress}
                  activeOpacity={0.7}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                  accessible={true}
                  accessibilityLabel={option.label}
                >
                  <Ionicons
                    name={option.icon}
                    size={MENU_ICON_SIZE}
                    color={colors.background}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {contentMode === "mealTypes" && (
            <View style={styles.scrollMenuFull}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.scrollContent,
                  styles.centeredContent,
                ]}
                removeClippedSubviews={false}
                decelerationRate="fast"
              >
                {mealTypes.map((mealType) => (
                  <TouchableOpacity
                    key={`meal-${mealType.id}`}
                    style={styles.menuItem}
                    onPress={() => navigateToAddFood(mealType)}
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                    accessible={true}
                    accessibilityLabel={mealType.name}
                  >
                    <Ionicons
                      name={(mealType.icon || "restaurant-outline") as any}
                      size={MENU_ICON_SIZE}
                      color={mealType.color || colors.background}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {contentMode === "water" && (
            <View style={styles.controlsMenu}>
              <TouchableOpacity
                style={[styles.controlButton, styles.backButton]}
                onPress={() => changeContentMode("default")}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                accessible={true}
                accessibilityLabel={t("accessibility.back", "Voltar")}
              >
                <Ionicons
                  name="arrow-back"
                  size={CONTROL_ICON_SIZE}
                  color={CONTROL_ICON_COLOR}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.controlButton,
                  currentWaterIntake <= 0 && styles.disabledButton,
                ]}
                onPress={handleRemoveWater}
                disabled={currentWaterIntake <= 0}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                accessible={true}
                accessibilityLabel={t(
                  "waterIntake.removeWater",
                  "Remover água"
                )}
              >
                <MaterialCommunityIcons
                  name="minus"
                  size={CONTROL_ICON_SIZE}
                  color={CONTROL_ICON_COLOR}
                />
              </TouchableOpacity>

              <View style={styles.valueDisplay}>
                <Text style={[styles.valueText, { color: colors.background }]}>
                  {`${(currentWaterIntake / 1000).toFixed(1)}L`}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.controlButton,
                  currentWaterIntake >= dailyWaterGoal && styles.disabledButton,
                ]}
                onPress={handleAddWater}
                disabled={currentWaterIntake >= dailyWaterGoal}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                accessible={true}
                accessibilityLabel={t("waterIntake.addWater", "Adicionar água")}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={CONTROL_ICON_SIZE}
                  color={CONTROL_ICON_COLOR}
                />
              </TouchableOpacity>
            </View>
          )}

          {contentMode === "workoutTypes" && (
            <View style={styles.scrollMenuFull}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.scrollContent,
                  styles.centeredContent,
                ]}
                removeClippedSubviews={false}
                decelerationRate="fast"
              >
                {selectedWorkoutTypes.map((workoutType) => (
                  <TouchableOpacity
                    key={`workout-${workoutType.id}`}
                    style={styles.menuItem}
                    onPress={() => handleStartWorkout(workoutType)}
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                    accessible={true}
                    accessibilityLabel={workoutType.name}
                  >
                    <WorkoutIcon
                      iconType={workoutType.iconType}
                      size={MENU_ICON_SIZE}
                      color={workoutType.color || colors.background}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {contentMode === "updateWeight" && (
            <View style={styles.controlsMenuUpdate}>
              <View style={styles.controlsLeft}>
                <TouchableOpacity
                  style={[styles.controlButton, styles.backButton]}
                  onPress={() => changeContentMode("default")}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                  accessible={true}
                  accessibilityLabel={t("accessibility.back", "Voltar")}
                >
                  <Ionicons
                    name="arrow-back"
                    size={CONTROL_ICON_SIZE}
                    color={CONTROL_ICON_COLOR}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.controlsCenter}>
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    adjustingWeight <= 0 && styles.disabledButton,
                  ]}
                  onPress={() => adjustWeight(-0.1)}
                  disabled={adjustingWeight <= 0}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                  accessible={true}
                  accessibilityLabel={t("weight.decrease", "Diminuir peso")}
                >
                  <Ionicons
                    name="remove"
                    size={CONTROL_ICON_SIZE}
                    color={CONTROL_ICON_COLOR}
                  />
                </TouchableOpacity>

                <View style={styles.valueDisplay}>
                  <Text
                    style={[styles.valueText, { color: colors.background }]}
                  >
                    {adjustingWeight.toFixed(1)}
                    <Text style={styles.unitText}>kg</Text>
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => adjustWeight(0.1)}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                  accessible={true}
                  accessibilityLabel={t("weight.increase", "Aumentar peso")}
                >
                  <Ionicons
                    name="add"
                    size={CONTROL_ICON_SIZE}
                    color={CONTROL_ICON_COLOR}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.controlsRight}>
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    styles.saveButton,
                    adjustingWeight === nutritionInfo.weight &&
                      styles.disabledButton,
                  ]}
                  onPress={handleUpdateWeight}
                  disabled={adjustingWeight === nutritionInfo.weight}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                  accessible={true}
                  accessibilityLabel={t("weight.save", "Salvar peso")}
                >
                  <Ionicons
                    name="checkmark"
                    size={CONTROL_ICON_SIZE}
                    color={CONTROL_ICON_COLOR}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconWrapper: {
    position: "absolute",
    width: FAB_SIZE,
    height: FAB_SIZE,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 21,
  },
  iconButton: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 20,
  },
  defaultMenu: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 15,
  },
  scrollMenuFull: {
    width: "100%",
    alignItems: "center",
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 5,
  },
  centeredContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  controlsMenu: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 10,
  },
  menuItem: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    minWidth: 48,
    minHeight: 48,
  },
  controlButton: {
    width: CONTROL_BUTTON_SIZE,
    height: CONTROL_BUTTON_SIZE,
    borderRadius: CONTROL_BUTTON_RADIUS,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: CONTROL_BUTTON_BG,
    margin: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3,
  },
  saveButton: {
    marginRight: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  valueDisplay: {
    alignItems: "center",
    minWidth: 70,
  },
  valueText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  unitText: {
    fontSize: 12,
    fontWeight: "normal",
    marginLeft: 2,
  },
  invisibleBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
  },
  backButton: {
    marginLeft: 6,
  },
  controlsMenuUpdate: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 8,
  },
  controlsLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  controlsCenter: {
    flex: 2,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  controlsRight: {
    flex: 1,
    alignItems: "flex-end",
  },
});
