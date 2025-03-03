import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { useWorkouts } from '../../context/WorkoutContext';
import Colors from '../../constants/Colors';
import { Exercise } from '../../context/WorkoutContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

// Interface para as props do componente
interface WorkoutCardProps {
  workout: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  exercises: Exercise[];
  workoutTotals: {
    totalExercises: number;
    totalSets: number;
    completedExercises: number;
    completedSets: number;
  };
  index: number;
  onPress: () => void;
  onDeleteExercise: (exerciseId: string) => Promise<void>;
}

export default function WorkoutCard({
  workout,
  exercises,
  workoutTotals,
  index,
  onPress,
  onDeleteExercise,
}: WorkoutCardProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { toggleExerciseCompletion, toggleSetCompletion } = useWorkouts();
  const { user } = useAuth();
  const userId = user?.uid || 'no-user';
  
  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});
  
  // Efeito para forçar a re-renderização quando o tema ou usuário mudar
  useEffect(() => {
    setForceUpdate({});
  }, [theme, userId]);
  
  // Função para lidar com o feedback tátil
  const handleHapticFeedback = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  // Função para calcular a porcentagem de conclusão
  const calculateCompletionPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };
  
  // Função para alternar a conclusão de um exercício
  const handleToggleExerciseCompletion = async (exerciseId: string) => {
    await handleHapticFeedback();
    await toggleExerciseCompletion(workout.id, exerciseId);
  };
  
  // Função para renderizar as ações de deslize (swipe)
  const renderRightActions = useCallback(
    (exerciseId: string) => (
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: colors.danger + 'CC' }]}
        onPress={async () => {
          await handleHapticFeedback();
          await onDeleteExercise(exerciseId);
        }}
      >
        <Ionicons name="trash-outline" size={20} color="white" />
      </TouchableOpacity>
    ),
    [colors.danger, onDeleteExercise, handleHapticFeedback]
  );
  
  // Função para renderizar um exercício
  const renderExerciseItem = (exercise: Exercise, exerciseIndex: number) => (
    <Swipeable
      key={`exercise-${exercise.id}-${theme}-${userId}`}
      renderRightActions={() => renderRightActions(exercise.id)}
      friction={2}
      overshootRight={false}
    >
      <Animated.View
        key={`exercise-item-${exercise.id}-${theme}-${userId}`}
        entering={FadeInRight.delay(exerciseIndex * 100).duration(300)}
        style={[
          styles.exerciseItemContainer, 
          { backgroundColor: colors.light },
          exerciseIndex === 0 && styles.firstExerciseItem,
          exerciseIndex === exercises.length - 1 && styles.lastExerciseItem
        ]}
      >
        <View style={styles.exerciseItemContent}>
          <View style={styles.exerciseItemLeft}>
            <View style={styles.exerciseTextContainer}>
              <Text style={[styles.exerciseName, { color: colors.text }]}>
                {exercise.name}
              </Text>
              <Text style={[styles.exerciseDetails, { color: colors.text + '80' }]}>
                {exercise.sets.length} {exercise.sets.length === 1 ? 'série' : 'séries'} • 
                {exercise.sets.length > 0 && exercise.sets.every(set => set.reps === exercise.sets[0].reps) && exercise.sets.every(set => set.weight === exercise.sets[0].weight)
                  ? ` ${exercise.sets[0].reps} repetições • ${exercise.sets[0].weight} kg`
                  : ' Personalizado'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[
              styles.completionCheckbox,
              {
                borderColor: exercise.completed ? workout.color : colors.border,
                backgroundColor: exercise.completed ? workout.color : 'transparent',
              },
            ]}
            onPress={() => handleToggleExerciseCompletion(exercise.id)}
          >
            {exercise.completed && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </TouchableOpacity>
        </View>
        
        {/* Exibir detalhes das séries se forem personalizadas */}
        {exercise.sets.length > 0 && 
         (!exercise.sets.every(set => set.reps === exercise.sets[0].reps) || 
          !exercise.sets.every(set => set.weight === exercise.sets[0].weight)) && (
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ type: 'timing', duration: 300 }}
            style={[
              styles.setsDetailsContainer, 
              { 
                backgroundColor: theme === 'dark' ? colors.card : colors.background,
                borderColor: colors.border + '30'
              }
            ]}
          >
            <View style={[styles.setsDetailsHeader, { borderBottomColor: colors.border + '20' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="layers-outline" size={14} color={workout.color} style={{ marginRight: 6 }} />
                <Text style={[styles.setsDetailsTitle, { color: workout.color }]}>
                  Detalhes das Séries
                </Text>
              </View>
            </View>
            
            {exercise.sets.map((set, setIndex) => (
              <View 
                key={`set-${set.id}`} 
                style={[
                  styles.setDetailRow,
                  setIndex < exercise.sets.length - 1 && [
                    styles.setDetailRowWithBorder,
                    { borderBottomColor: colors.border + '30' }
                  ]
                ]}
              >
                <View style={[styles.setNumberBadge, { backgroundColor: workout.color + '20' }]}>
                  <Text style={[styles.setNumberText, { color: workout.color }]}>
                    {setIndex + 1}
                  </Text>
                </View>
                
                <View style={styles.setDetailInfo}>
                  <View style={styles.setDetailMetric}>
                    <Ionicons name="repeat-outline" size={14} color={colors.text + '70'} />
                    <Text style={[styles.setDetailMetricText, { color: colors.text }]}>
                      {set.reps} reps
                    </Text>
                  </View>
                  
                  <View style={styles.setDetailMetric}>
                    <Ionicons name="barbell-outline" size={14} color={colors.text + '70'} />
                    <Text style={[styles.setDetailMetricText, { color: colors.text }]}>
                      {set.weight} kg
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.setCompletionCheckbox,
                    {
                      borderColor: set.completed ? workout.color : colors.border,
                      backgroundColor: set.completed ? workout.color : 'transparent',
                    },
                  ]}
                  onPress={async () => {
                    await handleHapticFeedback();
                    await toggleSetCompletion(workout.id, exercise.id, set.id);
                  }}
                >
                  {set.completed && (
                    <Ionicons name="checkmark" size={12} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </MotiView>
        )}
        
        {exerciseIndex < exercises.length - 1 && (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
      </Animated.View>
    </Swipeable>
  );
  
  // Calcular a porcentagem de conclusão para a barra de progresso
  const completionPercentage = calculateCompletionPercentage(
    workoutTotals.completedSets,
    workoutTotals.totalSets
  );
  
  return (
    <MotiView
      key={`workout-card-${workout.id}-${theme}-${userId}`}
      style={[styles.workoutCard, { backgroundColor: colors.light }]}
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', delay: index * 100 }}
    >
      <View style={styles.workoutContent}>
        <TouchableOpacity
          style={styles.headerTouchable}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <View style={styles.workoutHeader}>
            <View style={styles.workoutTitleContainer}>
              <View
                style={[
                  styles.workoutIconContainer,
                  { backgroundColor: workout.color },
                ]}
              >
                <Ionicons
                  name={workout.icon as any}
                  size={18}
                  color="white"
                />
              </View>
              <View>
                <Text style={[styles.workoutTitle, { color: colors.text }]}>
                  {workout.name}
                </Text>
                {exercises.length > 0 && (
                  <Text
                    style={[styles.exerciseCount, { color: colors.text + '70' }]}
                  >
                    {exercises.length}{' '}
                    {exercises.length === 1 ? 'exercício' : 'exercícios'}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.workoutStatsContainer}>
              <Text style={[styles.completionPercentage, { color: workout.color }]}>
                {completionPercentage}%
              </Text>
              <Text
                style={[styles.completionLabel, { color: colors.text + '70' }]}
              >
                concluído
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {exercises.length > 0 && (
          <View style={[styles.progressContainer, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: workout.color },
                { width: `${completionPercentage}%` },
              ]}
            />
          </View>
        )}

        <View style={styles.exercisesContainer}>
          {exercises.length > 0 ? (
            <View key={`exercises-list-${theme}-${userId}`} style={styles.exercisesList}>
              {exercises.map((exercise, exerciseIndex) => renderExerciseItem(exercise, exerciseIndex))}
            </View>
          ) : (
            <MotiView
              key={`empty-container-${theme}-${userId}`}
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 500 }}
              style={styles.emptyContainer}
            >
              <LinearGradient
                key={`empty-gradient-${theme}-${userId}`}
                colors={[colors.light, colors.background]}
                style={styles.emptyGradient}
              >
                <Text style={[styles.emptyText, { color: colors.text + '50' }]}>
                  Adicione seu primeiro exercício
                </Text>
              </LinearGradient>
            </MotiView>
          )}
        </View>

        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: workout.color }]}
            onPress={(e) => {
              e.stopPropagation();
              handleHapticFeedback();
              // Navegar para a tela de adicionar exercício
              router.push({
                pathname: "/(add-exercise)",
                params: {
                  workoutId: workout.id,
                  workoutName: workout.name,
                  workoutColor: workout.color,
                },
              });
            }}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  workoutCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  workoutContent: {
    padding: 20,
    paddingBottom: 20,
  },
  headerTouchable: {
    marginBottom: 14,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseCount: {
    fontSize: 12,
    marginTop: 2,
  },
  workoutStatsContainer: {
    alignItems: 'flex-end',
  },
  completionPercentage: {
    fontSize: 18,
    fontWeight: '600',
  },
  completionLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  progressContainer: {
    height: 3,
    flexDirection: 'row',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressBar: {
    height: '100%',
  },
  exercisesContainer: {
    minHeight: 50,
    marginBottom: 50, // Espaço para o botão
  },
  exercisesList: {
    marginVertical: 0,
    marginHorizontal: -20, // Estender além do padding do card
  },
  exerciseItemContainer: {
    overflow: 'hidden',
  },
  firstExerciseItem: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  lastExerciseItem: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  exerciseItemContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseTextContainer: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 11,
  },
  completionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  emptyContainer: {
    marginVertical: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  emptyGradient: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 1,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  separator: {
    height: 1,
    opacity: 0.3,
    marginHorizontal: 16,
  },
  setsDetailsContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  setsDetailsHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  setsDetailsTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  setDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  setDetailRowWithBorder: {
    borderBottomWidth: 1,
  },
  setNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  setNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  setDetailInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: 10,
  },
  setDetailMetric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setDetailMetricText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  setCompletionCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 