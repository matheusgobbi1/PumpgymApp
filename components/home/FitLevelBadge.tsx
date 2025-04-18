import React, { useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { useAchievements } from "../../context/AchievementContext";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";

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
  const { stats, recentlyUnlocked } = useAchievements();
  const { t } = useTranslation();

  const { currentFitLevel, nextFitLevel, fitLevelProgress } = stats;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  // Verificar se existem conquistas não visualizadas
  const hasNewAchievements = recentlyUnlocked.some((item) => !item.viewed);

  // Efeito de animação quando existem novas conquistas
  useEffect(() => {
    if (hasNewAchievements) {
      // Iniciar a animação de pulso
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.8,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      // Resetar a animação quando não há novas conquistas
      Animated.parallel([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      pulseAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, [hasNewAchievements, pulseAnim, opacityAnim]);

  // Definir tamanhos com base no parâmetro size
  const dimensions = useMemo(() => {
    switch (size) {
      case "small":
        return {
          badge: 43,
          icon: 24,
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
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }],
        }}
      >
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

          {/* Efeito de brilho quando há novas conquistas */}
          {hasNewAchievements && (
            <Animated.View
              style={[
                styles.glowEffect,
                {
                  width: dimensions.badge + 10,
                  height: dimensions.badge + 10,
                  borderRadius: (dimensions.badge + 10) / 2,
                  opacity: opacityAnim,
                },
              ]}
            />
          )}

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
      </Animated.View>

      {showProgress && nextFitLevel && (
        <View style={styles.progressContainer}>
          <Text
            style={[
              styles.titleText,
              { color: colors.text, fontSize: dimensions.text * 0.9 },
            ]}
          >
            {t(`achievements.fitLevel.levels.${currentFitLevel.level}.title`)}
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
            {t("achievements.points")}
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
  glowEffect: {
    position: "absolute",
    backgroundColor: "#FFD700",
    top: -5,
    left: -5,
    shadowColor: "#FFD700",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  newAchievementIndicator: {
    position: "absolute",
    top: 0,
    right: -8,
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  newAchievementText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default React.memo(FitLevelBadge);
