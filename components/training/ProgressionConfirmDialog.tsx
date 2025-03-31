import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ExerciseSet } from "../../context/WorkoutContext";
import Colors from "../../constants/Colors";
import { MotiView } from "moti";

interface ProgressionConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (updatedSets: ExerciseSet[]) => void;
  exerciseName: string;
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
  previousSets,
  suggestedSets,
  workoutColor,
  theme,
}: ProgressionConfirmDialogProps) {
  const colors = Colors[theme];
  const [editedSets, setEditedSets] = useState<ExerciseSet[]>([]);
  
  // Inicializar os conjuntos editados quando o diálogo é aberto
  useEffect(() => {
    if (visible && suggestedSets.length > 0) {
      // Copiar os conjuntos sugeridos com todas as propriedades dos conjuntos anteriores
      const initialSets = suggestedSets.map((suggestedSet, index) => {
        const prevSet = index < previousSets.length ? previousSets[index] : null;
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
          { backgroundColor: colors.card, borderColor: colors.border }
        ]}
      >
        <View style={styles.setHeader}>
          <View style={[styles.setIconBadge, { backgroundColor: workoutColor + "20" }]}>
            <Ionicons name="barbell-outline" size={16} color={workoutColor} />
          </View>
          <Text style={[styles.setText, { color: colors.text }]}>
            Série {index + 1}
          </Text>
          <Text style={[styles.setSummary, { color: colors.text + "80" }]}>
            {set.reps} reps × {set.weight} kg
          </Text>
        </View>
        
        {/* Controle de falha muscular */}
        <View style={styles.controlRow}>
          <View style={styles.controlLabelContainer}>
            <Ionicons name="flash-outline" size={18} color={workoutColor} style={styles.controlIcon} />
            <Text style={[styles.controlLabel, { color: colors.text }]}>
              Até a Falha
            </Text>
          </View>
          
          <Switch
            value={set.toFailure}
            onValueChange={(value) => updateSet(index, { toFailure: value })}
            trackColor={{ false: colors.border, true: workoutColor + "70" }}
            thumbColor={set.toFailure ? workoutColor : colors.text + "30"}
            ios_backgroundColor={colors.border}
          />
        </View>
        
        {/* Controle de RIR (Repetições em Reserva) */}
        <View style={[
          styles.controlRow, 
          { opacity: set.toFailure ? 0.5 : 1 }
        ]}>
          <View style={styles.controlLabelContainer}>
            <Ionicons name="fitness-outline" size={18} color={workoutColor} style={styles.controlIcon} />
            <Text style={[styles.controlLabel, { color: colors.text }]}>
              Reps em Reserva
            </Text>
          </View>
          
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              value={set.repsInReserve || 2}
              minimumValue={1}
              maximumValue={5}
              step={1}
              disabled={set.toFailure}
              onValueChange={(value) => updateSet(index, { repsInReserve: value })}
              minimumTrackTintColor={workoutColor}
              maximumTrackTintColor={colors.border}
              thumbTintColor={workoutColor}
            />
            <Text style={[styles.sliderValue, { color: colors.text }]}>
              {set.repsInReserve || 2}
            </Text>
          </View>
        </View>
        
        {/* Controle de Percepção de Esforço */}
        <View style={styles.controlRow}>
          <View style={styles.controlLabelContainer}>
            <Ionicons name="pulse-outline" size={18} color={workoutColor} style={styles.controlIcon} />
            <Text style={[styles.controlLabel, { color: colors.text }]}>
              Percepção de Esforço
            </Text>
          </View>
          
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              value={set.perceivedEffort || 3}
              minimumValue={1}
              maximumValue={5}
              step={1}
              onValueChange={(value) => updateSet(index, { perceivedEffort: value })}
              minimumTrackTintColor={workoutColor}
              maximumTrackTintColor={colors.border}
              thumbTintColor={workoutColor}
            />
            <Text style={[styles.sliderValue, { color: colors.text }]}>
              {set.perceivedEffort || 3}
            </Text>
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
      <BlurView intensity={20} style={StyleSheet.absoluteFill} tint={theme === "dark" ? "dark" : "light"} />
      
      <View style={styles.modalContainer}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1}}
          transition={{ type: "timing", duration: 250 }}
          style={[
            styles.modalContent,
            { backgroundColor: colors.background, borderColor: colors.border }
          ]}
        >
          <View style={[styles.headerContainer, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              Ajustar Progressão
            </Text>
            <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
              {exerciseName}
            </Text>
          </View>
          
          <View style={[styles.instructionContainer, { borderBottomColor: colors.border }]}>
            <View style={[styles.infoIconContainer, { backgroundColor: workoutColor + "20" }]}>
              <Ionicons name="information-circle" size={18} color={workoutColor} />
            </View>
            <Text style={[styles.instructionText, { color: colors.text + "99" }]}>
              Revise e ajuste as configurações avançadas antes de aplicar a progressão sugerida.
            </Text>
          </View>
          
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {editedSets.map((set, index) => renderSetControls(set, index))}
          </ScrollView>
          
          <View style={[styles.buttonContainer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: workoutColor }]}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmButtonText}>
                Confirmar
              </Text>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={styles.confirmIcon} />
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
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  instructionContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
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
  },
  setHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingBottom: 18,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    paddingVertical: 16,
  },
  controlLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 130,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: "500",
    flexShrink: 1,
    marginRight: 10,
  },
  controlIcon: {
    marginRight: 10,
    minWidth: 18,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 155,
    marginLeft: 10,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    width: 30,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginLeft: 2,
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  confirmIcon: {
    marginLeft: 8,
  },
}); 