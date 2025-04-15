import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";
import { MotiView } from "moti";
import { BlurView } from "expo-blur";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { FoodSuggestion } from "../../data/foodSuggestionDatabase";
import Colors from "../../constants/Colors";
import { useTranslation } from "react-i18next";

interface FoodAlternativesModalProps {
  visible: boolean;
  food: FoodSuggestion;
  alternatives: FoodSuggestion[];
  mealColor: string;
  theme: "light" | "dark";
  onClose: () => void;
  onReplaceFood: (oldFoodId: string, newFood: FoodSuggestion) => void;
  getFoodIcon?: (food: FoodSuggestion) => React.ReactNode;
  selectedPortion?: number;
  matchCalories?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function FoodAlternativesModal({
  visible,
  food,
  alternatives,
  mealColor,
  theme,
  onClose,
  onReplaceFood,
  getFoodIcon,
  selectedPortion = 100,
  matchCalories = false,
}: FoodAlternativesModalProps) {
  const colors = Colors[theme];
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setLoading(false);
    }
  }, [visible]);

  // Formatar números para exibição
  const formatNumber = (value: number, isCalorie = false) => {
    if (isCalorie) {
      // Para calorias, sem casas decimais
      return Math.round(value);
    } else {
      // Para macros, uma casa decimal
      return Math.round(value * 10) / 10;
    }
  };

  // Calcular nutrientes ajustados para a porção selecionada pelo usuário
  const calculateNutrientsForPortion = (
    foodItem: FoodSuggestion,
    portion: number
  ) => {
    // Usar a porção recebida em vez da porção padrão do alimento
    const ratio = portion / 100;

    return {
      calories: Math.round(foodItem.nutrients.calories * ratio),
      protein: Math.round(foodItem.nutrients.protein * ratio * 10) / 10,
      carbs: Math.round(foodItem.nutrients.carbs * ratio * 10) / 10,
      fat: Math.round(foodItem.nutrients.fat * ratio * 10) / 10,
    };
  };

  // Calcular calorías do alimento original com a porção selecionada
  const originalFoodCalories = useMemo(() => {
    return Math.round((food.nutrients.calories * selectedPortion) / 100);
  }, [food, selectedPortion]);

  // Calcular porções equivalentes em calorias para as alternativas
  const alternativesWithCalorieMatchedPortions = useMemo(() => {
    if (!matchCalories) {
      // Se não precisar igualar calorias, usar a porção original para todos
      return alternatives.map((item) => ({
        ...item,
        matchedPortion: selectedPortion,
      }));
    }

    return alternatives.map((item) => {
      // Calcular qual porção da alternativa fornece as mesmas calorias
      const caloriePer100g = item.nutrients.calories;

      // Evitar divisão por zero
      if (caloriePer100g <= 0) {
        return { ...item, matchedPortion: selectedPortion };
      }

      // Calcular a porção com base nas calorias do alimento original
      let matchedPortion = (originalFoodCalories * 100) / caloriePer100g;

      // Limitar para valores razoáveis (entre 10g e 500g)
      matchedPortion = Math.max(10, Math.min(500, matchedPortion));

      // Arredondar para facilitar a visualização
      if (matchedPortion < 10) {
        matchedPortion = Math.round(matchedPortion * 2) / 2; // Arredondar para 0.5g
      } else if (matchedPortion < 50) {
        matchedPortion = Math.round(matchedPortion); // Arredondar para 1g
      } else {
        matchedPortion = Math.round(matchedPortion / 5) * 5; // Arredondar para 5g
      }

      return {
        ...item,
        matchedPortion,
      };
    });
  }, [alternatives, originalFoodCalories, selectedPortion, matchCalories]);

  // Renderização do ícone padrão se não for fornecido
  const renderFoodIcon = (foodItem: FoodSuggestion) => {
    if (getFoodIcon) {
      return getFoodIcon(foodItem);
    }
    return (
      <MaterialCommunityIcons name="food-variant" size={20} color={mealColor} />
    );
  };

  const handleReplace = (
    alternativeFood: FoodSuggestion,
    matchedPortion: number
  ) => {
    // Criar uma cópia do alimento alternativo com a porção ajustada
    const alternativeFoodWithPortion = {
      ...alternativeFood,
      // Adicionar a informação da porção calculada para manter as mesmas calorias
      selectedPortion: matchedPortion,
    };

    // Passar o alimento com a porção
    onReplaceFood(food.id, alternativeFoodWithPortion);
    onClose();
  };

  // Renderização de cada item da lista de alternativas
  const renderAlternativeItem = ({
    item,
    index,
  }: {
    item: FoodSuggestion;
    index: number;
  }) => {
    const alternativeWithPortion =
      alternativesWithCalorieMatchedPortions[index];
    const matchedPortion = alternativeWithPortion.matchedPortion;
    const nutrients = calculateNutrientsForPortion(item, matchedPortion);

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.alternativeItemModal,
          { borderColor: colors.border + "30" },
        ]}
        onPress={() => handleReplace(item, matchedPortion)}
        activeOpacity={0.7}
      >
        <View style={styles.alternativeItemContent}>
          <View
            style={[
              styles.alternativeIconModal,
              { backgroundColor: mealColor + "15" },
            ]}
          >
            {renderFoodIcon(item)}
          </View>
          <View style={styles.alternativeTextContent}>
            <Text
              style={[styles.alternativeNameModal, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text
              style={[styles.alternativeInfoModal, { color: colors.secondary }]}
              numberOfLines={1}
            >
              {`${formatNumber(nutrients.calories, true)} ${t(
                "nutrition.units.kcal"
              )} · ${formatNumber(nutrients.protein)}${t(
                "nutrition.macros.protein_short"
              )} · ${formatNumber(nutrients.carbs)}${t(
                "nutrition.macros.carbs_short"
              )} · ${formatNumber(nutrients.fat)}${t(
                "nutrition.macros.fat_short"
              )} · ${matchedPortion}g`}
            </Text>
          </View>
        </View>
        <View style={styles.swapIconContainer}>
          <MaterialCommunityIcons
            name="swap-horizontal"
            size={20}
            color={mealColor}
          />
        </View>
      </TouchableOpacity>
    );
  };

  // Renderização do estado vazio (quando não há alternativas)
  const renderEmptyList = () => (
    <View style={styles.emptyAlternatives}>
      <MaterialCommunityIcons
        name="food-off"
        size={40}
        color={colors.secondary + "60"}
      />
      <Text style={[styles.emptyAlternativesText, { color: colors.secondary }]}>
        {t(
          "nutrition.foodSuggestion.noAlternatives",
          "Não há alternativas disponíveis para este alimento"
        )}
      </Text>
    </View>
  );

  // Calcula nutrientes para o alimento atual com a porção selecionada
  const currentFoodNutrients = calculateNutrientsForPortion(
    food,
    selectedPortion
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onClose}
      >
        <BlurView
          intensity={20}
          style={StyleSheet.absoluteFill}
          tint={theme === "dark" ? "dark" : "light"}
        />
      </TouchableOpacity>

      <View style={styles.modalContainer}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 300 }}
          style={[
            styles.modalContent,
            {
              backgroundColor: theme === "dark" ? colors.light : "#FFFFFF",
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.modalContentInner}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t(
                    "nutrition.foodSuggestion.alternatives",
                    "Alternativas similares"
                  )}
                </Text>
                <Text
                  style={[styles.modalSubtitle, { color: colors.secondary }]}
                >
                  {t(
                    "nutrition.foodSuggestion.alternativesDescription",
                    "Encontre opções para substituir"
                  )}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={onClose}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.currentFoodContainer}>
              <View
                style={[
                  styles.currentFoodIcon,
                  { backgroundColor: mealColor + "20" },
                ]}
              >
                {renderFoodIcon(food)}
              </View>
              <View style={styles.currentFoodInfo}>
                <Text style={[styles.currentFoodName, { color: colors.text }]}>
                  {food.name}
                </Text>
                <Text
                  style={[
                    styles.currentFoodMacros,
                    { color: colors.secondary },
                  ]}
                  numberOfLines={1}
                >
                  {`${formatNumber(currentFoodNutrients.calories, true)} ${t(
                    "nutrition.units.kcal"
                  )} · ${formatNumber(currentFoodNutrients.protein)}${t(
                    "nutrition.macros.protein_short"
                  )} · ${formatNumber(currentFoodNutrients.carbs)}${t(
                    "nutrition.macros.carbs_short"
                  )} · ${formatNumber(currentFoodNutrients.fat)}${t(
                    "nutrition.macros.fat_short"
                  )} · ${selectedPortion}g`}
                </Text>
              </View>
            </View>

            <View style={styles.alternativesListContainer}>
              <FlatList
                data={alternatives}
                renderItem={renderAlternativeItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={renderEmptyList}
                showsVerticalScrollIndicator={true}
                bounces={true}
                overScrollMode="always"
                contentContainerStyle={
                  alternatives.length === 0
                    ? styles.emptyListContent
                    : styles.flatListContent
                }
              />
            </View>

            <TouchableOpacity
              style={[
                styles.closeModalFullButton,
                { backgroundColor: colors.text + "10" },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.closeModalButtonText, { color: colors.text }]}
              >
                {t("common.cancel", "Cancelar")}
              </Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxHeight: SCREEN_HEIGHT * 0.55,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  modalContentInner: {
    padding: 16,
    flexDirection: "column",
    height: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeModalButton: {
    padding: 4,
  },
  currentFoodContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
    marginBottom: 12,
  },
  currentFoodIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  currentFoodInfo: {
    flex: 1,
  },
  currentFoodName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 1,
  },
  currentFoodMacros: {
    fontSize: 12,
    lineHeight: 16,
  },
  alternativesListContainer: {
    flex: 1,
    marginBottom: 12,
  },
  flatListContent: {
    paddingBottom: 4,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  alternativeItemModal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  alternativeItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  alternativeIconModal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  alternativeTextContent: {
    flex: 1,
  },
  alternativeNameModal: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 1,
  },
  alternativeInfoModal: {
    fontSize: 11,
    lineHeight: 15,
  },
  swapIconContainer: {
    padding: 4,
  },
  emptyAlternatives: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  emptyAlternativesText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 16,
  },
  closeModalFullButton: {
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
  closeModalButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
