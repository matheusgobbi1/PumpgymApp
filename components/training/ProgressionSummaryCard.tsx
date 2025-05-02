import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { WorkoutTotals } from "../../context/WorkoutContext"; // Importar a interface
import { format } from "date-fns"; // Importar format de date-fns

interface ProgressionSummaryCardProps {
  previousWorkoutData: {
    totals: WorkoutTotals | null;
    date: string | null; // Espera-se 'yyyy-MM-dd'
  };
  workoutColor: string;
  theme: "light" | "dark";
}

// Função para formatar volume (ex: 12500 -> 12.5k)
const formatVolume = (volume: number): string => {
  if (!volume || volume < 1000) {
    return Math.round(volume).toString();
  }
  return `${(volume / 1000).toFixed(1)}k`;
};

// Função para formatar números gerais
const formatNumber = (value: number | undefined): string => {
  if (value === undefined || value === null) return "-";
  return Math.round(value).toString();
};

export default function ProgressionSummaryCard({
  previousWorkoutData,
  workoutColor,
  theme,
}: ProgressionSummaryCardProps) {
  const colors = Colors[theme];
  const { totals, date } = previousWorkoutData;

  // Formatar a data como DD/MM
  let formattedDate = "-";
  if (date) {
    try {
      // Adicionar a hora para evitar problemas de fuso horário que podem mudar o dia
      const dateObj = new Date(`${date}T12:00:00`);
      formattedDate = format(dateObj, "dd/MM");
    } catch (e) {
      console.error("Erro ao formatar data:", e);
      formattedDate = "Inválido"; // Indicar data inválida
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.metricContainer}>
        {/* 1. Exercícios */}
        <View style={styles.metricItem}>
          <MaterialCommunityIcons
            name="weight-lifter"
            size={18}
            color={colors.text}
          />
          <Text
            style={[styles.metricValue, { color: colors.text }]}
            numberOfLines={1}
          >
            {formatNumber(totals?.totalExercises)} Exs
          </Text>
        </View>

        {/* Divider */}
        <View
          style={[styles.divider, { backgroundColor: colors.border + "40" }]}
        />

        {/* 2. Calorias */}
        <View style={styles.metricItem}>
          <MaterialCommunityIcons name="fire" size={18} color={colors.text} />
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {formatNumber(totals?.caloriesBurned)}
            <Text style={[styles.metricUnit, { color: colors.text + "80" }]}>
              {" "}
              kcal
            </Text>
          </Text>
        </View>

        {/* Divider */}
        <View
          style={[styles.divider, { backgroundColor: colors.border + "40" }]}
        />

        {/* 3. Volume */}
        <View style={styles.metricItem}>
          <Ionicons name="barbell-outline" size={18} color={colors.text} />
          <Text style={[styles.metricValue, { color: workoutColor }]}>
            {totals ? formatVolume(totals.totalVolume) : "-"}
          </Text>
        </View>

        {/* Divider */}
        <View
          style={[styles.divider, { backgroundColor: colors.border + "40" }]}
        />

        {/* 4. Data */}
        <View style={styles.metricItem}>
          <Ionicons name="calendar-outline" size={18} color={colors.text} />
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {formattedDate}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  metricContainer: {
    flexDirection: "row",
    justifyContent: "space-around", // Distribuir igualmente
    alignItems: "center",
    marginHorizontal: 0,
    marginVertical: 0,
    paddingHorizontal: 0,
    borderRadius: 8,
  },
  metricItem: {
    flex: 1, // Ocupar espaço igualmente
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6, // Espaço entre ícone e texto
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: "400",
  },
  divider: {
    width: 1,
    height: 36,
    marginHorizontal: 4, // Reduzir margem para mais espaço
  },
});
