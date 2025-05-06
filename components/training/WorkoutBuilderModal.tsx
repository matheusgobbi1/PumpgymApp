import React, { useReducer, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { useWorkoutContext, Exercise } from "../../context/WorkoutContext";
import { exerciseDatabase, ExerciseData, muscleGroups } from "../../data/exerciseDatabase";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

// Tipos para o estado do modal
type ExperienceLevel = "beginner" | "intermediate" | "advanced";
type SelectedMuscles = string[];
type ModalStep = "experience" | "muscles" | "review";

interface WorkoutBuilderState {
  isVisible: boolean;
  currentStep: ModalStep;
  experienceLevel: ExperienceLevel | null;
  selectedMuscles: SelectedMuscles;
  generatedExercises: Exercise[];
  workoutId: string;
  workoutName: string;
  workoutColor: string;
  existingExercises: Exercise[] | null;
}

// Ações para o reducer
type WorkoutBuilderAction =
  | { type: "OPEN_MODAL"; payload: { workoutId: string; workoutName: string; workoutColor: string; existingExercises: Exercise[] | null } }
  | { type: "CLOSE_MODAL" }
  | { type: "SET_STEP"; payload: ModalStep }
  | { type: "SET_EXPERIENCE"; payload: ExperienceLevel }
  | { type: "TOGGLE_MUSCLE"; payload: string }
  | { type: "SELECT_ALL_MUSCLES" }
  | { type: "CLEAR_MUSCLES" }
  | { type: "GENERATE_EXERCISES" }
  | { type: "RESET_BUILDER" };

// Reducer para gerenciar o estado do modal
const workoutBuilderReducer = (
  state: WorkoutBuilderState,
  action: WorkoutBuilderAction
): WorkoutBuilderState => {
  switch (action.type) {
    case "OPEN_MODAL":
      return {
        ...state,
        isVisible: true,
        workoutId: action.payload.workoutId,
        workoutName: action.payload.workoutName,
        workoutColor: action.payload.workoutColor,
        existingExercises: action.payload.existingExercises,
        currentStep: action.payload.existingExercises && action.payload.existingExercises.length > 0 ? "review" : "experience",
        generatedExercises: action.payload.existingExercises || [],
      };
    case "CLOSE_MODAL":
      return {
        ...state,
        isVisible: false,
        experienceLevel: null,
        selectedMuscles: [],
        generatedExercises: [],
        existingExercises: null,
      };
    case "SET_STEP":
      return {
        ...state,
        currentStep: action.payload,
      };
    case "SET_EXPERIENCE":
      return {
        ...state,
        experienceLevel: action.payload,
        currentStep: "muscles", // Avançar para a próxima etapa
      };
    case "TOGGLE_MUSCLE":
      return {
        ...state,
        selectedMuscles: state.selectedMuscles.includes(action.payload)
          ? state.selectedMuscles.filter((muscle) => muscle !== action.payload)
          : [...state.selectedMuscles, action.payload],
      };
    case "SELECT_ALL_MUSCLES":
      return {
        ...state,
        selectedMuscles: [...muscleGroups],
      };
    case "CLEAR_MUSCLES":
      return {
        ...state,
        selectedMuscles: [],
      };
    case "GENERATE_EXERCISES":
      // Lógica para gerar exercícios com base na experiência e músculos selecionados
      // será implementada no componente
      return {
        ...state,
        currentStep: "review", // Avançar para a etapa de revisão
      };
    case "RESET_BUILDER":
      return {
        ...state,
        currentStep: "experience",
        experienceLevel: null,
        selectedMuscles: [],
        generatedExercises: [],
        existingExercises: null,
      };
    default:
      return state;
  }
};

// Estado inicial
const initialState: WorkoutBuilderState = {
  isVisible: false,
  currentStep: "experience",
  experienceLevel: null,
  selectedMuscles: [],
  generatedExercises: [],
  workoutId: "",
  workoutName: "",
  workoutColor: "",
  existingExercises: null,
};

interface WorkoutBuilderModalProps {
  onSaveWorkout: (workoutId: string, date: string, exercises: Exercise[]) => Promise<boolean>;
}

export default function WorkoutBuilderModal({ onSaveWorkout }: WorkoutBuilderModalProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();
  const { addExerciseToWorkout, selectedDate } = useWorkoutContext();

  // Usar useReducer em vez de múltiplos useState
  const [state, dispatch] = useReducer(workoutBuilderReducer, initialState);

  // Função para abrir o modal
  const openModal = useCallback((workoutId: string, workoutName: string, workoutColor: string, existingExercises: Exercise[] | null) => {
    dispatch({
      type: "OPEN_MODAL",
      payload: { workoutId, workoutName, workoutColor, existingExercises },
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // Função para fechar o modal
  const closeModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: "CLOSE_MODAL" });
  }, []);

  // Selecionar nível de experiência
  const selectExperience = useCallback((level: ExperienceLevel) => {
    Haptics.selectionAsync();
    dispatch({ type: "SET_EXPERIENCE", payload: level });
  }, []);

  // Alternar seleção de grupo muscular
  const toggleMuscleSelection = useCallback((muscle: string) => {
    Haptics.selectionAsync();
    dispatch({ type: "TOGGLE_MUSCLE", payload: muscle });
  }, []);

  // Selecionar todos os músculos
  const selectAllMuscles = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: "SELECT_ALL_MUSCLES" });
  }, []);

  // Limpar seleção de músculos
  const clearMuscleSelection = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: "CLEAR_MUSCLES" });
  }, []);

  // Gerar exercícios com base nas seleções
  const generateWorkout = useCallback(() => {
    if (state.selectedMuscles.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Determinar número de exercícios com base no nível
    let exercisesPerMuscle = 1;
    let setsPerExercise = 3;
    
    switch (state.experienceLevel) {
      case "beginner":
        exercisesPerMuscle = 1;
        setsPerExercise = 3;
        break;
      case "intermediate":
        exercisesPerMuscle = 2;
        setsPerExercise = 4;
        break;
      case "advanced":
        exercisesPerMuscle = 3;
        setsPerExercise = 5;
        break;
      default:
        exercisesPerMuscle = 1;
        setsPerExercise = 3;
    }

    // Filtrar exercícios e criar o treino
    const generatedExercises: Exercise[] = [];

    // Para cada grupo muscular selecionado, escolher exercícios
    state.selectedMuscles.forEach((muscle) => {
      const muscleExercises = exerciseDatabase.filter(
        (ex) => ex.muscle === muscle && ex.category === "força"
      );

      // Embaralhar os exercícios para randomizar a seleção
      const shuffled = [...muscleExercises].sort(() => 0.5 - Math.random());
      
      // Selecionar a quantidade de exercícios conforme o nível
      const selected = shuffled.slice(0, exercisesPerMuscle);

      // Adicionar os exercícios ao treino com suas séries
      selected.forEach((ex) => {
        // Gerar um ID único para o exercício
        const exerciseId = `exercise-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Criar séries conforme o nível de experiência
        const sets = Array.from({ length: setsPerExercise }, (_, index) => ({
          id: `set-${Date.now()}-${index}`,
          reps: state.experienceLevel === "beginner" ? 12 : state.experienceLevel === "intermediate" ? 10 : 8,
          weight: ex.isBodyweightExercise ? 0 : 10, // Peso inicial simbólico
          restTime: state.experienceLevel === "beginner" ? 60 : state.experienceLevel === "intermediate" ? 90 : 120,
          isBodyweightExercise: ex.isBodyweightExercise || false,
        }));

        // Adicionar o exercício ao array
        generatedExercises.push({
          id: exerciseId,
          name: ex.name,
          sets: sets,
          category: "força",
          isBodyweightExercise: ex.isBodyweightExercise || false,
        });
      });
    });

    // Atualizar o estado com os exercícios gerados
    dispatch({ type: "GENERATE_EXERCISES" });
    state.generatedExercises = generatedExercises;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [state.experienceLevel, state.selectedMuscles]);

  // Salvar o treino gerado no contexto
  const handleSaveWorkout = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Usar a função callback passada como prop com workoutId e selectedDate
      const success = await onSaveWorkout(
        state.workoutId,
        selectedDate,
        state.generatedExercises
      );

      if (success) {
        // Fechar o modal após salvar
        closeModal();
      } else {
        // Tratar falha ao salvar se necessário (ex: mostrar alerta)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error("Erro ao salvar treino:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [
    state.generatedExercises,
    state.workoutId,
    selectedDate,
    onSaveWorkout,
    closeModal,
  ]);

  // Verificar se deve mostrar o botão Avançar
  const shouldShowNextButton = useCallback(() => {
    if (state.currentStep === "experience") {
      return state.experienceLevel !== null;
    } else if (state.currentStep === "muscles") {
      return state.selectedMuscles.length > 0;
    }
    return false;
  }, [state.currentStep, state.experienceLevel, state.selectedMuscles]);

  // Renderizar o conteúdo com base na etapa atual
  const renderContent = () => {
    switch (state.currentStep) {
      case "experience":
        return renderExperienceStep();
      case "muscles":
        return renderMuscleSelectionStep();
      case "review":
        return renderReviewStep();
      default:
        return null;
    }
  };

  // Renderizar a etapa de seleção de nível de experiência
  const renderExperienceStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t("workoutBuilder.experienceTitle")}
      </Text>
      <Text style={[styles.stepDescription, { color: colors.secondary }]}>
        {t("workoutBuilder.experienceDescription")}
      </Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.experienceOption,
            state.experienceLevel === "beginner" && {
              backgroundColor: state.workoutColor + "30",
              borderColor: state.workoutColor,
            },
          ]}
          onPress={() => selectExperience("beginner")}
        >
          <MaterialCommunityIcons
            name="weight-lifter"
            size={30}
            color={
              state.experienceLevel === "beginner"
                ? state.workoutColor
                : colors.text
            }
          />
          <Text
            style={[
              styles.optionTitle,
              {
                color:
                  state.experienceLevel === "beginner"
                    ? state.workoutColor
                    : colors.text,
              },
            ]}
          >
            {t("workoutBuilder.beginner")}
          </Text>
          <Text
            style={[
              styles.optionDescription,
              { color: colors.secondary },
            ]}
          >
            {t("workoutBuilder.beginnerDescription")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.experienceOption,
            state.experienceLevel === "intermediate" && {
              backgroundColor: state.workoutColor + "30",
              borderColor: state.workoutColor,
            },
          ]}
          onPress={() => selectExperience("intermediate")}
        >
          <MaterialCommunityIcons
            name="arm-flex"
            size={30}
            color={
              state.experienceLevel === "intermediate"
                ? state.workoutColor
                : colors.text
            }
          />
          <Text
            style={[
              styles.optionTitle,
              {
                color:
                  state.experienceLevel === "intermediate"
                    ? state.workoutColor
                    : colors.text,
              },
            ]}
          >
            {t("workoutBuilder.intermediate")}
          </Text>
          <Text
            style={[
              styles.optionDescription,
              { color: colors.secondary },
            ]}
          >
            {t("workoutBuilder.intermediateDescription")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.experienceOption,
            state.experienceLevel === "advanced" && {
              backgroundColor: state.workoutColor + "30",
              borderColor: state.workoutColor,
            },
          ]}
          onPress={() => selectExperience("advanced")}
        >
          <MaterialCommunityIcons
            name="weight"
            size={30}
            color={
              state.experienceLevel === "advanced"
                ? state.workoutColor
                : colors.text
            }
          />
          <Text
            style={[
              styles.optionTitle,
              {
                color:
                  state.experienceLevel === "advanced"
                    ? state.workoutColor
                    : colors.text,
              },
            ]}
          >
            {t("workoutBuilder.advanced")}
          </Text>
          <Text
            style={[
              styles.optionDescription,
              { color: colors.secondary },
            ]}
          >
            {t("workoutBuilder.advancedDescription")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Renderizar a etapa de seleção de grupos musculares
  const renderMuscleSelectionStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t("workoutBuilder.musclesTitle")}
      </Text>
      <Text style={[styles.stepDescription, { color: colors.secondary }]}>
        {t("workoutBuilder.musclesDescription")}
      </Text>

      <View style={styles.muscleSelectionHeader}>
        <TouchableOpacity
          style={[styles.selectionButton, { borderColor: colors.border }]}
          onPress={selectAllMuscles}
        >
          <Text style={[styles.selectionButtonText, { color: colors.text }]}>
            {t("workoutBuilder.selectAll")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.selectionButton, { borderColor: colors.border }]}
          onPress={clearMuscleSelection}
        >
          <Text style={[styles.selectionButtonText, { color: colors.text }]}>
            {t("workoutBuilder.clearAll")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.muscleScrollView}
        contentContainerStyle={styles.muscleGridContainer}
        showsVerticalScrollIndicator={false}
      >
        {muscleGroups.map((muscle) => {
          // Não incluir Cardio na seleção de músculos
          if (muscle === "Cardio") return null;
          
          const isSelected = state.selectedMuscles.includes(muscle);
          return (
            <TouchableOpacity
              key={muscle}
              style={[
                styles.muscleItem,
                isSelected && {
                  backgroundColor: state.workoutColor + "30",
                  borderColor: state.workoutColor,
                },
              ]}
              onPress={() => toggleMuscleSelection(muscle)}
            >
              <Text
                style={[
                  styles.muscleItemText,
                  {
                    color: isSelected ? state.workoutColor : colors.text,
                    fontWeight: isSelected ? "700" : "400",
                  },
                ]}
              >
                {muscle}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.generateButton,
          {
            backgroundColor: state.workoutColor,
            opacity: state.selectedMuscles.length > 0 ? 1 : 0.5,
          },
        ]}
        onPress={generateWorkout}
        disabled={state.selectedMuscles.length === 0}
      >
        <Text style={styles.generateButtonText}>
          {t("workoutBuilder.generateWorkout")}
        </Text>
        <Ionicons name="flash" size={20} color="#FFFFFF" style={styles.generateButtonIcon} />
      </TouchableOpacity>
    </View>
  );

  // Renderizar a etapa de revisão do treino gerado
  const renderReviewStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t("workoutBuilder.reviewTitle")}
      </Text>
      <Text style={[styles.stepDescription, { color: colors.secondary }]}>
        {state.existingExercises && state.existingExercises.length > 0
          ? t("workoutBuilder.reviewExistingDescription")
          : t("workoutBuilder.reviewDescription")}
      </Text>

      {state.existingExercises && state.existingExercises.length > 0 && (
        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={() => dispatch({ type: "RESET_BUILDER" })}
        >
          <Ionicons name="refresh-outline" size={20} color={state.workoutColor} style={styles.regenerateIcon} />
          <Text style={[styles.regenerateText, { color: state.workoutColor }]}>
            {t("workoutBuilder.regenerateWorkout")}
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.reviewScrollView}
        contentContainerStyle={styles.reviewContainer}
        showsVerticalScrollIndicator={false}
      >
        {state.generatedExercises.map((exercise, index) => (
          <View
            key={`exercise-${index}`}
            style={[
              styles.exerciseCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.exerciseHeader}>
              <Text style={[styles.exerciseName, { color: colors.text }]}>
                {exercise.name}
              </Text>
            </View>
            <View style={styles.exerciseDetails}>
              <Text style={[styles.exerciseDetail, { color: colors.secondary }]}>
                {exercise.sets?.length || 0} {t("exercise.sets")} • {exercise.sets?.[0]?.reps || 0} {t("exercise.reps")}
              </Text>
              <Text style={[styles.exerciseDetail, { color: colors.secondary }]}>
                {exercise.isBodyweightExercise
                  ? t("exercise.bodyweight.short", { defaultValue: "PC" })
                  : `${exercise.sets?.[0]?.weight || 0} kg`}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: state.workoutColor }]}
        onPress={handleSaveWorkout}
      >
        <Text style={styles.addButtonText}>
          {t("workoutBuilder.saveWorkout")}
        </Text>
        <Ionicons name="save-outline" size={20} color="#FFFFFF" style={styles.addButtonIcon} />
      </TouchableOpacity>
    </View>
  );

  return {
    openModal,
    Modal: (
      <Modal
        visible={state.isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <SafeAreaView
          style={[styles.container, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            {/* Cabeçalho */}
            <LinearGradient
              colors={[
                state.workoutColor,
                state.workoutColor + "90",
                state.workoutColor + "40",
              ]}
              style={styles.header}
            >
              <BlurView
                intensity={40}
                tint={theme === "dark" ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.headerContent}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeModal}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                  {t("workoutBuilder.title")}
                </Text>

                <View style={styles.headerRight}>
                  {/* Espaço para manter o título centralizado */}
                  <View style={{ width: 24 }} />
                </View>
              </View>

              {/* Indicadores de etapa */}
              <View style={styles.stepsIndicator}>
                <View
                  style={[
                    styles.stepIndicator,
                    state.currentStep === "experience" && styles.activeStep,
                  ]}
                />
                <View
                  style={[
                    styles.stepIndicator,
                    state.currentStep === "muscles" && styles.activeStep,
                  ]}
                />
                <View
                  style={[
                    styles.stepIndicator,
                    state.currentStep === "review" && styles.activeStep,
                  ]}
                />
              </View>
            </LinearGradient>

            {/* Conteúdo dinâmico */}
            {renderContent()}
          </View>
        </SafeAreaView>
      </Modal>
    ),
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    height: height * 0.9,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  header: {
    height: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerRight: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  stepsIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 15,
    gap: 8,
  },
  stepIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  activeStep: {
    backgroundColor: "#FFFFFF",
    width: 24,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 16,
  },
  experienceOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  muscleSelectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  selectionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectionButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  muscleScrollView: {
    flex: 1,
  },
  muscleGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 80,
  },
  muscleItem: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    marginBottom: 12,
    alignItems: "center",
  },
  muscleItemText: {
    fontSize: 16,
  },
  generateButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  generateButtonIcon: {
    marginLeft: 8,
  },
  regenerateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    marginBottom: 16,
  },
  regenerateIcon: {
    marginRight: 8,
  },
  regenerateText: {
    fontSize: 16,
    fontWeight: "600",
  },
  reviewScrollView: {
    flex: 1,
  },
  reviewContainer: {
    paddingBottom: 80,
  },
  exerciseCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  exerciseHeader: {
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exerciseDetail: {
    fontSize: 14,
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  addButtonIcon: {
    marginLeft: 8,
  },
}); 