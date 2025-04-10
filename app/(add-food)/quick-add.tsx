import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useMeals } from "../../context/MealContext";
import * as Haptics from "expo-haptics";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "react-i18next";

export default function QuickAddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();
  const { addFoodToMeal } = useMeals();

  // Extrair parâmetros
  const mealId = params.mealId as string;
  const mealColor = (params.mealColor as string) || colors.primary;
  const customName = params.customName as string;

  // Estados para os campos do formulário
  const [foodName, setFoodName] = useState(customName || "");
  const [portion, setPortion] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  // Função para validar os campos
  const isFormValid = () => {
    return (
      foodName.trim() !== "" &&
      portion.trim() !== "" &&
      calories.trim() !== "" &&
      protein.trim() !== "" &&
      carbs.trim() !== "" &&
      fat.trim() !== ""
    );
  };

  // Função para adicionar o alimento
  const handleAddFood = () => {
    if (!isFormValid()) return;

    const newFood = {
      id: uuidv4(),
      name: foodName,
      portion: parseFloat(portion),
      calories: parseFloat(calories),
      protein: parseFloat(protein),
      carbs: parseFloat(carbs),
      fat: parseFloat(fat),
    };

    addFoodToMeal(mealId, newFood);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {t("nutrition.addFood.quickAdd")}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: isFormValid()
                    ? mealColor
                    : colors.text + "40",
                },
              ]}
              onPress={handleAddFood}
              disabled={!isFormValid()}
            >
              <Text style={styles.saveButtonText}>{t("common.add")}</Text>
            </TouchableOpacity>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t("nutrition.addFood.name")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.light, color: colors.text },
                ]}
                placeholder={t("nutrition.addFood.namePlaceholder")}
                placeholderTextColor={colors.text + "80"}
                value={foodName}
                onChangeText={setFoodName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t("nutrition.addFood.portion")} (g)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.light, color: colors.text },
                ]}
                placeholder="100"
                placeholderTextColor={colors.text + "80"}
                value={portion}
                onChangeText={setPortion}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.macrosContainer}>
              <View style={styles.macroInput}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("nutrition.addFood.calories")}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.light, color: colors.text },
                  ]}
                  placeholder="0"
                  placeholderTextColor={colors.text + "80"}
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.macroInput}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("nutrition.addFood.protein")} (g)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.light, color: colors.text },
                  ]}
                  placeholder="0"
                  placeholderTextColor={colors.text + "80"}
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.macroInput}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("nutrition.addFood.carbs")} (g)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.light, color: colors.text },
                  ]}
                  placeholder="0"
                  placeholderTextColor={colors.text + "80"}
                  value={carbs}
                  onChangeText={setCarbs}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.macroInput}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("nutrition.addFood.fat")} (g)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.light, color: colors.text },
                  ]}
                  placeholder="0"
                  placeholderTextColor={colors.text + "80"}
                  value={fat}
                  onChangeText={setFat}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  macrosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  macroInput: {
    width: "48%",
    marginBottom: 20,
  },
});
