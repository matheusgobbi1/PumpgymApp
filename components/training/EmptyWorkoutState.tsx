import React, { useState, useEffect, memo, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
// Importar o tipo para os ícones do Ionicons
import type { Icon } from "@expo/vector-icons/build/createIconSet";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";
import { useWorkoutContext } from "../../context/WorkoutContext";
import Colors from "../../constants/Colors";
import { WorkoutType } from "./WorkoutConfigSheet";
import WorkoutIcon from "../shared/WorkoutIcon";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

interface EmptyWorkoutStateProps {
  onWorkoutConfigured: (workouts: WorkoutType[]) => void;
  onOpenWorkoutConfig: () => void;
  onSelectWorkout?: (workoutId: string) => void;
}

// Tipo para os ícones do Ionicons
type IoniconsNames = React.ComponentProps<typeof Ionicons>["name"];

// Componentes memoizados para evitar re-renderizações desnecessárias
const TipItem = memo(
  ({
    icon,
    text,
    color,
  }: {
    icon: IoniconsNames;
    text: string;
    color: string;
  }) => (
    <View style={styles.tipItem}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.tipText, { color: color + "70" }]}>{text}</Text>
    </View>
  )
);

// Componente para o card de tipo de treino
const WorkoutTypeCard = memo(
  ({
    workoutType,
    onPress,
    index,
  }: {
    workoutType: WorkoutType;
    onPress: () => void;
    index: number;
  }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const iconColor = workoutType.color || colors.primary;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          type: "timing",
          duration: 350,
          delay: index * 100,
        }}
        style={styles.workoutTypeCardContainer}
      >
        <TouchableOpacity
          style={[
            styles.workoutTypeCard,
            {
              backgroundColor: iconColor + "10",
              borderColor: iconColor + "40",
            },
          ]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.workoutTypeIconContainer,
              { backgroundColor: iconColor + "20" },
            ]}
          >
            <WorkoutIcon
              iconType={
                workoutType.iconType || {
                  type: "ionicons",
                  name: "barbell-outline",
                }
              }
              size={24}
              color={iconColor}
            />
          </View>
          <Text style={[styles.workoutTypeName, { color: iconColor }]}>
            {workoutType.name}
          </Text>
        </TouchableOpacity>
      </MotiView>
    );
  }
);

function EmptyWorkoutState({
  onWorkoutConfigured,
  onOpenWorkoutConfig,
  onSelectWorkout,
}: EmptyWorkoutStateProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();
  const workoutContext = useWorkoutContext();
  const { selectedDate } = workoutContext;
  const availableWorkoutTypes = workoutContext.availableWorkoutTypes || [];
  const { startWorkoutForDate } = workoutContext;

  // Filtrar apenas os tipos de treino selecionados
  const selectedWorkoutTypes = useMemo(() => {
    return Array.isArray(availableWorkoutTypes)
      ? availableWorkoutTypes.filter((type) => type.selected === true)
      : [];
  }, [availableWorkoutTypes]);

  // Verificar se há tipos de treino selecionados
  const hasSelectedWorkoutTypes = useMemo(
    () => selectedWorkoutTypes.length > 0,
    [selectedWorkoutTypes]
  );

  // Função para abrir o bottom sheet
  const openWorkoutConfig = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onOpenWorkoutConfig();
  }, [onOpenWorkoutConfig]);

  // Função para selecionar um tipo de treino
  const handleSelectWorkout = useCallback(
    async (workoutType: WorkoutType) => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Iniciar o treino para a data atual apenas com o ID do workoutType
        const workoutId = await startWorkoutForDate(workoutType.id);

        if (!workoutId) {
          throw new Error(`Falha ao iniciar treino com ID: ${workoutType.id}`);
        }

        // Notificar o componente pai
        if (onSelectWorkout) {
          onSelectWorkout(workoutType.id);
        }

        // Forçar salvamento imediato dos treinos
        if (workoutContext.saveWorkouts) {
          await workoutContext.saveWorkouts();
        }
      } catch (error) {
        console.error("Erro ao selecionar treino:", error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [startWorkoutForDate, onSelectWorkout, workoutContext]
  );

  // Renderizar o estado quando não há tipos de treino configurados
  const renderNoWorkoutTypesState = () => (
    <>
      <View style={styles.illustrationContainer}>
        <Ionicons name="barbell-outline" size={80} color={colors.primary} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {t("training.emptyState.title")}
      </Text>

      <Text style={[styles.description, { color: colors.text + "80" }]}>
        {t("training.emptyState.subtitle")}
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={openWorkoutConfig}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {t("training.emptyState.configButton")}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.tipsContainer}>
        <TipItem
          icon="checkmark-circle-outline"
          text={t("training.tips.organize")}
          color={colors.primary}
        />
        <TipItem
          icon="checkmark-circle-outline"
          text={t("training.tips.track")}
          color={colors.primary}
        />
        <TipItem
          icon="checkmark-circle-outline"
          text={t("training.tips.progress")}
          color={colors.primary}
        />
      </View>
    </>
  );

  // Renderizar o estado quando há tipos de treino configurados
  const renderWorkoutTypesState = () => {
    return (
      <>
        <Text style={[styles.title, { color: colors.text }]}>
          {t("training.workoutTypes.title")}
        </Text>

        <Text style={[styles.description, { color: colors.text + "80" }]}>
          {t("training.workoutTypes.subtitle")}
        </Text>

        <View style={styles.workoutTypesContainer}>
          {selectedWorkoutTypes.map((workoutType, index) => (
            <WorkoutTypeCard
              key={workoutType.id}
              workoutType={workoutType}
              onPress={() => handleSelectWorkout(workoutType)}
              index={index}
            />
          ))}
        </View>
      </>
    );
  };

  return (
    <MotiView
      style={styles.container}
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 300, delay: 100 }}
    >
      {hasSelectedWorkoutTypes
        ? renderWorkoutTypesState()
        : renderNoWorkoutTypesState()}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationContainer: {
    marginBottom: 30,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(33, 150, 243, 0.1)",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  buttonContainer: {
    width: "100%",
    marginBottom: 40,
  },
  button: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  tipsContainer: {
    width: "100%",
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    marginLeft: 8,
  },
  workoutTypesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    marginBottom: 20,
  },
  workoutTypeCardContainer: {
    width: "50%",
    padding: 8,
  },
  workoutTypeCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    height: 140,
  },
  workoutTypeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  workoutTypeName: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

// Exportar o componente memoizado para evitar re-renderizações desnecessárias
export default memo(EmptyWorkoutState);
