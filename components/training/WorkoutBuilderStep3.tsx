import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { WorkoutGoal } from "../../utils/workoutBuilderAlgorithm";
import * as Haptics from "expo-haptics";

// Propriedades para o componente
interface WorkoutBuilderStep3Props {
  workoutGoal: WorkoutGoal | null;
  setWorkoutGoal: (goal: WorkoutGoal) => void;
  theme: "light" | "dark";
  workoutColor: string;
  onNext: () => void;
  onBack: () => void;
}

// Definições de objetivos com ícones e descrições
const workoutGoals: Array<{
  id: WorkoutGoal;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    id: "strength",
    title: "Força",
    description: "Aumentar a força muscular e a potência",
    icon: "barbell-outline",
  },
  {
    id: "hypertrophy",
    title: "Hipertrofia",
    description: "Ganhar massa muscular e volume",
    icon: "fitness-outline",
  },
  {
    id: "endurance",
    title: "Resistência",
    description: "Melhorar a resistência muscular e cardiorrespiratória",
    icon: "pulse-outline",
  },
  {
    id: "weightloss",
    title: "Perda de peso",
    description: "Queimar calorias e reduzir gordura",
    icon: "flame-outline",
  },
  {
    id: "general",
    title: "Condicionamento geral",
    description: "Melhorar a saúde e condicionamento físico",
    icon: "body-outline",
  },
];

const WorkoutBuilderStep3: React.FC<WorkoutBuilderStep3Props> = ({
  workoutGoal,
  setWorkoutGoal,
  theme,
  workoutColor,
  onNext,
  onBack,
}) => {
  const colors = Colors[theme];

  const handleSelectGoal = (goal: WorkoutGoal) => {
    Haptics.selectionAsync();
    setWorkoutGoal(goal);
  };

  const handleNext = () => {
    if (workoutGoal) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onNext();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.optionsContainer}
        showsVerticalScrollIndicator={false}
      >
        {workoutGoals.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={[
              styles.goalCard,
              {
                backgroundColor: colors.light,
                borderColor:
                  workoutGoal === goal.id ? workoutColor : colors.border,
                borderWidth: workoutGoal === goal.id ? 2 : 1,
              },
            ]}
            onPress={() => handleSelectGoal(goal.id)}
          >
            <View style={styles.goalContent}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor:
                      workoutGoal === goal.id ? workoutColor : colors.lightGray,
                  },
                ]}
              >
                <Ionicons
                  name={goal.icon as any}
                  size={24}
                  color={workoutGoal === goal.id ? "#FFF" : colors.text}
                />
              </View>
              <View style={styles.goalTextContainer}>
                <Text
                  style={[
                    styles.goalTitle,
                    {
                      color: colors.text,
                      fontWeight: workoutGoal === goal.id ? "700" : "600",
                    },
                  ]}
                >
                  {goal.title}
                </Text>
                <Text
                  style={[styles.goalDescription, { color: colors.secondary }]}
                >
                  {goal.description}
                </Text>
              </View>
              {workoutGoal === goal.id && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={workoutColor}
                  style={styles.checkIcon}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.border }]}
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={[styles.backButtonText, { color: colors.text }]}>
            Voltar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: workoutColor,
              opacity: workoutGoal ? 1 : 0.5,
            },
          ]}
          onPress={handleNext}
          disabled={!workoutGoal}
        >
          <Text style={styles.nextButtonText}>Continuar</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
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
  optionsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  goalCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  checkIcon: {
    marginLeft: 12,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    flex: 1,
    marginLeft: 8,
  },
  nextButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 8,
  },
});

export default WorkoutBuilderStep3;
