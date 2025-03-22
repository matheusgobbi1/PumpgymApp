import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { MotiView } from "moti";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";
import { useNutrition } from "../../context/NutritionContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, isToday } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import { KEYS } from "../../constants/keys";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2; // Metade da largura da tela menos o padding

export default function WaterIntakeCard() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo } = useNutrition();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Estados para gerenciar a ingestão de água
  const [waterIntake, setWaterIntake] = useState(0);
  const [lastCheckDate, setLastCheckDate] = useState(new Date());

  // Meta diária de água (em mL) do contexto de nutrição ou valor padrão
  const dailyGoal = nutritionInfo.waterIntake || 2000;
  const cupSize = 100; // Tamanho do copo em mL

  // Função para salvar o consumo de água
  const saveWaterIntake = async (intake: number) => {
    if (!user) return;

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const storageKey = `${KEYS.WATER_INTAKE}_${user.uid}_${today}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(intake));
    } catch (error) {
      console.error("Erro ao salvar consumo de água:", error);
    }
  };

  // Função para carregar o consumo de água
  const loadWaterIntake = async () => {
    if (!user) return;

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const storageKey = `${KEYS.WATER_INTAKE}_${user.uid}_${today}`;
      const data = await AsyncStorage.getItem(storageKey);

      if (data) {
        const savedIntake = JSON.parse(data);
        setWaterIntake(savedIntake);
      } else {
        // Se não houver dados para hoje, resetar para zero
        setWaterIntake(0);
      }
    } catch (error) {
      console.error("Erro ao carregar consumo de água:", error);
    }
  };

  // Verificar se é um novo dia e resetar se necessário
  const checkNewDay = () => {
    const now = new Date();
    if (!isToday(lastCheckDate)) {
      setWaterIntake(0);
      setLastCheckDate(now);
      // Carregar dados do novo dia (provavelmente zero)
      loadWaterIntake();
    }
  };

  // Carregar dados ao iniciar o componente
  useEffect(() => {
    loadWaterIntake();
    setLastCheckDate(new Date());
  }, [user]);

  // Verificar se é um novo dia ao retornar do background
  const interval = setInterval(checkNewDay, 60000); // Verificar a cada minuto

  useEffect(() => {
    return () => clearInterval(interval);
  }, []);

  // Função para adicionar um copo de água
  const addWater = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newIntake = Math.min(waterIntake + cupSize, dailyGoal);
    setWaterIntake(newIntake);
    saveWaterIntake(newIntake);
  };

  // Função para remover um copo de água
  const removeWater = () => {
    if (waterIntake >= cupSize) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newIntake = waterIntake - cupSize;
      setWaterIntake(newIntake);
      saveWaterIntake(newIntake);
    }
  };

  // Calcular a porcentagem de progresso
  const getProgress = () => {
    const progress = (waterIntake / dailyGoal) * 100;
    return Math.min(progress, 100);
  };

  // Formatar o volume de água para exibição
  const formatWater = (volume: number) => {
    return `${(volume / 1000).toFixed(1)}L`;
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
        <Animated.View
          entering={FadeIn.duration(500)}
          style={styles.waterContainer}
        >
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
                  {formatWater(waterIntake)}
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
              <Text style={[styles.goalText, { color: colors.text + "80" }]}>
                {t("home.stats.target")}: {formatWater(dailyGoal)}
              </Text>
            </View>
          </View>

          {/* Progress bar na base do card */}
          <View style={styles.progressBarContainer}>
            <View
              style={[styles.progressBarBg, { backgroundColor: colors.border }]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: "#0096FF",
                    width: `${getProgress()}%`,
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>
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
