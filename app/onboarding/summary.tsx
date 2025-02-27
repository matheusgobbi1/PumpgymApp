import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import Button from "../../components/Button";
import { useNutrition } from "../../context/NutritionContext";
import { useAuth } from "../../context/AuthContext";
import CircularProgress from "react-native-circular-progress-indicator";
import { OfflineStorage } from "../../services/OfflineStorage";

const screenWidth = Dimensions.get("window").width;

export default function SummaryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const {
    nutritionInfo,
    completeOnboarding,
    calculateMacros,
    resetNutritionInfo,
  } = useNutrition();
  const { isAnonymous } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    calculateMacros();
  }, []);

  const handleStart = async () => {
    try {
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
    return num.toFixed(1);
  };

  const calculateMacroPercentage = (macroCalories: number) => {
    if (!nutritionInfo.calories) return 0;
    return (macroCalories / nutritionInfo.calories) * 100;
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
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
      >
        {/* Header */}
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Seu Plano Personalizado
        </Text>

        {/* Cards do Topo em Row */}
        <View style={styles.topCardsRow}>
          {/* Card de Perfil */}
          <View style={[styles.profileCard, { backgroundColor: colors.light }]}>
            <Text style={[styles.cardLabel, { color: colors.text }]}>
              Perfil
            </Text>
            <View style={styles.measurementRow}>
              <View style={styles.measurementItem}>
                <Ionicons
                  name="body-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.measurementText, { color: colors.text }]}>
                  {nutritionInfo.height}cm
                </Text>
              </View>
              <View style={styles.measurementDivider} />
              <View style={styles.measurementItem}>
                <Ionicons
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
          </View>

          {/* Card de Objetivo */}
          <View style={[styles.goalCard, { backgroundColor: colors.light }]}>
            <Text style={[styles.cardLabel, { color: colors.text }]}>
              Objetivo
            </Text>
            <View style={styles.goalContent}>
              <Ionicons name={getGoalIcon()} size={20} color={colors.primary} />
              <Text style={[styles.goalText, { color: colors.text }]}>
                {getGoalText()}
              </Text>
            </View>
            {nutritionInfo.goal !== "maintain" && (
              <Text style={[styles.goalTarget, { color: colors.text }]}>
                Meta: {nutritionInfo.targetWeight}kg
              </Text>
            )}
          </View>
        </View>

        {/* Health Score Card */}
        <View
          style={[styles.healthScoreCard, { backgroundColor: colors.light }]}
        >
          <View style={styles.healthScoreContent}>
            <CircularProgress
              value={nutritionInfo.healthScore || 0}
              radius={32}
              duration={1000}
              progressValueColor={colors.text}
              maxValue={10}
              title="score"
              titleColor={colors.text}
              titleStyle={{ fontSize: 8 }}
              activeStrokeColor="#6C63FF"
              inActiveStrokeColor={colors.border}
              inActiveStrokeOpacity={0.2}
              activeStrokeWidth={6}
              inActiveStrokeWidth={6}
              progressValueStyle={{ fontSize: 14, fontWeight: "bold" }}
              valueSuffix=""
              delay={0}
            />
            <View style={styles.healthScoreInfo}>
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
            <Ionicons name="fitness-outline" size={24} color="#6C63FF" />
          </View>
        </View>

        {/* Seção de Macros */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Necessidades Diárias
        </Text>

        <View style={styles.macrosContainer}>
          {/* Card de Calorias */}
          <View
            style={[styles.caloriesCard, { backgroundColor: colors.light }]}
          >
            <View style={styles.caloriesContent}>
              <CircularProgress
                value={nutritionInfo.calories || 0}
                radius={32}
                duration={1000}
                progressValueColor={colors.text}
                maxValue={nutritionInfo.calories || 100}
                title="kcal"
                titleColor={colors.text}
                titleStyle={{ fontSize: 8 }}
                activeStrokeColor={colors.primary}
                inActiveStrokeColor={colors.border}
                inActiveStrokeOpacity={0.2}
                activeStrokeWidth={6}
                inActiveStrokeWidth={6}
                progressValueStyle={{ fontSize: 14, fontWeight: "bold" }}
                valueSuffix=""
                delay={0}
              />
              <View style={styles.caloriesInfo}>
                <Text style={[styles.caloriesTitle, { color: colors.text }]}>
                  Calorias Diárias
                </Text>
                <Text style={[styles.caloriesDesc, { color: colors.text }]}>
                  {nutritionInfo.goal === "lose"
                    ? "Déficit calórico para perda de peso"
                    : nutritionInfo.goal === "gain"
                    ? "Superávit calórico para ganho de massa"
                    : "Manutenção do peso atual"}
                </Text>
              </View>
              <Ionicons name="flame-outline" size={24} color={colors.primary} />
            </View>
          </View>

          {/* Cards de Macronutrientes */}
          <View style={styles.macroRow}>
            {/* Card de Proteína */}
            <View style={[styles.macroCard, { backgroundColor: colors.light }]}>
              <View style={styles.macroContent}>
                <CircularProgress
                  value={macroPercentages.protein}
                  radius={32}
                  duration={1000}
                  progressValueColor={colors.text}
                  maxValue={100}
                  title="%"
                  titleColor={colors.text}
                  titleStyle={{ fontSize: 8 }}
                  activeStrokeColor="#FF6B6B"
                  inActiveStrokeColor={colors.border}
                  inActiveStrokeOpacity={0.2}
                  activeStrokeWidth={6}
                  inActiveStrokeWidth={6}
                  progressValueStyle={{ fontSize: 14, fontWeight: "bold" }}
                  valueSuffix=""
                  delay={0}
                />
                <View style={styles.macroInfo}>
                  <Ionicons name="egg-outline" size={20} color="#FF6B6B" />
                  <Text style={[styles.macroTitle, { color: colors.text }]}>
                    Proteína
                  </Text>
                  <Text style={[styles.macroDesc, { color: colors.text }]}>
                    {nutritionInfo.protein && nutritionInfo.weight
                      ? (nutritionInfo.protein / nutritionInfo.weight).toFixed(
                          1
                        )
                      : "0"}
                    g/kg
                  </Text>
                </View>
              </View>
            </View>

            {/* Card de Carboidratos */}
            <View style={[styles.macroCard, { backgroundColor: colors.light }]}>
              <View style={styles.macroContent}>
                <CircularProgress
                  value={macroPercentages.carbs}
                  radius={32}
                  duration={1000}
                  progressValueColor={colors.text}
                  maxValue={100}
                  title="%"
                  titleColor={colors.text}
                  titleStyle={{ fontSize: 8 }}
                  activeStrokeColor="#4ECDC4"
                  inActiveStrokeColor={colors.border}
                  inActiveStrokeOpacity={0.2}
                  activeStrokeWidth={6}
                  inActiveStrokeWidth={6}
                  progressValueStyle={{ fontSize: 14, fontWeight: "bold" }}
                  valueSuffix=""
                  delay={0}
                />
                <View style={styles.macroInfo}>
                  <Ionicons
                    name="nutrition-outline"
                    size={20}
                    color="#4ECDC4"
                  />
                  <Text style={[styles.macroTitle, { color: colors.text }]}>
                    Carboidratos
                  </Text>
                  <Text style={[styles.macroDesc, { color: colors.text }]}>
                    {Math.round((nutritionInfo.carbs || 0) * 4)} kcal
                  </Text>
                </View>
              </View>
            </View>

            {/* Card de Gorduras */}
            <View style={[styles.macroCard, { backgroundColor: colors.light }]}>
              <View style={styles.macroContent}>
                <CircularProgress
                  value={macroPercentages.fat}
                  radius={32}
                  duration={1000}
                  progressValueColor={colors.text}
                  maxValue={100}
                  title="%"
                  titleColor={colors.text}
                  titleStyle={{ fontSize: 8 }}
                  activeStrokeColor="#FFE66D"
                  inActiveStrokeColor={colors.border}
                  inActiveStrokeOpacity={0.2}
                  activeStrokeWidth={6}
                  inActiveStrokeWidth={6}
                  progressValueStyle={{ fontSize: 14, fontWeight: "bold" }}
                  valueSuffix=""
                  delay={0}
                />
                <View style={styles.macroInfo}>
                  <Ionicons name="water-outline" size={20} color="#FFE66D" />
                  <Text style={[styles.macroTitle, { color: colors.text }]}>
                    Gorduras
                  </Text>
                  <Text style={[styles.macroDesc, { color: colors.text }]}>
                    {Math.round((nutritionInfo.fat || 0) * 9)} kcal
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Card de Água */}
          <View style={[styles.waterCard, { backgroundColor: colors.light }]}>
            <View style={styles.waterContent}>
              <Ionicons name="water" size={24} color="#4ECDC4" />
              <View style={styles.waterInfo}>
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
          </View>
        </View>

        {/* Informações Adicionais */}
        <View style={[styles.infoCard, { backgroundColor: colors.light }]}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Plano calculado com base no seu perfil. Ajuste a qualquer momento
            nas configurações.
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={loading ? "Salvando..." : "Iniciar Jornada"}
          onPress={handleStart}
          disabled={loading}
          style={styles.button}
        />
      </View>
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
  },
  goalCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
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
    backgroundColor: "rgba(0,0,0,0.1)",
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
    padding: 16,
    marginBottom: 12,
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
  caloriesDesc: {
    fontSize: 12,
    opacity: 0.7,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  macroCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
  },
  macroContent: {
    alignItems: "center",
  },
  macroInfo: {
    alignItems: "center",
    marginTop: 8,
  },
  macroTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  macroDesc: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: "center",
  },
  infoCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 16,
    alignItems: "center",
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
  },
  healthScoreCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
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
});
