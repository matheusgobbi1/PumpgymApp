import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";

const { width } = Dimensions.get("window");

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  color?: string;
  onDismiss?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  duration = 5000,
  color,
  onDismiss,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [visible, setVisible] = useState(true);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateXAnim = React.useRef(new Animated.Value(-100)).current;

  // Determinar ícone e cor com base no tipo
  const getIconAndColor = () => {
    if (color) {
      // Se uma cor personalizada foi fornecida
      return {
        icon: "trophy",
        bgColor: theme === "dark" ? `${color}` : `${color}`,
        textColor: "#FFFFFF",
        iconColor: "#FFFFFF",
        shadowColor: color,
      };
    }

    switch (type) {
      case "success":
        return {
          icon: "trophy",
          bgColor: theme === "dark" ? "#1E8E3E" : "#34A853",
          textColor: "#FFFFFF",
          iconColor: "#FFFFFF",
          shadowColor: "#34A853",
        };
      case "error":
        return {
          icon: "alert-circle",
          bgColor: theme === "dark" ? "#D32F2F" : "#EA4335",
          textColor: "#FFFFFF",
          iconColor: "#FFFFFF",
          shadowColor: "#EA4335",
        };
      case "warning":
        return {
          icon: "warning",
          bgColor: theme === "dark" ? "#F57C00" : "#FBBC05",
          textColor: theme === "dark" ? "#FFFFFF" : "#000000",
          iconColor: theme === "dark" ? "#FFFFFF" : "#000000",
          shadowColor: "#FBBC05",
        };
      case "info":
      default:
        return {
          icon: "information-circle",
          bgColor: theme === "dark" ? "#1A73E8" : "#4285F4",
          textColor: "#FFFFFF",
          iconColor: "#FFFFFF",
          shadowColor: "#4285F4",
        };
    }
  };

  const { icon, bgColor, textColor, iconColor, shadowColor } =
    getIconAndColor();

  // Animar a entrada e saída do toast
  useEffect(() => {
    if (visible) {
      // Animar a entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(translateXAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]).start();

      // Configurar o timer para esconder o toast após a duração
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Animar a saída
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
        Animated.timing(translateXAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ]).start(() => {
        if (onDismiss) onDismiss();
      });
    }
  }, [visible, duration, fadeAnim, translateXAnim, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
  };

  // Se não estiver visível, não renderize nada
  if (!message) return null;

  // Formatar a mensagem para enfatizar a primeira linha
  let lines = message.split("\n");
  let title = "";
  let details = "";

  if (lines.length > 1) {
    title = lines[0];
    details = lines.slice(1).join("\n");
  } else {
    title = message;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          opacity: fadeAnim,
          transform: [{ translateX: translateXAnim }],
          shadowColor: shadowColor,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={icon as any}
          size={24}
          color={iconColor}
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.titleText, { color: textColor }]}>{title}</Text>
          {details && (
            <Text style={[styles.message, { color: textColor }]}>
              {details}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
        <Ionicons name="close" size={16} color={iconColor} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: "hidden",
    padding: 16,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    paddingRight: 4,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 2,
  },
});

export default Toast;
