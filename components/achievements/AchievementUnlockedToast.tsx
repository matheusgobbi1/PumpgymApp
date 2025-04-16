import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import AchievementBadge from "./AchievementBadge";
import { useTranslation } from "react-i18next";
import { RARITY_COLORS } from "../../constants/achievementsDatabase";

const { width } = Dimensions.get("window");

interface AchievementUnlockedToastProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
  onDismiss: () => void;
  points: number;
}

const AchievementUnlockedToast: React.FC<AchievementUnlockedToastProps> = ({
  title,
  description,
  icon,
  color,
  onPress,
  onDismiss,
  points,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();

  // Animação para entrada e saída do toast
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animação de entrada
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Configurar timer para fechar automaticamente após 5 segundos
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Função para animar o desaparecimento do toast
  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme === "dark" ? "#333333" : "#FFFFFF",
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.achievementIconBackground,
              { backgroundColor: color + "20" },
            ]}
          >
            <AchievementBadge
              icon={icon as any}
              color={color}
              size="small"
              withPulse={true}
            />
          </View>
        </View>

        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("achievements.unlocked")}
            </Text>
            <View style={styles.pointsContainer}>
              <MaterialCommunityIcons
                name="star"
                size={12}
                color={RARITY_COLORS.legendary}
              />
              <Text style={[styles.pointsText, { color: colors.text }]}>
                +{points}
              </Text>
            </View>
          </View>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text
            style={[styles.description, { color: colors.text + "99" }]}
            numberOfLines={2}
          >
            {description}
          </Text>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <MaterialCommunityIcons
            name="close"
            size={16}
            color={colors.text + "80"}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60, // Ajustar de acordo com a altura do cabeçalho
    alignSelf: "center",
    width: width - 32,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  iconContainer: {
    marginRight: 16,
  },
  achievementIconBackground: {
    borderRadius: 25,
    padding: 5,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: RARITY_COLORS.legendary + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default AchievementUnlockedToast;
