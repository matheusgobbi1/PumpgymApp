import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import Colors from "../constants/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import Input from "../components/common/Input";
import { useReminders, REMINDER_ICONS } from "../context/ReminderContext";
import { MotiView } from "moti";

const { width } = Dimensions.get("window");

export default function ReminderModal() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { reminders, addReminder, updateReminder, deleteReminder } =
    useReminders();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("water");
  const [color, setColor] = useState("#0096FF");
  const [time, setTime] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const editingReminder = id ? reminders.find((r) => r.id === id) : null;

  useEffect(() => {
    if (editingReminder) {
      setTitle(editingReminder.title);
      setDescription(editingReminder.description || "");
      setIcon(editingReminder.icon);
      setColor(editingReminder.color);
      setTime(editingReminder.time || "");
      setSelectedDays(editingReminder.repeatDays);
    }
  }, [editingReminder]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Erro", "Por favor, adicione um título para o lembrete.");
      return;
    }

    if (selectedDays.length === 0) {
      Alert.alert("Erro", "Por favor, selecione pelo menos um dia da semana.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (editingReminder) {
      updateReminder(editingReminder.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        icon,
        color,
        time: time || undefined,
        repeatDays: selectedDays,
      });
    } else {
      addReminder({
        title: title.trim(),
        description: description.trim() || undefined,
        icon,
        color,
        time: time || undefined,
        repeatDays: selectedDays,
      });
    }

    router.back();
  };

  const handleDelete = () => {
    if (!editingReminder) return;

    Alert.alert(
      "Excluir Lembrete",
      "Tem certeza que deseja excluir este lembrete?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteReminder(editingReminder.id);
            router.back();
          },
        },
      ]
    );
  };

  const renderDayButton = (day: number, label: string) => {
    const isSelected = selectedDays.includes(day);

    return (
      <TouchableOpacity
        key={day}
        style={[
          styles.dayButton,
          {
            backgroundColor: isSelected
              ? color
              : theme === "dark"
              ? colors.card
              : colors.border + "30",
            borderWidth: 1.5,
            borderColor: isSelected ? color : "transparent",
          },
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          if (isSelected) {
            setSelectedDays(selectedDays.filter((d) => d !== day));
          } else {
            setSelectedDays([...selectedDays, day]);
          }
        }}
      >
        <Text
          style={[
            styles.dayButtonText,
            { color: isSelected ? "#FFF" : colors.text },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.card }]}
            onPress={handleClose}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {editingReminder ? "Editar Lembrete" : "Novo Lembrete"}
          </Text>

          {editingReminder && (
            <TouchableOpacity
              style={[
                styles.deleteButton,
                { backgroundColor: colors.danger + "15" },
              ]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </TouchableOpacity>
          )}

          {!editingReminder && <View style={{ width: 40 }} />}
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollViewContent}
        >
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 300 }}
            style={styles.formContainer}
          >
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: color }]}>
                  Detalhes do Lembrete
                </Text>

                <View style={styles.inputWrapper}>
                  <Input
                    label="Título"
                    placeholder="Título do lembrete"
                    value={title}
                    onChangeText={setTitle}
                    maxLength={50}
                    autoCapitalize="sentences"
                    leftIcon="create-outline"
                    floatingLabel
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Input
                    label="Descrição (opcional)"
                    placeholder="Descrição do lembrete"
                    value={description}
                    onChangeText={setDescription}
                    maxLength={200}
                    autoCapitalize="sentences"
                    leftIcon="document-text-outline"
                    floatingLabel
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Input
                    label="Horário (opcional)"
                    placeholder="Ex: 08:00"
                    value={time}
                    onChangeText={setTime}
                    maxLength={5}
                    keyboardType="numbers-and-punctuation"
                    leftIcon="time-outline"
                    floatingLabel
                  />
                </View>
              </View>

              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />

              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: color }]}>
                  Escolha um ícone
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.iconScrollView}
                  contentContainerStyle={styles.iconPickerContent}
                >
                  {REMINDER_ICONS.map((iconOption) => (
                    <TouchableOpacity
                      key={iconOption.name}
                      style={[
                        styles.iconOption,
                        {
                          backgroundColor:
                            icon === iconOption.name
                              ? iconOption.color + "15"
                              : colors.card,
                          borderWidth: 1.5,
                          borderColor:
                            icon === iconOption.name
                              ? iconOption.color
                              : "transparent",
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setIcon(iconOption.name);
                        setColor(iconOption.color);
                      }}
                    >
                      <MaterialCommunityIcons
                        name={iconOption.name as any}
                        size={28}
                        color={iconOption.color}
                      />
                      <Text
                        style={[styles.iconLabel, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {iconOption.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />

              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: color }]}>
                  Repetir em
                </Text>
                <View style={styles.daysContainer}>
                  {renderDayButton(0, "D")}
                  {renderDayButton(1, "S")}
                  {renderDayButton(2, "T")}
                  {renderDayButton(3, "Q")}
                  {renderDayButton(4, "Q")}
                  {renderDayButton(5, "S")}
                  {renderDayButton(6, "S")}
                </View>
              </View>
            </View>
          </MotiView>
        </ScrollView>

        <View
          style={[styles.bottomBar, { backgroundColor: colors.background }]}
        >
          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: color,
              },
              (!title.trim() || selectedDays.length === 0) &&
                styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!title.trim() || selectedDays.length === 0}
          >
            <Text style={styles.saveButtonText}>
              {editingReminder ? "Atualizar" : "Salvar"}
            </Text>
            <Ionicons
              name={editingReminder ? "checkmark-circle" : "add-circle"}
              size={20}
              color="#FFF"
              style={styles.saveButtonIcon}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  formContainer: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  inputWrapper: {
    marginBottom: 1,
  },
  divider: {
    height: 1,
    width: "100%",
  },
  iconScrollView: {
  },
  iconPickerContent: {
    paddingVertical: 1,
    paddingRight: 20,
  },
  iconOption: {
    padding: 10,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    width: 74,
    height: 74,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  iconLabel: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
    textAlign: "center",
    width: "100%",
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  saveButtonIcon: {
    marginLeft: 8,
  },
});
