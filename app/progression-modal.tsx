import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import Colors from "../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useWorkoutContext, Exercise, ExerciseSet } from "../context/WorkoutContext";
import { MotiView } from "moti";
import { generateWorkoutProgressionWithHistory, ProgressionSuggestion } from "../utils/progressionAlgorithm";
import { useLocalSearchParams, useRouter } from "expo-router";
import ProgressionCard from "../components/training/ProgressionCard";
import InfoModal from "../components/common/InfoModal";

export default function ProgressionModal() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { getMultiplePreviousWorkoutsExercises, applyProgressionToWorkout } = useWorkoutContext();
  
  // Obter parâmetros da URL
  const { workoutId, workoutName, workoutColor } = useLocalSearchParams();

  // Estados
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<ProgressionSuggestion[]>([]);
  const [previousDate, setPreviousDate] = useState<string | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [updatedSets, setUpdatedSets] = useState<Record<string, ExerciseSet[]>>({});
  const [applying, setApplying] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

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
    try {
      // Obter múltiplos treinos anteriores (até 4)
      const workoutsHistory = getMultiplePreviousWorkoutsExercises(workoutId as string, 4);
      
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
        setLoading(false);
        return;
      }

      // Usar o primeiro treino do histórico para as sugestões iniciais
      const currentExercises = workoutsHistory[0].exercises;
      
      // Gerar sugestões de progressão usando o histórico completo
      const progressionSuggestions = generateWorkoutProgressionWithHistory(currentExercises, workoutsHistory);
      
      // Não pré-selecionar nenhuma sugestão
      setSelectedExercises([]);
      setUpdatedSets({});
      
      // Atualizar estado com as sugestões
      setSuggestions(progressionSuggestions);
    } catch (error) {
      console.error("Erro ao carregar sugestões:", error);
    } finally {
      setLoading(false);
    }
  };

  // Formatar a data para exibição
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    
    // Usar toLocaleDateString em vez de format
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  // Alternar seleção de sugestão e armazenar sets atualizados
  const toggleSuggestionSelection = (exerciseId: string, updatedSetsList?: ExerciseSet[]) => {
    Haptics.selectionAsync();
    
    // Se recebemos sets atualizados, armazená-los
    if (updatedSetsList) {
      setUpdatedSets(prev => ({
        ...prev,
        [exerciseId]: updatedSetsList
      }));
      
      // Adicionar à seleção se não estiver já selecionado
      if (!selectedExercises.includes(exerciseId)) {
        setSelectedExercises(prev => [...prev, exerciseId]);
      }
      return;
    }
    
    // Comportamento padrão de alternar seleção (para deselecionar)
    setSelectedExercises(prev => {
      if (prev.includes(exerciseId)) {
        // Remover do estado de conjuntos atualizados também
        const newUpdatedSets = { ...updatedSets };
        delete newUpdatedSets[exerciseId];
        setUpdatedSets(newUpdatedSets);
        
        return prev.filter(id => id !== exerciseId);
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
      Alert.alert("Atenção", "Selecione pelo menos uma sugestão para aplicar.");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setApplying(true);

      // Filtrar apenas as sugestões selecionadas
      const selectedProgressions = suggestions.filter(s => 
        selectedExercises.includes(s.exerciseId)
      );

      // Transformar as sugestões em exercícios atualizados
      const updatedExercises: Exercise[] = selectedProgressions.map(suggestion => {
        const exerciseId = suggestion.exerciseId;
        
        // Verificar se temos conjuntos personalizados para este exercício
        const exerciseSets = updatedSets[exerciseId] || suggestion.suggestedSets;
        
        return {
          id: exerciseId,
          name: suggestion.exerciseName,
          sets: exerciseSets,
          category: "força",
        };
      });

      // Aplicar ao treino atual
      const success = await applyProgressionToWorkout(workoutId as string, updatedExercises);

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } else {
        throw new Error("Falha ao aplicar progressão");
      }
    } catch (error) {
      console.error("Erro ao aplicar progressão:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erro", "Não foi possível aplicar as progressões. Tente novamente.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      {/* Cabeçalho */}
      <View style={[styles.header, { 
        backgroundColor: colors.background,
        borderBottomColor: colors.border
      }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          disabled={applying}
        >
          <Ionicons name="chevron-down" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Progressão de Treino
          </Text>
          <View style={[styles.headerUnderline, { backgroundColor: workoutColor as string }]} />
        </View>
        
        <View style={{ width: 40 }} />
      </View>
      
      {/* Conteúdo */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.workoutInfoContainer}>
          <View style={[
            styles.workoutInfo, 
            { 
              backgroundColor: colors.light,
              borderWidth: 1,
              borderColor: colors.border
            }
          ]}>
            <View style={styles.workoutInfoRow}>
              <Ionicons 
                name="barbell-outline" 
                size={22} 
                color={workoutColor as string}
                style={styles.workoutIcon} 
              />
              <Text style={[styles.workoutName, { color: workoutColor as string }]}>
                {workoutName as string}
              </Text>
            </View>
            
            {previousDate && (
              <View style={[
                styles.dateContainer,
                { borderTopColor: colors.border }
              ]}>
                <Ionicons 
                  name="calendar-outline" 
                  size={16} 
                  color={colors.secondary}
                  style={styles.dateIcon} 
                />
                <Text style={[styles.previousDate, { color: colors.secondary }]}>
                  {historyCount > 1 
                    ? `Baseado em ${historyCount} treinos anteriores (último em ${formatDate(previousDate)})` 
                    : `Baseado no treino de ${formatDate(previousDate)}`}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={workoutColor as string} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Calculando progressões...
            </Text>
          </View>
        ) : (
          <>
            {suggestions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons 
                  name="fitness-outline" 
                  size={40} 
                  color={colors.secondary}
                />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Nenhum treino anterior encontrado
                </Text>
                <Text style={[styles.emptyText, { color: colors.secondary }]}>
                  Para sugerir progressões, é necessário ter pelo menos um treino anterior registrado.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.sectionTitleContainer}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Sugestões de Progressão
                  </Text>
                  <TouchableOpacity 
                    onPress={handleShowInfo}
                    hitSlop={{ top: 30, right: 30, bottom: 30, left: 30 }}
                  >
                    <Ionicons 
                      name="information-circle" 
                      size={22} 
                      color="tomato" 
                      style={styles.infoIcon}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.sectionDescription, { color: colors.secondary }]}>
                  Selecione os exercícios que deseja aplicar a progressão sugerida:
                </Text>
                
                <View style={styles.suggestionsContainer}>
                  {suggestions.map((suggestion, index) => (
                    <ProgressionCard
                      key={suggestion.exerciseId}
                      suggestion={suggestion}
                      index={index}
                      isSelected={selectedExercises.includes(suggestion.exerciseId)}
                      workoutColor={workoutColor as string}
                      theme={theme}
                      onToggleSelection={toggleSuggestionSelection}
                    />
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
      
      {/* Botão de aplicar */}
      {suggestions.length > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 300 }}
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
                  Aplicar Progressões ({selectedExercises.length})
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
        </MotiView>
      )}

      {/* Modal de informações */}
      <InfoModal
        visible={showInfoModal}
        title="Sobre as Sugestões"
        subtitle="As sugestões são baseadas no seu histórico de treinos, mas considere também:"
        onClose={() => setShowInfoModal(false)}
        closeButtonText="Entendi"
        topIcon={{
          name: "fitness-outline",
          color: workoutColor as string,
          backgroundColor: `${workoutColor}20`,
        }}
        infoItems={[
          {
            title: "Progressão Inteligente",
            description: "O algoritmo analisa até 4 treinos anteriores para detectar padrões, platôs e sugerir a progressão mais adequada.",
            icon: "analytics-outline",
            color: workoutColor as string,
          },
          {
            title: "Adaptação",
            description: "Ajuste o peso, séries e repetições de acordo com sua capacidade atual, equipamentos disponíveis e disposição física do dia.",
            icon: "body-outline",
            color: workoutColor as string,
          },
          {
            title: "Percepção",
            description: "Utilize sua percepção de esforço como guia principal para determinar a progressão ideal. Tente progredir gradualmente em cada treino, seja aumentando a carga, séries, repetições ou até mesmo a qualidade da técnica de cada repetição.",
            icon: "pulse-outline",
            color: workoutColor as string,
          },
        ]}
      />
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 8 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerUnderline: {
    height: 3,
    width: 40,
    borderRadius: 2,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
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
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginHorizontal: 20,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
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
    marginBottom: 20,
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
}); 