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
import WorkoutIcon from "./WorkoutIcon"; // Assuming WorkoutIcon is in the same folder

const { width } = Dimensions.get("window");
const FAB_SIZE = 70;
const TABBAR_WIDTH = width * 0.8;
const TABBAR_HEIGHT = 70;
const TABBAR_BORDER_RADIUS = 40;
const TABBAR_HORIZONTAL_MARGIN = width * 0.1;
const BOTTOM_POSITION_INITIAL = 10;

// Função para reduzir uso do Haptics em alguns dispositivos
const safeHaptics = {
  impactAsync: (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS === "ios") {
      // Reduzir frequência de haptics no iOS
      setTimeout(() => Haptics.impactAsync(style), 0);
    } else {
      Haptics.impactAsync(style);
    }
  },
  selectionAsync: () => {
    if (Platform.OS === "ios") {
      // Reduzir frequência de haptics no iOS
      setTimeout(() => Haptics.selectionAsync(), 0);
    } else {
      Haptics.selectionAsync();
    }
  },
  notificationAsync: (type: Haptics.NotificationFeedbackType) => {
    Haptics.notificationAsync(type);
  },
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
  const [fabContentMode, setFabContentMode] = useState<
    "default" | "mealTypes" | "water" | "workoutTypes" | "updateWeight"
  >("default");
  const [adjustingWeight, setAdjustingWeight] = useState<number>(
    nutritionInfo.weight || 0
  );

  const animatedValue = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const contentModeOpacity = useRef({
    default: new Animated.Value(1),
    mealTypes: new Animated.Value(0),
    water: new Animated.Value(0),
    workoutTypes: new Animated.Value(0),
    updateWeight: new Animated.Value(0),
  }).current;

  const dynamicBottom =
    insets.bottom > 0 ? insets.bottom : BOTTOM_POSITION_INITIAL;

  const [isToggleEnabled, setIsToggleEnabled] = useState(true);

  const toggleExpand = useCallback(() => {
    if (!isToggleEnabled) return;

    setIsToggleEnabled(false);
    setTimeout(() => setIsToggleEnabled(true), 300);

    const toValue = isExpanded ? 0 : 1;
    const hapticStyle = isExpanded
      ? Haptics.ImpactFeedbackStyle.Light
      : Haptics.ImpactFeedbackStyle.Medium;

    safeHaptics.impactAsync(hapticStyle);

    Animated.parallel([
      Animated.timing(animatedValue, {
        toValue,
        duration: 250,
        useNativeDriver: false, // Layout properties are not supported by native driver
      }),
      Animated.timing(backdropOpacity, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsExpanded(!isExpanded); // Update state after animation completes
      if (toValue === 0) {
        // Reset mode and opacities only after collapsing
        setFabContentMode("default");
        Object.keys(contentModeOpacity).forEach((key) => {
          contentModeOpacity[key as keyof typeof contentModeOpacity].setValue(
            key === "default" ? 1 : 0
          );
        });
        setAdjustingWeight(nutritionInfo.weight || 0);
      } else {
        // Prepare state for expansion if needed
        if (fabContentMode === "updateWeight") {
          setAdjustingWeight(nutritionInfo.weight || 0);
        }
      }
    });
  }, [
    isExpanded,
    animatedValue,
    backdropOpacity,
    contentModeOpacity,
    nutritionInfo.weight,
    fabContentMode,
    isToggleEnabled,
  ]);

  const adjustWeight = useCallback((amount: number) => {
    setAdjustingWeight((prevWeight) => {
      const newWeight = Math.max(0, prevWeight + amount);
      return Math.round(newWeight * 10) / 10; // Round to one decimal place
    });
  }, []);

  const handleUpdateWeight = useCallback(async () => {
    const validationResult = validateWeight(adjustingWeight);

    if (!validationResult.isValid) {
      Alert.alert(
        "Erro",
        validationResult.message || t("validation.invalidWeight")
      );
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Avoid unnecessary updates if weight hasn't changed
    if (adjustingWeight === nutritionInfo.weight) {
      toggleExpand();
      return;
    }

    try {
      await updateNutritionInfo({ weight: adjustingWeight });
      await saveNutritionInfo();
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toggleExpand(); // Collapse after successful save
    } catch (error) {
      console.error("Failed to save weight:", error);
      Alert.alert(
        "Erro",
        t("errors.saveWeightError") || "Não foi possível salvar o peso."
      );
      safeHaptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [
    adjustingWeight,
    updateNutritionInfo,
    saveNutritionInfo,
    toggleExpand,
    t,
    nutritionInfo.weight,
  ]);

  const changeContentMode = useCallback(
    (newMode: typeof fabContentMode) => {
      if (fabContentMode === newMode) return; // Prevent unnecessary animation if mode is already set

      const currentOpacityAnim = contentModeOpacity[fabContentMode];
      const nextOpacityAnim = contentModeOpacity[newMode];

      Animated.sequence([
        Animated.timing(currentOpacityAnim, {
          toValue: 0,
          duration: 100, // Faster fade out
          useNativeDriver: true,
        }),
        Animated.timing(nextOpacityAnim, {
          toValue: 1,
          duration: 150, // Slightly slower fade in
          useNativeDriver: true,
        }),
      ]).start(() => {
        setFabContentMode(newMode); // Update mode after animation
        // Ensure correct state after mode change
        if (newMode === "updateWeight") {
          setAdjustingWeight(nutritionInfo.weight || 0);
        }
      });
    },
    [fabContentMode, contentModeOpacity, nutritionInfo.weight]
  );

  const menuOptions = useMemo(
    () => [
      {
        icon: "barbell-outline" as const,
        label: t("training.menu.newWorkout", "Novo Treino"),
        onPress: () => {
          safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
          safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          changeContentMode("mealTypes");
        },
      },
      {
        icon: "scale-outline" as const,
        label: t("weight.update", "Atualizar Peso"),
        onPress: () => {
          safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setAdjustingWeight(nutritionInfo.weight || 0); // Ensure weight is current before showing
          changeContentMode("updateWeight");
        },
      },
      {
        icon: "water-outline" as const,
        label: t("waterIntake.title", "Registrar Água"),
        onPress: () => {
          safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const containerWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [FAB_SIZE, TABBAR_WIDTH],
    extrapolate: "clamp",
  });

  const containerHeight = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [FAB_SIZE, TABBAR_HEIGHT],
    extrapolate: "clamp",
  });

  const containerBorderRadius = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [FAB_SIZE / 2, TABBAR_BORDER_RADIUS],
    extrapolate: "clamp",
  });

  const containerBottom = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      dynamicBottom + (TABBAR_HEIGHT - FAB_SIZE) / 2,
      dynamicBottom,
    ],
    extrapolate: "clamp",
  });

  const containerLeft = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [(width - FAB_SIZE) / 2, TABBAR_HORIZONTAL_MARGIN],
    extrapolate: "clamp",
  });

  const iconOpacity = animatedValue.interpolate({
    inputRange: [0, 0.1],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const optionsOpacity = animatedValue.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const rotateCross = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "225deg"],
    extrapolate: "clamp",
  });

  const navigateToAddFood = useCallback(
    (meal: MealType) => {
      safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleExpand(); // Collapse FAB first
      // Use setTimeout to allow animation to start before navigating
      setTimeout(() => {
        router.push({
          pathname: "/(add-food)",
          params: {
            mealId: meal.id,
            mealName: meal.name,
            mealColor: meal.color || colors.primary,
          },
        });
      }, 100); // Short delay
    },
    [router, colors.primary, toggleExpand]
  );

  const handleStartWorkout = useCallback(
    async (workoutType: WorkoutType) => {
      safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await startWorkoutForDate(workoutType.id);
      toggleExpand(); // Collapse FAB first
      // Use setTimeout to allow animation to start before navigating
      setTimeout(() => {
        router.push({
          pathname: "/(add-exercise)",
          params: {
            workoutId: workoutType.id,
            workoutName: workoutType.name,
            workoutColor: workoutType.color,
          },
        });
      }, 100); // Short delay
    },
    [startWorkoutForDate, toggleExpand, router]
  );

  const handleAddWater = useCallback(() => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addWater();
  }, [addWater]);

  const handleRemoveWater = useCallback(() => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeWater();
  }, [removeWater]);

  const handleAdjustWeightUp = useCallback(() => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    adjustWeight(0.1);
  }, [adjustWeight]);

  const handleAdjustWeightDown = useCallback(() => {
    safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    adjustWeight(-0.1);
  }, [adjustWeight]);

  return (
    <>
      {isExpanded && (
        <Animated.View
          style={[styles.transparentBackdrop, { opacity: backdropOpacity }]}
          pointerEvents={isExpanded ? "auto" : "none"}
        >
          <Pressable style={styles.backdropTouchable} onPress={toggleExpand} />
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.animatedContainer,
          {
            width: containerWidth,
            height: containerHeight,
            borderRadius: containerBorderRadius,
            bottom: containerBottom,
            left: containerLeft,
            backgroundColor: colors.primary,
          },
        ]}
      >
        {/* FAB Icon (Plus/Cross) */}
        <Animated.View
          style={[
            styles.fabIconWrapper,
            { opacity: iconOpacity, transform: [{ rotate: rotateCross }] },
          ]}
        >
          <TouchableOpacity
            style={styles.fabTouchable}
            activeOpacity={0.9}
            onPress={toggleExpand}
            disabled={!isToggleEnabled} // Disable during animation
          >
            <Ionicons name="add" size={38} color={colors.background} />
          </TouchableOpacity>
        </Animated.View>

        {/* Expanded Options Container */}
        <Animated.View
          style={[styles.optionsRow, { opacity: optionsOpacity }]}
          pointerEvents={isExpanded ? "auto" : "none"}
        >
          {/* Default Options */}
          <Animated.View
            style={[
              styles.contentWrapper,
              styles.defaultOptionsContainer,
              { opacity: contentModeOpacity.default },
            ]}
            pointerEvents={fabContentMode === "default" ? "auto" : "none"}
          >
            {menuOptions.map((option, index) => (
              <TouchableOpacity
                key={`default-option-${index}`}
                style={styles.optionButton}
                onPress={option.onPress}
                activeOpacity={0.7}
                disabled={!isExpanded}
              >
                <Ionicons
                  name={option.icon}
                  size={28}
                  color={colors.background}
                />
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Meal Types Options */}
          <Animated.View
            style={[
              styles.contentWrapper,
              { opacity: contentModeOpacity.mealTypes },
            ]}
            pointerEvents={fabContentMode === "mealTypes" ? "auto" : "none"}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContentContainer}
              alwaysBounceHorizontal={false}
              style={styles.scrollView}
            >
              {mealTypes.map((mealType) => (
                <TouchableOpacity
                  key={`mealType-${mealType.id}`}
                  style={styles.optionButton}
                  onPress={() => navigateToAddFood(mealType)}
                  activeOpacity={0.7}
                  disabled={!isExpanded}
                >
                  <Ionicons
                    name={(mealType.icon || "restaurant-outline") as any}
                    size={28}
                    color={mealType.color || colors.background}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Water Options */}
          <Animated.View
            style={[
              styles.contentWrapper,
              styles.waterOptionsContainer,
              { opacity: contentModeOpacity.water },
            ]}
            pointerEvents={fabContentMode === "water" ? "auto" : "none"}
          >
            <TouchableOpacity
              style={[
                styles.adjustButton,
                { backgroundColor: colors.background + "30" },
              ]}
              onPress={() => changeContentMode("default")}
              activeOpacity={0.7}
              disabled={!isExpanded}
            >
              <Ionicons name="arrow-back" size={24} color={colors.background} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.adjustButton,
                { backgroundColor: colors.background + "30" },
              ]}
              onPress={handleRemoveWater}
              activeOpacity={0.7}
              disabled={!isExpanded || currentWaterIntake <= 0}
            >
              <MaterialCommunityIcons
                name="minus"
                size={24}
                color={colors.background}
              />
            </TouchableOpacity>
            <View style={styles.waterDisplayContainer}>
              <Text
                style={[
                  styles.waterDisplayTextBase,
                  { color: colors.background },
                ]}
              >
                {`${(currentWaterIntake / 1000).toFixed(1)}L`}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.adjustButton,
                { backgroundColor: colors.background + "30" },
              ]}
              onPress={handleAddWater}
              activeOpacity={0.7}
              disabled={!isExpanded || currentWaterIntake >= dailyWaterGoal}
            >
              <MaterialCommunityIcons
                name="plus"
                size={24}
                color={colors.background}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Workout Types Options */}
          <Animated.View
            style={[
              styles.contentWrapper,
              { opacity: contentModeOpacity.workoutTypes },
            ]}
            pointerEvents={fabContentMode === "workoutTypes" ? "auto" : "none"}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContentContainer}
              alwaysBounceHorizontal={false}
              style={styles.scrollView}
            >
              {selectedWorkoutTypes.map((workoutType) => (
                <TouchableOpacity
                  key={`workoutType-${workoutType.id}`}
                  style={styles.optionButton}
                  onPress={() => handleStartWorkout(workoutType)}
                  activeOpacity={0.7}
                  disabled={!isExpanded}
                >
                  <WorkoutIcon
                    iconType={workoutType.iconType}
                    size={28}
                    color={workoutType.color || colors.background}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Update Weight Options */}
          <Animated.View
            style={[
              styles.contentWrapper,
              styles.updateWeightContainer,
              { opacity: contentModeOpacity.updateWeight },
            ]}
            pointerEvents={fabContentMode === "updateWeight" ? "auto" : "none"}
          >
            <TouchableOpacity
              style={[
                styles.adjustButton,
                { backgroundColor: colors.background + "30" },
              ]}
              onPress={() => changeContentMode("default")}
              activeOpacity={0.7}
              disabled={!isExpanded}
            >
              <Ionicons name="arrow-back" size={24} color={colors.background} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.adjustButton,
                { backgroundColor: colors.background + "30" },
              ]}
              onPress={handleAdjustWeightDown}
              activeOpacity={0.7}
              disabled={!isExpanded || adjustingWeight <= 0}
            >
              <Ionicons name="remove" size={24} color={colors.background} />
            </TouchableOpacity>
            <View style={styles.weightDisplayContainer}>
              <Text
                style={[
                  styles.weightDisplayTextBase,
                  { color: colors.background },
                ]}
              >
                {adjustingWeight.toFixed(1)}
              </Text>
              <Text
                style={[
                  styles.weightUnitTextBase,
                  { color: colors.background + "B0" },
                ]}
              >
                kg
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.adjustButton,
                { backgroundColor: colors.background + "30" },
              ]}
              onPress={handleAdjustWeightUp}
              activeOpacity={0.7}
              disabled={!isExpanded}
            >
              <Ionicons name="add" size={24} color={colors.background} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.adjustButton,
                { backgroundColor: colors.background + "30" },
              ]}
              onPress={handleUpdateWeight}
              activeOpacity={0.7}
              disabled={!isExpanded || adjustingWeight === nutritionInfo.weight} // Disable if weight hasn't changed
            >
              <Ionicons name="checkmark" size={24} color={colors.background} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    overflow: "hidden",
    // Shared shadow for better performance
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  fabIconWrapper: {
    position: "absolute", // Keep icon centered during animation
    width: FAB_SIZE,
    height: FAB_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  fabTouchable: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  optionsRow: {
    // Takes full space of the animated container when expanded
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15, // Padding inside the expanded row
  },
  contentWrapper: {
    // Absolute fill within optionsRow to allow fading between modes
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
  },
  defaultOptionsContainer: {
    justifyContent: "space-around", // Distribute default icons evenly
    paddingHorizontal: 15, // Padding for default icons
  },
  waterOptionsContainer: {
    justifyContent: "space-between", // Space between back, controls, dummy view
    alignItems: "center",
    paddingHorizontal: 10, // Adjust padding for back button
  },
  optionButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    minWidth: 60, // Ensure minimum touch area
    height: "100%",
  },
  scrollContentContainer: {
    alignItems: "center",
    justifyContent: "center", // Center items if they don't fill the scrollview
    paddingHorizontal: 5, // Padding inside the scroll view
    flexGrow: 1, // Allow container to grow
  },
  scrollView: {
    width: "100%", // Take full width within the content wrapper
  },
  transparentBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent", // Changed from rgba(0,0,0,0.4)
    zIndex: 15, // Below the FAB container
  },
  backdropTouchable: {
    width: "100%",
    height: "100%",
  },
  updateWeightContainer: {
    justifyContent: "space-between", // Space between back, controls, save
    alignItems: "center",
    paddingHorizontal: 10, // Adjust padding for back button
  },
  adjustButton: {
    padding: 10,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  weightDisplayContainer: {
    alignItems: "center",
    minWidth: 80, // Keep consistent width
    paddingHorizontal: 5,
  },
  weightDisplayTextBase: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  weightUnitTextBase: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  waterDisplayContainer: {
    alignItems: "center",
  },
  waterDisplayTextBase: {
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledSaveButton: {
    opacity: 0.5, // Indicate visually that the button is disabled
  },
});
