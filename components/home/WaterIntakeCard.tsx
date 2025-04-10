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
  Dimensions,
  Modal,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNutrition } from "../../context/NutritionContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, isToday, subDays } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import { KEYS } from "../../constants/keys";
import { useTranslation } from "react-i18next";
import { ptBR } from "date-fns/locale";
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
const CARD_WIDTH = (width - 48) / 2; // Metade da largura da tela menos o padding

// Criar um objeto para armazenar os dados de água globalmente (para compartilhar entre componentes)
export const waterDataManager = {
  waterData: {} as { [date: string]: number },

  // Método para obter os dados de água
  getWaterData: () => {
    return { ...waterDataManager.waterData };
  },

  // Método para definir dados de água para uma data específica
  setWaterDataForDate: (date: string, amount: number) => {
    waterDataManager.waterData[date] = amount;
  },
};

export default function WaterIntakeCard() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo } = useNutrition();
  const { user } = useAuth();
  const { t } = useTranslation();
  const lastCheckDateRef = useRef(new Date());
  const progressAnimationValue = useRef(new Animated.Value(0)).current;

  // Estados para gerenciar a ingestão de água
  const [waterIntake, setWaterIntake] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [waterHistory, setWaterHistory] = useState<{ [date: string]: number }>(
    {}
  );

  // Meta diária de água (em mL) do contexto de nutrição ou valor padrão
  const dailyGoal = nutritionInfo.waterIntake || 2000;
  const cupSize = 250; // Tamanho do copo em mL

  // Chave de armazenamento para o usuário atual
  const storageKey = useMemo(() => {
    if (!user) return null;
    const today = format(new Date(), "yyyy-MM-dd");
    return `${KEYS.WATER_INTAKE}_${user.uid}_${today}`;
  }, [user]);

  // Função para gerar a chave de armazenamento para uma data específica
  const getStorageKeyForDate = useCallback(
    (date: string) => {
      if (!user) return null;
      return `${KEYS.WATER_INTAKE}_${user.uid}_${date}`;
    },
    [user]
  );

  // Função para verificar se é um novo dia
  const checkNewDay = useCallback(() => {
    const now = new Date();
    const lastCheck = lastCheckDateRef.current;

    if (!isToday(lastCheck)) {
      setWaterIntake(0);
      lastCheckDateRef.current = now;
    }
  }, []);

  // Função para salvar o consumo de água
  const saveWaterIntake = useCallback(
    async (intake: number) => {
      if (!storageKey) return;

      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(intake));

        // Atualizar o histórico local
        const today = format(new Date(), "yyyy-MM-dd");
        setWaterHistory((prev) => ({
          ...prev,
          [today]: intake,
        }));

        // Atualizar o gerenciador global de dados de água
        waterDataManager.setWaterDataForDate(today, intake);
      } catch (error) {}
    },
    [storageKey]
  );

  // Carregar o histórico de consumo de água dos últimos 14 dias
  const loadWaterHistory = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date();
      const waterData: { [date: string]: number } = {};

      // Carregar dados dos últimos 14 dias
      for (let i = 0; i < 14; i++) {
        const checkDate = subDays(today, i);
        const dateStr = format(checkDate, "yyyy-MM-dd");
        const storageKey = getStorageKeyForDate(dateStr);

        if (storageKey) {
          const data = await AsyncStorage.getItem(storageKey);
          if (data) {
            const intake = JSON.parse(data);
            waterData[dateStr] = intake;

            // Atualizar o gerenciador global
            waterDataManager.setWaterDataForDate(dateStr, intake);
          }
        }
      }

      setWaterHistory(waterData);
      return waterData;
    } catch (error) {
      return {};
    }
  }, [user, getStorageKeyForDate]);

  // Função para carregar o consumo de água - usando apenas um useEffect
  useEffect(() => {
    const loadWaterIntake = async () => {
      if (!storageKey) return;

      try {
        const data = await AsyncStorage.getItem(storageKey);

        if (data) {
          const savedIntake = JSON.parse(data);
          setWaterIntake(savedIntake);

          // Atualizar o gerenciador global
          const today = format(new Date(), "yyyy-MM-dd");
          waterDataManager.setWaterDataForDate(today, savedIntake);
        } else {
          setWaterIntake(0);
        }

        setIsInitialized(true);
        lastCheckDateRef.current = new Date();

        // Configurar verificação periódica para novo dia
        const intervalId = setInterval(checkNewDay, 60000); // Verificar a cada minuto

        return () => clearInterval(intervalId);
      } catch (error) {
        setIsInitialized(true);
      }
    };

    loadWaterIntake();

    // Carregar histórico de água
    loadWaterHistory();
  }, [storageKey, checkNewDay, loadWaterHistory]);

  // Função para adicionar um copo de água
  const addWater = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newIntake = Math.min(waterIntake + cupSize, dailyGoal);
    setWaterIntake(newIntake);
    saveWaterIntake(newIntake);
  }, [waterIntake, dailyGoal, cupSize, saveWaterIntake]);

  // Função para remover um copo de água
  const removeWater = useCallback(() => {
    if (waterIntake >= cupSize) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newIntake = waterIntake - cupSize;
      setWaterIntake(newIntake);
      saveWaterIntake(newIntake);
    }
  }, [waterIntake, cupSize, saveWaterIntake]);

  // Calcular a porcentagem de progresso
  const progress = useMemo(() => {
    return Math.min((waterIntake / dailyGoal) * 100, 100);
  }, [waterIntake, dailyGoal]);

  // Animar o progresso ao mudar
  useEffect(() => {
    Animated.timing(progressAnimationValue, {
      toValue: progress,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnimationValue]);

  // Formatar o volume de água para exibição
  const formattedWater = useMemo(() => {
    return `${(waterIntake / 1000).toFixed(1)}`;
  }, [waterIntake]);

  // Função para gerar dados do gráfico semanal
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
      const daysBack = 6 - index;
      const date = format(subDays(today, daysBack), "yyyy-MM-dd");
      const dateObj = subDays(today, daysBack);
      const dayOfWeek = dateObj.getDay(); // 0-6

      return {
        day: days[dayOfWeek], // Dia da semana correspondente
        value: (waterHistory[date] || 0) / dailyGoal,
        isToday: daysBack === 0, // É hoje quando daysBack = 0
      };
    });
  }, [waterHistory, dailyGoal, t]);

  const [modalVisible, setModalVisible] = useState(false);

  const handleCardPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleAddWater = useCallback(() => {
    addWater();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [addWater]);

  const handleRemoveWater = useCallback(() => {
    removeWater();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [removeWater]);

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

  return (
    <>
      <MotiView
        style={[
          styles.container,
          {
            backgroundColor: theme === "dark" ? "#1A1A1A" : colors.light,
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
          {/* Cabeçalho com consumo atual */}
          <View style={styles.header}>
            {/* Círculo de progresso agora está à esquerda */}
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
              {/* Ícone de água no centro */}
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="water"
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

            {/* Valores de texto agora estão à direita */}
            <View style={styles.valueContainer}>
              <Text style={[styles.todayValue, { color: colors.text }]}>
                {formattedWater}L
              </Text>
              <Text style={[styles.goalText, { color: colors.text + "80" }]}>
                {t("waterIntake.goal")}: {(dailyGoal / 1000).toFixed(1)}L
              </Text>
            </View>
          </View>

          {/* Gráfico semanal */}
          <View style={styles.weeklyChart}>
            {weeklyData.map((data, index) => (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
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
                </View>
                <Text
                  style={[
                    styles.dayLabel,
                    {
                      color: data.isToday
                        ? getProgressColor()
                        : colors.text + "60",
                    },
                  ]}
                >
                  {data.day}
                </Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </MotiView>

      {/* Modal para adicionar/remover água */}
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
              { backgroundColor: theme === "dark" ? "#1A1A1A" : colors.light },
            ]}
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 300 }}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("waterIntake.title")}
            </Text>

            <View style={styles.waterVisualization}>
              <Svg width={120} height={120} viewBox="0 0 120 120">
                <Defs>
                  <LinearGradient
                    id="waterGradient"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <Stop offset="0%" stopColor={gradientColors[1]} />
                    <Stop offset="100%" stopColor={gradientColors[0]} />
                  </LinearGradient>
                </Defs>
                {/* Garrafa de água */}
                <Circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill={theme === "dark" ? "#2A2A2A" : "#F5F5F5"}
                  stroke={theme === "dark" ? "#3A3A3A" : "#E0E0E0"}
                  strokeWidth="2"
                />
                {/* Água na garrafa - altura baseada no progresso */}
                <Circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="url(#waterGradient)"
                  clipPath="url(#waterClip)"
                  opacity={0.9}
                />
                {/* Mascará para a água - corta baseado no progresso */}
                <Defs>
                  <ClipPath id="waterClip">
                    <Rect
                      x="15"
                      y={110 - progress * 0.9}
                      width="90"
                      height={progress * 0.9}
                    />
                  </ClipPath>
                </Defs>
              </Svg>

              <View style={styles.modalProgress}>
                <Text
                  style={[styles.modalValue, { color: getProgressColor() }]}
                >
                  {formattedWater}L
                </Text>
                <Text style={[styles.modalGoal, { color: colors.text + "80" }]}>
                  / {(dailyGoal / 1000).toFixed(1)}L
                </Text>
              </View>
            </View>

            <View style={styles.modalControls}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.text + "10" },
                ]}
                onPress={handleRemoveWater}
                disabled={waterIntake === 0}
              >
                <MaterialCommunityIcons
                  name="minus"
                  size={22}
                  color={colors.text}
                />
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  250ml
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: getProgressColor() + "20" },
                ]}
                onPress={handleAddWater}
                disabled={waterIntake >= dailyGoal}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={22}
                  color={getProgressColor()}
                />
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: getProgressColor() },
                  ]}
                >
                  250ml
                </Text>
              </TouchableOpacity>
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
    padding: 16,
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
  waterVisualization: {
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
  modalControls: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
