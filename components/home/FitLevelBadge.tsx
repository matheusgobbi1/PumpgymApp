import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { useAchievements } from "../../context/AchievementContext";
import { LinearGradient } from "expo-linear-gradient";

interface FitLevelBadgeProps {
  onPress?: () => void;
  size?: "small" | "medium" | "large";
  showLevel?: boolean;
  showProgress?: boolean;
}

const FitLevelBadge: React.FC<FitLevelBadgeProps> = ({
  onPress,
  size = "medium",
  showLevel = true,
  showProgress = false,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { stats } = useAchievements();

  const { currentFitLevel, nextFitLevel, fitLevelProgress } = stats;

  // Definir tamanhos com base no parâmetro size
  const dimensions = useMemo(() => {
    switch (size) {
      case "small":
        return {
          badge: 40,
          icon: 20,
          border: 3,
          text: 11,
          progressHeight: 3,
        };
      case "large":
        return {
          badge: 80,
          icon: 40,
          border: 5,
          text: 18,
          progressHeight: 6,
        };
      case "medium":
      default:
        return {
          badge: 60,
          icon: 30,
          border: 4,
          text: 14,
          progressHeight: 4,
        };
    }
  }, [size]);

  // Cores para o gradiente do emblema
  const gradientColors = useMemo((): readonly [string, string, string] => {
    const baseColor = currentFitLevel.color;
    // Criar gradiente com base na cor principal do nível
    return [
      baseColor,
      baseColor, // Repetir para ter um gradiente mais suave
      theme === "dark" ? "#111" : "#fff",
    ] as const;
  }, [currentFitLevel.color, theme]);

  // Renderizar o componente
  const renderBadge = () => (
    <View style={styles.container}>
      <View>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.badgeContainer,
            {
              width: dimensions.badge,
              height: dimensions.badge,
              borderRadius: dimensions.badge / 2,
              borderWidth: dimensions.border,
              borderColor: theme === "dark" ? "#333" : "#fff",
            },
          ]}
        >
          <MaterialCommunityIcons
            name={currentFitLevel.icon}
            size={dimensions.icon}
            color="#fff"
            style={styles.icon}
          />
        </LinearGradient>

        {showLevel && (
          <View style={styles.levelBadge}>
            <Text
              style={[styles.levelText, { fontSize: dimensions.text * 0.8 }]}
            >
              {currentFitLevel.level}
            </Text>
          </View>
        )}
      </View>

      {showProgress && nextFitLevel && (
        <View style={styles.progressContainer}>
          <Text
            style={[
              styles.titleText,
              { color: colors.text, fontSize: dimensions.text * 0.9 },
            ]}
          >
            {currentFitLevel.title}
          </Text>

          <View
            style={[styles.progressBar, { height: dimensions.progressHeight }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${fitLevelProgress}%`,
                  backgroundColor: currentFitLevel.color,
                },
              ]}
            />
          </View>

          <Text
            style={[
              styles.pointsText,
              { color: colors.text, fontSize: dimensions.text * 0.7 },
            ]}
          >
            {stats.totalFitPoints}/
            {nextFitLevel
              ? nextFitLevel.pointsRequired
              : currentFitLevel.pointsRequired}{" "}
            pontos
          </Text>
        </View>
      )}
    </View>
  );

  // Se houver um manipulador de toque, torne o emblema tocável
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {renderBadge()}
      </TouchableOpacity>
    );
  }

  return renderBadge();
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  badgeContainer: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  levelBadge: {
    position: "absolute",
    bottom: 0,
    right: -5,
    backgroundColor: "#fff",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  levelText: {
    color: "#333",
    fontWeight: "bold",
  },
  progressContainer: {
    marginLeft: 12,
    flex: 1,
  },
  titleText: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  progressBar: {
    width: "100%",
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  pointsText: {
    marginTop: 2,
    opacity: 0.8,
  },
});

export default React.memo(FitLevelBadge);
