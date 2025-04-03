import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pedometer } from "expo-sensors";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2; // Metade da largura da tela menos o padding

interface HealthStepsCardProps {
  onStepsUpdate?: (steps: number | null) => void;
}

export default function HealthStepsCard({
  onStepsUpdate,
}: HealthStepsCardProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();

  // Estado para armazenar os passos
  const [steps, setSteps] = useState<number | null>(null);
  const [isPedometerAvailable, setPedometerAvailable] = useState<
    boolean | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  // Meta diária de passos
  const dailyGoal = 10000;

  // Verificar disponibilidade do pedômetro e iniciar monitoramento
  React.useEffect(() => {
    let isMounted = true;

    const checkPermissionAndAvailability = async () => {
      try {
        setLoading(true);

        // Verificar se o pedômetro está disponível
        const isAvailable = await Pedometer.isAvailableAsync();

        if (!isMounted) return;
        setPedometerAvailable(isAvailable);

        if (!isAvailable) {
          setLoading(false);
          return;
        }

        // Verificar permissão
        const permission = await Pedometer.requestPermissionsAsync();

        if (!isMounted) return;
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

          if (!isMounted) return;
          setSteps(pastStepsResult?.steps || 0);

          // Iniciar monitoramento contínuo
          const sub = Pedometer.watchStepCount((result) => {
            if (!isMounted) return;

            setSteps((prevSteps) => {
              // Se prevSteps for null, use o valor atual
              if (prevSteps === null) return result.steps;

              // Caso contrário, atualize com o valor mais recente
              return Math.max(prevSteps, result.steps);
            });
          });

          setSubscription(sub);
        }
      } catch (error) {
        console.error("Erro ao acessar pedômetro:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkPermissionAndAvailability();

    // Limpar inscrição quando o componente for desmontado
    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  // Função para conectar com o app de saúde
  const handleConnectHealth = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isPedometerAvailable && !hasPermission) {
      try {
        setLoading(true);
        const permission = await Pedometer.requestPermissionsAsync();
        setHasPermission(permission.granted);

        if (permission.granted) {
          // Se a permissão foi concedida, iniciar o monitoramento
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
          const sub = Pedometer.watchStepCount((result) => {
            setSteps((prevSteps) => {
              if (prevSteps === null) return result.steps;
              return Math.max(prevSteps, result.steps);
            });
          });

          setSubscription(sub);
        }
      } catch (error) {
        console.error("Erro ao solicitar permissão:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [isPedometerAvailable, hasPermission]);

  // Função para formatar os passos
  const formattedSteps = useMemo(() => {
    if (steps === null) return "0";
    return steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : steps.toString();
  }, [steps]);

  // Calcular progresso de 0 a 100
  const progress = useMemo(() => {
    if (steps === null) return 0;
    return Math.min((steps / dailyGoal) * 100, 100);
  }, [steps, dailyGoal]);

  // Notificar mudanças nos passos
  React.useEffect(() => {
    if (onStepsUpdate) {
      onStepsUpdate(steps);
    }
  }, [steps, onStepsUpdate]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.light,
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}
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
          <Text style={[styles.title, { color: colors.text }]}>
            {t("home.stats.steps")}
          </Text>
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
              {t("home.stats.pedometerNotAvailable")}
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
              {t("home.stats.connect")}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.stepsContainer}>
            {/* Área principal com passos e meta */}
            <View style={styles.mainContent}>
              {/* Contagem de passos centralizada */}
              <View style={styles.stepsCountContainer}>
                <Text style={[styles.stepsCount, { color: colors.text }]}>
                  {formattedSteps}
                </Text>
              </View>

              {/* Meta */}
              <View style={styles.goalContainer}>
                <Text style={[styles.goalText, { color: colors.text + "60" }]}>
                  {t("home.stats.target")}: {dailyGoal.toLocaleString()}
                </Text>
              </View>

              {/* Barra de progresso */}
              <View
                style={[
                  styles.progressContainer,
                  { backgroundColor: colors.text + "10" },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress}%`, backgroundColor: "#4CAF50" },
                  ]}
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.5,
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
  progressContainer: {
    width: "100%",
    marginTop: 10,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    position: "absolute",
    left: 0,
    borderRadius: 3,
  },
});
