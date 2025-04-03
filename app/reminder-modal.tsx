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
  Pressable,
  Modal,
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

export default function ReminderModal() {
  const { t } = useTranslation();
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
  const [activeSection, setActiveSection] = useState<string>("detalhes");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [timePickerFocused, setTimePickerFocused] = useState(false);

  // Formatar hora para exibição
  const formatTime = (date: Date): string => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const editingReminder = id ? reminders.find((r) => r.id === id) : null;

  // Carregar dados do lembrete quando estiver editando
  useEffect(() => {
    if (editingReminder) {
      setTitle(editingReminder.title);
      setDescription(editingReminder.description || "");
      setIcon(editingReminder.icon);
      setColor(editingReminder.color);

      // Se tiver um horário salvo, configurar o seletor com esse horário
      if (editingReminder.time) {
        setTime(editingReminder.time);
        const [hours, minutes] = editingReminder.time.split(":").map(Number);
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        setSelectedTime(date);
      }

      setSelectedDays(editingReminder.repeatDays);
    }
  }, [editingReminder]);

  // Função para lidar com a mudança no seletor de hora
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
      setTimePickerFocused(false);
    }

    if (selectedDate) {
      setSelectedTime(selectedDate);
      setTime(formatTime(selectedDate));
    }
  };

  // Função para abrir o seletor de hora
  const openTimePicker = () => {
    Haptics.selectionAsync();
    setTimePickerFocused(true);
    setShowTimePicker(true);
  };

  // Função para limpar o horário
  const clearTime = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTime("");
  };

  // Função para fechar o picker no iOS
  const closeIOSPicker = (save = false) => {
    if (save) {
      setTime(formatTime(selectedTime));
    }
    setShowTimePicker(false);
    setTimePickerFocused(false);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert(t("common.error"), t("reminders.errors.titleRequired"));
      return;
    }

    if (selectedDays.length === 0) {
      Alert.alert(t("common.error"), t("reminders.errors.daysRequired"));
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
      t("reminders.deleteReminder"),
      t("reminders.deleteConfirmation"),
      [
        {
          text: t("reminders.cancel"),
          style: "cancel",
        },
        {
          text: t("reminders.delete"),
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

  const DayButtonLabel = (day: number): string => {
    const days = [
      t("reminders.weekDays.shortSunday"),
      t("reminders.weekDays.shortMonday"),
      t("reminders.weekDays.shortTuesday"),
      t("reminders.weekDays.shortWednesday"),
      t("reminders.weekDays.shortThursday"),
      t("reminders.weekDays.shortFriday"),
      t("reminders.weekDays.shortSaturday"),
    ];
    return days[day];
  };

  const renderDayButton = (day: number) => {
    const isSelected = selectedDays.includes(day);
    const dayNames = [
      t("reminders.weekDays.sunday"),
      t("reminders.weekDays.monday"),
      t("reminders.weekDays.tuesday"),
      t("reminders.weekDays.wednesday"),
      t("reminders.weekDays.thursday"),
      t("reminders.weekDays.friday"),
      t("reminders.weekDays.saturday"),
    ];
    return (
      <MotiView
        key={day}
        animate={{
          scale: isSelected ? 1.02 : 1,
          opacity: 1,
        }}
        transition={{
          type: "timing",
          duration: 200,
        }}
        style={styles.dayButtonWrapper}
      >
        <Pressable
          style={[
            styles.dayButton,
            {
              backgroundColor: isSelected
                ? color
                : theme === "dark"
                ? colors.card
                : "#f5f5f5",
              borderColor: color,
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
              {
                color: isSelected ? "#FFF" : color,
                opacity: isSelected ? 1 : 0.9,
              },
            ]}
          >
            {DayButtonLabel(day)}
          </Text>
          <Text
            style={[
              styles.dayFullName,
              {
                color: isSelected ? "#FFF" : colors.text,
                opacity: isSelected ? 1 : 0.7,
              },
            ]}
          >
            {dayNames[day]}
          </Text>
          {isSelected && (
            <MotiView
              from={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 300 }}
              style={[styles.checkIndicator, { backgroundColor: "#fff" }]}
            >
              <Ionicons name="checkmark" size={12} color={color} />
            </MotiView>
          )}
        </Pressable>
      </MotiView>
    );
  };

  // Função para renderizar os segmentos de navegação
  const renderSegmentControl = () => {
    const segments = [
      {
        key: "detalhes",
        label: t("reminders.details"),
        icon: "create-outline",
      },
      {
        key: "icone",
        label: t("reminders.icon"),
        icon: "color-palette-outline",
      },
      { key: "agenda", label: t("reminders.days"), icon: "calendar-outline" },
    ];

    return (
      <View style={styles.segmentContainer}>
        {segments.map((segment) => (
          <TouchableOpacity
            key={segment.key}
            style={[
              styles.segmentButton,
              activeSection === segment.key && {
                borderBottomColor: color,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveSection(segment.key);
            }}
          >
            <View style={styles.segmentContent}>
              <Ionicons
                name={segment.icon as any}
                size={18}
                color={activeSection === segment.key ? color : colors.text}
                style={styles.segmentIcon}
              />
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: activeSection === segment.key ? color : colors.text,
                    fontWeight: activeSection === segment.key ? "600" : "400",
                  },
                ]}
              >
                {segment.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
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
        {/* Cabeçalho */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="chevron-down" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {editingReminder
              ? t("reminders.editReminder")
              : t("reminders.newReminder")}
          </Text>

          {editingReminder ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* Seletor de seção */}
        <View
          style={[
            styles.segmentWrapper,
            { backgroundColor: colors.background },
          ]}
        >
          {renderSegmentControl()}
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollViewContent,
            { alignItems: "center" },
          ]}
        >
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 300 }}
            style={[styles.formContainer, { width: "100%", maxWidth: 480 }]}
          >
            {/* Seção Detalhes */}
            {activeSection === "detalhes" && (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: "timing", duration: 300 }}
                style={styles.section}
              >
                <View style={styles.sectionHeaderRow}>
                  <MaterialCommunityIcons
                    name={icon as any}
                    size={28}
                    color={color}
                    style={styles.sectionIcon}
                  />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t("reminders.reminderDetails")}
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <Input
                    label={t("reminders.title")}
                    placeholder={t("reminders.titlePlaceholder")}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={50}
                    autoCapitalize="sentences"
                    leftIcon="create-outline"
                    floatingLabel
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Input
                    label={t("reminders.description")}
                    placeholder={t("reminders.descriptionPlaceholder")}
                    value={description}
                    onChangeText={setDescription}
                    maxLength={200}
                    autoCapitalize="sentences"
                    leftIcon="document-text-outline"
                    floatingLabel
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    {t("reminders.time")}
                  </Text>

                  <Pressable
                    style={[
                      styles.timePickerButton,
                      {
                        backgroundColor:
                          theme === "dark" ? "#2A2A2A" : "#F8F9FA",
                        borderColor: timePickerFocused ? color : colors.border,
                        borderWidth: timePickerFocused ? 2 : 1,
                      },
                    ]}
                    onPress={openTimePicker}
                    onPressIn={() => setTimePickerFocused(true)}
                    onPressOut={() =>
                      !showTimePicker && setTimePickerFocused(false)
                    }
                  >
                    <View style={styles.timePickerContent}>
                      <Ionicons
                        name="time-outline"
                        size={24}
                        color={time ? color : colors.text}
                        style={styles.timeIcon}
                      />

                      <Text
                        style={[
                          styles.timeText,
                          {
                            color: time ? colors.text : colors.text + "80",
                            fontWeight: time ? "500" : "400",
                          },
                        ]}
                      >
                        {time || t("reminders.chooseTime")}
                      </Text>

                      {time ? (
                        <TouchableOpacity
                          style={styles.clearTimeButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            clearTime();
                          }}
                          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        >
                          <Ionicons
                            name="close-circle"
                            size={20}
                            color={colors.text + "AA"}
                          />
                        </TouchableOpacity>
                      ) : (
                        <Ionicons
                          name="chevron-down"
                          size={20}
                          color={colors.text + "80"}
                        />
                      )}
                    </View>
                  </Pressable>

                  {/* TimePicker para Android/iOS */}
                  {showTimePicker && (
                    <>
                      {Platform.OS === "ios" ? (
                        <Modal
                          transparent={true}
                          visible={showTimePicker}
                          animationType="fade"
                          onDismiss={() => setTimePickerFocused(false)}
                        >
                          <Pressable
                            style={styles.modalOverlay}
                            onPress={() => closeIOSPicker(false)}
                          >
                            <View
                              style={[
                                styles.iosPickerContainer,
                                {
                                  backgroundColor:
                                    theme === "dark" ? "#2A2A2A" : "#fff",
                                },
                              ]}
                            >
                              <View style={styles.iosPickerHeader}>
                                <TouchableOpacity
                                  onPress={() => closeIOSPicker(false)}
                                >
                                  <Text
                                    style={[
                                      styles.iosPickerCancel,
                                      { color: colors.text },
                                    ]}
                                  >
                                    {t("reminders.cancel")}
                                  </Text>
                                </TouchableOpacity>

                                <Text
                                  style={[
                                    styles.iosPickerTitle,
                                    { color: colors.text },
                                  ]}
                                >
                                  {t("reminders.chooseTime")}
                                </Text>

                                <TouchableOpacity
                                  onPress={() => closeIOSPicker(true)}
                                >
                                  <Text
                                    style={[
                                      styles.iosPickerDone,
                                      { color: color },
                                    ]}
                                  >
                                    {t("reminders.done")}
                                  </Text>
                                </TouchableOpacity>
                              </View>

                              <DateTimePicker
                                value={selectedTime}
                                mode="time"
                                display="spinner"
                                onChange={(event, date) => {
                                  if (date) handleTimeChange(event, date);
                                  setTimePickerFocused(false);
                                }}
                                textColor={colors.text}
                                locale="pt-BR"
                                minuteInterval={5}
                              />
                            </View>
                          </Pressable>
                        </Modal>
                      ) : (
                        <DateTimePicker
                          value={selectedTime}
                          mode="time"
                          is24Hour={true}
                          display="default"
                          onChange={(event, date) => {
                            if (date) handleTimeChange(event, date);
                            setTimePickerFocused(false);
                          }}
                          minuteInterval={5}
                        />
                      )}
                    </>
                  )}
                </View>
              </MotiView>
            )}

            {/* Seção Ícone */}
            {activeSection === "icone" && (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: "timing", duration: 300 }}
                style={styles.section}
              >
                <View style={styles.sectionHeaderRow}>
                  <MaterialCommunityIcons
                    name={icon as any}
                    size={28}
                    color={color}
                    style={styles.sectionIcon}
                  />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t("reminders.chooseIcon")}
                  </Text>
                </View>

                <View style={styles.iconGridContainer}>
                  <View style={styles.iconGrid}>
                    {REMINDER_ICONS.map((iconOption) => (
                      <MotiView
                        key={iconOption.name}
                        animate={{
                          opacity: 1,
                        }}
                        transition={{
                          type: "timing",
                          duration: 300,
                        }}
                      >
                        <Pressable
                          style={[
                            styles.iconOption,
                            {
                              backgroundColor:
                                icon === iconOption.name
                                  ? iconOption.color + "30"
                                  : iconOption.color + "15",
                              borderWidth: icon === iconOption.name ? 2 : 1,
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
                            color={
                              icon === iconOption.name
                                ? iconOption.color
                                : iconOption.color + "CC"
                            }
                          />
                          <Text
                            style={[
                              styles.iconLabel,
                              {
                                color:
                                  icon === iconOption.name
                                    ? iconOption.color
                                    : colors.text,
                                fontWeight:
                                  icon === iconOption.name ? "600" : "500",
                                opacity: icon === iconOption.name ? 1 : 0.8,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {iconOption.label}
                          </Text>
                        </Pressable>
                      </MotiView>
                    ))}
                  </View>
                </View>
              </MotiView>
            )}

            {/* Seção Dias */}
            {activeSection === "agenda" && (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: "timing", duration: 300 }}
                style={styles.section}
              >
                <View style={styles.sectionHeaderRow}>
                  <MaterialCommunityIcons
                    name="calendar-outline"
                    size={24}
                    color={color}
                    style={styles.sectionIcon}
                  />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t("reminders.weekDaysSelection")}
                  </Text>
                </View>

                <View style={styles.daysContainer}>
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => renderDayButton(day))}
                </View>

                <View style={styles.daysLabelContainer}>
                  <Text style={[styles.daysLabel, { color: colors.text }]}>
                    {selectedDays.length === 0
                      ? t("reminders.tapToSelect")
                      : t("reminders.reminderScheduled", {
                          count: selectedDays.length,
                        })}
                  </Text>
                </View>
              </MotiView>
            )}
          </MotiView>
        </ScrollView>

        {/* Botão de salvar */}
        <View
          style={[styles.bottomBar, { backgroundColor: colors.background }]}
        >
          <View style={styles.bottomBarContent}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: color },
                (!title.trim() || selectedDays.length === 0) &&
                  styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!title.trim() || selectedDays.length === 0}
            >
              <MotiView
                from={{ scale: 0.9, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  duration: 400,
                  dampingRatio: 0.8,
                }}
                style={styles.saveButtonContent}
              >
                <Text style={styles.saveButtonText}>
                  {editingReminder ? "Salvar alterações" : "Criar lembrete"}
                </Text>
                <Ionicons
                  name={editingReminder ? "checkmark" : "add"}
                  size={22}
                  color="#FFF"
                  style={styles.saveButtonIcon}
                />
              </MotiView>
            </TouchableOpacity>
          </View>
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
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.5,
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
  segmentWrapper: {
    paddingHorizontal: 16,
  },
  segmentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  segmentContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.8,
  },
  segmentIcon: {
    marginRight: 6,
  },
  segmentText: {
    fontSize: 15,
  },
  content: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingBottom: 80,
  },
  formContainer: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor:
      Platform.OS === "ios" ? "rgba(255, 255, 255, 0.05)" : undefined,
    padding: 16,
    borderWidth: Platform.OS === "android" ? 1 : 0,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.5,
  },
  inputContainer: {
    marginBottom: 16,
  },
  iconGridContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: 420,
    marginTop: 12,
  },
  iconOption: {
    width: (width - 120) / 3,
    height: (width - 120) / 3,
    maxWidth: 120,
    maxHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    margin: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    padding: 8,
    overflow: "hidden",
  },
  iconLabel: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: 2,
    maxWidth: "100%",
  },
  daysContainer: {
    flexDirection: "column",
    marginVertical: 16,
    width: "100%",
  },
  dayButtonWrapper: {
    width: "100%",
    marginBottom: 10,
  },
  dayButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dayButtonText: {
    fontSize: 18,
    fontWeight: "700",
    width: 30,
    textAlign: "center",
  },
  dayFullName: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 16,
    flex: 1,
  },
  checkIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  daysLabelContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  daysLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  bottomBar: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
    alignItems: "center",
  },
  bottomBarContent: {
    width: "100%",
    maxWidth: 480,
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
  saveButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  timePickerButton: {
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timePickerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  timeIcon: {
    marginRight: 12,
  },
  timeText: {
    fontSize: 16,
    flex: 1,
  },
  clearTimeButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  iosPickerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  iosPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
  },
  iosPickerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  iosPickerCancel: {
    fontSize: 16,
    opacity: 0.7,
  },
  iosPickerDone: {
    fontSize: 16,
    fontWeight: "600",
  },
  iconCheckIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
});
