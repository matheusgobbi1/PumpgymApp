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
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Slider from "@react-native-community/slider";
import { useTheme } from "../../context/ThemeContext";
import {
  useWorkoutContext,
  Exercise,
} from "../../context/WorkoutContext";
import Colors from "../../constants/Colors";
import { ExerciseData, getExerciseById } from "../../data/exerciseDatabase";
import { useTranslation } from "react-i18next";
import { MotiView } from "moti";

const { width } = Dimensions.get("window");

// Interface para a série de exercício
interface ExerciseSet {
  id: string;
  reps: number;
  weight: number;
  restTime?: number;
  toFailure?: boolean;
  repsInReserve?: number;
  perceivedEffort?: number;
}

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
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  // Estados locais para os valores de entrada
  const [repsInput, setRepsInput] = useState(set.reps.toString());
  const [weightInput, setWeightInput] = useState(set.weight.toString());
  const [restTimeInput, setRestTimeInput] = useState(
    set.restTime ? set.restTime.toString() : "60"
  );
  const [toFailure, setToFailure] = useState(set.toFailure || false);
  const [repsInReserve, setRepsInReserve] = useState(set.repsInReserve || 2);
  const [perceivedEffort, setPerceivedEffort] = useState(set.perceivedEffort || 3);

  // Função para alternar o estado de expansão
  const toggleExpanded = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
  };

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

  // Função para atualizar o tempo de descanso
  const handleRestTimeChange = (restTime: number) => {
    setRestTimeInput(restTime.toString());
    onUpdate({ ...set, restTime });
  };

  // Função para atualizar falha muscular
  const toggleFailure = () => {
    const newValue = !toFailure;
    setToFailure(newValue);
    onUpdate({ ...set, toFailure: newValue, repsInReserve: newValue ? 0 : repsInReserve });
  };

  // Função para atualizar reps em reserva com slider
  const handleRepsInReserveChange = (value: number) => {
    setRepsInReserve(value);
    onUpdate({ ...set, repsInReserve: value });
  };

  // Função para atualizar percepção de esforço com slider
  const handlePerceivedEffortChange = (value: number) => {
    setPerceivedEffort(value);
    onUpdate({ ...set, perceivedEffort: value });
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

  // Função para validar e atualizar o tempo de descanso a partir da entrada de texto
  const handleRestTimeInputChange = (value: string) => {
    setRestTimeInput(value);

    // Validar se é um número
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      // Limitar entre 0 e 300 segundos (5 minutos)
      const validRestTime = Math.min(300, Math.max(0, numValue));
      onUpdate({ ...set, restTime: validRestTime });
    }
  };

  // Função para finalizar a edição e garantir que os valores sejam válidos
  const handleInputBlur = (type: "reps" | "weight" | "restTime") => {
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
    } else if (type === "weight") {
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
    } else if (type === "restTime") {
      const numValue = parseInt(restTimeInput);
      if (isNaN(numValue) || numValue < 0) {
        // Se for inválido, resetar para 60 segundos
        setRestTimeInput("60");
        onUpdate({ ...set, restTime: 60 });
      } else {
        // Limitar entre 0 e 300 segundos (5 minutos)
        const validRestTime = Math.min(300, Math.max(0, numValue));
        setRestTimeInput(validRestTime.toString());
        onUpdate({ ...set, restTime: validRestTime });
      }
    }
  };

  // Opções de tempo de descanso pré-definidas
  const restTimeOptions = [30, 60, 90, 120];

  // Obter texto de descrição para percepção de esforço
  const getPerceiveEffortLabel = () => {
    return t(`exercise.perceivedEffort.level${perceivedEffort}`);
  };

  return (
    <View
      style={[
        styles.setCard,
        { backgroundColor: colors.card },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleExpanded}
        style={styles.setCardHeader}
      >
        <View style={styles.setCardHeaderLeft}>
          <View
            style={[styles.setIconBackground, { backgroundColor: color + "20" }]}
          >
            <Ionicons name="barbell-outline" size={18} color={color} />
          </View>
          <View>
            <Text style={[styles.setNumberText, { color: colors.text }]}>
              {t("exercise.setNumber")} {index + 1}
            </Text>
            <Text style={[styles.setSummaryText, { color: colors.text + "80" }]}>
              {set.reps} {t("exercise.reps")} × {set.weight} kg
            </Text>
          </View>
        </View>

        <View style={styles.setCardHeaderRight}>
          <TouchableOpacity
            style={[
              styles.headerActionButton,
              { backgroundColor: colors.text + "10" },
            ]}
            onPress={onRemove}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.text + "60"} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.headerActionButton,
              { backgroundColor: colors.text + "10" },
            ]}
            onPress={toggleExpanded}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            accessibilityLabel={expanded ? t("exercise.collapseSet") : t("exercise.expandSet")}
          >
            <Ionicons 
              name={expanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={colors.text + "60"} 
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Conteúdo básico sempre visível */}
      <View style={styles.setCardBasicContent}>
        {/* Container para repetições e peso lado a lado */}
        <View style={styles.setMetricsRow}>
          {/* Repetições */}
          <View style={styles.setMetricContainer}>
            <View style={styles.setMetricHeader}>
              <Ionicons
                name="repeat-outline"
                size={16}
                color={color}
                style={styles.setMetricIcon}
              />
              <Text style={[styles.setMetricLabel, { color: colors.text }]}>
                {t("exercise.repetitions")}
              </Text>
            </View>
            <View
              style={[
                styles.setMetricControls,
                { backgroundColor: colors.background + "80", borderRadius: 10},
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

          {/* Peso */}
          <View style={styles.setMetricContainer}>
            <View style={styles.setMetricHeader}>
              <Ionicons
                name="barbell-outline"
                size={16}
                color={color}
                style={styles.setMetricIcon}
              />
              <Text style={[styles.setMetricLabel, { color: colors.text }]}>
                {t("exercise.weight")}
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

        {/* Tempo de descanso - sempre visível */}
        <View style={styles.setMetricContainer}>
          <View style={styles.setMetricHeader}>
            <Ionicons
              name="time-outline"
              size={16}
              color={color}
              style={styles.setMetricIcon}
            />
            <Text style={[styles.setMetricLabel, { color: colors.text }]}>
              {t("exercise.restTime", { defaultValue: "Descanso (s)" })}
            </Text>
          </View>

          {/* Opções rápidas de tempo de descanso */}
          <View style={styles.restTimeOptionsContainer}>
            {restTimeOptions.map((time) => (
              <TouchableOpacity
                key={`rest-time-${time}`}
                style={[
                  styles.restTimeOption,
                  {
                    backgroundColor:
                      parseInt(restTimeInput) === time ? color : color + "15",
                  },
                ]}
                onPress={() => handleRestTimeChange(time)}
              >
                <Text
                  style={[
                    styles.restTimeOptionText,
                    {
                      color: parseInt(restTimeInput) === time ? "#FFF" : color,
                    },
                  ]}
                >
                  {time}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Input manual para tempo de descanso */}
          <View
            style={[
              styles.setMetricControls,
              {
                backgroundColor: colors.background + "80",
                borderRadius: 10,
                marginTop: 8,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.setMetricButton,
                { backgroundColor: color + "15" },
              ]}
              onPress={() =>
                handleRestTimeChange(Math.max(0, (set.restTime || 60) - 5))
              }
            >
              <Ionicons name="remove" size={18} color={color} />
            </TouchableOpacity>

            <TextInput
              style={[styles.setMetricValue, { color: colors.text }]}
              value={restTimeInput}
              onChangeText={handleRestTimeInputChange}
              onBlur={() => handleInputBlur("restTime")}
              keyboardType="number-pad"
              maxLength={3}
              selectTextOnFocus
            />

            <TouchableOpacity
              style={[
                styles.setMetricButton,
                { backgroundColor: color + "15" },
              ]}
              onPress={() =>
                handleRestTimeChange(Math.min(300, (set.restTime || 60) + 5))
              }
            >
              <Ionicons name="add" size={18} color={color} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Conteúdo adicional que aparece somente quando expandido */}
      {expanded && (
        <View style={styles.setCardExpandedContent}>
          {/* Falha muscular - mais minimalista */}
          <View style={styles.setMetricContainer}>
            <View style={styles.failureContainerMinimal}>
              <View style={styles.setMetricHeader}>
                <Ionicons
                  name="flash-outline"
                  size={16}
                  color={color}
                  style={styles.setMetricIcon}
                />
                <Text style={[styles.setMetricLabel, { color: colors.text }]}>
                  {t("exercise.failureState.title")}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.failureToggleMinimal}
                onPress={toggleFailure}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <View style={[
                  styles.failureSwitchTrack, 
                  { backgroundColor: toFailure ? color : colors.text + "30" }
                ]}>
                  <View style={[
                    styles.failureSwitchThumb, 
                    { backgroundColor: "#FFF", transform: [{ translateX: toFailure ? 16 : 0 }] }
                  ]} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reps na reserva - agora com slider */}
          <View style={[
            styles.setMetricContainer,
            { opacity: toFailure ? 0.5 : 1 }
          ]}>
            <View style={styles.setMetricHeader}>
              <Ionicons
                name="fitness-outline"
                size={16}
                color={color}
                style={styles.setMetricIcon}
              />
              <Text style={[styles.setMetricLabel, { color: colors.text }]}>
                {t("exercise.failureState.repsInReserve")}
              </Text>
              <Text style={[styles.sliderValueText, { color: colors.text }]}>
                {repsInReserve}
              </Text>
            </View>
            
            <Slider
              style={styles.fullWidthSlider}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={repsInReserve}
              onValueChange={handleRepsInReserveChange}
              minimumTrackTintColor={color}
              maximumTrackTintColor={colors.border}
              thumbTintColor={color}
              disabled={toFailure}
            />
            
            <View style={styles.sliderLabelsContainer}>
              <Text style={[styles.sliderLabelText, { color: colors.text + "80" }]}>1</Text>
              <Text style={[styles.sliderLabelText, { color: colors.text + "80" }]}>5</Text>
            </View>
          </View>

          {/* Percepção de esforço - agora com slider */}
          <View style={styles.setMetricContainer}>
            <View style={styles.setMetricHeader}>
              <Ionicons
                name="pulse-outline"
                size={16}
                color={color}
                style={styles.setMetricIcon}
              />
              <Text style={[styles.setMetricLabel, { color: colors.text }]}>
                {t("exercise.perceivedEffort.title")}
              </Text>
              <Text style={[styles.sliderValueText, { color: colors.text }]}>
                {perceivedEffort}
              </Text>
            </View>
            
            <Slider
              style={styles.fullWidthSlider}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={perceivedEffort}
              onValueChange={handlePerceivedEffortChange}
              minimumTrackTintColor={color}
              maximumTrackTintColor={colors.border}
              thumbTintColor={color}
            />
            
            <Text style={[styles.effortLevelText, { color: colors.text, textAlign: 'center', marginTop: 4 }]}>
              {getPerceiveEffortLabel()}
            </Text>
            
            <View style={styles.sliderLabelsContainer}>
              <Text style={[styles.sliderLabelText, { color: colors.text + "80" }]}>
                {t("exercise.perceivedEffort.level1")}
              </Text>
              <Text style={[styles.sliderLabelText, { color: colors.text + "80" }]}>
                {t("exercise.perceivedEffort.level5")}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
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
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  const toggleExpanded = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
  };

  const handleDurationChange = (value: number) => {
    onUpdate(value, intensity);
  };

  const handleIntensityChange = (value: number) => {
    onUpdate(duration, value);
  };

  return (
    <View
      style={[
        styles.cardioCard,
        { backgroundColor: colors.card },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleExpanded}
        style={styles.cardioCardHeader}
      >
        <View style={styles.setCardHeaderLeft}>
          <View
            style={[styles.setIconBackground, { backgroundColor: color + "20" }]}
          >
            <Ionicons name="bicycle-outline" size={18} color={color} />
          </View>
          <Text style={[styles.setNumberText, { color: colors.text }]}>
            {t("exercise.cardioConfig.title")}
          </Text>
        </View>

        <View style={styles.setCardHeaderRight}>
          <TouchableOpacity
            style={[
              styles.headerActionButton,
              { backgroundColor: colors.text + "10" },
            ]}
            onPress={toggleExpanded}
          >
            <Ionicons 
              name={expanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={colors.text + "60"} 
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {expanded && (
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
                {t("exercise.cardioConfig.duration")}
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
              {duration} {t("exercise.cardioConfig.minutes")}
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
                {t("exercise.cardioConfig.intensity")}
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
                {t("exercise.cardioConfig.intensityLevels.low")}
              </Text>
              <Text style={[styles.intensityLabel, { color: colors.text }]}>
                {t("exercise.cardioConfig.intensityLevels.medium")}
              </Text>
              <Text style={[styles.intensityLabel, { color: colors.text }]}>
                {t("exercise.cardioConfig.intensityLevels.high")}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const ExerciseDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();

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

  // Estados
  const [isLoading, setIsLoading] = useState(true);
  const [exercise, setExercise] = useState<ExerciseData | null>(null);
  const [customExerciseName, setCustomExerciseName] = useState(
    customName || ""
  );
  const [notes, setNotes] = useState("");
  const [sets, setSets] = useState<ExerciseSet[]>([]);

  // Estados adicionais para cardio
  const [cardioDuration, setCardioDuration] = useState(30);
  const [cardioIntensity, setCardioIntensity] = useState(5);

  // Verificar se é um exercício personalizado
  const isCustomExercise = !exercise && customName;

  // Função para carregar os dados do exercício
  const loadExerciseDetails = () => {
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

  // Carregar os detalhes do exercício ao montar o componente
  React.useEffect(() => {
    loadExerciseDetails();
  }, [exerciseId, exerciseDataParam, mode]);

  // Função para adicionar uma nova série
  const addNewSet = () => {
    const newSet: ExerciseSet = {
      id: `set-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      reps: 12,
      weight: 10,
      restTime: 60,
      toFailure: false,
      repsInReserve: 2,
      perceivedEffort: 3
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

  // Função para fechar o modal
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
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
      updateExerciseInWorkout(workoutId, exerciseId, newExercise);
    } else {
      // Caso contrário, adicionar um novo exercício
      addExerciseToWorkout(workoutId, newExercise);
    }

    // Voltar para a tela anterior
    router.back();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.card }]}
            onPress={handleClose}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]}>
            {mode === "edit" ? t("exercise.edit") : t("exercise.add")}
          </Text>

          <View style={styles.rightButtonPlaceholder} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.scrollViewContent,
            mode === "edit" && styles.scrollViewContentEdit,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <View
                style={[
                  styles.exerciseHeader,
                  mode === "edit" && styles.exerciseHeaderEdit,
                ]}
              >
                {isCustomExercise ? (
                  <View style={styles.customNameContainer}>
                    <TextInput
                      style={[
                        styles.customNameInput,
                        {
                          color: colors.text,
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                          borderRadius: 10,
                        },
                      ]}
                      placeholder={t("exercise.exerciseNamePlaceholder")}
                      placeholderTextColor={colors.text + "60"}
                      value={customExerciseName}
                      onChangeText={setCustomExerciseName}
                      autoFocus
                    />
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.exerciseName,
                      { color: colors.text },
                      mode === "edit" && styles.exerciseNameEdit,
                    ]}
                  >
                    {exercise ? t(`exercises.exercises.${exercise.id}`) : ""}
                  </Text>
                )}

                {exercise && (
                  <View
                    style={[
                      styles.exerciseDetails,
                      mode === "edit" && styles.exerciseDetailsEdit,
                    ]}
                  >
                    <View
                      style={[
                        styles.exerciseDetailTag,
                        { backgroundColor: workoutColor + "15" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.exerciseDetailTagText,
                          { color: workoutColor },
                        ]}
                      >
                        {t(`exercises.muscles.${exercise.muscle}`)}
                      </Text>
                    </View>

                    
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.configContainer,
                  { backgroundColor: "transparent" },
                  mode === "edit" && styles.configContainerEdit,
                ]}
              >
                <Text
                  style={[
                    styles.configTitle,
                    { color: workoutColor },
                    mode === "edit" && styles.configTitleEdit,
                  ]}
                >
                  {exercise?.category === "cardio"
                    ? t("exercise.configuration")
                    : t("exercise.sets")}
                </Text>

                {exercise?.category === "cardio" ? (
                  <CardioCard
                    duration={cardioDuration}
                    intensity={cardioIntensity}
                    onUpdate={updateCardioSettings}
                    color={workoutColor}
                  />
                ) : (
                  <View
                    style={[
                      styles.setsContainer,
                      mode === "edit" && styles.setsContainerEdit,
                    ]}
                  >
                    {sets.map((set, index) => (
                      <SetCard
                        key={set.id}
                        set={set}
                        index={index}
                        onUpdate={(updatedSet) => updateSet(index, updatedSet)}
                        onRemove={() => removeSet(index)}
                        color={workoutColor}
                      />
                    ))}

                    <TouchableOpacity
                      style={[
                        styles.addSetButton,
                        {
                          borderColor: workoutColor + "40",
                          backgroundColor: workoutColor + "10",
                        },
                        mode === "edit" && styles.addSetButtonEdit,
                      ]}
                      onPress={addNewSet}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={18}
                        color={workoutColor}
                      />
                      <Text
                        style={[
                          styles.addSetButtonText,
                          { color: workoutColor },
                        ]}
                      >
                        {t("exercise.addSet")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.notesContainer}>
                  <Text style={[styles.notesLabel, { color: workoutColor }]}>
                    {t("exercise.notes")}
                  </Text>
                  <TextInput
                    style={[
                      styles.notesInput,
                      {
                        color: colors.text,
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderWidth: 1,
                      },
                    ]}
                    placeholder={t("exercise.notesPlaceholder")}
                    placeholderTextColor={colors.text + "60"}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 15 }}
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              borderTopWidth: 1,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: workoutColor,
                opacity:
                  isLoading ||
                  (isCustomExercise && !customExerciseName.trim()) ||
                  (exercise?.category !== "cardio" && sets.length === 0)
                    ? 0.6
                    : 1,
              },
            ]}
            onPress={handleAddExercise}
            disabled={
              isLoading ||
              (isCustomExercise && !customExerciseName.trim()) ||
              (exercise?.category !== "cardio" && sets.length === 0)
            }
          >
            <Text style={styles.addButtonText}>
              {t("exercise.addToWorkout")}{" "}
              {workoutType?.name || t("training.title")}
            </Text>
            <Ionicons
              name={mode === "edit" ? "checkmark-circle" : "add-circle"}
              size={20}
              color="#FFF"
              style={styles.addButtonIcon}
            />
          </TouchableOpacity>
        </MotiView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ExerciseDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 8 : 16,
    paddingBottom: 16,
    borderBottomWidth: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 10,
    borderRadius: 18,
  },
  rightButtonPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
    paddingTop: 10,
  },
  scrollViewContentEdit: {
    paddingTop: 0,
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
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
    marginBottom: 20,
  },
  exerciseHeaderEdit: {
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  exerciseIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  customNameContainer: {
    width: "100%",
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  customNameInput: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  exerciseDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  exerciseDetailTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  exerciseDetailTagText: {
    fontSize: 13,
    fontWeight: "600",
  },
  descriptionContainer: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
  },
  configContainer: {
    marginHorizontal: 20,
    paddingTop: 0,
    marginBottom: 24,
  },
  configTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.5,
    paddingHorizontal: 4,
  },
  setsContainer: {
    marginBottom: 30,
    gap: 16,
  },
  setCard: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
    marginBottom: 12,
  },
  setCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  setCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  setCardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  setIconBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  setNumberText: {
    fontSize: 15,
    fontWeight: "600",
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  setCardBasicContent: {
    padding: 16,
    paddingTop: 0,
    gap: 16,
  },
  setCardExpandedContent: {
    padding: 16,
    paddingTop: 8,
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
  },
  failureContainerMinimal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  failureToggleMinimal: {
    padding: 4,
  },
  failureSwitchTrack: {
    width: 36,
    height: 20,
    borderRadius: 10,
    padding: 2,
    justifyContent: 'center',
  },
  failureSwitchThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  fullWidthSlider: {
    width: '100%',
    height: 40,
  },
  sliderLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
    marginBottom: 8,
  },
  sliderLabelText: {
    fontSize: 12,
  },
  sliderValueText: {
    marginLeft: 'auto',
    fontSize: 14,
    fontWeight: '600',
  },
  effortLevelText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 6,
  },
  restTimeOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  restTimeOption: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 30,
    minWidth: 55,
    alignItems: "center",
  },
  restTimeOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 10,
  },
  addSetButtonText: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  notesContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  notesInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: "top",
  },
  bottomBar: {
    padding: 16,
    paddingHorizontal: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  addButtonIcon: {
    marginLeft: 8,
  },
  cardioCard: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
    marginBottom: 12,
  },
  cardioCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  cardioCardContent: {
    padding: 16,
    paddingTop: 0,
    gap: 24,
  },
  cardioMetricContainer: {
    gap: 12,
  },
  cardioMetricHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardioMetricIcon: {
    marginRight: 8,
  },
  cardioMetricLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  cardioSlider: {
    width: "100%",
    height: 40,
  },
  cardioMetricValue: {
    fontSize: 16,
    fontWeight: "700",
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
  exerciseNameEdit: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  exerciseDetailsEdit: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  descriptionContainerEdit: {
    marginHorizontal: 10,
    padding: 15,
    marginBottom: 20,
  },
  descriptionTextEdit: {
    fontSize: 14,
    lineHeight: 20,
  },
  configContainerEdit: {
    marginTop: 0,
    paddingTop: 0,
  },
  setsContainerEdit: {
    marginBottom: 15,
    gap: 8,
  },
  addSetButtonEdit: {
    padding: 14,
    marginTop: 8,
  },
  configTitleEdit: {
    fontSize: 18,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  setMetricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  setMetricContainer: {
    flex: 1,
  },
  setMetricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  setMetricIcon: {
    marginRight: 6,
  },
  setMetricLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  setMetricControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 6,
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
    fontWeight: "700",
    textAlign: "center",
    minWidth: 40,
    padding: 0,
    backgroundColor: "transparent",
  },
  setSummaryText: {
    fontSize: 13,
    marginTop: 2,
  },
});
