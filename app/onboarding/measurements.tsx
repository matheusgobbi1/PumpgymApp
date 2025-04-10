import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useNutrition } from "../../context/NutritionContext";
import { validateMeasurements } from "../../utils/validations";
import OnboardingLayout from "../../components/onboarding/OnboardingLayout";
import { useTranslation } from "react-i18next";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");
const ITEM_HEIGHT = 50;

export default function MeasurementsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, updateNutritionInfo } = useNutrition();
  const { t, i18n } = useTranslation();

  // Use sistema métrico por padrão, mas para usuários em inglês,
  // verificamos se é dos EUA para usar imperial por padrão
  const isEnglish = i18n.language.startsWith("en");
  const defaultMetric = !isEnglish;

  const [useMetric, setUseMetric] = useState(defaultMetric);

  // Converter valores armazenados para exibição inicial
  const getInitialHeight = () => {
    if (!nutritionInfo.height) return null;

    if (useMetric) {
      return Math.round(nutritionInfo.height);
    } else {
      // Converter cm para pés e polegadas (arredondado)
      const totalInches = nutritionInfo.height / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return { feet, inches };
    }
  };

  const getInitialWeight = () => {
    if (!nutritionInfo.weight) return null;

    if (useMetric) {
      return Math.round(nutritionInfo.weight);
    } else {
      // Converter kg para libras (arredondado)
      return Math.round(nutritionInfo.weight * 2.20462);
    }
  };

  const [selectedHeight, setSelectedHeight] = useState(getInitialHeight());
  const [selectedWeight, setSelectedWeight] = useState(getInitialWeight());
  const [error, setError] = useState("");

  // Refs para ScrollViews
  const cmScrollRef = useRef<ScrollView>(null);
  const feetScrollRef = useRef<ScrollView>(null);
  const inchesScrollRef = useRef<ScrollView>(null);
  const kgScrollRef = useRef<ScrollView>(null);
  const lbsScrollRef = useRef<ScrollView>(null);

  // Gerar arrays para picker
  const cmArray = Array.from({ length: 221 }, (_, i) => i + 50); // 50-270cm
  const feetArray = Array.from({ length: 8 }, (_, i) => i + 1); // 1-8 pés
  const inchesArray = Array.from({ length: 12 }, (_, i) => i); // 0-11 polegadas
  const kgArray = Array.from({ length: 201 }, (_, i) => i + 30); // 30-230kg
  const lbsArray = Array.from({ length: 401 }, (_, i) => i + 66); // 66-466lbs (~30-~210kg)

  // Valores padrão para iniciar os pickers em posições intermediárias
  const defaultCmValue = 170;
  const defaultKgValue = 70;
  const defaultFeet = 5;
  const defaultInches = 7;
  const defaultLbs = Math.round(defaultKgValue * 2.20462); // ~154 lbs

  // Índices para posicionar os pickers inicialmente
  const initialCmIndex = cmArray.findIndex((value) => value === defaultCmValue);
  const initialKgIndex = kgArray.findIndex((value) => value === defaultKgValue);
  const initialFeetIndex = feetArray.findIndex(
    (value) => value === defaultFeet
  );
  const initialInchesIndex = inchesArray.findIndex(
    (value) => value === defaultInches
  );
  const initialLbsIndex = lbsArray.findIndex((value) => value === defaultLbs);

  // Função para inicializar os pickers quando o componente montar
  useEffect(() => {
    // Definir altura e peso padrão se não houver valor inicial
    if (selectedHeight === null) {
      if (useMetric) {
        setSelectedHeight(defaultCmValue);
      } else {
        setSelectedHeight({ feet: defaultFeet, inches: defaultInches });
      }
    }

    if (selectedWeight === null) {
      if (useMetric) {
        setSelectedWeight(defaultKgValue);
      } else {
        setSelectedWeight(defaultLbs);
      }
    }

    // Curto timeout para garantir que a scrollView esteja renderizada
    const timer = setTimeout(() => {
      // Scroll para os valores padrão
      if (cmScrollRef.current && initialCmIndex >= 0) {
        cmScrollRef.current.scrollTo({
          y: initialCmIndex * ITEM_HEIGHT,
          animated: false,
        });
      }

      if (kgScrollRef.current && initialKgIndex >= 0) {
        kgScrollRef.current.scrollTo({
          y: initialKgIndex * ITEM_HEIGHT,
          animated: false,
        });
      }

      if (feetScrollRef.current && initialFeetIndex >= 0) {
        feetScrollRef.current.scrollTo({
          y: initialFeetIndex * ITEM_HEIGHT,
          animated: false,
        });
      }

      if (inchesScrollRef.current && initialInchesIndex >= 0) {
        inchesScrollRef.current.scrollTo({
          y: initialInchesIndex * ITEM_HEIGHT,
          animated: false,
        });
      }

      if (lbsScrollRef.current && initialLbsIndex >= 0) {
        lbsScrollRef.current.scrollTo({
          y: initialLbsIndex * ITEM_HEIGHT,
          animated: false,
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [useMetric]);

  const handleSystemToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUseMetric(!useMetric);

    // Converter os valores selecionados para o novo sistema
    if (useMetric && selectedHeight !== null) {
      // Converter de métrico para imperial
      const cm = typeof selectedHeight === "number" ? selectedHeight : 170;
      const totalInches = cm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      setSelectedHeight({ feet, inches });
    } else if (!useMetric && selectedHeight !== null) {
      // Converter de imperial para métrico
      const { feet, inches } = selectedHeight as {
        feet: number;
        inches: number;
      };
      const cm = Math.round((feet * 12 + inches) * 2.54);
      setSelectedHeight(cm);
    }

    if (useMetric && selectedWeight !== null) {
      // Converter de kg para lbs
      setSelectedWeight(Math.round((selectedWeight as number) * 2.20462));
    } else if (!useMetric && selectedWeight !== null) {
      // Converter de lbs para kg
      setSelectedWeight(Math.round((selectedWeight as number) / 2.20462));
    }
  };

  const handleNext = () => {
    let heightNum: number;
    let weightNum: number;

    if (useMetric) {
      heightNum = selectedHeight as number;
      weightNum = selectedWeight as number;
    } else {
      // Converter de imperial para métrico para salvar
      const { feet, inches } = selectedHeight as {
        feet: number;
        inches: number;
      };
      heightNum = Math.round((feet * 12 + inches) * 2.54);
      weightNum = Math.round((selectedWeight as number) / 2.20462);
    }

    const validation = validateMeasurements(heightNum, weightNum);

    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateNutritionInfo({
      height: heightNum,
      weight: weightNum,
    });
    router.push("/onboarding/goal" as any);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.back();
  };

  const handleSelectHeight = (value: number) => {
    Haptics.selectionAsync();
    setSelectedHeight(value);
  };

  const handleSelectWeight = (value: number) => {
    Haptics.selectionAsync();
    setSelectedWeight(value);
  };

  const handleSelectFeet = (value: number) => {
    Haptics.selectionAsync();
    setSelectedHeight({
      feet: value,
      inches: selectedHeight ? (selectedHeight as any).inches || 0 : 0,
    });
  };

  const handleSelectInches = (value: number) => {
    Haptics.selectionAsync();
    setSelectedHeight({
      feet: selectedHeight ? (selectedHeight as any).feet || 5 : 5,
      inches: value,
    });
  };

  const isNextDisabled = selectedHeight === null || selectedWeight === null;

  const renderMetricPickers = () => (
    <View style={styles.pickersContainer}>
      <Animated.View
        style={styles.pickerColumn}
        entering={FadeIn.duration(800).delay(100)}
      >
        <Text style={[styles.pickerLabel, { color: colors.text }]}>
          {t("onboarding.measurements.height")}
        </Text>
        <View
          style={[
            styles.pickerContainer,
            {
              backgroundColor: theme === "dark" ? "#1c1c1e" : "#f5f5f5",
              borderColor: colors.border,
            },
          ]}
        >
          <ScrollView
            ref={cmScrollRef}
            style={styles.pickerScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
          >
            {cmArray.map((cm) => (
              <TouchableOpacity
                key={`cm-${cm}`}
                style={[
                  styles.pickerItem,
                  {
                    backgroundColor:
                      selectedHeight === cm
                        ? colors.primary + "20"
                        : "transparent",
                    borderWidth: selectedHeight === cm ? 1 : 0,
                    borderColor:
                      selectedHeight === cm ? colors.primary : "transparent",
                  },
                ]}
                onPress={() => handleSelectHeight(cm)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    {
                      color:
                        selectedHeight === cm ? colors.primary : colors.text,
                      fontWeight: selectedHeight === cm ? "600" : "500",
                    },
                  ]}
                >
                  {cm} cm
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Animated.View>

      <Animated.View
        style={styles.pickerColumn}
        entering={FadeIn.duration(800).delay(200)}
      >
        <Text style={[styles.pickerLabel, { color: colors.text }]}>
          {t("onboarding.measurements.weight")}
        </Text>
        <View
          style={[
            styles.pickerContainer,
            {
              backgroundColor: theme === "dark" ? "#1c1c1e" : "#f5f5f5",
              borderColor: colors.border,
            },
          ]}
        >
          <ScrollView
            ref={kgScrollRef}
            style={styles.pickerScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
          >
            {kgArray.map((kg) => (
              <TouchableOpacity
                key={`kg-${kg}`}
                style={[
                  styles.pickerItem,
                  {
                    backgroundColor:
                      selectedWeight === kg
                        ? colors.primary + "20"
                        : "transparent",
                    borderWidth: selectedWeight === kg ? 1 : 0,
                    borderColor:
                      selectedWeight === kg ? colors.primary : "transparent",
                  },
                ]}
                onPress={() => handleSelectWeight(kg)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    {
                      color:
                        selectedWeight === kg ? colors.primary : colors.text,
                      fontWeight: selectedWeight === kg ? "600" : "500",
                    },
                  ]}
                >
                  {kg} kg
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );

  const renderImperialPickers = () => (
    <View style={styles.pickersContainer}>
      <View style={styles.imperialHeightContainer}>
        <Animated.View
          style={[styles.pickerColumn, { flex: 1 }]}
          entering={FadeIn.duration(800).delay(100)}
        >
          <Text style={[styles.pickerLabel, { color: colors.text }]}>
            {t("onboarding.measurements.feet")}
          </Text>
          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: theme === "dark" ? "#1c1c1e" : "#f5f5f5",
                borderColor: colors.border,
              },
            ]}
          >
            <ScrollView
              ref={feetScrollRef}
              style={styles.pickerScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
            >
              {feetArray.map((feet) => (
                <TouchableOpacity
                  key={`feet-${feet}`}
                  style={[
                    styles.pickerItem,
                    {
                      backgroundColor:
                        selectedHeight && (selectedHeight as any).feet === feet
                          ? colors.primary + "20"
                          : "transparent",
                      borderWidth:
                        selectedHeight && (selectedHeight as any).feet === feet
                          ? 1
                          : 0,
                      borderColor:
                        selectedHeight && (selectedHeight as any).feet === feet
                          ? colors.primary
                          : "transparent",
                    },
                  ]}
                  onPress={() => handleSelectFeet(feet)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      {
                        color:
                          selectedHeight &&
                          (selectedHeight as any).feet === feet
                            ? colors.primary
                            : colors.text,
                        fontWeight:
                          selectedHeight &&
                          (selectedHeight as any).feet === feet
                            ? "600"
                            : "500",
                      },
                    ]}
                  >
                    {feet}'
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>

        <Animated.View
          style={[styles.pickerColumn, { flex: 1, marginLeft: 10 }]}
          entering={FadeIn.duration(800).delay(150)}
        >
          <Text style={[styles.pickerLabel, { color: colors.text }]}>
            {t("onboarding.measurements.inches")}
          </Text>
          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: theme === "dark" ? "#1c1c1e" : "#f5f5f5",
                borderColor: colors.border,
              },
            ]}
          >
            <ScrollView
              ref={inchesScrollRef}
              style={styles.pickerScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
            >
              {inchesArray.map((inches) => (
                <TouchableOpacity
                  key={`inches-${inches}`}
                  style={[
                    styles.pickerItem,
                    {
                      backgroundColor:
                        selectedHeight &&
                        (selectedHeight as any).inches === inches
                          ? colors.primary + "20"
                          : "transparent",
                      borderWidth:
                        selectedHeight &&
                        (selectedHeight as any).inches === inches
                          ? 1
                          : 0,
                      borderColor:
                        selectedHeight &&
                        (selectedHeight as any).inches === inches
                          ? colors.primary
                          : "transparent",
                    },
                  ]}
                  onPress={() => handleSelectInches(inches)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      {
                        color:
                          selectedHeight &&
                          (selectedHeight as any).inches === inches
                            ? colors.primary
                            : colors.text,
                        fontWeight:
                          selectedHeight &&
                          (selectedHeight as any).inches === inches
                            ? "600"
                            : "500",
                      },
                    ]}
                  >
                    {inches}"
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      </View>

      <Animated.View
        style={styles.pickerColumn}
        entering={FadeIn.duration(800).delay(200)}
      >
        <Text style={[styles.pickerLabel, { color: colors.text }]}>
          {t("onboarding.measurements.weight")}
        </Text>
        <View
          style={[
            styles.pickerContainer,
            {
              backgroundColor: theme === "dark" ? "#1c1c1e" : "#f5f5f5",
              borderColor: colors.border,
            },
          ]}
        >
          <ScrollView
            ref={lbsScrollRef}
            style={styles.pickerScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
          >
            {lbsArray.map((lbs) => (
              <TouchableOpacity
                key={`lbs-${lbs}`}
                style={[
                  styles.pickerItem,
                  {
                    backgroundColor:
                      selectedWeight === lbs
                        ? colors.primary + "20"
                        : "transparent",
                    borderWidth: selectedWeight === lbs ? 1 : 0,
                    borderColor:
                      selectedWeight === lbs ? colors.primary : "transparent",
                  },
                ]}
                onPress={() => handleSelectWeight(lbs)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    {
                      color:
                        selectedWeight === lbs ? colors.primary : colors.text,
                      fontWeight: selectedWeight === lbs ? "600" : "500",
                    },
                  ]}
                >
                  {lbs} lbs
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <OnboardingLayout
        title={t("onboarding.measurements.title")}
        subtitle={t("onboarding.measurements.subtitle")}
        currentStep={4}
        totalSteps={10}
        onBack={handleBack}
        onNext={handleNext}
        nextButtonDisabled={isNextDisabled}
        error={error}
      >
        <Animated.View
          style={styles.container}
          entering={FadeInDown.duration(500).springify()}
          key={`measurements-container-${useMetric ? "metric" : "imperial"}`}
        >
          <Animated.View
            style={styles.toggleContainer}
            entering={FadeIn.duration(800)}
          >
            <Text style={[styles.toggleLabel, { color: colors.text }]}>
              {t("onboarding.measurements.imperial")}
            </Text>
            <Switch
              value={useMetric}
              onValueChange={handleSystemToggle}
              trackColor={{ false: colors.border, true: colors.primary + "80" }}
              thumbColor={useMetric ? colors.primary : colors.text}
              ios_backgroundColor={colors.border}
            />
            <Text style={[styles.toggleLabel, { color: colors.text }]}>
              {t("onboarding.measurements.metric")}
            </Text>
          </Animated.View>

          {useMetric ? renderMetricPickers() : renderImperialPickers()}
        </Animated.View>
      </OnboardingLayout>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  toggleLabel: {
    fontSize: 16,
    marginHorizontal: 10,
  },
  pickersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pickerColumn: {
    flex: 0.48,
    alignItems: "center",
  },
  imperialHeightContainer: {
    flex: 0.48,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    textAlign: "center",
  },
  pickerContainer: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    width: "100%",
    height: Math.min(height * 0.25, 200),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pickerScrollView: {
    height: "100%",
  },
  scrollViewContent: {
    paddingVertical: 8,
  },
  pickerItem: {
    width: "100%",
    height: ITEM_HEIGHT,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  pickerItemText: {
    fontSize: 18,
    fontWeight: "500",
  },
});
