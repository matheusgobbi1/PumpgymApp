import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Keyboard,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MotiView, MotiText, AnimatePresence } from "moti";
import * as Haptics from "expo-haptics";
import {
  validateRegistration,
  validateRegistrationStep1,
  validateRegistrationStep2,
  calculatePasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthText,
} from "../../utils/validations";
import { ErrorMessage } from "../../components/common/ErrorMessage";

const { width } = Dimensions.get("window");

export default function CompleteRegistrationScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { completeAnonymousRegistration, isAnonymous } = useAuth();

  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});

  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

  useEffect(() => {
    if (!isAnonymous) {
      // Adicionar um pequeno atraso para garantir que todos os estados sejam atualizados
      const timer = setTimeout(() => {
        router.replace("/(tabs)");
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isAnonymous, router]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeField, setActiveField] = useState("");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formStep, setFormStep] = useState(1);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordStrength(calculatePasswordStrength(text));
  };

  const handleCompleteRegistration = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Validar a segunda etapa (senha e confirmação)
    const validationResult = validateRegistrationStep2(
      password,
      confirmPassword
    );
    if (!validationResult.isValid) {
      setError(validationResult.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Validar o formulário completo para garantir que todos os dados estão corretos
    const fullValidationResult = validateRegistration(
      name,
      email,
      password,
      confirmPassword
    );
    if (!fullValidationResult.isValid) {
      setError(fullValidationResult.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setLoading(true);
      setError("");
      await completeAnonymousRegistration(name, email, password);
    } catch (err: any) {
      console.error("Erro ao completar registro:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Este email já está em uso. Por favor, use outro email.");
      } else if (err.code === "auth/invalid-email") {
        setError("Email inválido");
      } else if (err.code === "auth/weak-password") {
        setError("Senha muito fraca");
      } else {
        setError("Ocorreu um erro ao completar o registro. Tente novamente.");
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const nextStep = () => {
    if (formStep === 1) {
      const validationResult = validateRegistrationStep1(name, email);
      if (!validationResult.isValid) {
        setError(validationResult.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      setError("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setFormStep(2);
    }
  };

  const prevStep = () => {
    if (formStep === 2) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setFormStep(1);
    }
  };

  return (
    <SafeAreaView
      key={`registration-container-${theme}`}
      style={styles.container}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { backgroundColor: colors.background },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <MotiView
            key={`header-${theme}`}
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 18 }}
            style={styles.header}
          >
            <MotiText
              key={`title-${theme}`}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", delay: 300 }}
              style={[styles.title, { color: colors.text }]}
            >
              {formStep === 1 ? "Quase lá!" : "Crie sua senha"}
            </MotiText>

            <MotiText
              key={`subtitle-${theme}`}
              from={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ type: "timing", delay: 500, duration: 800 }}
              style={[styles.subtitle, { color: colors.text }]}
            >
              {formStep === 1
                ? "Complete seu cadastro para salvar seu plano nutricional personalizado"
                : "Escolha uma senha segura para proteger sua conta"}
            </MotiText>
          </MotiView>

          {/* Indicador de progresso */}
          <MotiView
            key={`progress-indicator-${theme}`}
            style={styles.progressContainer}
          >
            <MotiView
              key={`step-1-${theme}`}
              style={[
                styles.progressStep,
                {
                  backgroundColor:
                    formStep >= 1
                      ? colors.primary
                      : theme === "dark"
                      ? "#333"
                      : "#e0e0e0",
                  width: formStep === 1 ? 24 : 12,
                },
              ]}
              animate={{
                backgroundColor:
                  formStep >= 1
                    ? colors.primary
                    : theme === "dark"
                    ? "#333"
                    : "#e0e0e0",
                width: formStep === 1 ? 24 : 12,
              }}
              transition={{ type: "timing", duration: 300 }}
            />
            <MotiView
              key={`step-2-${theme}`}
              style={[
                styles.progressStep,
                {
                  backgroundColor:
                    formStep >= 2
                      ? colors.primary
                      : theme === "dark"
                      ? "#333"
                      : "#e0e0e0",
                  width: formStep === 2 ? 24 : 12,
                },
              ]}
              animate={{
                backgroundColor:
                  formStep >= 2
                    ? colors.primary
                    : theme === "dark"
                    ? "#333"
                    : "#e0e0e0",
                width: formStep === 2 ? 24 : 12,
              }}
              transition={{ type: "timing", duration: 300 }}
            />
          </MotiView>

          {/* Formulário */}
          <View style={styles.formContainer}>
            <AnimatePresence>
              {formStep === 1 && (
                <MotiView
                  key={`form-step-1-${theme}`}
                  from={{ opacity: 0, transform: [{ translateX: -width }] }}
                  animate={{ opacity: 1, transform: [{ translateX: 0 }] }}
                  exit={{ opacity: 0, transform: [{ translateX: -width }] }}
                  transition={{
                    type: "timing",
                    duration: 350,
                    delay: 0,
                  }}
                  style={[
                    styles.formCard,
                    {
                      backgroundColor:
                        theme === "dark" ? colors.dark : colors.light,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {error ? <ErrorMessage message={error} /> : null}

                  <View style={styles.formInnerContainer}>
                    <View style={styles.inputWrapper}>
                      <Input
                        label="Nome"
                        placeholder="Seu nome completo"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        onFocus={() => setActiveField("name")}
                        onBlur={() => setActiveField("")}
                        leftIcon="person-outline"
                        isActive={activeField === "name"}
                      />
                    </View>

                    <View style={styles.inputWrapper}>
                      <Input
                        label="Email"
                        placeholder="Seu email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        onFocus={() => setActiveField("email")}
                        onBlur={() => setActiveField("")}
                        leftIcon="mail-outline"
                        isActive={activeField === "email"}
                      />
                    </View>

                    <TouchableOpacity
                      key={`next-button-${theme}`}
                      style={[
                        styles.nextButton,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={nextStep}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.nextButtonText}>Continuar</Text>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                      <View
                        style={[
                          styles.divider,
                          {
                            backgroundColor:
                              theme === "dark" ? "#444" : "#e0e0e0",
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.dividerText,
                          { color: theme === "dark" ? "#aaa" : "#888" },
                        ]}
                      >
                        ou continue com
                      </Text>
                      <View
                        style={[
                          styles.divider,
                          {
                            backgroundColor:
                              theme === "dark" ? "#444" : "#e0e0e0",
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.socialButtonsContainer}>
                      <TouchableOpacity
                        key={`google-button-${theme}`}
                        style={[
                          styles.socialButton,
                          {
                            backgroundColor:
                              theme === "dark" ? "#333" : "#f5f5f5",
                            borderColor: theme === "dark" ? "#444" : "#e0e0e0",
                          },
                        ]}
                        onPress={() => handleSocialLogin("Google")}
                      >
                        <Ionicons
                          name="logo-google"
                          size={20}
                          color="#DB4437"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        key={`apple-button-${theme}`}
                        style={[
                          styles.socialButton,
                          {
                            backgroundColor:
                              theme === "dark" ? "#333" : "#f5f5f5",
                            borderColor: theme === "dark" ? "#444" : "#e0e0e0",
                          },
                        ]}
                        onPress={() => handleSocialLogin("Apple")}
                      >
                        <Ionicons
                          name="logo-apple"
                          size={20}
                          color={theme === "dark" ? "#fff" : "#000"}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </MotiView>
              )}

              {formStep === 2 && (
                <MotiView
                  key={`form-step-2-${theme}`}
                  from={{ opacity: 0, transform: [{ translateX: width }] }}
                  animate={{ opacity: 1, transform: [{ translateX: 0 }] }}
                  exit={{ opacity: 0, transform: [{ translateX: width }] }}
                  transition={{
                    type: "timing",
                    duration: 350,
                    delay: 0,
                  }}
                  style={[
                    styles.formCard,
                    {
                      backgroundColor:
                        theme === "dark" ? colors.dark : colors.light,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {error ? <ErrorMessage message={error} /> : null}

                  <View style={styles.formInnerContainer}>
                    <View style={styles.inputWrapper}>
                      <Input
                        label="Senha"
                        placeholder="Sua senha"
                        value={password}
                        onChangeText={handlePasswordChange}
                        secureTextEntry={!showPassword}
                        onFocus={() => setActiveField("password")}
                        onBlur={() => setActiveField("")}
                        leftIcon="lock-closed-outline"
                        rightIcon={
                          showPassword ? "eye-off-outline" : "eye-outline"
                        }
                        onRightIconPress={() => setShowPassword(!showPassword)}
                        isActive={activeField === "password"}
                      />
                    </View>

                    {password.length > 0 && (
                      <MotiView
                        key={`password-strength-${theme}`}
                        from={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        style={styles.passwordStrengthContainer}
                      >
                        <View style={styles.strengthBarContainer}>
                          <View
                            style={[
                              styles.strengthBar,
                              {
                                width: `${passwordStrength * 100}%`,
                                backgroundColor:
                                  getPasswordStrengthColor(passwordStrength),
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.strengthText,
                            {
                              color: getPasswordStrengthColor(passwordStrength),
                            },
                          ]}
                        >
                          {getPasswordStrengthText(passwordStrength)}
                        </Text>
                      </MotiView>
                    )}

                    <View style={styles.inputWrapper}>
                      <Input
                        label="Confirmar Senha"
                        placeholder="Confirme sua senha"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        onFocus={() => setActiveField("confirmPassword")}
                        onBlur={() => setActiveField("")}
                        leftIcon="shield-checkmark-outline"
                        rightIcon={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        onRightIconPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        isActive={activeField === "confirmPassword"}
                      />
                    </View>

                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        key={`back-button-${theme}`}
                        style={[
                          styles.backButton,
                          {
                            backgroundColor: "transparent",
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={prevStep}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="arrow-back"
                          size={20}
                          color={colors.text}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        key={`create-account-button-${theme}`}
                        style={[
                          styles.createAccountButton,
                          { backgroundColor: colors.primary },
                        ]}
                        onPress={handleCompleteRegistration}
                        disabled={loading}
                        activeOpacity={0.8}
                      >
                        {loading ? (
                          <MotiView
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ type: "timing", duration: 200 }}
                          >
                            <Ionicons
                              name="sync"
                              size={24}
                              color="white"
                              style={styles.loadingIcon}
                            />
                          </MotiView>
                        ) : (
                          <Text style={styles.createAccountButtonText}>
                            Criar Conta
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </MotiView>
              )}
            </AnimatePresence>
          </View>

          <View style={styles.termsContainer}>
            <Text
              style={[
                styles.termsText,
                { color: theme === "dark" ? "#aaa" : "#888" },
              ]}
            >
              Ao criar uma conta, você concorda com nossos{" "}
              <Text style={[styles.termsLink, { color: colors.primary }]}>
                Termos de Serviço
              </Text>{" "}
              e{" "}
              <Text style={[styles.termsLink, { color: colors.primary }]}>
                Política de Privacidade
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginVertical: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    maxWidth: "85%",
    lineHeight: 22,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  progressStep: {
    height: 8,
    borderRadius: 4,
  },
  formContainer: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
  },
  formCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    marginBottom: 24,
  },
  formInnerContainer: {
    width: "100%",
    gap: 20,
  },
  inputWrapper: {
    width: "100%",
  },
  passwordStrengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -12,
  },
  strengthBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthBar: {
    height: "100%",
  },
  strengthText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "bold",
  },
  errorContainer: {
    backgroundColor: "rgba(255, 82, 82, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    color: "#FF5252",
    marginLeft: 8,
    flex: 1,
    fontSize: 12,
  },
  nextButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  createAccountButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  createAccountButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingIcon: {
    transform: [{ rotate: "0deg" }],
  },
  termsContainer: {
    marginTop: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  termsText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: "90%",
  },
  termsLink: {
    fontWeight: "bold",
  },
});
