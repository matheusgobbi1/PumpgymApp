import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ExerciseSet } from "../../context/WorkoutContext";
import Colors from "../../constants/Colors";
import { MotiView } from "moti";
import { useTranslation } from "react-i18next";
import { ExerciseData } from "../../data/exerciseDatabase";

interface ProgressionConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (updatedSets: ExerciseSet[]) => void;
  exerciseName: string;
  exerciseDB?: ExerciseData;
  previousSets: ExerciseSet[];
  suggestedSets: ExerciseSet[];
  workoutColor: string;
  theme: "light" | "dark";
}

const { width } = Dimensions.get("window");

export default function ProgressionConfirmDialog({
  visible,
  onClose,
  onConfirm,
  exerciseName,
  exerciseDB,
  previousSets,
  suggestedSets,
  workoutColor,
  theme,
}: ProgressionConfirmDialogProps) {
  const colors = Colors[theme];
  const [editedSets, setEditedSets] = useState<ExerciseSet[]>([]);
  const { t } = useTranslation();

  // Adicionar função para obter o nome traduzido do exercício
  const getTranslatedExerciseName = () => {
    if (
      exerciseDB?.id &&
      exerciseDB.id.length <= 6 &&
      exerciseDB.id.startsWith("ex")
    ) {
      return t(`exercises.exercises.${exerciseDB.id}`);
    }
    return exerciseName;
  };

  // Inicializar os conjuntos editados quando o diálogo é aberto
  useEffect(() => {
    if (visible && suggestedSets.length > 0) {
      // Copiar os conjuntos sugeridos com todas as propriedades dos conjuntos anteriores
      const initialSets = suggestedSets.map((suggestedSet, index) => {
        const prevSet =
          index < previousSets.length ? previousSets[index] : null;
        return {
          ...suggestedSet,
          // Transferir as propriedades avançadas do conjunto anterior
          toFailure: prevSet?.toFailure || false,
          repsInReserve: prevSet?.repsInReserve || 2,
          perceivedEffort: prevSet?.perceivedEffort || 3,
        };
      });

      setEditedSets(initialSets);
    }
  }, [visible, suggestedSets, previousSets]);

  // Função para atualizar uma série
  const updateSet = (index: number, updates: Partial<ExerciseSet>) => {
    setEditedSets((currentSets) => {
      const newSets = [...currentSets];
      newSets[index] = { ...newSets[index], ...updates };
      return newSets;
    });

    // Feedback tátil
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Função para confirmar as alterações
  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(editedSets);
  };

  // Função para fechar sem salvar
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  };

  // Renderizar os controles para uma série específica
  const renderSetControls = (set: ExerciseSet, index: number) => {
    return (
      <View
        key={`set-${index}`}
        style={[
          styles.setCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.setHeader}>
          <View
            style={[
              styles.setIconBadge,
              { backgroundColor: workoutColor + "20" },
            ]}
          >
            <Ionicons name="barbell-outline" size={16} color={workoutColor} />
          </View>
          <Text style={[styles.setText, { color: colors.text }]}>
            {t("progression.confirmDialog.set", { number: index + 1 })}
          </Text>
          <Text style={[styles.setSummary, { color: colors.text + "80" }]}>
            {set.reps} reps × {set.weight} kg
          </Text>
        </View>

        {/* Controle de RIR (Repetições em Reserva) */}
        <View style={styles.controlRow}>
          <Text style={[styles.controlLabel, { color: colors.text }]}>
            {t("progression.confirmDialog.repsInReserve")}
          </Text>

          <View style={styles.intensityButtonsRow}>
            {[0, 1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={`rir-${value}`}
                style={[
                  styles.intensityButton,
                  {
                    backgroundColor:
                      set.repsInReserve === value
                        ? value === 0
                          ? "#F44336"
                          : workoutColor
                        : "transparent",
                    borderWidth: 1,
                    borderColor:
                      set.repsInReserve === value
                        ? value === 0
                          ? "#F44336"
                          : workoutColor
                        : colors.border,
                  },
                ]}
                onPress={() => {
                  updateSet(index, {
                    repsInReserve: value,
                    toFailure: value === 0,
                  });
                }}
              >
                <Text
                  style={[
                    styles.intensityButtonText,
                    {
                      color: set.repsInReserve === value ? "#FFF" : colors.text,
                    },
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Controle de Percepção de Esforço */}
        <View style={styles.controlRow}>
          <Text style={[styles.controlLabel, { color: colors.text }]}>
            {t("progression.confirmDialog.perceivedEffort")}
          </Text>

          <View style={styles.intensityButtonsRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={`effort-${value}`}
                style={[
                  styles.intensityButton,
                  {
                    backgroundColor:
                      set.perceivedEffort === value
                        ? workoutColor
                        : "transparent",
                    borderWidth: 1,
                    borderColor:
                      set.perceivedEffort === value
                        ? workoutColor
                        : colors.border,
                  },
                ]}
                onPress={() => updateSet(index, { perceivedEffort: value })}
              >
                <Text
                  style={[
                    styles.intensityButtonText,
                    {
                      color:
                        set.perceivedEffort === value ? "#FFF" : colors.text,
                    },
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleClose}
      >
        <BlurView
          intensity={20}
          style={StyleSheet.absoluteFill}
          tint={theme === "dark" ? "dark" : "light"}
        />
      </TouchableOpacity>

      <View style={styles.modalContainer}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 250 }}
          style={[
            styles.modalContent,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.title, { color: colors.text }]}>
              {t("progression.confirmDialog.title")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
              {getTranslatedExerciseName()}
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {editedSets.map((set, index) => renderSetControls(set, index))}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: workoutColor }]}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.confirmButtonText,
                  theme === "dark" && { color: "#000000" },
                ]}
              >
                {t("progression.confirmDialog.confirm")}
              </Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: width * 0.9,
    maxWidth: 500,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    maxHeight: "80%",
  },
  headerContainer: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 16,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  setCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    padding: 16,
    marginBottom: 8,
  },
  setHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 12,
  },
  setIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  setText: {
    fontSize: 15,
    fontWeight: "600",
  },
  setSummary: {
    fontSize: 13,
    marginLeft: "auto",
  },
  controlRow: {
    paddingVertical: 12,
    paddingHorizontal: 1,
    gap: 12,
  },
  controlLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  intensityButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    gap: 8,
  },
  intensityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  intensityButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  confirmButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
