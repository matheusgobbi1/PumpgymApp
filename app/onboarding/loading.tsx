import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useNutrition } from "../../context/NutritionContext";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.85;

const LOADING_STEPS = [
  {
    title: "Calculando Metabolismo",
    description: "Analisando suas necessidades energéticas com Mifflin-St Jeor",
    icon: "calculator",
    color: "#FF5A00",
    detail: "BMR + TDEE",
  },
  {
    title: "Ajustando Macros",
    description: "Otimizando proteínas, carboidratos e gorduras",
    icon: "sync",
    color: "#4CAF50",
    detail: "P/C/G",
  },
  {
    title: "Plano de Hidratação",
    description: "Calculando necessidade hídrica diária",
    icon: "water",
    color: "#2196F3",
    detail: "H2O",
  },
  {
    title: "Health Score",
    description: "Avaliando seus indicadores de saúde",
    icon: "heart",
    color: "#E91E63",
    detail: "Score",
  },
  {
    title: "Recomendações",
    description: "Gerando seu plano personalizado",
    icon: "star",
    color: "#9C27B0",
    detail: "Plano",
  },
];

export default function LoadingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { calculateMacros } = useNutrition();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});
  
  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

  // Animação e progresso dos passos
  useEffect(() => {
    const stepDuration = 1500; // 1.5 segundos por etapa

    const advanceStep = (step: number) => {
      if (step < LOADING_STEPS.length) {
        setTimeout(() => {
          setCurrentStep(step);
          setCompletedSteps((prev) => [...prev, step]);
          advanceStep(step + 1);
        }, stepDuration);
      }
    };

    advanceStep(0);
  }, []);

  // Navegar para a tela de resumo após calcular os macros
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateMacros();
      router.push("/onboarding/summary" as any);
    }, LOADING_STEPS.length * 1500); // Tempo total baseado no número de passos

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView
      key={`loading-container-${theme}`}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View key={`content-container-${theme}`} style={styles.content}>
        <Text key={`title-${theme}`} style={[styles.title, { color: colors.text }]}>
          Preparando seu Plano
        </Text>
        <Text key={`subtitle-${theme}`} style={[styles.subtitle, { color: colors.text }]}>
          Calculando as melhores recomendações para você
        </Text>

        <View key={`steps-container-${theme}`} style={styles.stepsContainer}>
          {LOADING_STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSteps.includes(index);
            const isNext = index === currentStep + 1;

            return (
              <MotiView
                key={`step-${step.title}-${theme}`}
                from={{
                  opacity: 0,
                  translateX: -20,
                }}
                animate={{
                  opacity: isNext ? 0.7 : 1,
                  translateX: 0,
                  scale: isActive ? 1.02 : 1,
                }}
                transition={{
                  type: "timing",
                  duration: 500,
                  delay: index * 200,
                }}
                style={[
                  styles.stepCard,
                  {
                    backgroundColor: isActive
                      ? `${step.color}15`
                      : theme === 'dark' ? colors.dark : colors.background,
                    borderColor: isActive ? step.color : "transparent",
                    borderWidth: 2,
                  },
                ]}
              >
                <View key={`step-header-${index}-${theme}`} style={styles.stepHeader}>
                  <View key={`step-icon-container-${index}-${theme}`} style={styles.stepIconContainer}>
                    <Ionicons
                      key={`step-icon-${index}-${theme}`}
                      name={step.icon as any}
                      size={24}
                      color={isActive || isCompleted ? step.color : colors.text}
                    />
                    {isCompleted && (
                      <MotiView
                        key={`checkmark-${index}-${theme}`}
                        from={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={styles.checkmark}
                      >
                        <Ionicons
                          key={`checkmark-icon-${index}-${theme}`}
                          name="checkmark-circle"
                          size={16}
                          color={step.color}
                        />
                      </MotiView>
                    )}
                  </View>

                  <View key={`step-content-${index}-${theme}`} style={styles.stepContent}>
                    <Text
                      key={`step-title-${index}-${theme}`}
                      style={[
                        styles.stepTitle,
                        { color: isActive ? step.color : colors.text },
                      ]}
                    >
                      {step.title}
                    </Text>
                    <Text
                      key={`step-description-${index}-${theme}`}
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
                      key={`badge-${index}-${theme}`}
                      from={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={[styles.badge, { backgroundColor: step.color }]}
                    >
                      <Text key={`badge-text-${index}-${theme}`} style={styles.badgeText}>{step.detail}</Text>
                    </MotiView>
                  )}
                </View>

                {isActive && (
                  <MotiView
                    key={`progress-bar-${index}-${theme}`}
                    from={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      type: "timing",
                      duration: 1500,
                    }}
                    style={[
                      styles.progressBar,
                      { backgroundColor: step.color },
                    ]}
                  />
                )}
              </MotiView>
            );
          })}
        </View>

        <MotiView
          key={`total-progress-${theme}`}
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
    paddingTop: 60,
    position: "relative",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
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
