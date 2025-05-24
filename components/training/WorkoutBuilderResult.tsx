import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { WorkoutTemplate } from "../../utils/workoutBuilderAlgorithm";
import * as Haptics from "expo-haptics";
import ExerciseCard from "./ExerciseCard";
import { useWorkoutContext } from "../../context/WorkoutContext";

// Propriedades para o componente
interface WorkoutBuilderResultProps {
  workoutTemplate: WorkoutTemplate | null;
  isLoading: boolean;
  theme: "light" | "dark";
  workoutColor: string;
  onBack: () => void;
  onReset: () => void;
  onClose: () => void;
  workoutId: string;
}

const WorkoutBuilderResult: React.FC<WorkoutBuilderResultProps> = ({
  workoutTemplate,
  isLoading,
  theme,
  workoutColor,
  onBack,
  onReset,
  onClose,
  workoutId,
}) => {
  const colors = Colors[theme];
  const { addExerciseToWorkout } = useWorkoutContext();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveWorkout = async () => {
    if (!workoutTemplate) return;

    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Adicionar cada exercício ao treino atual
      for (const exercise of workoutTemplate.exercises) {
        await addExerciseToWorkout(workoutId, exercise);
      }

      // Indicar sucesso
      setSaved(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Fechar após um tempo
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Erro ao salvar",
        "Não foi possível salvar o treino. Tente novamente."
      );
    } finally {
      setSaving(false);
    }
  };

  const getDifficultyLabel = (difficulty: 1 | 2 | 3 | 4 | 5) => {
    switch (difficulty) {
      case 1:
        return "Muito Fácil";
      case 2:
        return "Fácil";
      case 3:
        return "Moderado";
      case 4:
        return "Difícil";
      case 5:
        return "Muito Difícil";
    }
  };

  const renderDifficultyStars = (difficulty: 1 | 2 | 3 | 4 | 5) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= difficulty ? "star" : "star-outline"}
            size={16}
            color={star <= difficulty ? workoutColor : colors.secondary}
            style={styles.starIcon}
          />
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={workoutColor} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Criando seu treino personalizado...
        </Text>
      </View>
    );
  }

  if (!workoutTemplate) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Erro ao gerar treino
        </Text>
        <Text style={[styles.errorMessage, { color: colors.secondary }]}>
          Não foi possível criar o treino personalizado. Tente novamente com
          outros parâmetros.
        </Text>
        <TouchableOpacity
          style={[styles.tryAgainButton, { backgroundColor: workoutColor }]}
          onPress={onReset}
        >
          <Text style={styles.tryAgainButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.light }]}>
          <Ionicons name="time-outline" size={20} color={workoutColor} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {workoutTemplate.estimatedDuration} min
          </Text>
          <Text style={[styles.statLabel, { color: colors.secondary }]}>
            Duração
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.light }]}>
          <Ionicons name="barbell-outline" size={20} color={workoutColor} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {workoutTemplate.exercises.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.secondary }]}>
            Exercícios
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.light }]}>
          <Ionicons name="trending-up-outline" size={20} color={workoutColor} />
          <View style={styles.difficultyContainer}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {getDifficultyLabel(workoutTemplate.difficulty)}
            </Text>
            {renderDifficultyStars(workoutTemplate.difficulty)}
          </View>
          <Text style={[styles.statLabel, { color: colors.secondary }]}>
            Dificuldade
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.exercisesContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Exercícios
        </Text>

        {workoutTemplate.exercises.map((exercise, index) => (
          <View key={exercise.id} style={styles.exerciseCardContainer}>
            <View style={styles.exerciseIndexContainer}>
              <Text style={[styles.exerciseIndex, { color: colors.secondary }]}>
                {index + 1}
              </Text>
            </View>
            <View style={styles.exerciseDetailsContainer}>
              <Text style={[styles.exerciseName, { color: colors.text }]}>
                {exercise.name}
              </Text>

              <View style={styles.setsContainer}>
                {exercise.sets?.map((set, setIndex) => (
                  <View
                    key={set.id}
                    style={[
                      styles.setRow,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.setText, { color: colors.secondary }]}>
                      Série {setIndex + 1}
                    </Text>
                    <Text style={[styles.setText, { color: colors.text }]}>
                      {set.reps} reps
                    </Text>
                    <Text style={[styles.setText, { color: colors.text }]}>
                      {set.isBodyweightExercise
                        ? "Peso Corporal"
                        : `${set.weight} kg`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.border }]}
          onPress={onBack}
          disabled={saving || saved}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={[styles.backButtonText, { color: colors.text }]}>
            Voltar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: saved ? colors.success : workoutColor,
              opacity: saving ? 0.7 : 1,
            },
          ]}
          onPress={handleSaveWorkout}
          disabled={saving || saved}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Text style={styles.saveButtonText}>
                {saved ? "Treino Salvo!" : "Salvar Treino"}
              </Text>
              <Ionicons
                name={saved ? "checkmark-circle" : "save-outline"}
                size={20}
                color="#FFF"
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  tryAgainButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  tryAgainButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  difficultyContainer: {
    alignItems: "center",
  },
  starsContainer: {
    flexDirection: "row",
    marginTop: 2,
  },
  starIcon: {
    marginHorizontal: 1,
  },
  exercisesContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  exerciseCardContainer: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  exerciseIndexContainer: {
    width: 32,
    alignItems: "center",
    paddingTop: 12,
  },
  exerciseIndex: {
    fontSize: 14,
    fontWeight: "700",
  },
  exerciseDetailsContainer: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  setsContainer: {
    borderRadius: 8,
    overflow: "hidden",
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  setText: {
    fontSize: 14,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 1,
    flex: 1,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    flex: 1,
    marginLeft: 8,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 8,
  },
});

export default WorkoutBuilderResult;
