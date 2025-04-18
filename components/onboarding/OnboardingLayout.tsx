import React, { ReactNode, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
  LayoutAnimation,
  UIManager,
  Dimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import Button from "../common/Button";
import OnboardingHeader from "./OnboardingHeader";
import { useTranslation } from "react-i18next";

// Habilitar LayoutAnimation para Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Obter altura da tela
const { height: screenHeight } = Dimensions.get("window");

interface OnboardingLayoutProps {
  title: string;
  subtitle?: string;
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  nextButtonTitle?: string;
  nextButtonDisabled?: boolean;
  children: ReactNode;
  error?: string;
}

export default function OnboardingLayout({
  title,
  subtitle,
  currentStep,
  totalSteps,
  onBack,
  onNext,
  nextButtonTitle,
  nextButtonDisabled = false,
  children,
  error,
}: OnboardingLayoutProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [footerHeight] = useState(
    new Animated.Value(
      Platform.OS === "ios" ? Math.max(insets.bottom + 24, 40) : 48
    )
  );

  // Definir texto do botão "Próximo"
  const buttonTitle = nextButtonTitle || t("onboarding.common.next");

  // Configurar animação de layout
  const configureLayoutAnimation = () => {
    LayoutAnimation.configureNext({
      duration: 300,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
  };

  // Monitorar o estado do teclado
  useEffect(() => {
    const keyboardWillShowListener =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillShow", () => {
            configureLayoutAnimation();
            setIsKeyboardVisible(true);
          })
        : null;

    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        if (Platform.OS === "android") {
          configureLayoutAnimation();
        }
        setIsKeyboardVisible(true);
      }
    );

    const keyboardWillHideListener =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillHide", () => {
            configureLayoutAnimation();
            setIsKeyboardVisible(false);
          })
        : null;

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        if (Platform.OS === "android") {
          configureLayoutAnimation();
        }
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

  // Calcular o padding inferior com base na plataforma
  const bottomPadding = isKeyboardVisible
    ? Platform.OS === "ios"
      ? 8
      : 8 // Reduzir quando o teclado estiver visível
    : Platform.OS === "ios"
    ? Math.max(insets.bottom, 16) // No iOS, usar o inset inferior ou pelo menos 16
    : 24; // No Android, usar um valor fixo maior

  // Altura fixa para o cabeçalho, com base em ter ou não subtítulo
  const headerHeight = subtitle ? 100 : 70;

  // Função para evitar múltiplos cliques no botão de próximo
  const handleNext = () => {
    if (isProcessing) return;

    setIsProcessing(true);
    onNext();

    // Resetar o estado após um pequeno delay
    setTimeout(() => {
      setIsProcessing(false);
    }, 500);
  };

  // Função para evitar múltiplos cliques no botão de voltar
  const handleBack = () => {
    if (isProcessing) return;

    setIsProcessing(true);
    onBack();

    // Resetar o estado após um pequeno delay
    setTimeout(() => {
      setIsProcessing(false);
    }, 500);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["left", "right"]}
    >
      <StatusBar
        backgroundColor={colors.background}
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
        translucent={true}
      />

      <OnboardingHeader
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={handleBack}
      />

      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.mainScrollView}
          contentContainerStyle={[
            styles.mainScrollContent,
            { paddingBottom: isKeyboardVisible ? 8 : bottomPadding + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Cabeçalho com altura fixa */}
            <View style={[styles.headerContainer, { height: headerHeight }]}>
              <Text style={[styles.title, { color: colors.text }]}>
                {title}
              </Text>
              {subtitle && (
                <Text style={[styles.subtitle, { color: colors.text }]}>
                  {subtitle}
                </Text>
              )}
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Conteúdo principal */}
            {children}
          </View>
        </ScrollView>

        <Animated.View
          style={[
            styles.footer,
            {
              paddingBottom: bottomPadding,
              paddingTop: isKeyboardVisible ? 8 : 16,
              backgroundColor: colors.background,
              borderTopWidth: isKeyboardVisible ? 0 : 1,
              height: isKeyboardVisible
                ? Platform.OS === "ios"
                  ? 64
                  : 56
                : Platform.OS === "ios"
                ? Math.max(insets.bottom + 64, 80)
                : 80,
            },
          ]}
        >
          <Button
            title={buttonTitle}
            onPress={handleNext}
            disabled={nextButtonDisabled || isProcessing}
            loading={isProcessing}
            hapticFeedback={
              currentStep === totalSteps ? "notification" : "impact"
            }
            hapticIntensity={currentStep === totalSteps ? "heavy" : "medium"}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  headerContainer: {
    justifyContent: "flex-start",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    lineHeight: 22,
    marginBottom: 8,
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 24,
    borderTopColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
  },
});
