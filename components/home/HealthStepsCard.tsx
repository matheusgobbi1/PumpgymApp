import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Linking,
  Modal,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pedometer } from "expo-sensors";
import { useTranslation } from "react-i18next";
import * as IntentLauncher from "expo-intent-launcher";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, isToday, subDays, startOfDay, endOfDay } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import { KEYS } from "../../constants/keys";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
  Rect,
} from "react-native-svg";
import { MotiView } from "moti";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

// Verificar se é iOS
const isIOS = Platform.OS === "ios";

// Criar um objeto para armazenar os dados de passos globalmente (para compartilhar entre componentes)
export const stepsDataManager = {
  stepsData: {} as { [date: string]: number },

  // Método para obter os dados de passos
  getStepsData: () => {
    return { ...stepsDataManager.stepsData };
  },

  // Método para definir dados de passos para uma data específica
  setStepsDataForDate: (date: string, steps: number) => {
    stepsDataManager.stepsData[date] = steps;
  },
};

interface HealthStepsCardProps {
  onStepsUpdate?: (steps: number | null) => void;
}

export default function HealthStepsCard({
  onStepsUpdate,
}: HealthStepsCardProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();
  const { user } = useAuth();
  const lastCheckDateRef = useRef(new Date());
  const progressAnimationValue = useRef(new Animated.Value(0)).current;

  // Estado para armazenar os passos
  const [steps, setSteps] = useState<number | null>(null);
  const [isPedometerAvailable, setPedometerAvailable] = useState<
    boolean | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stepsHistory, setStepsHistory] = useState<{ [date: string]: number }>(
    {}
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(10000);
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [healthKitEnabled, setHealthKitEnabled] = useState(false);
  const [googleFitEnabled, setGoogleFitEnabled] = useState(false);

  // Função para gerar a chave de armazenamento para uma data específica
  const getStorageKeyForDate = useCallback(
    (date: string) => {
      if (!user) return null;
      return `${KEYS.STEPS_COUNT}_${user.uid}_${date}`;
    },
    [user]
  );

  // Função para verificar se é um novo dia
  const checkNewDay = useCallback(() => {
    const now = new Date();
    const lastCheck = lastCheckDateRef.current;

    if (!isToday(lastCheck)) {
      setSteps(0);
      lastCheckDateRef.current = now;
    }
  }, []);

  // Função para salvar os passos
  const saveSteps = useCallback(
    async (stepsCount: number) => {
      if (!storageKey) return;

      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(stepsCount));

        // Atualizar o histórico local
        const today = format(new Date(), "yyyy-MM-dd");
        setStepsHistory((prev) => ({
          ...prev,
          [today]: stepsCount,
        }));

        // Atualizar o gerenciador global de dados de passos
        stepsDataManager.setStepsDataForDate(today, stepsCount);
      } catch (error) {
        console.error("Erro ao salvar passos:", error);
      }
    },
    [storageKey]
  );

  // Carregar o histórico de passos dos últimos 7 dias
  const loadStepsHistory = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date();
      const stepsData: { [date: string]: number } = {};

      // Carregar dados dos últimos 7 dias (hoje + 6 dias anteriores)
      for (let i = 0; i < 7; i++) {
        // i = 0 é hoje, i = 1 é ontem, etc.
        const checkDate = subDays(today, i);
        const dateStr = format(checkDate, "yyyy-MM-dd");
        const storageKey = getStorageKeyForDate(dateStr);

        if (storageKey) {
          const data = await AsyncStorage.getItem(storageKey);
          if (data) {
            const stepsCount = JSON.parse(data);
            stepsData[dateStr] = stepsCount;

            // Atualizar o gerenciador global
            stepsDataManager.setStepsDataForDate(dateStr, stepsCount);
          }
        }
      }

      setStepsHistory(stepsData);
     
      return stepsData;
    } catch (error) {
      console.error("Erro ao carregar histórico de passos:", error);
      return {};
    }
  }, [user, getStorageKeyForDate]);

  // Função para abrir as configurações do aplicativo
  const openAppSettings = useCallback(async () => {
    try {
      if (Platform.OS === "ios") {
        await Linking.openURL("app-settings:");
      } else if (Platform.OS === "android") {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
          { data: "package:" + (Platform.constants as any).package }
        );
      }
    } catch (error) {
      console.error("Erro ao abrir configurações:", error);
    }
  }, []);

  // Função para solicitar permissão do pedômetro
  const requestPedometerPermission = async () => {
    try {
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
        const currentSteps = pastStepsResult?.steps || 0;
        setSteps(currentSteps);
        saveSteps(currentSteps);

        // Iniciar monitoramento contínuo
        const sub = Pedometer.watchStepCount((result) => {
          setSteps((prevSteps) => {
            if (prevSteps === null) return result.steps;
            const newSteps = Math.max(prevSteps, result.steps);
            saveSteps(newSteps);
            return newSteps;
          });
        });

        setSubscription(sub);
        return true;
      } else {
        setPermissionDenied(true);
        return false;
      }
    } catch (error) {
      console.error("Erro ao solicitar permissão do pedômetro:", error);
      return false;
    }
  };

  // Verificar disponibilidade do pedômetro e iniciar monitoramento
  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const checkPermissionAndAvailability = async () => {
      try {
        setLoading(true);
        setPermissionDenied(false);

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
        setPermissionDenied(!permission.granted);

        if (permission.granted) {
          // Carregar passos do armazenamento para hoje
          if (storageKey) {
            const savedSteps = await AsyncStorage.getItem(storageKey);
            if (savedSteps) {
              const stepsCount = JSON.parse(savedSteps);
              setSteps(stepsCount);

              // Atualizar o gerenciador global
              const today = format(new Date(), "yyyy-MM-dd");
              stepsDataManager.setStepsDataForDate(today, stepsCount);
            }
          }

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
          const currentSteps = pastStepsResult?.steps || 0;

          // Usar o valor maior entre o armazenado e o atual
          if (steps === null || currentSteps > (steps || 0)) {
            setSteps(currentSteps);
            saveSteps(currentSteps);
          }

          // Iniciar monitoramento contínuo
          const sub = Pedometer.watchStepCount((result) => {
            if (!isMounted) return;

            setSteps((prevSteps) => {
              // Se prevSteps for null, use o valor atual
              if (prevSteps === null) return result.steps;

              // Caso contrário, use o maior valor
              const newSteps = Math.max(prevSteps, result.steps);
              saveSteps(newSteps);
              return newSteps;
            });
          });

          setSubscription(sub);
          setIsInitialized(true);
          lastCheckDateRef.current = new Date();

          // Configurar verificação periódica para novo dia
          intervalId = setInterval(checkNewDay, 60000); // Verificar a cada minuto
        }
      } catch (error) {
        if (isMounted) {
          console.error("Erro ao verificar permissões:", error);
          setIsInitialized(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Carregar histórico de passos e verificar disponibilidade do pedômetro
    const initializeComponent = async () => {
      // Primeiro definimos a chave do usuário
      if (user) {
        const today = format(new Date(), "yyyy-MM-dd");
        const key = `${KEYS.STEPS_COUNT}_${user.uid}_${today}`;
        setStorageKey(key);
      }

      // Depois carregamos o histórico para garantir que os dados estejam disponíveis
      await loadStepsHistory();

      // Depois verificamos o pedômetro e permissões
      await checkPermissionAndAvailability();
    };

    initializeComponent();

    // Limpar inscrição quando o componente for desmontado
    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      if (subscription) subscription.remove();
    };
  }, [storageKey, saveSteps, loadStepsHistory, checkNewDay, steps, user]);

  const handleCardPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  // Função para lidar com o botão de conexão ao serviço de saúde
  const handleConnectHealth = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      setLoading(true);
      setPermissionDenied(false);

      // Se a permissão já foi negada anteriormente, abre as configurações
      if (permissionDenied) {
        if (Platform.OS === "ios") {
          await Linking.openURL("app-settings:");
        } else {
          await IntentLauncher.startActivityAsync(
            IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
            { data: "package:" + (Platform.constants as any).package }
          );
        }
        return;
      }

      // Se ainda não tentou pedir permissão, tenta primeiro
      await requestPedometerPermission();
    } catch (error) {
      console.error("Erro ao conectar:", error);
      setPermissionDenied(true);
    } finally {
      setLoading(false);
    }
  }, [permissionDenied]);

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

  // Animar o progresso ao mudar
  useEffect(() => {
    Animated.timing(progressAnimationValue, {
      toValue: progress,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnimationValue]);

  // Determinar a cor do progresso baseado no valor
  const getProgressColor = useCallback(() => {
    if (progress < 25) return "#FF4B4B";
    if (progress < 50) return "#FFB932";
    if (progress < 75) return "#2DCCFF";
    return "#4CAF50";
  }, [progress]);

  const iconColor = getProgressColor();
  const gradientColors = useMemo(() => {
    if (progress < 25) return ["#FF4B4B", "#FF7676"];
    if (progress < 50) return ["#FFB932", "#FFC95C"];
    if (progress < 75) return ["#2DCCFF", "#63DAFF"];
    return ["#4CAF50", "#8BC34A"];
  }, [progress]);

  // Função para gerar dados do gráfico semanal com dados reais
  const weeklyData = useMemo(() => {
    const days = [
      t("waterIntake.weekDays.sunday"),
      t("waterIntake.weekDays.monday"),
      t("waterIntake.weekDays.tuesday"),
      t("waterIntake.weekDays.wednesday"),
      t("waterIntake.weekDays.thursday"),
      t("waterIntake.weekDays.friday"),
      t("waterIntake.weekDays.saturday"),
    ];
    const today = new Date();

    // Criar array com 7 dias: os 6 dias anteriores + hoje
    return Array.from({ length: 7 }).map((_, index) => {
      // Calcular quantos dias precisamos voltar
      // 0 = hoje, 1 = ontem, 2 = anteontem, etc.
      const daysBack = 6 - index;
      const date = format(subDays(today, daysBack), "yyyy-MM-dd");
      const dateObj = subDays(today, daysBack);
      const dayOfWeek = dateObj.getDay(); // 0-6

      // Apenas incluir dias que tenham dados reais
      const hasData = stepsHistory[date] !== undefined;

      return {
        day: days[dayOfWeek], // Dia da semana correspondente
        value: hasData ? stepsHistory[date] / dailyGoal : 0,
        isToday: daysBack === 0, // É hoje quando daysBack = 0
        date: date, // Mantém a data para depuração
        hasData: hasData, // Indicador se tem dados reais
      };
    });
  }, [stepsHistory, dailyGoal, t]);

  // Notificar mudanças nos passos
  useEffect(() => {
    if (onStepsUpdate) {
      onStepsUpdate(steps);
    }
  }, [steps, onStepsUpdate]);

  // Atualiza texto de origem de dados com base na fonte
  const renderDataSourceText = () => {
    return t("home.stats.dataFromPedometer");
  };

  return (
    <>
      <MotiView
        style={[
          styles.container,
          {
            backgroundColor: colors.light,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 300 }}
      >
        <TouchableOpacity
          style={styles.touchableArea}
          onPress={handleCardPress}
          activeOpacity={0.7}
        >
          {/* Cabeçalho com passos atuais */}
          <View style={styles.header}>
            {/* Círculo de progresso à esquerda */}
            <View style={styles.progressCircle}>
              {/* Círculo de progresso com SVG */}
              <Svg width={42} height={42} viewBox="0 0 42 42">
                <Defs>
                  <LinearGradient
                    id="progressGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <Stop offset="0%" stopColor={gradientColors[0]} />
                    <Stop offset="100%" stopColor={gradientColors[1]} />
                  </LinearGradient>
                </Defs>
                {/* Círculo de fundo */}
                <Circle
                  cx="21"
                  cy="21"
                  r="17"
                  stroke={theme === "dark" ? "#ffffff10" : "#00000010"}
                  strokeWidth="3"
                  fill="none"
                />
                {/* Círculo de progresso */}
                <Circle
                  cx="21"
                  cy="21"
                  r="17"
                  stroke="url(#progressGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 17}`}
                  strokeDashoffset={2 * Math.PI * 17 * (1 - progress / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90, 21, 21)"
                />
              </Svg>
              {/* Ícone no centro */}
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="shoe-print"
                  size={20}
                  color={iconColor}
                />
              </View>

              {/* Cintilação para finalização */}
              {progress >= 100 && (
                <MotiView
                  style={styles.completionRing}
                  from={{ opacity: 0.3, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 1.3 }}
                  transition={{
                    type: "timing",
                    duration: 1500,
                    loop: true,
                  }}
                />
              )}
            </View>

            {/* Valores de texto à direita */}
            <View style={styles.valueContainer}>
              <Text style={[styles.todayValue, { color: colors.text }]}>
                {formattedSteps}
              </Text>
              <Text style={[styles.goalText, { color: colors.text + "80" }]}>
                {t("home.stats.goal")}: {dailyGoal.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Gráfico semanal ou estado de carregamento */}
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
            <View style={styles.connectContainer}>
              <TouchableOpacity
                style={[
                  styles.connectButton,
                  {
                    backgroundColor: permissionDenied
                      ? "#2196F320"
                      : "#4CAF5020",
                  },
                ]}
                onPress={handleConnectHealth}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    permissionDenied ? "refresh-outline" : "fitness-outline"
                  }
                  size={20}
                  color={permissionDenied ? "#2196F3" : "#4CAF50"}
                  style={styles.connectIcon}
                />
                <Text
                  style={[
                    styles.connectText,
                    { color: permissionDenied ? "#2196F3" : "#4CAF50" },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {permissionDenied
                    ? t("home.stats.tryAgain")
                    : t("home.stats.connect")}
                </Text>
              </TouchableOpacity>

              {permissionDenied && (
                <Text
                  style={[
                    styles.permissionDeniedText,
                    { color: colors.text + "80" },
                  ]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                >
                  {Platform.OS === "ios"
                    ? t("home.stats.settingsAccessIOS")
                    : t("home.stats.settingsAccessAndroid")}
                </Text>
              )}
            </View>
          ) : (
            /* Gráfico semanal */
            <View style={styles.weeklyChart}>
              {weeklyData.map((data, index) => (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    {data.hasData && (
                      <MotiView
                        style={[
                          styles.bar,
                          {
                            backgroundColor: data.isToday
                              ? getProgressColor()
                              : theme === "dark"
                              ? "#ffffff40"
                              : "#00000030",
                          },
                        ]}
                        from={{ height: 0 }}
                        animate={{
                          height: `${Math.max(data.value * 100, 5)}%`,
                        }}
                        transition={{
                          type: "timing",
                          duration: 500,
                          delay: index * 50,
                        }}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.dayLabel,
                      {
                        color: data.isToday
                          ? getProgressColor()
                          : colors.text + "60",
                        fontWeight: data.isToday ? "700" : "600",
                        opacity: data.hasData ? 1 : 0.5,
                      },
                    ]}
                  >
                    {data.day}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </MotiView>

      {/* Modal para detalhes de passos */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
          <MotiView
            style={[
              styles.modalContent,
              { backgroundColor: colors.light },
            ]}
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 300 }}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("home.stats.stepCount")}
            </Text>

            <View style={styles.stepsVisualization}>
              <Svg width={120} height={120} viewBox="0 0 120 120">
                <Defs>
                  <LinearGradient
                    id="stepsGradient"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <Stop offset="0%" stopColor={gradientColors[1]} />
                    <Stop offset="100%" stopColor={gradientColors[0]} />
                  </LinearGradient>
                </Defs>
                {/* Círculo de fundo */}
                <Circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill={theme === "dark" ? "#2A2A2A" : "#F5F5F5"}
                  stroke={theme === "dark" ? "#3A3A3A" : "#E0E0E0"}
                  strokeWidth="2"
                />
                {/* Preenchimento de progresso */}
                <Circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="url(#stepsGradient)"
                  clipPath="url(#stepsClip)"
                  opacity={0.9}
                />
                {/* Mascará para o preenchimento baseado no progresso */}
                <Defs>
                  <ClipPath id="stepsClip">
                    <Rect
                      x="10"
                      y={110 - progress * 0.9}
                      width="100"
                      height={progress * 0.9}
                    />
                  </ClipPath>
                </Defs>
              </Svg>

              <View style={styles.modalProgress}>
                <Text
                  style={[styles.modalValue, { color: getProgressColor() }]}
                >
                  {steps?.toLocaleString() || "0"}
                </Text>
                <Text style={[styles.modalGoal, { color: colors.text + "80" }]}>
                  / {dailyGoal.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.modalInfoContainer}>
              <Text style={[styles.modalInfoText, { color: colors.text }]}>
                {progress >= 100
                  ? t("home.stats.goalReached")
                  : t("home.stats.progressPercentage", {
                      progress: Math.round(progress),
                    })}
              </Text>

              <Text
                style={[styles.dataSourceText, { color: colors.text + "70" }]}
              >
                {renderDataSourceText()}
              </Text>

              <Text style={[styles.goalText, { color: colors.text + "80" }]}>
                {t("home.stats.goal")}: {dailyGoal.toLocaleString()}
              </Text>
            </View>

            <View style={styles.weekHistory}>
              {weeklyData
                .filter((day) => day.hasData)
                .map((data, index) => (
                  <View key={index} style={styles.historyItem}>
                    <Text style={[styles.historyDay, { color: colors.text }]}>
                      {data.day}
                      {data.isToday ? " (hoje)" : ""}
                    </Text>
                    <Text
                      style={[
                        styles.historyValue,
                        {
                          color: data.isToday
                            ? getProgressColor()
                            : colors.text + "80",
                        },
                      ]}
                    >
                      {Math.round(data.value * dailyGoal).toLocaleString()}{" "}
                      {t("home.stats.steps")}
                    </Text>
                  </View>
                ))}
              {weeklyData.filter((day) => day.hasData).length === 0 && (
                <Text
                  style={[styles.noDataText, { color: colors.text + "70" }]}
                >
                  {t("home.stats.noStepsData")}
                </Text>
              )}
            </View>
          </MotiView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: "hidden",
  },
  touchableArea: {
    flex: 1,
    padding: 16 ,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  valueContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  todayValue: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  goalText: {
    fontSize: 12,
    fontWeight: "500",
  },
  progressCircle: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  iconContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  completionRing: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  weeklyChart: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 8,
  },
  barWrapper: {
    height: "80%",
    width: 5,
    justifyContent: "flex-end",
    marginBottom: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderRadius: 3,
    minHeight: 2,
    bottom: 0,
    position: "absolute",
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notAvailableContainer: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notAvailableText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  connectContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 8,
  },
  connectButton: {
    padding: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  connectIcon: {
    marginRight: 6,
  },
  connectText: {
    fontWeight: "600",
    fontSize: 10,
  },
  permissionDeniedText: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width - 48,
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 24,
  },
  stepsVisualization: {
    alignItems: "center",
    marginBottom: 32,
  },
  modalProgress: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 16,
  },
  modalValue: {
    fontSize: 32,
    fontWeight: "700",
  },
  modalGoal: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 4,
  },
  modalInfoContainer: {
    width: "100%",
    alignItems: "center",
  },
  modalInfoText: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  weekHistory: {
    width: "100%",
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#00000010",
    paddingTop: 16,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  historyDay: {
    fontSize: 14,
    fontWeight: "600",
  },
  historyValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  dataSourceText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  noDataText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 16,
    fontStyle: "italic",
  },
});
