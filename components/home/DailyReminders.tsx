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

// Ícones predefinidos para escolher
const REMINDER_ICONS = [
  { name: "water", label: "Água", color: "#0096FF" },
  { name: "pill", label: "Suplemento", color: "#9575CD" },
  { name: "dumbbell", label: "Treino", color: "#FF5252" },
  { name: "nutrition", label: "Refeição", color: "#4CAF50" },
  { name: "timer", label: "Tempo", color: "#FFA000" },
  { name: "bed", label: "Dormir", color: "#78909C" },
  { name: "walk", label: "Caminhar", color: "#FF7043" },
  { name: "scale", label: "Peso", color: "#9C27B0" },
];

export default function DailyReminders() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const {
    reminders,
    loading,
    toggleCompleted,
    getTodayReminders,
    deleteReminder,
  } = useReminders();

  const [isExpanded, setIsExpanded] = useState(false);
  const cardHeight = useSharedValue(250);
  const todayReminders = getTodayReminders();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedReminderId, setSelectedReminderId] = useState<string>("");

  // Calcular a altura com base no número de lembretes
  React.useEffect(() => {
    // Valores base
    const headerHeight = 60;
    const reminderCardHeight = 80;
    const bottomPadding = 20;
    const dotsHeight = 30;

    // Se não há lembretes, altura mínima
    if (todayReminders.length === 0) {
      cardHeight.value = withTiming(200);
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

    // Aplicar animação
    cardHeight.value = withTiming(totalHeight, { duration: 300 });
  }, [isExpanded, todayReminders.length]);

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
        console.error("Erro ao excluir lembrete:", error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
            </View>

            {reminder.time && (
              <View style={styles.timeContainer}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={colors.text + "80"}
                  style={styles.timeIcon}
                />
                <Text
                  style={[styles.reminderTime, { color: colors.text + "90" }]}
                >
                  {reminder.time}
                </Text>
              </View>
            )}

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
          { backgroundColor: colors.light },
          animatedStyle,
        ]}
      >
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={18}
                color={colors.primary}
              />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                Lembretes Diários
              </Text>
              <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
                {todayReminders.length} lembretes hoje
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: colors.primary + "20" },
              ]}
              onPress={openNewReminder}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>

            {shouldShowExpandButton() && (
              <TouchableOpacity
                style={[
                  styles.expandButton,
                  { backgroundColor: colors.text + "10" },
                ]}
                onPress={toggleExpand}
              >
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.text + "80"}
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
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 500 }}
            style={styles.emptyContainer}
          >
            <LinearGradient
              colors={[colors.light, colors.background]}
              style={styles.emptyGradient}
            >
              <Text style={[styles.emptyText, { color: colors.text + "50" }]}>
                Adicione seu primeiro lembrete
              </Text>
            </LinearGradient>
          </MotiView>
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
        title="Excluir Lembrete"
        message="Tem certeza que deseja excluir este lembrete? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
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
    marginVertical: 8,
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginLeft: 8,
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
    marginBottom: 2,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
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
    marginTop: 2,
    lineHeight: 16,
  },
  emptyContainer: {
    marginVertical: 12,
    borderRadius: 10,
    overflow: "hidden",
    marginHorizontal: 16,
  },
  emptyGradient: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
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
