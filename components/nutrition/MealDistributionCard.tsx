import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { MealType } from "../../context/MealContext";
import { useTranslation } from "react-i18next";
import { MotiView } from "moti";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

// Define as constantes de cores de macros para reutilização
const MACRO_COLORS = {
  PROTEIN: "#EF476F",
  CARBS: "#118AB2",
  FAT: "#FFD166",
  CALORIES: "#FF1F02",
};

interface MacroPercentages {
  protein: number;
  carbs: number;
  fat: number;
}

interface MealDistributionCardProps {
  meal: MealType;
  percentage: number;
  onPercentageChange: (mealId: string, value: string) => void;
  macroPercentages?: MacroPercentages;
  onMacroPercentagesChange?: (mealId: string, macros: MacroPercentages) => void;
  themeColors: {
    text: string;
    border: string;
    card: string;
    primary: string;
  };
  index?: number;
}

const MealDistributionCard: React.FC<MealDistributionCardProps> = ({
  meal,
  percentage,
  onPercentageChange,
  macroPercentages = { protein: 30, carbs: 40, fat: 30 },
  onMacroPercentagesChange,
  themeColors,
  index = 0,
}) => {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState(percentage.toString());

  // Estados para os macronutrientes
  const [proteinValue, setProteinValue] = useState(
    macroPercentages.protein.toString()
  );
  const [carbsValue, setCarbsValue] = useState(
    macroPercentages.carbs.toString()
  );
  const [fatValue, setFatValue] = useState(macroPercentages.fat.toString());
  const [macroFocused, setMacroFocused] = useState<string | null>(null);

  // Calcular o total dos macros
  const macroTotal = useMemo(() => {
    const protein = parseInt(proteinValue) || 0;
    const carbs = parseInt(carbsValue) || 0;
    const fat = parseInt(fatValue) || 0;
    return protein + carbs + fat;
  }, [proteinValue, carbsValue, fatValue]);

  // Verificar se o total está correto
  const isMacroTotalValid = macroTotal === 100;

  // Função para alternar o estado de expansão
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Obter ícone com base no tipo de refeição
  const getMealIcon = () => {
    switch (meal.id) {
      case "breakfast":
        return (
          <MaterialCommunityIcons
            name="food-croissant"
            size={20}
            color={meal.color || themeColors.primary}
          />
        );
      case "morning_snack":
        return (
          <MaterialCommunityIcons
            name="food-apple"
            size={20}
            color={meal.color || themeColors.primary}
          />
        );
      case "lunch":
        return (
          <MaterialCommunityIcons
            name="food"
            size={20}
            color={meal.color || themeColors.primary}
          />
        );
      case "afternoon_snack":
        return (
          <MaterialCommunityIcons
            name="food-apple-outline"
            size={20}
            color={meal.color || themeColors.primary}
          />
        );
      case "dinner":
        return (
          <MaterialCommunityIcons
            name="food-variant"
            size={20}
            color={meal.color || themeColors.primary}
          />
        );
      case "supper":
        return (
          <MaterialCommunityIcons
            name="glass-mug"
            size={20}
            color={meal.color || themeColors.primary}
          />
        );
      default:
        return (
          <MaterialCommunityIcons
            name="food-fork-drink"
            size={20}
            color={meal.color || themeColors.primary}
          />
        );
    }
  };

  // Incrementar a porcentagem
  const incrementPercentage = () => {
    if (percentage < 100) {
      const newValue = (percentage + 1).toString();
      onPercentageChange(meal.id, newValue);
      setInputValue(newValue);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Decrementar a porcentagem
  const decrementPercentage = () => {
    if (percentage > 0) {
      const newValue = (percentage - 1).toString();
      onPercentageChange(meal.id, newValue);
      setInputValue(newValue);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Lidar com a mudança de texto no input
  const handleTextChange = (value: string) => {
    setInputValue(value);

    // Permitir campo vazio temporariamente sem atualizar o valor principal
    if (value === "") {
      return;
    }

    // Atualizar o valor principal quando o valor for válido
    onPercentageChange(meal.id, value);
  };

  // Lidar com o término da edição
  const handleEndEditing = () => {
    // Se o campo estiver vazio, definir como 0
    if (inputValue === "") {
      const defaultValue = "0";
      setInputValue(defaultValue);
      onPercentageChange(meal.id, defaultValue);
    }
  };

  // Funções para lidar com alterações de macronutrientes
  const handleMacroChange = (
    type: "protein" | "carbs" | "fat",
    value: string
  ) => {
    let parsedValue = parseInt(value.replace(/[^0-9]/g, "") || "0");

    // Caso o usuário digite um valor inválido
    if (isNaN(parsedValue)) {
      parsedValue = 0;
    }

    // Limitar o valor a 100%
    parsedValue = Math.min(100, parsedValue);

    const newValue = parsedValue.toString();

    // Atualizar o estado local
    if (type === "protein") {
      setProteinValue(newValue);
    } else if (type === "carbs") {
      setCarbsValue(newValue);
    } else if (type === "fat") {
      setFatValue(newValue);
    }
  };

  // Função para lidar com o término da edição
  const handleMacroEndEditing = (type: "protein" | "carbs" | "fat") => {
    setMacroFocused(null);

    // Verificar valores vazios
    if (type === "protein" && proteinValue === "") {
      setProteinValue("0");
    } else if (type === "carbs" && carbsValue === "") {
      setCarbsValue("0");
    } else if (type === "fat" && fatValue === "") {
      setFatValue("0");
    }

    // Obter valores numéricos atuais
    const protein = parseInt(proteinValue) || 0;
    const carbs = parseInt(carbsValue) || 0;
    const fat = parseInt(fatValue) || 0;

    // Só notificar o componente pai se o total for 100%
    if (protein + carbs + fat === 100 && onMacroPercentagesChange) {
      onMacroPercentagesChange(meal.id, { protein, carbs, fat });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Alternar macronutriente para valor predefinido
  const toggleMacroPreset = (
    type: "balanced" | "highProtein" | "lowCarb" | "highCarb"
  ) => {
    let newMacros: MacroPercentages;

    switch (type) {
      case "balanced":
        newMacros = { protein: 30, carbs: 40, fat: 30 };
        break;
      case "highProtein":
        newMacros = { protein: 40, carbs: 30, fat: 30 };
        break;
      case "lowCarb":
        newMacros = { protein: 35, carbs: 25, fat: 40 };
        break;
      case "highCarb":
        newMacros = { protein: 20, carbs: 55, fat: 25 };
        break;
      default:
        newMacros = { protein: 30, carbs: 40, fat: 30 };
    }

    // Atualizar estados locais
    setProteinValue(newMacros.protein.toString());
    setCarbsValue(newMacros.carbs.toString());
    setFatValue(newMacros.fat.toString());

    // Notificar o componente pai
    if (onMacroPercentagesChange) {
      onMacroPercentagesChange(meal.id, newMacros);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 50, type: "timing", duration: 300 }}
      style={styles.cardContainer}
    >
      <View
        style={[
          styles.mealRow,
          {
            backgroundColor: themeColors.card,
            borderColor: isFocused
              ? meal.color || themeColors.primary
              : themeColors.border,
            borderWidth: isFocused ? 1.5 : 1,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.headerContainer}
          activeOpacity={0.7}
          onPress={toggleExpand}
        >
          <View style={styles.mealInfo}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: (meal.color || themeColors.primary) + "20" },
              ]}
            >
              {getMealIcon()}
            </View>
            <View style={styles.titleContainer}>
              <Text style={[styles.mealName, { color: themeColors.text }]}>
                {t(`nutrition.mealTypes.${meal.id}`, meal.name)}
              </Text>
              <Text
                style={[
                  styles.percentageLabel,
                  { color: meal.color || themeColors.primary },
                ]}
              >
                {percentage}%
              </Text>
            </View>
          </View>

          {/* Botão de expansão */}
          <TouchableOpacity
            style={[
              styles.expandButton,
              {
                backgroundColor: (meal.color || themeColors.primary) + "15",
                borderWidth: 1,
                borderColor: (meal.color || themeColors.primary) + "30",
              },
            ]}
            onPress={toggleExpand}
          >
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={meal.color || themeColors.primary}
            />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Conteúdo expansível */}
        {isExpanded && (
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ type: "timing", duration: 200 }}
            style={styles.expandedContent}
          >
            {/* Distribuição calórica */}
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              {t("nutrition.mealDistribution.calories", "Calorias")}
            </Text>
            <View style={styles.portionCounter}>
              <TouchableOpacity
                style={[
                  styles.counterButton,
                  {
                    backgroundColor: (meal.color || themeColors.primary) + "15",
                    borderWidth: 1,
                    borderColor: (meal.color || themeColors.primary) + "30",
                  },
                ]}
                onPress={decrementPercentage}
              >
                <Ionicons
                  name="remove"
                  size={16}
                  color={meal.color || themeColors.primary}
                />
              </TouchableOpacity>

              <View
                style={[
                  styles.percentageInputContainer,
                  {
                    backgroundColor: themeColors.text + "08",
                    borderWidth: 1,
                    borderColor: isFocused
                      ? meal.color || themeColors.primary
                      : themeColors.border,
                  },
                ]}
              >
                <TextInput
                  style={[styles.percentageInput, { color: themeColors.text }]}
                  value={inputValue}
                  onChangeText={handleTextChange}
                  onEndEditing={handleEndEditing}
                  keyboardType="number-pad"
                  maxLength={3}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
                <Text
                  style={[styles.percentageUnit, { color: themeColors.text }]}
                >
                  %
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.counterButton,
                  {
                    backgroundColor: (meal.color || themeColors.primary) + "15",
                    borderWidth: 1,
                    borderColor: (meal.color || themeColors.primary) + "30",
                  },
                ]}
                onPress={incrementPercentage}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color={meal.color || themeColors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Separador */}
            <View
              style={[
                styles.separator,
                { backgroundColor: themeColors.border + "50" },
              ]}
            />

            {/* Distribuição de macronutrientes */}
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              {t("nutrition.mealDistribution.macros", "Macronutrientes")}
            </Text>

            {/* Presets de macros */}
            <View style={styles.presetContainer}>
              <TouchableOpacity
                style={[
                  styles.presetButton,
                  {
                    backgroundColor: themeColors.text + "08",
                    borderWidth: 1,
                    borderColor: themeColors.border,
                  },
                ]}
                onPress={() => toggleMacroPreset("balanced")}
              >
                <Text style={[styles.presetText, { color: themeColors.text }]}>
                  {t("nutrition.common.macros.balanced", "Equilibrado")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.presetButton,
                  {
                    backgroundColor: themeColors.text + "08",
                    borderWidth: 1,
                    borderColor: themeColors.border,
                  },
                ]}
                onPress={() => toggleMacroPreset("highProtein")}
              >
                <Text style={[styles.presetText, { color: themeColors.text }]}>
                  {t("nutrition.common.macros.highProtein", "Alto Proteína")}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.presetContainer}>
              <TouchableOpacity
                style={[
                  styles.presetButton,
                  {
                    backgroundColor: themeColors.text + "08",
                    borderWidth: 1,
                    borderColor: themeColors.border,
                  },
                ]}
                onPress={() => toggleMacroPreset("lowCarb")}
              >
                <Text style={[styles.presetText, { color: themeColors.text }]}>
                  {t("nutrition.common.macros.lowCarb", "Baixo Carbo")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.presetButton,
                  {
                    backgroundColor: themeColors.text + "08",
                    borderWidth: 1,
                    borderColor: themeColors.border,
                  },
                ]}
                onPress={() => toggleMacroPreset("highCarb")}
              >
                <Text style={[styles.presetText, { color: themeColors.text }]}>
                  {t("nutrition.common.macros.highCarb", "Alto Carbo")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Inputs de macros */}
            <View style={styles.macroContainer}>
              {/* Total dos macros */}
              <View style={styles.macroTotalContainer}>
                <Text
                  style={[styles.macroTotalLabel, { color: themeColors.text }]}
                >
                  {t("nutrition.mealDistribution.total", "Total")}:
                </Text>
                <Text
                  style={[
                    styles.macroTotalValue,
                    {
                      color: isMacroTotalValid
                        ? themeColors.primary
                        : MACRO_COLORS.CALORIES,
                    },
                  ]}
                >
                  {macroTotal}%
                  {!isMacroTotalValid && (
                    <Text style={styles.macroTotalHint}>
                      {" "}
                      (
                      {macroTotal < 100
                        ? t("nutrition.mealDistribution.remaining", "Faltam") +
                          ` ${100 - macroTotal}%`
                        : t("nutrition.mealDistribution.excess", "Excesso de") +
                          ` ${macroTotal - 100}%`}
                      )
                    </Text>
                  )}
                </Text>
              </View>

              <View style={styles.macroRow}>
                <View style={styles.macroLabelContainer}>
                  <View
                    style={[
                      styles.macroIconContainer,
                      {
                        backgroundColor: MACRO_COLORS.PROTEIN + "20",
                        borderColor: MACRO_COLORS.PROTEIN + "30",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="food-steak"
                      size={16}
                      color={MACRO_COLORS.PROTEIN}
                    />
                  </View>
                  <Text
                    style={[styles.macroLabel, { color: themeColors.text }]}
                  >
                    {t("common.nutrition.protein")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.macroInputContainer,
                    {
                      backgroundColor: themeColors.text + "08",
                      borderWidth: 1,
                      borderColor:
                        macroFocused === "protein"
                          ? MACRO_COLORS.PROTEIN
                          : themeColors.border,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.macroInput, { color: themeColors.text }]}
                    value={proteinValue}
                    onChangeText={(val) => handleMacroChange("protein", val)}
                    onEndEditing={() => handleMacroEndEditing("protein")}
                    keyboardType="number-pad"
                    maxLength={3}
                    onFocus={() => setMacroFocused("protein")}
                    onBlur={() => setMacroFocused(null)}
                  />
                  <Text
                    style={[styles.percentageUnit, { color: themeColors.text }]}
                  >
                    %
                  </Text>
                </View>
              </View>

              <View style={styles.macroRow}>
                <View style={styles.macroLabelContainer}>
                  <View
                    style={[
                      styles.macroIconContainer,
                      {
                        backgroundColor: MACRO_COLORS.CARBS + "20",
                        borderColor: MACRO_COLORS.CARBS + "30",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="bread-slice"
                      size={16}
                      color={MACRO_COLORS.CARBS}
                    />
                  </View>
                  <Text
                    style={[styles.macroLabel, { color: themeColors.text }]}
                  >
                    {t("common.nutrition.carbs")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.macroInputContainer,
                    {
                      backgroundColor: themeColors.text + "08",
                      borderWidth: 1,
                      borderColor:
                        macroFocused === "carbs"
                          ? MACRO_COLORS.CARBS
                          : themeColors.border,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.macroInput, { color: themeColors.text }]}
                    value={carbsValue}
                    onChangeText={(val) => handleMacroChange("carbs", val)}
                    onEndEditing={() => handleMacroEndEditing("carbs")}
                    keyboardType="number-pad"
                    maxLength={3}
                    onFocus={() => setMacroFocused("carbs")}
                    onBlur={() => setMacroFocused(null)}
                  />
                  <Text
                    style={[styles.percentageUnit, { color: themeColors.text }]}
                  >
                    %
                  </Text>
                </View>
              </View>

              <View style={styles.macroRow}>
                <View style={styles.macroLabelContainer}>
                  <View
                    style={[
                      styles.macroIconContainer,
                      {
                        backgroundColor: MACRO_COLORS.FAT + "20",
                        borderColor: MACRO_COLORS.FAT + "30",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="oil"
                      size={16}
                      color={MACRO_COLORS.FAT}
                    />
                  </View>
                  <Text
                    style={[styles.macroLabel, { color: themeColors.text }]}
                  >
                    {t("common.nutrition.fat")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.macroInputContainer,
                    {
                      backgroundColor: themeColors.text + "08",
                      borderWidth: 1,
                      borderColor:
                        macroFocused === "fat"
                          ? MACRO_COLORS.FAT
                          : themeColors.border,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.macroInput, { color: themeColors.text }]}
                    value={fatValue}
                    onChangeText={(val) => handleMacroChange("fat", val)}
                    onEndEditing={() => handleMacroEndEditing("fat")}
                    keyboardType="number-pad"
                    maxLength={3}
                    onFocus={() => setMacroFocused("fat")}
                    onBlur={() => setMacroFocused(null)}
                  />
                  <Text
                    style={[styles.percentageUnit, { color: themeColors.text }]}
                  >
                    %
                  </Text>
                </View>
              </View>

              {/* Mensagem de validação */}
              {!isMacroTotalValid && (
                <Text
                  style={[
                    styles.macroValidationHint,
                    { color: MACRO_COLORS.CALORIES },
                  ]}
                >
                  {t(
                    "nutrition.mealDistribution.macroValidationHint",
                    "O total dos macronutrientes deve ser exatamente 100% para salvar"
                  )}
                </Text>
              )}
            </View>

            {/* Barra de distribuição de macros */}
            <View style={styles.macroBarContainer}>
              <View style={styles.macroBar}>
                <View
                  style={[
                    styles.macroBarSegment,
                    {
                      backgroundColor: MACRO_COLORS.PROTEIN,
                      width: `${parseInt(proteinValue) || 0}%`,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.macroBarSegment,
                    {
                      backgroundColor: MACRO_COLORS.CARBS,
                      width: `${parseInt(carbsValue) || 0}%`,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.macroBarSegment,
                    {
                      backgroundColor: MACRO_COLORS.FAT,
                      width: `${parseInt(fatValue) || 0}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </MotiView>
        )}
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  mealRow: {
    flexDirection: "column",
    borderRadius: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  mealInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "column",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  mealName: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  percentageLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 3,
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  portionCounter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  percentageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 42,
    borderRadius: 8,
    paddingHorizontal: 8,
    minWidth: 80,
    justifyContent: "center",
  },
  percentageInput: {
    fontSize: 18,
    fontWeight: "600",
    width: 40,
    padding: 0,
    textAlign: "center",
  },
  percentageUnit: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 4,
  },
  separator: {
    height: 1,
    width: "100%",
    marginVertical: 16,
  },
  macroContainer: {
    marginTop: 12,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  macroLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  macroIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  macroInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    borderRadius: 8,
    paddingHorizontal: 8,
    minWidth: 70,
    justifyContent: "center",
  },
  macroInput: {
    fontSize: 16,
    fontWeight: "600",
    width: 35,
    padding: 0,
    textAlign: "center",
  },
  macroBarContainer: {
    marginTop: 16,
  },
  macroBar: {
    height: 8,
    borderRadius: 4,
    flexDirection: "row",
    overflow: "hidden",
  },
  macroBarSegment: {
    height: "100%",
  },
  presetContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  presetButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  presetText: {
    fontSize: 12,
    fontWeight: "600",
  },
  macroTotalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  macroTotalLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  macroTotalValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  macroTotalHint: {
    fontSize: 13,
    fontWeight: "500",
    opacity: 0.8,
  },
  macroValidationHint: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
});

export default MealDistributionCard;
