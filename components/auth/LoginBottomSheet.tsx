import React, {
  useRef,
  useCallback,
  useMemo,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import Colors from "../../constants/Colors";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { validateLogin } from "../../utils/validations";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";

const { width } = Dimensions.get("window");

interface LoginBottomSheetProps {
  bottomSheetIndex: number;
  setBottomSheetIndex: (index: number) => void;
}

const LoginBottomSheet = ({
  bottomSheetIndex,
  setBottomSheetIndex,
}: LoginBottomSheetProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Bottom sheet reference
  const bottomSheetRef = useRef<BottomSheet>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Snap points for bottom sheet
  const snapPoints = useMemo(() => ["85%", "75%"], []);

  // Efeito para controlar a abertura e fechamento do bottom sheet
  useEffect(() => {
    if (bottomSheetIndex >= 0 && bottomSheetRef.current) {
      bottomSheetRef.current.expand();
    } else if (bottomSheetIndex === -1 && bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
  }, [bottomSheetIndex]);

  // Monitorar o teclado
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

  // Função para fechar o teclado
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleCloseBottomSheet = useCallback(() => {
    Keyboard.dismiss();
    setBottomSheetIndex(-1);
  }, [setBottomSheetIndex]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        setBottomSheetIndex(-1);
      }
    },
    [setBottomSheetIndex]
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
      />
    ),
    []
  );

  const handleLogin = async () => {
    const validationResult = validateLogin(email, password);
    if (!validationResult.isValid) {
      setError(validationResult.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setLoading(true);
      setError("");
      await login(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // O redirecionamento será feito automaticamente pelo AuthProvider
    } catch (err: any) {
      console.error("Erro ao fazer login:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Email ou senha incorretos");
      } else if (err.code === "auth/invalid-email") {
        setError("Email inválido");
      } else {
        setError("Ocorreu um erro ao fazer login. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Implementar login com Google
  };

  const handleAppleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Implementar login com Apple
  };

  // Função para atualizar o email sem causar o aviso do Reanimated
  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
  }, []);

  // Função para atualizar a senha sem causar o aviso do Reanimated
  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
  }, []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={bottomSheetIndex}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={[
        styles.bottomSheetIndicator,
        { backgroundColor: colors.primary },
      ]}
      backgroundStyle={[
        styles.bottomSheetBackground,
        { backgroundColor: theme === "dark" ? "#1c1c1e" : "#ffffff" },
      ]}
      onChange={handleSheetChanges}
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
      animateOnMount={false}
      enableContentPanningGesture={true}
      enableHandlePanningGesture={true}
      handleHeight={24}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 30 : 0}
        >
          <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            {/* Cabeçalho */}
            <MotiView
              from={{ opacity: 0, translateY: -20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 300 }}
              style={styles.header}
            >
              <Text
                style={[
                  styles.title,
                  {
                    color: theme === "dark" ? "#ffffff" : "#000000",
                  },
                ]}
              >
                Bem-vindo de volta
              </Text>
              <TouchableOpacity
                onPress={handleCloseBottomSheet}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close-outline"
                  size={28}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </MotiView>

            <Text style={styles.subtitle}>
              Faça login para continuar sua jornada fitness
            </Text>

            {/* Mensagem de erro */}
            {error ? (
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "timing", duration: 300 }}
                style={styles.errorContainer}
              >
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color="#FF3B30"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.errorText}>{error}</Text>
              </MotiView>
            ) : null}

            {/* Formulário de login */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 300, delay: 100 }}
              style={styles.form}
            >
              {/* Campo de email */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email</Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme === "dark" ? "#2c2c2e" : "#f5f5f5",
                      borderColor: email ? colors.primary : "transparent",
                    },
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={colors.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme === "dark" ? "#ffffff" : "#000000",
                      },
                    ]}
                    placeholder="Seu endereço de email"
                    placeholderTextColor={
                      theme === "dark" ? "#999999" : "#999999"
                    }
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>
              </View>

              {/* Campo de senha */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Senha</Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme === "dark" ? "#2c2c2e" : "#f5f5f5",
                      borderColor: password ? colors.primary : "transparent",
                    },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={colors.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={passwordInputRef}
                    style={[
                      styles.input,
                      {
                        color: theme === "dark" ? "#ffffff" : "#000000",
                      },
                    ]}
                    placeholder="Sua senha"
                    placeholderTextColor={
                      theme === "dark" ? "#999999" : "#999999"
                    }
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                </View>
              </View>

              {/* Link para recuperação de senha */}
              <TouchableOpacity
                style={styles.forgotPasswordContainer}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[styles.forgotPasswordText, { color: colors.primary }]}
                >
                  Esqueceu sua senha?
                </Text>
              </TouchableOpacity>

              {/* Botão de login */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>ENTRAR</Text>
                )}
              </TouchableOpacity>
            </MotiView>

            {/* Separador */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "timing", duration: 300, delay: 200 }}
              style={styles.dividerContainer}
            >
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme === "dark" ? "#444" : "#e0e0e0" },
                ]}
              />
              <Text
                style={[
                  styles.dividerText,
                  { color: theme === "dark" ? "#999" : "#666" },
                ]}
              >
                ou continue com
              </Text>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme === "dark" ? "#444" : "#e0e0e0" },
                ]}
              />
            </MotiView>

            {/* Botões de login social */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 300, delay: 300 }}
              style={styles.socialButtonsContainer}
            >
              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton]}
                onPress={handleAppleLogin}
                activeOpacity={0.8}
              >
                <FontAwesome name="apple" size={20} color="#FFFFFF" />
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={handleGoogleLogin}
                activeOpacity={0.8}
              >
                <FontAwesome name="google" size={20} color="#FFFFFF" />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
            </MotiView>
          </View>

          {/* Botão para fechar o teclado */}
          {keyboardVisible && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={[
                styles.keyboardDismissButton,
                { bottom: 10 + insets.bottom },
              ]}
            >
              <TouchableOpacity
                onPress={dismissKeyboard}
                style={[
                  styles.keyboardDismissButtonInner,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  bottomSheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomSheetIndicator: {
    width: 40,
    height: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 24,
  },
  closeButton: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#FF3B30",
    flex: 1,
  },
  form: {
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#888",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 24,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 28,
    width: "48%",
  },
  appleButton: {
    backgroundColor: "#000000",
  },
  googleButton: {
    backgroundColor: "#DB4437",
  },
  socialButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  keyboardDismissButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  keyboardDismissButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default LoginBottomSheet;
