import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { MotiView } from "moti";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { useNutrition, Gender, Goal } from "../../context/NutritionContext";
import { format, differenceInYears } from "date-fns";
import Animated, { FadeIn } from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface UserStatsCardProps {
  onEditPress?: () => void;
}

export default function UserStatsCard({ onEditPress }: UserStatsCardProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo } = useNutrition();
  const [activeTab, setActiveTab] = useState<"medidas" | "objetivos">(
    "medidas"
  );

  // Controle de animação - executar apenas uma vez
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const animationExecuted = useRef(false);

  useEffect(() => {
    // Configurar a animação para ser executada apenas na primeira renderização
    if (!animationExecuted.current) {
      setShouldAnimate(true);
      animationExecuted.current = true;
    } else {
      setShouldAnimate(false);
    }
  }, []);

  // Função para traduzir o gênero
  const translateGender = (gender?: Gender) => {
    if (!gender) return "Não informado";

    const translations: Record<Gender, string> = {
      male: "Masculino",
      female: "Feminino",
      other: "Outro",
    };

    return translations[gender];
  };

  // Função para traduzir o objetivo
  const translateGoal = (goal?: Goal) => {
    if (!goal) return "Não informado";

    const translations: Record<Goal, string> = {
      lose: "Perder peso",
      maintain: "Manter peso",
      gain: "Ganhar peso",
    };

    return translations[goal];
  };

  // Função para calcular a idade
  const calculateAge = (birthDate?: Date | string | null) => {
    if (!birthDate) return null;

    const birthDateObj =
      typeof birthDate === "string" ? new Date(birthDate) : birthDate;
    return differenceInYears(new Date(), birthDateObj);
  };

  // Calcular a idade
  const age = calculateAge(nutritionInfo.birthDate);

  // Calcular progresso para o peso alvo
  const calculateWeightProgress = () => {
    if (!nutritionInfo.weight || !nutritionInfo.targetWeight) return null;

    const currentWeight = nutritionInfo.weight;
    const targetWeight = nutritionInfo.targetWeight;
    const initialWeight =
      nutritionInfo.goal === "lose"
        ? Math.max(currentWeight, targetWeight + 10) // Estimativa de peso inicial para perda
        : Math.min(currentWeight, targetWeight - 10); // Estimativa de peso inicial para ganho

    const totalDifference = Math.abs(initialWeight - targetWeight);
    const currentDifference = Math.abs(currentWeight - targetWeight);
    const progress =
      ((totalDifference - currentDifference) / totalDifference) * 100;

    return Math.min(Math.max(progress, 0), 100); // Limitar entre 0 e 100%
  };

  const weightProgress = calculateWeightProgress();

  return (
    <MotiView
      from={
        shouldAnimate
          ? { opacity: 0, translateY: 10 }
          : { opacity: 1, translateY: 0 }
      }
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", delay: 100 }}
      style={styles.container}
    >
      {/* Tabs de navegação */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "medidas" && [
              styles.activeTab,
              { borderBottomColor: colors.primary },
            ],
          ]}
          onPress={() => setActiveTab("medidas")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "medidas" ? colors.primary : colors.text + "70",
              },
            ]}
          >
            Medidas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "objetivos" && [
              styles.activeTab,
              { borderBottomColor: colors.primary },
            ],
          ]}
          onPress={() => setActiveTab("objetivos")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "objetivos"
                    ? colors.primary
                    : colors.text + "70",
              },
            ]}
          >
            Objetivos
          </Text>
        </TouchableOpacity>

        {onEditPress && (
          <TouchableOpacity
            style={[
              styles.editButton,
              { backgroundColor: colors.primary + "15" },
            ]}
            onPress={onEditPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="pencil-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Conteúdo da aba Medidas */}
      {activeTab === "medidas" && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.tabContent}
        >
          <View style={styles.mainStatsContainer}>
            {/* Altura */}
            <View style={styles.mainStatItem}>
              <View
                style={[
                  styles.mainStatIconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <MaterialCommunityIcons
                  name="human-male-height"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.mainStatValue, { color: colors.text }]}>
                {nutritionInfo.height ? `${nutritionInfo.height}` : "--"}
              </Text>
              <Text
                style={[styles.mainStatLabel, { color: colors.text + "80" }]}
              >
                cm
              </Text>
            </View>

            {/* Peso */}
            <View style={styles.mainStatItem}>
              <View
                style={[
                  styles.mainStatIconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <FontAwesome5 name="weight" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.mainStatValue, { color: colors.text }]}>
                {nutritionInfo.weight ? `${nutritionInfo.weight}` : "--"}
              </Text>
              <Text
                style={[styles.mainStatLabel, { color: colors.text + "80" }]}
              >
                kg
              </Text>
            </View>

            {/* Idade */}
            <View style={styles.mainStatItem}>
              <View
                style={[
                  styles.mainStatIconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.mainStatValue, { color: colors.text }]}>
                {age || "--"}
              </Text>
              <Text
                style={[styles.mainStatLabel, { color: colors.text + "80" }]}
              >
                anos
              </Text>
            </View>
          </View>

          {/* Informações adicionais */}
          <View style={styles.additionalInfoContainer}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.text + "70" }]}>
                  Gênero
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {translateGender(nutritionInfo.gender)}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.text + "70" }]}>
                  Frequência de Treino
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {nutritionInfo.trainingFrequency
                    ? nutritionInfo.trainingFrequency.charAt(0).toUpperCase() +
                      nutritionInfo.trainingFrequency.slice(1)
                    : "Não informado"}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Conteúdo da aba Objetivos */}
      {activeTab === "objetivos" && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.tabContent}
        >
          {/* Objetivo principal */}
          <View style={styles.goalContainer}>
            <View style={styles.goalHeader}>
              <View
                style={[
                  styles.goalIconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name={
                    nutritionInfo.goal === "lose"
                      ? "trending-down"
                      : nutritionInfo.goal === "gain"
                      ? "trending-up"
                      : "remove"
                  }
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View>
                <Text style={[styles.goalLabel, { color: colors.text + "80" }]}>
                  Objetivo Principal
                </Text>
                <Text style={[styles.goalValue, { color: colors.text }]}>
                  {translateGoal(nutritionInfo.goal)}
                </Text>
              </View>
            </View>

            {nutritionInfo.targetWeight && nutritionInfo.weight && (
              <View style={styles.weightProgressContainer}>
                <View style={styles.weightProgressHeader}>
                  <Text
                    style={[styles.weightCurrentValue, { color: colors.text }]}
                  >
                    {nutritionInfo.weight} kg
                  </Text>
                  <Text
                    style={[
                      styles.weightTargetValue,
                      { color: colors.primary },
                    ]}
                  >
                    {nutritionInfo.targetWeight} kg
                  </Text>
                </View>

                <View
                  style={[
                    styles.progressBarContainer,
                    { backgroundColor: colors.border + "30" },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${weightProgress || 0}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>

                <Text
                  style={[styles.progressText, { color: colors.text + "70" }]}
                >
                  {weightProgress
                    ? `${Math.round(weightProgress)}% concluído`
                    : "Progresso não disponível"}
                </Text>
              </View>
            )}
          </View>

          {/* Data alvo */}
          {nutritionInfo.targetDate && (
            <View style={styles.targetDateContainer}>
              <View
                style={[
                  styles.targetDateIconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </View>
              <View>
                <Text
                  style={[
                    styles.targetDateLabel,
                    { color: colors.text + "80" },
                  ]}
                >
                  Data Alvo
                </Text>
                <Text style={[styles.targetDateValue, { color: colors.text }]}>
                  {format(
                    new Date(nutritionInfo.targetDate),
                    "dd 'de' MMMM 'de' yyyy"
                  )}
                </Text>
              </View>
            </View>
          )}

          {/* Macronutrientes */}
          {nutritionInfo.calories && (
            <View style={styles.macrosContainer}>
              <Text style={[styles.macrosTitle, { color: colors.text }]}>
                Plano Nutricional
              </Text>

              <View style={styles.macrosRow}>
                <View style={styles.macroItem}>
                  <View
                    style={[
                      styles.macroIconContainer,
                      { backgroundColor: "#FF6B6B20" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="fire"
                      size={18}
                      color="#FF6B6B"
                    />
                  </View>
                  <Text style={[styles.macroValue, { color: colors.text }]}>
                    {nutritionInfo.calories}
                  </Text>
                  <Text
                    style={[styles.macroLabel, { color: colors.text + "70" }]}
                  >
                    kcal
                  </Text>
                </View>

                <View style={styles.macroItem}>
                  <View
                    style={[
                      styles.macroIconContainer,
                      { backgroundColor: "#4ECDC420" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="food-steak"
                      size={18}
                      color="#4ECDC4"
                    />
                  </View>
                  <Text style={[styles.macroValue, { color: colors.text }]}>
                    {nutritionInfo.protein || "--"}
                  </Text>
                  <Text
                    style={[styles.macroLabel, { color: colors.text + "70" }]}
                  >
                    proteína
                  </Text>
                </View>

                <View style={styles.macroItem}>
                  <View
                    style={[
                      styles.macroIconContainer,
                      { backgroundColor: "#FFD16620" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="bread-slice"
                      size={18}
                      color="#FFD166"
                    />
                  </View>
                  <Text style={[styles.macroValue, { color: colors.text }]}>
                    {nutritionInfo.carbs || "--"}
                  </Text>
                  <Text
                    style={[styles.macroLabel, { color: colors.text + "70" }]}
                  >
                    carboidratos
                  </Text>
                </View>

                <View style={styles.macroItem}>
                  <View
                    style={[
                      styles.macroIconContainer,
                      { backgroundColor: "#118AB220" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="oil"
                      size={18}
                      color="#118AB2"
                    />
                  </View>
                  <Text style={[styles.macroValue, { color: colors.text }]}>
                    {nutritionInfo.fat || "--"}
                  </Text>
                  <Text
                    style={[styles.macroLabel, { color: colors.text + "70" }]}
                  >
                    gorduras
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      )}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 0,
  },
  tabContent: {
    paddingTop: 8,
  },
  // Estilos para estatísticas principais
  mainStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  mainStatItem: {
    alignItems: "center",
  },
  mainStatIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  mainStatValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  mainStatLabel: {
    fontSize: 14,
    marginTop: 2,
  },
  // Estilos para informações adicionais
  additionalInfoContainer: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  // Estilos para objetivos
  goalContainer: {
    marginBottom: 24,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  goalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  goalLabel: {
    fontSize: 13,
  },
  goalValue: {
    fontSize: 17,
    fontWeight: "600",
  },
  weightProgressContainer: {
    marginTop: 12,
    paddingLeft: 56,
  },
  weightProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  weightCurrentValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  weightTargetValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
  },
  progressText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: "right",
  },
  // Estilos para data alvo
  targetDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  targetDateIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  targetDateLabel: {
    fontSize: 13,
  },
  targetDateValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  // Estilos para macronutrientes
  macrosContainer: {
    marginTop: 8,
  },
  macrosTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 16,
  },
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  macroItem: {
    alignItems: "center",
  },
  macroIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  macroLabel: {
    fontSize: 12,
  },
});
