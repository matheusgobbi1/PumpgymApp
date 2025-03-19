import React, { useState, memo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

// Interface para definir uma ação do menu
export interface MenuAction {
  id: string;
  label: string;
  icon: string;
  type?: "default" | "danger" | "warning";
  onPress: () => void;
}

interface ContextMenuProps {
  actions: MenuAction[];
  isVisible?: boolean;
}

const ContextMenu = memo(({ actions, isVisible = true }: ContextMenuProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [isExpanded, setIsExpanded] = useState(false);

  // Função para lidar com o toque em uma ação
  const handleActionPress = useCallback((action: MenuAction) => {
    // Fornecer feedback tátil
    Haptics.impactAsync(
      action.type === "danger"
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Medium
    );

    // Executar a ação
    action.onPress();

    // Fechar o menu após a ação
    setIsExpanded(false);
  }, []);

  // Função para alternar a expansão do menu
  const toggleMenu = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded((prev) => !prev);
  }, []);

  // Se o menu não estiver visível, não renderizar nada
  if (!isVisible) return null;

  // Obter a cor com base no tipo da ação
  const getActionColor = (type?: "default" | "danger" | "warning") => {
    switch (type) {
      case "danger":
        return colors.danger;
      case "warning":
        return colors.warning;
      default:
        return colors.text;
    }
  };

  return (
    <View style={styles.container}>
      {/* Botão para abrir/fechar o menu */}
      <TouchableOpacity
        style={[
          styles.menuButton,
          {
            backgroundColor: isExpanded ? colors.primary : colors.card,
            shadowColor: colors.text,
            borderColor: isExpanded ? colors.primary : colors.border,
          },
        ]}
        onPress={toggleMenu}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isExpanded ? "close" : "ellipsis-horizontal"}
          size={22}
          color={isExpanded ? "#fff" : colors.text}
        />
      </TouchableOpacity>

      {/* Menu expandido */}
      {isExpanded && (
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -10 }}
          transition={{ type: "timing", duration: 200 }}
          style={[
            styles.menuContent,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.text,
            },
          ]}
        >
          {actions.map((action, index) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.menuItem,
                index < actions.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border + "40",
                },
              ]}
              onPress={() => handleActionPress(action)}
            >
              <Ionicons
                name={action.icon as any}
                size={20}
                color={getActionColor(action.type)}
                style={styles.menuItemIcon}
              />
              <Text
                style={[
                  styles.menuItemText,
                  { color: getActionColor(action.type) },
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </MotiView>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 20,
    right: 10,
    zIndex: 1000,
    alignItems: "flex-end",
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  menuContent: {
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
    minWidth: 180,
    maxWidth: width / 1.5,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemIcon: {
    marginRight: 10,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default ContextMenu;
