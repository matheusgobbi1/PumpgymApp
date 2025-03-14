import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";
import { MotiView } from "moti";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useWorkoutContext } from "../../context/WorkoutContext";

interface HomeHeaderProps {
  onProfilePress?: () => void;
}

export default function HomeHeader({ onProfilePress }: HomeHeaderProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { workouts } = useWorkoutContext();
  const [greeting, setGreeting] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // Definir a saudação com base na hora do dia
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Bom dia");
    } else if (hour >= 12 && hour < 18) {
      setGreeting("Boa tarde");
    } else {
      setGreeting("Boa noite");
    }

    // Formatar a data atual
    const today = new Date();
    const formattedDate = format(today, "EEEE, d 'de' MMMM");
    setCurrentDate(
      formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
    );

    // Calcular o streak de treinos
    calculateStreak();
  }, [workouts]);

  // Função para calcular o streak de treinos
  const calculateStreak = () => {
    if (!workouts) return;

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verificar se há treino hoje
    const todayFormatted = format(today, "yyyy-MM-dd");
    const hasTodayWorkout =
      workouts[todayFormatted] &&
      Object.keys(workouts[todayFormatted]).length > 0;

    // Se não houver treino hoje, verificar ontem
    if (!hasTodayWorkout) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayFormatted = format(yesterday, "yyyy-MM-dd");

      if (
        !(
          workouts[yesterdayFormatted] &&
          Object.keys(workouts[yesterdayFormatted]).length > 0
        )
      ) {
        setStreak(0);
        return;
      }
    }

    // Contar dias consecutivos com treinos
    let checkDate = new Date(today);
    if (!hasTodayWorkout) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    let keepCounting = true;
    while (keepCounting) {
      const dateFormatted = format(checkDate, "yyyy-MM-dd");
      if (
        workouts[dateFormatted] &&
        Object.keys(workouts[dateFormatted]).length > 0
      ) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        keepCounting = false;
      }
    }

    setStreak(currentStreak);
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: -10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 500 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.userInfo}>
          <Text style={[styles.greeting, { color: colors.text, opacity: 0.6 }]}>
            {greeting},
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.displayName?.split(" ")[0] || "Usuário"}
          </Text>
          <Text style={[styles.dateText, { color: colors.text, opacity: 0.7 }]}>
            {currentDate}
          </Text>
        </View>

        <View style={styles.rightContainer}>
          {streak > 0 && (
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", delay: 200 }}
              style={[
                styles.streakContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name="flame" size={16} color={colors.warning} />
              <Text style={[styles.streakText, { color: colors.text }]}>
                {streak} {streak === 1 ? "dia" : "dias"}
              </Text>
            </MotiView>
          )}

          {onProfilePress && (
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", delay: 300 }}
            >
              <TouchableOpacity
                onPress={onProfilePress}
                style={styles.profileButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={42}
                  color={colors.primary}
                  style={{ opacity: 0.9 }}
                />
              </TouchableOpacity>
            </MotiView>
          )}
        </View>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 20 : 10,
    paddingBottom: 20,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 15,
    fontWeight: "500",
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 4,
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  streakText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  profileButton: {
    padding: 4,
  },
});
