import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  BackHandler,
  Platform,
} from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useNutrition } from "../../context/NutritionContext";
import { useAuth } from "../../context/AuthContext";
import { OfflineStorage } from "../../services/OfflineStorage";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import Svg, { Circle } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";

const screenWidth = Dimensions.get("window").width;

export default function SummaryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const {
    nutritionInfo,
    completeOnboarding,
    calculateMacros,
    resetNutritionInfo,
    updateNutritionInfo,
  } = useNutrition();
  const { isAnonymous } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});

  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

  useEffect(() => {
    // Log para debug do estado atual
   

    // Se a taxa de mudança for 0, o objetivo deve ser "maintain"
    if (
      nutritionInfo.weightChangeRate === 0 &&
      nutritionInfo.goal !== "maintain"
    ) {
   
      return; // Evitar cálculos adicionais, pois o efeito será acionado novamente
    }

    // Se o objetivo for manter o peso, garantir que a taxa de mudança seja 0
    if (
      nutritionInfo.goal === "maintain" &&
      nutritionInfo.weightChangeRate !== 0
    ) {
    
      return; // Evitar cálculos adicionais, pois o efeito será acionado novamente
    }

    // Calcular os macros
    calculateMacros();
  }, [
    nutritionInfo.goal,
    nutritionInfo.weightChangeRate,
    nutritionInfo.weight,
    nutritionInfo.targetWeight,
  ]);

  // Impedir o gesto de voltar no iOS
  useEffect(() => {
    if (Platform.OS === "ios") {
      navigation.setOptions({
        gestureEnabled: false,
      });
    }

    // Impedir o botão de voltar no Android
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        return true; // Retorna true para impedir a navegação para trás
      }
    );

    return () => backHandler.remove();
  }, [navigation]);

  // Garantir que os macros sejam calculados quando a tela for carregada
  useEffect(() => {
    // Tentar calcular os macros novamente se não houver dados
    if (
      !nutritionInfo.calories ||
      !nutritionInfo.protein ||
      !nutritionInfo.carbs ||
      !nutritionInfo.fat
    ) {
      try {
        calculateMacros();
      } catch (error) {}
    }
  }, [nutritionInfo]);

  const handleStart = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading(true);
      setError("");
      await completeOnboarding();

      // Se o usuário estiver em modo anônimo, limpar dados e redirecionar para registro
      if (isAnonymous) {
        // Salvar temporariamente os dados atuais
        const currentData = { ...nutritionInfo };

        // Limpar os dados
        await resetNutritionInfo();

        // Armazenar temporariamente os dados para uso posterior
        await OfflineStorage.saveTemporaryNutritionData(currentData);

        router.replace("/onboarding/complete-registration");
      } else {
        router.replace("/(tabs)");
      }
    } catch (err) {
      setError("Ocorreu um erro ao salvar suas informações. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const formatTargetDate = () => {
    if (!nutritionInfo.targetDate) return "";
    return nutritionInfo.targetDate instanceof Date
      ? nutritionInfo.targetDate.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : typeof nutritionInfo.targetDate === "string"
      ? new Date(nutritionInfo.targetDate).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "";
  };

  const getGoalText = () => {
    // Se a taxa de mudança for 0, independente do que estiver no estado, considerar como "maintain"
    if (nutritionInfo.weightChangeRate === 0) {
      return t("common.goals.maintain");
    }

    switch (nutritionInfo.goal) {
      case "lose":
        return t("common.goals.lose");
      case "maintain":
        return t("common.goals.maintain");
      case "gain":
        return t("common.goals.gain");
      default:
        return "";
    }
  };

  const getGoalIcon = () => {
    // Se a taxa de mudança for 0, usar o ícone de manutenção
    if (nutritionInfo.weightChangeRate === 0) {
      return "reorder-two";
    }

    switch (nutritionInfo.goal) {
      case "lose":
        return "trending-down";
      case "maintain":
        return "reorder-two";
      case "gain":
        return "trending-up";
      default:
        return "help-circle";
    }
  };

  const getDietTypeText = () => {
    switch (nutritionInfo.dietType) {
      case "classic":
        return "Clássica";
      case "vegetarian":
        return "Vegetariana";
      case "vegan":
        return "Vegana";
      case "pescatarian":
        return "Pescetariana";
      default:
        return "";
    }
  };

  const getActivityLevelText = () => {
    switch (nutritionInfo.trainingFrequency) {
      case "sedentary":
        return t("common.activityLevels.sedentary");
      case "light":
        return t("common.activityLevels.light");
      case "moderate":
        return t("common.activityLevels.moderate");
      case "intense":
        return t("common.activityLevels.intense");
      case "athlete":
        return t("common.activityLevels.athlete");
      default:
        return "";
    }
  };

  const formatNumber = (num: number | undefined) => {
    if (!num) return "0";
    // Arredondar para o número inteiro para evitar problemas de exibição
    return Math.round(num).toString();
  };

  const calculateMacroPercentage = (macroCalories: number) => {
    if (!nutritionInfo.calories) return 0;
    // Arredondar para o número inteiro mais próximo para evitar problemas de exibição
    return Math.round((macroCalories / nutritionInfo.calories) * 100);
  };

  const getMacroCalories = {
    protein: (nutritionInfo.protein || 0) * 4,
    carbs: (nutritionInfo.carbs || 0) * 4,
    fat: (nutritionInfo.fat || 0) * 9,
  };

  const macroPercentages = {
    protein: calculateMacroPercentage(getMacroCalories.protein),
    carbs: calculateMacroPercentage(getMacroCalories.carbs),
    fat: calculateMacroPercentage(getMacroCalories.fat),
  };

  const getGoalChipColor = () => {
    // Se a taxa de mudança for 0, usar a cor de manutenção
    if (nutritionInfo.weightChangeRate === 0) {
      return "#06D6A0"; // Verde para manutenção
    }

    switch (nutritionInfo.goal) {
      case "lose":
        return "#EF476F"; // Vermelho para perda de peso
      case "maintain":
        return "#06D6A0"; // Verde para manutenção
      case "gain":
        return "#118AB2"; // Azul para ganho
      default:
        return colors.primary;
    }
  };

  // Componente de círculo de progresso para métricas (similar ao do ConsistencyScoreCard)
  const CircularProgress = ({
    percentage,
    color,
    size = 36,
    iconName,
  }: {
    percentage: number;
    color: string;
    size?: number;
    iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  }) => {
    const strokeWidth = size * 0.1;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const iconSize = size * 0.45;

    return (
      <View
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Background Circle */}
        <Svg width={size} height={size} style={{ position: "absolute" }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color + "20"}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
        </Svg>

        {/* Progress Circle */}
        <MotiView
          from={{ opacity: 0, rotate: "0deg" }}
          animate={{ opacity: 1, rotate: "360deg" }}
          transition={{
            type: "timing",
            duration: 1000,
            rotate: {
              type: "spring",
              damping: 20,
            },
          }}
          style={{ position: "absolute" }}
        >
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </Svg>
        </MotiView>

        {/* Ícone centralizado */}
        <MotiView
          from={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            delay: 200,
            damping: 15,
          }}
        >
          <MaterialCommunityIcons
            name={iconName}
            size={iconSize}
            color={color}
          />
        </MotiView>
      </View>
    );
  };

  return (
    <SafeAreaView
      key={`summary-container-${theme}`}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        key={`summary-scroll-${theme}`}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <MotiView
          key={`header-${theme}`}
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "timing",
            duration: 600,
            delay: 100,
          }}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t("summary.title")}
          </Text>
        </MotiView>

        {/* Cards do Topo em Row */}
        <MotiView
          key={`top-cards-row-${theme}`}
          style={styles.topCardsRow}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "timing",
            duration: 600,
            delay: 200,
          }}
        >
          {/* Card Unificado de Perfil e Objetivo */}
          <MotiView
            key={`profile-goal-card-${theme}`}
            style={[
              styles.unifiedProfileGoalCard,
              {
                borderColor: colors.border,
                borderWidth: 1,
                overflow: "hidden",
              },
            ]}
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              delay: 300,
              damping: 15,
            }}
          >
            <LinearGradient
              colors={
                theme === "dark"
                  ? [colors.light, colors.background] // Gradiente do card escuro para o fundo escuro
                  : [colors.light, colors.border] // Gradiente do card claro para a borda clara
              }
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Cabeçalho do Card */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {t("summary.profile.title")}
                  </Text>
                  <Text
                    style={[styles.subtitle, { color: colors.text + "80" }]}
                  >
                    {t("summary.profile.subtitle")}
                  </Text>
                </View>
              </View>
            </View>

            {/* Grid de Métricas */}
            <View style={styles.profileGridContainer}>
              {/* Altura */}
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: "timing",
                  duration: 400,
                  delay: 350,
                }}
                style={[
                  styles.statCard,
                  styles.gridCard,
                  { backgroundColor: colors.card },
                ]}
              >
                <View style={styles.statCardContent}>
                  <View
                    style={[
                      styles.statIconContainer,
                      { backgroundColor: "#0765FF15" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="human-male-height"
                      size={18}
                      color="#0765FF"
                    />
                  </View>
                  <View style={styles.statTextContainer}>
                    <Text
                      style={[styles.statLabel, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {t("common.measurements.height")}
                    </Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {nutritionInfo.height}
                      <Text
                        style={[styles.statUnit, { color: colors.text + "60" }]}
                      >
                        {t("common.measurements.cm")}
                      </Text>
                    </Text>
                  </View>
                </View>
              </MotiView>

              {/* Peso */}
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: "timing",
                  duration: 400,
                  delay: 400,
                }}
                style={[
                  styles.statCard,
                  styles.gridCard,
                  { backgroundColor: colors.card },
                ]}
              >
                <View style={styles.statCardContent}>
                  <View
                    style={[
                      styles.statIconContainer,
                      { backgroundColor: "#FFD16615" },
                    ]}
                  >
                    <Ionicons name="scale-outline" size={18} color="#FFD166" />
                  </View>
                  <View style={styles.statTextContainer}>
                    <Text
                      style={[styles.statLabel, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {t("common.measurements.weight")}
                    </Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {nutritionInfo.weight}
                      <Text
                        style={[styles.statUnit, { color: colors.text + "60" }]}
                      >
                        {t("common.measurements.kg")}
                      </Text>
                    </Text>
                  </View>
                </View>
              </MotiView>

              {/* Objetivo */}
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: "timing",
                  duration: 400,
                  delay: 450,
                }}
                style={[
                  styles.statCard,
                  styles.gridCard,
                  { backgroundColor: colors.card },
                ]}
              >
                <View style={styles.statCardContent}>
                  <View
                    style={[
                      styles.statIconContainer,
                      { backgroundColor: "#EF476F15" },
                    ]}
                  >
                    <Ionicons name={getGoalIcon()} size={18} color="#EF476F" />
                  </View>
                  <View style={styles.statTextContainer}>
                    <Text
                      style={[styles.statLabel, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {t("common.goals.title")}
                    </Text>
                    <Text
                      style={[styles.statValue, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {getGoalText()}
                    </Text>
                  </View>
                </View>
              </MotiView>

              {/* Peso Alvo ou Atividade Física */}
              {nutritionInfo.goal !== "maintain" ? (
                <MotiView
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: "timing",
                    duration: 400,
                    delay: 500,
                  }}
                  style={[
                    styles.statCard,
                    styles.gridCard,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <View style={styles.statCardContent}>
                    <View
                      style={[
                        styles.statIconContainer,
                        { backgroundColor: "#FF702515" },
                      ]}
                    >
                      <Ionicons name="flag-outline" size={18} color="#FF7025" />
                    </View>
                    <View style={styles.statTextContainer}>
                      <Text
                        style={[styles.statLabel, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {t("common.goals.targetWeight")}
                      </Text>
                      <Text
                        style={[styles.statValue, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {nutritionInfo.targetWeight}
                        <Text
                          style={[
                            styles.statUnit,
                            { color: colors.text + "60" },
                          ]}
                        >
                          {t("common.measurements.kg")}
                        </Text>
                      </Text>
                    </View>
                  </View>
                </MotiView>
              ) : (
                <MotiView
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: "timing",
                    duration: 400,
                    delay: 500,
                  }}
                  style={[
                    styles.statCard,
                    styles.gridCard,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <View style={styles.statCardContent}>
                    <View
                      style={[
                        styles.statIconContainer,
                        { backgroundColor: "#06D6A015" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="run"
                        size={18}
                        color="#06D6A0"
                      />
                    </View>
                    <View style={styles.statTextContainer}>
                      <Text
                        style={[styles.statLabel, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {t("common.activityLevel")}
                      </Text>
                      <Text
                        style={[styles.statValue, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {getActivityLevelText()}
                      </Text>
                    </View>
                  </View>
                </MotiView>
              )}
            </View>
          </MotiView>
        </MotiView>

        {/* Seção de Macros */}
        <MotiView
          key={`macros-container-${theme}`}
          style={styles.macrosContainer}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "timing",
            duration: 600,
            delay: 400,
          }}
        >
          {/* Card Unificado de Calorias, Macros e Água */}
          <MotiView
            key={`unified-nutrition-card-${theme}`}
            style={[
              styles.unifiedNutritionCard,
              {
                borderColor: colors.border,
                borderWidth: 1,
                overflow: "hidden",
              },
            ]}
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              delay: 500,
              damping: 15,
            }}
          >
            <LinearGradient
              colors={
                theme === "dark"
                  ? [colors.light, colors.background] // Gradiente do card escuro para o fundo escuro
                  : [colors.light, colors.border] // Gradiente do card claro para a borda clara
              }
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Cabeçalho do Card Nutricional */}
            <View
              style={[styles.header, { paddingTop: 16, paddingHorizontal: 16 }]}
            >
              <View style={styles.titleContainer}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="nutrition"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {t("summary.dailyNeeds.title")}
                  </Text>
                  <Text
                    style={[styles.subtitle, { color: colors.text + "80" }]}
                  >
                    {t("summary.dailyNeeds.subtitle")}
                  </Text>
                </View>
              </View>
            </View>

            {/* Card de Calorias (Maior e no topo) */}
            <View style={{ padding: 16, paddingTop: 8 }}>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <View
                    style={[
                      styles.statIconContainer,
                      {
                        backgroundColor: "#FF1F0215",
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="fire"
                      size={24}
                      color="#FF1F02"
                    />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: colors.text, fontSize: 14 },
                      ]}
                    >
                      {t("summary.dailyNeeds.calories.title")}
                    </Text>
                    <Text
                      style={[
                        styles.statValue,
                        { color: colors.text, fontSize: 24, fontWeight: "700" },
                      ]}
                    >
                      {formatNumber(nutritionInfo.calories)}
                      <Text
                        style={[
                          styles.statUnit,
                          { color: colors.text + "60", fontSize: 14 },
                        ]}
                      >
                        {" "}
                        {t("common.nutrition.kcal")}
                      </Text>
                    </Text>
                  </View>
                </View>

                {/* Chip colorido baseado no objetivo */}
                <View
                  style={{
                    backgroundColor: getGoalChipColor() + "20",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    alignSelf: "flex-start",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name={getGoalIcon()}
                      size={12}
                      color={getGoalChipColor()}
                      style={{ marginRight: 2 }}
                    />
                    <Text
                      style={{
                        color: getGoalChipColor(),
                        fontSize: 10,
                        fontWeight: "600",
                      }}
                    >
                      {nutritionInfo.weightChangeRate === 0
                        ? t("common.goals.maintain")
                        : nutritionInfo.goal === "lose"
                        ? t("common.goals.lose")
                        : nutritionInfo.goal === "gain"
                        ? t("common.goals.gain")
                        : t("common.goals.maintain")}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Separador */}
            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginHorizontal: 16,
              }}
            />

            {/* Seção de Macros */}
            <View key={`macros-section-${theme}`} style={styles.macrosSection}>
              {/* Grid de Métricas */}
              <View style={styles.macroGridContainer}>
                {/* Proteína */}
                <MotiView
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: "timing",
                    duration: 400,
                    delay: 550,
                  }}
                  style={[
                    styles.statCard,
                    styles.gridCard,
                    { backgroundColor: colors.card },
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
                        {t("common.nutrition.protein")}
                      </Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {formatNumber(nutritionInfo.protein)}
                        <Text
                          style={[
                            styles.statUnit,
                            { color: colors.text + "60" },
                          ]}
                        >
                          g
                        </Text>
                      </Text>
                    </View>
                  </View>
                </MotiView>

                {/* Carboidratos */}
                <MotiView
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: "timing",
                    duration: 400,
                    delay: 600,
                  }}
                  style={[
                    styles.statCard,
                    styles.gridCard,
                    { backgroundColor: colors.card },
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
                        {t("common.nutrition.carbs")}
                      </Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {formatNumber(nutritionInfo.carbs)}
                        <Text
                          style={[
                            styles.statUnit,
                            { color: colors.text + "60" },
                          ]}
                        >
                          g
                        </Text>
                      </Text>
                    </View>
                  </View>
                </MotiView>

                {/* Gorduras */}
                <MotiView
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: "timing",
                    duration: 400,
                    delay: 650,
                  }}
                  style={[
                    styles.statCard,
                    styles.gridCard,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <View style={styles.statCardContent}>
                    <View
                      style={[
                        styles.statIconContainer,
                        { backgroundColor: "#FFD16615" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="oil"
                        size={18}
                        color="#FFD166"
                      />
                    </View>
                    <View style={styles.statTextContainer}>
                      <Text
                        style={[styles.statLabel, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {t("common.nutrition.fat")}
                      </Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {formatNumber(nutritionInfo.fat)}
                        <Text
                          style={[
                            styles.statUnit,
                            { color: colors.text + "60" },
                          ]}
                        >
                          g
                        </Text>
                      </Text>
                    </View>
                  </View>
                </MotiView>

                {/* Água */}
                <MotiView
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: "timing",
                    duration: 400,
                    delay: 700,
                  }}
                  style={[
                    styles.statCard,
                    styles.gridCard,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <View style={styles.statCardContent}>
                    <View
                      style={[
                        styles.statIconContainer,
                        { backgroundColor: "#0096FF15" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="water"
                        size={18}
                        color="#0096FF"
                      />
                    </View>
                    <View style={styles.statTextContainer}>
                      <Text
                        style={[styles.statLabel, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {t("common.nutrition.water")}
                      </Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {nutritionInfo.waterIntake
                          ? (nutritionInfo.waterIntake / 1000).toFixed(1)
                          : "0"}
                        <Text
                          style={[
                            styles.statUnit,
                            { color: colors.text + "60" },
                          ]}
                        >
                          L
                        </Text>
                      </Text>
                    </View>
                  </View>
                </MotiView>
              </View>
            </View>
          </MotiView>
        </MotiView>

        {/* Informações Adicionais */}
        <MotiView
          key={`info-card-${theme}`}
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.light,
              borderColor: colors.border,
              borderWidth: 1,
              overflow: "hidden",
            },
          ]}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "timing",
            duration: 600,
            delay: 600,
          }}
        >
          <Ionicons
            key={`info-icon-${theme}`}
            name="information-circle-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {t("summary.info")}
          </Text>
        </MotiView>

        {error && (
          <MotiView
            key={`error-container-${theme}`}
            style={[
              styles.errorContainer,
              {
                borderColor: colors.danger,
                borderWidth: 1,
                backgroundColor: "rgba(255, 0, 0, 0.05)",
              },
            ]}
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring" }}
          >
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {t("summary.error")}
            </Text>
          </MotiView>
        )}
      </ScrollView>

      <MotiView
        key={`footer-${theme}`}
        style={styles.footer}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          type: "timing",
          duration: 600,
          delay: 700,
        }}
      >
        {/* Efeito de brilho no modo escuro */}
        {theme === "dark" && (
          <MotiView
            style={{
              position: "absolute",
              width: "100%",
              height: 70,
              borderRadius: 35,
              backgroundColor: `${colors.primary}15`,
              transform: [{ scale: 1.05 }],
              top: 19,
              alignSelf: "center",
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 10,
            }}
            from={{ opacity: 0.3 }}
            animate={{ opacity: 0.5 }}
            transition={{
              type: "timing",
              duration: 2000,
              loop: true,
              repeatReverse: true,
            }}
          />
        )}

        <TouchableOpacity
          key={`start-button-${theme}`}
          style={[
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: loading ? 0.7 : 1,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: theme === "dark" ? 0.4 : 0.3,
              shadowRadius: theme === "dark" ? 10 : 15,
              elevation: theme === "dark" ? 10 : 15,
              // Adicionar um brilho externo no modo escuro com gradiente
              ...(theme === "dark" && {
                borderWidth: 1,
                borderColor: `${colors.primary}40`,
              }),
            },
          ]}
          onPress={handleStart}
          disabled={loading}
          activeOpacity={0.6}
        >
          {loading ? (
            <ActivityIndicator
              color={theme === "dark" ? "black" : "white"}
              size="small"
            />
          ) : (
            <>
              {theme === "dark" && (
                <MotiView
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    borderRadius: 30,
                    backgroundColor: `${colors.primary}15`,
                    zIndex: -1,
                  }}
                  from={{ opacity: 0.3, scale: 0.95 }}
                  animate={{ opacity: 0.5, scale: 1 }}
                  transition={{
                    type: "timing",
                    duration: 1500,
                    loop: true,
                    repeatReverse: true,
                  }}
                />
              )}
              <Text
                style={{
                  color: theme === "dark" ? "black" : "white",
                  fontSize: 20,
                  fontWeight: "800",
                  textAlign: "center",
                  letterSpacing: 0.5,
                  // Adicionar sombra ao texto para melhor contraste
                  textShadowColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.3)",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                }}
              >
                {t("summary.startJourney")}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </MotiView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
    letterSpacing: -0.5,
    fontFamily: "Anton-Regular",
    textTransform: "uppercase",
  },
  topCardsRow: {
    marginBottom: 24,
  },
  unifiedProfileGoalCard: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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
  profileGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  macrosContainer: {
    gap: 16,
  },
  unifiedNutritionCard: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  caloriesSection: {
    padding: 16,
    paddingBottom: 12,
  },
  caloriesMacrosDivider: {
    height: 1,
    width: "100%",
    marginVertical: 0,
  },
  macrosSection: {
    padding: 16,
    paddingTop: 16,
  },
  macrosSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  caloriesContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  caloriesInfo: {
    flex: 1,
  },
  caloriesTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  caloriesValue: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  caloriesUnit: {
    fontSize: 12,
    fontWeight: "500",
  },
  caloriesDesc: {
    fontSize: 12,
    opacity: 0.7,
    lineHeight: 16,
  },
  macroGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  infoCard: {
    flexDirection: "row",
    padding: 18,
    borderRadius: 20,
    marginTop: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  errorContainer: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
  },
  errorText: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 8 : 0,
  },
  button: {
    width: "100%",
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
