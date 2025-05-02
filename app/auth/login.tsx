import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
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
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import LoginBottomSheet from "../../components/auth/LoginBottomSheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../context/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { signInAnonymously } = useAuth();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estado para controlar o índice do bottom sheet
  const [bottomSheetIndex, setBottomSheetIndex] = useState(-1);
  // Estado para controlar o diálogo de seleção de idioma
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

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
      setError("Ocorreu um erro ao iniciar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Função para alternar entre os idiomas disponíveis
  const toggleLanguage = () => {
    // Alternar entre português e inglês
    const newLanguage = currentLanguage === "pt-BR" ? "en-US" : "pt-BR";
    changeLanguage(newLanguage);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <LinearGradient colors={["#000000", "#333333"]} style={styles.container}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

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
          {/* Logo e Nome do App junto com botão de idioma */}
          <View style={styles.headerContainer}>
            <Animated.View
              entering={FadeInDown.delay(100).duration(1000)}
              style={styles.logoContainer}
            >
              <Text style={styles.appName}>{t("login.appName")}</Text>
            </Animated.View>

            <Animated.View
              entering={FadeIn.delay(700).duration(500)}
              style={styles.languageToggleContainer}
            >
              <TouchableOpacity
                style={styles.languageToggleButton}
                onPress={toggleLanguage}
                activeOpacity={0.8}
              >
                <Ionicons name="language-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Espaço vazio para dar mais destaque à imagem de fundo */}
          <View style={styles.spacer} />

          {/* Texto e Botões */}
          <View style={styles.bottomContainer}>
            {/* Texto central */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(1000)}
              style={styles.centralTextContainer}
            >
              {/* Título dividido em duas linhas com estilo condicional */}
              <Text
                style={[
                  styles.titleText,
                  currentLanguage === "pt-BR" && { fontSize: 76 }, // Tamanho menor para PT-BR
                ]}
              >
                {t("login.titleLine1")}
              </Text>
              <Text
                style={[
                  styles.titleTextLarge,
                  currentLanguage === "pt-BR" && {
                    fontSize: 81,
                    lineHeight: 90,
                  },
                ]}
              >
                {t("login.titleLine2")}
              </Text>
              <Text style={styles.subtitleText}>{t("login.subtitle")}</Text>
            </Animated.View>

            {/* Botões */}
            <View style={styles.buttonsContainer}>
              <AnimatedTouchableOpacity
                entering={FadeInUp.delay(400).duration(800)}
                style={[
                  styles.button,
                  styles.primaryButton,
                  { borderColor: colors.tabborder },
                ]}
                onPress={handleStartAnonymously}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>{t("login.startNow")}</Text>
                )}
              </AnimatedTouchableOpacity>

              <AnimatedTouchableOpacity
                entering={FadeInUp.delay(500).duration(800)}
                style={styles.loginLink}
                onPress={handleOpenBottomSheet}
                activeOpacity={0.8}
              >
                <Text style={styles.loginLinkText}>
                  {t("login.alreadyHaveAccount")}{" "}
                  <Text style={styles.loginLinkHighlight}>
                    {t("login.signIn")}
                  </Text>
                </Text>
              </AnimatedTouchableOpacity>
            </View>
          </View>
        </View>

        {/* Login Bottom Sheet */}
        <LoginBottomSheet
          bottomSheetIndex={bottomSheetIndex}
          setBottomSheetIndex={setBottomSheetIndex}
        />
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 48,
    alignItems: "center",
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 78,
    fontFamily: "Anton",
    textTransform: "uppercase",
    letterSpacing: 0,
    textAlign: "center",
    marginBottom: -15,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
  },
  titleTextLarge: {
    color: "#FFFFFF",
    fontSize: 92,
    fontFamily: "Anton",
    textTransform: "uppercase",
    letterSpacing: 0,
    textAlign: "center",
    lineHeight: 110,
    marginTop: 0,
    marginBottom: 0,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  subtitleText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 24,
    fontFamily: "PlayfairDisplay-Italic",
    textAlign: "center",
    maxWidth: "100%",
    lineHeight: 24,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    alignSelf: "center",
  },
  buttonsContainer: {
    width: "100%",
    gap: 4, // Reduzindo o espaçamento entre os botões/links
    alignItems: "center",
  },
  button: {
    height: 60,
    width: "100%",
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 10,
  },
  primaryButton: {
    backgroundColor: "transparent",
    borderWidth: 3,
    height: 60,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0},
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
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
  headerContainer: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: "PlayfairDisplay",
    textTransform: "uppercase",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  languageToggleContainer: {
    position: "absolute",
    right: 20,
  },
  languageToggleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
});
