import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  Animated,
  Easing,
} from "react-native";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";

interface ButtonNewProps {
  title: string;
  onPress: () => void;
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "gradient"
    | "danger"
    | "success"
    | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: "selection" | "impact" | "notification" | "none";
  hapticIntensity?: "light" | "medium" | "heavy";
  iconName?: string;
  iconType?: "ionicons" | "fontawesome5";
  iconPosition?: "left" | "right";
  iconSize?: number;
  gradientColors?: string[];
  rounded?: boolean;
  fullWidth?: boolean;
  animated?: boolean;
  uppercase?: boolean;
  elevation?: number;
}

export default function ButtonNew({
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
  iconName,
  iconType = "ionicons",
  iconPosition = "left",
  iconSize,
  gradientColors,
  rounded = true,
  fullWidth = true,
  animated = true,
  uppercase = false,
  elevation = 0,
}: ButtonNewProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Estado para animação de pressionar
  const [pressAnim] = useState(new Animated.Value(1));

  // Determinar o tamanho do ícone com base no tamanho do botão
  const getIconSize = () => {
    if (iconSize) return iconSize;

    switch (size) {
      case "small":
        return 16;
      case "medium":
        return 20;
      case "large":
        return 24;
      default:
        return 20;
    }
  };

  const getBackgroundColor = () => {
    if (disabled) return theme === "dark" ? "#333" : "#e0e0e0";

    switch (variant) {
      case "primary":
        return colors.primary;
      case "secondary":
        return colors.secondary;
      case "danger":
        return "#EF476F";
      case "success":
        return "#06D6A0";
      case "outline":
      case "gradient":
      case "ghost":
        return "transparent";
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme === "dark" ? "#666" : "#999";

    switch (variant) {
      case "primary":
      case "secondary":
      case "gradient":
      case "danger":
      case "success":
        return "#fff";
      case "outline":
        return colors.primary;
      case "ghost":
        return colors.text;
      default:
        return "#fff";
    }
  };

  const getBorderColor = () => {
    if (disabled) {
      return theme === "dark" ? "#333" : "#e0e0e0";
    }

    switch (variant) {
      case "outline":
        return colors.primary;
      case "ghost":
        return "transparent";
      default:
        return "transparent";
    }
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
        return 36;
      case "medium":
        return 48;
      case "large":
        return 56;
      default:
        return 48;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case "small":
        return 12;
      case "medium":
        return 14;
      case "large":
        return 16;
      default:
        return 14;
    }
  };

  const handlePressIn = () => {
    if (disabled || loading) return;

    if (animated) {
      Animated.timing(pressAnim, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    if (animated) {
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
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

  // Renderizar o ícone
  const renderIcon = () => {
    if (!iconName) return null;

    const IconComponent = iconType === "fontawesome5" ? FontAwesome5 : Ionicons;

    return (
      <IconComponent
        name={iconName as any}
        size={getIconSize()}
        color={getTextColor()}
        style={iconPosition === "left" ? styles.iconLeft : styles.iconRight}
      />
    );
  };

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentContainer}>
          {iconName && iconPosition === "left" && renderIcon()}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: getFontSize(),
                textTransform: uppercase ? "uppercase" : "none",
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {iconName && iconPosition === "right" && renderIcon()}
        </View>
      )}
    </>
  );

  // Estilo base do botão
  const baseButtonStyle = [
    styles.button,
    {
      backgroundColor: getBackgroundColor(),
      borderColor: getBorderColor(),
      borderWidth: variant === "outline" ? 1 : 0,
      height: getHeight(),
      borderRadius: rounded ? getHeight() / 2 : 8,
      opacity: disabled ? 0.7 : 1,
      width: fullWidth ? ("100%" as any) : ("auto" as any),
      ...getPadding(),
      elevation: elevation,
      shadowOpacity: elevation > 0 ? 0.2 : 0,
      shadowRadius: elevation,
      shadowOffset: { width: 0, height: elevation > 0 ? 2 : 0 },
    },
    style,
  ];

  // Estilo de animação
  const animatedStyle = {
    transform: [{ scale: pressAnim }],
  };

  if (variant === "gradient") {
    // Definir cores padrão para o gradiente
    const defaultGradientColors: [string, string] = [
      colors.primary,
      colors.secondary,
    ];
    // Garantir que gradientColors seja do tipo correto ou usar o padrão
    const finalGradientColors =
      gradientColors && gradientColors.length >= 2
        ? ([gradientColors[0], gradientColors[1]] as [string, string])
        : defaultGradientColors;

    return (
      <Animated.View style={animated ? animatedStyle : undefined}>
        <TouchableOpacity
          style={baseButtonStyle}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={finalGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.gradientContainer,
              { borderRadius: rounded ? getHeight() / 2 : 8 },
            ]}
          >
            {buttonContent}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animated ? animatedStyle : undefined}>
      <TouchableOpacity
        style={baseButtonStyle}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {buttonContent}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
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
