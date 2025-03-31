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
import { useNutrition } from "../context/NutritionContext";
import { Food, useMeals } from "../context/MealContext";
import { MotiView } from "moti";
import { generateMealSuggestion, NutritionSuggestion } from "../utils/nutritionSuggestionAlgorithm";
import { useLocalSearchParams, useRouter } from "expo-router";
import NutritionSuggestionCard from "../components/nutrition/NutritionSuggestionCard";
import InfoModal from "../components/common/InfoModal";

export default function NutritionSuggestionModal() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo } = useNutrition();
  const { addFoodsToMeal, addFoodToMeal } = useMeals();
  
  // Obter parâmetros da URL
  const { mealId, mealName, mealColor } = useLocalSearchParams();

  // Estados
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<NutritionSuggestion | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [selectedFoods, setSelectedFoods] = useState<Food[]>([]);
  const [applying, setApplying] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Carregar sugestões
  useEffect(() => {
    loadSuggestions();
  }, [mealId]);

  const handleShowInfo = () => {
    Haptics.selectionAsync();
    setShowInfoModal(true);
  };

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      // Verificar se temos informações nutricionais suficientes
      if (!nutritionInfo || !nutritionInfo.calories || !nutritionInfo.protein || !nutritionInfo.carbs || !nutritionInfo.fat) {
        throw new Error("Informações nutricionais insuficientes para gerar sugestões");
      }

      // Obter número de refeições (com valor padrão de 4 se não estiver definido)
      const numMeals = nutritionInfo.meals || 4;
      
      // Criar objeto com objetivos nutricionais do usuário
      const userGoals = {
        calories: nutritionInfo.calories,
        protein: nutritionInfo.protein,
        carbs: nutritionInfo.carbs,
        fat: nutritionInfo.fat,
        meals: numMeals
      };
      
      // Gerar sugestão para esta refeição
      const suggestion = generateMealSuggestion(
        mealId as string, 
        mealName as string, 
        userGoals
      );
      
      // Não pré-selecionar a sugestão
      setSelectedSuggestion(null);
      setSelectedFoods([]);
      
      // Atualizar estado com a sugestão
      setSuggestions(suggestion);
    } catch (error) {
      console.error("Erro ao carregar sugestões:", error);
      
      // Se não foi possível gerar sugestões, definir como null
      setSuggestions(null);
    } finally {
      setLoading(false);
    }
  };

  // Função para alternar seleção de sugestão e armazenar alimentos selecionados
  const handleToggleSuggestion = (suggestionId: string, foods?: Food[]) => {
    Haptics.selectionAsync();
    
    // Se recebemos alimentos, armazená-los
    if (foods) {
      setSelectedFoods(foods);
      
      // Adicionar à seleção se não estiver já selecionado
      if (selectedSuggestion !== suggestionId) {
        setSelectedSuggestion(suggestionId);
      }
      return;
    }
    
    // Comportamento padrão de alternar seleção (para deselecionar)
    setSelectedSuggestion(prev => prev === suggestionId ? null : suggestionId);
    setSelectedFoods([]);
  };

  // Função para fechar o modal
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Aplicar a sugestão selecionada à refeição
  const handleApplySuggestion = async () => {
    if (!selectedSuggestion || selectedFoods.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Atenção", "Selecione a sugestão para aplicar.");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setApplying(true);

      // Adicionar cada alimento individualmente à refeição
      for (const food of selectedFoods) {
        const addFoodResult = addFoodToMeal(mealId as string, food);
        
        // Verificar se a função retorna uma Promise ou não
        if (addFoodResult instanceof Promise) {
          await addFoodResult;
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error("Erro ao aplicar sugestão:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erro", "Não foi possível aplicar a sugestão. Tente novamente.");
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
            Sugestão Nutricional
          </Text>
          <View style={[styles.headerUnderline, { backgroundColor: mealColor as string }]} />
        </View>
        
        <View style={{ width: 40 }} />
      </View>
      
      {/* Conteúdo */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mealInfoContainer}>
          <View style={[
            styles.mealInfo, 
            { 
              backgroundColor: colors.light,
              borderWidth: 1,
              borderColor: colors.border
            }
          ]}>
            <View style={styles.mealInfoRow}>
              <Ionicons 
                name="restaurant-outline" 
                size={22} 
                color={mealColor as string}
                style={styles.mealIcon} 
              />
              <Text style={[styles.mealName, { color: mealColor as string }]}>
                {mealName as string}
              </Text>
            </View>
            
            <View style={[
              styles.nutritionInfoContainer,
              { borderTopColor: colors.border }
            ]}>
              <Ionicons 
                name="nutrition-outline" 
                size={16} 
                color={colors.secondary}
                style={styles.nutritionIcon} 
              />
              <Text style={[styles.nutritionInfo, { color: colors.secondary }]}>
                Baseado no seu perfil nutricional ({nutritionInfo.calories} kcal • P:{nutritionInfo.protein}g C:{nutritionInfo.carbs}g G:{nutritionInfo.fat}g)
              </Text>
            </View>
          </View>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={mealColor as string} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Calculando sugestões nutricionais...
            </Text>
          </View>
        ) : (
          <>
            {!suggestions ? (
              <View style={styles.emptyContainer}>
                <Ionicons 
                  name="nutrition-outline" 
                  size={40} 
                  color={colors.secondary}
                />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Não foi possível gerar sugestões
                </Text>
                <Text style={[styles.emptyText, { color: colors.secondary }]}>
                  Verifique se você completou seu perfil nutricional com informações suficientes.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.sectionTitleContainer}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Sugestão Personalizada
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
                  Selecione e personalize a sugestão abaixo para adicionar à sua refeição:
                </Text>
                
                <View style={styles.suggestionsContainer}>
                  <NutritionSuggestionCard
                    key={suggestions.id}
                    suggestion={suggestions}
                    index={0}
                    isSelected={selectedSuggestion === suggestions.id}
                    mealColor={mealColor as string}
                    theme={theme}
                    onToggleSelection={handleToggleSuggestion}
                  />
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
      
      {/* Botão de aplicar */}
      {suggestions && (
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
                backgroundColor: mealColor as string,
                opacity: applying || !selectedSuggestion ? 0.6 : 1,
              },
            ]}
            onPress={handleApplySuggestion}
            disabled={applying || !selectedSuggestion}
          >
            {applying ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.applyButtonText}>
                  Aplicar Sugestão
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
        title="Sobre as Sugestões Nutricionais"
        subtitle="As sugestões são baseadas no seu perfil e objetivos. Considere também:"
        onClose={() => setShowInfoModal(false)}
        closeButtonText="Entendi"
        topIcon={{
          name: "nutrition-outline",
          color: mealColor as string,
          backgroundColor: `${mealColor}20`,
        }}
        infoItems={[
          {
            title: "Personalização Inteligente",
            description: "As sugestões são calculadas com base no seu perfil nutricional, distribuindo seus macronutrientes diários de forma adequada para cada refeição.",
            icon: "analytics-outline",
            color: mealColor as string,
          },
          {
            title: "Ajuste Fino",
            description: "Você pode personalizar as porções e substituir alimentos conforme sua preferência, mantendo o equilíbrio nutricional ideal.",
            icon: "options-outline",
            color: mealColor as string,
          },
          {
            title: "Variedade",
            description: "Tente variar suas escolhas alimentares para garantir uma ampla gama de nutrientes essenciais. As opções de substituição podem te ajudar a diversificar sua alimentação.",
            icon: "shuffle-outline",
            color: mealColor as string,
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
  mealInfoContainer: {
    padding: 16,
  },
  mealInfo: {
    borderRadius: 12,
    overflow: "hidden",
  },
  mealInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  mealIcon: {
    marginRight: 10,
  },
  mealName: {
    fontSize: 18,
    fontWeight: "700",
  },
  nutritionInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  nutritionIcon: {
    marginRight: 8,
  },
  nutritionInfo: {
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