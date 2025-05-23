import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useNutrition } from "../../context/NutritionContext";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.85;

export default function LoadingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { calculateMacros, nutritionInfo } = useNutrition();
  const { t } = useTranslation();

  const LOADING_STEPS = [
    {
      title: t("onboarding.loading.steps.metabolism.title"),
      description: t("onboarding.loading.steps.metabolism.description"),
      icon: "calculator",
      color: "#FF5A00",
      detail: t("onboarding.loading.steps.metabolism.detail"),
    },
    {
      title: t("onboarding.loading.steps.macros.title"),
      description: t("onboarding.loading.steps.macros.description"),
      icon: "sync",
      color: "#4CAF50",
      detail: t("onboarding.loading.steps.macros.detail"),
    },
    {
      title: t("onboarding.loading.steps.hydration.title"),
      description: t("onboarding.loading.steps.hydration.description"),
      icon: "water",
      color: "#2196F3",
      detail: t("onboarding.loading.steps.hydration.detail"),
    },
    {
      title: t("onboarding.loading.steps.healthScore.title"),
      description: t("onboarding.loading.steps.healthScore.description"),
      icon: "heart",
      color: "#E91E63",
      detail: t("onboarding.loading.steps.healthScore.detail"),
    },
    {
      title: t("onboarding.loading.steps.recommendations.title"),
      description: t("onboarding.loading.steps.recommendations.description"),
      icon: "star",
      color: "#9C27B0",
      detail: t("onboarding.loading.steps.recommendations.detail"),
    },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [calculationComplete, setCalculationComplete] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Animação e progresso dos passos
  useEffect(() => {
    const stepDuration = 1700; // Aumentado para 1.7 segundos por etapa
    let isMounted = true;

    const advanceStep = (step: number) => {
      if (!isMounted) return;

      if (step < LOADING_STEPS.length) {
        setTimeout(() => {
          if (!isMounted) return;

          setCurrentStep(step);
          setCompletedSteps((prev) => [...prev, step]);

          // Feedback Tátil Diferenciado
          try {
            if (step === LOADING_STEPS.length - 1) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else if (step % 3 === 0) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } else if (step % 3 === 1) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } else {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }
          } catch (e) {
          
          }

          // No penúltimo passo, calcular os macros
          if (step === LOADING_STEPS.length - 2) {
            try {
             
              calculateMacros();
            } catch (error) {
              console.error("Erro ao calcular macros:", error);
            }
            setCalculationComplete(true);
          }

          advanceStep(step + 1);
        }, stepDuration);
      }
    };

    advanceStep(0);

    return () => {
      isMounted = false;
    };
  }, [LOADING_STEPS.length, calculateMacros]);

  // Navegar para a tela de resumo após completar os passos
  useEffect(() => {
    const newStepDuration = 1700; // Usar o novo stepDuration
    const initialCascadeDelay = (LOADING_STEPS.length - 1) * 250; // Delay da animação em cascata
    const totalStepTime = LOADING_STEPS.length * newStepDuration; // Tempo total dos passos
    const totalDuration = initialCascadeDelay + totalStepTime; // Tempo total real

    const fadeOutDuration = 500; // Duração do fade-out

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true); // Iniciar fade-out
    }, totalDuration - fadeOutDuration); // Começa a desaparecer *antes* do fim

    const navigationTimer = setTimeout(() => {
      router.replace("/onboarding/summary");
    }, totalDuration); // Navega no tempo original

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(navigationTimer);
    };
  }, [LOADING_STEPS.length, router]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <MotiView
        style={{ flex: 1 }}
        animate={{ opacity: isFadingOut ? 0 : 1 }}
        transition={{ type: "timing", duration: 500 }}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("onboarding.loading.title")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            {t("onboarding.loading.subtitle")}
          </Text>

          <View style={styles.stepsContainer}>
            {LOADING_STEPS.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = completedSteps.includes(index);
              const isNext = index === currentStep + 1;

              return (
                <MotiView
                  key={`step-${step.title}`}
                  from={{
                    opacity: 0,
                    translateX: -20,
                    translateY: 20,
                  }}
                  animate={{
                    opacity: isNext ? 0.7 : 1,
                    translateX: 0,
                    translateY: 0,
                    scale: isActive ? 1.02 : 1,
                  }}
                  transition={{
                    type: "spring",
                    damping: 15,
                    stiffness: 100,
                    delay: index * 250,
                  }}
                  style={[
                    styles.stepCard,
                    {
                      backgroundColor: isActive
                        ? `${step.color}15`
                        : colors.light,
                      borderColor: isActive ? step.color : colors.border,
                      borderWidth: isActive ? 1 : 1,
                    },
                  ]}
                >
                  <View style={styles.stepHeader}>
                    <View style={styles.stepIconContainer}>
                      <Ionicons
                        name={step.icon as any}
                        size={24}
                        color={isActive || isCompleted ? step.color : colors.text}
                      />
                      {isCompleted && (
                        <MotiView
                          from={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          style={styles.checkmark}
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={step.color}
                          />
                        </MotiView>
                      )}
                    </View>

                    <View style={styles.stepContent}>
                      <Text
                        style={[
                          styles.stepTitle,
                          { color: isActive ? step.color : colors.text },
                        ]}
                      >
                        {step.title}
                      </Text>
                      <Text
                        style={[
                          styles.stepDescription,
                          { color: colors.text, opacity: 0.7 },
                        ]}
                      >
                        {step.description}
                      </Text>
                    </View>

                    {isActive && (
                      <MotiView
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={[styles.badge, { backgroundColor: step.color }]}
                      >
                        <Text style={styles.badgeText}>{step.detail}</Text>
                      </MotiView>
                    )}
                  </View>

                  {/* Gradiente animado como fundo */}
                  {isActive && (
                    <MotiView
                      from={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{
                        type: "timing",
                        duration: 1500, // Animação do gradiente permanece 1500ms
                      }}
                      style={{
                        ...StyleSheet.absoluteFillObject,
                        borderRadius: 10,
                        zIndex: -1,
                      }}
                    >
                      <LinearGradient
                        colors={[`${step.color}50`, `${step.color}10`]}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                      />
                    </MotiView>
                  )}
                </MotiView>
              );
            })}
          </View>

          <MotiView
            animate={{
              width: `${((currentStep + 1) / LOADING_STEPS.length) * 100}%`,
            }}
            transition={{
              type: "timing",
              duration: 500,
            }}
            style={[styles.totalProgress, { backgroundColor: colors.primary }]}
          />
        </View>
      </MotiView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    position: "relative",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "Anton-Regular",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    opacity: 0.7,
  },
  stepsContainer: {
    gap: 16,
    marginBottom: 40,
  },
  stepCard: {
    padding: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  checkmark: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "white",
    borderRadius: 8,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  progressBar: {
    height: 2,
    borderRadius: 1,
    marginTop: 12,
  },
  totalProgress: {
    height: 4,
    borderRadius: 2,
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
  },
});
