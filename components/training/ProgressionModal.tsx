import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";
import {
  useWorkoutContext,
  Exercise,
  ExerciseSet,
} from "../../context/WorkoutContext";
import Colors from "../../constants/Colors";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

interface ProgressionModalProps {
  visible: boolean;
  onClose: () => void;
  workoutId: string;
  workoutColor: string;
}

interface Recommendation {
  type: string;
  current?: number;
  suggested?: number;
  message: string;
}

interface ProgressionSuggestion {
  exerciseId: string;
  exerciseName: string;
  isCardio?: boolean;
  recommendations: Recommendation[];
}

const { width } = Dimensions.get("window");

/**
 * Componente que sugere progressões de treino baseadas no histórico do usuário
 * e educa sobre o princípio da sobrecarga progressiva
 */
export default function ProgressionModal({
  visible,
  onClose,
  workoutId,
  workoutColor,
}: ProgressionModalProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();
  const { getExercisesForWorkout, getPreviousWorkoutTotals } =
    useWorkoutContext();

  const [selectedTab, setSelectedTab] = useState<"sugestões" | "educação">(
    "sugestões"
  );

  // Obter dados para as sugestões usando useMemo
  const { previousDate, progressionSuggestions } = useMemo(() => {
    // Obter exercícios atuais
    const current = getExercisesForWorkout(workoutId);

    // Obter dados do treino anterior
    const { date, totals } = getPreviousWorkoutTotals(workoutId);

    if (!date) {
      return { previousDate: null, progressionSuggestions: [] };
    }

    // Obter os exercícios do treino anterior
    const previous = getExercisesForWorkout(workoutId, date);

    // Calcular sugestões
    const suggestions = calculateProgressionSuggestions(current, previous);

    return {
      previousDate: date,
      progressionSuggestions: suggestions,
    };
  }, [workoutId, visible]);

  // Função para calcular as sugestões de progressão
  function calculateProgressionSuggestions(
    current: Exercise[],
    previous: Exercise[]
  ): ProgressionSuggestion[] {
    const suggestions: ProgressionSuggestion[] = [];

    // Mapear exercícios por nome para facilitar a comparação
    const previousExerciseMap = new Map<string, Exercise>();
    previous.forEach((ex) =>
      previousExerciseMap.set(ex.name.toLowerCase(), ex)
    );

    // Para cada exercício atual, verificar se existe no treino anterior
    current.forEach((currentExercise) => {
      const previousExercise = previousExerciseMap.get(
        currentExercise.name.toLowerCase()
      );

      if (previousExercise && currentExercise.category !== "cardio") {
        // Se não tiver sets ou for cardio, pular
        if (!previousExercise.sets || !currentExercise.sets) return;

        // Analisar as séries para recomendar progressão
        const recommendations = analyzeSetsForProgression(
          previousExercise.sets,
          currentExercise.sets
        );

        if (recommendations.length > 0) {
          suggestions.push({
            exerciseId: currentExercise.id,
            exerciseName: currentExercise.name,
            recommendations,
          });
        }
      } else if (previousExercise && currentExercise.category === "cardio") {
        // Para exercícios de cardio, sugerir aumento na intensidade ou duração
        if (
          previousExercise.cardioIntensity &&
          currentExercise.cardioIntensity &&
          previousExercise.cardioDuration &&
          currentExercise.cardioDuration
        ) {
          const recommendations = analyzeCardioForProgression(
            previousExercise.cardioIntensity,
            previousExercise.cardioDuration,
            currentExercise.cardioIntensity,
            currentExercise.cardioDuration
          );

          if (recommendations.length > 0) {
            suggestions.push({
              exerciseId: currentExercise.id,
              exerciseName: currentExercise.name,
              isCardio: true,
              recommendations,
            });
          }
        }
      }
    });

    return suggestions;
  }

  // Função para analisar séries e recomendar progressões para exercícios de força
  function analyzeSetsForProgression(
    previousSets: ExerciseSet[],
    currentSets: ExerciseSet[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Se não há séries anteriores ou atuais, retornar vazio
    if (!previousSets.length || !currentSets.length) return recommendations;

    // Obter a média de repetições e peso do treino anterior
    const previousAvgReps =
      previousSets.reduce((sum, set) => sum + set.reps, 0) /
      previousSets.length;
    const previousAvgWeight =
      previousSets.reduce((sum, set) => sum + set.weight, 0) /
      previousSets.length;
    const previousMaxWeight = Math.max(
      ...previousSets.map((set) => set.weight)
    );

    // Verificar se vale a pena aumentar repetições ou carga
    const shouldIncreaseReps = previousAvgReps < 12;
    const reachedMaxReps = previousAvgReps >= 12;

    if (shouldIncreaseReps) {
      // Sugerir aumentar repetições até chegar em 12
      recommendations.push({
        type: "reps",
        current: Math.round(previousAvgReps),
        suggested: Math.min(Math.round(previousAvgReps + 1), 12),
        message: t("progression.increaseReps", {
          current: Math.round(previousAvgReps),
          target: Math.min(Math.round(previousAvgReps + 1), 12),
        }),
      });
    } else if (reachedMaxReps) {
      // Sugerir aumentar carga e reduzir repetições
      const increasePercentage = 0.05; // 5% de aumento
      const suggestedWeight = Math.round(
        previousMaxWeight * (1 + increasePercentage)
      );

      recommendations.push({
        type: "weight",
        current: previousMaxWeight,
        suggested: suggestedWeight,
        message: t("progression.increaseWeight", {
          current: previousMaxWeight,
          target: suggestedWeight,
        }),
      });

      recommendations.push({
        type: "reducereps",
        message: t("progression.reduceReps", { target: 8 }),
      });
    }

    return recommendations;
  }

  // Função para analisar e recomendar progressões para exercícios de cardio
  function analyzeCardioForProgression(
    previousIntensity: number,
    previousDuration: number,
    currentIntensity: number,
    currentDuration: number
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Verificar se é melhor aumentar intensidade ou duração
    if (previousIntensity < 8) {
      // Se a intensidade for baixa, sugerir aumentar intensidade primeiro
      recommendations.push({
        type: "intensity",
        current: previousIntensity,
        suggested: Math.min(previousIntensity + 1, 10),
        message: t("progression.increaseIntensity", {
          current: previousIntensity,
          target: Math.min(previousIntensity + 1, 10),
        }),
      });
    } else {
      // Se a intensidade já estiver alta, sugerir aumentar duração
      const suggestedDuration = Math.min(
        previousDuration + 5,
        previousDuration * 1.2
      );

      recommendations.push({
        type: "duration",
        current: previousDuration,
        suggested: Math.round(suggestedDuration),
        message: t("progression.increaseDuration", {
          current: previousDuration,
          target: Math.round(suggestedDuration),
        }),
      });
    }

    return recommendations;
  }

  // Formatador de data
  const formatDate = (dateString: string) => {
    if (!dateString) return "";

    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    // Retornar no formato dd/mm/yyyy
    return date.toLocaleDateString();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  // Renderizar seção educacional sobre o princípio da sobrecarga progressiva
  const renderEducationalSection = () => {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollViewStyle}
        contentContainerStyle={styles.educationalContainer}
      >
        <View style={styles.educationCard}>
          <Text style={[styles.educationTitle, { color: colors.text }]}>
            {t("progression.educationTitle", "Sobrecarga Progressiva")}
          </Text>

          <Text
            style={[styles.educationDescription, { color: colors.text + "DD" }]}
          >
            {t(
              "progression.educationDescription",
              "O princípio fundamental para ganhar força e massa muscular. Consiste em aumentar gradualmente o estímulo para seu corpo continuar se adaptando e evoluindo."
            )}
          </Text>

          <View style={styles.divider} />

          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            {t("progression.howItWorks", "Como funciona:")}
          </Text>

          <View style={styles.cycleContainer}>
            {/* Etapa 1 */}
            <View style={styles.cycleStep}>
              <View
                style={[styles.cycleNumber, { backgroundColor: workoutColor }]}
              >
                <Text style={styles.cycleNumberText}>1</Text>
              </View>
              <View style={styles.cycleContent}>
                <Text style={[styles.cycleTitle, { color: colors.text }]}>
                  {t("progression.step1Title", "Desafio")}
                </Text>
                <Text
                  style={[
                    styles.cycleDescription,
                    { color: colors.text + "99" },
                  ]}
                >
                  {t(
                    "progression.step1Description",
                    "Submeta seus músculos a um estímulo cada vez maior"
                  )}
                </Text>
              </View>
            </View>

            {/* Etapa 2 */}
            <View style={styles.cycleStep}>
              <View
                style={[styles.cycleNumber, { backgroundColor: workoutColor }]}
              >
                <Text style={styles.cycleNumberText}>2</Text>
              </View>
              <View style={styles.cycleContent}>
                <Text style={[styles.cycleTitle, { color: colors.text }]}>
                  {t("progression.step2Title", "Adaptação")}
                </Text>
                <Text
                  style={[
                    styles.cycleDescription,
                    { color: colors.text + "99" },
                  ]}
                >
                  {t(
                    "progression.step2Description",
                    "Seu corpo se adapta e fica mais forte"
                  )}
                </Text>
              </View>
            </View>

            {/* Etapa 3 */}
            <View style={styles.cycleStep}>
              <View
                style={[styles.cycleNumber, { backgroundColor: workoutColor }]}
              >
                <Text style={styles.cycleNumberText}>3</Text>
              </View>
              <View style={styles.cycleContent}>
                <Text style={[styles.cycleTitle, { color: colors.text }]}>
                  {t("progression.step3Title", "Progresso")}
                </Text>
                <Text
                  style={[
                    styles.cycleDescription,
                    { color: colors.text + "99" },
                  ]}
                >
                  {t(
                    "progression.step3Description",
                    "Aumente o peso ou repetições para continuar evoluindo"
                  )}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            {t("progression.howToProgress", "Como progredir no treino:")}
          </Text>

          <View style={styles.progressionGuide}>
            <View style={styles.guideItem}>
              <Text style={[styles.guideNumber, { color: workoutColor }]}>
                1.
              </Text>
              <Text style={[styles.guideText, { color: colors.text + "DD" }]}>
                {t(
                  "progression.guide1",
                  "Aumente as repetições até 10-12 reps"
                )}
              </Text>
            </View>

            <View style={styles.guideItem}>
              <Text style={[styles.guideNumber, { color: workoutColor }]}>
                2.
              </Text>
              <Text style={[styles.guideText, { color: colors.text + "DD" }]}>
                {t(
                  "progression.guide2",
                  "Quando conseguir 12 reps, aumente o peso"
                )}
              </Text>
            </View>

            <View style={styles.guideItem}>
              <Text style={[styles.guideNumber, { color: workoutColor }]}>
                3.
              </Text>
              <Text style={[styles.guideText, { color: colors.text + "DD" }]}>
                {t(
                  "progression.guide3",
                  "Reduza para 6-8 reps com o novo peso"
                )}
              </Text>
            </View>

            <View style={styles.guideItem}>
              <Text style={[styles.guideNumber, { color: workoutColor }]}>
                4.
              </Text>
              <Text style={[styles.guideText, { color: colors.text + "DD" }]}>
                {t(
                  "progression.guide4",
                  "Repita o ciclo para continuar progredindo"
                )}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Renderizar seção de sugestões de progressão
  const renderSuggestionsSection = () => {
    if (!previousDate) {
      return (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.iconBackground,
              { backgroundColor: workoutColor + "20" },
            ]}
          >
            <Ionicons name="fitness-outline" size={32} color={workoutColor} />
          </View>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {t("progression.noHistory")}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.text + "80" }]}>
            {t("progression.completeWorkoutFirst")}
          </Text>
        </View>
      );
    }

    if (progressionSuggestions.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.iconBackground,
              { backgroundColor: workoutColor + "20" },
            ]}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={32}
              color={workoutColor}
            />
          </View>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {t("progression.noSuggestions")}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.text + "80" }]}>
            {t("progression.keepGoing")}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollViewStyle}
        contentContainerStyle={styles.suggestionsContainer}
      >
        <Text style={[styles.basedOnText, { color: colors.text + "99" }]}>
          {t("progression.basedOn", { date: formatDate(previousDate) })}
        </Text>

        {progressionSuggestions.map((suggestion, index) => (
          <View
            key={`suggestion-${suggestion.exerciseId}-${index}`}
            style={[
              styles.exerciseCard,
              {
                backgroundColor: colors.text + "06",
                borderColor: colors.border + "40",
              },
            ]}
          >
            <Text style={[styles.exerciseName, { color: colors.text }]}>
              {suggestion.exerciseName}
            </Text>

            <View style={styles.recommendationsContainer}>
              {suggestion.recommendations.map(
                (rec: Recommendation, recIndex: number) => (
                  <View
                    key={`rec-${recIndex}`}
                    style={styles.recommendationItem}
                  >
                    <View
                      style={[
                        styles.recommendationBullet,
                        { backgroundColor: workoutColor },
                      ]}
                    />
                    <Text
                      style={[
                        styles.recommendationText,
                        { color: colors.text + "DD" },
                      ]}
                    >
                      {rec.message}
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.light,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("progression.title", "Evolução do Treino")}
            </Text>
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: colors.text + "10" },
              ]}
              onPress={handleClose}
            >
              <Ionicons
                name="close-outline"
                size={24}
                color={colors.text + "99"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === "sugestões" && [
                  styles.activeTab,
                  { borderColor: workoutColor },
                ],
              ]}
              onPress={() => setSelectedTab("sugestões")}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      selectedTab === "sugestões"
                        ? workoutColor
                        : colors.text + "99",
                  },
                ]}
              >
                {t("progression.suggestionsTab", "Sugestões")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === "educação" && [
                  styles.activeTab,
                  { borderColor: workoutColor },
                ],
              ]}
              onPress={() => setSelectedTab("educação")}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      selectedTab === "educação"
                        ? workoutColor
                        : colors.text + "99",
                  },
                ]}
              >
                {t("progression.educationTab", "Aprenda")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scrollContent}>
            {selectedTab === "sugestões"
              ? renderSuggestionsSection()
              : renderEducationalSection()}
          </View>

          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: workoutColor }]}
            onPress={handleClose}
          >
            <Text style={styles.modalButtonText}>
              {t("common.gotIt", "Entendi")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.89)",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    height: "70%",
    maxHeight: "90%",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderWidth: 1,
    flexDirection: "column",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    flex: 1,
    marginBottom: 10,
  },
  scrollViewStyle: {
    flex: 1,
  },
  // Estilos para a seção de sugestões
  suggestionsContainer: {
    paddingBottom: 20,
  },
  basedOnText: {
    fontSize: 15,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "500",
  },
  exerciseCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  recommendationsContainer: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  recommendationBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 10,
  },
  recommendationText: {
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
    letterSpacing: -0.2,
    fontWeight: "500",
  },
  // Estilos para a seção educacional
  educationalContainer: {
    paddingBottom: 20,
  },
  educationCard: {
    borderRadius: 16,
    padding: 16,
  },
  educationTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  educationDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#00000010",
    marginVertical: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  cycleContainer: {
    marginBottom: 16,
  },
  cycleStep: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  cycleNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cycleNumberText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },
  cycleContent: {
    flex: 1,
  },
  cycleTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  cycleDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  progressionGuide: {
    marginTop: 8,
  },
  guideItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  guideNumber: {
    fontSize: 16,
    fontWeight: "800",
    marginRight: 10,
    width: 20,
  },
  guideText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    fontWeight: "500",
  },
  // Estilos para estado vazio
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
