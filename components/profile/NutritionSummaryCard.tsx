import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { useNutrition } from "../../context/NutritionContext";
import { useRouter } from "expo-router";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import Slider from "@react-native-community/slider";
import { ErrorMessage } from "../common/ErrorMessage";
import { ValidationResult } from "../../utils/validations";
import { useTranslation } from "react-i18next";
import InfoModal, { InfoItem } from "../common/InfoModal";

const { width } = Dimensions.get("window");

export default function NutritionSummaryCard() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, updateNutritionInfo, saveNutritionInfo } =
    useNutrition();
  const router = useRouter();

  // Ref para o bottom sheet
  const customizeSheetRef = useRef<BottomSheetModal>(null);

  // Estado para controlar o modo de edição inline
  const [isEditMode, setIsEditMode] = useState(false);

  // Estado para controlar a visibilidade do InfoModal
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);

  // Estados para os valores em edição
  const [editCalories, setEditCalories] = useState(
    nutritionInfo.calories?.toString() || ""
  );
  const [editProtein, setEditProtein] = useState(
    nutritionInfo.protein?.toString() || ""
  );
  const [editCarbs, setEditCarbs] = useState(
    nutritionInfo.carbs?.toString() || ""
  );
  const [editFat, setEditFat] = useState(nutritionInfo.fat?.toString() || "");
  const [editWaterIntake, setEditWaterIntake] = useState(
    nutritionInfo.waterIntake?.toString() || ""
  );

  // Estados para as porcentagens de macros
  const [proteinPercentage, setProteinPercentage] = useState(0);
  const [carbsPercentage, setCarbsPercentage] = useState(0);
  const [fatPercentage, setFatPercentage] = useState(0);

  // Estados para erros de validação
  const [caloriesError, setCaloriesError] = useState<string>("");
  const [proteinError, setProteinError] = useState<string>("");
  const [carbsError, setCarbsError] = useState<string>("");
  const [fatError, setFatError] = useState<string>("");
  const [waterIntakeError, setWaterIntakeError] = useState<string>("");
  const [macrosError, setMacrosError] = useState<string>("");

  // Atualizar os estados locais quando nutritionInfo mudar
  useEffect(() => {
    if (
      nutritionInfo.calories &&
      nutritionInfo.protein &&
      nutritionInfo.carbs &&
      nutritionInfo.fat
    ) {
      setEditCalories(nutritionInfo.calories.toString());
      setEditProtein(nutritionInfo.protein.toString());
      setEditCarbs(nutritionInfo.carbs.toString());
      setEditFat(nutritionInfo.fat.toString());

      if (nutritionInfo.waterIntake) {
        setEditWaterIntake(nutritionInfo.waterIntake.toString());
      }

      calculatePercentages(
        nutritionInfo.protein,
        nutritionInfo.carbs,
        nutritionInfo.fat,
        nutritionInfo.calories
      );
    }
  }, [nutritionInfo]);

  // Verificar se há informações nutricionais
  const hasNutritionInfo =
    nutritionInfo.calories &&
    nutritionInfo.protein &&
    nutritionInfo.carbs &&
    nutritionInfo.fat;

  // Função para calcular as porcentagens de macros
  const calculatePercentages = (
    protein: number,
    carbs: number,
    fat: number,
    calories: number
  ) => {
    const proteinCalories = protein * 4;
    const carbsCalories = carbs * 4;
    const fatCalories = fat * 9;

    setProteinPercentage(Math.round((proteinCalories / calories) * 100));
    setCarbsPercentage(Math.round((carbsCalories / calories) * 100));
    setFatPercentage(Math.round((fatCalories / calories) * 100));
  };

  // Função para atualizar os macronutrientes quando as calorias são alteradas
  const updateMacrosWhenCaloriesChange = (newCalories: number) => {
    // Verificar se há um valor válido de caloria anterior
    if (!nutritionInfo.calories) return;

    // Se o valor de calorias não mudou, não precisa atualizar
    if (newCalories === nutritionInfo.calories) return;

    // Se já temos porcentagens calculadas, use-as
    if (proteinPercentage > 0 && carbsPercentage > 0 && fatPercentage > 0) {
      // Recalcular os macros com base nas porcentagens atuais
      const newProtein = Math.round((newCalories * proteinPercentage) / 400);
      const newCarbs = Math.round((newCalories * carbsPercentage) / 400);
      const newFat = Math.round((newCalories * fatPercentage) / 900);

      setEditProtein(newProtein.toString());
      setEditCarbs(newCarbs.toString());
      setEditFat(newFat.toString());
    }
    // Se não temos porcentagens ainda (ex: primeira edição), calcule-as primeiro
    else if (
      nutritionInfo.protein &&
      nutritionInfo.carbs &&
      nutritionInfo.fat
    ) {
      // Calcular porcentagens com base nos valores atuais
      const proteinCalories = nutritionInfo.protein * 4;
      const carbsCalories = nutritionInfo.carbs * 4;
      const fatCalories = nutritionInfo.fat * 9;
      const totalCalories = nutritionInfo.calories;

      const proteinPct = Math.round((proteinCalories / totalCalories) * 100);
      const carbsPct = Math.round((carbsCalories / totalCalories) * 100);
      const fatPct = Math.round((fatCalories / totalCalories) * 100);

      // Atualizar porcentagens
      setProteinPercentage(proteinPct);
      setCarbsPercentage(carbsPct);
      setFatPercentage(fatPct);

      // Agora calcular os novos valores em gramas
      const newProtein = Math.round((newCalories * proteinPct) / 400);
      const newCarbs = Math.round((newCalories * carbsPct) / 400);
      const newFat = Math.round((newCalories * fatPct) / 900);

      setEditProtein(newProtein.toString());
      setEditCarbs(newCarbs.toString());
      setEditFat(newFat.toString());
    }
  };

  // Função para atualizar os macros com base nas porcentagens
  const updateMacrosFromPercentages = (
    newProteinPercentage: number,
    newCarbsPercentage: number,
    newFatPercentage: number,
    caloriesValue: number
  ) => {
    const newProtein = Math.round((caloriesValue * newProteinPercentage) / 400);
    const newCarbs = Math.round((caloriesValue * newCarbsPercentage) / 400);
    const newFat = Math.round((caloriesValue * newFatPercentage) / 900);

    setEditProtein(newProtein.toString());
    setEditCarbs(newCarbs.toString());
    setEditFat(newFat.toString());

    return { protein: newProtein, carbs: newCarbs, fat: newFat };
  };

  // Função para ajustar as porcentagens quando uma delas é alterada
  const adjustPercentages = (
    type: "protein" | "carbs" | "fat",
    value: number
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Calcular o total atual sem o valor que está sendo alterado
    let currentTotal = 0;
    if (type === "protein") {
      currentTotal = carbsPercentage + fatPercentage;
    } else if (type === "carbs") {
      currentTotal = proteinPercentage + fatPercentage;
    } else {
      currentTotal = proteinPercentage + carbsPercentage;
    }

    // Verificar se o novo total excederia 100%
    if (currentTotal + value > 100) {
      // Ajustar o valor para não exceder 100%
      value = 100 - currentTotal;

      // Feedback tátil para indicar que atingiu o limite
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    // Atualizar o valor do macro selecionado
    if (type === "protein") {
      setProteinPercentage(value);
    } else if (type === "carbs") {
      setCarbsPercentage(value);
    } else {
      setFatPercentage(value);
    }

    // Atualizar os valores em gramas com base nas novas porcentagens
    if (editCalories) {
      const caloriesValue = parseInt(editCalories);

      if (type === "protein") {
        const newProtein = Math.round((caloriesValue * value) / 400);
        setEditProtein(newProtein.toString());
      } else if (type === "carbs") {
        const newCarbs = Math.round((caloriesValue * value) / 400);
        setEditCarbs(newCarbs.toString());
      } else {
        const newFat = Math.round((caloriesValue * value) / 900);
        setEditFat(newFat.toString());
      }
    }
  };

  // Verificar se a soma das porcentagens é 100%
  const isTotalValid = () => {
    const total = proteinPercentage + carbsPercentage + fatPercentage;
    return Math.abs(total - 100) <= 1; // Permitir uma pequena margem de erro devido a arredondamentos
  };

  // Função para definir o plano nutricional
  const handleSetupPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/nutrition-setup");
  };

  // Função para abrir o customizador
  const handleCustomizePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditMode(true);
  };

  // Função para cancelar a edição
  const handleCancelEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Restaurar os valores originais
    setEditCalories(nutritionInfo.calories?.toString() || "");
    setEditProtein(nutritionInfo.protein?.toString() || "");
    setEditCarbs(nutritionInfo.carbs?.toString() || "");
    setEditFat(nutritionInfo.fat?.toString() || "");

    // Restaurar porcentagens originais
    setProteinPercentage(
      Math.round((nutritionInfo.protein || 0) * 4 * 100) /
        (nutritionInfo.calories || 2000)
    );
    setCarbsPercentage(
      Math.round((nutritionInfo.carbs || 0) * 4 * 100) /
        (nutritionInfo.calories || 2000)
    );
    setFatPercentage(
      Math.round((nutritionInfo.fat || 0) * 9 * 100) /
        (nutritionInfo.calories || 2000)
    );

    // Limpar erros
    setCaloriesError("");
    setProteinError("");
    setCarbsError("");
    setFatError("");
    setWaterIntakeError("");
    setMacrosError("");

    // Sair do modo de edição
    setIsEditMode(false);
  };

  // Função para salvar as alterações da edição inline
  const handleSaveInlineEdit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Validar todos os campos
    const isCaloriesValid = validateCalories(editCalories);
    const isProteinValid = validateProtein(editProtein);
    const isCarbsValid = validateCarbs(editCarbs);
    const isFatValid = validateFat(editFat);
    const isWaterIntakeValid = validateWaterIntake(editWaterIntake);
    const isMacrosDistributionValid = validateMacrosDistribution();

    // Se algum campo for inválido, não prosseguir
    if (
      !isCaloriesValid ||
      !isProteinValid ||
      !isCarbsValid ||
      !isFatValid ||
      !isWaterIntakeValid ||
      !isMacrosDistributionValid
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Atualizar o contexto
    await updateNutritionInfo({
      ...nutritionInfo,
      calories: parseInt(editCalories),
      protein: parseInt(editProtein),
      carbs: parseInt(editCarbs),
      fat: parseInt(editFat),
      waterIntake: parseInt(editWaterIntake),
    });

    // Salvar no Firebase e AsyncStorage
    await saveNutritionInfo();

    // Sair do modo de edição
    setIsEditMode(false);

    // Fornecer feedback tátil de sucesso
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Função para atualizar o card após salvar as alterações
  const handleSaveComplete = () => {
    // Não é necessário fazer nada aqui, pois o contexto já foi atualizado
    // e o componente será re-renderizado automaticamente
  };

  // Função para validar calorias
  const validateCalories = (value: string): boolean => {
    const caloriesValue = parseInt(value);
    if (isNaN(caloriesValue) || caloriesValue < 800 || caloriesValue > 5000) {
      setCaloriesError(t("profile.nutritionCard.caloriesError"));
      return false;
    }
    setCaloriesError("");
    return true;
  };

  // Função para validar proteínas
  const validateProtein = (value: string): boolean => {
    const proteinValue = parseInt(value);
    if (isNaN(proteinValue) || proteinValue < 10 || proteinValue > 300) {
      setProteinError(`${t("profile.nutritionCard.proteinError")} (10-300g)`);
      return false;
    }
    setProteinError("");
    return true;
  };

  // Função para validar carboidratos
  const validateCarbs = (value: string): boolean => {
    const carbsValue = parseInt(value);
    if (isNaN(carbsValue) || carbsValue < 10 || carbsValue > 500) {
      setCarbsError(`${t("profile.nutritionCard.carbsError")} (10-500g)`);
      return false;
    }
    setCarbsError("");
    return true;
  };

  // Função para validar gorduras
  const validateFat = (value: string): boolean => {
    const fatValue = parseInt(value);
    if (isNaN(fatValue) || fatValue < 10 || fatValue > 200) {
      setFatError(`${t("profile.nutritionCard.fatError")} (10-200g)`);
      return false;
    }
    setFatError("");
    return true;
  };

  // Função para validar a ingestão de água
  const validateWaterIntake = (value: string): boolean => {
    const waterValue = parseInt(value);
    if (isNaN(waterValue) || waterValue < 500 || waterValue > 8000) {
      setWaterIntakeError(t("profile.nutritionCard.waterIntakeError"));
      return false;
    }
    setWaterIntakeError("");
    return true;
  };

  // Função para validar a distribuição de macronutrientes
  const validateMacrosDistribution = (): boolean => {
    // Calcular as porcentagens a partir dos valores em gramas
    const proteinValue = parseInt(editProtein);
    const carbsValue = parseInt(editCarbs);
    const fatValue = parseInt(editFat);
    const caloriesValue = parseInt(editCalories);

    if (
      isNaN(proteinValue) ||
      isNaN(carbsValue) ||
      isNaN(fatValue) ||
      isNaN(caloriesValue)
    ) {
      setMacrosError(t("profile.nutritionCard.distributionError"));
      return false;
    }

    const proteinCalories = proteinValue * 4;
    const carbsCalories = carbsValue * 4;
    const fatCalories = fatValue * 9;
    const totalCalories = proteinCalories + carbsCalories + fatCalories;

    // Verificar se o total de calorias dos macros está próximo do valor de calorias definido
    // Permitindo uma margem de erro de 5%
    const difference = Math.abs(totalCalories - caloriesValue);
    const percentDifference = (difference / caloriesValue) * 100;

    if (percentDifference > 5) {
      setMacrosError(
        `${t(
          "profile.nutritionCard.distributionError"
        )} (${totalCalories.toFixed(0)} kcal vs ${caloriesValue} kcal)`
      );
      return false;
    }

    setMacrosError("");
    return true;
  };

  // Função para abrir o modal de informações
  const handleInfoPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsInfoModalVisible(true);
  };

  // Função para fechar o modal de informações
  const handleCloseInfoModal = () => {
    setIsInfoModalVisible(false);
  };

  // Informações para o modal
  const nutritionInfoItems: InfoItem[] = [
    {
      title: t("profile.nutritionCard.caloriesInfoTitle", "Calorias"),
      description: t(
        "profile.nutritionCard.caloriesInfoDesc",
        "As calorias são a unidade de energia que seu corpo precisa para funcionar. Seu objetivo diário é baseado em sua idade, peso, altura, nível de atividade e objetivos de fitness. Um déficit calórico promove perda de peso, enquanto um superávit auxilia no ganho de massa muscular."
      ),
      icon: "fire",
      iconType: "material",
      color: "#FF1F02",
    },
    {
      title: t("profile.nutritionCard.proteinInfoTitle", "Proteínas"),
      description: t(
        "profile.nutritionCard.proteinInfoDesc",
        "Proteínas são essenciais para construção e reparo muscular. Recomenda-se de 1,6g a 2,2g por kg de peso corporal para quem pratica musculação regularmente. Boas fontes incluem carnes magras, ovos, laticínios, leguminosas e suplementos proteicos."
      ),
      icon: "food-steak",
      iconType: "material",
      color: "#EF476F",
    },
    {
      title: t("profile.nutritionCard.carbsInfoTitle", "Carboidratos"),
      description: t(
        "profile.nutritionCard.carbsInfoDesc",
        "Carboidratos são a principal fonte de energia para o corpo e são cruciais para performance em treinos. Priorize fontes complexas como arroz integral, batata doce, aveia e frutas. A quantidade ideal varia conforme seus objetivos e nível de atividade física."
      ),
      icon: "bread-slice",
      iconType: "material",
      color: "#118AB2",
    },
    {
      title: t("profile.nutritionCard.fatInfoTitle", "Gorduras"),
      description: t(
        "profile.nutritionCard.fatInfoDesc",
        "Gorduras são essenciais para produção hormonal e absorção de vitaminas. Priorize gorduras saudáveis como azeite, abacate, oleaginosas e peixes gordurosos. Idealmente, as gorduras devem representar entre 20-35% das calorias diárias."
      ),
      icon: "oil",
      iconType: "material",
      color: "#FFD166",
    },
    {
      title: t("profile.nutritionCard.waterInfoTitle", "Água"),
      description: t(
        "profile.nutritionCard.waterInfoDesc",
        "A hidratação adequada é crucial para todos os processos corporais, incluindo recuperação muscular e performance. Recomenda-se consumir de 35-45ml por kg de peso corporal diariamente, aumentando em dias de treino intenso ou calor."
      ),
      icon: "water",
      iconType: "material",
      color: "#0096FF",
    },
    {
      title: t(
        "profile.nutritionCard.macrosBalanceTitle",
        "Distribuição de Macros"
      ),
      description: t(
        "profile.nutritionCard.macrosBalanceDesc",
        "O equilíbrio entre proteínas, carboidratos e gorduras é fundamental para atingir seus objetivos. Para hipertrofia, uma distribuição típica é 30% de proteínas, 40-50% de carboidratos e 20-30% de gorduras. Ajuste essa distribuição conforme seus resultados e necessidades específicas."
      ),
      icon: "chart-pie",
      iconType: "material",
      color: "#06D6A0",
    },
  ];

  // Renderizar o estado vazio (sem plano nutricional)
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconContainer,
          { backgroundColor: colors.primary + "10" },
        ]}
      >
        <MaterialCommunityIcons
          name="food-apple-outline"
          size={32}
          color={colors.primary}
        />
      </View>

      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {t("profile.nutritionCard.caloriesNotConfigured")}
      </Text>

      <Text style={[styles.emptyDescription, { color: colors.text + "80" }]}>
        {t("profile.nutritionCard.setupNutrition")}
      </Text>

      <TouchableOpacity
        style={[styles.setupButton, { backgroundColor: colors.text }]}
        onPress={handleSetupPress}
        activeOpacity={0.8}
      >
        <Text style={styles.setupButtonText}>
          {t("profile.nutritionCard.nutritionSetup")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Renderizar o cabeçalho com as calorias
  const renderCaloriesHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <MaterialCommunityIcons
            name="fire"
            size={18}
            color={colors.primary}
          />
        </View>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("profile.nutritionCard.nutritionPlan")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
            {t("profile.nutritionCard.dailyNeeds")}
          </Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        {isEditMode ? (
          <View style={styles.editButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.editActionButton,
                styles.cancelButton,
                { backgroundColor: colors.text + "10" },
              ]}
              onPress={handleCancelEdit}
            >
              <Ionicons name="close" size={20} color={colors.text + "80"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.editActionButton,
                styles.saveButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleSaveInlineEdit}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.infoButton,
                { backgroundColor: colors.text + "10" },
              ]}
              onPress={handleInfoPress}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.text + "80"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.customizeButton,
                { backgroundColor: colors.text + "10" },
              ]}
              onPress={handleCustomizePress}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={colors.text + "80"}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  // Renderizar os cards de estatísticas
  const renderStatsCards = () => (
    <>
      {/* Exibir erros de validação no topo */}
      {isEditMode && (
        <View style={styles.errorsContainer}>
          {caloriesError && <ErrorMessage message={caloriesError} />}
          {proteinError && <ErrorMessage message={proteinError} />}
          {carbsError && <ErrorMessage message={carbsError} />}
          {fatError && <ErrorMessage message={fatError} />}
          {waterIntakeError && <ErrorMessage message={waterIntakeError} />}
          {macrosError && <ErrorMessage message={macrosError} />}
        </View>
      )}

      {/* Card de Calorias (Grande, no topo) */}
      <View
        style={[
          styles.statCard,
          styles.caloriesCard,
          {
            backgroundColor: isEditMode
              ? "rgba(255,107,107,0.05)"
              : colors.card,
          },
        ]}
      >
        <View style={styles.statCardContent}>
          <View
            style={[styles.statIconContainer, { backgroundColor: "#FF6B6B15" }]}
          >
            <MaterialCommunityIcons name="fire" size={18} color="#FF1F02" />
          </View>
          <View style={styles.statTextContainer}>
            <Text
              style={[styles.statLabel, { color: colors.text }]}
              numberOfLines={1}
            >
              {t("profile.nutritionCard.calories")}
            </Text>
            <View style={styles.editInputContainer}>
              {isEditMode ? (
                <>
                  <TextInput
                    style={[
                      styles.editInput,
                      styles.caloriesInput,
                      { color: colors.text },
                      caloriesError ? styles.inputError : null,
                    ]}
                    value={editCalories}
                    onChangeText={(value) => {
                      setEditCalories(value);
                      validateCalories(value);
                    }}
                    keyboardType="numeric"
                    maxLength={5}
                    selectTextOnFocus
                  />
                  <Text
                    style={[styles.statUnit, { color: colors.text + "60" }]}
                  >
                    kcal
                  </Text>
                </>
              ) : (
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {nutritionInfo.calories}{" "}
                  <Text
                    style={[styles.statUnit, { color: colors.text + "60" }]}
                  >
                    kcal
                  </Text>
                </Text>
              )}
            </View>
          </View>
        </View>

        {isEditMode && (
          <>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.miniSlider}
                minimumValue={1200}
                maximumValue={4000}
                step={50}
                value={parseInt(editCalories) || nutritionInfo.calories || 2000}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const newCalories = Math.round(value);
                  setEditCalories(newCalories.toString());
                  validateCalories(newCalories.toString());

                  // Atualizar macros quando as calorias mudarem
                  updateMacrosWhenCaloriesChange(newCalories);
                }}
                minimumTrackTintColor="#FF1F02"
                maximumTrackTintColor={colors.border}
                thumbTintColor="#FF1F02"
              />
              <View style={styles.caloriesSliderLabels}>
                <Text
                  style={[styles.sliderLabel, { color: colors.text + "60" }]}
                >
                  1200
                </Text>
                <Text
                  style={[styles.sliderLabel, { color: colors.text + "60" }]}
                >
                  4000
                </Text>
              </View>
            </View>

            <View style={styles.totalIndicatorContainer}>
              <Text style={styles.totalIndicatorLabel}>
                {t("profile.nutritionCard.total")}:
              </Text>
              <Text
                style={[
                  styles.totalIndicatorValue,
                  isTotalValid() ? styles.totalValid : styles.totalInvalid,
                ]}
              >
                {Math.round(
                  proteinPercentage + carbsPercentage + fatPercentage
                )}
                %
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Grid 2x2 para Macros e Água */}
      <View style={styles.macroGridContainer}>
        {/* Proteína */}
        <View
          style={[
            styles.statCard,
            styles.gridCard,
            {
              backgroundColor: isEditMode
                ? "rgba(239,71,111,0.05)"
                : colors.card,
            },
          ]}
        >
          <View style={styles.statCardContent}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "#EF476F15" },
              ]}
            >
              <MaterialCommunityIcons
                name="food-steak"
                size={18}
                color="#EF476F"
              />
            </View>
            <View style={styles.statTextContainer}>
              <Text
                style={[styles.statLabel, { color: colors.text }]}
                numberOfLines={1}
              >
                {t("profile.nutritionCard.protein")}
              </Text>
              <View style={styles.editInputContainer}>
                {isEditMode ? (
                  <>
                    <TextInput
                      style={[
                        styles.editInput,
                        { color: colors.text },
                        proteinError ? styles.inputError : null,
                      ]}
                      value={editProtein}
                      onChangeText={(value) => {
                        setEditProtein(value);
                        validateProtein(value);
                      }}
                      keyboardType="numeric"
                      maxLength={3}
                      selectTextOnFocus
                    />
                    <Text
                      style={[styles.statUnit, { color: colors.text + "60" }]}
                    >
                      g
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {nutritionInfo.protein}
                    <Text
                      style={[styles.statUnit, { color: colors.text + "60" }]}
                    >
                      g
                    </Text>
                  </Text>
                )}
              </View>
            </View>
          </View>

          {isEditMode && (
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.miniSlider}
                minimumValue={5}
                maximumValue={70}
                step={1}
                value={proteinPercentage}
                onValueChange={(value) => {
                  adjustPercentages("protein", value);
                  validateMacrosDistribution();
                }}
                minimumTrackTintColor="#EF476F"
                maximumTrackTintColor={colors.border}
                thumbTintColor="#EF476F"
              />
              <View style={styles.percentageContainer}>
                <Text style={[styles.percentageText, { color: "#EF476F" }]}>
                  {Math.round(proteinPercentage)}%
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Carboidratos */}
        <View
          style={[
            styles.statCard,
            styles.gridCard,
            {
              backgroundColor: isEditMode
                ? "rgba(17,138,178,0.05)"
                : colors.card,
            },
          ]}
        >
          <View style={styles.statCardContent}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "#118AB215" },
              ]}
            >
              <MaterialCommunityIcons
                name="bread-slice"
                size={18}
                color="#118AB2"
              />
            </View>
            <View style={styles.statTextContainer}>
              <Text
                style={[styles.statLabel, { color: colors.text }]}
                numberOfLines={1}
              >
                {t("profile.nutritionCard.carbs")}
              </Text>
              <View style={styles.editInputContainer}>
                {isEditMode ? (
                  <>
                    <TextInput
                      style={[
                        styles.editInput,
                        { color: colors.text },
                        carbsError ? styles.inputError : null,
                      ]}
                      value={editCarbs}
                      onChangeText={(value) => {
                        setEditCarbs(value);
                        validateCarbs(value);
                      }}
                      keyboardType="numeric"
                      maxLength={3}
                      selectTextOnFocus
                    />
                    <Text
                      style={[styles.statUnit, { color: colors.text + "60" }]}
                    >
                      g
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {nutritionInfo.carbs}
                    <Text
                      style={[styles.statUnit, { color: colors.text + "60" }]}
                    >
                      g
                    </Text>
                  </Text>
                )}
              </View>
            </View>
          </View>

          {isEditMode && (
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.miniSlider}
                minimumValue={5}
                maximumValue={70}
                step={1}
                value={carbsPercentage}
                onValueChange={(value) => {
                  adjustPercentages("carbs", value);
                  validateMacrosDistribution();
                }}
                minimumTrackTintColor="#118AB2"
                maximumTrackTintColor={colors.border}
                thumbTintColor="#118AB2"
              />
              <View style={styles.percentageContainer}>
                <Text style={[styles.percentageText, { color: "#118AB2" }]}>
                  {Math.round(carbsPercentage)}%
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Gorduras */}
        <View
          style={[
            styles.statCard,
            styles.gridCard,
            {
              backgroundColor: isEditMode
                ? "rgba(255,209,102,0.05)"
                : colors.card,
            },
          ]}
        >
          <View style={styles.statCardContent}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "#FFD16615" },
              ]}
            >
              <MaterialCommunityIcons name="oil" size={18} color="#FFD166" />
            </View>
            <View style={styles.statTextContainer}>
              <Text
                style={[styles.statLabel, { color: colors.text }]}
                numberOfLines={1}
              >
                {t("profile.nutritionCard.fat")}
              </Text>
              <View style={styles.editInputContainer}>
                {isEditMode ? (
                  <>
                    <TextInput
                      style={[
                        styles.editInput,
                        { color: colors.text },
                        fatError ? styles.inputError : null,
                      ]}
                      value={editFat}
                      onChangeText={(value) => {
                        setEditFat(value);
                        validateFat(value);
                      }}
                      keyboardType="numeric"
                      maxLength={3}
                      selectTextOnFocus
                    />
                    <Text
                      style={[styles.statUnit, { color: colors.text + "60" }]}
                    >
                      g
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {nutritionInfo.fat}
                    <Text
                      style={[styles.statUnit, { color: colors.text + "60" }]}
                    >
                      g
                    </Text>
                  </Text>
                )}
              </View>
            </View>
          </View>

          {isEditMode && (
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.miniSlider}
                minimumValue={5}
                maximumValue={70}
                step={1}
                value={fatPercentage}
                onValueChange={(value) => {
                  adjustPercentages("fat", value);
                  validateMacrosDistribution();
                }}
                minimumTrackTintColor="#FFD166"
                maximumTrackTintColor={colors.border}
                thumbTintColor="#FFD166"
              />
              <View style={styles.percentageContainer}>
                <Text style={[styles.percentageText, { color: "#FFD166" }]}>
                  {Math.round(fatPercentage)}%
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Água */}
        <View
          style={[
            styles.statCard,
            styles.gridCard,
            {
              backgroundColor: isEditMode
                ? "rgba(0,150,255,0.05)"
                : colors.card,
            },
          ]}
        >
          <View style={styles.statCardContent}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "#0096FF15" },
              ]}
            >
              <MaterialCommunityIcons name="water" size={18} color="#0096FF" />
            </View>
            <View style={styles.statTextContainer}>
              <Text
                style={[styles.statLabel, { color: colors.text }]}
                numberOfLines={1}
              >
                {t("common.nutrition.water")}
              </Text>
              <View style={styles.editInputContainer}>
                {isEditMode ? (
                  <>
                    <TextInput
                      style={[
                        styles.editInput,
                        { color: colors.text },
                        waterIntakeError ? styles.inputError : null,
                      ]}
                      value={editWaterIntake}
                      onChangeText={(value) => {
                        setEditWaterIntake(value);
                        validateWaterIntake(value);
                      }}
                      keyboardType="numeric"
                      maxLength={5}
                      selectTextOnFocus
                    />
                    <Text
                      style={[styles.statUnit, { color: colors.text + "60" }]}
                    >
                      ml
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {nutritionInfo.waterIntake
                      ? (nutritionInfo.waterIntake / 1000).toFixed(1)
                      : "2.0"}
                    <Text
                      style={[styles.statUnit, { color: colors.text + "60" }]}
                    >
                      L
                    </Text>
                  </Text>
                )}
              </View>
            </View>
          </View>

          {isEditMode && (
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.miniSlider}
                minimumValue={1000}
                maximumValue={6000}
                step={100}
                value={
                  parseInt(editWaterIntake) || nutritionInfo.waterIntake || 2000
                }
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEditWaterIntake(Math.round(value).toString());
                  validateWaterIntake(Math.round(value).toString());
                }}
                minimumTrackTintColor="#0096FF"
                maximumTrackTintColor={colors.border}
                thumbTintColor="#0096FF"
              />
              <View style={styles.percentageContainer}>
                <Text style={[styles.percentageText, { color: "#0096FF" }]}>
                  {parseFloat((parseInt(editWaterIntake) / 1000).toFixed(1))}L
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </>
  );

  // Renderizar os detalhes dos macronutrientes
  const renderNutrientDetails = () => (
    <View style={styles.nutrientDetailsContainer}>
      {/* Proteína */}
      <View
        style={[styles.nutrientDetailCard, { backgroundColor: colors.card }]}
      >
        <View
          style={[
            styles.nutrientIconContainer,
            { backgroundColor: "#FF6B6B15" },
          ]}
        >
          <MaterialCommunityIcons name="food-steak" size={20} color="#FF6B6B" />
        </View>
        <Text style={[styles.nutrientDetailValue, { color: colors.text }]}>
          {nutritionInfo.protein}g
        </Text>
        <Text
          style={[styles.nutrientDetailLabel, { color: colors.text + "70" }]}
        >
          Proteína
        </Text>
      </View>

      {/* Carboidratos */}
      <View
        style={[styles.nutrientDetailCard, { backgroundColor: colors.text }]}
      >
        <View
          style={[
            styles.nutrientIconContainer,
            { backgroundColor: "#4ECDC415" },
          ]}
        >
          <MaterialCommunityIcons
            name="bread-slice"
            size={20}
            color="#4ECDC4"
          />
        </View>
        <Text style={[styles.nutrientDetailValue, { color: colors.text }]}>
          {nutritionInfo.carbs}g
        </Text>
        <Text
          style={[styles.nutrientDetailLabel, { color: colors.text + "70" }]}
        >
          Carboidratos
        </Text>
      </View>

      {/* Gorduras */}
      <View
        style={[styles.nutrientDetailCard, { backgroundColor: colors.card }]}
      >
        <View
          style={[
            styles.nutrientIconContainer,
            { backgroundColor: "#FFD16615" },
          ]}
        >
          <MaterialCommunityIcons name="oil" size={20} color="#FFD166" />
        </View>
        <Text style={[styles.nutrientDetailValue, { color: colors.text }]}>
          {nutritionInfo.fat}g
        </Text>
        <Text
          style={[styles.nutrientDetailLabel, { color: colors.text + "70" }]}
        >
          Gorduras
        </Text>
      </View>
    </View>
  );

  // Renderizar informações de refeições
  const renderMealsInfo = () =>
    nutritionInfo.meals ? (
      <View style={styles.mealsInfoContainer}>
        <View
          style={[
            styles.mealsInfoIconContainer,
            { backgroundColor: "#FFD16615" },
          ]}
        >
          <Ionicons name="restaurant-outline" size={18} color="#FFD166" />
        </View>
        <View style={styles.mealsInfoTextContainer}>
          <Text style={[styles.mealsInfoLabel, { color: colors.text + "70" }]}>
            Refeições Recomendadas
          </Text>
          <Text style={[styles.mealsInfoValue, { color: colors.text }]}>
            {nutritionInfo.meals} por dia
          </Text>
        </View>
      </View>
    ) : null;

  return (
    <>
      <TouchableOpacity
        style={styles.touchable}
        activeOpacity={0.9}
        disabled={!hasNutritionInfo || isEditMode}
      >
        <View
          style={[
            styles.container,
            { backgroundColor: colors.light },
            isEditMode && styles.editModeContainer,
          ]}
        >
          {!hasNutritionInfo ? (
            renderEmptyState()
          ) : (
            <View
              style={[
                styles.contentContainer,
                isEditMode && styles.editModeContentContainer,
              ]}
            >
              {renderCaloriesHeader()}
              {renderStatsCards()}
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Modal Informativo */}
      <InfoModal
        visible={isInfoModalVisible}
        title={t(
          "profile.nutritionCard.nutritionInfoTitle",
          "Guia Nutricional"
        )}
        subtitle={t(
          "profile.nutritionCard.nutritionInfoSubtitle",
          "Entenda como cada componente nutricional afeta seu corpo e performance. Use estas informações para otimizar sua alimentação de acordo com seus objetivos."
        )}
        infoItems={nutritionInfoItems}
        onClose={handleCloseInfoModal}
        closeButtonText={t("common.gotIt", "Entendi")}
        topIcon={{
          name: "nutrition",
          type: "material",
          color: colors.primary,
          backgroundColor: colors.primary + "20",
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleContainer: {
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
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  customizeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "column",
    marginBottom: 16,
  },
  statCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  caloriesCard: {
    width: "100%",
    marginBottom: 16,
  },
  macroGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridCard: {
    width: "48%",
    marginBottom: 12,
  },
  statCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  statUnit: {
    fontSize: 12,
    fontWeight: "500",
  },
  // Estilos para o estado vazio
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  setupButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  setupButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  // Estilos para os detalhes dos nutrientes
  nutrientDetailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  nutrientDetailCard: {
    width: "23%",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  nutrientIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  nutrientDetailValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  nutrientDetailLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: "center",
  },
  // Estilos para informações de refeições
  mealsInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 4,
  },
  mealsInfoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  mealsInfoTextContainer: {
    flex: 1,
  },
  mealsInfoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  mealsInfoValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  touchable: {
    // Add any necessary styles for the TouchableOpacity
  },
  // Novos estilos para edição inline
  editInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  editInput: {
    fontSize: 16,
    fontWeight: "700",
    padding: 0,
    minWidth: 40,
    maxWidth: 60,
  },
  caloriesInput: {
    minWidth: 60,
    maxWidth: 80,
  },
  macroEditContainer: {
    width: "100%",
  },
  miniSlider: {
    height: 20,
    width: "100%",
    marginTop: 8,
    marginBottom: 2,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  percentageContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalWarning: {
    fontSize: 10,
    color: "#FF6B6B",
    fontWeight: "500",
  },
  totalIndicatorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  totalIndicatorLabel: {
    fontSize: 11,
    color: "#888",
  },
  totalIndicatorValue: {
    fontSize: 11,
    fontWeight: "600",
  },
  totalValid: {
    color: "#06D6A0",
  },
  totalInvalid: {
    color: "#FF6B6B",
  },
  editButtonsContainer: {
    flexDirection: "row",
  },
  editActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  cancelButton: {
    marginRight: 4,
  },
  saveButton: {
    // Estilo específico para o botão de salvar
  },
  editModeContainer: {
    borderRadius: 16,
    shadowOpacity: 0.05,
    elevation: 3,
    marginHorizontal: 12,
  },
  editModeContentContainer: {
    padding: 12,
    paddingTop: 10,
    paddingBottom: 16,
  },
  sliderContainer: {
    width: "100%",
    marginTop: 8,
  },
  inputError: {
    borderBottomWidth: 1,
    borderBottomColor: "#FF4757",
  },
  errorsContainer: {
    marginBottom: 12,
  },
  caloriesSliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionButtonsContainer: {
    flexDirection: "row",
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
});
