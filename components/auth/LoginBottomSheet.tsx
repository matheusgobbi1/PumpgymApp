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
  LayoutAnimation,
  UIManager,
  ScrollView,
} from "react-native";
import Colors from "../../constants/Colors";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { validateLogin } from "../../utils/validations";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";

const { width, height } = Dimensions.get("window");

// Habilitar LayoutAnimation para Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const scrollViewRef = useRef<ScrollView>(null);

  // Snap points for bottom sheet
  // Usamos snapPoints dinâmicos baseados no estado do teclado
  const snapPoints = useMemo(() => {
    // Se o teclado estiver visível, só permitimos o snapPoint maior
    if (keyboardVisible) {
      return ["85%"];
    }
    // Caso contrário, permitimos ambos os snapPoints
    return ["65%", "85%"];
  }, [keyboardVisible]);

  // Referência para controlar se estamos no meio de uma animação
  const isAnimatingRef = useRef(false);
  // Referência para controlar o último snapPoint
  const lastSnapPointRef = useRef(0);

  // Efeito para controlar a abertura e fechamento do bottom sheet
  useEffect(() => {
    if (bottomSheetIndex >= 0 && bottomSheetRef.current) {
      // Abrir no primeiro snapPoint (65% ou 85% dependendo do estado do teclado)
      bottomSheetRef.current.snapToIndex(0);
      lastSnapPointRef.current = 0;
    } else if (bottomSheetIndex === -1 && bottomSheetRef.current) {
      bottomSheetRef.current.close();
    }
  }, [bottomSheetIndex]);

  // Função para expandir o BottomSheet de forma segura
  const safelyExpandBottomSheet = useCallback(() => {
    if (isAnimatingRef.current) return;

    if (bottomSheetRef.current) {
      isAnimatingRef.current = true;
      // Se o teclado estiver visível, só temos um snapPoint (0)
      // Se não, vamos para o snapPoint 1 (85%)
      const targetIndex = keyboardVisible ? 0 : 1;
      bottomSheetRef.current.snapToIndex(targetIndex);
      lastSnapPointRef.current = targetIndex;

      // Resetar o flag de animação após um tempo
      setTimeout(() => {
        isAnimatingRef.current = false;
      }, 300);
    }
  }, [keyboardVisible]);

  // Monitorar o teclado
  useEffect(() => {
    const keyboardWillShowListener =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillShow", (event) => {
            configureLayoutAnimation();
            setKeyboardVisible(true);
            // Não precisamos chamar safelyExpandBottomSheet aqui, pois o snapPoints
            // será atualizado automaticamente e o BottomSheet se ajustará

            // Rolar para o botão quando o teclado aparecer no iOS
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          })
        : null;

    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        if (Platform.OS === "android") {
          configureLayoutAnimation();
          setKeyboardVisible(true);
          // Não precisamos chamar safelyExpandBottomSheet aqui, pois o snapPoints
          // será atualizado automaticamente e o BottomSheet se ajustará

          // Rolar para o botão quando o teclado aparecer no Android
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    );

    const keyboardWillHideListener =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillHide", () => {
            configureLayoutAnimation();
            setKeyboardVisible(false);
            // Não alteramos o snapPoint aqui, pois o snapPoints
            // será atualizado automaticamente e o BottomSheet se ajustará
          })
        : null;

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        if (Platform.OS === "android") {
          configureLayoutAnimation();
        }
        setKeyboardVisible(false);
        // Não alteramos o snapPoint aqui, pois o snapPoints
        // será atualizado automaticamente e o BottomSheet se ajustará
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

  // Função para fechar o teclado
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Configurar animação de layout
  const configureLayoutAnimation = () => {
    LayoutAnimation.configureNext({
      duration: 300,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
  };

  const handleCloseBottomSheet = useCallback(() => {
    Keyboard.dismiss();
    setBottomSheetIndex(-1);
  }, [setBottomSheetIndex]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        // Fechar o teclado quando o bottom sheet for fechado
        Keyboard.dismiss();
        setBottomSheetIndex(-1);
      }

      // Atualizar a referência do último snapPoint
      lastSnapPointRef.current = index;
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
        onPress={() => {
          // Fechar o teclado quando o backdrop for tocado
          if (keyboardVisible) {
            Keyboard.dismiss();
          }
        }}
      />
    ),
    [keyboardVisible]
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
    // Não chamamos mais snapToIndex aqui
  }, []);

  // Função para atualizar a senha sem causar o aviso do Reanimated
  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    // Não chamamos mais snapToIndex aqui
  }, []);

  // Função para lidar com o foco dos inputs e expandir o BottomSheet
  const handleInputFocus = useCallback(() => {
    // Expandir para o snapPoint maior (85%) de forma segura
    safelyExpandBottomSheet();

    // Garantir que o estado de teclado visível seja atualizado
    setKeyboardVisible(true);
  }, [safelyExpandBottomSheet]);

  // Verificar se os campos estão preenchidos
  const fieldsAreFilled = email.trim() !== "" && password.trim() !== "";

  // Efeito para aplicar animação quando os campos forem preenchidos
  useEffect(() => {
    if (fieldsAreFilled || !fieldsAreFilled) {
      configureLayoutAnimation();
    }
  }, [fieldsAreFilled]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={bottomSheetIndex >= 0 ? 0 : -1}
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
      keyboardBlurBehavior="none"
      android_keyboardInputMode="adjustResize"
      animateOnMount={false}
      enableContentPanningGesture={!keyboardVisible}
      enableHandlePanningGesture={!keyboardVisible}
      handleHeight={24}
      onClose={() => {
        // Garantir que o teclado seja fechado quando o bottom sheet for fechado
        Keyboard.dismiss();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 30 : 0}
        enabled
      >
        <View style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.headerContainer}>
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
            </View>
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View>
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
            </View>
          </TouchableWithoutFeedback>

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={true}
            overScrollMode="always"
            scrollEnabled={true}
          >
            <View style={styles.form}>
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
                    onFocus={handleInputFocus}
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
                    onFocus={handleInputFocus}
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
              <View
                style={[
                  styles.loginButtonContainer,
                  keyboardVisible && styles.loginButtonContainerKeyboardVisible,
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    fieldsAreFilled
                      ? keyboardVisible
                        ? styles.loginButtonKeyboardVisible
                        : { backgroundColor: colors.primary }
                      : {
                          backgroundColor:
                            theme === "dark" ? "#3a3a3c" : "#e0e0e0",
                        },
                  ]}
                  onPress={handleLogin}
                  disabled={loading || !fieldsAreFilled}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.loginButtonText,
                        !fieldsAreFilled && {
                          color: theme === "dark" ? "#8e8e93" : "#a0a0a0",
                        },
                      ]}
                    >
                      ENTRAR
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Separador */}
              <View style={styles.dividerContainer}>
                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor: theme === "dark" ? "#444" : "#e0e0e0",
                    },
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
                    {
                      backgroundColor: theme === "dark" ? "#444" : "#e0e0e0",
                    },
                  ]}
                />
              </View>

              {/* Botões de login social */}
              <View style={styles.socialButtonsContainer}>
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
              </View>

              {/* Espaço extra para garantir que o conteúdo possa ser rolado para cima quando o teclado estiver visível */}
              {keyboardVisible ? (
                <View style={{ height: Platform.OS === "ios" ? 100 : 150 }} />
              ) : (
                <View style={{ height: 5 }} />
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomSheetIndicator: {
    width: 40,
    height: 4,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 15,
    color: "#888",
    marginBottom: 6,
    paddingHorizontal: 24,
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
    marginHorizontal: 24,
    marginBottom: 16,
  },
  errorText: {
    color: "#FF3B30",
    flex: 1,
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollViewContent: {
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  inputWrapper: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#888",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
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
    marginBottom: 16,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loginButtonContainer: {
    marginBottom: 20,
  },
  loginButtonContainerKeyboardVisible: {
    marginBottom: 12,
    marginTop: 4,
  },
  loginButton: {
    height: 52,
    width: "100%",
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  loginButtonKeyboardVisible: {
    height: 52,
    backgroundColor: "#FF4500", // Cor mais chamativa quando o teclado está visível
    borderWidth: 1,
    borderColor: "#FF6347",
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
    marginBottom: 16,
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
    marginBottom: 16,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 24,
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
});

export default LoginBottomSheet;
