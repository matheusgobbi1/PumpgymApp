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
import { useWorkoutContext, Exercise } from "../../context/WorkoutContext";
import Colors from "../../constants/Colors";
import { ExerciseData, getExerciseById } from "../../data/exerciseDatabase";
import { useTranslation } from "react-i18next";
import { MotiView } from "moti";
import { useToast } from "../../components/common/ToastContext";

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
  isBodyweightExercise?: boolean;
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
  isBodyweightExercise: parentIsBodyweightExercise,
}: {
  set: ExerciseSet;
  index: number;
  onUpdate: (updatedSet: ExerciseSet) => void;
  onRemove: () => void;
  color: string;
  isBodyweightExercise?: boolean;
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  // Use o valor de isBodyweightExercise da série individual com prioridade, ou use o valor do pai se não estiver definido
  const isBodyweightExercise =
    set.isBodyweightExercise !== undefined
      ? set.isBodyweightExercise
      : parentIsBodyweightExercise;

  // Referências para os inputs
  const repsInputRef = useRef<TextInput>(null);
  const weightInputRef = useRef<TextInput>(null);
  const restTimeInputRef = useRef<TextInput>(null);

  // Estados locais para os valores de entrada
  const [repsInput, setRepsInput] = useState(set.reps.toString());
  const [weightInput, setWeightInput] = useState(set.weight.toString());
  const [restTimeInput, setRestTimeInput] = useState(
    set.restTime ? set.restTime.toString() : "60"
  );
  const [toFailure, setToFailure] = useState(set.toFailure || false);
  const [repsInReserve, setRepsInReserve] = useState(set.repsInReserve || 2);
  const [perceivedEffort, setPerceivedEffort] = useState(
    set.perceivedEffort || 3
  );

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
    // Preservar a entrada do usuário com vírgula se ele usou vírgula
    const displayValue = weightInput.includes(",")
      ? weight.toString().replace(".", ",")
      : weight.toString();
    setWeightInput(displayValue);
    onUpdate({
      ...set,
      weight,
      isBodyweightExercise, // Garantir que a propriedade isBodyweightExercise seja preservada
    });
  };

  // Função para atualizar o tempo de descanso
  const handleRestTimeChange = (restTime: number) => {
    setRestTimeInput(restTime.toString());
    onUpdate({ ...set, restTime });
  };

  // Função para atualizar reps em reserva com slider
  const handleRepsInReserveChange = (value: number) => {
    setRepsInReserve(value);
    // Quando RIR é 0, definimos automaticamente como falha
    const isFailure = value === 0;
    setToFailure(isFailure);
    onUpdate({
      ...set,
      repsInReserve: value,
      toFailure: isFailure,
      isBodyweightExercise, // Garantir que a propriedade isBodyweightExercise seja preservada
    });
  };

  // Função para atualizar percepção de esforço com slider
  const handlePerceivedEffortChange = (value: number) => {
    setPerceivedEffort(value);
    onUpdate({
      ...set,
      perceivedEffort: value,
      isBodyweightExercise, // Garantir que a propriedade isBodyweightExercise seja preservada
    });
  };

  // Função para validar e atualizar as repetições a partir da entrada de texto
  const handleRepsInputChange = (value: string) => {
    setRepsInput(value);

    // Validar se é um número
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      // Limitar entre 1 e 50
      const validReps = Math.min(50, Math.max(1, numValue));
      onUpdate({
        ...set,
        reps: validReps,
        isBodyweightExercise, // Garantir que a propriedade isBodyweightExercise seja preservada
      });
    }
  };

  // Função para validar e atualizar o peso a partir da entrada de texto
  const handleWeightInputChange = (value: string) => {
    // Substituir vírgula por ponto para processamento correto
    const normalizedValue = value.replace(",", ".");
    setWeightInput(value);

    // Validar se é um número
    const numValue = parseFloat(normalizedValue);
    if (!isNaN(numValue)) {
      // Limitar entre 0 e 500
      const validWeight = Math.min(500, Math.max(0, numValue));
      onUpdate({
        ...set,
        weight: validWeight,
        isBodyweightExercise,
      });
    }
  };

  // Função para validar e atualizar o tempo de descanso a partir da entrada de texto
  const handleRestTimeInputChange = (value: string) => {
    setRestTimeInput(value);

    // Validar se é um número
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      // Limitar entre 60 e 300 segundos (5 minutos)
      const validRestTime = Math.min(300, Math.max(60, numValue));
      onUpdate({
        ...set,
        restTime: validRestTime,
        isBodyweightExercise, // Garantir que a propriedade isBodyweightExercise seja preservada
      });
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
        onUpdate({
          ...set,
          reps: 1,
          isBodyweightExercise,
        });
      } else {
        // Limitar entre 1 e 50
        const validReps = Math.min(50, Math.max(1, numValue));
        setRepsInput(validReps.toString());
        onUpdate({
          ...set,
          reps: validReps,
          isBodyweightExercise,
        });
      }
    } else if (type === "weight") {
      // Substituir vírgula por ponto para processamento correto
      const normalizedValue = weightInput.replace(",", ".");
      const numValue = parseFloat(normalizedValue);
      if (isNaN(numValue) || numValue < 0) {
        // Se for inválido, resetar para 0
        setWeightInput("0");
        onUpdate({
          ...set,
          weight: 0,
          isBodyweightExercise,
        });
      } else {
        // Limitar entre 0 e 500
        const validWeight = Math.min(500, Math.max(0, numValue));
        // Preservar a entrada do usuário com vírgula se ele usou vírgula
        const displayValue = weightInput.includes(",")
          ? validWeight.toFixed(1).replace(".", ",")
          : validWeight.toFixed(1);
        setWeightInput(displayValue);
        onUpdate({
          ...set,
          weight: validWeight,
          isBodyweightExercise,
        });
      }
    } else if (type === "restTime") {
      const numValue = parseInt(restTimeInput);
      if (isNaN(numValue) || numValue < 60) {
        // Se for inválido, resetar para 60 segundos
        setRestTimeInput("60");
        onUpdate({
          ...set,
          restTime: 60,
          isBodyweightExercise,
        });
      } else {
        // Limitar entre 60 e 300 segundos (5 minutos)
        const validRestTime = Math.min(300, Math.max(60, numValue));
        setRestTimeInput(validRestTime.toString());
        onUpdate({
          ...set,
          restTime: validRestTime,
          isBodyweightExercise,
        });
      }
    }
  };

  // Opções de tempo de descanso pré-definidas
  const restTimeOptions = [60, 90, 120, 180];

  // Obter texto de descrição para percepção de esforço
  const getPerceiveEffortLabel = () => {
    return t(`exercise.perceivedEffort.level${perceivedEffort}`);
  };

  // Ícones de percepção de esforço para uma experiência visual melhor
  const getEffortIcon = () => {
    switch (perceivedEffort) {
      case 1:
        return "battery-dead-outline"; // Muito fácil
      case 2:
        return "battery-half-outline"; // Fácil
      case 3:
        return "battery-half-outline"; // Moderado
      case 4:
        return "battery-full-outline"; // Difícil
      case 5:
        return "flame-outline"; // Muito difícil
      default:
        return "battery-half-outline";
    }
  };

  return (
    <View style={[styles.setCard, { backgroundColor: colors.card }]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleExpanded}
        style={styles.setCardHeader}
      >
        <View style={styles.setCardHeaderLeft}>
          <View
            style={[
              styles.setIconBackground,
              { backgroundColor: color + "20" },
            ]}
          >
            <Ionicons name="barbell-outline" size={18} color={color} />
          </View>
          <View>
            <Text style={[styles.setNumberText, { color: colors.text }]}>
              {t("exercise.setNumber")} {index + 1}
            </Text>
            <Text
              style={[styles.setSummaryText, { color: colors.text + "80" }]}
            >
              {set.reps} {t("exercise.reps")} ×{" "}
              {isBodyweightExercise || set.weight === 0
                ? t("exercise.bodyweight.short", { defaultValue: "PC" })
                : `${set.weight} kg`}
              {toFailure && (
                <Text style={[styles.failureIndicator, { color: color }]}>
                  {" "}
                  • {t("exercise.failureState.shortLabel")}
                </Text>
              )}
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
            <Ionicons
              name="trash-outline"
              size={20}
              color={colors.text + "60"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.headerActionButton,
              { backgroundColor: colors.text + "10" },
            ]}
            onPress={toggleExpanded}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            accessibilityLabel={
              expanded ? t("exercise.collapseSet") : t("exercise.expandSet")
            }
          >
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.text + "60"}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Todo o conteúdo agora fica dentro do MotiView expandido */}
      {expanded && (
        <MotiView
          from={{
            opacity: 0,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            type: "timing",
            duration: 250,
          }}
          style={[
            styles.setCardExpandedContent,
            { borderTopColor: colors.border + "30" },
          ]}
        >
          {/* Container para repetições e peso lado a lado */}
          <MotiView
            from={{ opacity: 0, translateX: -5 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ delay: 150, duration: 200 }}
          >
            <View style={styles.setMetricsRow}>
              {/* Repetições */}
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 50, duration: 150 }}
                style={styles.setMetricContainer}
              >
                <View style={styles.setMetricHeader}>
                  <Text style={[styles.setMetricLabel, { color: colors.text }]}>
                    {t("exercise.repetitions")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.setMetricControls,
                    {
                      backgroundColor: colors.background + "80",
                      borderRadius: 10,
                    },
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
                    ref={repsInputRef}
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
              </MotiView>

              {/* Peso - Mostrar controle para exercícios normais ou texto "Peso Corporal" para exercícios de peso corporal */}
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 100, duration: 150 }}
                style={styles.setMetricContainer}
              >
                <View style={styles.setMetricHeader}>
                  <Text style={[styles.setMetricLabel, { color: colors.text }]}>
                    {t("exercise.weight")}
                  </Text>
                </View>

                {isBodyweightExercise ? (
                  <View
                    style={[
                      styles.bodyweightContainer,
                      {
                        backgroundColor: colors.background + "80",
                        borderRadius: 10,
                        padding: 6,
                        alignItems: "center",
                        justifyContent: "center",
                        height: 48,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.bodyweightText,
                        { color: colors.text, fontWeight: "600", fontSize: 16 },
                      ]}
                    >
                      {t("exercise.bodyweight")}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.setMetricControls,
                      {
                        backgroundColor: colors.background + "80",
                        borderRadius: 10,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.setMetricButton,
                        { backgroundColor: color + "15" },
                      ]}
                      onPress={() =>
                        handleWeightChange(Math.max(0, set.weight - 2.5))
                      }
                    >
                      <Ionicons name="remove" size={18} color={color} />
                    </TouchableOpacity>

                    <TextInput
                      ref={weightInputRef}
                      style={[styles.setMetricValue, { color: colors.text }]}
                      value={weightInput}
                      onChangeText={handleWeightInputChange}
                      onBlur={() => handleInputBlur("weight")}
                      keyboardType="decimal-pad"
                      maxLength={7}
                      selectTextOnFocus
                    />

                    <TouchableOpacity
                      style={[
                        styles.setMetricButton,
                        { backgroundColor: color + "15" },
                      ]}
                      onPress={() =>
                        handleWeightChange(Math.min(500, set.weight + 2.5))
                      }
                    >
                      <Ionicons name="add" size={18} color={color} />
                    </TouchableOpacity>
                  </View>
                )}
              </MotiView>
            </View>
          </MotiView>

          {/* Tempo de descanso */}
          <MotiView
            from={{ opacity: 0, translateX: -5 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ delay: 250, duration: 200 }}
          >
            <View style={styles.setMetricContainer}>
              <View style={styles.setMetricHeader}>
                <Text style={[styles.setMetricLabel, { color: colors.text }]}>
                  {t("exercise.restTime", { defaultValue: "Descanso (s)" })}
                </Text>
              </View>

              {/* Opções rápidas de tempo de descanso */}
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 50, duration: 150 }}
              >
                <View style={styles.restTimeOptionsContainer}>
                  {restTimeOptions.map((time, idx) => (
                    <MotiView
                      key={`rest-time-${time}`}
                      from={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 30 * idx, duration: 120 }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.restTimeOption,
                          {
                            backgroundColor:
                              parseInt(restTimeInput) === time
                                ? color
                                : color + "15",
                          },
                        ]}
                        onPress={() => handleRestTimeChange(time)}
                      >
                        <Text
                          style={[
                            styles.restTimeOptionText,
                            {
                              color:
                                parseInt(restTimeInput) === time
                                  ? "#FFF"
                                  : color,
                            },
                          ]}
                        >
                          {time}s
                        </Text>
                      </TouchableOpacity>
                    </MotiView>
                  ))}
                </View>
              </MotiView>

              {/* Input manual para tempo de descanso */}
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 100, duration: 150 }}
              >
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
                      handleRestTimeChange(
                        Math.max(60, (set.restTime || 60) - 5)
                      )
                    }
                  >
                    <Ionicons name="remove" size={18} color={color} />
                  </TouchableOpacity>

                  <TextInput
                    ref={restTimeInputRef}
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
                      handleRestTimeChange(
                        Math.min(300, (set.restTime || 60) + 5)
                      )
                    }
                  >
                    <Ionicons name="add" size={18} color={color} />
                  </TouchableOpacity>
                </View>
              </MotiView>
            </View>
          </MotiView>

          {/* Seção de intensidade */}
          <MotiView
            from={{ opacity: 0, translateX: -5 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ delay: 350, duration: 200 }}
          >
            <View style={styles.expandedSection}>
              <Text style={[styles.expandedSectionTitle, { color: color }]}>
                {t("exercise.intensitySection")}
              </Text>

              {/* Interface ultra simplificada: Apenas RIR */}
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 50, duration: 150 }}
              >
                <View style={[styles.intensityContainer, { marginTop: 10 }]}>
                  <Text style={[styles.intensityLabel, { color: colors.text }]}>
                    {t("exercise.repsInReserveShort")}
                  </Text>
                  <View style={styles.intensityButtonsRow}>
                    {[0, 1, 2, 3, 4, 5].map((value, idx) => (
                      <MotiView
                        key={`rir-${value}`}
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 30 * idx, duration: 120 }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.intensityButton,
                            {
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              justifyContent: "center",
                              alignItems: "center",
                              backgroundColor:
                                repsInReserve === value
                                  ? value === 0
                                    ? "#F44336"
                                    : color
                                  : "transparent",
                              borderWidth: 1,
                              borderColor:
                                repsInReserve === value
                                  ? value === 0
                                    ? "#F44336"
                                    : color
                                  : colors.border,
                            },
                          ]}
                          onPress={() => handleRepsInReserveChange(value)}
                        >
                          <Text
                            style={[
                              styles.intensityButtonText,
                              {
                                color:
                                  repsInReserve === value
                                    ? "#FFF"
                                    : colors.text,
                              },
                            ]}
                          >
                            {value}
                          </Text>
                        </TouchableOpacity>
                      </MotiView>
                    ))}
                  </View>
                </View>
              </MotiView>

              {/* Percepção de esforço - ultra minimalista */}
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 100, duration: 150 }}
              >
                <View style={[styles.intensityContainer, { marginTop: 15 }]}>
                  <Text style={[styles.intensityLabel, { color: colors.text }]}>
                    {t("exercise.perceivedEffort.title")}
                  </Text>
                  <View style={styles.intensityButtonsRow}>
                    {[1, 2, 3, 4, 5].map((level, idx) => (
                      <MotiView
                        key={`effort-${level}`}
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 30 * idx, duration: 120 }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.intensityButton,
                            {
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              justifyContent: "center",
                              alignItems: "center",
                              backgroundColor:
                                perceivedEffort === level
                                  ? color
                                  : "transparent",
                              borderWidth: 1,
                              borderColor:
                                perceivedEffort === level
                                  ? color
                                  : colors.border,
                            },
                          ]}
                          onPress={() => handlePerceivedEffortChange(level)}
                        >
                          <Text
                            style={[
                              styles.intensityButtonText,
                              {
                                color:
                                  perceivedEffort === level
                                    ? "#FFF"
                                    : colors.text,
                              },
                            ]}
                          >
                            {level}
                          </Text>
                        </TouchableOpacity>
                      </MotiView>
                    ))}
                  </View>
                </View>
              </MotiView>
            </View>
          </MotiView>
        </MotiView>
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
  const [expanded, setExpanded] = useState(false);

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
    <View style={[styles.cardioCard, { backgroundColor: colors.card }]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleExpanded}
        style={styles.cardioCardHeader}
      >
        <View style={styles.setCardHeaderLeft}>
          <View
            style={[
              styles.setIconBackground,
              { backgroundColor: color + "20" },
            ]}
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
  const { showToast } = useToast();

  // Referências para o ScrollView e inputs
  const scrollViewRef = useRef<ScrollView>(null);
  const customNameInputRef = useRef<TextInput>(null);
  const notesInputRef = useRef<TextInput>(null);

  // Extrair parâmetros da URL
  const exerciseId = params.exerciseId as string;
  const customName = params.customName as string;
  const workoutId = params.workoutId as string;
  const workoutColor = (params.workoutColor as string) || colors.primary;
  const mode = params.mode as string;
  const exerciseDataParam = params.exerciseData as string;
  const urlIsBodyweightExercise = params.isBodyweightExercise as string;
  // Verificar se estamos vindo da tela de histórico de exercícios recentes
  const fromRecent = params.fromRecent === "true";

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

  // Adicionar um estado para rastrear se o exercício é de peso corporal
  // Inicializar com o valor da URL se disponível
  const [isBodyweightExercise, setIsBodyweightExercise] = useState(
    urlIsBodyweightExercise === "true"
  );

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

          // Definir o estado de exercício de peso corporal
          const isBodyweight = !!exerciseData.isBodyweightExercise;
          setIsBodyweightExercise(isBodyweight);

          if (exerciseData.sets && exerciseData.sets.length > 0) {
            // Garantir que todas as séries tenham a propriedade isBodyweightExercise
            const updatedSets = exerciseData.sets.map((set: ExerciseSet) => ({
              ...set,
              isBodyweightExercise: isBodyweight,
            }));
            setSets(updatedSets);
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

              // Manter a informação de isBodyweightExercise do exerciseData que veio do WorkoutContext
              // apenas usar o valor do banco de dados se não existir no exerciseData
              const shouldBeBodyweight =
                exerciseData.isBodyweightExercise !== undefined
                  ? !!exerciseData.isBodyweightExercise
                  : !!dbExercise.isBodyweightExercise;

              setIsBodyweightExercise(shouldBeBodyweight);

              // Atualizar todas as séries com a informação correta de isBodyweightExercise
              if (exerciseData.sets && exerciseData.sets.length > 0) {
                setSets((prevSets) =>
                  prevSets.map((set: ExerciseSet) => ({
                    ...set,
                    isBodyweightExercise: shouldBeBodyweight,
                  }))
                );
              }
            }
          }

          setIsLoading(false);
          return;
        } catch (error) {
          console.error("Erro ao analisar os dados do exercício:", error);
        }
      }

      // Fluxo normal se não estivermos editando
      if (exerciseId) {
        // Buscar exercício pelo ID
        const exerciseData = getExerciseById(exerciseId);

        if (exerciseData) {
          setExercise(exerciseData);
          setNotes("");

          // Usar isBodyweightExercise do exercício do banco de dados ou da URL
          const isBodyweight =
            urlIsBodyweightExercise === "true" ||
            !!exerciseData.isBodyweightExercise;
          setIsBodyweightExercise(isBodyweight);

          // Adicionar uma série inicial
          addNewSet();
        }
      } else {
        // Para exercícios personalizados, adicionar uma série inicial
        addNewSet();
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes do exercício:", error);
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
      weight: isBodyweightExercise ? 0 : 10,
      restTime: 60,
      toFailure: false,
      repsInReserve: 2,
      perceivedEffort: 3,
      isBodyweightExercise: isBodyweightExercise,
    };

    setSets((prevSets) => [...prevSets, newSet]);

    // Feedback tátil
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Função para duplicar a última série
  const duplicateLastSet = () => {
    setSets((prevSets) => {
      if (prevSets.length === 0) {
        return prevSets;
      }

      const lastSet = prevSets[prevSets.length - 1];
      const newSet: ExerciseSet = {
        ...lastSet,
        id: `set-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        isBodyweightExercise: isBodyweightExercise,
      };

      // Feedback tátil
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      return [...prevSets, newSet];
    });
  };

  // Função para atualizar uma série
  const updateSet = (index: number, updatedSet: ExerciseSet) => {
    setSets((prevSets) => {
      const newSets = [...prevSets];
      // Garantir que a propriedade isBodyweightExercise seja mantida
      newSets[index] = {
        ...updatedSet,
        isBodyweightExercise: isBodyweightExercise,
      };
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

    // Verificar se o exercício está no banco de dados para obter a informação isBodyweightExercise
    let dbExerciseData = undefined;
    if (exerciseId) {
      dbExerciseData = getExerciseById(exerciseId);
    }

    // Criar o objeto de exercício
    const newExercise: Exercise = {
      id: mode === "edit" && exerciseId ? exerciseId : `exercise-${Date.now()}`,
      name: exercise
        ? exercise.id && exercise.id.startsWith("ex") && exercise.id.length <= 6
          ? t(`exercises.exercises.${exercise.id}`)
          : exercise.name
        : customExerciseName.trim(),
      sets: exercise?.category === "cardio" ? [] : sets,
      notes: notes,
      category: exercise?.category || "força",
      cardioDuration:
        exercise?.category === "cardio" ? cardioDuration : undefined,
      cardioIntensity:
        exercise?.category === "cardio" ? cardioIntensity : undefined,
      isBodyweightExercise: isBodyweightExercise,
    };

    // Se estamos editando, atualizar o exercício existente
    if (mode === "edit" && exerciseId) {
      updateExerciseInWorkout(workoutId, exerciseId, newExercise);

      // Mostrar toast de atualização
      showToast({
        message: t("exercise.updatedSuccess", {
          defaultValue: `${newExercise.name} atualizado com sucesso`,
        }),
        type: "success",
        position: "bottom",
      });
    } else {
      // Caso contrário, adicionar um novo exercício
      addExerciseToWorkout(workoutId, newExercise);

      // Mostrar toast de adição
      showToast({
        message: t("exercise.addedSuccess", {
          defaultValue: `${newExercise.name} adicionado ao treino`,
        }),
        type: "success",
        position: "bottom",
      });
    }

    // Voltar para a tela anterior
    router.back();
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
      edges={mode === "edit" ? ["top", "bottom"] : ["bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={
          // Aumentar o offset para garantir mais espaço no modo modal
          mode === "edit" ? 0 : Platform.OS === "ios" ? 70 : 0
        }
      >
        <View
          style={[
            styles.header,
            { backgroundColor: colors.background },
            mode === "edit" && { paddingTop: Platform.OS === "ios" ? 0 : 16 },
          ]}
        >
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
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={[
            styles.scrollViewContent,
            mode === "edit" && styles.scrollViewContentEdit,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
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
                      ref={customNameInputRef}
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
                    {exercise &&
                      (exercise.id.startsWith("exercise-")
                        ? exercise.name
                        : exercise.id &&
                          exercise.id.startsWith("ex") &&
                          exercise.id.length <= 6
                        ? t(`exercises.exercises.${exercise.id}`)
                        : exercise.name || "")}
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
                      <Ionicons
                        name="body-outline"
                        size={14}
                        color={workoutColor}
                        style={styles.exerciseDetailTagIcon}
                      />
                      <Text
                        style={[
                          styles.exerciseDetailTagText,
                          { color: workoutColor },
                        ]}
                      >
                        {t(`exercises.muscles.${exercise.muscle}`)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.exerciseDetailTag,
                        { backgroundColor: workoutColor + "15" },
                      ]}
                    >
                      <Ionicons
                        name="barbell-outline"
                        size={14}
                        color={workoutColor}
                        style={styles.exerciseDetailTagIcon}
                      />
                      <Text
                        style={[
                          styles.exerciseDetailTagText,
                          { color: workoutColor },
                        ]}
                      >
                        {t(`exercises.equipment.${exercise.equipment}`)}
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
                <View style={styles.configTitleContainer}>
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

                  {exercise?.category !== "cardio" && (
                    <View style={styles.setButtonsContainer}>
                      {sets.length > 0 && (
                        <MotiView
                          from={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            type: "spring",
                            damping: 15,
                            delay: 100,
                          }}
                        >
                          <TouchableOpacity
                            style={[
                              styles.copySetButton,
                              {
                                backgroundColor: colors.card,
                                borderColor: workoutColor,
                              },
                            ]}
                            onPress={duplicateLastSet}
                            accessibilityLabel={t(
                              "exercise.duplicateLastSet",
                              "Duplicar última série"
                            )}
                            hitSlop={{
                              top: 10,
                              right: 10,
                              bottom: 10,
                              left: 10,
                            }}
                          >
                            <Ionicons
                              name="copy-outline"
                              size={18}
                              color={workoutColor}
                            />
                          </TouchableOpacity>
                        </MotiView>
                      )}
                      <MotiView
                        from={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: "spring",
                          damping: 15,
                        }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.copySetButton,
                            {
                              backgroundColor: colors.card,
                              borderColor: workoutColor,
                            },
                          ]}
                          onPress={addNewSet}
                        >
                          <Ionicons name="add" size={20} color={workoutColor} />
                        </TouchableOpacity>
                      </MotiView>
                    </View>
                  )}
                </View>

                {exercise?.category !== "cardio" ? (
                  <View
                    style={[
                      styles.setsContainer,
                      mode === "edit" && styles.setsContainerEdit,
                    ]}
                  >
                    {sets.map((set, index) => (
                      <MotiView
                        key={set.id}
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{
                          type: "spring",
                          damping: 15,
                          delay: index * 100,
                        }}
                      >
                        <SetCard
                          key={set.id}
                          set={set}
                          index={index}
                          onUpdate={(updatedSet) =>
                            updateSet(index, updatedSet)
                          }
                          onRemove={() => removeSet(index)}
                          color={workoutColor}
                          isBodyweightExercise={isBodyweightExercise}
                        />
                      </MotiView>
                    ))}
                  </View>
                ) : (
                  <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{
                      type: "spring",
                      damping: 15,
                      delay: 300,
                    }}
                  >
                    <CardioCard
                      duration={cardioDuration}
                      intensity={cardioIntensity}
                      onUpdate={updateCardioSettings}
                      color={workoutColor}
                    />
                  </MotiView>
                )}

                <View style={styles.notesContainer}>
                  <Text style={[styles.notesLabel, { color: workoutColor }]}>
                    {t("exercise.notes")}
                  </Text>
                  <TextInput
                    ref={notesInputRef}
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
              position: "relative",
              zIndex: 100,
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
    paddingBottom: 120,
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
    fontFamily: "Anton-Regular",
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
  exerciseDetailsEdit: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  exerciseDetailTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseDetailTagIcon: {
    marginRight: 6,
  },
  exerciseDetailTagText: {
    fontSize: 13,
    fontFamily: "Anton-Regular",
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
    marginHorizontal: 16,
    paddingTop: 0,
    marginBottom: 24,
  },
  configTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 0,
    letterSpacing: -0.5,
    paddingHorizontal: 0,
  },
  setsContainer: {
    marginBottom: 30,
    gap: 8,
  },
  setCard: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
    marginBottom: 6,
  },
  setCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    paddingBottom: 20,
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
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 3,
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
    paddingTop: 6,
    gap: 16,
  },
  setCardExpandedContent: {
    padding: 16,
    paddingTop: 12,
    gap: 20,
    borderTopWidth: 1,
  },
  expandedSection: {
    gap: 12,
  },
  expandedSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  intensityContainer: {
    marginTop: 10,
  },
  intensityLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  intensityButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingHorizontal: 5,
  },
  intensityButton: {
    // Estilos serão aplicados inline
  },
  intensityButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  perceivedEffortContainer: {
    marginTop: 6,
  },
  perceivedEffortHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  perceivedEffortTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  perceivedEffortValueText: {
    marginLeft: "auto",
    fontSize: 16,
    fontWeight: "700",
  },
  perceivedEffortLevels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 6,
  },
  perceivedEffortLevel: {
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  perceivedEffortLevelText: {
    fontSize: 12,
    fontWeight: "600",
  },
  perceivedEffortDescription: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
  },
  failureIndicator: {
    fontWeight: "600",
  },
  bottomBar: {
    padding: 16,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 16 : 24,
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
  exerciseNameEdit: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.5,
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
    fontSize: 15,
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
  failureContainerMinimal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  failureToggleMinimal: {
    padding: 4,
  },
  failureSwitchTrack: {
    width: 36,
    height: 20,
    borderRadius: 10,
    padding: 2,
    justifyContent: "center",
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
    width: "100%",
    height: 40,
  },
  sliderLabelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -8,
    marginBottom: 8,
  },
  sliderLabelText: {
    fontSize: 12,
  },
  sliderValueText: {
    marginLeft: "auto",
    fontSize: 14,
    fontWeight: "600",
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
  notesContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  notesInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: "top",
  },
  configTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingHorizontal: 0,
  },
  setButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addSetButtonMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  copySetButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  bodyweightContainer: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  bodyweightText: {
    fontSize: 16,
  },
});
