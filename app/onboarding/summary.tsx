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

const screenWidth = Dimensions.get("window").width;

export default function SummaryScreen() {
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
    return nutritionInfo.targetDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getGoalText = () => {
    switch (nutritionInfo.goal) {
      case "lose":
        return "Perder Peso";
      case "maintain":
        return "Manter Peso";
      case "gain":
        return "Ganhar Massa";
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
        return "Sedentário";
      case "light":
        return "Leve";
      case "moderate":
        return "Moderado";
      case "intense":
        return "Intenso";
      case "athlete":
        return "Atleta";
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
      >
        {/* Header */}
        <MotiView
          key={`header-${theme}`}
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Seu Plano Personalizado
          </Text>
        </MotiView>

        {/* Cards do Topo em Row */}
        <MotiView
          key={`top-cards-row-${theme}`}
          style={styles.topCardsRow}
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 200 }}
        >
          {/* Card de Perfil */}
          <MotiView
            key={`profile-card-${theme}`}
            style={[
              styles.profileCard,
              {
                backgroundColor: theme === "dark" ? colors.dark : colors.light,
                borderColor: colors.border,
                borderWidth: 1,
                overflow: "hidden",
              },
            ]}
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "spring", delay: 300 }}
          >
            <Text style={[styles.cardLabel, { color: colors.text }]}>
              Perfil
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
                  {nutritionInfo.height}cm
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
                  {nutritionInfo.weight}kg
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
              Objetivo
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
                Meta: {nutritionInfo.targetWeight}kg
              </Text>
            )}
          </MotiView>
        </MotiView>

        {/* Health Score Card */}
        <MotiView
          key={`health-score-card-${theme}`}
          style={[
            styles.healthScoreCard,
            {
              backgroundColor: theme === "dark" ? colors.dark : colors.light,
              borderColor: colors.border,
              borderWidth: 1,
              overflow: "hidden",
            },
          ]}
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 500 }}
        >
          <View
            key={`health-score-content-${theme}`}
            style={styles.healthScoreContent}
          >
            <CircularProgress
              key={`health-score-progress-${theme}`}
              value={nutritionInfo.healthScore || 0}
              radius={32}
              duration={1000}
              progressValueColor={colors.text}
              maxValue={10}
              title=""
              titleColor={colors.text}
              titleStyle={{ fontSize: 8 }}
              activeStrokeColor="#6C63FF"
              inActiveStrokeColor={colors.border}
              inActiveStrokeOpacity={0.2}
              activeStrokeWidth={6}
              inActiveStrokeWidth={6}
              progressValueStyle={{ fontSize: 14, fontWeight: "bold" }}
              valueSuffix="/10"
              delay={0}
            />
            <View
              key={`health-score-info-${theme}`}
              style={styles.healthScoreInfo}
            >
              <Text style={[styles.healthScoreTitle, { color: colors.text }]}>
                Health Score
              </Text>
              <Text style={[styles.healthScoreDesc, { color: colors.text }]}>
                {nutritionInfo.healthScore && nutritionInfo.healthScore >= 7
                  ? "Excelente! Continue assim!"
                  : nutritionInfo.healthScore && nutritionInfo.healthScore >= 5
                  ? "Bom! Pode melhorar ainda mais!"
                  : "Vamos melhorar seus hábitos!"}
              </Text>
            </View>
            <Ionicons
              key={`health-score-icon-${theme}`}
              name="fitness-outline"
              size={24}
              color="#6C63FF"
            />
          </View>
        </MotiView>

        {/* Seção de Macros */}
        <MotiView
          key={`macros-section-${theme}`}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600, delay: 600 }}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Necessidades Diárias
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
                borderColor: colors.border,
                borderWidth: 1,
                overflow: "hidden",
              },
            ]}
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", delay: 800 }}
          >
            <View
              key={`calories-content-${theme}`}
              style={styles.caloriesContent}
            >
              <CircularProgress
                key={`calories-progress-${theme}`}
                value={100}
                radius={32}
                duration={300}
                progressValueColor={colors.text}
                maxValue={100}
                title={`${formatNumber(nutritionInfo.calories)}`}
                titleColor={colors.text}
                titleStyle={{ fontSize: 14 }}
                activeStrokeColor={colors.primary}
                inActiveStrokeColor={colors.border}
                inActiveStrokeOpacity={0.2}
                activeStrokeWidth={6}
                inActiveStrokeWidth={6}
                progressValueStyle={{ fontSize: 14, fontWeight: "bold" }}
                valueSuffix=""
                delay={0}
                showProgressValue={false}
              />
              <View key={`calories-info-${theme}`} style={styles.caloriesInfo}>
                <Text style={[styles.caloriesTitle, { color: colors.text }]}>
                  Calorias Diárias
                </Text>
                <Text style={[styles.caloriesValue, { color: colors.primary }]}>
                  {formatNumber(nutritionInfo.calories)} kcal
                </Text>
                <Text style={[styles.caloriesDesc, { color: colors.text }]}>
                  {nutritionInfo.goal === "lose"
                    ? "Déficit calórico para perda de peso"
                    : nutritionInfo.goal === "gain"
                    ? "Superávit calórico para ganho de massa"
                    : "Manutenção do peso atual"}
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
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600, delay: 900 }}
          >
            {/* Card de Proteína */}
            <MotiView
              key={`protein-card-${theme}`}
              style={[
                styles.macroCard,
                {
                  backgroundColor:
                    theme === "dark" ? colors.dark : colors.light,
                  borderColor: colors.border,
                  borderWidth: 1,
                  overflow: "hidden",
                },
              ]}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", delay: 1000 }}
            >
              <View
                key={`protein-content-${theme}`}
                style={styles.macroContent}
              >
                <CircularProgress
                  key={`protein-progress-${theme}`}
                  value={macroPercentages.protein}
                  radius={28}
                  duration={300}
                  progressValueColor={colors.text}
                  maxValue={100}
                  title=""
                  titleColor={colors.text}
                  titleStyle={{ fontSize: 12 }}
                  activeStrokeColor="#FF6B6B"
                  inActiveStrokeColor={colors.border}
                  inActiveStrokeOpacity={0.2}
                  activeStrokeWidth={5}
                  inActiveStrokeWidth={5}
                  progressValueStyle={{ fontSize: 12, fontWeight: "bold" }}
                  valueSuffix="%"
                  delay={0}
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
                    Proteína
                  </Text>
                  <Text style={[styles.macroValue, { color: "#FF6B6B" }]}>
                    {formatNumber(nutritionInfo.protein)}g
                  </Text>
                  <Text style={[styles.macroDesc, { color: colors.text }]}>
                    {nutritionInfo.protein && nutritionInfo.weight
                      ? (nutritionInfo.protein / nutritionInfo.weight).toFixed(
                          1
                        )
                      : "0"}
                    g/kg • {Math.round(getMacroCalories.protein)} kcal
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
                  borderColor: colors.border,
                  borderWidth: 1,
                  overflow: "hidden",
                },
              ]}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", delay: 1100 }}
            >
              <View key={`carbs-content-${theme}`} style={styles.macroContent}>
                <CircularProgress
                  key={`carbs-progress-${theme}`}
                  value={macroPercentages.carbs}
                  radius={28}
                  duration={300}
                  progressValueColor={colors.text}
                  maxValue={100}
                  title=""
                  titleColor={colors.text}
                  titleStyle={{ fontSize: 12 }}
                  activeStrokeColor="#4ECDC4"
                  inActiveStrokeColor={colors.border}
                  inActiveStrokeOpacity={0.2}
                  activeStrokeWidth={5}
                  inActiveStrokeWidth={5}
                  progressValueStyle={{ fontSize: 12, fontWeight: "bold" }}
                  valueSuffix="%"
                  delay={0}
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
                    Carboidratos
                  </Text>
                  <Text style={[styles.macroValue, { color: "#4ECDC4" }]}>
                    {formatNumber(nutritionInfo.carbs)}g
                  </Text>
                  <Text style={[styles.macroDesc, { color: colors.text }]}>
                    {Math.round(getMacroCalories.carbs)} kcal
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
                  borderColor: colors.border,
                  borderWidth: 1,
                  overflow: "hidden",
                },
              ]}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", delay: 1200 }}
            >
              <View key={`fat-content-${theme}`} style={styles.macroContent}>
                <CircularProgress
                  key={`fat-progress-${theme}`}
                  value={macroPercentages.fat}
                  radius={28}
                  duration={300}
                  progressValueColor={colors.text}
                  maxValue={100}
                  title=""
                  titleColor={colors.text}
                  titleStyle={{ fontSize: 12 }}
                  activeStrokeColor="#FFE66D"
                  inActiveStrokeColor={colors.border}
                  inActiveStrokeOpacity={0.2}
                  activeStrokeWidth={5}
                  inActiveStrokeWidth={5}
                  progressValueStyle={{ fontSize: 12, fontWeight: "bold" }}
                  valueSuffix="%"
                  delay={0}
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
                    Gorduras
                  </Text>
                  <Text style={[styles.macroValue, { color: "#FFE66D" }]}>
                    {formatNumber(nutritionInfo.fat)}g
                  </Text>
                  <Text style={[styles.macroDesc, { color: colors.text }]}>
                    {Math.round(getMacroCalories.fat)} kcal
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
                borderColor: colors.border,
                borderWidth: 1,
                overflow: "hidden",
              },
            ]}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", delay: 1300 }}
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
                  Água Recomendada
                </Text>
                <Text style={[styles.waterValue, { color: "#4ECDC4" }]}>
                  {nutritionInfo.waterIntake
                    ? (nutritionInfo.waterIntake / 1000).toFixed(1)
                    : "0"}
                  L
                </Text>
                <Text style={[styles.waterTip, { color: colors.text }]}>
                  {nutritionInfo.waterIntake
                    ? Math.round(nutritionInfo.waterIntake / 200)
                    : 0}{" "}
                  copos de 200ml
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
              borderColor: colors.border,
              borderWidth: 1,
              overflow: "hidden",
            },
          ]}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", delay: 1400 }}
        >
          <Ionicons
            key={`info-icon-${theme}`}
            name="information-circle-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Plano calculado com base no seu perfil. Ajuste a qualquer momento
            nas configurações.
          </Text>
        </MotiView>

        {/* Dica do dia */}
        <MotiView
          key={`tip-card-${theme}`}
          style={[
            styles.tipCard,
            {
              backgroundColor:
                theme === "dark"
                  ? "rgba(28, 154, 190, 0.15)"
                  : "rgba(28, 154, 190, 0.1)",
              borderColor: colors.primary,
              borderWidth: 1,
            },
          ]}
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 1500 }}
        >
          <View key={`tip-header-${theme}`} style={styles.tipHeader}>
            <Ionicons
              key={`tip-icon-${theme}`}
              name="bulb-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.tipTitle, { color: colors.primary }]}>
              Dica do dia
            </Text>
          </View>
          <Text style={[styles.tipText, { color: colors.text }]}>
            {nutritionInfo.goal === "lose"
              ? "Beba um copo de água antes das refeições para ajudar a controlar o apetite e melhorar a digestão."
              : nutritionInfo.goal === "gain"
              ? "Adicione uma fonte de proteína de qualidade em todas as suas refeições para otimizar o ganho de massa muscular."
              : "Mantenha um diário alimentar para acompanhar seu progresso e identificar padrões que podem ser melhorados."}
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
            <Text style={styles.errorText}>{error}</Text>
          </MotiView>
        )}
      </ScrollView>

      <MotiView
        key={`footer-${theme}`}
        style={styles.footer}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 600, delay: 1600 }}
      >
        <TouchableOpacity
          key={`start-button-${theme}`}
          style={[
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: loading ? 0.7 : 1,
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
                fontSize: 16,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              Iniciar Jornada
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  topCardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  profileCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 8,
  },
  measurementRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  measurementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  measurementDivider: {
    width: 1,
    height: 16,
    marginHorizontal: 8,
  },
  measurementText: {
    fontSize: 14,
    fontWeight: "500",
  },
  profileSubValue: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.7,
  },
  goalContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  goalText: {
    fontSize: 14,
    fontWeight: "500",
  },
  goalTarget: {
    fontSize: 12,
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  macrosContainer: {
    gap: 12,
  },
  caloriesCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  caloriesContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  caloriesInfo: {
    flex: 1,
  },
  caloriesTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
  },
  caloriesValue: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 3,
  },
  caloriesDesc: {
    fontSize: 11,
    opacity: 0.7,
    lineHeight: 14,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: screenWidth < 360 ? "wrap" : "nowrap",
    marginBottom: 10,
  },
  macroCard: {
    flex: screenWidth < 360 ? 0 : 1,
    width: screenWidth < 360 ? "48%" : "auto",
    borderRadius: 16,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: screenWidth < 360 ? 8 : 0,
    minHeight: 140,
    justifyContent: "center",
  },
  macroContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  macroInfo: {
    alignItems: "center",
    marginTop: 6,
    paddingBottom: 5,
  },
  macroTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
    textAlign: "center",
  },
  macroValue: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  macroDesc: {
    fontSize: 10,
    opacity: 0.7,
    textAlign: "center",
    paddingHorizontal: 2,
  },
  infoCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 16,
    marginTop: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 16,
  },
  errorContainer: {
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 12,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  healthScoreCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  healthScoreContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  healthScoreInfo: {
    flex: 1,
  },
  healthScoreTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  healthScoreDesc: {
    fontSize: 12,
    opacity: 0.7,
  },
  waterCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  waterContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  waterInfo: {
    flex: 1,
  },
  waterTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  waterValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#4ECDC4",
    marginBottom: 2,
  },
  waterTip: {
    fontSize: 12,
    opacity: 0.7,
  },
  tipCard: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    overflow: "hidden",
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tipTitle: {
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
