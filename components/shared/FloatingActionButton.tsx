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
const TABBAR_WIDTH = width * 0.8;
const TABBAR_HEIGHT = 70;
const TABBAR_BORDER_RADIUS = 40;
const TABBAR_HORIZONTAL_MARGIN = width * 0.1;
const BOTTOM_POSITION_INITIAL = 10;
const DEFAULT_ICON_SIZE = 30;
const MENU_ICON_SIZE = 28;
const CONTROL_BUTTON_BG = "rgb(75, 75, 75)";
const CONTROL_ICON_COLOR = "#FFFFFF";
const CONTROL_BUTTON_SIZE = 45;
const CONTROL_BUTTON_RADIUS = 22.5;

const triggerHaptic = (
  type: "light" | "medium" | "error" | "success" = "light"
) => {
  try {
    if (Platform.OS === "ios") {
      return;
    }

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
    // Ignorar erros de Haptics
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

  const [isExpanded, setIsExpanded] = useState(false);
  const [contentMode, setContentMode] = useState<
    "default" | "mealTypes" | "water" | "workoutTypes" | "updateWeight"
  >("default");
  const [adjustingWeight, setAdjustingWeight] = useState<number>(
    nutritionInfo.weight || 0
  );

  const containerAnim = useRef(new Animated.Value(0)).current;

  const dynamicBottom = useMemo(
    () => (insets.bottom > 0 ? insets.bottom : BOTTOM_POSITION_INITIAL),
    [insets.bottom]
  );

  const [isAnimating, setIsAnimating] = useState(false);

  const toggleExpand = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    const toValue = isExpanded ? 0 : 1;

    if (Platform.OS === "android") {
      triggerHaptic(isExpanded ? "light" : "medium");
    }

    Animated.timing(containerAnim, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      InteractionManager.runAfterInteractions(() => {
        setIsExpanded(!isExpanded);
        setIsAnimating(false);

        if (toValue === 0) {
          setContentMode("default");
          setAdjustingWeight(nutritionInfo.weight || 0);
        }
      });
    });
  }, [isExpanded, containerAnim, isAnimating, nutritionInfo.weight]);

  const changeContentMode = useCallback(
    (newMode: typeof contentMode) => {
      if (contentMode === newMode) return;
      InteractionManager.runAfterInteractions(() => {
        setContentMode(newMode);

        if (newMode === "updateWeight") {
          setAdjustingWeight(nutritionInfo.weight || 0);
        }
      });
    },
    [contentMode, nutritionInfo.weight]
  );

  const adjustWeight = useCallback((amount: number) => {
    setAdjustingWeight((prevWeight) => {
      const newWeight = Math.max(0, prevWeight + amount);
      return Math.round(newWeight * 10) / 10;
    });
  }, []);

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

  const handleAddWater = useCallback(() => {
    addWater();
  }, [addWater]);

  const handleRemoveWater = useCallback(() => {
    removeWater();
  }, [removeWater]);

  const animations = useMemo(
    () => ({
      containerWidth: containerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [FAB_SIZE, TABBAR_WIDTH],
      }),
      containerHeight: containerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [FAB_SIZE, TABBAR_HEIGHT],
      }),
      containerBorderRadius: containerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [FAB_SIZE / 2, TABBAR_BORDER_RADIUS],
      }),
      containerBottom: containerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [
          dynamicBottom + (TABBAR_HEIGHT - FAB_SIZE) / 2,
          dynamicBottom,
        ],
      }),
      containerLeft: containerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [(width - FAB_SIZE) / 2, TABBAR_HORIZONTAL_MARGIN],
      }),
      iconOpacity: containerAnim.interpolate({
        inputRange: [0, 0.5],
        outputRange: [1, 0],
      }),
      iconRotation: containerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "45deg"],
      }),
      contentOpacity: containerAnim.interpolate({
        inputRange: [0.5, 1],
        outputRange: [0, 1],
      }),
    }),
    [containerAnim, dynamicBottom]
  );

  return (
    <>
      {isExpanded && (
        <Pressable style={styles.invisibleBackdrop} onPress={toggleExpand} />
      )}

      <Animated.View
        style={[
          styles.container,
          {
            width: animations.containerWidth,
            height: animations.containerHeight,
            borderRadius: animations.containerBorderRadius,
            bottom: animations.containerBottom,
            left: animations.containerLeft,
            backgroundColor: colors.primary,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              opacity: animations.iconOpacity,
              transform: [{ rotate: animations.iconRotation }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggleExpand}
            disabled={isAnimating}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="add"
              size={DEFAULT_ICON_SIZE}
              color={colors.background}
            />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[styles.content, { opacity: animations.contentOpacity }]}
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
                removeClippedSubviews={true}
              >
                {mealTypes.map((mealType) => (
                  <TouchableOpacity
                    key={`meal-${mealType.id}`}
                    style={styles.menuItem}
                    onPress={() => navigateToAddFood(mealType)}
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
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
                style={styles.controlButton}
                onPress={() => changeContentMode("default")}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <Ionicons
                  name="arrow-back"
                  size={MENU_ICON_SIZE}
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
              >
                <MaterialCommunityIcons
                  name="minus"
                  size={MENU_ICON_SIZE}
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
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={MENU_ICON_SIZE}
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
                removeClippedSubviews={true}
              >
                {selectedWorkoutTypes.map((workoutType) => (
                  <TouchableOpacity
                    key={`workout-${workoutType.id}`}
                    style={styles.menuItem}
                    onPress={() => handleStartWorkout(workoutType)}
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
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
            <View style={styles.controlsMenu}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => changeContentMode("default")}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <Ionicons
                  name="arrow-back"
                  size={MENU_ICON_SIZE}
                  color={CONTROL_ICON_COLOR}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.controlButton,
                  adjustingWeight <= 0 && styles.disabledButton,
                ]}
                onPress={() => adjustWeight(-0.1)}
                disabled={adjustingWeight <= 0}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <Ionicons
                  name="remove"
                  size={MENU_ICON_SIZE}
                  color={CONTROL_ICON_COLOR}
                />
              </TouchableOpacity>

              <View style={styles.valueDisplay}>
                <Text style={[styles.valueText, { color: colors.background }]}>
                  {adjustingWeight.toFixed(1)}
                  <Text style={styles.unitText}>kg</Text>
                </Text>
              </View>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => adjustWeight(0.1)}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <Ionicons
                  name="add"
                  size={MENU_ICON_SIZE}
                  color={CONTROL_ICON_COLOR}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.controlButton,
                  adjustingWeight === nutritionInfo.weight &&
                    styles.disabledButton,
                ]}
                onPress={handleUpdateWeight}
                disabled={adjustingWeight === nutritionInfo.weight}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <Ionicons
                  name="checkmark"
                  size={MENU_ICON_SIZE}
                  color={CONTROL_ICON_COLOR}
                />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
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
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
  },
  backdropPressable: {
    width: "100%",
    height: "100%",
  },
  defaultMenu: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 15,
  },
  scrollMenu: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 10,
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
    margin: 3,
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
});
