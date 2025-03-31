import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { NutritionSuggestion, SuggestedFood, adjustFoodPortion, adjustFoodUnit, recalculateSuggestionWithFoodChange } from "../../utils/nutritionSuggestionAlgorithm";
import { findFoodById, getFoodSubstitutes } from "../../data/nutritionSuggestionDatabase";
import { useNutrition } from "../../context/NutritionContext";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

interface NutritionSuggestionConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (foods: any[]) => void;
  suggestion: NutritionSuggestion;
  mealColor: string;
  theme: "light" | "dark";
}

export default function NutritionSuggestionConfirmDialog({
  visible,
  onClose,
  onConfirm,
  suggestion,
  mealColor,
  theme,
}: NutritionSuggestionConfirmDialogProps) {
  const colors = Colors[theme];
  const { nutritionInfo } = useNutrition();
  
  // Estado para controlar a sugestão atual (que pode ser modificada pelo usuário)
  const [currentSuggestion, setCurrentSuggestion] = useState<NutritionSuggestion>(suggestion);
  const [isLoading, setIsLoading] = useState(false);
  const [showSubstituteModal, setShowSubstituteModal] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [substitutes, setSubstitutes] = useState<any[]>([]);
  const [portionInputs, setPortionInputs] = useState<Record<string, string>>({});
  const [unitInputs, setUnitInputs] = useState<Record<string, string>>({});

  // Resetar o estado quando a sugestão muda
  useEffect(() => {
    if (visible) {
      setCurrentSuggestion(suggestion);
      
      // Inicializar os inputs de porção e unidades com os valores atuais
      const initialPortionInputs: Record<string, string> = {};
      const initialUnitInputs: Record<string, string> = {};
      
      suggestion.suggestedFoods.forEach(item => {
        initialPortionInputs[item.food.id] = item.calculatedPortion.toString();
        
        if (item.food.measurementUnit && 
            item.food.measurementUnit !== 'g' && 
            item.calculatedUnits !== undefined) {
          initialUnitInputs[item.food.id] = item.calculatedUnits.toString();
        }
      });
      
      setPortionInputs(initialPortionInputs);
      setUnitInputs(initialUnitInputs);
    }
  }, [suggestion, visible]);

  // Função para confirmar a sugestão
  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Converter sugestão para formato de alimentos
      const foods = currentSuggestion.suggestedFoods.map(item => {
        const portionRatio = item.calculatedPortion / item.food.portion;
        
        return {
          id: item.food.id,
          name: item.food.name,
          portion: item.calculatedPortion,
          calories: Math.round(item.food.calories * portionRatio),
          protein: Math.round(item.food.protein * portionRatio * 10) / 10,
          carbs: Math.round(item.food.carbs * portionRatio * 10) / 10,
          fat: Math.round(item.food.fat * portionRatio * 10) / 10
        };
      });
      
      onConfirm(foods);
      
    } catch (error) {
      console.error("Erro ao confirmar sugestão:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para abrir o modal de substituição
  const handleShowSubstitutes = (foodId: string) => {
    const food = findFoodById(foodId);
    if (!food) return;
    
    // Obter substitutos
    const foodSubstitutes = getFoodSubstitutes(foodId);
    setSubstitutes(foodSubstitutes);
    setSelectedFoodId(foodId);
    setShowSubstituteModal(true);
    
    Haptics.selectionAsync();
  };

  // Função para substituir um alimento
  const handleSubstituteFood = (newFoodId: string) => {
    if (!selectedFoodId) return;
    
    try {
      // Atualizar a sugestão com o novo alimento
      const userGoals = {
        calories: nutritionInfo.calories || 2000,
        protein: nutritionInfo.protein || 100,
        carbs: nutritionInfo.carbs || 200,
        fat: nutritionInfo.fat || 60,
        meals: 4 // Valor padrão se não estiver definido
      };
      
      const updatedSuggestion = recalculateSuggestionWithFoodChange(
        currentSuggestion,
        selectedFoodId,
        newFoodId,
        userGoals
      );
      
      // Atualizar o estado da sugestão
      setCurrentSuggestion(updatedSuggestion);
      
      // Atualizar os inputs de porção
      const newInputs = { ...portionInputs };
      const food = updatedSuggestion.suggestedFoods.find(item => item.food.id === newFoodId);
      if (food) {
        newInputs[newFoodId] = food.calculatedPortion.toString();
      }
      setPortionInputs(newInputs);
      
      // Fechar o modal de substituição
      setShowSubstituteModal(false);
      setSelectedFoodId(null);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Erro ao substituir alimento:", error);
    }
  };

  // Função para atualizar a porção de um alimento
  const handleUpdatePortion = (foodId: string) => {
    try {
      const newPortion = parseInt(portionInputs[foodId]);
      
      // Validar a porção
      if (isNaN(newPortion) || newPortion <= 0) {
        // Resetar para o valor anterior
        const food = currentSuggestion.suggestedFoods.find(item => item.food.id === foodId);
        if (food) {
          setPortionInputs(prev => ({
            ...prev,
            [foodId]: food.calculatedPortion.toString()
          }));
        }
        return;
      }
      
      // Atualizar a sugestão com a nova porção
      const updatedSuggestion = adjustFoodPortion(currentSuggestion, foodId, newPortion);
      setCurrentSuggestion(updatedSuggestion);
      
      // Atualizar também o input de unidades se o alimento usar unidades
      const updatedFood = updatedSuggestion.suggestedFoods.find(item => item.food.id === foodId);
      if (updatedFood && 
          updatedFood.food.measurementUnit && 
          updatedFood.food.measurementUnit !== 'g' && 
          updatedFood.calculatedUnits !== undefined) {
        setUnitInputs(prev => ({
          ...prev,
          [foodId]: updatedFood.calculatedUnits!.toString()
        }));
      }
      
      Haptics.selectionAsync();
    } catch (error) {
      console.error("Erro ao atualizar porção:", error);
    }
  };

  // Função para atualizar unidades de um alimento
  const handleUpdateUnits = (foodId: string) => {
    try {
      const newUnits = parseFloat(unitInputs[foodId]);
      
      // Validar as unidades
      if (isNaN(newUnits) || newUnits <= 0) {
        // Resetar para o valor anterior
        const food = currentSuggestion.suggestedFoods.find(item => item.food.id === foodId);
        if (food && food.calculatedUnits !== undefined) {
          setUnitInputs(prev => ({
            ...prev,
            [foodId]: food.calculatedUnits!.toString()
          }));
        }
        return;
      }
      
      // Atualizar a sugestão com as novas unidades
      const updatedSuggestion = adjustFoodUnit(currentSuggestion, foodId, newUnits);
      setCurrentSuggestion(updatedSuggestion);
      
      // Atualizar também o input de porção
      const updatedFood = updatedSuggestion.suggestedFoods.find(item => item.food.id === foodId);
      if (updatedFood) {
        setPortionInputs(prev => ({
          ...prev,
          [foodId]: updatedFood.calculatedPortion.toString()
        }));
      }
      
      Haptics.selectionAsync();
    } catch (error) {
      console.error("Erro ao atualizar unidades:", error);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <View style={[
          styles.modalContainer, 
          { 
            backgroundColor: colors.background,
            borderColor: colors.border,
          }
        ]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Personalizar Sugestão
            </Text>
            <TouchableOpacity onPress={onClose} disabled={isLoading}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Conteúdo */}
          <ScrollView style={styles.modalContent}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {suggestion.mealName}
              </Text>
              <View style={[styles.badge, { backgroundColor: mealColor + "20" }]}>
                <Text style={[styles.badgeText, { color: mealColor }]}>
                  {currentSuggestion.macroTotals.calories} kcal
                </Text>
              </View>
            </View>

            <Text style={[styles.description, { color: colors.secondary }]}>
              Ajuste as porções ou substitua os alimentos conforme sua preferência.
            </Text>

            {/* Lista de alimentos */}
            <View style={styles.foodsList}>
              {currentSuggestion.suggestedFoods.map((suggestedFood) => (
                <View 
                  key={suggestedFood.food.id} 
                  style={[
                    styles.foodItem, 
                    { 
                      backgroundColor: colors.light,
                      borderColor: colors.border
                    }
                  ]}
                >
                  <View style={styles.foodItemHeader}>
                    <View style={styles.foodLeft}>
                      <MaterialCommunityIcons
                        name="food"
                        size={18}
                        color={mealColor}
                        style={styles.foodIcon}
                      />
                      <Text style={[styles.foodName, { color: colors.text }]}>
                        {suggestedFood.food.name}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={[
                        styles.substituteButton,
                        { backgroundColor: mealColor + "15" }
                      ]}
                      onPress={() => handleShowSubstitutes(suggestedFood.food.id)}
                    >
                      <Ionicons name="swap-horizontal" size={16} color={mealColor} />
                      <Text style={[styles.substituteText, { color: mealColor }]}>
                        Substituir
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.foodDetails}>
                    <View style={styles.foodMacros}>
                      <Text style={[styles.macroInfo, { color: colors.secondary }]}>
                        P: {Math.round(suggestedFood.food.protein * (suggestedFood.calculatedPortion / suggestedFood.food.portion))}g
                      </Text>
                      <Text style={[styles.macroInfo, { color: colors.secondary }]}>
                        C: {Math.round(suggestedFood.food.carbs * (suggestedFood.calculatedPortion / suggestedFood.food.portion))}g
                      </Text>
                      <Text style={[styles.macroInfo, { color: colors.secondary }]}>
                        G: {Math.round(suggestedFood.food.fat * (suggestedFood.calculatedPortion / suggestedFood.food.portion))}g
                      </Text>
                    </View>
                    
                    {suggestedFood.food.measurementUnit && 
                     suggestedFood.food.measurementUnit !== 'g' && 
                     suggestedFood.calculatedUnits !== undefined ? (
                      <View style={styles.portionControl}>
                        <Text style={[styles.portionLabel, { color: colors.secondary }]}>
                          {suggestedFood.food.measurementUnit}s:
                        </Text>
                        <TextInput
                          style={[
                            styles.portionInput,
                            { 
                              color: colors.text,
                              borderColor: colors.border,
                              backgroundColor: colors.background
                            }
                          ]}
                          value={unitInputs[suggestedFood.food.id] || "0"}
                          onChangeText={(text) => setUnitInputs(prev => ({
                            ...prev,
                            [suggestedFood.food.id]: text
                          }))}
                          onBlur={() => handleUpdateUnits(suggestedFood.food.id)}
                          keyboardType="numeric"
                          selectTextOnFocus
                        />
                        <Text style={[styles.unitText, { color: colors.secondary }]}>
                          {suggestedFood.food.measurementUnit}s
                        </Text>
                        
                        <Text style={[styles.portionLabel, { color: colors.secondary, marginLeft: 10 }]}>
                          ({suggestedFood.calculatedPortion}g)
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.portionControl}>
                        <Text style={[styles.portionLabel, { color: colors.secondary }]}>
                          Porção:
                        </Text>
                        <TextInput
                          style={[
                            styles.portionInput,
                            { 
                              color: colors.text,
                              borderColor: colors.border,
                              backgroundColor: colors.background
                            }
                          ]}
                          value={portionInputs[suggestedFood.food.id] || "0"}
                          onChangeText={(text) => setPortionInputs(prev => ({
                            ...prev,
                            [suggestedFood.food.id]: text
                          }))}
                          onBlur={() => handleUpdatePortion(suggestedFood.food.id)}
                          keyboardType="number-pad"
                          selectTextOnFocus
                        />
                        <Text style={[styles.unitText, { color: colors.secondary }]}>g</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Resumo de macros */}
            <View style={[
              styles.macroSummary, 
              { 
                backgroundColor: colors.light,
                borderColor: colors.border
              }
            ]}>
              <Text style={[styles.macroSummaryTitle, { color: colors.text }]}>
                Resumo Nutricional
              </Text>
              <View style={styles.macroRow}>
                <Text style={[styles.macroLabel, { color: colors.secondary }]}>
                  Calorias:
                </Text>
                <Text style={[styles.macroValue, { color: colors.text }]}>
                  {currentSuggestion.macroTotals.calories} kcal
                </Text>
              </View>
              <View style={styles.macroRow}>
                <Text style={[styles.macroLabel, { color: colors.secondary }]}>
                  Proteínas:
                </Text>
                <Text style={[styles.macroValue, { color: colors.text }]}>
                  {currentSuggestion.macroTotals.protein}g
                </Text>
              </View>
              <View style={styles.macroRow}>
                <Text style={[styles.macroLabel, { color: colors.secondary }]}>
                  Carboidratos:
                </Text>
                <Text style={[styles.macroValue, { color: colors.text }]}>
                  {currentSuggestion.macroTotals.carbs}g
                </Text>
              </View>
              <View style={styles.macroRow}>
                <Text style={[styles.macroLabel, { color: colors.secondary }]}>
                  Gorduras:
                </Text>
                <Text style={[styles.macroValue, { color: colors.text }]}>
                  {currentSuggestion.macroTotals.fat}g
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity 
              style={[
                styles.cancelButton, 
                { 
                  borderColor: colors.border,
                  backgroundColor: colors.light
                }
              ]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.confirmButton, 
                { 
                  backgroundColor: mealColor,
                  opacity: isLoading ? 0.7 : 1
                }
              ]}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.confirmButtonText}>Aplicar</Text>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ marginLeft: 5 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal para escolher substitutos */}
      <Modal
        visible={showSubstituteModal}
        transparent={true}
        animationType="fade"
      >
        <TouchableWithoutFeedback onPress={() => setShowSubstituteModal(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
            <TouchableWithoutFeedback>
              <View style={[
                styles.substituteContainer, 
                { 
                  backgroundColor: colors.background,
                  borderColor: colors.border
                }
              ]}>
                <View style={[styles.substituteHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.substituteTitle, { color: colors.text }]}>
                    Escolher Substituto
                  </Text>
                  <TouchableOpacity onPress={() => setShowSubstituteModal(false)}>
                    <Ionicons name="close" size={22} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.substitutesList}>
                  {substitutes.map(food => (
                    <TouchableOpacity
                      key={food.id}
                      style={[
                        styles.substituteItem,
                        { borderBottomColor: colors.border }
                      ]}
                      onPress={() => handleSubstituteFood(food.id)}
                    >
                      <View style={styles.substituteItemLeft}>
                        <MaterialCommunityIcons
                          name="food-variant"
                          size={18}
                          color={mealColor}
                          style={styles.substituteIcon}
                        />
                        <View>
                          <Text style={[styles.substituteName, { color: colors.text }]}>
                            {food.name}
                          </Text>
                          <Text style={[styles.substituteInfo, { color: colors.secondary }]}>
                            {food.calories} kcal • P:{food.protein}g C:{food.carbs}g G:{food.fat}g
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.secondary} />
                    </TouchableOpacity>
                  ))}
                  
                  {substitutes.length === 0 && (
                    <View style={styles.emptySubstitutes}>
                      <Text style={[styles.emptySubstitutesText, { color: colors.secondary }]}>
                        Nenhuma substituição disponível para este alimento.
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: "80%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalContent: {
    maxHeight: "70%",
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  foodsList: {
    marginBottom: 16,
  },
  foodItem: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  foodItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  foodLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  foodIcon: {
    marginRight: 10,
  },
  foodName: {
    fontSize: 15,
    fontWeight: "600",
  },
  substituteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  substituteText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  foodDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  foodMacros: {
    flexDirection: "row",
  },
  macroInfo: {
    fontSize: 13,
    marginRight: 8,
  },
  portionControl: {
    flexDirection: "row",
    alignItems: "center",
  },
  portionLabel: {
    fontSize: 13,
    marginRight: 5,
  },
  portionInput: {
    width: 50,
    height: 32,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    textAlign: "center",
    fontSize: 14,
  },
  unitText: {
    fontSize: 13,
    marginLeft: 5,
  },
  macroSummary: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  macroSummaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 14,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    flexDirection: "row",
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  substituteContainer: {
    width: width * 0.85,
    maxHeight: "60%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  substituteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
  },
  substituteTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  substitutesList: {
    maxHeight: "50%",
  },
  substituteItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
  },
  substituteItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  substituteIcon: {
    marginRight: 10,
  },
  substituteName: {
    fontSize: 15,
    fontWeight: "500",
  },
  substituteInfo: {
    fontSize: 12,
    marginTop: 2,
  },
  emptySubstitutes: {
    padding: 20,
    alignItems: "center",
  },
  emptySubstitutesText: {
    fontSize: 14,
    textAlign: "center",
  },
}); 