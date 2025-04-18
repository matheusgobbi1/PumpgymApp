import { Tabs } from "expo-router";
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
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useRef, useState, useCallback, useMemo } from "react";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useMeals, MealType } from "../../context/MealContext";
import { useNutrition } from "../../context/NutritionContext";
import { useWorkoutContext, WorkoutType } from "../../context/WorkoutContext";
import { validateWeight } from "../../utils/validations";
import FloatingActionButton from "../../components/shared/FloatingActionButton";

const { width } = Dimensions.get("window");
const FAB_SIZE = 65;
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

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

function TabBarIcon5(props: {
  name: React.ComponentProps<typeof FontAwesome5>["name"];
  color: string;
}) {
  return <FontAwesome5 size={24} style={{ marginBottom: -3 }} {...props} />;
}

const WorkoutIcon = ({
  iconType,
  size,
  color,
}: {
  iconType?: { type: string; name: string };
  size: number;
  color: string;
}) => {
  if (!iconType || !iconType.type || !iconType.name) {
    return <Ionicons name="barbell-outline" size={size} color={color} />;
  }

  if (iconType.type === "material") {
    return (
      <MaterialCommunityIcons
        name={iconType.name as any}
        size={size}
        color={color}
      />
    );
  } else if (iconType.type === "fontawesome") {
    return (
      <FontAwesome5 name={iconType.name as any} size={size} color={color} />
    );
  } else {
    return <Ionicons name={iconType.name as any} size={size} color={color} />;
  }
};

export default function TabLayout() {
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

  const dynamicBottom =
    insets.bottom > 0 ? insets.bottom : BOTTOM_POSITION_INITIAL;

  const navigateToAddFood = useCallback(
    (meal: MealType) => {
      router.push({
        pathname: "/(add-food)",
        params: {
          mealId: meal.id,
          mealName: meal.name,
          mealColor: meal.color || colors.primary,
        },
      });
    },
    [router, colors.primary]
  );

  const handleStartWorkout = useCallback(
    async (workoutType: WorkoutType) => {
      await startWorkoutForDate(workoutType.id);
      router.push({
        pathname: "/(add-exercise)",
        params: {
          workoutId: workoutType.id,
          workoutName: workoutType.name,
          workoutColor: workoutType.color,
        },
      });
    },
    [startWorkoutForDate, router]
  );

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.tabIconDefault,
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            bottom: dynamicBottom,
            marginHorizontal: TABBAR_HORIZONTAL_MARGIN,
            width: TABBAR_WIDTH,
            alignSelf: "center",
            elevation: 8,
            backgroundColor: colors.background + "E6",
            borderRadius: TABBAR_BORDER_RADIUS,
            height: TABBAR_HEIGHT,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            paddingBottom: 0,
            paddingTop: 14,
            borderTopWidth: 0,
          },
          tabBarShowLabel: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("home.title", "Início"),
            tabBarIcon: ({ color }) => (
              <View style={styles.iconContainer}>
                <TabBarIcon name="home" color={color} />
              </View>
            ),
          }}
          listeners={{ tabPress: () => safeHaptics.selectionAsync() }}
        />
        <Tabs.Screen
          name="nutrition"
          options={{
            title: t("nutrition.title", "Nutrição"),
            tabBarIcon: ({ color }) => (
              <View style={styles.iconContainer}>
                <TabBarIcon5 name="apple-alt" color={color} />
              </View>
            ),
          }}
          listeners={{ tabPress: () => safeHaptics.selectionAsync() }}
        />
        <Tabs.Screen name="add" options={{ tabBarButton: () => null }} />
        <Tabs.Screen
          name="training"
          options={{
            title: t("training.title", "Treino"),
            tabBarIcon: ({ color }) => (
              <View style={styles.iconContainer}>
                <TabBarIcon5 name="dumbbell" color={color} />
              </View>
            ),
          }}
          listeners={{ tabPress: () => safeHaptics.selectionAsync() }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("profile.title", "Perfil"),
            tabBarIcon: ({ color }) => (
              <View style={styles.iconContainer}>
                <TabBarIcon name="user" color={color} />
              </View>
            ),
          }}
          listeners={{ tabPress: () => safeHaptics.selectionAsync() }}
        />
      </Tabs>

      <FloatingActionButton />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  animatedContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    overflow: "hidden",
  },
  fabTouchable: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  optionsRow: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: "100%",
    paddingHorizontal: 15,
  },
  contentWrapper: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  optionButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    minWidth: 60,
  },
  optionLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: "500",
  },
  mealTypesScrollContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    minWidth: "100%",
    flexGrow: 1,
  },
  workoutTypesScrollContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    minWidth: "100%",
    flexGrow: 1,
  },
  transparentBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
  },
  backdropTouchable: {
    width: "100%",
    height: "100%",
  },
  updateWeightContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 15,
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
    minWidth: 80,
  },
  weightDisplayText: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  weightUnitText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  saveWeightButtonV2: {
    padding: 12,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
});
