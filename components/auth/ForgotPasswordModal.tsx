import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { handlePasswordResetError } from "../../utils/errorHandler";
import Input from "../common/Input";
import Button from "../common/Button";
import * as Haptics from "expo-haptics";

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { sendPasswordResetEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!loading) {
      setEmail("");
      setError("");
      setSuccess(false);
      onClose();
    }
  };

  const handleModalPress = () => {
    Keyboard.dismiss();
  };

  const handleResetPassword = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!email) {
      setError("Por favor, insira seu email");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setLoading(true);
      setError("");
      await sendPasswordResetEmail(email);
      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(handlePasswordResetError(err));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <TouchableWithoutFeedback onPress={handleModalPress}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContainer,
                  { backgroundColor: theme === "dark" ? "#1c1c1e" : "#ffffff" },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: theme === "dark" ? "#ffffff" : "#000000" },
                    ]}
                  >
                    Recuperar senha
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleDismiss}
                  >
                    <Ionicons name="close" size={24} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                  <Text
                    style={[
                      styles.description,
                      { color: theme === "dark" ? "#cccccc" : "#666666" },
                    ]}
                  >
                    {success
                      ? "Email enviado! Verifique sua caixa de entrada para as instruções de redefinição de senha."
                      : "Informe seu email e enviaremos instruções para redefinir sua senha."}
                  </Text>

                  {error ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  {!success ? (
                    <>
                      <Input
                        label="Email"
                        placeholder="Seu email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />

                      <Button
                        title="Enviar email de recuperação"
                        onPress={handleResetPassword}
                        loading={loading}
                        style={styles.resetButton}
                        textStyle={{ color: colors.light }}
                      />
                    </>
                  ) : (
                    <Button
                      title="Voltar"
                      onPress={handleDismiss}
                      style={styles.backButton}
                      textStyle={{ color: colors.text }}
                    />
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  keyboardAvoidingView: {
    width: "100%",
    maxWidth: 400,
  },
  modalContainer: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  errorText: {
    color: "red",
  },
  resetButton: {
    marginTop: 10,
  },
  backButton: {
    marginTop: 20,
  },
});

export default ForgotPasswordModal;
