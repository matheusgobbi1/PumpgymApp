import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { ExperienceLevel } from "../../utils/workoutBuilderAlgorithm";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

// Propriedades para o componente
interface WorkoutBuilderStep1Props {
  experienceLevel: ExperienceLevel | null;
  setExperienceLevel: (level: ExperienceLevel) => void;
  theme: "light" | "dark";
  workoutColor: string;
  onNext: () => void;
}

// Definições de experiência com ícones e descrições
const experienceLevels: Array<{
  id: ExperienceLevel;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    id: "sedentary",
    title: "Sedentário",
    description: "Pouca ou nenhuma atividade física regular",
    icon: "body-outline",
  },
  {
    id: "beginner",
    title: "Iniciante",
    description: "Começando a treinar ou retornando após longo período",
    icon: "barbell-outline",
  },
  {
    id: "intermediate",
    title: "Intermediário",
    description: "Treinando consistentemente há alguns meses",
    icon: "fitness-outline",
  },
  {
    id: "advanced",
    title: "Avançado",
    description: "Treinando intensamente há mais de um ano",
    icon: "flash-outline",
  },
  {
    id: "athlete",
    title: "Atleta",
    description: "Alto nível de condicionamento e experiência",
    icon: "trophy-outline",
  },
];

const WorkoutBuilderStep1: React.FC<WorkoutBuilderStep1Props> = ({
  experienceLevel,
  setExperienceLevel,
  theme,
  workoutColor,
  onNext,
}) => {
  const colors = Colors[theme];

  const handleSelectLevel = (level: ExperienceLevel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExperienceLevel(level);
  };

  const handleNext = () => {
    if (experienceLevel) {
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
        {experienceLevels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.levelCard,
              {
                backgroundColor: colors.light,
                borderColor:
                  experienceLevel === level.id ? workoutColor : colors.border,
                borderWidth: experienceLevel === level.id ? 2 : 1,
              },
            ]}
            onPress={() => handleSelectLevel(level.id)}
          >
            <View style={styles.levelContent}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor:
                      experienceLevel === level.id
                        ? workoutColor
                        : colors.lightGray,
                  },
                ]}
              >
                <Ionicons
                  name={level.icon as any}
                  size={24}
                  color={experienceLevel === level.id ? "#FFF" : colors.text}
                />
              </View>
              <View style={styles.levelTextContainer}>
                <Text
                  style={[
                    styles.levelTitle,
                    {
                      color: colors.text,
                      fontWeight: experienceLevel === level.id ? "700" : "600",
                    },
                  ]}
                >
                  {level.title}
                </Text>
                <Text
                  style={[styles.levelDescription, { color: colors.secondary }]}
                >
                  {level.description}
                </Text>
              </View>
              {experienceLevel === level.id && (
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

      <TouchableOpacity
        style={[
          styles.nextButton,
          {
            backgroundColor: workoutColor,
            opacity: experienceLevel ? 1 : 0.5,
          },
        ]}
        onPress={handleNext}
        disabled={!experienceLevel}
      >
        <Text style={styles.nextButtonText}>Continuar</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFF" />
      </TouchableOpacity>
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
  levelCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelContent: {
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
  levelTextContainer: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  levelDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  checkIcon: {
    marginLeft: 12,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 16,
  },
  nextButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 8,
  },
});

export default WorkoutBuilderStep1;
