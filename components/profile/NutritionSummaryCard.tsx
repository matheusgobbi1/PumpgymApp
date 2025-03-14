import React, { useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput, Alert } from "react-native";
import { MotiView } from "moti";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { useNutrition } from "../../context/NutritionContext";
import { useRouter } from "expo-router";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import NutritionCustomizerSheet from "./NutritionCustomizerSheet";
import * as Haptics from "expo-haptics";
import Slider from "@react-native-community/slider";
import { ErrorMessage } from "../common/ErrorMessage";
import { ValidationResult } from "../../utils/validations";

const { width } = Dimensions.get("window");

export default function NutritionSummaryCard() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { nutritionInfo, updateNutritionInfo, saveNutritionInfo } = useNutrition();
  const router = useRouter();
  
  // Ref para o bottom sheet
  const customizeSheetRef = useRef<BottomSheetModal>(null);
  
  // Controle de animação - executar apenas uma vez
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const animationExecuted = useRef(false);
  
  // Estado para controlar o modo de edição inline
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Estados para os valores em edição
  const [editCalories, setEditCalories] = useState(nutritionInfo.calories?.toString() || "");
  const [editProtein, setEditProtein] = useState(nutritionInfo.protein?.toString() || "");
  const [editCarbs, setEditCarbs] = useState(nutritionInfo.carbs?.toString() || "");
  const [editFat, setEditFat] = useState(nutritionInfo.fat?.toString() || "");
  
  // Estados para as porcentagens de macros
  const [proteinPercentage, setProteinPercentage] = useState(0);
  const [carbsPercentage, setCarbsPercentage] = useState(0);
  const [fatPercentage, setFatPercentage] = useState(0);
  
  // Estados para erros de validação
  const [caloriesError, setCaloriesError] = useState<string>("");
  const [proteinError, setProteinError] = useState<string>("");
  const [carbsError, setCarbsError] = useState<string>("");
  const [fatError, setFatError] = useState<string>("");
  const [macrosError, setMacrosError] = useState<string>("");
  
  useEffect(() => {
    // Configurar a animação para ser executada apenas na primeira renderização
    if (!animationExecuted.current) {
      setShouldAnimate(true);
      animationExecuted.current = true;
    } else {
      setShouldAnimate(false);
    }
  }, []);

  // Atualizar os estados locais quando nutritionInfo mudar
  useEffect(() => {
    if (nutritionInfo.calories && nutritionInfo.protein && nutritionInfo.carbs && nutritionInfo.fat) {
      setEditCalories(nutritionInfo.calories.toString());
      setEditProtein(nutritionInfo.protein.toString());
      setEditCarbs(nutritionInfo.carbs.toString());
      setEditFat(nutritionInfo.fat.toString());
      
      calculatePercentages(
        nutritionInfo.protein,
        nutritionInfo.carbs,
        nutritionInfo.fat,
        nutritionInfo.calories
      );
    }
  }, [nutritionInfo]);

  // Verificar se há informações nutricionais
  const hasNutritionInfo = nutritionInfo.calories && 
    nutritionInfo.protein && 
    nutritionInfo.carbs && 
    nutritionInfo.fat;

  // Função para calcular as porcentagens de macros
  const calculatePercentages = (protein: number, carbs: number, fat: number, calories: number) => {
    const proteinCalories = protein * 4;
    const carbsCalories = carbs * 4;
    const fatCalories = fat * 9;
    
    setProteinPercentage(Math.round((proteinCalories / calories) * 100));
    setCarbsPercentage(Math.round((carbsCalories / calories) * 100));
    setFatPercentage(Math.round((fatCalories / calories) * 100));
  };

  // Função para atualizar os macronutrientes quando as calorias são alteradas
  const updateMacrosWhenCaloriesChange = (newCalories: number) => {
    // Verificar se há um valor válido de caloria anterior
    if (!nutritionInfo.calories) return;
    
    // Se o valor de calorias não mudou, não precisa atualizar
    if (newCalories === nutritionInfo.calories) return;
    
    // Se já temos porcentagens calculadas, use-as
    if (proteinPercentage > 0 && carbsPercentage > 0 && fatPercentage > 0) {
      // Recalcular os macros com base nas porcentagens atuais
      const newProtein = Math.round((newCalories * proteinPercentage) / 400);
      const newCarbs = Math.round((newCalories * carbsPercentage) / 400);
      const newFat = Math.round((newCalories * fatPercentage) / 900);
      
      setEditProtein(newProtein.toString());
      setEditCarbs(newCarbs.toString());
      setEditFat(newFat.toString());
    } 
    // Se não temos porcentagens ainda (ex: primeira edição), calcule-as primeiro
    else if (nutritionInfo.protein && nutritionInfo.carbs && nutritionInfo.fat) {
      // Calcular porcentagens com base nos valores atuais
      const proteinCalories = nutritionInfo.protein * 4;
      const carbsCalories = nutritionInfo.carbs * 4;
      const fatCalories = nutritionInfo.fat * 9;
      const totalCalories = nutritionInfo.calories;
      
      const proteinPct = Math.round((proteinCalories / totalCalories) * 100);
      const carbsPct = Math.round((carbsCalories / totalCalories) * 100);
      const fatPct = Math.round((fatCalories / totalCalories) * 100);
      
      // Atualizar porcentagens
      setProteinPercentage(proteinPct);
      setCarbsPercentage(carbsPct);
      setFatPercentage(fatPct);
      
      // Agora calcular os novos valores em gramas
      const newProtein = Math.round((newCalories * proteinPct) / 400);
      const newCarbs = Math.round((newCalories * carbsPct) / 400);
      const newFat = Math.round((newCalories * fatPct) / 900);
      
      setEditProtein(newProtein.toString());
      setEditCarbs(newCarbs.toString());
      setEditFat(newFat.toString());
    }
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
    
    setEditProtein(newProtein.toString());
    setEditCarbs(newCarbs.toString());
    setEditFat(newFat.toString());
    
    return { protein: newProtein, carbs: newCarbs, fat: newFat };
  };

  // Função para ajustar as porcentagens quando uma delas é alterada
  const adjustPercentages = (type: "protein" | "carbs" | "fat", value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Calcular o total atual sem o valor que está sendo alterado
    let currentTotal = 0;
    if (type === "protein") {
      currentTotal = carbsPercentage + fatPercentage;
    } else if (type === "carbs") {
      currentTotal = proteinPercentage + fatPercentage;
    } else {
      currentTotal = proteinPercentage + carbsPercentage;
    }
    
    // Verificar se o novo total excederia 100%
    if (currentTotal + value > 100) {
      // Ajustar o valor para não exceder 100%
      value = 100 - currentTotal;
      
      // Feedback tátil para indicar que atingiu o limite
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    // Atualizar o valor do macro selecionado
    if (type === "protein") {
      setProteinPercentage(value);
    } else if (type === "carbs") {
      setCarbsPercentage(value);
    } else {
      setFatPercentage(value);
    }
    
    // Atualizar os valores em gramas com base nas novas porcentagens
    if (editCalories) {
      const caloriesValue = parseInt(editCalories);
      
      if (type === "protein") {
        const newProtein = Math.round((caloriesValue * value) / 400);
        setEditProtein(newProtein.toString());
      } else if (type === "carbs") {
        const newCarbs = Math.round((caloriesValue * value) / 400);
        setEditCarbs(newCarbs.toString());
      } else {
        const newFat = Math.round((caloriesValue * value) / 900);
        setEditFat(newFat.toString());
      }
    }
  };

  // Verificar se a soma das porcentagens é 100%
  const isTotalValid = () => {
    const total = proteinPercentage + carbsPercentage + fatPercentage;
    return Math.abs(total - 100) <= 1; // Permitir uma pequena margem de erro devido a arredondamentos
  };


  // Função para configurar o plano
  const handleSetupPress = () => {
    router.push("/onboarding");
  };
  
  // Função para abrir o bottom sheet de customização
  const handleCustomizePress = () => {
    if (isEditMode) {
      handleSaveInlineEdit();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsEditMode(true);
      
      // Limpar erros ao entrar no modo de edição
      setCaloriesError("");
      setProteinError("");
      setCarbsError("");
      setFatError("");
      setMacrosError("");
    }
  };
  
  // Função para salvar as alterações da edição inline
  const handleSaveInlineEdit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Validar todos os campos
    const isCaloriesValid = validateCalories(editCalories);
    const isProteinValid = validateProtein(editProtein);
    const isCarbsValid = validateCarbs(editCarbs);
    const isFatValid = validateFat(editFat);
    const isMacrosDistributionValid = validateMacrosDistribution();
    
    // Se algum campo for inválido, não prosseguir
    if (!isCaloriesValid || !isProteinValid || !isCarbsValid || !isFatValid || !isMacrosDistributionValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    // Atualizar o contexto
    await updateNutritionInfo({
      calories: parseInt(editCalories),
      protein: parseInt(editProtein),
      carbs: parseInt(editCarbs),
      fat: parseInt(editFat),
    });
    
    // Salvar no Firebase e AsyncStorage
    await saveNutritionInfo();
    
    // Sair do modo de edição
    setIsEditMode(false);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  
  // Função para cancelar a edição
  const handleCancelEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Restaurar os valores originais
    setEditCalories(nutritionInfo.calories?.toString() || "");
    setEditProtein(nutritionInfo.protein?.toString() || "");
    setEditCarbs(nutritionInfo.carbs?.toString() || "");
    setEditFat(nutritionInfo.fat?.toString() || "");
    
    // Recalcular as porcentagens
    if (nutritionInfo.calories && nutritionInfo.protein && nutritionInfo.carbs && nutritionInfo.fat) {
      calculatePercentages(
        nutritionInfo.protein,
        nutritionInfo.carbs,
        nutritionInfo.fat,
        nutritionInfo.calories
      );
    }
    
    // Sair do modo de edição
    setIsEditMode(false);
    
    // Limpar erros
    setCaloriesError("");
    setProteinError("");
    setCarbsError("");
    setFatError("");
    setMacrosError("");
  };
  
  // Função para atualizar o card após salvar as alterações
  const handleSaveComplete = () => {
    // Não é necessário fazer nada aqui, pois o contexto já foi atualizado
    // e o componente será re-renderizado automaticamente
  };

  // Validar calorias
  const validateCalories = (value: string): boolean => {
    const calories = parseFloat(value);
    
    if (!calories || isNaN(calories)) {
      setCaloriesError("Por favor, insira um valor válido");
      return false;
    }
    
    if (calories < 800 || calories > 8000) {
      setCaloriesError("As calorias devem estar entre 800 e 8000");
      return false;
    }
    
    setCaloriesError("");
    // Atualizar macronutrientes quando calorias são alteradas
    updateMacrosWhenCaloriesChange(calories);
    return true;
  };
  
  // Validar proteínas
  const validateProtein = (value: string): boolean => {
    const protein = parseFloat(value);
    
    if (!protein || isNaN(protein)) {
      setProteinError("Por favor, insira um valor válido");
      return false;
    }
    
    if (protein < 10 || protein > 400) {
      setProteinError("A proteína deve estar entre 10g e 400g");
      return false;
    }
    
    setProteinError("");
    return true;
  };
  
  // Validar carboidratos
  const validateCarbs = (value: string): boolean => {
    const carbs = parseFloat(value);
    
    if (!carbs || isNaN(carbs)) {
      setCarbsError("Por favor, insira um valor válido");
      return false;
    }
    
    if (carbs < 20 || carbs > 800) {
      setCarbsError("Os carboidratos devem estar entre 20g e 800g");
      return false;
    }
    
    setCarbsError("");
    return true;
  };
  
  // Validar gorduras
  const validateFat = (value: string): boolean => {
    const fat = parseFloat(value);
    
    if (!fat || isNaN(fat)) {
      setFatError("Por favor, insira um valor válido");
      return false;
    }
    
    if (fat < 10 || fat > 200) {
      setFatError("As gorduras devem estar entre 10g e 200g");
      return false;
    }
    
    setFatError("");
    return true;
  };
  
  // Validar distribuição de macros
  const validateMacrosDistribution = (): boolean => {
    const total = proteinPercentage + carbsPercentage + fatPercentage;
    
    if (total !== 100) {
      setMacrosError(`A distribuição total deve ser 100% (atual: ${total}%)`);
      return false;
    }
    
    setMacrosError("");
    return true;
  };

  // Renderizar o estado vazio (sem plano nutricional)
  const renderEmptyState = () => (
    <Animated.View 
      entering={shouldAnimate ? FadeIn.duration(400) : undefined} 
      style={styles.emptyContainer}
    >
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '10' }]}>
        <MaterialCommunityIcons 
          name="food-apple-outline" 
          size={32} 
          color={colors.primary} 
        />
      </View>
      
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Plano nutricional não configurado
      </Text>
      
      <Text style={[styles.emptyDescription, { color: colors.text + '80' }]}>
        Configure seu plano para receber recomendações personalizadas de calorias e macronutrientes.
      </Text>
      
      <TouchableOpacity
        style={[styles.setupButton, { backgroundColor: colors.text }]}
        onPress={handleSetupPress}
        activeOpacity={0.8}
      >
        <Text style={styles.setupButtonText}>
          Configurar Plano
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // Renderizar o cabeçalho com as calorias
  const renderCaloriesHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <MaterialCommunityIcons name="fire" size={18} color={colors.primary} />
        </View>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Plano Nutricional</Text>
          <Text style={[styles.subtitle, { color: colors.text + '80' }]}>
            Meta diária personalizada
          </Text>
        </View>
      </View>
      
      <View style={styles.headerRight}>
        {isEditMode ? (
          <View style={styles.editButtonsContainer}>
            <TouchableOpacity 
              style={[styles.editActionButton, styles.cancelButton, { backgroundColor: colors.text + '10' }]}
              onPress={handleCancelEdit}
            >
              <Ionicons name="close" size={20} color={colors.text + '80'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.editActionButton, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveInlineEdit}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.customizeButton, { backgroundColor: colors.text + '10' }]}
            onPress={handleCustomizePress}
          >
            <Ionicons name="options-outline" size={20} color={colors.text + '80'} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Renderizar os cards de estatísticas
  const renderStatsCards = () => (
    <>
      {/* Exibir erros de validação no topo */}
      {isEditMode && (
        <View style={styles.errorsContainer}>
          {caloriesError && <ErrorMessage message={caloriesError} />}
          {proteinError && <ErrorMessage message={proteinError} />}
          {carbsError && <ErrorMessage message={carbsError} />}
          {fatError && <ErrorMessage message={fatError} />}
          {macrosError && <ErrorMessage message={macrosError} />}
        </View>
      )}
      
      <View style={styles.statsContainer}>
        <Animated.View
          entering={isEditMode ? FadeInDown.duration(300).delay(100) : undefined}
          style={[
            styles.statCard, 
            { 
              backgroundColor: isEditMode 
                ? 'rgba(255,107,107,0.05)' 
                : colors.card
            }
          ]}
        >
          <View style={styles.statCardContent}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FF6B6B15' }]}>
              <MaterialCommunityIcons name="fire" size={18} color="#FF1F02" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statLabel, { color: colors.text }]} numberOfLines={1}>Calorias</Text>
              <View style={styles.editInputContainer}>
                {isEditMode ? (
                  <>
                    <TextInput
                      style={[
                        styles.editInput, 
                        styles.caloriesInput, 
                        { color: colors.text },
                        caloriesError ? styles.inputError : null
                      ]}
                      value={editCalories}
                      onChangeText={(value) => {
                        setEditCalories(value);
                        validateCalories(value);
                      }}
                      keyboardType="numeric"
                      maxLength={5}
                      selectTextOnFocus
                    />
                    <Text style={[styles.statUnit, { color: colors.text + '60' }]}>kcal</Text>
                  </>
                ) : (
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {nutritionInfo.calories} <Text style={[styles.statUnit, { color: colors.text + '60' }]}>kcal</Text>
                  </Text>
                )}
              </View>
            </View>
          </View>
          
          {isEditMode && (
            <View style={styles.totalIndicatorContainer}>
              <Text style={styles.totalIndicatorLabel}>Distribuição total:</Text>
              <Text 
                style={[
                  styles.totalIndicatorValue, 
                  isTotalValid() ? styles.totalValid : styles.totalInvalid
                ]}
              >
                {proteinPercentage + carbsPercentage + fatPercentage}%
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View
          entering={isEditMode ? FadeInDown.duration(300).delay(150) : undefined}
          style={[
            styles.statCard, 
            { 
              backgroundColor: isEditMode 
                ? 'rgba(239,71,111,0.05)' 
                : colors.card
            }
          ]}
        >
          <View style={styles.statCardContent}>
            <View style={[styles.statIconContainer, { backgroundColor: '#EF476F15' }]}>
              <MaterialCommunityIcons name="food-steak" size={18} color="#EF476F" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statLabel, { color: colors.text }]} numberOfLines={1}>Proteína</Text>
              <View style={styles.editInputContainer}>
                {isEditMode ? (
                  <>
                    <TextInput
                      style={[
                        styles.editInput, 
                        { color: colors.text },
                        proteinError ? styles.inputError : null
                      ]}
                      value={editProtein}
                      onChangeText={(value) => {
                        setEditProtein(value);
                        validateProtein(value);
                      }}
                      keyboardType="numeric"
                      maxLength={3}
                      selectTextOnFocus
                    />
                    <Text style={[styles.statUnit, { color: colors.text + '60' }]}>g</Text>
                  </>
                ) : (
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {nutritionInfo.protein}<Text style={[styles.statUnit, { color: colors.text + '60' }]}>g</Text>
                  </Text>
                )}
              </View>
            </View>
          </View>
          
          {isEditMode && (
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.miniSlider}
                minimumValue={5}
                maximumValue={70}
                step={1}
                value={proteinPercentage}
                onValueChange={(value) => {
                  adjustPercentages("protein", value);
                  validateMacrosDistribution();
                }}
                minimumTrackTintColor="#EF476F"
                maximumTrackTintColor={colors.border}
                thumbTintColor="#EF476F"
              />
              <View style={styles.percentageContainer}>
                <Text style={[styles.percentageText, { color: '#EF476F' }]}>{proteinPercentage}%</Text>
              </View>
            </View>
          )}
        </Animated.View>

        <Animated.View
          entering={isEditMode ? FadeInDown.duration(300).delay(200) : undefined}
          style={[
            styles.statCard, 
            { 
              backgroundColor: isEditMode 
                ? 'rgba(17,138,178,0.05)' 
                : colors.card
            }
          ]}
        >
          <View style={styles.statCardContent}>
            <View style={[styles.statIconContainer, { backgroundColor: '#118AB215' }]}>
              <MaterialCommunityIcons name="bread-slice" size={18} color="#118AB2" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statLabel, { color: colors.text }]} numberOfLines={1}>Carbs</Text>
              <View style={styles.editInputContainer}>
                {isEditMode ? (
                  <>
                    <TextInput
                      style={[
                        styles.editInput, 
                        { color: colors.text },
                        carbsError ? styles.inputError : null
                      ]}
                      value={editCarbs}
                      onChangeText={(value) => {
                        setEditCarbs(value);
                        validateCarbs(value);
                      }}
                      keyboardType="numeric"
                      maxLength={3}
                      selectTextOnFocus
                    />
                    <Text style={[styles.statUnit, { color: colors.text + '60' }]}>g</Text>
                  </>
                ) : (
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {nutritionInfo.carbs}<Text style={[styles.statUnit, { color: colors.text + '60' }]}>g</Text>
                  </Text>
                )}
              </View>
            </View>
          </View>
          
          {isEditMode && (
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.miniSlider}
                minimumValue={5}
                maximumValue={70}
                step={1}
                value={carbsPercentage}
                onValueChange={(value) => {
                  adjustPercentages("carbs", value);
                  validateMacrosDistribution();
                }}
                minimumTrackTintColor="#118AB2"
                maximumTrackTintColor={colors.border}
                thumbTintColor="#118AB2"
              />
              <View style={styles.percentageContainer}>
                <Text style={[styles.percentageText, { color: '#118AB2' }]}>{carbsPercentage}%</Text>
              </View>
            </View>
          )}
        </Animated.View>
        
        <Animated.View
          entering={isEditMode ? FadeInDown.duration(300).delay(250) : undefined}
          style={[
            styles.statCard, 
            { 
              backgroundColor: isEditMode 
                ? 'rgba(255,209,102,0.05)' 
                : colors.card
            }
          ]}
        >
          <View style={styles.statCardContent}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FFD16615' }]}>
              <MaterialCommunityIcons name="oil" size={18} color="#FFD166" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statLabel, { color: colors.text }]} numberOfLines={1}>Gorduras</Text>
              <View style={styles.editInputContainer}>
                {isEditMode ? (
                  <>
                    <TextInput
                      style={[
                        styles.editInput, 
                        { color: colors.text },
                        fatError ? styles.inputError : null
                      ]}
                      value={editFat}
                      onChangeText={(value) => {
                        setEditFat(value);
                        validateFat(value);
                      }}
                      keyboardType="numeric"
                      maxLength={3}
                      selectTextOnFocus
                    />
                    <Text style={[styles.statUnit, { color: colors.text + '60' }]}>g</Text>
                  </>
                ) : (
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {nutritionInfo.fat}<Text style={[styles.statUnit, { color: colors.text + '60' }]}>g</Text>
                  </Text>
                )}
              </View>
            </View>
          </View>
          
          {isEditMode && (
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.miniSlider}
                minimumValue={5}
                maximumValue={70}
                step={1}
                value={fatPercentage}
                onValueChange={(value) => {
                  adjustPercentages("fat", value);
                  validateMacrosDistribution();
                }}
                minimumTrackTintColor="#FFD166"
                maximumTrackTintColor={colors.border}
                thumbTintColor="#FFD166"
              />
              <View style={styles.percentageContainer}>
                <Text style={[styles.percentageText, { color: '#FFD166' }]}>{fatPercentage}%</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </>
  );

  // Renderizar os detalhes dos macronutrientes
  const renderNutrientDetails = () => (
    <View style={styles.nutrientDetailsContainer}>
      {/* Proteína */}
      <View style={[styles.nutrientDetailCard, { backgroundColor: colors.card }]}>
        <View style={[styles.nutrientIconContainer, { backgroundColor: '#FF6B6B15' }]}>
          <MaterialCommunityIcons name="food-steak" size={20} color="#FF6B6B" />
        </View>
        <Text style={[styles.nutrientDetailValue, { color: colors.text }]}>
          {nutritionInfo.protein}g
        </Text>
        <Text style={[styles.nutrientDetailLabel, { color: colors.text + '70' }]}>
          Proteína
        </Text>
      </View>
      
      {/* Carboidratos */}
      <View style={[styles.nutrientDetailCard, { backgroundColor: colors.text}]}>
        <View style={[styles.nutrientIconContainer, { backgroundColor: '#4ECDC415' }]}>
          <MaterialCommunityIcons name="bread-slice" size={20} color="#4ECDC4" />
        </View>
        <Text style={[styles.nutrientDetailValue, { color: colors.text }]}>
          {nutritionInfo.carbs}g
        </Text>
        <Text style={[styles.nutrientDetailLabel, { color: colors.text + '70' }]}>
          Carboidratos
        </Text>
      </View>
      
      {/* Gorduras */}
      <View style={[styles.nutrientDetailCard, { backgroundColor: colors.card }]}>
        <View style={[styles.nutrientIconContainer, { backgroundColor: '#FFD16615' }]}>
          <MaterialCommunityIcons name="oil" size={20} color="#FFD166" />
        </View>
        <Text style={[styles.nutrientDetailValue, { color: colors.text }]}>
          {nutritionInfo.fat}g
        </Text>
        <Text style={[styles.nutrientDetailLabel, { color: colors.text + '70' }]}>
          Gorduras
        </Text>
      </View>
      
      {/* Água */}
      {nutritionInfo.waterIntake && (
        <View style={[styles.nutrientDetailCard, { backgroundColor: colors.card }]}>
          <View style={[styles.nutrientIconContainer, { backgroundColor: '#118AB215' }]}>
            <Ionicons name="water-outline" size={20} color="#118AB2" />
          </View>
          <Text style={[styles.nutrientDetailValue, { color: colors.text }]}>
            {nutritionInfo.waterIntake}
          </Text>
          <Text style={[styles.nutrientDetailLabel, { color: colors.text + '70' }]}>
            ml água
          </Text>
        </View>
      )}
    </View>
  );

  // Renderizar informações de refeições
  const renderMealsInfo = () => (
    nutritionInfo.meals ? (
      <View style={styles.mealsInfoContainer}>
        <View style={[styles.mealsInfoIconContainer, { backgroundColor: '#FFD16615' }]}>
          <Ionicons name="restaurant-outline" size={18} color="#FFD166" />
        </View>
        <View style={styles.mealsInfoTextContainer}>
          <Text style={[styles.mealsInfoLabel, { color: colors.text + '70' }]}>
            Refeições Recomendadas
          </Text>
          <Text style={[styles.mealsInfoValue, { color: colors.text }]}>
            {nutritionInfo.meals} por dia
          </Text>
        </View>
      </View>
    ) : null
  );

  return (
    <TouchableOpacity
      style={styles.touchable}
      activeOpacity={0.9}
      disabled={!hasNutritionInfo || isEditMode}
    >
      <MotiView
        from={shouldAnimate ? { opacity: 0, translateY: 10 } : { opacity: 1, translateY: 0 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", delay: 200 }}
        style={[
          styles.container, 
          { backgroundColor: colors.light },
          isEditMode && styles.editModeContainer
        ]}
      >
        {!hasNutritionInfo ? (
          renderEmptyState()
        ) : (
          <View style={[
            styles.contentContainer,
            isEditMode && styles.editModeContentContainer
          ]}>
            {renderCaloriesHeader()}
            {renderStatsCards()}
          </View>
        )}
      </MotiView>
      
      {/* Bottom Sheet para customização */}
      <NutritionCustomizerSheet 
        ref={customizeSheetRef} 
        onSave={handleSaveComplete}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  contentContainer: {
    padding: 16,
    
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customizeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  statUnit: {
    fontSize: 12,
    fontWeight: "500",
  },
  // Estilos para o estado vazio
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  setupButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  setupButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  // Estilos para os detalhes dos nutrientes
  nutrientDetailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  nutrientDetailCard: {
    width: "23%",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  nutrientIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  nutrientDetailValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  nutrientDetailLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: "center",
  },
  // Estilos para informações de refeições
  mealsInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 4,
  },
  mealsInfoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  mealsInfoTextContainer: {
    flex: 1,
  },
  mealsInfoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  mealsInfoValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  touchable: {
    // Add any necessary styles for the TouchableOpacity
  },
  // Novos estilos para edição inline
  editInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    fontSize: 16,
    fontWeight: '700',
    padding: 0,
    minWidth: 40,
    maxWidth: 60,
  },
  caloriesInput: {
    minWidth: 60,
    maxWidth: 80,
  },
  macroEditContainer: {
    width: '100%',
  },
  miniSlider: {
    height: 20,
    width: '100%',
    marginTop: 8,
    marginBottom: 2,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  percentageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalWarning: {
    fontSize: 10,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  totalIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  totalIndicatorLabel: {
    fontSize: 11,
    color: '#888',
  },
  totalIndicatorValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  totalValid: {
    color: '#06D6A0',
  },
  totalInvalid: {
    color: '#FF6B6B',
  },
  editButtonsContainer: {
    flexDirection: 'row',
  },
  editActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelButton: {
    marginRight: 4,
  },
  saveButton: {
    // Estilo específico para o botão de salvar
  },
  editModeContainer: {
    borderRadius: 16,
    shadowOpacity: 0.05,
    elevation: 3,
    marginHorizontal: 12,
  },
  editModeContentContainer: {
    padding: 12,
    paddingTop: 10,
    paddingBottom: 16,
  },
  caloriesEditCard: {
    // Remover este estilo
  },
  macroEditCard: {
    // Remover este estilo
  },
  statsContainerEdit: {
    // Remover este estilo
  },
  sliderContainer: {
    width: '100%',
    marginTop: 8,
  },
  inputError: {
    borderBottomWidth: 1,
    borderBottomColor: '#FF4757',
  },
  errorsContainer: {
    marginBottom: 12,
  },
}); 