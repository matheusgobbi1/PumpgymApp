import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  useColorScheme,
} from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useWorkouts } from '../../context/WorkoutContext';
import Colors from '../../constants/Colors';

// Definição dos tipos de treinos padrão
const DEFAULT_WORKOUT_TYPES = [
  {
    id: 'chest',
    name: 'Peito',
    icon: 'fitness-outline',
    color: '#FF5252',
    selected: false,
    isDefault: true,
  },
  {
    id: 'back',
    name: 'Costas',
    icon: 'body-outline',
    color: '#448AFF',
    selected: false,
    isDefault: true,
  },
  {
    id: 'legs',
    name: 'Pernas',
    icon: 'walk-outline',
    color: '#66BB6A',
    selected: false,
    isDefault: true,
  },
  {
    id: 'shoulders',
    name: 'Ombros',
    icon: 'barbell-outline',
    color: '#FFA726',
    selected: false,
    isDefault: true,
  },
  {
    id: 'arms',
    name: 'Braços',
    icon: 'bicycle-outline',
    color: '#AB47BC',
    selected: false,
    isDefault: true,
  },
  {
    id: 'abs',
    name: 'Abdômen',
    icon: 'body-outline',
    color: '#26C6DA',
    selected: false,
    isDefault: true,
  },
  {
    id: 'cardio',
    name: 'Cardio',
    icon: 'heart-outline',
    color: '#EF5350',
    selected: false,
    isDefault: true,
  },
  {
    id: 'fullbody',
    name: 'Full Body',
    icon: 'body-outline',
    color: '#7E57C2',
    selected: false,
    isDefault: true,
  },
];

// Ícones disponíveis para treinos personalizados
const AVAILABLE_ICONS = [
  'barbell-outline',
  'body-outline',
  'fitness-outline',
  'bicycle-outline',
  'walk-outline',
  'heart-outline',
  'pulse-outline',
  'speedometer-outline',
  'stopwatch-outline',
  'trophy-outline',
  'flame-outline',
  'flash-outline',
  'medal-outline',
  'tennisball-outline',
  'football-outline',
  'basketball-outline',
];

// Interface para o tipo de treino
export interface WorkoutType {
  id: string;
  name: string;
  icon: string;
  color: string;
  selected: boolean;
  isDefault?: boolean;
}

// Interface para as props do componente
interface WorkoutConfigSheetProps {
  onWorkoutConfigured: (workouts: WorkoutType[]) => void;
  selectedDate?: Date; // Data selecionada (opcional)
}

// Componente WorkoutConfigSheet
const WorkoutConfigSheet = forwardRef<BottomSheetModal, WorkoutConfigSheetProps>(
  ({ onWorkoutConfigured, selectedDate }, ref) => {
    // Referência para o BottomSheetModal
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    
    // Configuração do tema
    const { theme } = useTheme();
    const colors = Colors[theme];
    const systemTheme = useColorScheme();
    
    // Usar o contexto de treinos
    const { 
      workoutTypes: contextWorkoutTypes, 
      hasWorkoutTypesConfigured,
      workouts,
      selectedDate: contextSelectedDate
    } = useWorkouts();
    
    // Estados para gerenciar os tipos de treinos
    const [workoutTypes, setWorkoutTypes] = useState<WorkoutType[]>([]);
    const [isAddingCustomWorkout, setIsAddingCustomWorkout] = useState(false);
    const [customWorkoutName, setCustomWorkoutName] = useState('');
    const [customWorkoutIcon, setCustomWorkoutIcon] = useState('barbell-outline');
    const [customWorkoutColor, setCustomWorkoutColor] = useState('#FF5252');
    const [showIconSelector, setShowIconSelector] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    
    // Cores disponíveis para treinos personalizados
    const AVAILABLE_COLORS = [
      '#FF5252', // Vermelho
      '#448AFF', // Azul
      '#66BB6A', // Verde
      '#FFA726', // Laranja
      '#AB47BC', // Roxo
      '#26C6DA', // Ciano
      '#EF5350', // Vermelho claro
      '#7E57C2', // Roxo escuro
      '#42A5F5', // Azul claro
      '#FF7043', // Laranja escuro
      '#EC407A', // Rosa
      '#9CCC65', // Verde claro
    ];
    
    // Pontos de ancoragem para o BottomSheetModal
    const snapPoints = useMemo(() => ['70%', '90%'], []);
    
    // Expor a referência do BottomSheetModal para o componente pai
    useImperativeHandle(ref, () => bottomSheetModalRef.current!);
    
    // Função para atualizar os tipos de treino com base no dia atual
    const updateWorkoutTypesForCurrentDay = useCallback(() => {
      try {
        if (!hasWorkoutTypesConfigured || !contextWorkoutTypes || contextWorkoutTypes.length === 0) {
          return;
        }
        
        // Obter os treinos configurados para o dia atual
        const workoutsForSelectedDate = workouts && workouts[contextSelectedDate] ? workouts[contextSelectedDate] : {};
        const workoutIdsForSelectedDate = Object.keys(workoutsForSelectedDate);
        
        // Atualizar os tipos de treino com base nos treinos do dia atual
        setWorkoutTypes(prev => {
          // Criar uma cópia profunda para evitar mutações indesejadas
          const updatedWorkoutTypes = JSON.parse(JSON.stringify(contextWorkoutTypes));
          
          // Atualizar o estado 'selected' com base na presença no dia atual
          updatedWorkoutTypes.forEach(workoutType => {
            workoutType.selected = workoutIdsForSelectedDate.includes(workoutType.id);
          });
          
          return updatedWorkoutTypes;
        });
      } catch (error) {
        console.error('Erro ao atualizar tipos de treino:', error);
      }
    }, [hasWorkoutTypesConfigured, contextWorkoutTypes, workouts, contextSelectedDate]);
    
    // Atualizar os tipos de treino quando o bottom sheet for aberto
    const handleSheetChanges = useCallback((index: number) => {
      // Quando o bottom sheet é aberto pela primeira vez (index muda de -1 para outro valor)
      // Não atualizamos quando o usuário muda entre os snap points (70% e 90%)
      if (index === 0) {
        setIsSheetOpen(true);
        updateWorkoutTypesForCurrentDay();
      } else if (index === -1) {
        // Bottom sheet fechado
        setIsSheetOpen(false);
      }
    }, [updateWorkoutTypesForCurrentDay]);
    
    // Log para depuração
    useEffect(() => {
      // Implementação mantida vazia para remover logs
    }, [hasWorkoutTypesConfigured, contextWorkoutTypes, workoutTypes]);
    
    // Inicializar os tipos de treinos
    useEffect(() => {
      try {
        // Se já existirem tipos de treinos configurados, usá-los como base
        if (hasWorkoutTypesConfigured && contextWorkoutTypes && contextWorkoutTypes.length > 0) {
          // Obter os treinos configurados para o dia atual
          const workoutsForSelectedDate = workouts && workouts[contextSelectedDate] ? workouts[contextSelectedDate] : {};
          const workoutIdsForSelectedDate = Object.keys(workoutsForSelectedDate);
          
          // Criar uma cópia profunda dos tipos de treino do contexto
          const updatedWorkoutTypes = JSON.parse(JSON.stringify(contextWorkoutTypes));
          
          // Atualizar o estado 'selected' com base na presença no dia atual
          updatedWorkoutTypes.forEach(workoutType => {
            workoutType.selected = workoutIdsForSelectedDate.includes(workoutType.id);
          });
          
          // Adicionar tipos padrão que não estão no contexto
          DEFAULT_WORKOUT_TYPES.forEach(defaultType => {
            const existingType = updatedWorkoutTypes.find(type => type.id === defaultType.id);
            if (!existingType) {
              updatedWorkoutTypes.push({...defaultType, selected: false});
            }
          });
          
          setWorkoutTypes(updatedWorkoutTypes);
        } else {
          // Caso contrário, usar os tipos padrão
          setWorkoutTypes(DEFAULT_WORKOUT_TYPES);
        }
      } catch (error) {
        console.error('Erro ao inicializar tipos de treino:', error);
        // Em caso de erro, usar os tipos padrão
        setWorkoutTypes(DEFAULT_WORKOUT_TYPES);
      }
    }, [hasWorkoutTypesConfigured, contextWorkoutTypes, workouts, contextSelectedDate]);
    
    // Efeito para monitorar o estado do teclado
    useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        () => {
          setKeyboardVisible(true);
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
    
    // Formatar a data selecionada para exibição
    const formattedDate = useMemo(() => {
      if (!selectedDate) return '';
      
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      };
      
      return selectedDate.toLocaleDateString('pt-BR', options);
    }, [selectedDate]);
    
    // Renderizar o backdrop do bottom sheet
    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      ),
      []
    );
    
    // Atualizar os tipos de treino quando o contexto muda
    useEffect(() => {
      // Apenas atualizar se o bottom sheet estiver aberto
      if (isSheetOpen) {
        // Se não houver tipos de treino configurados, usar os tipos padrão
        if (!hasWorkoutTypesConfigured || !contextWorkoutTypes || contextWorkoutTypes.length === 0) {
          setWorkoutTypes(DEFAULT_WORKOUT_TYPES.map(type => ({...type, selected: false})));
          return;
        }
        
        // Obter os treinos configurados para o dia atual
        const workoutsForSelectedDate = workouts && workouts[contextSelectedDate] ? workouts[contextSelectedDate] : {};
        const workoutIdsForSelectedDate = Object.keys(workoutsForSelectedDate);
        
        // Atualizar os tipos de treino com base nos treinos do dia atual
        setWorkoutTypes(prev => {
          // Criar uma cópia profunda para evitar mutações indesejadas
          const updatedWorkoutTypes = JSON.parse(JSON.stringify(contextWorkoutTypes));
          
          // Atualizar o estado 'selected' com base na presença no dia atual
          updatedWorkoutTypes.forEach(workoutType => {
            workoutType.selected = workoutIdsForSelectedDate.includes(workoutType.id);
          });
          
          // Adicionar tipos padrão que não estão no contexto
          DEFAULT_WORKOUT_TYPES.forEach(defaultType => {
            const existingType = updatedWorkoutTypes.find(type => type.id === defaultType.id);
            if (!existingType) {
              updatedWorkoutTypes.push({...defaultType, selected: false});
            }
          });
          
          return updatedWorkoutTypes;
        });
      }
    }, [contextSelectedDate, workouts, hasWorkoutTypesConfigured, contextWorkoutTypes, isSheetOpen]);
    
    // Função para iniciar a adição de um treino personalizado
    const startAddingCustomWorkout = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsAddingCustomWorkout(true);
      setCustomWorkoutName('');
      setCustomWorkoutIcon('barbell-outline');
      setCustomWorkoutColor('#FF5252');
      setShowIconSelector(false);
    }, []);
    
    // Função para cancelar a adição de um treino personalizado
    const cancelAddingCustomWorkout = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsAddingCustomWorkout(false);
      Keyboard.dismiss();
    }, []);
    
    // Função para adicionar um treino personalizado
    const addCustomWorkout = useCallback(() => {
      if (!customWorkoutName.trim()) return;
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const newWorkout: WorkoutType = {
        id: `custom-${Date.now()}`,
        name: customWorkoutName.trim(),
        icon: customWorkoutIcon,
        color: customWorkoutColor,
        selected: true,
      };
      
      console.log('Adicionando treino personalizado:', newWorkout);
      
      setWorkoutTypes(prev => [...prev, newWorkout]);
      setIsAddingCustomWorkout(false);
      setCustomWorkoutName('');
      Keyboard.dismiss();
    }, [customWorkoutName, customWorkoutIcon, customWorkoutColor]);
    
    // Função para alternar a seleção de um treino
    const toggleWorkoutSelection = useCallback((id: string) => {
      Haptics.selectionAsync();
      
      setWorkoutTypes(prev => {
        const updated = prev.map(workout =>
          workout.id === id
            ? { ...workout, selected: !workout.selected }
            : workout
        );
        
        return updated;
      });
    }, []);
    
    // Função para selecionar todos os treinos
    const selectAllWorkouts = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      setWorkoutTypes(prev => {
        const updated = prev.map(workout => ({ ...workout, selected: true }));
        console.log('Selecionando todos os treinos. Total:', updated.length);
        return updated;
      });
    }, []);
    
    // Função para confirmar a configuração dos treinos
    const confirmWorkoutConfig = useCallback(() => {
      const selectedWorkouts = workoutTypes.filter(workout => workout.selected);
      
      if (selectedWorkouts.length === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      
      // Garantir que todos os treinos selecionados tenham a propriedade selected como true
      const workoutsToSave = selectedWorkouts.map(workout => ({
        ...workout,
        selected: true
      }));
      
      // Garantir que todos os treinos não selecionados tenham a propriedade selected como false
      const nonSelectedWorkouts = workoutTypes.filter(workout => !workout.selected);
      const nonSelectedWorkoutsToSave = nonSelectedWorkouts.map(workout => ({
        ...workout,
        selected: false
      }));
      
      // Combinar os treinos selecionados e não selecionados
      const allWorkoutsToSave = [...workoutsToSave, ...nonSelectedWorkoutsToSave];
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onWorkoutConfigured(allWorkoutsToSave);
      bottomSheetModalRef.current?.dismiss();
    }, [workoutTypes, onWorkoutConfigured]);
    
    // Função para remover um treino
    const removeWorkout = useCallback((id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      setWorkoutTypes(prev => prev.filter(workout => workout.id !== id));
    }, []);
    
    // Função para renderizar as ações de deslize (swipe)
    const renderRightActions = useCallback(
      (id: string, isDefault: boolean | undefined) => {
        if (isDefault) return null;
        
        return (
          <TouchableOpacity
            style={[styles.swipeAction, { backgroundColor: colors.danger }]}
            onPress={() => removeWorkout(id)}
          >
            <Ionicons name="trash-outline" size={24} color="white" />
          </TouchableOpacity>
        );
      },
      [colors.danger, removeWorkout]
    );
    
    // Renderização do componente
    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
        onDismiss={() => {
          setIsSheetOpen(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Configurar Treinos
            </Text>
            {selectedDate && (
              <Text style={[styles.subtitle, { color: colors.text + '80' }]}>
                Para {formattedDate}
              </Text>
            )}
          </View>
          
          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.workoutTypesContainer}>
              {workoutTypes.map((workout) => (
                <Animated.View
                  key={`workout-${workout.id}-${theme}`}
                  entering={FadeIn.delay(100 * workoutTypes.indexOf(workout))}
                  style={styles.workoutCardWrapper}
                >
                  <Swipeable
                    renderRightActions={() =>
                      renderRightActions(workout.id, workout.isDefault)
                    }
                    friction={2}
                    overshootRight={false}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggleWorkoutSelection(workout.id)}
                    >
                      <View
                        style={[
                          styles.workoutCard,
                          workout.selected && styles.workoutCardSelected,
                          {
                            backgroundColor: workout.selected
                              ? workout.color + '20'
                              : colors.card,
                            borderColor: workout.selected
                              ? workout.color
                              : colors.border,
                            borderWidth: workout.selected ? 2 : 1,
                          },
                        ]}
                      >
                        <View style={styles.workoutCardContent}>
                          <View
                            style={[
                              styles.workoutIconContainer,
                              { backgroundColor: workout.color },
                            ]}
                          >
                            <Ionicons
                              name={workout.icon as any}
                              size={24}
                              color="white"
                            />
                          </View>
                          <View style={styles.workoutInfo}>
                            <Text
                              style={[
                                styles.workoutName,
                                {
                                  color: colors.text,
                                  fontWeight: workout.selected ? '700' : '600',
                                },
                              ]}
                            >
                              {workout.name}
                            </Text>
                          </View>
                          <View style={styles.checkboxContainer}>
                            <View
                              style={[
                                styles.checkbox,
                                {
                                  borderColor: workout.selected
                                    ? workout.color
                                    : colors.border,
                                  backgroundColor: workout.selected
                                    ? workout.color
                                    : 'transparent',
                                },
                              ]}
                            >
                              {workout.selected && (
                                <Ionicons
                                  name="checkmark"
                                  size={18}
                                  color="white"
                                />
                              )}
                            </View>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Swipeable>
                </Animated.View>
              ))}
            </View>
            
            {isAddingCustomWorkout ? (
              <MotiView
                key={`custom-workout-form-${theme}`}
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ type: 'timing', duration: 300 }}
                style={[
                  styles.customWorkoutContainer,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.customWorkoutHeader}>
                  <Text style={[styles.customWorkoutTitle, { color: colors.text }]}>
                    Treino Personalizado
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={cancelAddingCustomWorkout}
                  >
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.customWorkoutForm}>
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Nome do Treino
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                      placeholder="Ex: Yoga, CrossFit, Funcional..."
                      placeholderTextColor={colors.text + '50'}
                      value={customWorkoutName}
                      onChangeText={setCustomWorkoutName}
                      autoCapitalize="words"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Ícone
                    </Text>
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
                        name={customWorkoutIcon as any}
                        size={24}
                        color={customWorkoutColor}
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
                      key={`icon-grid-${theme}`}
                      from={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 120 }}
                      transition={{ type: 'timing', duration: 300 }}
                      style={styles.iconGrid}
                    >
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.iconGridContent}>
                          {AVAILABLE_ICONS.map((icon) => (
                            <TouchableOpacity
                              key={`icon-${icon}-${theme}`}
                              style={[
                                styles.iconItem,
                                { 
                                  backgroundColor: 
                                    icon === customWorkoutIcon 
                                      ? customWorkoutColor 
                                      : colors.background,
                                  borderColor: colors.border,
                                },
                              ]}
                              onPress={() => {
                                setCustomWorkoutIcon(icon);
                                Haptics.selectionAsync();
                              }}
                            >
                              <Ionicons
                                name={icon as any}
                                size={24}
                                color={
                                  icon === customWorkoutIcon ? 'white' : colors.text
                                }
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </MotiView>
                  )}
                  
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Cor
                    </Text>
                    <View style={styles.colorGrid}>
                      {AVAILABLE_COLORS.map((color) => (
                        <TouchableOpacity
                          key={`color-${color}-${theme}`}
                          style={[
                            styles.colorItem,
                            { 
                              backgroundColor: color,
                              borderWidth: color === customWorkoutColor ? 3 : 0,
                              borderColor: colors.background,
                            },
                          ]}
                          onPress={() => {
                            setCustomWorkoutColor(color);
                            Haptics.selectionAsync();
                          }}
                        />
                      ))}
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      { backgroundColor: customWorkoutColor },
                      !customWorkoutName.trim() && styles.addButtonDisabled,
                    ]}
                    onPress={addCustomWorkout}
                    disabled={!customWorkoutName.trim()}
                  >
                    <Text style={styles.addButtonText}>Adicionar Treino</Text>
                  </TouchableOpacity>
                </View>
              </MotiView>
            ) : (
              <TouchableOpacity
                style={[styles.addCustomButton, { borderColor: colors.border }]}
                onPress={startAddingCustomWorkout}
              >
                <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                <Text style={[styles.addCustomText, { color: colors.text }]}>
                  Adicionar treino personalizado
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          
          {/* Esconder o footer quando o teclado estiver visível e estiver adicionando treino personalizado */}
          {!(keyboardVisible && isAddingCustomWorkout) && (
            <View style={[
              styles.footer, 
              { borderTopColor: colors.text + '10' },
              { backgroundColor: colors.background }
            ]}>
              <TouchableOpacity
                style={[styles.selectAllButton, { borderColor: colors.border }]}
                onPress={selectAllWorkouts}
              >
                <Text style={[styles.selectAllText, { color: colors.primary }]}>
                  Selecionar Todos
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { backgroundColor: colors.primary },
                  !workoutTypes.some(workout => workout.selected) && styles.confirmButtonDisabled,
                ]}
                onPress={confirmWorkoutConfig}
                disabled={!workoutTypes.some(workout => workout.selected)}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </BottomSheetModal>
    );
  }
);

export default WorkoutConfigSheet;

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
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  workoutTypesContainer: {
    marginBottom: 20,
  },
  workoutCardWrapper: {
    marginBottom: 12,
  },
  workoutCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  workoutCardSelected: {
    elevation: 4,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  workoutCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 80,
  },
  workoutIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  workoutInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  workoutName: {
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
  customWorkoutContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  customWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customWorkoutTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  customWorkoutForm: {
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  colorItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
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