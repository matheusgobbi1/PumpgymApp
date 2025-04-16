import React, { useMemo } from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";

interface AchievementBadgeProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  size?: "small" | "medium" | "large";
  showShadow?: boolean;
  locked?: boolean;
  withPulse?: boolean;
  style?: ViewStyle;
  iconStyle?: TextStyle;
  new?: boolean;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  icon,
  color,
  size = "medium",
  showShadow = true,
  locked = false,
  withPulse = false,
  style,
  iconStyle,
  new: isNew = false,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Definir tamanhos com base no parâmetro size
  const dimensions = useMemo(() => {
    switch (size) {
      case "small":
        return {
          badge: 40,
          icon: 20,
          border: 3,
        };
      case "large":
        return {
          badge: 80,
          icon: 40,
          border: 5,
        };
      case "medium":
      default:
        return {
          badge: 60,
          icon: 30,
          border: 4,
        };
    }
  }, [size]);

  // Estilo com base no estado (locked/unlocked)
  const containerStyle = useMemo(() => {
    const lockedColor = theme === "dark" ? "#555555" : "#CCCCCC";

    return {
      width: dimensions.badge,
      height: dimensions.badge,
      borderRadius: dimensions.badge / 2,
      backgroundColor: locked ? lockedColor : color,
      borderWidth: 0,
      opacity: locked ? 0.6 : 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      ...(showShadow
        ? {
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }
        : {}),
      ...style,
    };
  }, [dimensions, locked, color, theme, showShadow, style]);

  // Animação de pulso para conquistas novas
  const pulseStyle = useMemo(() => {
    if (!withPulse && !isNew) return {};

    return {
      position: "absolute" as const,
      width: dimensions.badge + 10,
      height: dimensions.badge + 10,
      borderRadius: (dimensions.badge + 10) / 2,
      backgroundColor: color,
      opacity: 0.3,
    };
  }, [withPulse, isNew, dimensions.badge, color]);

  // Renderer para o indicador de "Novo"
  const renderNewIndicator = () => {
    if (!isNew) return null;

    return (
      <View style={styles.newIndicator}>
        <Text style={styles.newText}>New</Text>
      </View>
    );
  };

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      {(withPulse || isNew) && <View style={pulseStyle} />}
      <View style={containerStyle}>
        <MaterialCommunityIcons
          name={locked ? "lock" : icon}
          size={dimensions.icon}
          color={
            locked
              ? theme === "dark"
                ? "#999999"
                : "#666666"
              : iconStyle?.color || "#FFFFFF"
          }
          style={iconStyle}
        />
      </View>
      {renderNewIndicator()}
    </View>
  );
};

const styles = StyleSheet.create({
  newIndicator: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
  },
  newText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default React.memo(AchievementBadge);
