import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { MotiView } from "moti";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useReminders } from "../../context/ReminderContext";
import ConfirmationModal from "../ui/ConfirmationModal";
import { Swipeable } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";

// Tipos para os lembretes
export interface Reminder {
  id: string;
  title: string;
  description?: string;
  icon: string;
  color: string;
  time?: string;
  completed: boolean;
  completedDate?: string;
  createdAt: string;
  repeatDays: number[]; // 0 = domingo, 1 = segunda, ..., 6 = sábado
}

export default function DailyReminders() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { t } = useTranslation();
  const {
    reminders,
    loading,
    toggleCompleted,
    getTodayReminders,
    deleteReminder,
    notificationsEnabled,
  } = useReminders();

  const [isExpanded, setIsExpanded] = useState(false);
  const cardHeight = useSharedValue(250);
  const todayReminders = getTodayReminders();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedReminderId, setSelectedReminderId] = useState<string>("");
  const [initialMount, setInitialMount] = useState(true);

  // Calcular a altura com base no número de lembretes
  React.useEffect(() => {
    // Valores base
    const headerHeight = 60;
    const reminderCardHeight = 80;
    const bottomPadding = 20;
    const dotsHeight = 30;
    const emptyStateHeight = 180; // Altura padrão para o estado vazio

    // Se não há lembretes, altura mínima
    if (todayReminders.length === 0) {
      if (initialMount) {
        cardHeight.value = emptyStateHeight;
        setInitialMount(false);
      } else {
        cardHeight.value = withTiming(emptyStateHeight);
      }
      return;
    }

    // Lembretes a serem exibidos
    const visibleCount = isExpanded
      ? todayReminders.length
      : Math.min(2, todayReminders.length);
    const showDots = !isExpanded && todayReminders.length > 2;

    // Calcular altura total
    const totalHeight =
      headerHeight +
      visibleCount * reminderCardHeight +
      bottomPadding +
      (showDots ? dotsHeight : 0);

    // Aplicar a altura imediatamente na primeira montagem, depois usar animação
    if (initialMount) {
      cardHeight.value = totalHeight;
      setInitialMount(false);
    } else {
      cardHeight.value = withTiming(totalHeight, { duration: 300 });
    }
  }, [isExpanded, todayReminders.length, initialMount]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: cardHeight.value,
    };
  });

  // Função para alternar entre expandido e recolhido
  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  // Função para verificar se deve mostrar o botão de expandir
  const shouldShowExpandButton = () => {
    return todayReminders.length > 2;
  };

  // Abrir a tela de edição de lembrete
  const openEditReminder = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/reminder-modal",
      params: { id },
    });
  };

  // Abrir a tela para criar um novo lembrete
  const openNewReminder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/reminder-modal");
  };

  // Função para excluir o lembrete selecionado
  const handleDeleteReminder = async () => {
    if (selectedReminderId) {
      try {
        await deleteReminder(selectedReminderId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
      } finally {
        setDeleteModalVisible(false);
        setSelectedReminderId("");
      }
    }
  };

  // Renderizar ações de swipe à esquerda (editar)
  const renderLeftActions = useCallback(
    (reminder: Reminder) => (
      <View style={styles.swipeActionContainer}>
        <TouchableOpacity
          style={[
            styles.swipeAction,
            { backgroundColor: reminder.color + "CC" },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            openEditReminder(reminder.id);
          }}
        >
          <Ionicons name="create-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    ),
    []
  );

  // Renderizar ações de swipe à direita (excluir)
  const renderRightActions = useCallback(
    (reminder: Reminder) => (
      <View style={styles.swipeActionContainer}>
        <TouchableOpacity
          style={[
            styles.swipeAction,
            { backgroundColor: colors.danger + "CC" },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedReminderId(reminder.id);
            // Pequeno timeout para melhorar a responsividade
            setTimeout(() => {
              setDeleteModalVisible(true);
            }, 10);
          }}
        >
          <Ionicons name="trash-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    ),
    [colors.danger]
  );

  // Renderizar card de lembrete
  const renderReminderCard = (reminder: Reminder, index: number) => {
    return (
      <Swipeable
        key={reminder.id}
        renderLeftActions={() => renderLeftActions(reminder)}
        renderRightActions={() => renderRightActions(reminder)}
        friction={2}
        overshootRight={false}
        overshootLeft={false}
        containerStyle={styles.swipeableContainer}
      >
        <Animated.View
          style={[
            styles.reminderCard,
            { backgroundColor: colors.light },
            index === 0 && styles.firstReminderItem,
            index ===
              (isExpanded
                ? todayReminders.length - 1
                : Math.min(1, todayReminders.length - 1)) &&
              styles.lastReminderItem,
          ]}
          entering={FadeInRight.delay(index * 100).duration(300)}
        >
          {/* Ícone do lembrete */}
          <View
            style={[
              styles.reminderIconContainer,
              { backgroundColor: reminder.color + "15" },
            ]}
          >
            <MaterialCommunityIcons
              name={reminder.icon as any}
              size={20}
              color={reminder.color}
            />
          </View>

          {/* Conteúdo do lembrete */}
          <View style={styles.reminderContent}>
            <View style={styles.reminderHeader}>
              <View style={styles.titleTimeContainer}>
                <Text
                  style={[
                    styles.reminderTitle,
                    {
                      color: colors.text,
                      textDecorationLine: reminder.completed
                        ? "line-through"
                        : "none",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {reminder.title}
                </Text>

                {reminder.time && (
                  <View style={styles.timeContainer}>
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={colors.text + "80"}
                      style={styles.timeIcon}
                    />
                    <Text
                      style={[
                        styles.reminderTime,
                        { color: colors.text + "90" },
                      ]}
                    >
                      {reminder.time}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {reminder.description && (
              <Text
                style={[
                  styles.reminderDescription,
                  {
                    color: colors.text,
                    opacity: 0.7,
                    textDecorationLine: reminder.completed
                      ? "line-through"
                      : "none",
                  },
                ]}
                numberOfLines={1}
              >
                {reminder.description}
              </Text>
            )}
          </View>

          {/* Botão de completar */}
          <TouchableOpacity
            style={[
              styles.checkButton,
              {
                backgroundColor: reminder.completed
                  ? reminder.color
                  : "transparent",
                borderColor: reminder.color,
              },
            ]}
            onPress={() => toggleCompleted(reminder.id)}
            activeOpacity={0.7}
          >
            {reminder.completed && (
              <Ionicons name="checkmark" size={14} color="#FFF" />
            )}
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    );
  };

  // Função para renderizar itens separador entre lembretes
  const renderSeparator = useCallback(
    (index: number) => {
      if (
        index <
        (isExpanded
          ? todayReminders.length - 1
          : Math.min(1, todayReminders.length - 1))
      ) {
        return (
          <View
            key={`separator-${index}`}
            style={[
              styles.separator,
              {
                backgroundColor:
                  theme === "dark"
                    ? "rgba(255, 255, 255, 0.15)"
                    : "rgba(0, 0, 0, 0.12)",
              },
            ]}
          />
        );
      }
      return null;
    },
    [isExpanded, todayReminders.length, theme]
  );

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: colors.light,
            borderWidth: 1,
            borderColor: colors.border,
          },
          animatedStyle,
        ]}
      >
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.accentGray + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={18}
                color={colors.accentGray}
              />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                {t("dailyReminders.title")}
              </Text>
              <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
                {t("dailyReminders.subtitle", { count: todayReminders.length })}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: colors.accentGray + "20" },
              ]}
              onPress={openNewReminder}
            >
              <Ionicons name="add" size={20} color={colors.accentGray} />
            </TouchableOpacity>

            {shouldShowExpandButton() && (
              <TouchableOpacity
                style={[
                  styles.expandButton,
                  { backgroundColor: colors.accentGray + "20" },
                ]}
                onPress={toggleExpand}
              >
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.accentGray}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Conteúdo */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : todayReminders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={[colors.light, colors.background]}
              style={styles.emptyGradient}
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={20}
                color={colors.accentGray}
                style={{ marginBottom: 6 }}
              />
              <Text style={[styles.emptyText, { color: colors.text + "50" }]}>
                {t("dailyReminders.emptyState.text")}
              </Text>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.remindersContainer}>
            {/* Renderizar os lembretes */}
            {todayReminders
              .slice(0, isExpanded ? undefined : 2)
              .map((reminder, index) => {
                return (
                  <React.Fragment key={`reminder-group-${reminder.id}`}>
                    {renderReminderCard(reminder, index)}
                    {renderSeparator(index)}
                  </React.Fragment>
                );
              })}
          </View>
        )}

        {/* Indicador de mais lembretes */}
        {!isExpanded && todayReminders.length > 2 && (
          <View style={styles.expandIndicator}>
            <View
              style={[
                styles.expandDot,
                { backgroundColor: colors.primary + "40" },
              ]}
            />
            <View
              style={[
                styles.expandDot,
                { backgroundColor: colors.primary + "40" },
              ]}
            />
            <View
              style={[
                styles.expandDot,
                { backgroundColor: colors.primary + "40" },
              ]}
            />
          </View>
        )}
      </Animated.View>

      {/* Modal de confirmação para excluir lembrete */}
      <ConfirmationModal
        visible={deleteModalVisible}
        title={t("dailyReminders.deleteModal.title")}
        message={t("dailyReminders.deleteModal.message")}
        confirmText={t("dailyReminders.deleteModal.confirmText")}
        cancelText={t("dailyReminders.deleteModal.cancelText")}
        confirmType="danger"
        icon="trash-outline"
        onConfirm={handleDeleteReminder}
        onCancel={() => {
          setDeleteModalVisible(false);
          setSelectedReminderId("");
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
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
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  remindersContainer: {
    width: "100%",
    overflow: "hidden",
    paddingBottom: 10,
    paddingHorizontal: 0,
  },
  reminderItemContainer: {
    width: "100%",
    flexDirection: "column",
  },
  reminderCard: {
    padding: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    minHeight: 70,
    overflow: "hidden",
  },
  checkButton: {
    width: 30,
    height: 30,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginLeft: 8,
    alignSelf: "center",
  },
  reminderContent: {
    flex: 1,
    marginHorizontal: 12,
    flexDirection: "column",
    overflow: "hidden",
  },
  reminderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  titleTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeIcon: {
    marginRight: 4,
  },
  reminderTime: {
    fontSize: 11,
    fontWeight: "500",
  },
  reminderDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyContainer: {
    marginVertical: 12,
    borderRadius: 10,
    overflow: "hidden",
    marginHorizontal: 16,
  },
  emptyGradient: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.8,
  },
  loadingContainer: {
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  expandIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  expandDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 2,
    marginTop: 16,
  },
  reminderIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    alignSelf: "center",
  },
  separator: {
    height: 1.5,
    opacity: 0.2,
    marginHorizontal: 16,
    marginVertical: 0,
  },
  actionButtons: {
    flexDirection: "row",
    marginLeft: "auto",
    marginRight: 8,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    height: "100%",
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  swipeActionContainer: {
    height: "100%",
    justifyContent: "center",
    overflow: "hidden",
  },
  swipeableContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 0,
  },
  firstReminderItem: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  lastReminderItem: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
});
