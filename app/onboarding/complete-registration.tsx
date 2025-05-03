import React, { useState, useRef, useCallback, useEffect } from "react";
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
import { useTranslation } from "react-i18next";
import {
  validateRegistration,
  validateRegistrationStep1,
  validateRegistrationStep2,
  calculatePasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthText,
} from "../../utils/validations";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import Constants from "expo-constants";

const { width, height } = Dimensions.get("window");

export default function CompleteRegistrationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { completeAnonymousRegistration, isAnonymous, loginWithApple } =
    useAuth();

  // Referência para o ScrollView
  const scrollViewRef = useRef<ScrollView>(null);

  // Mapa para rastrear as posições de scroll de cada campo
  const fieldPositionsRef = useRef<Record<string, number>>({
    name: 0,
    email: 130, // ajustar conforme necessário
    password: 150, // ajustar conforme necessário
    confirmPassword: 180, // ajustar conforme necessário
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [error, setError] = useState("");
  const [activeField, setActiveField] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Verificar se estamos no Expo Go para exibir mensagem adequada
  const isExpoGo = Constants.executionEnvironment === "standalone";

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordStrength(calculatePasswordStrength(text));
  };

  const handleCompleteRegistration = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const validationResult = validateRegistrationStep2(
      password,
      confirmPassword
    );
    if (!validationResult.isValid) {
      setError(validationResult.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

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
      setSuccessAnimation(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Após a animação de sucesso, redireciona para o paywall
      setTimeout(() => {
        router.push("/paywall-modal");
      }, 1500);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError(t("completeRegistration.errors.emailInUse"));
      } else if (err.code === "auth/invalid-email") {
        setError(t("completeRegistration.errors.invalidEmail"));
      } else if (err.code === "auth/weak-password") {
        setError(t("completeRegistration.errors.weakPassword"));
      } else {
        setError(t("completeRegistration.errors.generic"));
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      if (!error) {
        // Mantém loading durante a animação de sucesso
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      } else {
        setLoading(false);
      }
    }
  };

  const handleSocialLogin = async (provider: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Verificar se estamos em modo de desenvolvimento Expo Go
      if (isExpoGo) {
        setError(`Login com ${provider} só funciona em builds nativos do app`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }

      // Verificar se está tentando usar Apple em um dispositivo Android
      if (provider === "Apple" && Platform.OS === "android") {
        setError("Login com Apple não está disponível em dispositivos Android");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }

      setLoading(true);
      setError("");

      if (provider === "Apple") {
        await loginWithApple();
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError(t("completeRegistration.errors.emailInUse"));
      } else if (err.code === "auth/invalid-email") {
        setError(t("completeRegistration.errors.invalidEmail"));
      } else if (err.code === "auth/weak-password") {
        setError(t("completeRegistration.errors.weakPassword"));
      } else {
        setError(t("completeRegistration.errors.generic"));
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
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

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Função para lidar com o foco dos inputs
  const handleInputFocus = useCallback((fieldName: string) => {
    setActiveField(fieldName);

    // Rolar até a posição do campo de entrada
    if (
      scrollViewRef.current &&
      fieldPositionsRef.current[fieldName] !== undefined
    ) {
      const yOffset = fieldPositionsRef.current[fieldName];

      // Pequeno atraso para garantir que o teclado já esteja aberto
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: yOffset,
          animated: true,
        });
      }, 100);
    }
  }, []);

  return (
    <SafeAreaView
      key={`registration-container-${theme}`}
      style={[styles.container, { paddingTop: 0 }]}
      edges={["bottom"]}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      {/* Overlay de carregamento animado */}
      <AnimatePresence>
        {loading && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "timing", duration: 300 }}
            style={[
              StyleSheet.absoluteFillObject,
              styles.loadingOverlay,
              { backgroundColor: colors.background + "F0" },
            ]}
          >
            {successAnimation ? (
              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
                style={styles.successContainer}
              >
                <MotiView
                  from={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 12, delay: 200 }}
                  style={[
                    styles.successIconContainer,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons
                    name="checkmark"
                    size={40}
                    color={theme === "dark" ? "black" : "white"}
                  />
                </MotiView>
                <MotiText
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: "timing", duration: 300, delay: 400 }}
                  style={[styles.successText, { color: colors.text }]}
                >
                  {t("completeRegistration.success")}
                </MotiText>
              </MotiView>
            ) : (
              <View style={styles.loadingContainer}>
                <MotiView
                  style={[
                    styles.loadingDot,
                    { backgroundColor: colors.primary },
                  ]}
                  from={{ scale: 0.5, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "timing",
                    duration: 700,
                    loop: true,
                    repeatReverse: true,
                    delay: 0,
                  }}
                />
                <MotiView
                  style={[
                    styles.loadingDot,
                    { backgroundColor: colors.primary },
                  ]}
                  from={{ scale: 0.5, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "timing",
                    duration: 700,
                    loop: true,
                    repeatReverse: true,
                    delay: 200,
                  }}
                />
                <MotiView
                  style={[
                    styles.loadingDot,
                    { backgroundColor: colors.primary },
                  ]}
                  from={{ scale: 0.5, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "timing",
                    duration: 700,
                    loop: true,
                    repeatReverse: true,
                    delay: 400,
                  }}
                />
              </View>
            )}
          </MotiView>
        )}
      </AnimatePresence>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            {
              backgroundColor: colors.background,
              paddingTop: 0,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={dismissKeyboard}
            style={{ flex: 1 }}
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
                {formStep === 1
                  ? t("completeRegistration.title.step1")
                  : t("completeRegistration.title.step2")}
              </MotiText>

              <MotiText
                key={`subtitle-${theme}`}
                from={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ type: "timing", delay: 500, duration: 800 }}
                style={[styles.subtitle, { color: colors.text }]}
              >
                {formStep === 1
                  ? t("completeRegistration.subtitle.step1")
                  : t("completeRegistration.subtitle.step2")}
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
                          label={t("completeRegistration.form.name.label")}
                          placeholder={t(
                            "completeRegistration.form.name.placeholder"
                          )}
                          value={name}
                          onChangeText={setName}
                          autoCapitalize="words"
                          onFocus={() => handleInputFocus("name")}
                          onBlur={() => setActiveField("")}
                          leftIcon="person-outline"
                          isActive={activeField === "name"}
                        />
                      </View>

                      <View style={styles.inputWrapper}>
                        <Input
                          label={t("completeRegistration.form.email.label")}
                          placeholder={t(
                            "completeRegistration.form.email.placeholder"
                          )}
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          onFocus={() => handleInputFocus("email")}
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
                        <Text
                          style={[
                            styles.nextButtonText,
                            { color: theme === "dark" ? "black" : "white" },
                          ]}
                        >
                          {t("completeRegistration.buttons.continue")}
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={20}
                          color={theme === "dark" ? "black" : "white"}
                        />
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
                          {t("completeRegistration.socialAuth.continueWith")}
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
                          key={`apple-button-${theme}`}
                          style={[
                            styles.socialButton,
                            {
                              backgroundColor:
                                theme === "dark" ? "#333" : "#f5f5f5",
                              borderColor:
                                theme === "dark" ? "#444" : "#e0e0e0",
                            },
                            Platform.OS === "android" &&
                              styles.socialButtonDisabled,
                          ]}
                          onPress={() => handleSocialLogin("Apple")}
                        >
                          <Ionicons
                            name="logo-apple"
                            size={20}
                            color={theme === "dark" ? "#fff" : "#000"}
                          />
                          {Platform.OS === "android" && (
                            <View style={styles.iosOnlyBadge}>
                              <Text style={styles.iosOnlyText}>iOS</Text>
                            </View>
                          )}
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
                          label={t("completeRegistration.form.password.label")}
                          placeholder={t(
                            "completeRegistration.form.password.placeholder"
                          )}
                          value={password}
                          onChangeText={handlePasswordChange}
                          secureTextEntry={!showPassword}
                          onFocus={() => handleInputFocus("password")}
                          onBlur={() => setActiveField("")}
                          leftIcon="lock-closed-outline"
                          rightIcon={
                            showPassword ? "eye-off-outline" : "eye-outline"
                          }
                          onRightIconPress={() =>
                            setShowPassword(!showPassword)
                          }
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
                                color:
                                  getPasswordStrengthColor(passwordStrength),
                              },
                            ]}
                          >
                            {t(getPasswordStrengthText(passwordStrength))}
                          </Text>
                        </MotiView>
                      )}

                      <View style={styles.inputWrapper}>
                        <Input
                          label={t(
                            "completeRegistration.form.confirmPassword.label"
                          )}
                          placeholder={t(
                            "completeRegistration.form.confirmPassword.placeholder"
                          )}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showConfirmPassword}
                          onFocus={() => handleInputFocus("confirmPassword")}
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
                          <Text
                            style={[
                              styles.createAccountButtonText,
                              { color: theme === "dark" ? "black" : "white" },
                            ]}
                          >
                            {t("completeRegistration.buttons.createAccount")}
                          </Text>
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
                {t("completeRegistration.terms.agreement")}{" "}
                <Text style={[styles.termsLink, { color: colors.primary }]}>
                  {t("completeRegistration.terms.termsOfService")}
                </Text>{" "}
                {t("completeRegistration.terms.and")}{" "}
                <Text style={[styles.termsLink, { color: colors.primary }]}>
                  {t("completeRegistration.terms.privacyPolicy")}
                </Text>
              </Text>
            </View>
          </TouchableOpacity>
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
    alignItems: "center",
    gap: 16,
  },
  socialButton: {
    width: "80%",
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
    fontSize: 16,
    fontWeight: "600",
  },
  loadingOverlay: {
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  successText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
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
  socialButtonDisabled: {
    backgroundColor: "#e0e0e0",
    borderColor: "#e0e0e0",
  },
  iosOnlyBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#007bff",
    borderRadius: 12,
    padding: 2,
  },
  iosOnlyText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
  },
});
