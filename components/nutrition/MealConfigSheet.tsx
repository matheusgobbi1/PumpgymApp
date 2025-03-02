import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Animated,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { useMeals } from '../../context/MealContext';
import { Swipeable } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

// Definir interface para o tipo de refeição
interface MealType {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
}

// Tipos de refeições pré-definidas
const DEFAULT_MEAL_TYPES: MealType[] = [
  {
    id: 'breakfast',
    name: 'Café da Manhã',
    icon: 'sunny-outline',
    selected: false,
  },
  {
    id: 'morning_snack',
    name: 'Lanche da Manhã',
    icon: 'cafe-outline',
    selected: false,
  },
  {
    id: 'lunch',
    name: 'Almoço',
    icon: 'restaurant-outline',
    selected: false,
  },
  {
    id: 'afternoon_snack',
    name: 'Lanche da Tarde',
    icon: 'ice-cream-outline',
    selected: false,
  },
  {
    id: 'dinner',
    name: 'Jantar',
    icon: 'moon-outline',
    selected: false,
  },
  {
    id: 'supper',
    name: 'Ceia',
    icon: 'bed-outline',
    selected: false,
  },
];

// Ícones disponíveis para seleção
const AVAILABLE_ICONS = [
  'sunny-outline',
  'cafe-outline',
  'restaurant-outline',
  'ice-cream-outline',
  'moon-outline',
  'bed-outline',
  'nutrition-outline',
  'fast-food-outline',
  'pizza-outline',
  'beer-outline',
  'wine-outline',
  'fish-outline',
  'egg-outline',
  'fruit-outline',
  'water-outline',
];

interface MealConfigSheetProps {
  onMealConfigured: (meals: MealType[]) => void;
}

const MealConfigSheet = forwardRef<BottomSheetModal, MealConfigSheetProps>(({ onMealConfigured }, ref) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { mealTypes: existingMealTypes } = useMeals();
  
  // Ref para o bottom sheet
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  
  // Expor a referência para o componente pai
  useImperativeHandle(ref, () => {
    return bottomSheetModalRef.current!;
  });
  
  // Estados
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [customMealName, setCustomMealName] = useState('');
  const [customMealIcon, setCustomMealIcon] = useState('nutrition-outline');
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [isAddingCustomMeal, setIsAddingCustomMeal] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // Pontos de ancoragem do bottom sheet
  const snapPoints = useMemo(() => [ '90%'], []);
  
  // Inicializar os tipos de refeições com os existentes ou os padrões
  useEffect(() => {
    // Sempre inicializar com os tipos padrão, todos desmarcados
    const initialTypes = DEFAULT_MEAL_TYPES.map(type => ({...type, selected: false}));
    
    // Se existirem tipos configurados, marcá-los como selecionados
    if (existingMealTypes.length > 0) {
      // Marcar os tipos existentes como selecionados
      initialTypes.forEach(type => {
        const existingType = existingMealTypes.find(et => et.id === type.id);
        if (existingType) {
          type.selected = true;
        }
      });
      
      // Adicionar tipos personalizados que não estão nos padrões
      existingMealTypes.forEach(existingType => {
        const isCustomType = !initialTypes.some(dt => dt.id === existingType.id);
        if (isCustomType) {
          initialTypes.push({
            id: existingType.id,
            name: existingType.name,
            icon: existingType.icon,
            selected: true,
          } as MealType);
        }
      });
    }
    
    setMealTypes(initialTypes);
  }, [existingMealTypes]);
  
  // Detectar quando o teclado é aberto ou fechado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        // Expandir o bottom sheet para o tamanho máximo quando o teclado aparecer
        bottomSheetModalRef.current?.snapToIndex(1);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Função para fechar o bottom sheet
  const closeBottomSheet = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);
  
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
  
  // Função para selecionar/deselecionar uma refeição
  const toggleMealSelection = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMealTypes(prev => 
      prev.map(meal => 
        meal.id === id ? { ...meal, selected: !meal.selected } : meal
      )
    );
  }, []);
  
  // Função para adicionar uma refeição personalizada
  const addCustomMeal = useCallback(() => {
    if (customMealName.trim() === '') return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const newMeal: MealType = {
      id: `custom_${Date.now()}`,
      name: customMealName,
      icon: customMealIcon,
      selected: true,
    };
    
    setMealTypes(prev => [...prev, newMeal]);
    setCustomMealName('');
    setCustomMealIcon('nutrition-outline');
    setIsAddingCustomMeal(false);
    Keyboard.dismiss();
  }, [customMealName, customMealIcon]);
  
  // Função para iniciar a adição de uma refeição personalizada
  const startAddingCustomMeal = useCallback(() => {
    // Expandir o bottom sheet para o tamanho máximo
    bottomSheetModalRef.current?.snapToIndex(1);
    // Ativar o modo de adição de refeição personalizada
    setIsAddingCustomMeal(true);
  }, []);
  
  // Função para selecionar todas as refeições
  const selectAllMeals = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setMealTypes(prev => prev.map(meal => ({ ...meal, selected: true })));
  }, []);
  
  // Função para confirmar a configuração
  const confirmMealConfig = useCallback(() => {
    const selectedMeals = mealTypes.filter(meal => meal.selected);
    
    if (selectedMeals.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    // Log para depuração
    console.log('Refeições selecionadas:', selectedMeals.map(m => m.name).join(', '));
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onMealConfigured(selectedMeals);
    closeBottomSheet();
  }, [mealTypes, onMealConfigured, closeBottomSheet]);
  
  // Função para remover uma refeição
  const removeMeal = useCallback((id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setMealTypes(prev => prev.filter(meal => meal.id !== id));
  }, []);
  
  // Função para renderizar a ação de swipe
  const renderRightActions = useCallback((id: string, isDefaultMeal: boolean) => {
    // Não permitir excluir refeições padrão, apenas desmarcar
    if (isDefaultMeal) {
      return null;
    }
    
    return (
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: '#FF3B30CC' }]}
        onPress={() => {
          removeMeal(id);
        }}
      >
        <Ionicons name="trash-outline" size={20} color="white" />
      </TouchableOpacity>
    );
  }, [removeMeal]);
  
  // Efeito para animar a entrada do componente
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{
        backgroundColor: colors.text + '50',
        width: 40,
      }}
      backgroundStyle={{
        backgroundColor: colors.background,
      }}
      enablePanDownToClose
      enableDismissOnClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="none"
    >
      <KeyboardAvoidingView 
        style={[styles.container, { paddingBottom: insets.bottom }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Configure suas Refeições
          </Text>
          <Text style={[styles.subtitle, { color: colors.text + '80' }]}>
            Selecione as refeições que deseja acompanhar
          </Text>
        </View>
        
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            keyboardVisible && isAddingCustomMeal && { paddingBottom: 200 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Refeições pré-definidas */}
          <View style={styles.mealTypesContainer}>
            {mealTypes.map((meal, index) => {
              // Verificar se é uma refeição padrão
              const isDefaultMeal = DEFAULT_MEAL_TYPES.some(dt => dt.id === meal.id);
              
              return (
                <MotiView
                  key={meal.id}
                  style={styles.mealCardWrapper}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: 'timing',
                    duration: 300,
                    delay: index * 50,
                    easing: Easing.out(Easing.ease),
                  }}
                >
                  <Swipeable
                    renderRightActions={() => renderRightActions(meal.id, isDefaultMeal)}
                    enabled={!isDefaultMeal}
                  >
                    <TouchableOpacity
                      style={[
                        styles.mealCard,
                        { backgroundColor: colors.card },
                        meal.selected && styles.mealCardSelected,
                      ]}
                      onPress={() => toggleMealSelection(meal.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.mealCardContent,
                          meal.selected && { backgroundColor: colors.card },
                        ]}
                      >
                        <View style={[
                          styles.mealIconContainer,
                          { backgroundColor: meal.selected ? colors.primary + '20' : 'rgba(255, 255, 255, 0.2)' }
                        ]}>
                          <Ionicons
                            name={meal.icon as any}
                            size={24}
                            color={meal.selected ? colors.primary : colors.primary}
                          />
                        </View>
                        <View style={styles.mealInfo}>
                          <Text
                            style={[
                              styles.mealName,
                              { color: colors.text },
                            ]}
                          >
                            {meal.name}
                          </Text>
                        </View>
                        <View style={styles.checkboxContainer}>
                          <View
                            style={[
                              styles.checkbox,
                              { borderColor: meal.selected ? colors.primary : colors.border },
                              meal.selected && { backgroundColor: colors.primary },
                            ]}
                          >
                            {meal.selected && (
                              <Ionicons name="checkmark" size={16} color="white" />
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Swipeable>
                </MotiView>
              );
            })}
          </View>
          
          {/* Adicionar refeição personalizada */}
          {isAddingCustomMeal ? (
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring' }}
              style={[styles.customMealContainer, { backgroundColor: colors.card }]}
            >
              <View style={styles.customMealHeader}>
                <Text style={[styles.customMealTitle, { color: colors.text }]}>
                  Nova Refeição
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsAddingCustomMeal(false);
                    Keyboard.dismiss();
                  }}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.customMealForm}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Nome</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { 
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="Nome da refeição"
                    placeholderTextColor={colors.text + '50'}
                    value={customMealName}
                    onChangeText={setCustomMealName}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      if (customMealName.trim() !== '') {
                        addCustomMeal();
                      }
                    }}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Ícone</Text>
                  <TouchableOpacity
                    style={[
                      styles.iconSelector,
                      { 
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setShowIconSelector(!showIconSelector)}
                  >
                    <Ionicons
                      name={customMealIcon as any}
                      size={24}
                      color={colors.primary}
                    />
                    <Text style={[styles.iconSelectorText, { color: colors.text }]}>
                      Selecionar ícone
                    </Text>
                    <Ionicons
                      name={showIconSelector ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                </View>
                
                {showIconSelector && (
                  <MotiView
                    from={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 120 }}
                    transition={{ type: 'timing', duration: 300 }}
                    style={styles.iconGrid}
                  >
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.iconGridContent}>
                        {AVAILABLE_ICONS.map((icon) => (
                          <TouchableOpacity
                            key={icon}
                            style={[
                              styles.iconItem,
                              { 
                                backgroundColor: 
                                  icon === customMealIcon 
                                    ? colors.primary 
                                    : colors.background,
                                borderColor: colors.border,
                              },
                            ]}
                            onPress={() => {
                              setCustomMealIcon(icon);
                              Haptics.selectionAsync();
                            }}
                          >
                            <Ionicons
                              name={icon as any}
                              size={24}
                              color={
                                icon === customMealIcon ? 'white' : colors.text
                              }
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </MotiView>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: colors.primary },
                    !customMealName.trim() && styles.addButtonDisabled,
                  ]}
                  onPress={addCustomMeal}
                  disabled={!customMealName.trim()}
                >
                  <Text style={styles.addButtonText}>Adicionar Refeição</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          ) : (
            <TouchableOpacity
              style={[styles.addCustomButton, { borderColor: colors.border }]}
              onPress={startAddingCustomMeal}
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              <Text style={[styles.addCustomText, { color: colors.text }]}>
                Adicionar refeição personalizada
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        
        {/* Esconder o footer quando o teclado estiver visível e estiver adicionando refeição personalizada */}
        {!(keyboardVisible && isAddingCustomMeal) && (
          <View style={[
            styles.footer, 
            { borderTopColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            { backgroundColor: colors.background }
          ]}>
            <TouchableOpacity
              style={[styles.selectAllButton, { borderColor: colors.border }]}
              onPress={selectAllMeals}
            >
              <Text style={[styles.selectAllText, { color: colors.primary }]}>
                Selecionar Todas
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.confirmButton,
                { backgroundColor: colors.primary },
                !mealTypes.some(meal => meal.selected) && styles.confirmButtonDisabled,
              ]}
              onPress={confirmMealConfig}
              disabled={!mealTypes.some(meal => meal.selected)}
            >
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </BottomSheetModal>
  );
});

export default MealConfigSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mealTypesContainer: {
    marginBottom: 20,
  },
  mealCardWrapper: {
    marginBottom: 12,
  },
  mealCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mealCardSelected: {
    elevation: 4,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  mealCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 80,
  },
  mealIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mealInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
  },
  checkboxContainer: {
    marginLeft: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  addCustomText: {
    fontSize: 16,
    marginLeft: 8,
  },
  customMealContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  customMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customMealTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  customMealForm: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  iconSelector: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconSelectorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  iconGrid: {
    overflow: 'hidden',
  },
  iconGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  iconItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
  },
  addButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: Colors.light.background,
  },
  selectAllButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
}); 