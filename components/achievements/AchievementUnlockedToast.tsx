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

  // Buscar o nome e descrição traduzidos da conquista
  const achievementName = t(
    `achievements.database.achievements.${title}.name`,
    ""
  );
  const achievementDescription = t(
    `achievements.database.achievements.${title}.description`,
    description
  );

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
                +{points} {t("achievements.points")}
              </Text>
            </View>
          </View>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {achievementName}
          </Text>
          <Text
            style={[styles.description, { color: colors.text + "99" }]}
            numberOfLines={2}
          >
            {achievementDescription}
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
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
    paddingTop: 50, // Para posicionar abaixo da status bar
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  iconContainer: {
    marginRight: 12,
  },
  achievementIconBackground: {
    padding: 8,
    borderRadius: 20,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(251, 166, 28, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    fontWeight: "400",
    opacity: 0.8,
  },
  closeButton: {
    padding: 5,
    borderRadius: 12,
    marginLeft: 5,
  },
});

export default AchievementUnlockedToast;
