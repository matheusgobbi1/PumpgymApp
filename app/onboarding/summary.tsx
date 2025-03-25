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
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import Button from "../../components/common/Button";
import { useNutrition } from "../../context/NutritionContext";
import { useAuth } from "../../context/AuthContext";
import CircularProgress from "react-native-circular-progress-indicator";
import { OfflineStorage } from "../../services/OfflineStorage";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";

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
    calculateMacros();
  }, []);

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
      } catch (error) {
        console.error("Erro ao calcular macros na tela de resumo:", error);
      }
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
      console.error("Erro ao salvar informações:", err);
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
          from={{ opacity: 0, translateY: -30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t("summary.title")}
          </Text>
        </MotiView>

        {/* Cards do Topo em Row */}
        <MotiView
          key={`top-cards-row-${theme}`}
          style={styles.topCardsRow}
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 15, delay: 200 }}
        >
          {/* Card de Perfil */}
          <MotiView
            key={`profile-card-${theme}`}
            style={[
              styles.profileCard,
              {
                backgroundColor: theme === "dark" ? colors.dark : colors.light,
                borderColor: "transparent",
                borderWidth: 0,
                overflow: "hidden",
              },
            ]}
            from={{ opacity: 0, translateX: -30 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "spring", damping: 15, delay: 300 }}
          >
            <Text style={[styles.cardLabel, { color: colors.text }]}>
              {t("summary.profile.title")}
            </Text>
            <View
              key={`measurement-row-${theme}`}
              style={styles.measurementRow}
            >
              <View key={`height-item-${theme}`} style={styles.measurementItem}>
                <Ionicons
                  key={`height-icon-${theme}`}
                  name="body-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.measurementText, { color: colors.text }]}>
                  {nutritionInfo.height}
                  {t("common.measurements.cm")}
                </Text>
              </View>
              <View
                key={`divider-${theme}`}
                style={[
                  styles.measurementDivider,
                  {
                    backgroundColor:
                      theme === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                  },
                ]}
              />
              <View key={`weight-item-${theme}`} style={styles.measurementItem}>
                <Ionicons
                  key={`weight-icon-${theme}`}
                  name="scale-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.measurementText, { color: colors.text }]}>
                  {nutritionInfo.weight}
                  {t("common.measurements.kg")}
                </Text>
              </View>
            </View>
            <Text style={[styles.profileSubValue, { color: colors.text }]}>
              {getActivityLevelText()}
            </Text>
          </MotiView>

          {/* Card de Objetivo */}
          <MotiView
            key={`goal-card-${theme}`}
            style={[
              styles.goalCard,
              {
                backgroundColor: theme === "dark" ? colors.dark : colors.light,
                borderColor: colors.border,
                borderWidth: 1,
                overflow: "hidden",
              },
            ]}
            from={{ opacity: 0, translateX: 20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "spring", delay: 400 }}
          >
            <Text style={[styles.cardLabel, { color: colors.text }]}>
              {t("summary.goal.title")}
            </Text>
            <View key={`goal-content-${theme}`} style={styles.goalContent}>
              <Ionicons
                key={`goal-icon-${theme}`}
                name={getGoalIcon()}
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.goalText, { color: colors.text }]}>
                {getGoalText()}
              </Text>
            </View>
            {nutritionInfo.goal !== "maintain" && (
              <Text style={[styles.goalTarget, { color: colors.text }]}>
                {t("summary.goal.target", {
                  weight: nutritionInfo.targetWeight,
                })}
              </Text>
            )}
          </MotiView>
        </MotiView>

        {/* Seção de Macros */}
        <MotiView
          key={`macros-section-${theme}`}
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 15, delay: 600 }}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("common.nutrition.dailyNeeds")}
          </Text>
        </MotiView>

        <MotiView
          key={`macros-container-${theme}`}
          style={styles.macrosContainer}
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 800, delay: 700 }}
        >
          {/* Card de Calorias */}
          <MotiView
            key={`calories-card-${theme}`}
            style={[
              styles.caloriesCard,
              {
                backgroundColor: theme === "dark" ? colors.dark : colors.light,
                borderColor: "transparent",
                borderWidth: 0,
                overflow: "hidden",
              },
            ]}
            from={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 15, delay: 800 }}
          >
            <View
              key={`calories-content-${theme}`}
              style={styles.caloriesContent}
            >
              <CircularProgress
                key={`calories-progress-${theme}`}
                value={100}
                radius={40}
                duration={800}
                progressValueColor={colors.text}
                maxValue={100}
                title={formatNumber(nutritionInfo.calories)}
                titleColor={colors.text}
                titleStyle={{ fontSize: 18, fontWeight: "bold" }}
                activeStrokeColor={colors.primary}
                inActiveStrokeColor={colors.border}
                inActiveStrokeOpacity={0.15}
                activeStrokeWidth={10}
                inActiveStrokeWidth={10}
                progressValueStyle={{ fontSize: 16, fontWeight: "bold" }}
                valueSuffix=""
                delay={100}
                showProgressValue={false}
              />
              <View key={`calories-info-${theme}`} style={styles.caloriesInfo}>
                <Text style={[styles.caloriesTitle, { color: colors.text }]}>
                  {t("summary.dailyNeeds.calories.title")}
                </Text>
                <Text style={[styles.caloriesValue, { color: colors.primary }]}>
                  {formatNumber(nutritionInfo.calories)}{" "}
                  {t("common.nutrition.kcal")}
                </Text>
                <Text style={[styles.caloriesDesc, { color: colors.text }]}>
                  {nutritionInfo.goal === "lose"
                    ? t("summary.dailyNeeds.calories.deficit")
                    : nutritionInfo.goal === "gain"
                    ? t("summary.dailyNeeds.calories.surplus")
                    : t("summary.dailyNeeds.calories.maintenance")}
                </Text>
              </View>
              <Ionicons
                key={`calories-icon-${theme}`}
                name="flame-outline"
                size={24}
                color={colors.primary}
              />
            </View>
          </MotiView>

          {/* Cards de Macronutrientes */}
          <MotiView
            key={`macro-row-${theme}`}
            style={styles.macroRow}
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 15, delay: 900 }}
          >
            {/* Card de Proteína */}
            <MotiView
              key={`protein-card-${theme}`}
              style={[
                styles.macroCard,
                {
                  backgroundColor:
                    theme === "dark" ? colors.dark : colors.light,
                  borderColor: "transparent",
                  borderWidth: 0,
                  overflow: "hidden",
                },
              ]}
              from={{ opacity: 0, scale: 0.9, translateY: 20 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: "spring", damping: 15, delay: 1000 }}
            >
              <View
                key={`protein-content-${theme}`}
                style={styles.macroContent}
              >
                <CircularProgress
                  key={`protein-progress-${theme}`}
                  value={macroPercentages.protein}
                  radius={34}
                  duration={600}
                  progressValueColor={colors.text}
                  maxValue={100}
                  title=""
                  titleColor={colors.text}
                  titleStyle={{ fontSize: 12 }}
                  activeStrokeColor="#FF6B6B"
                  inActiveStrokeColor={colors.border}
                  inActiveStrokeOpacity={0.15}
                  activeStrokeWidth={8}
                  inActiveStrokeWidth={8}
                  progressValueStyle={{ fontSize: 14, fontWeight: "bold" }}
                  valueSuffix="%"
                  delay={200}
                  showProgressValue={true}
                />
                <View key={`protein-info-${theme}`} style={styles.macroInfo}>
                  <Ionicons
                    key={`protein-icon-${theme}`}
                    name="egg-outline"
                    size={18}
                    color="#FF6B6B"
                  />
                  <Text style={[styles.macroTitle, { color: colors.text }]}>
                    {t("common.nutrition.protein")}
                  </Text>
                  <Text style={[styles.macroValue, { color: "#FF6B6B" }]}>
                    {formatNumber(nutritionInfo.protein)}
                    {t("common.nutrition.grams")}
                  </Text>
                </View>
              </View>
            </MotiView>

            {/* Card de Carboidratos */}
            <MotiView
              key={`carbs-card-${theme}`}
              style={[
                styles.macroCard,
                {
                  backgroundColor:
                    theme === "dark" ? colors.dark : colors.light,
                  borderColor: "transparent",
                  borderWidth: 0,
                  overflow: "hidden",
                },
              ]}
              from={{ opacity: 0, scale: 0.9, translateY: 20 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: "spring", damping: 15, delay: 1100 }}
            >
              <View key={`carbs-content-${theme}`} style={styles.macroContent}>
                <CircularProgress
                  key={`carbs-progress-${theme}`}
                  value={macroPercentages.carbs}
                  radius={34}
                  duration={600}
                  progressValueColor={colors.text}
                  maxValue={100}
                  title=""
                  titleColor={colors.text}
                  titleStyle={{ fontSize: 12 }}
                  activeStrokeColor="#4ECDC4"
                  inActiveStrokeColor={colors.border}
                  inActiveStrokeOpacity={0.15}
                  activeStrokeWidth={8}
                  inActiveStrokeWidth={8}
                  progressValueStyle={{ fontSize: 14, fontWeight: "bold" }}
                  valueSuffix="%"
                  delay={200}
                  showProgressValue={true}
                />
                <View key={`carbs-info-${theme}`} style={styles.macroInfo}>
                  <Ionicons
                    key={`carbs-icon-${theme}`}
                    name="nutrition-outline"
                    size={18}
                    color="#4ECDC4"
                  />
                  <Text style={[styles.macroTitle, { color: colors.text }]}>
                    {t("common.nutrition.carbs")}
                  </Text>
                  <Text style={[styles.macroValue, { color: "#4ECDC4" }]}>
                    {formatNumber(nutritionInfo.carbs)}
                    {t("common.nutrition.grams")}
                  </Text>
                </View>
              </View>
            </MotiView>

            {/* Card de Gorduras */}
            <MotiView
              key={`fat-card-${theme}`}
              style={[
                styles.macroCard,
                {
                  backgroundColor:
                    theme === "dark" ? colors.dark : colors.light,
                  borderColor: "transparent",
                  borderWidth: 0,
                  overflow: "hidden",
                },
              ]}
              from={{ opacity: 0, scale: 0.9, translateY: 20 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: "spring", damping: 15, delay: 1200 }}
            >
              <View key={`fat-content-${theme}`} style={styles.macroContent}>
                <CircularProgress
                  key={`fat-progress-${theme}`}
                  value={macroPercentages.fat}
                  radius={34}
                  duration={600}
                  progressValueColor={colors.text}
                  maxValue={100}
                  title=""
                  titleColor={colors.text}
                  titleStyle={{ fontSize: 12 }}
                  activeStrokeColor="#FFE66D"
                  inActiveStrokeColor={colors.border}
                  inActiveStrokeOpacity={0.15}
                  activeStrokeWidth={8}
                  inActiveStrokeWidth={8}
                  progressValueStyle={{ fontSize: 14, fontWeight: "bold" }}
                  valueSuffix="%"
                  delay={200}
                  showProgressValue={true}
                />
                <View key={`fat-info-${theme}`} style={styles.macroInfo}>
                  <Ionicons
                    key={`fat-icon-${theme}`}
                    name="water-outline"
                    size={18}
                    color="#FFE66D"
                  />
                  <Text style={[styles.macroTitle, { color: colors.text }]}>
                    {t("common.nutrition.fat")}
                  </Text>
                  <Text style={[styles.macroValue, { color: "#FFE66D" }]}>
                    {formatNumber(nutritionInfo.fat)}
                    {t("common.nutrition.grams")}
                  </Text>
                </View>
              </View>
            </MotiView>
          </MotiView>

          {/* Card de Água */}
          <MotiView
            key={`water-card-${theme}`}
            style={[
              styles.waterCard,
              {
                backgroundColor: theme === "dark" ? colors.dark : colors.light,
                borderColor: "transparent",
                borderWidth: 0,
                overflow: "hidden",
              },
            ]}
            from={{ opacity: 0, scale: 0.92, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 15, delay: 1300 }}
          >
            <View key={`water-content-${theme}`} style={styles.waterContent}>
              <Ionicons
                key={`water-icon-${theme}`}
                name="water"
                size={24}
                color="#4ECDC4"
              />
              <View key={`water-info-${theme}`} style={styles.waterInfo}>
                <Text style={[styles.waterTitle, { color: colors.text }]}>
                  {t("summary.dailyNeeds.water.title")}
                </Text>
                <Text style={[styles.waterValue, { color: "#4ECDC4" }]}>
                  {nutritionInfo.waterIntake
                    ? (nutritionInfo.waterIntake / 1000).toFixed(1)
                    : "0"}
                  {t("common.nutrition.liters")}
                </Text>
                <Text style={[styles.waterTip, { color: colors.text }]}>
                  {t("summary.dailyNeeds.water.glasses", {
                    count: nutritionInfo.waterIntake
                      ? Math.round(nutritionInfo.waterIntake / 200)
                      : 0,
                  })}
                </Text>
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
              backgroundColor: theme === "dark" ? colors.dark : colors.light,
              borderColor: "transparent",
              borderWidth: 0,
              overflow: "hidden",
            },
          ]}
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 15, delay: 1400 }}
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
              { borderColor: colors.danger, borderWidth: 1 },
            ]}
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring" }}
          >
            <Text style={styles.errorText}>{t("summary.error")}</Text>
          </MotiView>
        )}
      </ScrollView>

      <MotiView
        key={`footer-${theme}`}
        style={styles.footer}
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 15, delay: 1600 }}
      >
        <TouchableOpacity
          key={`start-button-${theme}`}
          style={[
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: loading ? 0.7 : 1,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 10,
            },
          ]}
          onPress={handleStart}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text
              style={{
                color: "white",
                fontSize: 18,
                fontWeight: "700",
                textAlign: "center",
                letterSpacing: 0.5,
              }}
            >
              {t("summary.startJourney")}
            </Text>
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
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  topCardsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  profileCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  goalCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardLabel: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  measurementRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  measurementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  measurementDivider: {
    width: 1,
    height: 18,
    marginHorizontal: 10,
  },
  measurementText: {
    fontSize: 16,
    fontWeight: "600",
  },
  profileSubValue: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.7,
  },
  goalContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  goalText: {
    fontSize: 16,
    fontWeight: "600",
  },
  goalTarget: {
    fontSize: 13,
    opacity: 0.7,
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
  caloriesCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  caloriesContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  caloriesInfo: {
    flex: 1,
  },
  caloriesTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  caloriesValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  caloriesDesc: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 16,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: screenWidth < 360 ? "wrap" : "nowrap",
    marginBottom: 16,
  },
  macroCard: {
    flex: screenWidth < 360 ? 0 : 1,
    width: screenWidth < 360 ? "48%" : "auto",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: screenWidth < 360 ? 12 : 0,
    minHeight: 160,
    justifyContent: "center",
  },
  macroContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  macroInfo: {
    alignItems: "center",
    marginTop: 10,
    paddingBottom: 6,
  },
  macroTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 3,
    textAlign: "center",
  },
  macroValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 3,
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
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
  },
  errorText: {
    color: "red",
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
  waterCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  waterContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  waterInfo: {
    flex: 1,
  },
  waterTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  waterValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  waterTip: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 18,
  },
});
