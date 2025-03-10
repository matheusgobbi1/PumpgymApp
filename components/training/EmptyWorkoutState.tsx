import React, { useState, useEffect, memo, useCallback } from "react";
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

const { width } = Dimensions.get("window");

interface EmptyWorkoutStateProps {
  onWorkoutConfigured: (workouts: WorkoutType[]) => void;
  onOpenWorkoutConfig: () => void; // Prop para abrir o bottom sheet
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

function EmptyWorkoutState({
  onWorkoutConfigured,
  onOpenWorkoutConfig,
}: EmptyWorkoutStateProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { hasWorkoutTypesConfigured } = useWorkoutContext();
  const [isVisible, setIsVisible] = useState(false);

  // Efeito para atrasar a animação inicial
  useEffect(() => {
    // Atrasar a animação para permitir que a UI seja renderizada primeiro
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Função para abrir o bottom sheet
  const openWorkoutConfig = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onOpenWorkoutConfig();
  }, [onOpenWorkoutConfig]);

  return (
    <MotiView
      style={styles.container}
      from={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ type: "timing", duration: 300 }}
    >
      <View style={styles.illustrationContainer}>
        <Ionicons name="barbell-outline" size={80} color={colors.primary} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        Configure seus Treinos
      </Text>

      <Text style={[styles.description, { color: colors.text + "80" }]}>
        Personalize seus treinos para acompanhar seu progresso de forma
        eficiente.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={openWorkoutConfig}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Configurar Treinos</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.tipsContainer}>
        <TipItem
          icon="checkmark-circle-outline"
          text="Organize seus treinos por grupos musculares"
          color={colors.primary}
        />
        <TipItem
          icon="checkmark-circle-outline"
          text="Registre exercícios, séries e repetições"
          color={colors.primary}
        />
        <TipItem
          icon="checkmark-circle-outline"
          text="Acompanhe sua evolução ao longo do tempo"
          color={colors.primary}
        />
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
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
});

// Exportar o componente memoizado para evitar re-renderizações desnecessárias
export default memo(EmptyWorkoutState);
