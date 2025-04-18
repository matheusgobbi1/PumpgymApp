import React, { memo, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
  FadeOut,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useWorkoutContext } from "../../context/WorkoutContext";
import Colors from "../../constants/Colors";
import { WorkoutType } from "./WorkoutConfigSheet";
import WorkoutIcon from "../shared/WorkoutIcon";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

interface EmptyWorkoutStateProps {
  onWorkoutConfigured: (workouts: WorkoutType[]) => void;
  onOpenWorkoutConfig: () => void;
  onSelectWorkout?: (workoutId: string) => void;
}

// Tipo para os ícones do Ionicons
type IoniconsNames = React.ComponentProps<typeof Ionicons>["name"];

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
      <Animated.View
        entering={FadeInDown.delay(index * 150).springify()}
        layout={Layout.springify()}
        style={styles.workoutTypeCardContainer}
      >
        <TouchableOpacity
          style={[
            styles.workoutTypeCard,
            {
              backgroundColor:
                theme === "dark"
                  ? `rgba(${parseInt(iconColor.slice(1, 3), 16)}, ${parseInt(
                      iconColor.slice(3, 5),
                      16
                    )}, ${parseInt(iconColor.slice(5, 7), 16)}, 0.15)`
                  : `rgba(${parseInt(iconColor.slice(1, 3), 16)}, ${parseInt(
                      iconColor.slice(3, 5),
                      16
                    )}, ${parseInt(iconColor.slice(5, 7), 16)}, 0.08)`,
              borderColor: `${iconColor}25`,
            },
          ]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[`${iconColor}15`, `${iconColor}05`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.workoutTypeGradient}
          >
            <Animated.View
              entering={FadeIn.delay(index * 200).springify()}
              style={[
                styles.workoutTypeIconContainer,
                { backgroundColor: `${iconColor}20` },
              ]}
            >
              <WorkoutIcon
                iconType={
                  workoutType.iconType || {
                    type: "ionicons",
                    name: "barbell-outline",
                  }
                }
                size={32}
                color={iconColor}
              />
            </Animated.View>
            <Animated.Text
              entering={FadeIn.delay(index * 250).springify()}
              style={[styles.workoutTypeName, { color: iconColor }]}
            >
              {workoutType.name}
            </Animated.Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
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

        // Iniciar o treino para a data atual
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [startWorkoutForDate, onSelectWorkout, workoutContext]
  );

  // Renderizar o estado quando não há tipos de treino configurados
  const renderNoWorkoutTypesState = () => (
    <Animated.View
      entering={FadeIn.duration(200).springify().withInitialValues({
        opacity: 0,
      })}
      exiting={FadeOut.duration(150)}
      style={styles.emptyContainer}
    >
      <Animated.View
        entering={FadeIn.delay(50)
          .duration(300)
          .springify()
          .withInitialValues({
            opacity: 0,
            transform: [{ translateY: 20 }],
          })}
        style={styles.illustrationContainer}
      >
        <LinearGradient
          colors={[`${colors.primary}40`, `${colors.primary}15`]}
          style={styles.illustrationGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.iconInnerContainer}>
            <Ionicons name="barbell-outline" size={64} color={colors.primary} />
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(100)
          .duration(300)
          .springify()
          .withInitialValues({
            opacity: 0,
            transform: [{ translateY: 15 }],
          })}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {t("training.emptyState.title")}
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(150)
          .duration(300)
          .springify()
          .withInitialValues({
            opacity: 0,
            transform: [{ translateY: 10 }],
          })}
      >
        <Text style={[styles.description, { color: colors.text + "80" }]}>
          {t("training.emptyState.subtitle")}
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(200)
          .duration(300)
          .springify()
          .withInitialValues({
            opacity: 0,
            transform: [{ translateY: 10 }],
          })}
        style={styles.buttonContainer}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={openWorkoutConfig}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.primary, `${colors.primary}DD`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text
              style={[
                styles.buttonText,
                { color: theme === "dark" ? "#000000" : "white" },
              ]}
            >
              {t("training.emptyState.configButton")}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );

  // Renderizar o estado quando há tipos de treino configurados
  const renderWorkoutTypesState = () => {
    return (
      <Animated.View
        entering={FadeIn.duration(300).springify()}
        exiting={FadeOut.duration(150)}
        style={styles.workoutTypesStateContainer}
      >
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.workoutTypesContainer}
        >
          {selectedWorkoutTypes.map((workoutType, index) => (
            <WorkoutTypeCard
              key={workoutType.id}
              workoutType={workoutType}
              onPress={() => handleSelectWorkout(workoutType)}
              index={index}
            />
          ))}
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <Animated.View
      layout={Layout.springify()}
      entering={FadeIn.duration(200).springify()}
      style={
        hasSelectedWorkoutTypes
          ? styles.containerWithWorkouts
          : styles.container
      }
    >
      {hasSelectedWorkoutTypes
        ? renderWorkoutTypesState()
        : renderNoWorkoutTypesState()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: height * 0.08,
  },
  containerWithWorkouts: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 0, // Remove o padding superior quando há treinos
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 400,
    marginTop: -height * 0.05,
  },
  illustrationContainer: {
    marginBottom: 35,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 10,
  },
  illustrationGradient: {
    width: 130,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
  },
  iconInnerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 18,
    maxWidth: 300,
    lineHeight: 22,
    fontWeight: "400",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 280,
    alignItems: "center",
  },
  button: {
    borderRadius: 18,
    overflow: "hidden",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 18,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
    marginRight: 8,
  },

  workoutTypesStateContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 550,
    marginTop: 0,
  },
  workoutTypesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 10,
  },
  workoutTypeCardContainer: {
    width: "48%",
    maxWidth: 220,
    margin: "1%",
  },
  workoutTypeCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    height: 170,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  workoutTypeGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  workoutTypeIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  workoutTypeName: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.3,
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
});

// Exportar o componente memoizado para evitar re-renderizações desnecessárias
export default memo(EmptyWorkoutState);
