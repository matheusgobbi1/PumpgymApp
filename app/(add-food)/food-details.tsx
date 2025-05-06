import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useMeals } from "../../context/MealContext";
import { v4 as uuidv4 } from "uuid";
import { getFoodDetails } from "../../services/food";
import { FoodItem, FoodServing } from "../../types/food";
import Slider from "@react-native-community/slider";
import { useTranslation } from "react-i18next";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useToast } from "../../components/common/ToastContext";

const { width } = Dimensions.get("window");

export default function FoodDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [portion, setPortion] = useState("100");
  const [numberOfPortions, setNumberOfPortions] = useState("1");
  const [isCustomPortion, setIsCustomPortion] = useState(true);
  const { addFoodToMeal, updateFoodInMeal, saveMeals, addToSearchHistory } =
    useMeals();
  const [food, setFood] = useState<FoodItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFromHistory, setIsFromHistory] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

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
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const foodId = params.foodId as string;
  const mealId = params.mealId as string;
  const mealName = params.mealName as string;
  const mode = params.mode as string;
  const mealColor = (params.mealColor as string) || colors.primary;

  const foodName = params.foodName as string;
  const foodCalories = Number(params.calories || 0);
  const foodProtein = Number(params.protein || 0);
  const foodCarbs = Number(params.carbs || 0);
  const foodFat = Number(params.fat || 0);
  const foodFiber = Number(params.fiber || 0);
  const foodPortion = Number(params.portion || 100);
  const foodPortionDescription = params.portionDescription as string;

  useEffect(() => {
    if (params.isFromHistory === "true" && foodPortion) {
      setPortion(foodPortion.toString());
    }
  }, [params.isFromHistory, foodPortion]);

  useEffect(() => {
    if (mode === "edit") {
      setIsEditMode(true);
    }

    if (params.isFromHistory === "true") {
      console.log("Alimento do histórico:", {
        foodPortion,
        foodPortionDescription,
        foodName,
        foodCalories,
      });

      setIsFromHistory(true);

      setPortion(foodPortion.toString());

      if (
        foodPortionDescription &&
        foodPortionDescription !== `${foodPortion}g`
      ) {
        setIsCustomPortion(false);
      }

      const historyFood: FoodItem = {
        food_id: foodId,
        food_name: foodName,
        food_type: "Generic foods",
        food_url: "",
        servings: [
          {
            serving_id: "0",
            serving_description: foodPortionDescription || `${foodPortion}g`,
            metric_serving_amount: foodPortion,
            metric_serving_unit: "g",
            calories: foodCalories,
            protein: foodProtein,
            carbohydrate: foodCarbs,
            fat: foodFat,
            fiber: foodFiber > 0 ? foodFiber : undefined,
          },
        ],
      };

      setFood(historyFood);
    } else {
      loadFoodDetails();
    }
  }, [
    foodId,
    params.isFromHistory,
    isEditMode,
    foodPortion,
    foodPortionDescription,
    foodName,
    foodCalories,
    foodProtein,
    foodCarbs,
    foodFat,
    foodFiber,
  ]);

  const getPreferredServing = (servings: FoodServing[]): FoodServing => {
    if (!servings || servings.length === 0) {
      return {
        serving_id: "default",
        serving_description: "100g",
        metric_serving_amount: 100,
        metric_serving_unit: "g",
        calories: 0,
        protein: 0,
        fat: 0,
        carbohydrate: 0,
      };
    }

    const packageServing = servings.find(
      (serving) =>
        serving.serving_description.toLowerCase().includes("unidade") ||
        serving.serving_description.toLowerCase().includes("pacote") ||
        serving.serving_description.toLowerCase().includes("embalagem") ||
        serving.serving_description.toLowerCase().includes("pote") ||
        serving.serving_description.toLowerCase().includes("garrafa") ||
        serving.serving_description.toLowerCase().includes("lata") ||
        serving.serving_description.toLowerCase().includes("copo") ||
        serving.serving_description.toLowerCase().includes("bar") ||
        serving.serving_description.toLowerCase().includes("piece") ||
        serving.serving_description.toLowerCase().includes("scoop") ||
        serving.serving_description.toLowerCase().includes("fatia") ||
        (serving.serving_description.toLowerCase().includes("g") &&
          !serving.serving_description.toLowerCase().includes("100g"))
    );

    if (packageServing) {
      return packageServing;
    }

    return servings[0];
  };

  const loadFoodDetails = async () => {
    try {
      const response = await getFoodDetails(foodId);
      if (response.items && response.items.length > 0) {
        const foodItem = response.items[0];
        setFood(foodItem);

        if (foodItem.servings && foodItem.servings.length > 0) {
          const preferredServing = getPreferredServing(foodItem.servings);

          const isCommonUnitFood =
            foodItem.food_name.toLowerCase().includes("ovo") ||
            foodItem.food_name.toLowerCase().includes("cookie") ||
            foodItem.food_name.toLowerCase().includes("banana") ||
            foodItem.food_name.toLowerCase().includes("maçã") ||
            foodItem.food_name.toLowerCase().includes("pão") ||
            foodItem.food_name.toLowerCase().includes("pera") ||
            foodItem.food_name.toLowerCase().includes("bolacha") ||
            foodItem.food_name.toLowerCase().includes("unidade");

          if (
            preferredServing.serving_description &&
            (preferredServing.serving_description
              .toLowerCase()
              .includes("unidade") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("pacote") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("embalagem") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("pote") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("garrafa") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("lata") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("copo") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("bar") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("piece") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("scoop") ||
              preferredServing.serving_description
                .toLowerCase()
                .includes("fatia") ||
              isCommonUnitFood ||
              !preferredServing.serving_description.toLowerCase().includes("g"))
          ) {
            if (preferredServing.metric_serving_amount) {
              setPortion(formatNumber(preferredServing.metric_serving_amount));
              setIsCustomPortion(true);
            } else {
              setPortion("100");
              setIsCustomPortion(true);
            }
          } else {
            setPortion("100");
            setIsCustomPortion(true);
          }
        } else {
          setPortion("100");
          setIsCustomPortion(true);
        }
      } else {
        setError(t("nutrition.foodDetails.foodNotFound"));
      }
    } catch (err) {
      setError(t("nutrition.foodDetails.loadError"));
    }
  };

  const formatNumber = (value: number | string): string => {
    const num = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(num)) return "0";

    if (num === Math.floor(num)) {
      return num.toString();
    }

    return num.toFixed(1).replace(/\.0$/, "");
  };

  const handleSliderChange = (value: number) => {
    const roundedValue = Math.round(value);
    setPortion(formatNumber(roundedValue));
    setIsCustomPortion(true);
  };

  const incrementPortions = () => {
    const currentValue = parseFloat(numberOfPortions);
    if (isNaN(currentValue)) {
      setNumberOfPortions("1");
    } else {
      const newValue = Math.round((currentValue + 0.5) * 10) / 10;
      setNumberOfPortions(formatNumber(newValue));
    }
  };

  const decrementPortions = () => {
    const currentValue = parseFloat(numberOfPortions);
    if (isNaN(currentValue) || currentValue <= 0.5) {
      setNumberOfPortions("0.5");
    } else {
      const newValue = Math.round((currentValue - 0.5) * 10) / 10;
      setNumberOfPortions(formatNumber(newValue));
    }
  };

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: 250,
        animated: true,
      });
    }, 100);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  if (error || !food) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.errorText, { color: colors.danger }]}>
          {error || t("nutrition.foodDetails.genericError")}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={loadFoodDetails}
        >
          <Text style={styles.retryButtonText}>
            {t("nutrition.foodDetails.tryAgain")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const calculatedNutrients = (() => {
    if (!food || !food.servings || food.servings.length === 0) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      };
    }

    const selectedServing = food.servings[0];
    const portionsMultiplier = parseFloat(numberOfPortions) || 1;

    const baseAmount = selectedServing.metric_serving_amount || 100;
    const weightMultiplier =
      (Number(portion) / baseAmount) * portionsMultiplier;

    return {
      calories: Math.round(selectedServing.calories * weightMultiplier) || 0,
      protein:
        Math.round(selectedServing.protein * weightMultiplier * 10) / 10 || 0,
      carbs:
        Math.round(selectedServing.carbohydrate * weightMultiplier * 10) / 10 ||
        0,
      fat: Math.round(selectedServing.fat * weightMultiplier * 10) / 10 || 0,
      fiber: selectedServing.fiber
        ? Math.round(selectedServing.fiber * weightMultiplier * 10) / 10
        : 0,
    };
  })();

  const proteinCalories = calculatedNutrients.protein * 4;
  const carbsCalories = calculatedNutrients.carbs * 4;
  const fatCalories = calculatedNutrients.fat * 9;

  const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;

  const proteinPercentage =
    totalMacroCalories > 0
      ? Math.round((proteinCalories / totalMacroCalories) * 100)
      : 0;

  const carbsPercentage =
    totalMacroCalories > 0
      ? Math.round((carbsCalories / totalMacroCalories) * 100)
      : 0;

  const fatPercentage =
    totalMacroCalories > 0
      ? Math.round((fatCalories / totalMacroCalories) * 100)
      : 0;

  let adjustedProteinPercentage = proteinPercentage;
  let adjustedCarbsPercentage = carbsPercentage;
  let adjustedFatPercentage = fatPercentage;

  const sum = proteinPercentage + carbsPercentage + fatPercentage;
  if (sum !== 100 && sum > 0) {
    if (
      proteinPercentage >= carbsPercentage &&
      proteinPercentage >= fatPercentage
    ) {
      adjustedProteinPercentage = 100 - carbsPercentage - fatPercentage;
    } else if (
      carbsPercentage >= proteinPercentage &&
      carbsPercentage >= fatPercentage
    ) {
      adjustedCarbsPercentage = 100 - proteinPercentage - fatPercentage;
    } else {
      adjustedFatPercentage = 100 - proteinPercentage - carbsPercentage;
    }

    adjustedProteinPercentage = Math.max(0, adjustedProteinPercentage);
    adjustedCarbsPercentage = Math.max(0, adjustedCarbsPercentage);
    adjustedFatPercentage = Math.max(0, adjustedFatPercentage);

    const adjustedSum =
      adjustedProteinPercentage +
      adjustedCarbsPercentage +
      adjustedFatPercentage;
    if (adjustedSum !== 100 && adjustedSum > 0) {
      if (
        adjustedProteinPercentage >= adjustedCarbsPercentage &&
        adjustedProteinPercentage >= adjustedFatPercentage
      ) {
        adjustedProteinPercentage =
          100 - adjustedCarbsPercentage - adjustedFatPercentage;
      } else if (
        adjustedCarbsPercentage >= adjustedProteinPercentage &&
        adjustedCarbsPercentage >= adjustedFatPercentage
      ) {
        adjustedCarbsPercentage =
          100 - adjustedProteinPercentage - adjustedFatPercentage;
      } else {
        adjustedFatPercentage =
          100 - adjustedProteinPercentage - adjustedCarbsPercentage;
      }
    }
  }

  const handleAddFood = async () => {
    if (!food && !isFromHistory) return;

    let portionDescription = `${portion}g`;
    const portionsMultiplier = parseFloat(numberOfPortions) || 1;

    const hasSpecialServing =
      food?.servings &&
      food.servings[0]?.serving_description &&
      (food.servings[0].serving_description.toLowerCase().includes("unidade") ||
        food.servings[0].serving_description.toLowerCase().includes("pacote") ||
        food.servings[0].serving_description
          .toLowerCase()
          .includes("embalagem") ||
        food.servings[0].serving_description.toLowerCase().includes("pote") ||
        food.servings[0].serving_description
          .toLowerCase()
          .includes("garrafa") ||
        food.servings[0].serving_description.toLowerCase().includes("lata") ||
        food.servings[0].serving_description.toLowerCase().includes("copo") ||
        food.servings[0].serving_description.toLowerCase().includes("bar") ||
        food.servings[0].serving_description.toLowerCase().includes("piece") ||
        food.servings[0].serving_description.toLowerCase().includes("clara") ||
        !food.servings[0].serving_description.toLowerCase().includes("g"));

    if (hasSpecialServing) {
      if (portionsMultiplier === 1) {
        portionDescription = food.servings[0].serving_description;
      } else {
        if (
          food.servings[0].serving_description.toLowerCase().includes("unidade")
        ) {
          let unitName = "unidade";
          if (food.servings[0].serving_description.includes("unidade de")) {
            unitName = food.servings[0].serving_description;
          }

          portionDescription = `${numberOfPortions} ${unitName}${
            parseFloat(numberOfPortions) > 1 ? "s" : ""
          }`;
        } else {
          portionDescription = `${numberOfPortions}x ${food.servings[0].serving_description}`;
        }
      }
    } else if (portionsMultiplier !== 1) {
      portionDescription = `${numberOfPortions}x ${portion}g`;
    }

    const newFood = {
      id: isEditMode && foodId ? foodId : uuidv4(),
      name: t(`foods.${food?.food_id || foodId}`, {
        defaultValue: food ? food.food_name : foodName,
      }),
      calories: calculatedNutrients.calories,
      protein: calculatedNutrients.protein,
      carbs: calculatedNutrients.carbs,
      fat: calculatedNutrients.fat,
      fiber: calculatedNutrients.fiber,
      portion: hasSpecialServing
        ? Number(food.servings[0].metric_serving_amount || portion) *
          portionsMultiplier
        : Number(portion) * portionsMultiplier,
      portionDescription: portionDescription,
    };

    if (isEditMode && foodId) {
      updateFoodInMeal(mealId, newFood);

      showToast({
        message: t("nutrition.foodDetails.updatedSuccessToast", {
          name: newFood.name,
        }),
        type: "success",
        duration: 3000,
        position: "bottom",
      });
    } else {
      addFoodToMeal(mealId, newFood);

      showToast({
        message: t("nutrition.addFood.addedSuccessToast", {
          name: newFood.name,
        }),
        type: "success",
        duration: 3000,
        position: "bottom",
      });
    }

    await addToSearchHistory(newFood);

    await saveMeals();

    router.back();
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
      edges={isEditMode ? ["top", "bottom"] : ["bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={
          isEditMode
            ? Platform.OS === "ios"
              ? 10
              : 0
            : Platform.OS === "ios"
            ? 70
            : 20
        }
      >
        <View
          style={[
            styles.header,
            { backgroundColor: colors.background },
            isEditMode && { paddingTop: Platform.OS === "ios" ? 0 : 16 },
          ]}
        >
          <TouchableOpacity
            key={`back-button-${theme}`}
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.card }]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t(`nutrition.mealTypes.${mealId}`, { defaultValue: mealName })}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollViewContent,
            isEditMode && styles.scrollViewContentEdit,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {food ? (
            <View
              key={`food-details-${food.food_id}-${theme}`}
              style={styles.foodInfo}
            >
              <View
                style={[
                  styles.foodNameWrapper,
                  {
                    backgroundColor: mealColor + "08",
                    alignSelf: "center",
                  },
                ]}
              >
                <Text style={[styles.foodName, { color: colors.text }]}>
                  {t(`foods.${food.food_id || foodId}`, {
                    defaultValue: food.food_name,
                  })}
                </Text>
              </View>

              <View
                style={[styles.unifiedCard, { backgroundColor: colors.card }]}
              >
                <View style={styles.mainInfoSection}>
                  <View style={styles.caloriesContainer}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: mealColor + "15" },
                      ]}
                    >
                      <Ionicons name="flame" size={26} color={mealColor} />
                    </View>
                    <Text style={[styles.caloriesValue, { color: mealColor }]}>
                      {formatNumber(calculatedNutrients.calories)}
                    </Text>
                    <Text
                      style={[
                        styles.caloriesUnit,
                        { color: colors.text + "80" },
                      ]}
                    >
                      kcal
                    </Text>
                  </View>

                  <View style={styles.macrosGrid}>
                    <View style={styles.macroItem}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: "#FF6B6B15" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="food-steak"
                          size={18}
                          color="#FF6B6B"
                        />
                      </View>
                      <View>
                        <Text
                          style={[styles.macroName, { color: colors.text }]}
                        >
                          {t("common.nutrition.protein")}
                        </Text>
                        <Text style={[styles.macroValue, { color: "#FF6B6B" }]}>
                          {formatNumber(calculatedNutrients.protein)}g
                        </Text>
                      </View>
                    </View>

                    <View style={styles.macroItem}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: "#4ECDC415" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="baguette"
                          size={18}
                          color="#4ECDC4"
                        />
                      </View>
                      <View>
                        <Text
                          style={[styles.macroName, { color: colors.text }]}
                        >
                          {t("common.nutrition.carbs")}
                        </Text>
                        <Text style={[styles.macroValue, { color: "#4ECDC4" }]}>
                          {formatNumber(calculatedNutrients.carbs)}g
                        </Text>
                      </View>
                    </View>

                    <View style={styles.macroItem}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: "#FFD93D15" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="oil"
                          size={18}
                          color="#FFD93D"
                        />
                      </View>
                      <View>
                        <Text
                          style={[styles.macroName, { color: colors.text }]}
                        >
                          {t("common.nutrition.fat")}
                        </Text>
                        <Text style={[styles.macroValue, { color: "#FFD93D" }]}>
                          {formatNumber(calculatedNutrients.fat)}g
                        </Text>
                      </View>
                    </View>

                    {food.servings[0].fiber ? (
                      <View style={styles.macroItem}>
                        <View
                          style={[
                            styles.iconContainer,
                            { backgroundColor: "#A0D99515" },
                          ]}
                        >
                          <Ionicons name="cellular" size={18} color="#A0D995" />
                        </View>
                        <View>
                          <Text
                            style={[styles.macroName, { color: colors.text }]}
                          >
                            {t("nutrition.foodDetails.fiber")}
                          </Text>
                          <Text
                            style={[styles.macroValue, { color: "#A0D995" }]}
                          >
                            {formatNumber(calculatedNutrients.fiber)}g
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.macroItem}></View>
                    )}
                  </View>
                </View>

                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />

                <View style={styles.controlsSection}>
                  <View style={styles.quantityControls}>
                    <View style={styles.portionControl}>
                      <Text
                        style={[styles.controlLabel, { color: colors.text }]}
                      >
                        Porções
                      </Text>
                      <View style={styles.portionCounter}>
                        <TouchableOpacity
                          style={[
                            styles.counterButton,
                            {
                              backgroundColor: mealColor + "15",
                              borderWidth: 1,
                              borderColor: mealColor + "30",
                            },
                          ]}
                          onPress={decrementPortions}
                        >
                          <Ionicons name="remove" size={18} color={mealColor} />
                        </TouchableOpacity>

                        <TextInput
                          style={[
                            styles.portionCounterInput,
                            { color: colors.text },
                          ]}
                          value={numberOfPortions}
                          onChangeText={(text) => {
                            const sanitizedText = text.replace(",", ".");

                            if (sanitizedText === "") {
                              setNumberOfPortions("");
                              return;
                            }

                            if (!/^[0-9]*\.?[0-9]*$/.test(sanitizedText)) {
                              return;
                            }

                            const numValue = parseFloat(sanitizedText);
                            if (!isNaN(numValue) && numValue <= 99) {
                              setNumberOfPortions(sanitizedText);
                            }
                          }}
                          onFocus={handleInputFocus}
                          onBlur={() => {
                            if (numberOfPortions === "") {
                              setNumberOfPortions("1");
                            } else {
                              const numValue = parseFloat(numberOfPortions);
                              const validValue = isNaN(numValue)
                                ? 1
                                : Math.max(0.5, numValue);
                              setNumberOfPortions(formatNumber(validValue));
                            }
                          }}
                          keyboardType="numeric"
                          maxLength={4}
                        />

                        <TouchableOpacity
                          style={[
                            styles.counterButton,
                            {
                              backgroundColor: mealColor + "15",
                              borderWidth: 1,
                              borderColor: mealColor + "30",
                            },
                          ]}
                          onPress={incrementPortions}
                        >
                          <Ionicons name="add" size={18} color={mealColor} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.weightControl}>
                      <Text
                        style={[styles.controlLabel, { color: colors.text }]}
                      >
                        Peso (g)
                      </Text>
                      <View style={styles.weightInputContainer}>
                        <TextInput
                          style={[styles.weightInput, { color: colors.text }]}
                          value={portion}
                          onChangeText={(text) => {
                            const sanitizedText = text.replace(",", ".");

                            if (sanitizedText === "") {
                              setPortion("");
                              return;
                            }

                            if (!/^[0-9]*\.?[0-9]*$/.test(sanitizedText)) {
                              return;
                            }

                            const numValue = parseFloat(sanitizedText);
                            if (!isNaN(numValue) && numValue <= 1000) {
                              setPortion(sanitizedText);
                            }

                            setIsCustomPortion(true);
                          }}
                          onFocus={handleInputFocus}
                          onBlur={() => {
                            if (portion === "") {
                              setPortion("0");
                            } else {
                              setPortion(formatNumber(portion));
                            }
                          }}
                          keyboardType="numeric"
                          maxLength={5}
                        />
                        <Text
                          style={[styles.weightUnit, { color: colors.text }]}
                        >
                          g
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.sliderContainer}>
                    <Slider
                      style={styles.slider}
                      minimumValue={1}
                      maximumValue={1000}
                      step={5}
                      value={Math.min(Math.max(Number(portion), 1), 1000)}
                      onValueChange={handleSliderChange}
                      minimumTrackTintColor={mealColor}
                      maximumTrackTintColor={colors.border + "60"}
                      thumbTintColor={mealColor}
                    />
                    <View style={styles.sliderLabelsContainer}>
                      <Text
                        style={[
                          styles.sliderLabel,
                          { color: colors.text + "80" },
                        ]}
                      >
                        1g
                      </Text>
                      <Text
                        style={[
                          styles.sliderLabel,
                          { color: colors.text + "80" },
                        ]}
                      >
                        1000g
                      </Text>
                    </View>
                  </View>

                  {food.servings[0].serving_description && (
                    <Text
                      style={[styles.helperText, { color: colors.text + "80" }]}
                    >
                      {food.servings[0].serving_description
                        .toLowerCase()
                        .includes("bar") ||
                      food.servings[0].serving_description
                        .toLowerCase()
                        .includes("piece") ||
                      food.servings[0].serving_description
                        .toLowerCase()
                        .includes("unit") ||
                      food.servings[0].serving_description
                        .toLowerCase()
                        .includes("unidade") ||
                      food.servings[0].serving_description
                        .toLowerCase()
                        .includes("pacote") ||
                      food.servings[0].serving_description
                        .toLowerCase()
                        .includes("embalagem") ||
                      food.servings[0].serving_description
                        .toLowerCase()
                        .includes("pote") ||
                      food.servings[0].serving_description
                        .toLowerCase()
                        .includes("garrafa") ||
                      food.servings[0].serving_description
                        .toLowerCase()
                        .includes("lata") ||
                      food.servings[0].serving_description
                        .toLowerCase()
                        .includes("copo")
                        ? `${numberOfPortions}x ${food.servings[0].serving_description}`
                        : `Total: ${formatNumber(
                            Number(portion) *
                              parseFloat(numberOfPortions || "0")
                          )}g`}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ) : null}
        </ScrollView>

        {food && (
          <View
            style={[
              styles.bottomContainer,
              {
                position: "relative",
                zIndex: 100,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: mealColor }]}
              onPress={handleAddFood}
            >
              <Text style={styles.addButtonText}>
                {isEditMode
                  ? t("nutrition.foodDetails.updateMeal")
                  : t("nutrition.foodDetails.addToMeal")}
              </Text>
              <Ionicons
                name={isEditMode ? "checkmark-circle" : "add-circle"}
                size={20}
                color="#FFF"
                style={styles.addButtonIcon}
              />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  scrollViewContentEdit: {
    paddingBottom: 80,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  foodInfo: {
    padding: 8,
  },
  foodNameWrapper: {
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  foodName: {
    fontSize: 22,
    fontFamily: "Anton-Regular",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  unifiedCard: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  mainInfoSection: {
    padding: 20,
  },
  caloriesContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  caloriesValue: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  caloriesUnit: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  macrosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  macroItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 15,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  macroName: {
    fontSize: 14,
    fontWeight: "600",
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    width: "100%",
  },
  controlsSection: {
    padding: 20,
  },
  quantityControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  portionControl: {
    width: "48%",
  },
  weightControl: {
    width: "48%",
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  portionCounter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  portionCounterInput: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    width: 50,
  },
  weightInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  weightInput: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    width: 70,
  },
  weightUnit: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 4,
  },
  sliderContainer: {
    marginBottom: 10,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  helperText: {
    fontSize: 13,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  bottomContainer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 16 : 24,
  },
  addButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  addButtonIcon: {
    marginLeft: 8,
  },
  recentFoodMeta: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
});