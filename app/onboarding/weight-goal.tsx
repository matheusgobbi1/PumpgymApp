import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useNutrition } from "../../context/NutritionContext";
import { validateWeightGoal } from "../../utils/validations";
import OnboardingLayout from "../../components/onboarding/OnboardingLayout";
import Input from "../../components/common/Input";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

export default function WeightGoalScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();

  const [targetWeight, setTargetWeight] = useState<string>(
    nutritionInfo.targetWeight ? nutritionInfo.targetWeight.toString() : ""
  );
  const [error, setError] = useState("");
  const [weightDifference, setWeightDifference] = useState<string>("");
  
  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});
  
  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme]);

  useEffect(() => {
    if (targetWeight && nutritionInfo.weight) {
      const targetWeightNum = parseFloat(targetWeight);
      const currentWeight = nutritionInfo.weight;

      if (!isNaN(targetWeightNum)) {
        const diff = targetWeightNum - currentWeight;
        setWeightDifference(diff.toFixed(1));
      } else {
        setWeightDifference("");
      }
    } else {
      setWeightDifference("");
    }
  }, [targetWeight, nutritionInfo.weight]);

  const handleNext = () => {
    if (targetWeight && nutritionInfo.weight) {
      const targetWeightNum = parseFloat(targetWeight);

      const validation = validateWeightGoal(
        nutritionInfo.weight,
        targetWeightNum
      );

      if (!validation.isValid) {
        setError(validation.message);
        return;
      }

      // Determinar o objetivo com base na diferença de peso
      let goal: "lose" | "maintain" | "gain" = "maintain";
      if (targetWeightNum < nutritionInfo.weight) {
        goal = "lose";
      } else if (targetWeightNum > nutritionInfo.weight) {
        goal = "gain";
      }

      updateNutritionInfo({
        targetWeight: targetWeightNum,
        goal,
      });
      router.push("/onboarding/weight-change-rate" as any);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isNextDisabled = !targetWeight || isNaN(parseFloat(targetWeight));

  return (
    <KeyboardAvoidingView
      key={`keyboard-view-${theme}`}
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <OnboardingLayout
        title="Qual é o seu peso ideal?"
        subtitle="Defina uma meta realista para alcançar seus objetivos"
        currentStep={6}
        totalSteps={10}
        onBack={handleBack}
        onNext={handleNext}
        nextButtonDisabled={isNextDisabled}
        error={error}
      >
        <View key={`input-container-${theme}`} style={styles.inputContainer}>
          <Input
            key={`weight-input-${theme}`}
            label="Peso meta (kg)"
            value={targetWeight}
            onChangeText={setTargetWeight}
            placeholder="70"
            keyboardType="numeric"
            rightIcon="scale-outline"
            iconColor={colors.primary}
            inputContainerStyle={{
              borderRadius: 12,
              borderColor: colors.primary + '40',
              backgroundColor: theme === 'dark' ? 'rgba(28, 154, 190, 0.05)' : 'rgba(255, 255, 255, 0.8)',
            }}
          />

          {weightDifference && (
            <MotiView 
              key={`difference-container-${theme}`} 
              style={[
                styles.differenceContainer,
                {
                  backgroundColor: theme === 'dark' ? 'rgba(28, 154, 190, 0.1)' : 'rgba(28, 154, 190, 0.05)',
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.primary + '40',
                  shadowColor: colors.text,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }
              ]}
              from={{ opacity: 0, scale: 0.9, translateY: 10 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: 300 }}
            >
              <Ionicons
                key={`difference-icon-${theme}`}
                name={
                  parseFloat(weightDifference) > 0
                    ? "trending-up"
                    : parseFloat(weightDifference) < 0
                    ? "trending-down"
                    : "remove"
                }
                size={32}
                color={
                  parseFloat(weightDifference) > 0
                    ? colors.success
                    : parseFloat(weightDifference) < 0
                    ? colors.danger
                    : colors.primary
                }
                style={{ marginBottom: 8 }}
              />
              <Text 
                key={`difference-text-${theme}`}
                style={[
                  styles.differenceText, 
                  { 
                    color: parseFloat(weightDifference) > 0 
                      ? colors.success 
                      : parseFloat(weightDifference) < 0 
                        ? colors.danger 
                        : colors.primary,
                    fontWeight: "600"
                  }
                ]}
              >
                {parseFloat(weightDifference) > 0
                  ? `Ganhar ${weightDifference} kg`
                  : parseFloat(weightDifference) < 0
                  ? `Perder ${Math.abs(parseFloat(weightDifference))} kg`
                  : "Manter o peso atual"}
              </Text>
              
              <Text 
                key={`difference-description-${theme}`}
                style={[
                  styles.differenceDescription, 
                  { color: colors.text + '80' }
                ]}
              >
                {parseFloat(weightDifference) > 0
                  ? "Você precisará aumentar sua ingestão calórica"
                  : parseFloat(weightDifference) < 0
                  ? "Você precisará reduzir sua ingestão calórica"
                  : "Continue com sua ingestão calórica atual"}
              </Text>
            </MotiView>
          )}
        </View>
      </OnboardingLayout>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginTop: 20,
  },
  differenceContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  differenceText: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  differenceDescription: {
    fontSize: 14,
    textAlign: "center",
  },
});
