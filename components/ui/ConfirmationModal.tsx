import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmType?: "danger" | "success" | "primary";
  icon?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  confirmType = "primary",
  icon,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Definir cores com base no tipo de confirmação
  const getTypeColor = () => {
    switch (confirmType) {
      case "danger":
        return "#EF476F";
      case "success":
        return "#06D6A0";
      case "primary":
      default:
        return colors.primary;
    }
  };

  const typeColor = getTypeColor();

  // Função para lidar com a confirmação
  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  // Função para lidar com o cancelamento
  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent={true}
    >
      <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <TouchableWithoutFeedback onPress={onCancel}>
          <View style={styles.modalWrapper}>
            <TouchableWithoutFeedback>
              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "timing", duration: 250 }}
                style={[
                  styles.modalContainer,
                  { backgroundColor: theme === "dark" ? "#1E1E1E" : "#F8F9FA" },
                ]}
              >
                {/* Ícone */}
                {icon && (
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: typeColor + "15" },
                    ]}
                  >
                    <Ionicons name={icon as any} size={28} color={typeColor} />
                  </View>
                )}

                {/* Título */}
                <Text style={[styles.title, { color: colors.text }]}>
                  {title}
                </Text>

                {/* Mensagem */}
                <Text style={[styles.message, { color: colors.text + "CC" }]}>
                  {message}
                </Text>

                {/* Botões */}
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.cancelButton,
                      { borderColor: colors.border },
                    ]}
                    onPress={handleCancel}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.buttonText, { color: colors.text }]}>
                      {cancelText}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.confirmButton,
                      { backgroundColor: typeColor },
                    ]}
                    onPress={handleConfirm}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                      {confirmText}
                    </Text>
                  </TouchableOpacity>
                </View>
              </MotiView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  confirmButton: {
    // Cor de fundo definida dinamicamente
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
