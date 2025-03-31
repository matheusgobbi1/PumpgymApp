import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { FoodSuggestion } from "../../data/nutritionSuggestionDatabase";
import { NutritionSuggestion, SuggestedFood } from "../../utils/nutritionSuggestionAlgorithm";
import Colors from "../../constants/Colors";
import NutritionSuggestionConfirmDialog from "./NutritionSuggestionConfirmDialog";

interface NutritionSuggestionCardProps {
  suggestion: NutritionSuggestion;
  index: number;
  isSelected: boolean;
  mealColor: string;
  theme: "light" | "dark";
  onToggleSelection: (mealId: string, foods?: any[]) => void;
}

export default function NutritionSuggestionCard({
  suggestion,
  index,
  isSelected,
  mealColor,
  theme,
  onToggleSelection,
}: NutritionSuggestionCardProps) {
  const colors = Colors[theme];
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'foods' | 'macros'>('foods');
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  // Função para alternar expansão do card
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Função para lidar com o clique na seleção do card
  const handleSelection = () => {
    // Se já estiver selecionado, apenas deseleciona
    if (isSelected) {
      onToggleSelection(suggestion.mealId);
      return;
    }
    
    // Se não estiver selecionado, abre o diálogo de configuração
    setShowConfigDialog(true);
  };
  
  // Função para confirmar a sugestão nutritional com os alimentos atualizados
  const handleConfirmSuggestion = (updatedFoods: any[]) => {
    // Fecha o diálogo
    setShowConfigDialog(false);
    
    // Chama a função para selecionar a refeição, passando os alimentos atualizados
    onToggleSelection(suggestion.mealId, updatedFoods);
  };

  // Renderizar linha de alimento sugerido
  const renderFoodRow = (suggestedFood: SuggestedFood) => (
    <View 
      key={suggestedFood.food.id} 
      style={[
        styles.foodRow, 
        theme === "dark" && { borderTopColor: colors.border }
      ]}
    >
      <View style={styles.foodCellContainer}>
        <Text style={[styles.foodCell, { color: colors.text }]}>
          {suggestedFood.food.name}
        </Text>
      </View>

      <View style={styles.portionCellContainer}>
        <Text style={[styles.portionCell, { color: colors.text }]}>
          {suggestedFood.food.measurementUnit && suggestedFood.food.measurementUnit !== 'g' && suggestedFood.calculatedUnits
            ? `${suggestedFood.calculatedUnits} ${suggestedFood.food.measurementUnit}${suggestedFood.calculatedUnits !== 1 ? 's' : ''}`
            : `${suggestedFood.calculatedPortion}g`}
        </Text>
      </View>

      <View style={styles.caloriesCellContainer}>
        <Text style={[styles.caloriesCell, { color: colors.text }]}>
          {Math.round(suggestedFood.food.calories * (suggestedFood.calculatedPortion / suggestedFood.food.portion))}
        </Text>
      </View>
    </View>
  );

  // Renderizar linha da tabela de macros
  const renderMacroRow = (label: string, value: number, dailyValue: number, color: string) => {
    const percentage = Math.round((value / dailyValue) * 100);
    
    return (
      <View 
        key={label} 
        style={[
          styles.macroRow, 
          theme === "dark" && { borderTopColor: colors.border }
        ]}
      >
        <View style={styles.macroLabelContainer}>
          <Text style={[styles.macroLabel, { color: colors.text }]}>
            {label}
          </Text>
        </View>

        <View style={styles.macroValueContainer}>
          <Text style={[styles.macroValue, { color: colors.text }]}>
            {value}g
          </Text>
        </View>

        <View style={styles.macroPercentContainer}>
          <View style={[styles.percentBar, { backgroundColor: colors.text + "20" }]}>
            <View 
              style={[
                styles.percentFill, 
                { 
                  backgroundColor: color,
                  width: `${Math.min(percentage, 100)}%` 
                }
              ]} 
            />
          </View>
          <Text style={[styles.percentText, { color: color }]}>
            {percentage}%
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <MotiView
        key={suggestion.id}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: index * 50, type: "timing", duration: 300 }}
        style={[
          styles.suggestionCard,
          { 
            backgroundColor: theme === "dark" ? colors.light : "#FFFFFF",
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? mealColor : colors.border
          }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSelection}
          style={styles.cardTouchable}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.leftContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: mealColor + "20" },
                ]}
              >
                <MaterialCommunityIcons
                  name="food-variant"
                  size={18}
                  color={mealColor}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                  {suggestion.mealName}
                </Text>
                <Text style={[styles.subtitle, { color: colors.text + "80" }]} numberOfLines={1} ellipsizeMode="tail">
                  {suggestion.macroTotals.calories} calorias • {suggestion.suggestedFoods.length} alimentos
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.expandButton,
                { backgroundColor: colors.text + "10" },
              ]}
              onPress={(e) => {
                e.stopPropagation(); // Prevenir que o card seja selecionado
                toggleExpanded();
              }}
            >
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.text + "80"}
              />
            </TouchableOpacity>
          </View>
          
          {expanded && (
            <View style={[
              styles.suggestionCardContent,
              { backgroundColor: colors.light }
            ]}>
              <View style={styles.reasonContainer}>
                <Text style={[styles.reasonText, { color: colors.secondary }]}>
                  {suggestion.reasonForSuggestion}
                </Text>
              </View>
              
              {/* Tabs para alternar entre alimentos e macros */}
              <View style={styles.tabsContainer}>
                <TouchableOpacity 
                  style={[
                    styles.tabButton, 
                    activeTab === 'foods' && {
                      borderBottomWidth: 2,
                      borderBottomColor: mealColor
                    }
                  ]}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevenir que o card seja selecionado
                    setActiveTab('foods');
                  }}
                >
                  <Text style={[
                    styles.tabText, 
                    { color: activeTab === 'foods' ? mealColor : colors.text + "80" },
                    activeTab === 'foods' && { fontWeight: '600' }
                  ]}>
                    Alimentos
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.tabButton, 
                    activeTab === 'macros' && {
                      borderBottomWidth: 2,
                      borderBottomColor: mealColor
                    }
                  ]}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevenir que o card seja selecionado
                    setActiveTab('macros');
                  }}
                >
                  <Text style={[
                    styles.tabText, 
                    { color: activeTab === 'macros' ? mealColor : colors.text + "80" },
                    activeTab === 'macros' && { fontWeight: '600' }
                  ]}>
                    Macronutrientes
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Conteúdo da aba */}
              <View style={styles.tabContent}>
                {activeTab === 'foods' ? (
                  <View style={styles.tableContainer}>
                    <View style={[
                      styles.foodsTable,
                      { borderColor: colors.border }
                    ]}>
                      <View style={[
                        styles.foodsHeader,
                        { backgroundColor: colors.card }
                      ]}>
                        <Text style={[styles.foodsHeaderText, { color: mealColor, flex: 2 }]}>Alimento</Text>
                        <Text style={[styles.foodsHeaderText, { color: mealColor }]}>Porção</Text>
                        <Text style={[styles.foodsHeaderText, { color: mealColor }]}>kcal</Text>
                      </View>
                      {suggestion.suggestedFoods.map(suggestedFood => renderFoodRow(suggestedFood))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.tableContainer}>
                    <View style={[
                      styles.macrosTable,
                      { borderColor: colors.border }
                    ]}>
                      <View style={[
                        styles.macrosHeader,
                        { backgroundColor: colors.card }
                      ]}>
                        <Text style={[styles.macrosHeaderText, { color: mealColor, flex: 1.5 }]}>Nutriente</Text>
                        <Text style={[styles.macrosHeaderText, { color: mealColor }]}>Valor</Text>
                        <Text style={[styles.macrosHeaderText, { color: mealColor, flex: 2 }]}>% do Total</Text>
                      </View>
                      {renderMacroRow('Proteínas', suggestion.macroTotals.protein, 150, '#FF6B6B')}
                      {renderMacroRow('Carboidratos', suggestion.macroTotals.carbs, 200, '#4ECDC4')}
                      {renderMacroRow('Gorduras', suggestion.macroTotals.fat, 60, '#FFD166')}
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>
      </MotiView>
      
      {/* Diálogo de configuração para a sugestão */}
      <NutritionSuggestionConfirmDialog
        visible={showConfigDialog}
        onClose={() => setShowConfigDialog(false)}
        onConfirm={handleConfirmSuggestion}
        suggestion={suggestion}
        mealColor={mealColor}
        theme={theme}
      />
    </>
  );
}

const styles = StyleSheet.create({
  suggestionCard: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTouchable: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    overflow: "hidden",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    overflow: "hidden",
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
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    flexShrink: 1,
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 36,
    flexShrink: 0,
  },
  suggestionCardContent: {
    padding: 16,
  },
  reasonContainer: {
    marginBottom: 16,
  },
  reasonText: {
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
  },
  // Estilos para as abas
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
  },
  tabContent: {
    paddingTop: 8,
  },
  tableContainer: {
    marginBottom: 16,
  },
  foodsTable: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
  },
  foodsHeader: {
    flexDirection: "row",
    paddingVertical: 10,
  },
  foodsHeaderText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    position: "relative",
  },
  foodCellContainer: {
    flex: 2,
    paddingHorizontal: 8,
  },
  foodCell: {
    fontSize: 14,
    fontWeight: "500",
  },
  portionCellContainer: {
    flex: 1,
    alignItems: "center",
  },
  portionCell: {
    fontSize: 14,
  },
  caloriesCellContainer: {
    flex: 1,
    alignItems: "center",
  },
  caloriesCell: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Estilos para a aba de macros
  macrosTable: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
  },
  macrosHeader: {
    flexDirection: "row",
    paddingVertical: 10,
  },
  macrosHeaderText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    position: "relative",
  },
  macroLabelContainer: {
    flex: 1.5,
    paddingHorizontal: 8,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  macroValueContainer: {
    flex: 1,
    alignItems: "center",
  },
  macroValue: {
    fontSize: 14,
  },
  macroPercentContainer: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
  percentBar: {
    height: 8,
    borderRadius: 4,
    flex: 1,
    marginRight: 6,
  },
  percentFill: {
    height: 8,
    borderRadius: 4,
  },
  percentText: {
    fontSize: 12,
    fontWeight: "600",
    width: 30,
    textAlign: "right",
  },
}); 