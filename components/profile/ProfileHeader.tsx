import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import { MotiView } from "moti";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useNutrition } from "../../context/NutritionContext";
import { useWorkoutContext } from "../../context/WorkoutContext";
import { useMeals } from "../../context/MealContext";

interface ProfileHeaderProps {
  onSettingsPress?: () => void;
  onEditProfilePress?: () => void;
}

export default function ProfileHeader({
  onSettingsPress,
  onEditProfilePress,
}: ProfileHeaderProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { nutritionInfo } = useNutrition();
  const { workouts } = useWorkoutContext();
  const { meals } = useMeals();

  // Estados para estatísticas do usuário
  const [totalMeals, setTotalMeals] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);

  // Controle de animação - executar apenas uma vez
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const animationExecuted = useRef(false);

  useEffect(() => {
    // Configurar a animação para ser executada apenas na primeira renderização
    if (!animationExecuted.current) {
      setShouldAnimate(true);
      animationExecuted.current = true;
    } else {
      setShouldAnimate(false);
    }
  }, []);

  // Calcular estatísticas do usuário
  useEffect(() => {
    // Calcular total de refeições registradas
    let mealCount = 0;
    Object.keys(meals).forEach((date) => {
      Object.keys(meals[date]).forEach((mealId) => {
        if (meals[date][mealId].length > 0) {
          mealCount++;
        }
      });
    });
    setTotalMeals(mealCount);

    // Calcular total de treinos realizados
    let workoutCount = 0;

    Object.keys(workouts).forEach((date) => {
      Object.keys(workouts[date]).forEach((workoutId) => {
        if (workouts[date][workoutId].length > 0) {
          workoutCount++;
        }
      });
    });

    setTotalWorkouts(workoutCount);
  }, [meals, workouts]);

  // Função para formatar o nome do usuário (primeira letra maiúscula)
  const formatName = (name: string | null | undefined) => {
    if (!name) return "Usuário";

    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  };

  // Função para determinar o status do plano nutricional
  const getNutritionStatus = () => {
    if (!nutritionInfo.calories) {
      return "Plano não configurado";
    }

    // Verificar se o usuário completou o onboarding
    if (
      nutritionInfo.gender &&
      nutritionInfo.height &&
      nutritionInfo.weight &&
      nutritionInfo.goal
    ) {
      return "Plano ativo";
    }

    return "Plano incompleto";
  };

  // Função para obter a primeira letra do nome para o avatar
  const getInitial = () => {
    const name = user?.displayName || user?.email?.split("@")[0] || "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <MotiView
      from={
        shouldAnimate
          ? { opacity: 0, translateY: -5 }
          : { opacity: 1, translateY: 0 }
      }
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 400 }}
      style={styles.container}
    >
      <View style={styles.headerContent}>
        <View style={styles.userInfoContainer}>
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: colors.primary },
            ]}
          >
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>{getInitial()}</Text>
            )}
          </View>

          <View style={styles.userTextInfo}>
            <Text
              style={[styles.userName, { color: colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {formatName(user?.displayName || user?.email?.split("@")[0])}
            </Text>
            <Text
              style={[styles.userEmail, { color: colors.text, opacity: 0.7 }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {user?.email || ""}
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="food-apple"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {totalMeals}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <FontAwesome5 name="dumbbell" size={14} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {totalWorkouts}
            </Text>
          </View>
        </View>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 12 : 8,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
    maxWidth: "70%",
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  userTextInfo: {
    flex: 1,
    flexShrink: 1,
    overflow: "hidden",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 6,
  },
});
