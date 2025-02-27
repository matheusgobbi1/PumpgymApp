import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import Colors from "../constants/Colors";
import { useColorScheme } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "gradient";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: "selection" | "impact" | "notification" | "none";
  hapticIntensity?: "light" | "medium" | "heavy";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  gradientColors?: string[];
  rounded?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
  hapticFeedback = "impact",
  hapticIntensity = "medium",
  icon,
  iconPosition = "left",
  gradientColors,
  rounded = true,
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const getBackgroundColor = () => {
    if (disabled) return colorScheme === "dark" ? "#333" : "#e0e0e0";

    switch (variant) {
      case "primary":
        return colors.primary;
      case "secondary":
        return colors.secondary;
      case "outline":
      case "gradient":
        return "transparent";
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colorScheme === "dark" ? "#666" : "#999";

    switch (variant) {
      case "primary":
      case "secondary":
      case "gradient":
        return "#fff";
      case "outline":
        return colors.primary;
      default:
        return "#fff";
    }
  };

  const getBorderColor = () => {
    if (variant === "outline") {
      return disabled
        ? colorScheme === "dark"
          ? "#333"
          : "#e0e0e0"
        : colors.primary;
    }
    return "transparent";
  };

  const getPadding = () => {
    switch (size) {
      case "small":
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case "medium":
        return { paddingVertical: 12, paddingHorizontal: 24 };
      case "large":
        return { paddingVertical: 16, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };

  const getHeight = () => {
    switch (size) {
      case "small":
        return 40;
      case "medium":
        return 56;
      case "large":
        return 64;
      default:
        return 56;
    }
  };

  const handlePress = () => {
    if (disabled || loading) return;

    // Aplicar feedback tátil
    if (hapticFeedback !== "none") {
      switch (hapticFeedback) {
        case "selection":
          Haptics.selectionAsync();
          break;
        case "impact":
          switch (hapticIntensity) {
            case "light":
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              break;
            case "medium":
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              break;
            case "heavy":
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              break;
          }
          break;
        case "notification":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
      }
    }

    onPress();
  };

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentContainer}>
          {icon && iconPosition === "left" && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === "right" && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </>
  );

  if (variant === "gradient") {
    const defaultGradientColors = ["#4ecdc4", "#2ab7ca"];
    return (
      <TouchableOpacity
        style={[
          styles.button,
          {
            height: getHeight(),
            borderRadius: rounded ? getHeight() / 2 : 12,
            opacity: disabled ? 0.7 : 1,
            borderColor: getBorderColor(),
            ...getPadding(),
          },
          style,
        ]}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={gradientColors || defaultGradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradientContainer,
            { borderRadius: rounded ? getHeight() / 2 : 12 },
          ]}
        >
          {buttonContent}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          height: getHeight(),
          borderRadius: rounded ? getHeight() / 2 : 12,
          opacity: disabled ? 0.7 : 1,
          ...getPadding(),
        },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {buttonContent}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flexDirection: "row",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  gradientContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
