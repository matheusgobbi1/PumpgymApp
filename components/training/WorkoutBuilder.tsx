import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useNutrition } from "../../context/NutritionContext";
import { useAuth } from "../../context/AuthContext";
import {
  ExperienceLevel,
  WorkoutGoal,
  BuilderPreferences,
  generatePersonalizedWorkout,
  WorkoutTemplate,
} from "../../utils/workoutBuilderAlgorithm";
import WorkoutBuilderStep1 from "./WorkoutBuilderStep1";
import WorkoutBuilderStep2 from "./WorkoutBuilderStep2";
import WorkoutBuilderStep3 from "./WorkoutBuilderStep3";
import WorkoutBuilderResult from "./WorkoutBuilderResult";

interface WorkoutBuilderProps {
  theme: "light" | "dark";
  workoutColor: string;
  workoutId: string;
  onClose: () => void;
  onStepChange: (step: string) => void;
}

type Step = "experience" | "muscles" | "goal" | "result";

const WorkoutBuilder: React.FC<WorkoutBuilderProps> = ({
  theme,
  workoutColor,
  workoutId,
  onClose,
  onStepChange,
}) => {
  // Estados
  const [currentStep, setCurrentStep] = useState<Step>("experience");
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel | null>(null);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [workoutGoal, setWorkoutGoal] = useState<WorkoutGoal | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [workoutTemplate, setWorkoutTemplate] =
    useState<WorkoutTemplate | null>(null);

  // Contextos
  const { nutritionInfo } = useNutrition();
  const { user } = useAuth();

  // Navegação entre passos
  const goToNextStep = () => {
    switch (currentStep) {
      case "experience":
        setCurrentStep("muscles");
        onStepChange("muscles");
        break;
      case "muscles":
        setCurrentStep("goal");
        onStepChange("goal");
        break;
      case "goal":
        setCurrentStep("result");
        onStepChange("result");
        generateWorkout();
        break;
    }
  };

  const goToPreviousStep = () => {
    switch (currentStep) {
      case "muscles":
        setCurrentStep("experience");
        onStepChange("experience");
        break;
      case "goal":
        setCurrentStep("muscles");
        onStepChange("muscles");
        break;
      case "result":
        setCurrentStep("goal");
        onStepChange("goal");
        break;
    }
  };

  const resetBuilder = () => {
    setExperienceLevel(null);
    setSelectedMuscles([]);
    setWorkoutGoal(null);
    setWorkoutTemplate(null);
    setCurrentStep("experience");
  };

  // Gerar o treino baseado nas preferências do usuário
  const generateWorkout = async () => {
    if (!experienceLevel || selectedMuscles.length === 0 || !workoutGoal) {
      return;
    }

    try {
      setIsGenerating(true);

      // Obter gênero do usuário do contexto de nutrição, ou usar "other" como fallback
      const gender = nutritionInfo.gender || "other";

      // Construir preferências para o algoritmo
      const preferences: BuilderPreferences = {
        gender: gender as "male" | "female" | "other",
        experienceLevel,
        selectedMuscles,
        goal: workoutGoal,
      };

      // Gerar o treino (com um pequeno atraso para mostrar o loading)
      setTimeout(() => {
        const generatedWorkout = generatePersonalizedWorkout(preferences);
        setWorkoutTemplate(generatedWorkout);
        setIsGenerating(false);
      }, 1500);
    } catch (error) {
      console.error("Erro ao gerar treino:", error);
      setIsGenerating(false);
      setWorkoutTemplate(null);
    }
  };

  // Render condicional baseado no passo atual
  const renderCurrentStep = () => {
    switch (currentStep) {
      case "experience":
        return (
          <WorkoutBuilderStep1
            experienceLevel={experienceLevel}
            setExperienceLevel={setExperienceLevel}
            theme={theme}
            workoutColor={workoutColor}
            onNext={goToNextStep}
          />
        );
      case "muscles":
        return (
          <WorkoutBuilderStep2
            selectedMuscles={selectedMuscles}
            setSelectedMuscles={setSelectedMuscles}
            theme={theme}
            workoutColor={workoutColor}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case "goal":
        return (
          <WorkoutBuilderStep3
            workoutGoal={workoutGoal}
            setWorkoutGoal={setWorkoutGoal}
            theme={theme}
            workoutColor={workoutColor}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case "result":
        return (
          <WorkoutBuilderResult
            workoutTemplate={workoutTemplate}
            isLoading={isGenerating}
            theme={theme}
            workoutColor={workoutColor}
            onBack={goToPreviousStep}
            onReset={resetBuilder}
            onClose={onClose}
            workoutId={workoutId}
          />
        );
      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderCurrentStep()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default WorkoutBuilder;
