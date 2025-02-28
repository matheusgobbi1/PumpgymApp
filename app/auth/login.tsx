import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { validateLogin } from "../../utils/validations";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { login, signInAnonymously } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Animação para elementos da tela
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const linkOpacity = useSharedValue(0);

  // Efeito para iniciar as animações após a montagem do componente
  useEffect(() => {
    const animationDuration = 800;

    // Animação sequencial elegante
    setTimeout(() => {
      logoOpacity.value = withTiming(1, {
        duration: animationDuration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }, 100);

    setTimeout(() => {
      textOpacity.value = withTiming(1, {
        duration: animationDuration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }, 300);

    setTimeout(() => {
      buttonOpacity.value = withTiming(1, {
        duration: animationDuration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }, 500);

    setTimeout(() => {
      linkOpacity.value = withTiming(1, {
        duration: animationDuration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }, 700);
  }, []);

  // Estilos animados
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: (1 - logoOpacity.value) * 20 }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: (1 - textOpacity.value) * 15 }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: (1 - buttonOpacity.value) * 10 }],
  }));

  const linkStyle = useAnimatedStyle(() => ({
    opacity: linkOpacity.value,
  }));

  // Bottom sheet reference
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Snap points for bottom sheet
  const snapPoints = useMemo(() => ["75%"], []);

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

  // Callbacks for bottom sheet
  const handleOpenBottomSheet = useCallback(() => {
    Keyboard.dismiss();
    bottomSheetRef.current?.expand();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleCloseBottomSheet = useCallback(() => {
    Keyboard.dismiss();
    bottomSheetRef.current?.close();
  }, []);

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
      return;
    }

    try {
      setLoading(true);
      setError("");
      await login(email, password);
      // O redirecionamento será feito automaticamente pelo AuthProvider
    } catch (err: any) {
      console.error("Erro ao fazer login:", err);
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

  const handleStartAnonymously = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLoading(true);
      setError("");
      await signInAnonymously();
      router.replace("/onboarding/gender");
    } catch (err) {
      console.error("Erro ao iniciar anonimamente:", err);
      setError("Ocorreu um erro ao iniciar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Implementar login com Google
  };

  const handleAppleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Implementar login com Apple
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Clean Gradient Background */}
        <LinearGradient
          colors={[colors.primary, "#1a2a6c", "#4ecdc4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.backgroundGradient}
        >
          <View style={styles.content}>
            {/* Logo and App Name */}
            <Animated.View style={[styles.logoContainer, logoStyle]}>
              <Image
                source={require("../../assets/images/Logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>PumpGym</Text>
            </Animated.View>

            {/* Motivational Text */}
            <Animated.View style={[styles.motivationalContainer, textStyle]}>
              <Text style={styles.motivationalText}>
                Transforme seu corpo,{"\n"}
                <Text style={styles.highlightText}>transforme sua vida</Text>
              </Text>
              <Text style={styles.subText}>
                Comece sua jornada fitness hoje mesmo
              </Text>
            </Animated.View>

            {/* Get Started Button */}
            <Animated.View style={[styles.buttonContainer, buttonStyle]}>
              <TouchableOpacity
                style={styles.getStartedButton}
                onPress={handleStartAnonymously}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary, "#2ab7ca"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.getStartedText}>COMEÇAR AGORA</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Login Link */}
            <Animated.View style={[styles.loginLinkContainer, linkStyle]}>
              <Text style={styles.loginText}>Já tem uma conta?</Text>
              <TouchableOpacity onPress={handleOpenBottomSheet}>
                <Text style={styles.loginLink}>Entrar</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </LinearGradient>

        {/* Login Bottom Sheet */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          handleIndicatorStyle={styles.bottomSheetIndicator}
          backgroundStyle={[
            styles.bottomSheetBackground,
            { backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#ffffff" },
          ]}
          keyboardBehavior="extend"
          android_keyboardInputMode="adjustResize"
          animateOnMount={true}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 30 : 0}
          >
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
              <BottomSheetScrollView
                style={styles.bottomSheetScrollView}
                contentContainerStyle={styles.bottomSheetScrollViewContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Animated.View
                  entering={SlideInUp.duration(400).easing(
                    Easing.bezier(0.25, 0.1, 0.25, 1)
                  )}
                  style={[
                    styles.bottomSheetContent,
                    { paddingBottom: insets.bottom + 20 },
                  ]}
                >
                  <View style={styles.bottomSheetHeader}>
                    <Text
                      style={[
                        styles.bottomSheetTitle,
                        {
                          color: colorScheme === "dark" ? "#ffffff" : "#000000",
                        },
                      ]}
                    >
                      Entrar
                    </Text>
                    <TouchableOpacity
                      onPress={handleCloseBottomSheet}
                      style={styles.closeButton}
                    >
                      <Ionicons
                        name="close-circle"
                        size={28}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  {error ? (
                    <Animated.View
                      entering={FadeIn.duration(300)}
                      style={styles.errorContainer}
                    >
                      <Text style={styles.errorText}>{error}</Text>
                    </Animated.View>
                  ) : null}

                  {/* Email Login Form */}
                  <View style={styles.formContainer}>
                    <Animated.View
                      entering={FadeIn.duration(400).delay(100)}
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor:
                            colorScheme === "dark" ? "#2c2c2e" : "#f5f5f5",
                          borderColor: colors.primary + "30",
                          borderWidth: 1,
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
                            color:
                              colorScheme === "dark" ? "#ffffff" : "#000000",
                          },
                        ]}
                        placeholder="Email"
                        placeholderTextColor={
                          colorScheme === "dark" ? "#999999" : "#999999"
                        }
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </Animated.View>

                    <Animated.View
                      entering={FadeIn.duration(400).delay(200)}
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor:
                            colorScheme === "dark" ? "#2c2c2e" : "#f5f5f5",
                          borderColor: colors.primary + "30",
                          borderWidth: 1,
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
                        style={[
                          styles.input,
                          {
                            color:
                              colorScheme === "dark" ? "#ffffff" : "#000000",
                          },
                        ]}
                        placeholder="Senha"
                        placeholderTextColor={
                          colorScheme === "dark" ? "#999999" : "#999999"
                        }
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                      />
                    </Animated.View>

                    <Animated.View entering={FadeIn.duration(300).delay(300)}>
                      <TouchableOpacity
                        style={styles.forgotPasswordContainer}
                        onPress={() => {
                          /* Implementar recuperação de senha */
                        }}
                      >
                        <Text
                          style={[
                            styles.forgotPasswordText,
                            {
                              color: colors.primary,
                            },
                          ]}
                        >
                          Esqueceu sua senha?
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>

                    <Animated.View entering={FadeIn.duration(400).delay(400)}>
                      <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={loading}
                      >
                        <LinearGradient
                          colors={[colors.primary, "#2ab7ca"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.gradientButton}
                        >
                          {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                          ) : (
                            <Text style={styles.loginButtonText}>ENTRAR</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>

                  <Animated.View entering={FadeIn.duration(300).delay(500)}>
                    <View style={styles.dividerContainer}>
                      <View
                        style={[
                          styles.divider,
                          {
                            backgroundColor: colors.primary + "30",
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.dividerText,
                          {
                            color:
                              colorScheme === "dark" ? "#ffffff" : "#000000",
                          },
                        ]}
                      >
                        ou
                      </Text>
                      <View
                        style={[
                          styles.divider,
                          {
                            backgroundColor: colors.primary + "30",
                          },
                        ]}
                      />
                    </View>
                  </Animated.View>

                  {/* Social Login Buttons */}
                  <View style={styles.socialButtonsContainer}>
                    <Animated.View entering={FadeIn.duration(300).delay(600)}>
                      <TouchableOpacity
                        style={[styles.socialButton, styles.appleButton]}
                        onPress={handleAppleLogin}
                      >
                        <FontAwesome name="apple" size={24} color="#FFFFFF" />
                        <Text style={styles.socialButtonText}>
                          Continuar com Apple
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>

                    <Animated.View entering={FadeIn.duration(300).delay(700)}>
                      <TouchableOpacity
                        style={[styles.socialButton, styles.googleButton]}
                        onPress={handleGoogleLogin}
                      >
                        <FontAwesome name="google" size={24} color="#FFFFFF" />
                        <Text style={styles.socialButtonText}>
                          Continuar com Google
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                </Animated.View>
              </BottomSheetScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </BottomSheet>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
    width: width,
    height: height,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appName: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  motivationalContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  motivationalText: {
    fontSize: 28,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  highlightText: {
    color: "#FFEB3B",
    fontWeight: "bold",
  },
  subText: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    opacity: 0.8,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  },
  getStartedButton: {
    width: "80%",
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  gradientButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  getStartedText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginRight: 5,
  },
  loginLink: {
    color: "#FFEB3B",
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomSheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomSheetIndicator: {
    backgroundColor: "#4ecdc4",
    width: 40,
  },
  bottomSheetScrollView: {
    flex: 1,
  },
  bottomSheetScrollViewContent: {
    flexGrow: 1,
  },
  bottomSheetContent: {
    padding: 24,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  bottomSheetTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  errorContainer: {
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  socialButtonsContainer: {
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
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
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 60,
    borderRadius: 30,
    marginBottom: 16,
    paddingHorizontal: 16,
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
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  loginButton: {
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
