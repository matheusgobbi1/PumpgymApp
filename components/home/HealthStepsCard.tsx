import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { MotiView } from "moti";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Pedometer } from "expo-sensors";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2; // Metade da largura da tela menos o padding

export default function HealthStepsCard() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Estado para armazenar os passos
  const [steps, setSteps] = useState<number | null>(null);
  const [isPedometerAvailable, setPedometerAvailable] =
    useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  // Meta diária de passos
  const dailyGoal = 10000;

  // Verificar disponibilidade do pedômetro e iniciar monitoramento
  useEffect(() => {
    const checkPermissionAndAvailability = async () => {
      try {
        setLoading(true);

        // Verificar se o pedômetro está disponível
        const isAvailable = await Pedometer.isAvailableAsync();
        setPedometerAvailable(isAvailable);

        if (!isAvailable) {
          setLoading(false);
          return;
        }

        // Verificar permissão
        const permission = await Pedometer.requestPermissionsAsync();
        setHasPermission(permission.granted);

        if (permission.granted) {
          // Obter passos desde a meia-noite de hoje
          const now = new Date();
          const start = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0,
            0,
            0
          );

          const pastStepsResult = await Pedometer.getStepCountAsync(start, now);
          setSteps(pastStepsResult?.steps || 0);

          // Iniciar monitoramento contínuo
          const subscription = Pedometer.watchStepCount((result) => {
            setSteps((prevSteps) => {
              // Se prevSteps for null, use o valor atual
              if (prevSteps === null) return result.steps;

              // Caso contrário, atualize com o valor mais recente
              return Math.max(prevSteps, result.steps);
            });
          });

          setSubscription(subscription);
        }
      } catch (error) {
        console.error("Erro ao acessar pedômetro:", error);
      } finally {
        setLoading(false);
      }
    };

    checkPermissionAndAvailability();

    // Limpar inscrição quando o componente for desmontado
    return () => {
      subscription?.remove();
    };
  }, []);

  // Função para conectar com o app de saúde
  const handleConnectHealth = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isPedometerAvailable && !hasPermission) {
      try {
        const permission = await Pedometer.requestPermissionsAsync();
        setHasPermission(permission.granted);
      } catch (error) {
        console.error("Erro ao solicitar permissão:", error);
      }
    }
  };

  // Função para formatar os passos
  const formatSteps = (steps: number) => {
    return steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : steps.toString();
  };

  // Calcular progresso de 0 a 100
  const getProgress = () => {
    if (steps === null) return 0;
    const progress = (steps / dailyGoal) * 100;
    return Math.min(progress, 100);
  };

  return (
    <MotiView
      style={[styles.container, { backgroundColor: colors.light }]}
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 500 }}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: "#4CAF50" + "20" },
            ]}
          >
            <MaterialCommunityIcons
              name="shoe-print"
              size={18}
              color="#4CAF50"
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Passos</Text>
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#4CAF50" />
          </View>
        ) : !isPedometerAvailable ? (
          <View style={styles.notAvailableContainer}>
            <Text
              style={[styles.notAvailableText, { color: colors.text + "80" }]}
            >
              Pedômetro não disponível
            </Text>
          </View>
        ) : !hasPermission ? (
          <TouchableOpacity
            style={[
              styles.connectButton,
              { backgroundColor: "#4CAF50" + "20" },
            ]}
            onPress={handleConnectHealth}
            activeOpacity={0.7}
          >
            <Ionicons
              name="fitness-outline"
              size={22}
              color="#4CAF50"
              style={styles.connectIcon}
            />
            <Text style={[styles.connectText, { color: "#4CAF50" }]}>
              Conectar
            </Text>
          </TouchableOpacity>
        ) : (
          <Animated.View
            entering={FadeIn.duration(500)}
            style={styles.stepsContainer}
          >
            {/* Área principal com passos e meta */}
            <View style={styles.mainContent}>
              {/* Contagem de passos centralizada */}
              <View style={styles.stepsCountContainer}>
                <Text style={[styles.stepsCount, { color: colors.text }]}>
                  {steps !== null ? formatSteps(steps) : "0"}
                </Text>
              </View>

              {/* Meta */}
              <View style={styles.goalContainer}>
                <Text style={[styles.goalText, { color: colors.text + "80" }]}>
                  Meta: {formatSteps(dailyGoal)}
                </Text>
              </View>
            </View>

            {/* Progress bar na base do card */}
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarBg,
                  { backgroundColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: "#4CAF50",
                      width: `${getProgress()}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 20,
    overflow: "hidden",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notAvailableContainer: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notAvailableText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  connectButton: {
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  connectIcon: {
    marginRight: 8,
  },
  connectText: {
    fontWeight: "600",
    fontSize: 14,
  },
  stepsContainer: {
    flex: 1,
    justifyContent: "space-between",
    width: "100%",
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepsCountContainer: {
    alignItems: "center",
  },
  stepsCount: {
    fontSize: 36,
    fontWeight: "bold",
  },
  goalContainer: {
    marginTop: 8,
    alignItems: "center",
  },
  goalText: {
    fontSize: 14,
    fontWeight: "500",
  },
  progressBarContainer: {
    width: "100%",
    marginTop: 10,
  },
  progressBarBg: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    position: "relative",
  },
  progressBarFill: {
    height: "100%",
    position: "absolute",
    left: 0,
    borderRadius: 3,
  },
});
