import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  AntDesign,
} from "@expo/vector-icons";
import { MotiView } from "moti";
import { ExerciseSet } from "../../context/WorkoutContext";
import { ProgressionSuggestion } from "../../utils/progressionAlgorithm";
import { getExerciseById } from "../../data/exerciseDatabase";
import Colors from "../../constants/Colors";
import ProgressionConfirmDialog from "./ProgressionConfirmDialog";
import { useTranslation } from "react-i18next";

interface ProgressionCardProps {
  suggestion: ProgressionSuggestion;
  index: number;
  isSelected: boolean;
  workoutColor: string;
  theme: "light" | "dark";
  onToggleSelection: (exerciseId: string, updatedSets?: ExerciseSet[]) => void;
}

export default function ProgressionCard({
  suggestion,
  index,
  isSelected,
  workoutColor,
  theme,
  onToggleSelection,
}: ProgressionCardProps) {
  const colors = Colors[theme];
  const exerciseDB = getExerciseById(suggestion.exerciseId);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"previous" | "suggested">(
    "previous"
  );
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const { t } = useTranslation();

  // Calcula a diferença entre dois valores
  const calculateDifference = (newValue: number, oldValue: number) => {
    const diff = newValue - oldValue;
    return {
      value: diff,
      isPositive: diff > 0,
      isNegative: diff < 0,
      formattedValue: diff > 0 ? `+${diff}` : `${diff}`,
    };
  };

  // Adicionar função para obter o nome traduzido do exercício
  const getTranslatedExerciseName = () => {
    if (
      exerciseDB?.id &&
      exerciseDB.id.length <= 6 &&
      exerciseDB.id.startsWith("ex")
    ) {
      return t(`exercises.exercises.${exerciseDB.id}`);
    }
    return suggestion.exerciseName;
  };

  // Renderizar uma linha da tabela de séries
  const renderSetRow = (
    set: ExerciseSet,
    isNew: boolean = false,
    previousSet?: ExerciseSet
  ) => (
    <View
      key={set.id}
      style={[
        styles.setRow,
        theme === "dark" && { borderTopColor: colors.border },
      ]}
    >
      <View style={styles.setCellContainer}>
        <Text style={[styles.setCell, { color: colors.text }]}>
          {set.weight}kg
          {isNew &&
            previousSet &&
            calculateDifference(set.weight, previousSet.weight).value !== 0 && (
              <Text style={[styles.diffText, { color: workoutColor }]}>
                {" "}
                {
                  calculateDifference(set.weight, previousSet.weight)
                    .formattedValue
                }
              </Text>
            )}
        </Text>
      </View>

      <View style={styles.setCellContainer}>
        <Text style={[styles.setCell, { color: colors.text }]}>
          {set.reps}
          {isNew &&
            previousSet &&
            calculateDifference(set.reps, previousSet.reps).value !== 0 && (
              <Text style={[styles.diffText, { color: workoutColor }]}>
                {" "}
                {calculateDifference(set.reps, previousSet.reps).formattedValue}
              </Text>
            )}
        </Text>
      </View>

      <View style={styles.setCellContainer}>
        <Text style={[styles.setCell, { color: colors.text }]}>
          {set.restTime || 60}s
          {isNew &&
            previousSet &&
            calculateDifference(set.restTime || 60, previousSet.restTime || 60)
              .value !== 0 && (
              <Text style={[styles.diffText, { color: workoutColor }]}>
                {" "}
                {
                  calculateDifference(
                    set.restTime || 60,
                    previousSet.restTime || 60
                  ).formattedValue
                }
              </Text>
            )}
        </Text>
      </View>
    </View>
  );

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Função para lidar com o clique na seleção do card
  const handleSelection = () => {
    // Se já estiver selecionado, apenas deseleciona
    if (isSelected) {
      onToggleSelection(suggestion.exerciseId);
      return;
    }

    // Se não estiver selecionado, abre o diálogo de configuração
    setShowConfigDialog(true);
  };

  // Função para confirmar a progressão com os sets atualizados
  const handleConfirmProgression = (updatedSets: ExerciseSet[]) => {
    // Fecha o diálogo
    setShowConfigDialog(false);

    // Chama a função para selecionar o exercício, passando os sets atualizados
    onToggleSelection(suggestion.exerciseId, updatedSets);
  };

  // Obter o grupo muscular e equipamento para o subtítulo
  const getSubtitle = () => {
    if (!exerciseDB) return t("progression.card.exercise");

    return `${exerciseDB.muscle}${
      exerciseDB.equipment ? ` • ${exerciseDB.equipment}` : ""
    }`;
  };

  return (
    <>
      <MotiView
        key={suggestion.exerciseId}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: index * 50, type: "timing", duration: 300 }}
        style={[
          styles.exerciseCard,
          {
            backgroundColor: theme === "dark" ? colors.light : "#FFFFFF",
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? workoutColor : colors.border,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSelection}
          style={styles.cardTouchable}
        >
          {/* Header no estilo do NutritionSummaryCard */}
          <View style={styles.header}>
            <View style={styles.leftContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: workoutColor + "20" },
                ]}
              >
                <MaterialCommunityIcons
                  name="weight-lifter"
                  size={18}
                  color={workoutColor}
                />
              </View>
              <View style={styles.textContainer}>
                <Text
                  style={[styles.title, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {getTranslatedExerciseName()}
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.text + "80" }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {getSubtitle()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.expandButton,
                { backgroundColor: colors.text + "10" },
              ]}
              onPress={(e) => {
                e.stopPropagation(); // Prevenir que o card seja selecionado
                toggleExpanded();
              }}
            >
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.text + "80"}
              />
            </TouchableOpacity>
          </View>

          {expanded && (
            <View
              style={[
                styles.exerciseCardContent,
                { backgroundColor: colors.light },
              ]}
            >
              <View style={styles.reasonContainer}>
                <Text style={[styles.reasonText, { color: colors.secondary }]}>
                  {suggestion.reasonForSuggestion}
                </Text>
              </View>

              {/* Tabs para alternar entre treino anterior e progressão sugerida */}
              <View style={styles.tabsContainer}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === "previous" && {
                      borderBottomWidth: 2,
                      borderBottomColor: colors.secondary,
                    },
                  ]}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevenir que o card seja selecionado
                    setActiveTab("previous");
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          activeTab === "previous"
                            ? colors.secondary
                            : colors.text + "80",
                      },
                      activeTab === "previous" && { fontWeight: "600" },
                    ]}
                  >
                    {t("progression.card.previousWorkout")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === "suggested" && {
                      borderBottomWidth: 2,
                      borderBottomColor: workoutColor,
                    },
                  ]}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevenir que o card seja selecionado
                    setActiveTab("suggested");
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          activeTab === "suggested"
                            ? workoutColor
                            : colors.text + "80",
                      },
                      activeTab === "suggested" && { fontWeight: "600" },
                    ]}
                  >
                    {t("progression.card.suggestedProgression")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Conteúdo da aba */}
              <View style={styles.tabContent}>
                {activeTab === "previous" ? (
                  <View style={styles.tableContainer}>
                    <View
                      style={[styles.setsTable, { borderColor: colors.border }]}
                    >
                      <View
                        style={[
                          styles.setsHeader,
                          { backgroundColor: colors.card },
                        ]}
                      >
                        <Text
                          style={[
                            styles.setsHeaderText,
                            { color: colors.secondary },
                          ]}
                        >
                          {t("progression.card.weight")}
                        </Text>
                        <Text
                          style={[
                            styles.setsHeaderText,
                            { color: colors.secondary },
                          ]}
                        >
                          {t("progression.card.reps")}
                        </Text>
                        <Text
                          style={[
                            styles.setsHeaderText,
                            { color: colors.secondary },
                          ]}
                        >
                          {t("progression.card.restTime")}
                        </Text>
                      </View>
                      {suggestion.previousSets.map((set) => renderSetRow(set))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.tableContainer}>
                    <View
                      style={[styles.setsTable, { borderColor: colors.border }]}
                    >
                      <View
                        style={[
                          styles.setsHeader,
                          { backgroundColor: colors.card },
                        ]}
                      >
                        <Text
                          style={[
                            styles.setsHeaderText,
                            { color: workoutColor },
                          ]}
                        >
                          {t("progression.card.weight")}
                        </Text>
                        <Text
                          style={[
                            styles.setsHeaderText,
                            { color: workoutColor },
                          ]}
                        >
                          {t("progression.card.reps")}
                        </Text>
                        <Text
                          style={[
                            styles.setsHeaderText,
                            { color: workoutColor },
                          ]}
                        >
                          {t("progression.card.restTime")}
                        </Text>
                      </View>
                      {suggestion.suggestedSets.map((set, idx) =>
                        renderSetRow(
                          set,
                          true,
                          idx < suggestion.previousSets.length
                            ? suggestion.previousSets[idx]
                            : undefined
                        )
                      )}
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>
      </MotiView>

      {/* Diálogo de confirmação para a progressão */}
      <ProgressionConfirmDialog
        visible={showConfigDialog}
        onClose={() => setShowConfigDialog(false)}
        onConfirm={handleConfirmProgression}
        exerciseName={suggestion.exerciseName}
        exerciseDB={exerciseDB}
        previousSets={suggestion.previousSets}
        suggestedSets={suggestion.suggestedSets}
        workoutColor={workoutColor}
        theme={theme}
      />
    </>
  );
}

const styles = StyleSheet.create({
  exerciseCard: {
    marginBottom: 16,
    borderRadius: 14,
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
    padding: 16,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    overflow: "hidden",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    overflow: "hidden",
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
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    flexShrink: 1,
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
  exerciseCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  exerciseCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseDetails: {
    fontSize: 13,
    marginLeft: 8,
  },
  exerciseCardContent: {
    padding: 16,
  },
  reasonContainer: {
    marginBottom: 16,
  },
  reasonText: {
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
  },
  // Estilos para as abas
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
  },
  tabContent: {
    paddingTop: 8,
  },
  tableContainer: {
    marginBottom: 16,
  },
  comparisonHeader: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  setsTable: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
  },
  setsHeader: {
    flexDirection: "row",
    paddingVertical: 10,
  },
  setsHeaderText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    position: "relative",
  },
  setCellContainer: {
    flex: 1,
    alignItems: "center",
  },
  setCell: {
    fontSize: 15,
    fontWeight: "500",
  },
  diffText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
