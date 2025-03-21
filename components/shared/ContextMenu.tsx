import React, { useState, memo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

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
  inHeader?: boolean;
}

const ContextMenu = memo(
  ({ actions, isVisible = true, inHeader = false }: ContextMenuProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const [isExpanded, setIsExpanded] = useState(false);
    const buttonRef = useRef<any>(null);
    const [menuLayout, setMenuLayout] = useState({
      pageX: 0,
      pageY: 0,
      width: 0,
      height: 0,
    });

    // Função para lidar com o toque em uma ação
    const handleActionPress = useCallback((action: MenuAction) => {
      // Fornecer feedback tátil
      Haptics.impactAsync(
        action.type === "danger"
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Medium
      );

      // Fechar o menu antes de executar a ação
      setIsExpanded(false);

      // Executar a ação após um pequeno delay para garantir que o menu
      // seja fechado antes de abrir qualquer outro modal
      setTimeout(() => {
        action.onPress();
      }, 100);
    }, []);

    // Função para alternar a expansão do menu
    const toggleMenu = useCallback(() => {
      if (!isExpanded) {
        // Medir posição do botão antes de abrir o menu
        if (buttonRef.current) {
          buttonRef.current.measure(
            (
              _x: number,
              _y: number,
              width: number,
              height: number,
              pageX: number,
              pageY: number
            ) => {
              setMenuLayout({
                pageX,
                pageY,
                width,
                height,
              });

              // Após coletar posição, expandir o menu
              setIsExpanded(true);
            }
          );
        } else {
          // Se não conseguir medir, ainda assim abrir o menu
          setIsExpanded(true);
        }
      } else {
        // Fechar o menu
        setIsExpanded(false);
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [isExpanded]);

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

    // Aplicar estilos diferentes com base em onde o menu está sendo usado
    const containerStyle = inHeader
      ? [styles.containerInHeader]
      : [styles.container];

    return (
      <>
        <View style={containerStyle}>
          {/* Botão para abrir/fechar o menu */}
          <TouchableOpacity
            ref={buttonRef}
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
        </View>

        {/* Menu expandido em um Modal */}
        <Modal
          transparent
          visible={isExpanded}
          animationType="fade"
          onRequestClose={() => setIsExpanded(false)}
        >
          <BlurView
            intensity={theme === "dark" ? 50 : 80}
            tint={theme === "dark" ? "dark" : "light"}
            style={styles.blurContainer}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setIsExpanded(false)}
            >
              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "timing", duration: 150 }}
                style={[
                  styles.menuContent,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    shadowColor: colors.text,
                    position: "absolute",
                    top: menuLayout.pageY + menuLayout.height + 5,
                    // Para o menu no cabeçalho, posicionar à direita
                    ...(inHeader ? { right: 20 } : { right: 20 }),
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
            </TouchableOpacity>
          </BlurView>
        </Modal>
      </>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 20,
    right: 10,
    zIndex: 9999,
    alignItems: "flex-end",
  },
  containerInHeader: {
    position: "relative",
    zIndex: 9999,
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
  blurContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  menuContent: {
    position: "absolute",
    top: 80, // Posição fixa para o menu standalone
    right: 20,
    borderRadius: 12,
    overflow: "hidden",
    minWidth: 180,
    maxWidth: width / 1.5,
    borderWidth: 1,
    elevation: 999,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginHorizontal: 10,
  },
  menuContentHeader: {
    position: "absolute",
    top: 80, // Posição fixa para o menu no cabeçalho
    right: 20,
    borderRadius: 12,
    overflow: "hidden",
    minWidth: 180,
    maxWidth: width / 1.5,
    borderWidth: 1,
    elevation: 999,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginHorizontal: 10,
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
