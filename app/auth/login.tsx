import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import LoginBottomSheet from "../../components/auth/LoginBottomSheet";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";

const { width, height } = Dimensions.get("window");

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { signInAnonymously } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estado para controlar o índice do bottom sheet
  const [bottomSheetIndex, setBottomSheetIndex] = useState(-1);

  // Função para fechar o teclado
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Callbacks for bottom sheet
  const handleOpenBottomSheet = useCallback(() => {
    Keyboard.dismiss();
    setTimeout(() => {
      setBottomSheetIndex(0);
    }, 100);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

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

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        {/* Background Image */}
        <ImageBackground
          source={require("../../assets/images/fitness-background.jpeg")}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          {/* Overlay para escurecer a imagem */}
          <View style={styles.overlay} />

          {/* Conteúdo principal */}
          <View
            style={[
              styles.content,
              {
                paddingTop: insets.top + 20,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            {/* Logo e Nome do App */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(1000)}
              style={styles.logoContainer}
            >
              <Text style={styles.appName}>FitFolio</Text>
            </Animated.View>

            {/* Espaço vazio para dar mais destaque à imagem de fundo */}
            <View style={styles.spacer} />

            {/* Texto e Botões */}
            <View style={styles.bottomContainer}>
              {/* Texto central */}
              <Animated.View
                entering={FadeInDown.delay(200).duration(1000)}
                style={styles.centralTextContainer}
              >
                <Text style={styles.titleText}>Acompanhe seu progresso</Text>
                <Text style={styles.subtitleText}>
                  Registre suas refeições e treinos para alcançar suas metas e
                  uma vida mais saudável
                </Text>
              </Animated.View>

              {/* Botões */}
              <View style={styles.buttonsContainer}>
                <AnimatedTouchableOpacity
                  entering={FadeInUp.delay(400).duration(800)}
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleStartAnonymously}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>COMEÇAR AGORA</Text>
                  )}
                </AnimatedTouchableOpacity>

                <AnimatedTouchableOpacity
                  entering={FadeInUp.delay(500).duration(800)}
                  style={styles.loginLink}
                  onPress={handleOpenBottomSheet}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loginLinkText}>
                    Já tem conta?{" "}
                    <Text style={styles.loginLinkHighlight}>Entrar</Text>
                  </Text>
                </AnimatedTouchableOpacity>
              </View>
            </View>

            {/* Texto de rodapé */}
            <Animated.View
              entering={FadeIn.delay(600).duration(800)}
              style={styles.footerContainer}
            >
              <Text style={styles.footerText}>
                Ao continuar, você concorda com nossos{" "}
                <Text
                  style={styles.footerLink}
                  onPress={() => router.push("/terms-of-use")}
                >
                  termos de uso
                </Text>{" "}
                e{" "}
                <Text
                  style={styles.footerLink}
                  onPress={() => router.push("/privacy-policy")}
                >
                  política de privacidade
                </Text>
              </Text>
            </Animated.View>
          </View>
        </ImageBackground>

        {/* Login Bottom Sheet */}
        <LoginBottomSheet
          bottomSheetIndex={bottomSheetIndex}
          setBottomSheetIndex={setBottomSheetIndex}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)", // Overlay mais leve para destacar a imagem
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    padding: 24,
  },
  spacer: {
    flex: 1, // Isso empurra o conteúdo para baixo
  },
  bottomContainer: {
    width: "100%",
    marginBottom: 20,
  },
  centralTextContainer: {
    marginBottom: 24,
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 31,
    fontWeight: "200",
    letterSpacing: 0.1,
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitleText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    fontWeight: "200",
    textAlign: "center",
    maxWidth: "100%",
    lineHeight: 22,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    alignSelf: "center",
  },
  buttonsContainer: {
    width: "100%",
    gap: 8, // Reduzindo o espaçamento para aproximar os botões
    alignItems: "center",
  },
  button: {
    height: 56,
    width: "100%",
    borderRadius: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: "#000000",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "300",
    letterSpacing: 1,
  },
  buttonIcon: {
    marginRight: 8,
  },
  loginLink: {
    padding: 10,
  },
  loginLinkText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    fontWeight: "200",
    textAlign: "center",
  },
  loginLinkHighlight: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  footerContainer: {
    marginBottom: 10,
    alignItems: "center",
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "200",
  },
  footerLink: {
    color: "#FFFFFF",
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
