import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
  position?: "top" | "bottom";
}

interface ToastStyles {
  color: string;
  backgroundColor: string;
  borderColor: string;
  icon: string;
  iconColor: string;
}

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = "success",
  duration = 3000,
  onClose,
  position = "top",
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(
    new Animated.Value(position === "top" ? -100 : 100)
  ).current;

  const toastStyles: Record<ToastType, ToastStyles> = {
    success: {
      color: "#4CAF50",
      backgroundColor: "#E8F5E9",
      borderColor: "#4CAF50",
      icon: "checkmark-circle",
      iconColor: "#4CAF50",
    },
    error: {
      color: "#F44336",
      backgroundColor: "#FFEBEE",
      borderColor: "#F44336",
      icon: "close-circle",
      iconColor: "#F44336",
    },
    info: {
      color: "#2196F3",
      backgroundColor: "#E3F2FD",
      borderColor: "#2196F3",
      icon: "information-circle",
      iconColor: "#2196F3",
    },
    warning: {
      color: "#FF9800",
      backgroundColor: "#FFF3E0",
      borderColor: "#FF9800",
      icon: "warning",
      iconColor: "#FF9800",
    },
  };

  const { color, backgroundColor, borderColor, icon, iconColor } =
    toastStyles[type];

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (visible) {
      // Mostrar o toast
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Esconder o toast após a duração
      if (duration > 0) {
        timeoutId = setTimeout(() => {
          hideToast();
        }, duration);
      }
    } else {
      hideToast();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: position === "top" ? -100 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onClose) {
        onClose();
      }
    });
  };

  const positionStyle: ViewStyle = {
    position: "absolute",
    left: 16,
    right: 16,
    [position]:
      position === "top"
        ? Platform.OS === "ios"
          ? insets.top + 10
          : StatusBar.currentHeight
          ? StatusBar.currentHeight + 10
          : 40
        : insets.bottom + 10,
  };

  // Armazena o valor atual da animação em uma ref
  const fadeValue = useRef(0);

  // Adiciona um listener para obter o valor atual da animação
  useEffect(() => {
    const id = fadeAnim.addListener(({ value }) => {
      fadeValue.current = value;
    });
    return () => fadeAnim.removeListener(id);
  }, []);

  if (!visible && fadeValue.current === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
          borderWidth: 1,
        },
        positionStyle,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={icon as any} size={24} color={iconColor} />
        <Text style={[styles.message, { color }]}>{message}</Text>
      </View>
      <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={color} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 9999,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  message: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
    flexShrink: 1,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default Toast;
