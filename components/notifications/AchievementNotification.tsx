import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import * as Haptics from "expo-haptics";

interface AchievementNotificationProps {
  visible: boolean;
  iconName: any; // Nome do ícone Ionicon
  iconColor: string; // Cor do ícone
  title: string;
  message: string;
  onDismiss: () => void;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  visible,
  iconName,
  iconColor,
  title,
  message,
  onDismiss,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const translateY = React.useRef(new Animated.Value(-150)).current; // Começa fora da tela

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.spring(translateY, {
        toValue: 0, // Animar para a posição 0 (topo)
        useNativeDriver: true,
        bounciness: 5, // Menos quique
        speed: 12,
      }).start();

      // Esconde automaticamente após um tempo
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000); // 5 segundos

      return () => clearTimeout(timer);
    } else {
      // Esconde a notificação se visible se tornar false externamente
      Animated.timing(translateY, {
        toValue: -150, // Sobe para fora da tela
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: -150, // Ajustar este valor se a altura do banner for diferente
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss(); // Chama a função de dismiss do contexto após a animação
    });
  };

  // Criação dos estilos dentro do componente para acessar 'colors'
  const styles = StyleSheet.create({
    container: {
      position: "absolute",
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      paddingVertical: 15,
      paddingHorizontal: 20,
      paddingTop: insets.top + 8,
      paddingBottom: 15,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: theme === "dark" ? 0.3 : 0.1,
      shadowRadius: 5,
      elevation: 5,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      zIndex: 1000,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    },
    iconContainer: {
      marginRight: 15,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: iconColor + "20",
    },
    textContainer: {
      flex: 1,
      marginRight: 10,
    },
    title: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 3,
    },
    message: {
      fontSize: 14,
      color: colors.secondary,
      lineHeight: 18,
    },
    closeButton: {
      padding: 5,
    },
  });

  return visible ? (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View
        style={[styles.iconContainer, { backgroundColor: iconColor + "20" }]}
      >
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
      <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
        <Ionicons name="close" size={24} color={colors.secondary} />
      </TouchableOpacity>
    </Animated.View>
  ) : null;
};

export default AchievementNotification;
