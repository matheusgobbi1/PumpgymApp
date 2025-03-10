import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { useNutrition } from "../../context/NutritionContext";
import { BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { Easing } from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface NutritionCustomizerSheetProps {
  onSave: () => void;
}

// Definir interface para os presets de macros
interface MacroPreset {
  id: string;
  name: string;
  description: string;
  protein: number;
  carbs: number;
  fat: number;
  icon: string;
}

// Presets predefinidos de distribuição de macros
const MACRO_PRESETS: MacroPreset[] = [
  {
    id: "balanced",
    name: "Equilibrado",
    description: "Distribuição balanceada para manutenção",
    protein: 30,
    carbs: 40,
    fat: 30,
    icon: "scale-outline"
  },
  {
    id: "high_protein",
    name: "Alto em Proteína",
    description: "Ideal para ganho muscular",
    protein: 40,
    carbs: 30,
    fat: 30,
    icon: "barbell-outline"
  },
  {
    id: "low_carb",
    name: "Baixo Carboidrato",
    description: "Foco em perda de gordura",
    protein: 35,
    carbs: 25,
    fat: 40,
    icon: "trending-down-outline"
  },
  {
    id: "keto",
    name: "Cetogênico",
    description: "Mínimo de carboidratos",
    protein: 30,
    carbs: 10,
    fat: 60,
    icon: "flame-outline"
  },
  {
    id: "custom",
    name: "Personalizado",
    description: "Defina sua própria distribuição",
    protein: 0,
    carbs: 0,
    fat: 0,
    icon: "options-outline"
  }
];

const NutritionCustomizerSheet = forwardRef<BottomSheetModal, NutritionCustomizerSheetProps>(
  ({ onSave }, ref) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const { nutritionInfo, updateNutritionInfo, saveNutritionInfo, calculateMacros } = useNutrition();

    // Ref para o bottom sheet
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    // Expor a referência para o componente pai
    useImperativeHandle(ref, () => {
      return bottomSheetModalRef.current!;
    });

    // Estados para os valores personalizados
    const [calories, setCalories] = useState(nutritionInfo.calories?.toString() || "");
    const [protein, setProtein] = useState(nutritionInfo.protein?.toString() || "");
    const [carbs, setCarbs] = useState(nutritionInfo.carbs?.toString() || "");
    const [fat, setFat] = useState(nutritionInfo.fat?.toString() || "");
    
    // Estados para as porcentagens de macros
    const [proteinPercentage, setProteinPercentage] = useState(0);
    const [carbsPercentage, setCarbsPercentage] = useState(0);
    const [fatPercentage, setFatPercentage] = useState(0);
    
    // Estado para controlar se os valores foram modificados
    const [isModified, setIsModified] = useState(false);
    
    // Estado para controlar se está salvando
    const [isSaving, setIsSaving] = useState(false);

    // Estado para controlar o preset selecionado
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

    // Pontos de ancoragem do bottom sheet
    const snapPoints = React.useMemo(() => ["70%", "90%"], []);

    // Renderização do backdrop com blur
    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
          opacity={0.7}
          enableTouchThrough={false}
        />
      ),
      []
    );

    // Atualizar os estados locais quando nutritionInfo mudar
    useEffect(() => {
      if (nutritionInfo.calories && nutritionInfo.protein && nutritionInfo.carbs && nutritionInfo.fat) {
        setCalories(nutritionInfo.calories.toString());
        setProtein(nutritionInfo.protein.toString());
        setCarbs(nutritionInfo.carbs.toString());
        setFat(nutritionInfo.fat.toString());
        
        calculatePercentages(
          nutritionInfo.protein,
          nutritionInfo.carbs,
          nutritionInfo.fat,
          nutritionInfo.calories
        );
      }
    }, [nutritionInfo]);

    // Função para calcular as porcentagens de macros
    const calculatePercentages = (protein: number, carbs: number, fat: number, calories: number) => {
      const proteinCalories = protein * 4;
      const carbsCalories = carbs * 4;
      const fatCalories = fat * 9;
      
      setProteinPercentage(Math.round((proteinCalories / calories) * 100));
      setCarbsPercentage(Math.round((carbsCalories / calories) * 100));
      setFatPercentage(Math.round((fatCalories / calories) * 100));
    };

    // Função para atualizar os macros com base nas porcentagens
    const updateMacrosFromPercentages = (
      newProteinPercentage: number,
      newCarbsPercentage: number,
      newFatPercentage: number,
      caloriesValue: number
    ) => {
      const newProtein = Math.round((caloriesValue * newProteinPercentage) / 400);
      const newCarbs = Math.round((caloriesValue * newCarbsPercentage) / 400);
      const newFat = Math.round((caloriesValue * newFatPercentage) / 900);
      
      setProtein(newProtein.toString());
      setCarbs(newCarbs.toString());
      setFat(newFat.toString());
      
      return { protein: newProtein, carbs: newCarbs, fat: newFat };
    };

    // Função para ajustar as porcentagens quando uma delas é alterada
    const adjustPercentages = (type: "protein" | "carbs" | "fat", value: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Atualizar apenas o valor do macro selecionado sem ajustar os outros
      if (type === "protein") {
        setProteinPercentage(value);
      } else if (type === "carbs") {
        setCarbsPercentage(value);
      } else {
        setFatPercentage(value);
      }
      
      // Atualizar os valores em gramas com base nas novas porcentagens
      if (calories) {
        const caloriesValue = parseInt(calories);
        
        if (type === "protein") {
          const newProtein = Math.round((caloriesValue * value) / 400);
          setProtein(newProtein.toString());
        } else if (type === "carbs") {
          const newCarbs = Math.round((caloriesValue * value) / 400);
          setCarbs(newCarbs.toString());
        } else {
          const newFat = Math.round((caloriesValue * value) / 900);
          setFat(newFat.toString());
        }
      }
      
      setIsModified(true);
    };
    
    // Verificar se a soma das porcentagens é 100%
    const isTotalValid = () => {
      const total = proteinPercentage + carbsPercentage + fatPercentage;
      return Math.abs(total - 100) <= 1; // Permitir uma pequena margem de erro devido a arredondamentos
    };

    // Função para salvar as alterações
    const saveChanges = async () => {
      if (isSaving) return;
      
      if (!calories || parseInt(calories) < 1000 || parseInt(calories) > 10000) {
        Alert.alert(
          "Valor inválido",
          "Por favor, insira um valor de calorias entre 1000 e 10000."
        );
        return;
      }
      
      const caloriesValue = parseInt(calories);
      const proteinValue = parseInt(protein) || 0;
      const carbsValue = parseInt(carbs) || 0;
      const fatValue = parseInt(fat) || 0;
      
      // Verificar se os macros somam aproximadamente as calorias totais
      const totalCalories = proteinValue * 4 + carbsValue * 4 + fatValue * 9;
      const difference = Math.abs(totalCalories - caloriesValue);
      
      if (difference > 50) {
        Alert.alert(
          "Valores inconsistentes",
          "Os macronutrientes não correspondem ao total de calorias. Deseja ajustar automaticamente?",
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Ajustar",
              onPress: async () => {
                try {
                  setIsSaving(true);
                  
                  const adjusted = updateMacrosFromPercentages(
                    proteinPercentage,
                    carbsPercentage,
                    fatPercentage,
                    caloriesValue
                  );
                  
                  // Atualizar o estado local primeiro
                  setProtein(adjusted.protein.toString());
                  setCarbs(adjusted.carbs.toString());
                  setFat(adjusted.fat.toString());
                  
                  // Atualizar o contexto
                  await updateNutritionInfo({
                    calories: caloriesValue,
                    protein: adjusted.protein,
                    carbs: adjusted.carbs,
                    fat: adjusted.fat,
                  });
                  
                  // Salvar no Firebase e AsyncStorage
                  await saveNutritionInfo();
                  
                  setIsModified(false);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  
                  // Fechar o bottom sheet e notificar o componente pai
                  bottomSheetModalRef.current?.dismiss();
                  onSave();
                } catch (error) {
                  console.error("Erro ao salvar alterações:", error);
                  Alert.alert("Erro", "Ocorreu um erro ao salvar suas alterações. Por favor, tente novamente.");
                } finally {
                  setIsSaving(false);
                }
              },
            },
          ]
        );
        return;
      }
      
      try {
        setIsSaving(true);
        
        // Salvar os valores
        await updateNutritionInfo({
          calories: caloriesValue,
          protein: proteinValue,
          carbs: carbsValue,
          fat: fatValue,
        });
        
        // Salvar no Firebase e AsyncStorage
        await saveNutritionInfo();
        
        setIsModified(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Fechar o bottom sheet e notificar o componente pai
        bottomSheetModalRef.current?.dismiss();
        onSave();
      } catch (error) {
        console.error("Erro ao salvar alterações:", error);
        Alert.alert("Erro", "Ocorreu um erro ao salvar suas alterações. Por favor, tente novamente.");
      } finally {
        setIsSaving(false);
      }
    };

    // Função para aplicar um preset
    const applyPreset = useCallback((preset: MacroPreset) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      setSelectedPreset(preset.id);
      
      if (preset.id !== "custom") {
        setProteinPercentage(preset.protein);
        setCarbsPercentage(preset.carbs);
        setFatPercentage(preset.fat);
        
        if (calories) {
          const caloriesValue = parseInt(calories);
          const newProtein = Math.round((caloriesValue * preset.protein) / 400);
          const newCarbs = Math.round((caloriesValue * preset.carbs) / 400);
          const newFat = Math.round((caloriesValue * preset.fat) / 900);
          
          setProtein(newProtein.toString());
          setCarbs(newCarbs.toString());
          setFat(newFat.toString());
        }
      }
      
      setIsModified(true);
    }, [calories]);

    // Renderizar os cards de presets
    const renderPresets = () => (
      <View style={styles.presetsContainer}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Distribuições Recomendadas
        </Text>
        <View style={styles.presetCardsContainer}>
          {MACRO_PRESETS.map((preset, index) => (
            <MotiView
              key={`preset-${preset.id}`}
              style={styles.presetCardWrapper}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: "timing",
                duration: 300,
                delay: index * 50,
                easing: Easing.out(Easing.ease),
              }}
            >
              <TouchableOpacity
                style={[
                  styles.presetCard,
                  { backgroundColor: colors.card },
                  selectedPreset === preset.id && styles.presetCardSelected,
                ]}
                onPress={() => applyPreset(preset)}
                activeOpacity={0.7}
              >
                <View style={styles.presetCardContent}>
                  <View
                    style={[
                      styles.presetIconContainer,
                      {
                        backgroundColor: selectedPreset === preset.id
                          ? colors.primary + "20"
                          : "rgba(255, 255, 255, 0.2)",
                      },
                    ]}
                  >
                    <Ionicons
                      name={preset.icon as any}
                      size={24}
                      color={selectedPreset === preset.id ? colors.primary : colors.primary}
                    />
                  </View>
                  <View style={styles.presetInfo}>
                    <Text style={[styles.presetName, { color: colors.text }]}>
                      {preset.name}
                    </Text>
                    <Text style={[styles.presetDescription, { color: colors.text + "80" }]}>
                      {preset.description}
                    </Text>
                    {preset.id !== "custom" && (
                      <View style={styles.macroDistribution}>
                        <Text style={[styles.macroText, { color: colors.text + "60" }]}>
                          P: {preset.protein}% • C: {preset.carbs}% • G: {preset.fat}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.checkboxContainer}>
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: selectedPreset === preset.id
                            ? colors.primary
                            : colors.border,
                        },
                        selectedPreset === preset.id && {
                          backgroundColor: colors.primary,
                        },
                      ]}
                    >
                      {selectedPreset === preset.id && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>
      </View>
    );

    // Renderizar o indicador de macronutriente
    const renderMacroIndicator = (
      title: string,
      value: string,
      percentage: number,
      color: string,
      onSliderChange: (value: number) => void
    ) => {
      return (
        <View style={styles.macroContainer}>
          <View style={styles.macroHeader}>
            <Text style={[styles.macroTitle, { color: colors.text }]}>{title}</Text>
            <View style={styles.macroValueContainer}>
              <Text style={[styles.macroValue, { color }]}>{value}g</Text>
              <Text style={[styles.macroPercentage, { color }]}>({percentage}%)</Text>
            </View>
          </View>
          
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={70}
            step={1}
            value={percentage}
            onValueChange={onSliderChange}
            minimumTrackTintColor={color}
            maximumTrackTintColor={colors.border}
            thumbTintColor={color}
          />
        </View>
      );
    };

    // Renderizar o conteúdo de personalização
    const renderCustomizationContent = () => {
      if (selectedPreset !== "custom") return null;
      
      return (
        <MotiView
          from={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ type: "timing", duration: 300 }}
          style={[
            styles.customizationContainer,
            { backgroundColor: colors.card }
          ]}
        >
          <View style={styles.customizationContent}>
            <View style={styles.customCard}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Meta de Calorias Diárias
              </Text>
              <View style={styles.caloriesInputContainer}>
                <TextInput
                  style={[
                    styles.caloriesInput,
                    { 
                      color: colors.text,
                      borderColor: colors.border + '30',
                      backgroundColor: colors.card
                    }
                  ]}
                  value={calories}
                  onChangeText={(text) => {
                    setCalories(text.replace(/[^0-9]/g, ""));
                    const caloriesValue = parseInt(text);
                    if (!isNaN(caloriesValue) && caloriesValue > 0) {
                      updateMacrosFromPercentages(
                        proteinPercentage,
                        carbsPercentage,
                        fatPercentage,
                        caloriesValue
                      );
                    }
                    setIsModified(true);
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.text + "50"}
                />
                <View style={[styles.unitBadge, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.caloriesUnit, { color: colors.primary }]}>kcal</Text>
                </View>
              </View>
            </View>

            <View style={styles.customCard}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Distribuição de Macronutrientes
              </Text>
              <View style={styles.macrosContainer}>
                {renderMacroIndicator(
                  "Proteína",
                  protein,
                  proteinPercentage,
                  "#FF6B6B",
                  (value) => adjustPercentages("protein", value)
                )}
                
                {renderMacroIndicator(
                  "Carboidratos",
                  carbs,
                  carbsPercentage,
                  "#4ECDC4",
                  (value) => adjustPercentages("carbs", value)
                )}
                
                {renderMacroIndicator(
                  "Gorduras",
                  fat,
                  fatPercentage,
                  "#FFD166",
                  (value) => adjustPercentages("fat", value)
                )}
              </View>

              <View style={styles.totalContainer}>
                <View style={[styles.totalBadge, { 
                  backgroundColor: isTotalValid() ? colors.primary + '15' : colors.danger + '15',
                  borderColor: isTotalValid() ? colors.primary + '30' : colors.danger + '30'
                }]}>
                  <Text style={[styles.totalText, { 
                    color: isTotalValid() ? colors.primary : colors.danger 
                  }]}>
                    Total: {proteinPercentage + carbsPercentage + fatPercentage}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </MotiView>
      );
    };

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: colors.text + '30', width: 50, height: 5 }}
        backgroundStyle={{ backgroundColor: colors.background }}
        enablePanDownToClose={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.contentContainer}>
            <View style={styles.handleContent}>
              <Text style={[styles.title, { color: colors.text }]}>
                Plano Nutricional
              </Text>
              <TouchableOpacity
                style={[styles.recalculateButton, { backgroundColor: colors.primary + "15" }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  calculateMacros();
                  setSelectedPreset(null);
                  setTimeout(() => {
                    if (nutritionInfo.calories && nutritionInfo.protein && nutritionInfo.carbs && nutritionInfo.fat) {
                      setCalories(nutritionInfo.calories.toString());
                      setProtein(nutritionInfo.protein.toString());
                      setCarbs(nutritionInfo.carbs.toString());
                      setFat(nutritionInfo.fat.toString());
                      
                      calculatePercentages(
                        nutritionInfo.protein,
                        nutritionInfo.carbs,
                        nutritionInfo.fat,
                        nutritionInfo.calories
                      );
                    }
                    setIsModified(true);
                  }, 300);
                }}
              >
                <Ionicons name="refresh-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={[styles.scrollContainer, { backgroundColor: colors.background }]}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 300 }}
              >
                {renderPresets()}
                {renderCustomizationContent()}
              </MotiView>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { 
                    backgroundColor: isModified && !isSaving && isTotalValid() 
                      ? colors.primary 
                      : colors.primary + "30",
                    opacity: isModified && !isSaving && isTotalValid() ? 1 : 0.7,
                  }
                ]}
                onPress={saveChanges}
                disabled={!isModified || isSaving || !isTotalValid()}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    Salvar Alterações
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  scrollContainer: {
    flex: 1,
  },
  handleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  recalculateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  caloriesInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  caloriesInput: {
    flex: 1,
    height: 60,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 22,
    fontWeight: "bold",
  },
  unitBadge: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  caloriesUnit: {
    fontSize: 16,
    fontWeight: "600",
  },
  macrosContainer: {
    marginBottom: 16,
  },
  macroContainer: {
    marginBottom: 20,
  },
  macroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  macroTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  macroValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  macroPercentage: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  totalContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  totalBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  totalText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  saveButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  presetsContainer: {
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  presetCardsContainer: {
    marginTop: 12,
  },
  presetCardWrapper: {
    marginBottom: 12,
  },
  presetCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  presetCardSelected: {
    elevation: 4,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  presetCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    minHeight: 80,
  },
  presetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  presetInfo: {
    flex: 1,
    justifyContent: "center",
  },
  presetName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  presetDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  macroDistribution: {
    marginTop: 4,
  },
  macroText: {
    fontSize: 12,
    fontWeight: "500",
  },
  checkboxContainer: {
    marginLeft: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  customizationContainer: {
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  customizationContent: {
    padding: 16,
  },
  customCard: {
    marginBottom: 16,
  },
});

export default NutritionCustomizerSheet; 