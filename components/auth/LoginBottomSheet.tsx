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
  NativeSyntheticEvent,
  NativeScrollEvent,
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
import { useTranslation } from "react-i18next";
import { handleLoginError } from "../../utils/errorHandler";
import { useRouter } from "expo-router";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { useToast } from "../../components/common/ToastContext";

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
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [snapPoints, setSnapPoints] = useState<(string | number)[]>([
    "60%",
    "75%",
  ]);

  // Bottom sheet reference
  const bottomSheetRef = useRef<BottomSheet>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Referência para controlar se estamos no meio de uma animação
  const isAnimatingRef = useRef(false);
  // Referência para controlar o último snapPoint
  const lastSnapPointRef = useRef(0);

  // Mapa para rastrear as posições de scroll de cada campo
  const fieldPositionsRef = useRef({
    email: 10,
    password: 100, // valores aproximados, ajuste conforme necessário
  });

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

            // Forçar o BottomSheet a ir para o snapPoint maior
            // e ajustar o snapPoint para 80% para mais espaço
            setSnapPoints(["80%"]);
            if (bottomSheetRef.current) {
              bottomSheetRef.current.snapToIndex(0);
            }
          })
        : null;

    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        if (Platform.OS === "android") {
          configureLayoutAnimation();
          setKeyboardVisible(true);

          // Forçar o BottomSheet a ir para o snapPoint maior
          // e ajustar o snapPoint para 80% para mais espaço
          setSnapPoints(["80%"]);
          if (bottomSheetRef.current) {
            bottomSheetRef.current.snapToIndex(0);
          }
        }
      }
    );

    const keyboardWillHideListener =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillHide", () => {
            configureLayoutAnimation();
            setKeyboardVisible(false);

            // Restaurar os snapPoints originais
            setSnapPoints(["60%", "75%"]);
          })
        : null;

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        if (Platform.OS === "android") {
          configureLayoutAnimation();
        }
        setKeyboardVisible(false);

        // Restaurar os snapPoints originais
        setSnapPoints(["60%", "75%"]);
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
    try {
      // Validar os campos
      const validationResult = validateLogin(email, password);
      if (!validationResult.isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        // Usar toast em vez de mensagem de erro inline
        showToast({
          message:
            email === "" || password === ""
              ? t("login.bottomSheet.errorMessages.emptyFields")
              : validationResult.message,
          type: "error",
          duration: 4000,
        });

        return;
      }

      // Iniciar o carregamento
      setLoading(true);

      // Chamar a função de login
      await login(email, password);

      // Fechar o BottomSheet após o login bem-sucedido
      setBottomSheetIndex(-1);
    } catch (err) {
      // Usar nosso tratador de erro personalizado e exibir via toast
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Usar toast em vez de mensagem de erro inline
      showToast({
        message: handleLoginError(err),
        type: "error",
        duration: 4000,
      });
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
  const handleInputFocus = useCallback(
    (inputType: "email" | "password") => {
      // Expandir para o snapPoint maior (80%) de forma segura
      safelyExpandBottomSheet();

      // Garantir que o estado de teclado visível seja atualizado
      setKeyboardVisible(true);

      // Ajustar o snapPoint para dar mais espaço quando o teclado estiver aberto
      setSnapPoints(["80%"]);

      // Rolar até a posição do campo de entrada
      if (scrollViewRef.current) {
        // Definimos uma rolagem progressiva com base no tipo de input
        // O campo de senha tem uma posição mais baixa, então precisamos rolar mais
        const yOffset = fieldPositionsRef.current[inputType];

        // Adicionar uma pequena animação de atraso para garantir que o teclado já esteja aberto
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: yOffset,
            animated: true,
          });
        }, 100);
      }
    },
    [safelyExpandBottomSheet]
  );

  // Verificar se os campos estão preenchidos
  const fieldsAreFilled = email.trim() !== "" && password.trim() !== "";

  // Efeito para aplicar animação quando os campos forem preenchidos
  useEffect(() => {
    if (fieldsAreFilled || !fieldsAreFilled) {
      configureLayoutAnimation();
    }
  }, [fieldsAreFilled]);

  // Função para lidar com o scroll da ScrollView
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Armazenar a posição de rolagem atual
      scrollPositionRef.current = event.nativeEvent.contentOffset.y;
    },
    []
  );

  // Função para restaurar a posição de rolagem
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Armazenar a posição final de rolagem
      scrollPositionRef.current = event.nativeEvent.contentOffset.y;
    },
    []
  );

  // Função para salvar a posição de rolagem
  const handleScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollPositionRef.current = event.nativeEvent.contentOffset.y;
    },
    []
  );

  // Função para rolar para o final da ScrollView
  const scrollToEnd = useCallback(() => {
    // Não rolamos automaticamente para o final
    // Isso permite que o usuário veja o campo que está sendo editado
  }, []);

  // Efeito para rolar para o final quando o teclado estiver visível
  useEffect(() => {
    if (keyboardVisible) {
      scrollToEnd();
    }
  }, [keyboardVisible, scrollToEnd]);

  // Referência para a posição de rolagem atual
  const scrollPositionRef = useRef(0);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={bottomSheetIndex >= 0 ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose={!keyboardVisible}
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
      animateOnMount={true}
      enableContentPanningGesture={false}
      enableHandlePanningGesture={true}
      handleHeight={24}
      enableOverDrag={false}
      style={{ flex: 1 }}
      onClose={() => {
        Keyboard.dismiss();
      }}
    >
      <View style={{ flex: 1, minHeight: height * 0.6 }}>
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
              {t("login.bottomSheet.welcomeBack")}
            </Text>
            <TouchableOpacity
              onPress={handleCloseBottomSheet}
              style={styles.closeButton}
            >
              <Ionicons name="close-outline" size={28} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollViewContent,
            { paddingBottom: keyboardVisible ? 250 : 80 }, // Aumentei o espaço inferior para garantir mais margem quando o teclado está visível
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          bounces={true}
          scrollEventThrottle={16}
          keyboardDismissMode="interactive"
          nestedScrollEnabled={true}
          onScroll={handleScroll}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollsToTop={false}
          alwaysBounceVertical={false}
          directionalLockEnabled={true}
          disableScrollViewPanResponder={true}
          removeClippedSubviews={false}
        >
          <View style={[styles.form, keyboardVisible && { paddingBottom: 30 }]}>
            {/* Campo de email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>
                {t("login.bottomSheet.email")}
              </Text>
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
                  placeholder={t("login.bottomSheet.emailPlaceholder")}
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
                  onFocus={() => handleInputFocus("email")}
                />
              </View>
            </View>

            {/* Campo de senha */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>
                {t("login.bottomSheet.password")}
              </Text>
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
                  placeholder={t("login.bottomSheet.passwordPlaceholder")}
                  placeholderTextColor={
                    theme === "dark" ? "#999999" : "#999999"
                  }
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  onFocus={() => handleInputFocus("password")}
                />
              </View>
            </View>

            {/* Link para recuperação de senha */}
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Mostrar o modal de recuperação de senha
                  setShowForgotPasswordModal(true);
                }}
              >
                <Text
                  style={[styles.forgotPasswordText, { color: colors.primary }]}
                >
                  {t("login.bottomSheet.forgotPassword")}
                </Text>
              </TouchableOpacity>
            </View>

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
                    {t("login.bottomSheet.loginButton")}
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
                {t("login.bottomSheet.orContinueWith")}
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
          </View>
        </ScrollView>
      </View>

      {/* Modal de recuperação de senha */}
      <ForgotPasswordModal
        visible={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
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
    height: 60,
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
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingTop: 8,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 24,
    minHeight: height * 0.5,
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
