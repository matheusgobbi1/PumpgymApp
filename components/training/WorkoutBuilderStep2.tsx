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
import { muscleGroups } from "../../data/exerciseDatabase";
import * as Haptics from "expo-haptics";

// Propriedades para o componente
interface WorkoutBuilderStep2Props {
  selectedMuscles: string[];
  setSelectedMuscles: (muscles: string[]) => void;
  theme: "light" | "dark";
  workoutColor: string;
  onNext: () => void;
  onBack: () => void;
}

const WorkoutBuilderStep2: React.FC<WorkoutBuilderStep2Props> = ({
  selectedMuscles,
  setSelectedMuscles,
  theme,
  workoutColor,
  onNext,
  onBack,
}) => {
  const colors = Colors[theme];

  const toggleMuscle = (muscle: string) => {
    Haptics.selectionAsync();
    if (selectedMuscles.includes(muscle)) {
      setSelectedMuscles(selectedMuscles.filter((m) => m !== muscle));
    } else {
      // Se "Corpo inteiro" for selecionado, limpar outros músculos
      if (muscle === "Corpo inteiro") {
        setSelectedMuscles(["Corpo inteiro"]);
      } else {
        // Se outros músculos forem selecionados, remover "Corpo inteiro"
        const newSelected = selectedMuscles.filter(
          (m) => m !== "Corpo inteiro"
        );
        setSelectedMuscles([...newSelected, muscle]);
      }
    }
  };

  const handleNext = () => {
    if (selectedMuscles.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onNext();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.optionsContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.musclesGrid}>
          {muscleGroups.map((muscle) => (
            <TouchableOpacity
              key={muscle}
              style={[
                styles.muscleCard,
                {
                  backgroundColor: selectedMuscles.includes(muscle)
                    ? workoutColor
                    : colors.light,
                  borderColor: selectedMuscles.includes(muscle)
                    ? workoutColor
                    : colors.border,
                },
              ]}
              onPress={() => toggleMuscle(muscle)}
            >
              <Text
                style={[
                  styles.muscleName,
                  {
                    color: selectedMuscles.includes(muscle)
                      ? "#FFF"
                      : colors.text,
                  },
                ]}
                numberOfLines={1}
              >
                {muscle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
              opacity: selectedMuscles.length > 0 ? 1 : 0.5,
            },
          ]}
          onPress={handleNext}
          disabled={selectedMuscles.length === 0}
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
  musclesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  muscleCard: {
    width: "48%",
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  muscleName: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
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

export default WorkoutBuilderStep2;
