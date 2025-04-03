import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  TextInput,
  Alert,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { useNutrition, Gender, Goal } from "../../context/NutritionContext";
import { differenceInYears } from "date-fns";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  validateHeight,
  validateWeight,
  validateWeightGoal,
  ValidationResult,
} from "../../utils/validations";
import { ErrorMessage } from "../common/ErrorMessage";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

interface ProfileInfoCardProps {
  onEditPress?: () => void;
}

export default function ProfileInfoCard({ onEditPress }: ProfileInfoCardProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, updateNutritionInfo, saveNutritionInfo } =
    useNutrition();
  const [activeSection, setActiveSection] = useState<"perfil" | "objetivo">(
    "perfil"
  );

  // Estado para controlar o modo de edição inline
  const [isEditMode, setIsEditMode] = useState(false);

  // Estados para os valores em edição
  const [editHeight, setEditHeight] = useState(
    nutritionInfo.height?.toString() || ""
  );
  const [editWeight, setEditWeight] = useState(
    nutritionInfo.weight?.toString() || ""
  );
  const [editTargetWeight, setEditTargetWeight] = useState(
    nutritionInfo.targetWeight?.toString() || ""
  );
  const [editTargetDate, setEditTargetDate] = useState(
    nutritionInfo.targetDate || new Date()
  );

  // Estados para erros de validação
  const [heightError, setHeightError] = useState<string>("");
  const [weightError, setWeightError] = useState<string>("");
  const [targetWeightError, setTargetWeightError] = useState<string>("");

  // Função para traduzir o gênero
  const translateGender = (gender?: Gender) => {
    if (!gender) return t("profile.infoCard.gender.notSpecified");

    return t(`profile.infoCard.gender.${gender}`);
  };

  // Função para traduzir o objetivo
  const translateGoal = (goal?: Goal) => {
    if (!goal) return t("profile.infoCard.goals.notSpecified");

    return t(`profile.infoCard.goals.${goal}`);
  };

  // Função para calcular a idade
  const calculateAge = (birthDate?: Date | string | null) => {
    if (!birthDate) return null;

    const birthDateObj =
      typeof birthDate === "string" ? new Date(birthDate) : birthDate;
    return differenceInYears(new Date(), birthDateObj);
  };

  // Calcular a idade
  const age = calculateAge(nutritionInfo.birthDate);

  // Calcular progresso para o peso alvo
  const calculateWeightProgress = () => {
    if (!nutritionInfo.weight || !nutritionInfo.targetWeight) return null;

    const currentWeight = nutritionInfo.weight;
    const targetWeight = nutritionInfo.targetWeight;
    const initialWeight =
      nutritionInfo.goal === "lose"
        ? Math.max(currentWeight, targetWeight + 10) // Estimativa de peso inicial para perda
        : Math.min(currentWeight, targetWeight - 10); // Estimativa de peso inicial para ganho

    const totalDifference = Math.abs(initialWeight - targetWeight);
    const currentDifference = Math.abs(currentWeight - targetWeight);
    const progress =
      ((totalDifference - currentDifference) / totalDifference) * 100;

    return Math.min(Math.max(progress, 0), 100); // Limitar entre 0 e 100%
  };

  const weightProgress = calculateWeightProgress();

  // Função para alternar entre as seções
  const toggleSection = (section: "perfil" | "objetivo") => {
    if (section !== activeSection) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveSection(section);
    }
  };

  // Obter ícone e cor com base no objetivo
  const getGoalIconAndColor = () => {
    if (!nutritionInfo.goal) return { icon: "remove", color: "#6C757D" };

    const goalIcons = {
      lose: { icon: "trending-down", color: "#EF476F" },
      maintain: { icon: "remove", color: "#118AB2" },
      gain: { icon: "trending-up", color: "#06D6A0" },
    };

    return goalIcons[nutritionInfo.goal];
  };

  const { icon: goalIcon, color: goalColor } = getGoalIconAndColor();

  // Função para validar altura
  const validateHeightInput = (value: string): boolean => {
    const heightValue = parseFloat(value);
    const result = validateHeight(heightValue);
    setHeightError(result.message);
    return result.isValid;
  };

  // Função para validar peso
  const validateWeightInput = (value: string): boolean => {
    const weightValue = parseFloat(value);
    const result = validateWeight(weightValue);
    setWeightError(result.message);
    return result.isValid;
  };

  // Função para validar peso alvo
  const validateTargetWeightInput = (value: string): boolean => {
    const targetWeightValue = parseFloat(value);
    const currentWeightValue = parseFloat(editWeight);

    if (isNaN(currentWeightValue)) {
      setTargetWeightError(t("profile.infoCard.targetWeightError"));
      return false;
    }

    const result = validateWeightGoal(currentWeightValue, targetWeightValue);
    setTargetWeightError(result.message);
    return result.isValid;
  };

  // Função para lidar com a edição
  const handleEditPress = () => {
    if (isEditMode) {
      handleSaveInlineEdit();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsEditMode(true);

      // Limpar erros ao entrar no modo de edição
      setHeightError("");
      setWeightError("");
      setTargetWeightError("");
    }
  };

  // Função para salvar as alterações da edição inline
  const handleSaveInlineEdit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Validar todos os campos
    const isHeightValid = validateHeightInput(editHeight);
    const isWeightValid = validateWeightInput(editWeight);
    const isTargetWeightValid = validateTargetWeightInput(editTargetWeight);

    // Se algum campo for inválido, não prosseguir
    if (!isHeightValid || !isWeightValid || !isTargetWeightValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const heightValue = parseFloat(editHeight);
    const weightValue = parseFloat(editWeight);
    const targetWeightValue = parseFloat(editTargetWeight);

    // Determinar o objetivo automaticamente com base na comparação de pesos
    let automaticGoal: Goal = "maintain";
    if (targetWeightValue < weightValue) {
      automaticGoal = "lose";
    } else if (targetWeightValue > weightValue) {
      automaticGoal = "gain";
    }

    // Atualizar o contexto
    await updateNutritionInfo({
      ...nutritionInfo,
      height: heightValue,
      weight: weightValue,
      targetWeight: targetWeightValue,
      targetDate: editTargetDate,
      goal: automaticGoal, // Atualiza o objetivo automaticamente
    });

    // Salvar no Firebase e AsyncStorage
    await saveNutritionInfo();

    // Sair do modo de edição
    setIsEditMode(false);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Função para cancelar a edição
  const handleCancelEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Restaurar os valores originais
    setEditHeight(nutritionInfo.height?.toString() || "");
    setEditWeight(nutritionInfo.weight?.toString() || "");
    setEditTargetWeight(nutritionInfo.targetWeight?.toString() || "");
    setEditTargetDate(nutritionInfo.targetDate || new Date());

    // Limpar erros
    setHeightError("");
    setWeightError("");
    setTargetWeightError("");

    // Sair do modo de edição
    setIsEditMode(false);
  };

  return (
    <TouchableOpacity
      style={styles.touchable}
      activeOpacity={0.9}
      disabled={isEditMode}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.light,
            borderWidth: 1,
            borderColor: colors.border,
          },
          isEditMode && styles.editModeContainer,
        ]}
      >
        {/* Cabeçalho do Card */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name="human"
                size={18}
                color={colors.primary}
              />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                {t("profile.infoCard.biometricData")}
              </Text>
              <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
                {age ? `${age} ${t("profile.infoCard.years")}` : ""}
                {age && nutritionInfo.gender ? " • " : ""}
                {nutritionInfo.gender
                  ? translateGender(nutritionInfo.gender)
                  : ""}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {onEditPress && (
              <View style={styles.editButtonsContainer}>
                {isEditMode && (
                  <TouchableOpacity
                    style={[
                      styles.editActionButton,
                      styles.cancelButton,
                      { backgroundColor: colors.text + "10" },
                    ]}
                    onPress={handleCancelEdit}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={colors.text + "80"}
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.editActionButton,
                    isEditMode
                      ? styles.saveButton
                      : { backgroundColor: colors.text + "10" },
                    isEditMode && { backgroundColor: colors.primary },
                  ]}
                  onPress={handleEditPress}
                >
                  {isEditMode ? (
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  ) : (
                    <Ionicons
                      name="options-outline"
                      size={20}
                      color={colors.text + "80"}
                    />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Seletor de Seção */}
        <View
          style={[styles.sectionSelector, { backgroundColor: colors.card }]}
        >
          <TouchableOpacity
            style={[
              styles.sectionButton,
              activeSection === "perfil" && [
                styles.activeSectionButton,
                { backgroundColor: colors.primary + "15" },
              ],
            ]}
            onPress={() => toggleSection("perfil")}
          >
            <Ionicons
              name="body-outline"
              size={16}
              color={
                activeSection === "perfil" ? colors.primary : colors.text + "60"
              }
            />
            <Text
              style={[
                styles.sectionButtonText,
                {
                  color:
                    activeSection === "perfil"
                      ? colors.primary
                      : colors.text + "60",
                },
              ]}
            >
              {t("profile.infoCard.measures")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sectionButton,
              activeSection === "objetivo" && [
                styles.activeSectionButton,
                { backgroundColor: colors.primary + "15" },
              ],
            ]}
            onPress={() => toggleSection("objetivo")}
          >
            <Ionicons
              name="flag-outline"
              size={16}
              color={
                activeSection === "objetivo"
                  ? colors.primary
                  : colors.text + "60"
              }
            />
            <Text
              style={[
                styles.sectionButtonText,
                {
                  color:
                    activeSection === "objetivo"
                      ? colors.primary
                      : colors.text + "60",
                },
              ]}
            >
              {t("profile.infoCard.goal")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo da Seção Perfil */}
        {activeSection === "perfil" && (
          <View style={styles.sectionContent}>
            {/* Exibir erros de validação no topo */}
            {isEditMode && (
              <View style={styles.errorsContainer}>
                {heightError && <ErrorMessage message={heightError} />}
                {weightError && <ErrorMessage message={weightError} />}
              </View>
            )}

            {/* Medidas Principais */}
            <View style={styles.statsContainer}>
              {/* Altura */}
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isEditMode
                      ? "rgba(17,138,178,0.05)"
                      : colors.card,
                  },
                ]}
              >
                <View style={styles.statCardContent}>
                  <View
                    style={[
                      styles.statIconContainer,
                      { backgroundColor: "#0765ff" + "15" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="human-male-height"
                      size={20}
                      color="#0765ff"
                    />
                  </View>
                  <View style={styles.statTextContainer}>
                    <Text
                      style={[styles.statLabel, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {t("profile.infoCard.height")}
                    </Text>
                    <View style={styles.editInputContainer}>
                      {isEditMode ? (
                        <>
                          <TextInput
                            style={[
                              styles.editInput,
                              { color: colors.text },
                              heightError ? styles.inputError : null,
                            ]}
                            value={editHeight}
                            onChangeText={(value) => {
                              setEditHeight(value);
                              validateHeightInput(value);
                            }}
                            keyboardType="numeric"
                            maxLength={3}
                            selectTextOnFocus
                            placeholder="170"
                            placeholderTextColor={colors.text + "40"}
                          />
                          <Text
                            style={[
                              styles.statUnit,
                              { color: colors.text + "60" },
                            ]}
                          >
                            cm
                          </Text>
                        </>
                      ) : (
                        <Text
                          style={[styles.statValue, { color: colors.text }]}
                        >
                          {nutritionInfo.height
                            ? `${nutritionInfo.height} cm`
                            : "-- cm"}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              {/* Peso */}
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isEditMode
                      ? "rgba(239,71,111,0.05)"
                      : colors.card,
                  },
                ]}
              >
                <View style={styles.statCardContent}>
                  <View
                    style={[
                      styles.statIconContainer,
                      { backgroundColor: "#FFD16615" },
                    ]}
                  >
                    <FontAwesome5 name="weight" size={18} color="#FFD166" />
                  </View>
                  <View style={styles.statTextContainer}>
                    <Text
                      style={[styles.statLabel, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {t("profile.infoCard.weight")}
                    </Text>
                    <View style={styles.editInputContainer}>
                      {isEditMode ? (
                        <>
                          <TextInput
                            style={[
                              styles.editInput,
                              { color: colors.text },
                              weightError ? styles.inputError : null,
                            ]}
                            value={editWeight}
                            onChangeText={(value) => {
                              setEditWeight(value);
                              validateWeightInput(value);
                            }}
                            keyboardType="numeric"
                            maxLength={5}
                            selectTextOnFocus
                            placeholder="70.5"
                            placeholderTextColor={colors.text + "40"}
                          />
                          <Text
                            style={[
                              styles.statUnit,
                              { color: colors.text + "60" },
                            ]}
                          >
                            kg
                          </Text>
                        </>
                      ) : (
                        <Text
                          style={[styles.statValue, { color: colors.text }]}
                        >
                          {nutritionInfo.weight
                            ? `${nutritionInfo.weight} kg`
                            : "-- kg"}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Conteúdo da Seção Objetivo */}
        {activeSection === "objetivo" && (
          <View style={styles.sectionContent}>
            {/* Exibir erros de validação no topo */}
            {isEditMode && (
              <View style={styles.errorsContainer}>
                {targetWeightError && (
                  <ErrorMessage message={targetWeightError} />
                )}
              </View>
            )}

            {/* Card de Objetivo Principal */}
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: isEditMode
                    ? "rgba(255,209,102,0.05)"
                    : colors.card,
                  width: "100%",
                },
              ]}
            >
              <View style={styles.statCardContent}>
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: goalColor + "20" },
                  ]}
                >
                  <Ionicons
                    name={goalIcon as any}
                    size={20}
                    color={goalColor}
                  />
                </View>
                <View style={styles.statTextContainer}>
                  <Text
                    style={[styles.statLabel, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {t("profile.infoCard.mainGoal")}
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {translateGoal(nutritionInfo.goal)}
                  </Text>
                </View>
              </View>

              {(nutritionInfo.targetWeight || isEditMode) && (
                <View style={styles.weightProgressSection}>
                  <View style={styles.weightValues}>
                    <View>
                      <Text
                        style={[
                          styles.weightLabel,
                          { color: colors.text + "60" },
                        ]}
                      >
                        {t("profile.infoCard.current")}
                      </Text>
                      <Text
                        style={[styles.weightValue, { color: colors.text }]}
                      >
                        {nutritionInfo.weight} kg
                      </Text>
                    </View>
                    <View style={styles.weightTargetContainer}>
                      <Text
                        style={[
                          styles.weightLabel,
                          { color: colors.text + "60" },
                        ]}
                      >
                        {t("profile.infoCard.target")}
                      </Text>
                      {isEditMode ? (
                        <View style={styles.editInputContainer}>
                          <TextInput
                            style={[
                              styles.editInput,
                              styles.targetWeightInput,
                              { color: goalColor },
                              targetWeightError ? styles.inputError : null,
                            ]}
                            value={editTargetWeight}
                            onChangeText={(value) => {
                              setEditTargetWeight(value);
                              validateTargetWeightInput(value);
                            }}
                            keyboardType="numeric"
                            maxLength={5}
                            selectTextOnFocus
                            placeholder="65.0"
                            placeholderTextColor={colors.text + "40"}
                          />
                          <Text
                            style={[
                              styles.statUnit,
                              { color: goalColor + "60" },
                            ]}
                          >
                            kg
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={[styles.weightValue, { color: goalColor }]}
                        >
                          {nutritionInfo.targetWeight} kg
                        </Text>
                      )}
                    </View>
                  </View>

                  {!isEditMode && weightProgress !== null && (
                    <View style={styles.progressContainer}>
                      <View
                        style={[
                          styles.progressBarBg,
                          { backgroundColor: colors.border + "30" },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${weightProgress}%`,
                              backgroundColor: goalColor,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.progressText,
                          { color: colors.text + "70" },
                        ]}
                      >
                        {Math.round(weightProgress)}%{" "}
                        {t("profile.infoCard.completed")}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    width: "100%",
  },
  container: {
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  editModeContainer: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButtonsContainer: {
    flexDirection: "row",
  },
  editActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  cancelButton: {
    marginRight: 4,
  },
  saveButton: {
    // Estilo específico para o botão de salvar
  },
  sectionSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  activeSectionButton: {
    borderRadius: 10,
  },
  sectionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  statUnit: {
    fontSize: 12,
    fontWeight: "500",
  },
  editInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  editInput: {
    fontSize: 16,
    fontWeight: "700",
    padding: 0,
    minWidth: 40,
    maxWidth: 60,
  },
  targetWeightInput: {
    textAlign: "right",
  },
  weightProgressSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  weightValues: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  weightLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  weightValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  weightTargetContainer: {
    alignItems: "flex-end",
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "right",
  },
  inputError: {
    borderBottomWidth: 1,
    borderBottomColor: "#FF4757",
  },
  errorsContainer: {
    marginBottom: 12,
  },
});
