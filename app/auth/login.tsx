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
          source={require("../../assets/images/fitness-background.jpg")}
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
              entering={FadeInDown.delay(200).duration(800)}
              style={styles.logoContainer}
            >
              <Image
                source={require("../../assets/images/Logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>PumpGym</Text>
            </Animated.View>

            {/* Slogan */}
            <Animated.View
              entering={FadeInDown.delay(400).duration(800)}
              style={styles.sloganContainer}
            >
              <Text style={styles.slogan}>Transforme seu corpo,</Text>
              <Text style={styles.sloganHighlight}>transforme sua vida</Text>
            </Animated.View>

            {/* Botões */}
            <View style={styles.buttonsContainer}>
              <AnimatedTouchableOpacity
                entering={FadeInUp.delay(600).duration(800)}
                style={[
                  styles.button,
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleStartAnonymously}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="rocket-outline"
                  size={20}
                  color="#FFFFFF"
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>COMEÇAR AGORA</Text>
              </AnimatedTouchableOpacity>

              <AnimatedTouchableOpacity
                entering={FadeInUp.delay(700).duration(800)}
                style={[styles.button, styles.secondaryButton]}
                onPress={handleOpenBottomSheet}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="log-in-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.buttonIcon}
                />
                <Text
                  style={[
                    styles.buttonText,
                    styles.secondaryButtonText,
                    { color: colors.primary },
                  ]}
                >
                  ENTRAR
                </Text>
              </AnimatedTouchableOpacity>
            </View>

            {/* Texto de rodapé */}
            <Animated.Text
              entering={FadeIn.delay(900).duration(800)}
              style={styles.footerText}
            >
              Ao continuar, você concorda com nossos Termos de Uso e Política de
              Privacidade
            </Animated.Text>
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
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  sloganContainer: {
    alignItems: "center",
  },
  slogan: {
    fontSize: 24,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "300",
  },
  sloganHighlight: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 8,
  },
  buttonsContainer: {
    width: "100%",
    marginBottom: 20,
    gap: 16,
  },
  button: {
    height: 56,
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
    backgroundColor: "#4ecdc4",
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
  },
  secondaryButtonText: {
    color: "#4ecdc4",
  },
  buttonIcon: {
    marginRight: 8,
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 10,
  },
});
