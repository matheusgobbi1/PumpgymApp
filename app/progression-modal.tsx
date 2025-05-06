import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import Colors from "../constants/Colors";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  useWorkoutContext,
  Exercise,
  ExerciseSet,
  WorkoutTotals,
} from "../context/WorkoutContext";
import {
  generateWorkoutProgressionWithHistory,
  ProgressionSuggestion,
} from "../utils/progressionAlgorithm";
import { useLocalSearchParams, useRouter } from "expo-router";
import ProgressionCard from "../components/training/ProgressionCard";
import InfoModal from "../components/common/InfoModal";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { format } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEYS } from "../constants/keys";
import ProgressionSummaryCard from "../components/training/ProgressionSummaryCard";
import { BlurView } from "expo-blur";

// Constantes para animação do header e card
const { width } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = 180;
const HEADER_MIN_HEIGHT = 55;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
const CARD_HEIGHT = 60; // Altura aproximada do card de resumo

export default function ProgressionModal() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const {
    getMultiplePreviousWorkoutsExercises,
    applyProgressionToWorkout,
    getPreviousWorkoutTotals,
  } = useWorkoutContext();
  const { t } = useTranslation();

  // Referência e estado para animação do scroll
  const scrollY = useRef(new Animated.Value(0)).current;

  // Obter parâmetros da URL
  const { workoutId, workoutName, workoutColor } = useLocalSearchParams();

  // Estados
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<ProgressionSuggestion[]>([]);
  const [previousDate, setPreviousDate] = useState<string | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [updatedSets, setUpdatedSets] = useState<Record<string, ExerciseSet[]>>(
    {}
  );
  const [applying, setApplying] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [previousWorkoutData, setPreviousWorkoutData] = useState<{
    totals: WorkoutTotals | null;
    date: string | null;
  }>({ totals: null, date: null });

  // Calculando os valores de animação
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.5, HEADER_SCROLL_DISTANCE * 0.7],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });

  const heroContentOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.3, HEADER_SCROLL_DISTANCE * 0.5],
    outputRange: [1, 0.3, 0],
    extrapolate: "clamp",
  });

  const heroContentTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.5],
    outputRange: [0, -20],
    extrapolate: "clamp",
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.85],
    extrapolate: "clamp",
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -3],
    extrapolate: "clamp",
  });

  // Carregar exercícios e gerar sugestões
  useEffect(() => {
    loadSuggestions();
  }, [workoutId]);

  const handleShowInfo = () => {
    Haptics.selectionAsync();
    setShowInfoModal(true);
  };

  const loadSuggestions = async () => {
    setLoading(true);
    setPreviousWorkoutData({ totals: null, date: null }); // Resetar antes de carregar
    try {
      // Obter múltiplos treinos anteriores (até 4)
      const workoutsHistory = getMultiplePreviousWorkoutsExercises(
        workoutId as string,
        4
      );

      // Obter totais e data do treino mais recente
      const previousData = getPreviousWorkoutTotals(workoutId as string);
      setPreviousWorkoutData(previousData);

      // Armazenar a quantidade de histórico encontrada
      setHistoryCount(workoutsHistory.length);

      // Definir a data do treino mais recente (se houver)
      if (workoutsHistory.length > 0) {
        setPreviousDate(workoutsHistory[0].date);
      } else {
        setPreviousDate(null);
      }

      if (workoutsHistory.length === 0) {
        setSuggestions([]);
      } else {
        // Usar o primeiro treino do histórico para as sugestões iniciais
        const currentExercises = workoutsHistory[0].exercises;

        // Gerar sugestões de progressão usando o histórico completo
        const progressionSuggestions = generateWorkoutProgressionWithHistory(
          currentExercises,
          workoutsHistory
        );

        // Não pré-selecionar nenhuma sugestão
        setSelectedExercises([]);
        setUpdatedSets({});

        // Atualizar estado com as sugestões
        setSuggestions(progressionSuggestions);
      }
    } catch (error) {
      console.error("Erro ao carregar sugestões:", error);
      setSuggestions([]);
      setPreviousWorkoutData({ totals: null, date: null }); // Garantir estado limpo em caso de erro
    } finally {
      setLoading(false);
    }
  };

  // Formatar a data para exibição
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";

    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    // Usar o idioma atual do aplicativo para formatação de data
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  // Alternar seleção de sugestão e armazenar sets atualizados
  const toggleSuggestionSelection = (
    exerciseId: string,
    updatedSetsList?: ExerciseSet[]
  ) => {
    Haptics.selectionAsync();

    // Se recebemos sets atualizados, armazená-los
    if (updatedSetsList) {
      setUpdatedSets((prev) => ({
        ...prev,
        [exerciseId]: updatedSetsList,
      }));

      // Adicionar à seleção se não estiver já selecionado
      if (!selectedExercises.includes(exerciseId)) {
        setSelectedExercises((prev) => [...prev, exerciseId]);
      }
      return;
    }

    // Comportamento padrão de alternar seleção (para deselecionar)
    setSelectedExercises((prev) => {
      if (prev.includes(exerciseId)) {
        // Remover do estado de conjuntos atualizados também
        const newUpdatedSets = { ...updatedSets };
        delete newUpdatedSets[exerciseId];
        setUpdatedSets(newUpdatedSets);

        return prev.filter((id) => id !== exerciseId);
      } else {
        return [...prev, exerciseId];
      }
    });
  };

  // Função para fechar o modal
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Aplicar as sugestões selecionadas ao treino atual
  const handleApplySuggestions = async () => {
    if (selectedExercises.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        t("progression.modal.alert.attention"),
        t("progression.modal.alert.selectAtLeastOne")
      );
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setApplying(true);

      // Filtrar apenas as sugestões selecionadas
      const selectedProgressions = suggestions.filter((s) =>
        selectedExercises.includes(s.exerciseId)
      );

      // Transformar as sugestões em exercícios atualizados
      const updatedExercises: Exercise[] = selectedProgressions.map(
        (suggestion) => {
          const exerciseId = suggestion.exerciseId;

          // Verificar se temos conjuntos personalizados para este exercício
          const exerciseSets =
            updatedSets[exerciseId] || suggestion.suggestedSets;

          return {
            id: exerciseId,
            name: suggestion.exerciseName,
            sets: exerciseSets,
            category: "força",
          };
        }
      );

      // Aplicar ao treino atual
      const success = await applyProgressionToWorkout(
        workoutId as string,
        updatedExercises
      );

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } else {
        throw new Error("Falha ao aplicar progressão");
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        t("progression.modal.alert.error"),
        t("progression.modal.alert.applyFailed")
      );
    } finally {
      setApplying(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
      >
        {/* Header fixo que inclui gradiente e o novo card */}
        <View style={styles.fixedHeaderContainer}>
          {/* Cabeçalho com gradiente colapsável */}
          <Animated.View
            style={[styles.gradientHeaderContainer, { height: headerHeight }]}
          >
            <LinearGradient
              colors={[
                workoutColor as string,
                (workoutColor + "90") as string,
                (workoutColor + "40") as string,
              ]}
              style={[styles.headerGradient, { flex: 1 }]}
            >
              {/* Adicionar BlurView para o efeito de fundo */}
              <BlurView
                intensity={40} // Intensidade reduzida
                tint={theme === "dark" ? "dark" : "light"} // Ajuste o tint baseado no tema
                style={StyleSheet.absoluteFill} // Preencher todo o gradiente
              />

              {/* Cabeçalho de navegação */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  disabled={loading || applying}
                >
                  <Ionicons name="chevron-down" size={28} color="#FFF" />
                </TouchableOpacity>

                <Animated.Text
                  style={[
                    styles.headerTitle,
                    {
                      opacity: headerTitleOpacity,
                      transform: [
                        { scale: titleScale },
                        { translateY: titleTranslateY },
                      ],
                    },
                  ]}
                >
                  {workoutName as string}
                </Animated.Text>

                <TouchableOpacity
                  style={styles.infoButton}
                  onPress={handleShowInfo}
                  disabled={loading || applying}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={28}
                    color="#FFF"
                  />
                </TouchableOpacity>
              </View>

              {/* Conteúdo do cabeçalho - desaparece ao rolar */}
              <Animated.View
                style={[
                  styles.gradientContent,
                  {
                    opacity: heroContentOpacity,
                    transform: [{ translateY: heroContentTranslate }],
                  },
                ]}
              >
                <Ionicons
                  name="barbell"
                  size={32}
                  color="#fff"
                  style={styles.headerIcon}
                />
                <Text style={styles.headerGradientTitle}>
                  {workoutName as string}
                </Text>
                {previousWorkoutData.date && (
                  <Text style={styles.headerGradientSubtitle}>
                    {historyCount > 1
                      ? t("progression.modal.basedOnCount", {
                          count: historyCount,
                          defaultValue: `Baseado nos últimos ${historyCount} treinos`,
                        })
                      : t("progression.modal.basedOnLast", {
                          defaultValue: "Baseado no último treino",
                        })}
                  </Text>
                )}
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          {/* Card de resumo fixo abaixo do header */}
          {!loading && previousWorkoutData.totals && (
            <View
              style={[
                styles.fixedCardContainer,
                { backgroundColor: colors.background },
              ]}
            >
              <ProgressionSummaryCard
                previousWorkoutData={previousWorkoutData}
                workoutColor={workoutColor as string}
                theme={theme}
              />
            </View>
          )}
        </View>

        <Animated.ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            {
              paddingTop: HEADER_MAX_HEIGHT + CARD_HEIGHT,
              minHeight: Dimensions.get("window").height * 1.2,
            },
          ]}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={workoutColor as string} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                {t("progression.modal.calculating")}
              </Text>
            </View>
          ) : (
            <>
              {suggestions.length === 0 && !previousWorkoutData.totals ? (
                <View style={styles.emptyContainer}>
                  <FontAwesome5
                    name="dumbbell"
                    size={80}
                    color={colors.primary}
                  />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    {t("progression.modal.noWorkoutsFound")}
                  </Text>
                  <Text style={[styles.emptyText, { color: colors.secondary }]}>
                    {t("progression.modal.noWorkoutsDescription")}
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.sectionTitleContainer}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      {t("progression.modal.suggestionsTitle")}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.sectionDescription,
                      { color: colors.secondary },
                    ]}
                  >
                    {t("progression.modal.selectExercisesDescription")}
                  </Text>

                  <View style={styles.suggestionsContainer}>
                    {suggestions.map((suggestion, index) => (
                      <ProgressionCard
                        key={suggestion.exerciseId}
                        suggestion={suggestion}
                        index={index}
                        isSelected={selectedExercises.includes(
                          suggestion.exerciseId
                        )}
                        workoutColor={workoutColor as string}
                        theme={theme}
                        onToggleSelection={toggleSuggestionSelection}
                      />
                    ))}
                  </View>
                  {suggestions.length === 0 && previousWorkoutData.totals && (
                    <View style={styles.emptyContainer}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={40}
                        color={colors.secondary}
                      />
                      <Text style={[styles.emptyTitle, { color: colors.text }]}>
                        {t("progression.modal.noSuggestions")}
                      </Text>
                      <Text
                        style={[styles.emptyText, { color: colors.secondary }]}
                      >
                        {t("progression.modal.noSuggestionsDescription")}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </Animated.ScrollView>

        {/* Botão de aplicar */}
        {suggestions.length > 0 && (
          <View
            style={[
              styles.bottomBar,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.applyButton,
                {
                  backgroundColor: workoutColor as string,
                  opacity: applying || selectedExercises.length === 0 ? 0.6 : 1,
                },
              ]}
              onPress={handleApplySuggestions}
              disabled={applying || selectedExercises.length === 0}
            >
              {applying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.applyButtonText}>
                    {t("progression.modal.applyProgressions", {
                      count: selectedExercises.length,
                    })}
                  </Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#FFFFFF"
                    style={styles.applyButtonIcon}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Modal de informações */}
        <InfoModal
          visible={showInfoModal}
          title={t("progression.infoModal.title")}
          subtitle={t("progression.infoModal.subtitle")}
          onClose={() => setShowInfoModal(false)}
          closeButtonText={t("progression.infoModal.gotIt")}
          topIcon={{
            name: "fitness-outline",
            color: workoutColor as string,
            backgroundColor: `${workoutColor}20`,
          }}
          infoItems={[
            {
              title: t("progression.infoModal.items.smartProgression.title"),
              description: t(
                "progression.infoModal.items.smartProgression.description"
              ),
              icon: "analytics-outline",
              color: workoutColor as string,
            },
            {
              title: t("progression.infoModal.items.adaptation.title"),
              description: t(
                "progression.infoModal.items.adaptation.description"
              ),
              icon: "body-outline",
              color: workoutColor as string,
            },
            {
              title: t("progression.infoModal.items.perception.title"),
              description: t(
                "progression.infoModal.items.perception.description"
              ),
              icon: "pulse-outline",
              color: workoutColor as string,
            },
          ]}
        />
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
  fixedHeaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "transparent",
  },
  gradientHeaderContainer: {
    overflow: "hidden",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
  },
  headerGradient: {
    paddingHorizontal: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.5,
    color: "#FFF",
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  gradientContent: {
    alignItems: "center",
    paddingTop: 5,
    paddingBottom: 25,
  },
  headerIcon: {
    marginBottom: 12,
  },
  headerGradientTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  headerGradientSubtitle: {
    fontSize: 16,
    color: "#FFF",
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 140,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 34,
    fontFamily: "Anton-Regular",
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginHorizontal: 20,
    maxWidth: 300,
    fontWeight: "400",
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  infoIcon: {
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    lineHeight: 20,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    marginBottom: 0,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  applyButtonIcon: {
    marginLeft: 8,
  },
  workoutInfoContainer: {
    padding: 16,
  },
  workoutInfo: {
    borderRadius: 12,
    overflow: "hidden",
  },
  workoutInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  workoutIcon: {
    marginRight: 10,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: "700",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  dateIcon: {
    marginRight: 8,
  },
  previousDate: {
    fontSize: 14,
  },
  fixedCardContainer: {
    zIndex: 9,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
