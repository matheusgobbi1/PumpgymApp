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

  // Estados para gerenciar a ingestão de água
  const [waterIntake, setWaterIntake] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [waterHistory, setWaterHistory] = useState<{ [date: string]: number }>(
    {}
  );

  // Meta diária de água (em mL) do contexto de nutrição ou valor padrão
  const dailyGoal = nutritionInfo.waterIntake || 2000;
  const cupSize = 100; // Tamanho do copo em mL

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
      } catch (error) {
      }
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

  // Formatar o volume de água para exibição
  const formattedWater = useMemo(() => {
    return `${(waterIntake / 1000).toFixed(1)}`;
  }, [waterIntake]);

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
              { backgroundColor: "#0096FF" + "20" },
            ]}
          >
            <MaterialCommunityIcons name="water" size={18} color="#0096FF" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("common.nutrition.water")}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.waterContainer}>
          {/* Área principal com consumo e controles */}
          <View style={styles.mainContent}>
            {/* Layout lateral com botões */}
            <View style={styles.controlsRow}>
              {/* Botão para remover água */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.text + "10" },
                ]}
                onPress={removeWater}
                disabled={waterIntake === 0}
              >
                <Ionicons
                  name="remove"
                  size={16}
                  color={waterIntake === 0 ? colors.text + "30" : colors.text}
                />
              </TouchableOpacity>

              {/* Contagem de água centralizada */}
              <View style={styles.waterCountContainer}>
                <Text style={[styles.waterCount, { color: colors.text }]}>
                  {formattedWater}
                </Text>
              </View>

              {/* Botão para adicionar água */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: "#0096FF" + "20" },
                ]}
                onPress={addWater}
                disabled={waterIntake >= dailyGoal}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color={
                    waterIntake >= dailyGoal ? "#0096FF" + "50" : "#0096FF"
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Meta */}
            <View style={styles.goalContainer}>
              <Text style={[styles.goalText, { color: colors.text + "60" }]}>
                {t("home.stats.target")}: {(dailyGoal / 1000).toFixed(1)}L
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
                  { width: `${progress}%`, backgroundColor: "#0096FF" },
                ]}
              />
            </View>
          </View>
        </View>
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
  waterContainer: {
    flex: 1,
    justifyContent: "space-between",
    width: "100%",
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  waterCountContainer: {
    alignItems: "center",
  },
  waterCount: {
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
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 10,
  },
  progressFill: {
    height: "100%",
    position: "absolute",
    left: 0,
    borderRadius: 3,
  },
});
