import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import Slider from "@react-native-community/slider";
import { useTheme } from "../../context/ThemeContext";
import {
  useWorkoutContext,
  Exercise,
  ExerciseSet,
} from "../../context/WorkoutContext";
import Colors from "../../constants/Colors";
import { ExerciseData, getExerciseById } from "../../data/exerciseDatabase";
import { useRefresh } from "../../context/RefreshContext";

const { width } = Dimensions.get("window");

// Componente para o esqueleto de carregamento
const LoadingSkeleton = () => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View style={styles.loadingContainer}>
      <View
        style={[styles.skeletonImage, { backgroundColor: colors.border }]}
      />
      <View style={styles.skeletonContent}>
        <View
          style={[styles.skeletonTitle, { backgroundColor: colors.border }]}
        />
        <View
          style={[styles.skeletonText, { backgroundColor: colors.border }]}
        />
        <View
          style={[
            styles.skeletonText,
            { backgroundColor: colors.border, width: "70%" },
          ]}
        />
      </View>
    </View>
  );
};

// Componente para o card de série
const SetCard = ({
  set,
  index,
  onUpdate,
  onRemove,
  color,
}: {
  set: ExerciseSet;
  index: number;
  onUpdate: (updatedSet: ExerciseSet) => void;
  onRemove: () => void;
  color: string;
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Estados locais para os valores de entrada
  const [repsInput, setRepsInput] = useState(set.reps.toString());
  const [weightInput, setWeightInput] = useState(set.weight.toString());

  // Função para atualizar as repetições
  const handleRepsChange = (reps: number) => {
    setRepsInput(reps.toString());
    onUpdate({ ...set, reps });
  };

  // Função para atualizar o peso
  const handleWeightChange = (weight: number) => {
    setWeightInput(weight.toString());
    onUpdate({ ...set, weight });
  };

  // Função para validar e atualizar as repetições a partir da entrada de texto
  const handleRepsInputChange = (value: string) => {
    setRepsInput(value);

    // Validar se é um número
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      // Limitar entre 1 e 50
      const validReps = Math.min(50, Math.max(1, numValue));
      onUpdate({ ...set, reps: validReps });
    }
  };

  // Função para validar e atualizar o peso a partir da entrada de texto
  const handleWeightInputChange = (value: string) => {
    setWeightInput(value);

    // Validar se é um número
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // Limitar entre 0 e 200
      const validWeight = Math.min(200, Math.max(0, numValue));
      onUpdate({ ...set, weight: validWeight });
    }
  };

  // Função para finalizar a edição e garantir que os valores sejam válidos
  const handleInputBlur = (type: "reps" | "weight") => {
    // Feedback tátil leve
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (type === "reps") {
      const numValue = parseInt(repsInput);
      if (isNaN(numValue) || numValue < 1) {
        // Se for inválido, resetar para 1
        setRepsInput("1");
        onUpdate({ ...set, reps: 1 });
      } else {
        // Limitar entre 1 e 50
        const validReps = Math.min(50, Math.max(1, numValue));
        setRepsInput(validReps.toString());
        onUpdate({ ...set, reps: validReps });
      }
    } else {
      const numValue = parseFloat(weightInput);
      if (isNaN(numValue) || numValue < 0) {
        // Se for inválido, resetar para 0
        setWeightInput("0");
        onUpdate({ ...set, weight: 0 });
      } else {
        // Limitar entre 0 e 200
        const validWeight = Math.min(200, Math.max(0, numValue));
        setWeightInput(validWeight.toFixed(1));
        onUpdate({ ...set, weight: validWeight });
      }
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 15, delay: index * 100 }}
      style={[
        styles.setCard,
        {
          backgroundColor: colors.card,
          borderLeftWidth: 4,
          borderLeftColor: color,
        },
      ]}
    >
      <View style={styles.setCardHeader}>
        <View
          style={[styles.setNumberContainer, { backgroundColor: color + "20" }]}
        >
          <Text style={[styles.setNumberText, { color }]}>
            Série {index + 1}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.removeSetButton}
          onPress={onRemove}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons name="close-circle" size={22} color={colors.text + "60"} />
        </TouchableOpacity>
      </View>

      <View style={styles.setCardContent}>
        <View style={styles.setMetricContainer}>
          <View style={styles.setMetricHeader}>
            <Ionicons
              name="repeat-outline"
              size={16}
              color={color}
              style={styles.setMetricIcon}
            />
            <Text style={[styles.setMetricLabel, { color: colors.text }]}>
              Repetições
            </Text>
          </View>
          <View
            style={[
              styles.setMetricControls,
              { backgroundColor: colors.background + "80", borderRadius: 10 },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.setMetricButton,
                { backgroundColor: color + "15" },
              ]}
              onPress={() => handleRepsChange(Math.max(1, set.reps - 1))}
            >
              <Ionicons name="remove" size={18} color={color} />
            </TouchableOpacity>

            <TextInput
              style={[styles.setMetricValue, { color: colors.text }]}
              value={repsInput}
              onChangeText={handleRepsInputChange}
              onBlur={() => handleInputBlur("reps")}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
            />

            <TouchableOpacity
              style={[
                styles.setMetricButton,
                { backgroundColor: color + "15" },
              ]}
              onPress={() => handleRepsChange(Math.min(50, set.reps + 1))}
            >
              <Ionicons name="add" size={18} color={color} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.setMetricContainer}>
          <View style={styles.setMetricHeader}>
            <Ionicons
              name="barbell-outline"
              size={16}
              color={color}
              style={styles.setMetricIcon}
            />
            <Text style={[styles.setMetricLabel, { color: colors.text }]}>
              Carga (kg)
            </Text>
          </View>
          <View
            style={[
              styles.setMetricControls,
              { backgroundColor: colors.background + "80", borderRadius: 10 },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.setMetricButton,
                { backgroundColor: color + "15" },
              ]}
              onPress={() => handleWeightChange(Math.max(0, set.weight - 2.5))}
            >
              <Ionicons name="remove" size={18} color={color} />
            </TouchableOpacity>

            <TextInput
              style={[styles.setMetricValue, { color: colors.text }]}
              value={weightInput}
              onChangeText={handleWeightInputChange}
              onBlur={() => handleInputBlur("weight")}
              keyboardType="decimal-pad"
              maxLength={5}
              selectTextOnFocus
            />

            <TouchableOpacity
              style={[
                styles.setMetricButton,
                { backgroundColor: color + "15" },
              ]}
              onPress={() =>
                handleWeightChange(Math.min(200, set.weight + 2.5))
              }
            >
              <Ionicons name="add" size={18} color={color} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </MotiView>
  );
};

// Componente para exercícios de cardio
const CardioCard = ({
  duration,
  intensity,
  onUpdate,
  color,
}: {
  duration: number;
  intensity: number;
  onUpdate: (duration: number, intensity: number) => void;
  color: string;
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const handleDurationChange = (value: number) => {
    onUpdate(value, intensity);
  };

  const handleIntensityChange = (value: number) => {
    onUpdate(duration, value);
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 15 }}
      style={[
        styles.cardioCard,
        {
          backgroundColor: colors.card,
          borderLeftWidth: 4,
          borderLeftColor: color,
        },
      ]}
    >
      <View style={styles.cardioCardHeader}>
        <View
          style={[
            styles.cardioTitleContainer,
            { backgroundColor: color + "20" },
          ]}
        >
          <Text style={[styles.cardioTitleText, { color }]}>
            Configuração do Cardio
          </Text>
        </View>
      </View>

      <View style={styles.cardioCardContent}>
        <View style={styles.cardioMetricContainer}>
          <View style={styles.cardioMetricHeader}>
            <Ionicons
              name="time-outline"
              size={16}
              color={color}
              style={styles.cardioMetricIcon}
            />
            <Text style={[styles.cardioMetricLabel, { color: colors.text }]}>
              Duração (minutos)
            </Text>
          </View>
          <Slider
            style={styles.cardioSlider}
            minimumValue={1}
            maximumValue={120}
            step={1}
            value={duration}
            onValueChange={handleDurationChange}
            minimumTrackTintColor={color}
            maximumTrackTintColor={colors.border}
            thumbTintColor={color}
          />
          <Text style={[styles.cardioMetricValue, { color: colors.text }]}>
            {duration} min
          </Text>
        </View>

        <View style={styles.cardioMetricContainer}>
          <View style={styles.cardioMetricHeader}>
            <Ionicons
              name="speedometer-outline"
              size={16}
              color={color}
              style={styles.cardioMetricIcon}
            />
            <Text style={[styles.cardioMetricLabel, { color: colors.text }]}>
              Intensidade
            </Text>
          </View>
          <Slider
            style={styles.cardioSlider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={intensity}
            onValueChange={handleIntensityChange}
            minimumTrackTintColor={color}
            maximumTrackTintColor={colors.border}
            thumbTintColor={color}
          />
          <View style={styles.intensityLabels}>
            <Text style={[styles.intensityLabel, { color: colors.text }]}>
              Baixa
            </Text>
            <Text style={[styles.intensityLabel, { color: colors.text }]}>
              Média
            </Text>
            <Text style={[styles.intensityLabel, { color: colors.text }]}>
              Alta
            </Text>
          </View>
        </View>
      </View>
    </MotiView>
  );
};

export default function ExerciseDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Extrair parâmetros da URL
  const exerciseId = params.exerciseId as string;
  const customName = params.customName as string;
  const workoutId = params.workoutId as string;
  const workoutColor = (params.workoutColor as string) || colors.primary;
  const mode = params.mode as string;
  const exerciseDataParam = params.exerciseData as string;

  // Contexto de treinos
  const { addExerciseToWorkout, updateExerciseInWorkout, getWorkoutTypeById } =
    useWorkoutContext();
  const workoutType = getWorkoutTypeById(workoutId);
  const { triggerRefresh, isRefreshing } = useRefresh();

  // Estados
  const [isLoading, setIsLoading] = useState(true);
  const [exercise, setExercise] = useState<ExerciseData | null>(null);
  const [customExerciseName, setCustomExerciseName] = useState(
    customName || ""
  );
  const [notes, setNotes] = useState("");
  const [sets, setSets] = useState<ExerciseSet[]>([]);

  // Animações
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Estados adicionais para cardio
  const [cardioDuration, setCardioDuration] = useState(30);
  const [cardioIntensity, setCardioIntensity] = useState(5);

  // Efeito para carregar os detalhes do exercício
  useEffect(() => {
    const loadExerciseDetails = async () => {
      setIsLoading(true);

      try {
        // Verificar se estamos no modo de edição com dados passados
        if (mode === "edit" && exerciseDataParam) {
          try {
            const exerciseData = JSON.parse(exerciseDataParam);

            // Configurar os estados com os dados do exercício
            if (exerciseData.name) {
              setCustomExerciseName(exerciseData.name);
            }

            if (exerciseData.notes) {
              setNotes(exerciseData.notes);
            }

            if (exerciseData.sets && exerciseData.sets.length > 0) {
              setSets(exerciseData.sets);
            } else if (exerciseData.category !== "cardio") {
              // Adicionar uma série inicial se não for cardio
              addNewSet();
            }

            if (exerciseData.category === "cardio") {
              setCardioDuration(exerciseData.cardioDuration || 30);
              setCardioIntensity(exerciseData.cardioIntensity || 5);
            }

            // Buscar dados adicionais do exercício se tivermos um ID
            if (exerciseId) {
              const dbExercise = getExerciseById(exerciseId);
              if (dbExercise) {
                setExercise(dbExercise);
              }
            }

            setIsLoading(false);
            return;
          } catch (error) {}
        }

        // Fluxo normal se não estivermos editando
        if (exerciseId) {
          // Buscar exercício pelo ID
          const exerciseData = getExerciseById(exerciseId);

          if (exerciseData) {
            setExercise(exerciseData);
            setNotes(`${exerciseData.muscle} - ${exerciseData.equipment}`);

            // Adicionar uma série inicial
            addNewSet();
          }
        } else {
          // Para exercícios personalizados, adicionar uma série inicial
          addNewSet();
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    loadExerciseDetails();
  }, [exerciseId, exerciseDataParam, mode]);

  // Função para adicionar uma nova série
  const addNewSet = () => {
    const newSet: ExerciseSet = {
      id: `set-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      reps: 12,
      weight: 10,
    };

    setSets((prevSets) => [...prevSets, newSet]);

    // Feedback tátil
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Função para atualizar uma série
  const updateSet = (index: number, updatedSet: ExerciseSet) => {
    setSets((prevSets) => {
      const newSets = [...prevSets];
      newSets[index] = updatedSet;
      return newSets;
    });
  };

  // Função para remover uma série
  const removeSet = (index: number) => {
    setSets((prevSets) => {
      // Não permitir remover a última série
      if (prevSets.length <= 1) {
        return prevSets;
      }

      const newSets = [...prevSets];
      newSets.splice(index, 1);
      return newSets;
    });

    // Feedback tátil
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Função para atualizar configurações de cardio
  const updateCardioSettings = (duration: number, intensity: number) => {
    setCardioDuration(duration);
    setCardioIntensity(intensity);
  };

  // Função para adicionar o exercício ao treino
  const handleAddExercise = () => {
    // Feedback tátil
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Criar o objeto de exercício
    const newExercise: Exercise = {
      id: mode === "edit" && exerciseId ? exerciseId : `exercise-${Date.now()}`,
      name: exercise ? exercise.name : customExerciseName.trim(),
      sets: exercise?.category === "cardio" ? [] : sets,
      notes: notes,
      category: exercise?.category || "força",
      cardioDuration:
        exercise?.category === "cardio" ? cardioDuration : undefined,
      cardioIntensity:
        exercise?.category === "cardio" ? cardioIntensity : undefined,
    };

    // Se estamos editando, atualizar o exercício existente
    if (mode === "edit" && exerciseId) {
      updateExerciseInWorkout(workoutId, newExercise);
    } else {
      // Caso contrário, adicionar um novo exercício
      addExerciseToWorkout(workoutId, newExercise);
    }

    // Voltar para a tela anterior
    router.back();

    // Atualizar o gráfico de progresso
    if (!isRefreshing) {
      triggerRefresh();
    }
  };

  // Verificar se é um exercício personalizado
  const isCustomExercise = !exercise && customName;

  return (
    <>
      <Stack.Screen
        options={{
          title: exercise ? exercise.name : "Novo Exercício",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTransparent: true,
          presentation: "modal",
          animation: "slide_from_bottom",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerBackground: () => (
            <Animated.View
              style={[
                styles.headerBackground,
                { backgroundColor: colors.background, opacity: headerOpacity },
              ]}
            />
          ),
        }}
      />

      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["bottom"]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoidingView}
        >
          <Animated.ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <>
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: "spring" }}
                  style={styles.exerciseHeader}
                >
                  <View
                    style={[
                      styles.exerciseIconContainer,
                      { backgroundColor: workoutColor + "20" },
                    ]}
                  >
                    <Ionicons
                      name={
                        exercise?.muscle === "Peito"
                          ? "fitness-outline"
                          : exercise?.muscle === "Costas"
                          ? "body-outline"
                          : exercise?.muscle === "Pernas"
                          ? "walk-outline"
                          : exercise?.muscle === "Ombros"
                          ? "barbell-outline"
                          : exercise?.muscle === "Bíceps" ||
                            exercise?.muscle === "Tríceps"
                          ? "bicycle-outline"
                          : exercise?.muscle === "Abdômen"
                          ? "body-outline"
                          : exercise?.muscle === "Cardio"
                          ? "heart-outline"
                          : "barbell-outline"
                      }
                      size={48}
                      color={workoutColor}
                    />
                  </View>

                  {isCustomExercise ? (
                    <View style={styles.customNameContainer}>
                      <TextInput
                        style={[
                          styles.customNameInput,
                          { color: colors.text, borderColor: colors.border },
                        ]}
                        placeholder="Nome do exercício"
                        placeholderTextColor={colors.text + "60"}
                        value={customExerciseName}
                        onChangeText={setCustomExerciseName}
                        autoFocus
                      />
                    </View>
                  ) : (
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                      {exercise?.name}
                    </Text>
                  )}

                  {exercise && (
                    <View style={styles.exerciseDetails}>
                      <View
                        style={[
                          styles.exerciseDetailTag,
                          { backgroundColor: workoutColor + "20" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.exerciseDetailTagText,
                            { color: workoutColor },
                          ]}
                        >
                          {exercise.muscle}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.exerciseDetailTag,
                          { backgroundColor: workoutColor + "20" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.exerciseDetailTagText,
                            { color: workoutColor },
                          ]}
                        >
                          {exercise.equipment}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.exerciseDetailTag,
                          {
                            backgroundColor:
                              exercise.difficulty === "iniciante"
                                ? "#4CAF50" + "20"
                                : exercise.difficulty === "intermediário"
                                ? "#FFC107" + "20"
                                : "#F44336" + "20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.exerciseDetailTagText,
                            {
                              color:
                                exercise.difficulty === "iniciante"
                                  ? "#4CAF50"
                                  : exercise.difficulty === "intermediário"
                                  ? "#FFC107"
                                  : "#F44336",
                            },
                          ]}
                        >
                          {exercise.difficulty}
                        </Text>
                      </View>
                    </View>
                  )}
                </MotiView>

                {exercise && (
                  <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "spring", delay: 100 }}
                    style={[
                      styles.descriptionContainer,
                      { backgroundColor: colors.card },
                    ]}
                  >
                    <Text
                      style={[styles.descriptionTitle, { color: colors.text }]}
                    >
                      Como fazer
                    </Text>
                    <Text
                      style={[
                        styles.descriptionText,
                        { color: colors.text + "E6" },
                      ]}
                    >
                      {exercise.description}
                    </Text>
                  </MotiView>
                )}

                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: "spring", delay: 200 }}
                  style={[
                    styles.configContainer,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <Text style={[styles.configTitle, { color: colors.text }]}>
                    {exercise?.category === "cardio"
                      ? "Configuração"
                      : "Séries"}
                  </Text>

                  {exercise?.category === "cardio" ? (
                    <CardioCard
                      duration={cardioDuration}
                      intensity={cardioIntensity}
                      onUpdate={updateCardioSettings}
                      color={workoutColor}
                    />
                  ) : (
                    <View style={styles.setsContainer}>
                      {sets.map((set, index) => (
                        <SetCard
                          key={set.id}
                          set={set}
                          index={index}
                          onUpdate={(updatedSet) =>
                            updateSet(index, updatedSet)
                          }
                          onRemove={() => removeSet(index)}
                          color={workoutColor}
                        />
                      ))}

                      <TouchableOpacity
                        style={[
                          styles.addSetButton,
                          {
                            borderColor: workoutColor,
                            backgroundColor: workoutColor + "08",
                          },
                        ]}
                        onPress={addNewSet}
                      >
                        <Ionicons
                          name="add-circle-outline"
                          size={20}
                          color={workoutColor}
                        />
                        <Text
                          style={[
                            styles.addSetButtonText,
                            { color: workoutColor },
                          ]}
                        >
                          Adicionar Série
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.notesContainer}>
                    <Text style={[styles.notesLabel, { color: colors.text }]}>
                      Observações
                    </Text>
                    <TextInput
                      style={[
                        styles.notesInput,
                        {
                          color: colors.text,
                          backgroundColor: colors.background,
                        },
                      ]}
                      placeholder="Adicione observações sobre o exercício..."
                      placeholderTextColor={colors.text + "60"}
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </MotiView>
              </>
            )}
          </Animated.ScrollView>

          <View
            style={[styles.bottomBar, { backgroundColor: colors.background }]}
          >
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: workoutColor }]}
              onPress={handleAddExercise}
              disabled={
                isLoading ||
                (isCustomExercise && !customExerciseName.trim()) ||
                (exercise?.category !== "cardio" && sets.length === 0)
              }
            >
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.addButtonText}>
                Adicionar ao {workoutType?.name || "Treino"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: 100,
    paddingBottom: 100,
  },
  loadingContainer: {
    padding: 20,
  },
  skeletonImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
  },
  skeletonContent: {
    gap: 12,
  },
  skeletonTitle: {
    height: 24,
    borderRadius: 4,
    width: "80%",
  },
  skeletonText: {
    height: 16,
    borderRadius: 4,
    width: "100%",
  },
  exerciseHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  exerciseIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  customNameContainer: {
    width: "100%",
    marginBottom: 12,
  },
  customNameInput: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    borderBottomWidth: 2,
    paddingVertical: 8,
  },
  exerciseDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  exerciseDetailTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  exerciseDetailTagText: {
    fontSize: 14,
    fontWeight: "600",
  },
  descriptionContainer: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  configContainer: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 24,
  },
  setsContainer: {
    marginBottom: 24,
    gap: 16,
  },
  setCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  setCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  setNumberContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  setNumberText: {
    fontSize: 14,
    fontWeight: "600",
  },
  removeSetButton: {
    padding: 4,
  },
  setCardContent: {
    gap: 16,
  },
  setMetricContainer: {
    flex: 1,
  },
  setMetricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  setMetricIcon: {
    marginRight: 3,
  },
  setMetricLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  setMetricControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 4,
  },
  setMetricButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  setMetricValue: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    minWidth: 40,
    padding: 0,
    backgroundColor: "transparent",
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 8,
  },
  addSetButtonText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 4,
  },
  notesContainer: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  notesInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 28,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 4,
  },
  cardioCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardioCardHeader: {
    marginBottom: 16,
  },
  cardioTitleContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  cardioTitleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  cardioCardContent: {
    gap: 24,
  },
  cardioMetricContainer: {
    gap: 8,
  },
  cardioMetricHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardioMetricIcon: {
    marginRight: 6,
  },
  cardioMetricLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  cardioSlider: {
    width: "100%",
    height: 40,
  },
  cardioMetricValue: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  intensityLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  intensityLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
});
