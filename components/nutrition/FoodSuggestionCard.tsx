import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { FoodSuggestion } from "../../data/foodSuggestionDatabase";
import { getFoodAlternatives } from "../../data/foodSuggestionDatabase";
import Colors from "../../constants/Colors";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import FoodAlternativesModal from "./FoodAlternativesModal";
import { useNutrition } from "../../context/NutritionContext";
import ConfirmationModal from "../ui/ConfirmationModal";

interface FoodSuggestionCardProps {
  food: FoodSuggestion;
  index: number;
  mealColor: string;
  theme: "light" | "dark";
  isSelected: boolean;
  portion?: number;
  remainingNutrients?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  onToggleSelection: (foodId: string, portion?: number) => void;
  onReplaceFood?: (oldFoodId: string, newFood: FoodSuggestion) => void;
  onPortionChange?: (portion: number) => void;
  isAddedFood?: boolean;
  mealId?: string;
}

export default function FoodSuggestionCard({
  food,
  index,
  mealColor,
  theme,
  isSelected,
  portion,
  remainingNutrients,
  onToggleSelection,
  onReplaceFood,
  onPortionChange,
  isAddedFood,
  mealId,
}: FoodSuggestionCardProps) {
  const colors = Colors[theme];
  const { t } = useTranslation();
  const { nutritionInfo } = useNutrition();
  const [expanded, setExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [portionInputValue, setPortionInputValue] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Detectar se o alimento é medido por unidades (como pães, frutas, etc.)
  const unitBasedMeasure = useMemo(() => {
    // Verifica se há alguma medida baseada em unidades
    return food.measures.find(
      (measure) =>
        measure.label.includes("unidade") ||
        measure.label.includes("fatia") ||
        measure.label.includes("pão") ||
        measure.label.includes("bife") ||
        measure.label.includes("filé") ||
        measure.label.includes("gomo") ||
        measure.label.includes("pote")
    );
  }, [food.measures]);

  // Definir baseada em unidades ou peso
  const foodName = food.name.toLowerCase();
  const isCommonUnitFood =
    foodName.includes("ovo") ||
    foodName.includes("cookie") ||
    foodName.includes("banana") ||
    foodName.includes("maçã") ||
    foodName.includes("maca") ||
    foodName.includes("pão") ||
    foodName.includes("pera") ||
    foodName.includes("bolacha") ||
    foodName.includes("fatia") ||
    foodName.includes("unidade");

  const isUnitBased =
    !!unitBasedMeasure &&
    (food.id.match(
      /(pao|banana|maca|ovo|pera|laranja|melancia|fatia|bife|file|cookies|bolacha|donut|unidade)/i
    ) ||
      isCommonUnitFood);

  // Configurações baseadas no tipo de medida
  const measureInfo = useMemo(() => {
    if (isUnitBased) {
      const baseMeasure = unitBasedMeasure;
      const baseWeight = baseMeasure.weight;
      let unit = "unidade";
      let step = 0.5;
      let min = 0.5;
      let max = 10;

      if (baseMeasure.label.includes("fatia")) {
        unit = "fatia";
      } else if (
        baseMeasure.label.includes("bife") ||
        baseMeasure.label.includes("filé")
      ) {
        unit = "unidade";
      } else if (food.id.includes("pao_frances")) {
        unit = "unidade";
      } else if (
        food.id.includes("pao_forma") ||
        food.id.includes("pao_integral")
      ) {
        unit = "fatia";
      }

      return { baseWeight, unit, step, min, max, isUnitBased: true };
    } else {
      // Configuração padrão em gramas
      return {
        baseWeight: 100,
        unit: "g",
        step: 5,
        min: 10,
        max: 500,
        isUnitBased: false,
      };
    }
  }, [isUnitBased, unitBasedMeasure, food.id]);

  // Ajustado para permitir valores mínimos e máximos baseados no tipo de medida
  const minPortion = measureInfo.isUnitBased
    ? measureInfo.min * measureInfo.baseWeight
    : measureInfo.min;
  const maxPortion = measureInfo.isUnitBased
    ? measureInfo.max * measureInfo.baseWeight
    : measureInfo.max;

  // Formatar quantidade para exibição (unidades ou gramas)
  const formatPortionDisplay = () => {
    if (measureInfo.isUnitBased) {
      const units = selectedPortion / measureInfo.baseWeight;
      // Formatar para no máximo 1 casa decimal
      const formattedUnits = Math.round(units * 10) / 10;

      // Melhorar a formatação para ficar mais natural
      return `${formattedUnits} ${measureInfo.unit}${
        formattedUnits !== 1 ? "s" : ""
      }`;
    } else {
      return `${selectedPortion}g`;
    }
  };

  // Configurações de porção sugerida baseadas no tipo de alimento
  const getSuggestedPortion = useCallback(() => {
    const foodId = food.id.toLowerCase();

    // Sugestões de porções equilibradas para alimentos específicos
    if (foodId.includes("whey")) {
      return 20; // Uma porção padrão de whey (20g)
    } else if (foodId.includes("pasta_amendoim")) {
      return 15; // Uma colher de pasta de amendoim (15g)
    } else if (foodId.includes("banana")) {
      return 100; // Uma banana média (100g)
    } else if (foodId.includes("iogurte_desnatado")) {
      return 150; // Uma porção padrão de iogurte (150g)
    } else if (foodId.includes("iogurte")) {
      return 150; // Para qualquer iogurte
    }

    // Para outros alimentos, usar as configurações padrão
    if (isUnitBased) {
      return unitBasedMeasure.weight;
    } else {
      return 100; // Valor padrão em gramas
    }
  }, [food.id, isUnitBased, unitBasedMeasure]);

  // Inicializar com porção sugerida ou fornecida
  const [selectedPortion, setSelectedPortion] = useState(
    portion || getSuggestedPortion()
  );

  // Atualizar o estado interno quando a prop portion mudar
  useEffect(() => {
    if (portion && portion !== selectedPortion) {
      setSelectedPortion(portion);

      if (measureInfo.isUnitBased) {
        const units = portion / measureInfo.baseWeight;
        setPortionInputValue(units.toString());
      } else {
        setPortionInputValue(portion.toString());
      }
    }
  }, [portion, measureInfo, selectedPortion]);

  // Flag para controlar atualizações de input via digitação vs outros métodos
  const [isUserTyping, setIsUserTyping] = useState(false);

  // Atualizar input quando a porção selecionada mudar, exceto durante digitação
  useEffect(() => {
    // Pular atualização se o usuário estiver ativamente digitando
    if (isUserTyping) return;

    if (measureInfo.isUnitBased) {
      const units = selectedPortion / measureInfo.baseWeight;
      // Formatar para no máximo 1 casa decimal
      const formattedUnits = Math.round(units * 10) / 10;
      setPortionInputValue(formattedUnits.toString());
    } else {
      setPortionInputValue(selectedPortion.toString());
    }
  }, [selectedPortion, measureInfo, isUserTyping]);

  // Alternativas para este alimento
  const alternatives = getFoodAlternatives(food.id, nutritionInfo.dietType);

  // Formatar números para exibição
  const formatNumber = (value: number, isCalorie = false) => {
    if (isCalorie) {
      // Para calorias, sem casas decimais
      return Math.round(value);
    } else {
      // Para macros, uma casa decimal
      const num = Math.round(value * 10) / 10;
      // Remover zeros à direita (igual ao food-details)
      return num === Math.floor(num) ? Math.floor(num) : num;
    }
  };

  // Calcular nutrientes com base na porção selecionada
  const calculateNutrients = useCallback(
    (food: FoodSuggestion, portion: number) => {
      // Se for um alimento já adicionado, usar os valores exatos
      if (isAddedFood) {
        return {
          calories: food.nutrients.calories,
          protein: food.nutrients.protein,
          carbs: food.nutrients.carbs,
          fat: food.nutrients.fat,
        };
      }

      // Para alimentos não adicionados, calcular baseado na porção
      return {
        calories: Math.round((food.nutrients.calories * portion) / 100),
        protein:
          Math.round(((food.nutrients.protein * portion) / 100) * 10) / 10,
        carbs: Math.round(((food.nutrients.carbs * portion) / 100) * 10) / 10,
        fat: Math.round(((food.nutrients.fat * portion) / 100) * 10) / 10,
      };
    },
    [food.nutrients, isAddedFood]
  );

  const nutrients = calculateNutrients(food, selectedPortion);

  // Função para pulsar os valores quando mudam
  const triggerPulseAnimation = () => {
    // Removida animação de pulso
  };

  const toggleExpanded = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
  };

  // Função para incrementar a porção (baseada no tipo de medida)
  const incrementPortion = () => {
    // Não estamos digitando, mas usando botões
    setIsUserTyping(false);

    let newValue;

    if (measureInfo.isUnitBased) {
      // Incrementar por unidades
      const currentUnits = selectedPortion / measureInfo.baseWeight;
      const newUnits = Math.min(
        currentUnits + measureInfo.step,
        measureInfo.max
      );
      newValue = Math.round(newUnits * measureInfo.baseWeight);
    } else {
      // Incrementar por gramas
      newValue = Math.min(selectedPortion + 5, maxPortion);
    }

    setSelectedPortion(newValue);

    if (measureInfo.isUnitBased) {
      const newUnits = newValue / measureInfo.baseWeight;
      // Formatar para no máximo 1 casa decimal
      const formattedUnits = Math.round(newUnits * 10) / 10;
      setPortionInputValue(formattedUnits.toString());
    } else {
      setPortionInputValue(newValue.toString());
    }

    if (onPortionChange) {
      onPortionChange(newValue);
      triggerPulseAnimation();
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Função para decrementar a porção (baseada no tipo de medida)
  const decrementPortion = () => {
    // Não estamos digitando, mas usando botões
    setIsUserTyping(false);

    let newValue;

    if (measureInfo.isUnitBased) {
      // Decrementar por unidades
      const currentUnits = selectedPortion / measureInfo.baseWeight;
      const newUnits = Math.max(
        currentUnits - measureInfo.step,
        measureInfo.min
      );
      newValue = Math.round(newUnits * measureInfo.baseWeight);
    } else {
      // Decrementar por gramas
      newValue = Math.max(selectedPortion - 5, minPortion);
    }

    setSelectedPortion(newValue);

    if (measureInfo.isUnitBased) {
      const newUnits = newValue / measureInfo.baseWeight;
      // Formatar para no máximo 1 casa decimal
      const formattedUnits = Math.round(newUnits * 10) / 10;
      setPortionInputValue(formattedUnits.toString());
    } else {
      setPortionInputValue(newValue.toString());
    }

    if (onPortionChange) {
      onPortionChange(newValue);
      triggerPulseAnimation();
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSliderChange = (value: number) => {
    // Não estamos digitando, mas usando o slider
    setIsUserTyping(false);

    let roundedValue;

    if (measureInfo.isUnitBased) {
      // Para controle baseado em unidades, converter para unidades e depois para peso
      const unitValue = value / measureInfo.baseWeight;
      const roundedUnitValue =
        Math.round(unitValue / measureInfo.step) * measureInfo.step;
      roundedValue = Math.round(roundedUnitValue * measureInfo.baseWeight);
    } else {
      // Para controle baseado em peso, arredondar para múltiplos de 5g
      roundedValue = Math.round(value / 5) * 5;
    }

    setSelectedPortion(roundedValue);

    if (measureInfo.isUnitBased) {
      setPortionInputValue((roundedValue / measureInfo.baseWeight).toString());
    } else {
      setPortionInputValue(roundedValue.toString());
    }

    // Notificar o componente pai sobre a mudança na porção em tempo real
    if (onPortionChange) {
      onPortionChange(roundedValue);
      triggerPulseAnimation();
    }

    // Feedback tátil leve ao ajustar o slider
    if (roundedValue % 10 === 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePortionInputChange = (text: string) => {
    // Sinalizar que o usuário está digitando
    setIsUserTyping(true);

    // Permitir números e um ponto decimal
    const sanitizedText = text.replace(",", "."); // Substituir vírgula por ponto

    // Se o texto estiver vazio, definir como vazio
    if (sanitizedText === "") {
      setPortionInputValue("");
      return;
    }

    // Verificar se é um número válido
    if (!/^[0-9]*\.?[0-9]*$/.test(sanitizedText)) {
      return; // Ignorar entradas que não são números
    }

    // Converter para número e verificar se está no intervalo permitido
    const numValue = parseFloat(sanitizedText);

    if (isNaN(numValue)) return;

    if (measureInfo.isUnitBased) {
      // Verificar limites em unidades
      if (numValue <= measureInfo.max) {
        setPortionInputValue(sanitizedText);
      }
    } else {
      // Verificar limites em gramas
      if (numValue <= maxPortion) {
        setPortionInputValue(sanitizedText);
      }
    }
  };

  const handlePortionInputBlur = () => {
    // Restaurar a flag quando o usuário terminar de digitar
    setIsUserTyping(false);

    // Ao perder o foco, formatar corretamente o número
    if (portionInputValue === "") {
      if (measureInfo.isUnitBased) {
        const newPortion = measureInfo.min * measureInfo.baseWeight;
        setSelectedPortion(newPortion);
        setPortionInputValue(measureInfo.min.toString());

        // Notificar o componente pai sobre a mudança na porção
        if (onPortionChange) {
          onPortionChange(newPortion);
          triggerPulseAnimation();
        }
      } else {
        setSelectedPortion(minPortion);
        setPortionInputValue(minPortion.toString());

        // Notificar o componente pai sobre a mudança na porção
        if (onPortionChange) {
          onPortionChange(minPortion);
          triggerPulseAnimation();
        }
      }
    } else {
      // Converter para número e aplicar limites
      const numValue = parseFloat(portionInputValue);
      let finalPortion = selectedPortion; // Valor padrão caso nada mude

      if (isNaN(numValue)) {
        if (measureInfo.isUnitBased) {
          finalPortion = measureInfo.min * measureInfo.baseWeight;
          setSelectedPortion(finalPortion);
          setPortionInputValue(measureInfo.min.toString());
        } else {
          finalPortion = minPortion;
          setSelectedPortion(finalPortion);
          setPortionInputValue(minPortion.toString());
        }
      } else if (measureInfo.isUnitBased) {
        // Aplicar limites para unidades
        if (numValue < measureInfo.min) {
          finalPortion = measureInfo.min * measureInfo.baseWeight;
          setSelectedPortion(finalPortion);
          setPortionInputValue(measureInfo.min.toString());
        } else if (numValue > measureInfo.max) {
          finalPortion = measureInfo.max * measureInfo.baseWeight;
          setSelectedPortion(finalPortion);
          setPortionInputValue(measureInfo.max.toString());
        } else {
          // Arredondar para o valor de passo mais próximo
          const validUnits =
            Math.round(numValue / measureInfo.step) * measureInfo.step;
          finalPortion = Math.round(validUnits * measureInfo.baseWeight);
          setSelectedPortion(finalPortion);
          // Formatar para no máximo 1 casa decimal
          const formattedUnits = Math.round(validUnits * 10) / 10;
          setPortionInputValue(formattedUnits.toString());
        }
      } else {
        // Aplicar limites para gramas
        if (numValue < minPortion) {
          finalPortion = minPortion;
          setSelectedPortion(finalPortion);
          setPortionInputValue(minPortion.toString());
        } else if (numValue > maxPortion) {
          finalPortion = maxPortion;
          setSelectedPortion(finalPortion);
          setPortionInputValue(maxPortion.toString());
        } else {
          finalPortion = Math.round(numValue);
          setSelectedPortion(finalPortion);
          setPortionInputValue(formatNumber(finalPortion).toString());
        }
      }

      // Notificar o componente pai sobre a mudança na porção usando o valor final calculado
      if (onPortionChange) {
        onPortionChange(finalPortion);
        triggerPulseAnimation();
      }
    }
  };

  const handleToggleSelection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isAddedFood) {
      // Se for um alimento já adicionado, mostrar modal de confirmação
      setShowDeleteModal(true);
    } else {
      onToggleSelection(food.id, selectedPortion);
    }
  };

  // Ícone por categoria de alimento
  const getFoodIcon = (foodItem: FoodSuggestion = food) => {
    // Identificar o tipo de alimento pelo ID e nome para maior abrangência
    const foodId = foodItem.id.toLowerCase();
    const foodName = foodItem.name.toLowerCase();

    // Verificar tanto pelo ID quanto pelo nome do alimento
    if (
      foodId.includes("pao") ||
      foodName.includes("pão") ||
      foodName.includes("pao")
    ) {
      return <FontAwesome5 name="bread-slice" size={18} color={mealColor} />;
    } else if (foodId.includes("ovo") || foodName.includes("ovo")) {
      return <FontAwesome5 name="egg" size={18} color={mealColor} />;
    } else if (
      foodId.includes("banana") ||
      foodId.includes("maca") ||
      foodId.includes("fruta") ||
      foodName.includes("banana") ||
      foodName.includes("maçã") ||
      foodName.includes("maca") ||
      foodName.includes("fruta")
    ) {
      return <FontAwesome5 name="apple-alt" size={18} color={mealColor} />;
    } else if (
      foodId.includes("frango") ||
      foodId.includes("patinho") ||
      foodId.includes("file") ||
      foodId.includes("carne") ||
      foodId.includes("bife") ||
      foodName.includes("frango") ||
      foodName.includes("carne") ||
      foodName.includes("bife") ||
      foodName.includes("filé") ||
      foodName.includes("file")
    ) {
      return <FontAwesome5 name="drumstick-bite" size={18} color={mealColor} />;
    } else if (
      foodId.includes("peixe") ||
      foodId.includes("salmao") ||
      foodName.includes("peixe") ||
      foodName.includes("salmão") ||
      foodName.includes("tilápia") ||
      foodName.includes("tilapia") ||
      foodName.includes("bacalhau") ||
      foodName.includes("atum")
    ) {
      return <FontAwesome5 name="fish" size={18} color={mealColor} />;
    } else if (
      foodId.includes("legumes") ||
      foodId.includes("salada") ||
      foodName.includes("legumes") ||
      foodName.includes("salada") ||
      foodName.includes("verdura") ||
      foodName.includes("folhas")
    ) {
      return <MaterialCommunityIcons name="leaf" size={20} color={mealColor} />;
    } else if (
      foodId.includes("requeijao") ||
      foodId.includes("queijo") ||
      foodName.includes("requeijão") ||
      foodName.includes("queijo")
    ) {
      return <FontAwesome5 name="cheese" size={18} color={mealColor} />;
    } else if (
      foodId.includes("iogurte_desnatado") ||
      foodName.includes("iogurte desnatado")
    ) {
      return (
        <FontAwesome5
          name="glass-whiskey"
          size={18}
          color={mealColor}
          style={{ opacity: 0.9 }}
        />
      );
    } else if (foodId.includes("iogurte") || foodName.includes("iogurte")) {
      return <FontAwesome5 name="glass-whiskey" size={18} color={mealColor} />;
    } else if (
      foodId.includes("aveia") ||
      foodId.includes("granola") ||
      foodId.includes("chia") ||
      foodName.includes("aveia") ||
      foodName.includes("granola") ||
      foodName.includes("chia") ||
      foodName.includes("cereal")
    ) {
      return (
        <MaterialCommunityIcons name="grain" size={20} color={mealColor} />
      );
    } else if (foodId.includes("whey") || foodName.includes("whey")) {
      return (
        <MaterialCommunityIcons
          name="shaker-outline"
          size={20}
          color={mealColor}
        />
      );
    } else if (
      foodId.includes("azeite") ||
      foodId.includes("oleo") ||
      foodName.includes("azeite") ||
      foodName.includes("óleo") ||
      foodName.includes("oleo")
    ) {
      return <MaterialCommunityIcons name="oil" size={20} color={mealColor} />;
    } else if (
      foodId.includes("castanha") ||
      foodId.includes("amendoim") ||
      foodId.includes("pasta_amendoim") ||
      foodName.includes("castanha") ||
      foodName.includes("amendoim") ||
      foodName.includes("pasta de amendoim")
    ) {
      return (
        <MaterialCommunityIcons name="peanut" size={20} color={mealColor} />
      );
    }

    // Padrão
    return (
      <MaterialCommunityIcons name="food-variant" size={20} color={mealColor} />
    );
  };

  // Se atende às necessidades nutricionais
  const meetsNutrientNeeds = remainingNutrients
    ? nutrients.calories <= remainingNutrients.calories
    : true;

  // Modificar a verificação de alternativas para considerar o tipo do alimento
  const hasAlternatives = useMemo(() => {
    // Se for um alimento adicionado, não permitir substituições
    if (isAddedFood) {
      return false; // Não permitir substituições para alimentos adicionados
    }
    // Para alimentos sugeridos, manter a lógica original
    return alternatives.length > 0;
  }, [isAddedFood, alternatives]);

  const openAlternativesModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalVisible(true);
  };

  const closeAlternativesModal = () => {
    setModalVisible(false);
  };

  const handleReplaceFood = (oldFoodId: string, newFood: FoodSuggestion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (onReplaceFood) {
      // Para alimentos sugeridos, usar callback onReplaceFood
      onReplaceFood(oldFoodId, newFood);
    }
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isSelected
              ? mealColor + "15"
              : theme === "dark"
              ? colors.light
              : "#FFFFFF",
            borderWidth: isSelected ? 1 : 1,
            borderColor: isSelected ? mealColor + "50" : colors.border,
            opacity: meetsNutrientNeeds ? 1 : 0.8,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleToggleSelection}
          style={styles.cardTouchable}
        >
          {/* Cabeçalho */}
          <View style={styles.header}>
            <View style={styles.leftContent}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isSelected
                      ? mealColor + "30"
                      : mealColor + "20",
                    borderWidth: isSelected ? 1 : 0,
                    borderColor: isSelected ? mealColor : "transparent",
                  },
                ]}
              >
                {getFoodIcon()}
              </View>
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.title,
                    {
                      color: colors.text,
                      fontWeight: isAddedFood || isSelected ? "700" : "600",
                    },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {food.name}
                </Text>

                {/* Subtítulo formatado de acordo com o tipo de medida */}
                <Text
                  style={[styles.subtitle, { color: colors.text + "80" }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {formatPortionDisplay()}
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              {hasAlternatives && (
                <TouchableOpacity
                  style={[
                    styles.swapButton,
                    { backgroundColor: colors.text + "10" },
                  ]}
                  onPress={openAlternativesModal}
                >
                  <MaterialCommunityIcons
                    name="swap-horizontal"
                    size={18}
                    color={mealColor}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.expandButton,
                  { backgroundColor: colors.text + "10" },
                ]}
                onPress={toggleExpanded}
              >
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.text + "80"}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Informações nutricionais compactas (visíveis mesmo quando não expandido) */}
          <View style={styles.compactNutritionInfo}>
            <View style={styles.caloriesContainer}>
              <Text style={[styles.caloriesValue, { color: mealColor }]}>
                {formatNumber(nutrients.calories, true)}
              </Text>
              <Text
                style={[styles.caloriesUnit, { color: colors.text + "70" }]}
              >
                {t("nutrition.units.kcal")}
              </Text>
            </View>

            <View style={styles.macroSimpleRow}>
              <Text style={[styles.macroText, { color: colors.text + "80" }]}>
                {t("nutrition.macros.protein_short")}{" "}
                <Text style={[styles.macroNumber, { color: colors.text }]}>
                  {formatNumber(nutrients.protein)}
                </Text>
                {"   "}
                {t("nutrition.macros.carbs_short")}{" "}
                <Text style={[styles.macroNumber, { color: colors.text }]}>
                  {formatNumber(nutrients.carbs)}
                </Text>
                {"   "}
                {t("nutrition.macros.fat_short")}{" "}
                <Text style={[styles.macroNumber, { color: colors.text }]}>
                  {formatNumber(nutrients.fat)}
                </Text>
              </Text>
            </View>
          </View>

          {/* Conteúdo expandido */}
          {expanded && (
            <View style={styles.expandedContent}>
              {/* Separador */}
              <View
                style={[styles.separator, { backgroundColor: colors.border }]}
              />

              {/* Controles de porção (novo estilo com botões) */}
              <View style={styles.portionControlSection}>
                {/* Controle de porção com botões */}
                <View style={styles.portionControls}>
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
                      onPress={decrementPortion}
                    >
                      <Ionicons name="remove" size={18} color={mealColor} />
                    </TouchableOpacity>

                    <View
                      style={[
                        styles.weightInputContainer,
                        {
                          backgroundColor: colors.text + "08",
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          borderWidth: 1,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <TextInput
                        style={[styles.weightInput, { color: colors.text }]}
                        value={portionInputValue}
                        onChangeText={handlePortionInputChange}
                        onBlur={handlePortionInputBlur}
                        keyboardType="numeric"
                        maxLength={5}
                        placeholder={measureInfo.isUnitBased ? "1" : "100"}
                        placeholderTextColor={colors.text + "40"}
                      />
                      <Text style={[styles.weightUnit, { color: colors.text }]}>
                        {measureInfo.isUnitBased
                          ? measureInfo.unit
                          : t("nutrition.units.gram")}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.counterButton,
                        {
                          backgroundColor: mealColor + "15",
                          borderWidth: 1,
                          borderColor: mealColor + "30",
                        },
                      ]}
                      onPress={incrementPortion}
                    >
                      <Ionicons name="add" size={18} color={mealColor} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Slider para ajuste de porção */}
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={minPortion}
                    maximumValue={maxPortion}
                    step={
                      measureInfo.isUnitBased
                        ? measureInfo.baseWeight * measureInfo.step
                        : 5
                    }
                    value={selectedPortion}
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
                      {measureInfo.isUnitBased
                        ? `${measureInfo.min} ${measureInfo.unit}`
                        : `${minPortion}${t("nutrition.units.gram")}`}
                    </Text>
                    <Text
                      style={[
                        styles.sliderLabel,
                        { color: colors.text + "80" },
                      ]}
                    >
                      {measureInfo.isUnitBased
                        ? `${measureInfo.max} ${measureInfo.unit}s`
                        : `${maxPortion}${t("nutrition.units.gram")}`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de Alternativas */}
      <FoodAlternativesModal
        visible={modalVisible}
        food={food}
        alternatives={alternatives}
        mealColor={mealColor}
        theme={theme}
        onClose={closeAlternativesModal}
        onReplaceFood={handleReplaceFood}
        getFoodIcon={getFoodIcon}
        selectedPortion={selectedPortion}
        matchCalories={true}
      />

      {/* Modal de confirmação para deletar */}
      <ConfirmationModal
        visible={showDeleteModal}
        title={t("nutrition.recommendation.alert.attention")}
        message={t("nutrition.deleteFoodConfirm")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        confirmType="danger"
        icon="trash-outline"
        onConfirm={() => {
          setShowDeleteModal(false);
          onToggleSelection(food.id);
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTouchable: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    paddingBottom: 6,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    overflow: "hidden",
    marginRight: 12,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    overflow: "hidden",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    flexShrink: 1,
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 36,
    marginRight: 8,
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 36,
    flexShrink: 0,
  },
  // Estilo para a seção de informações nutricionais compactas
  compactNutritionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 10,
  },
  caloriesContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  caloriesValue: {
    fontSize: 17,
    fontWeight: "600",
  },
  caloriesUnit: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
    marginBottom: 1,
  },
  macroSimpleRow: {
    alignItems: "flex-end",
  },
  macroText: {
    fontSize: 13,
    textAlign: "right",
  },
  macroNumber: {
    fontSize: 14,
    fontWeight: "700",
  },
  expandedContent: {
    paddingTop: 0,
  },
  separator: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 14,
  },
  // Novos estilos baseados no food-details.tsx
  portionControlSection: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 6,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  // Estilos para os controles de porção
  portionControls: {
    marginBottom: 15,
    justifyContent: "center",
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
  weightInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 42,
    paddingVertical: 8,
    minWidth: 90,
    justifyContent: "center",
  },
  weightInput: {
    fontSize: 18,
    fontWeight: "600",
    width: 60,
    textAlign: "center",
    padding: 0,
  },
  weightUnit: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 4,
  },
  sliderContainer: {
    marginBottom: 10,
    width: "100%",
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
});
