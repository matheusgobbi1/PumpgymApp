import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { useWorkouts } from '../../context/WorkoutContext';
import Colors from '../../constants/Colors';
import { WorkoutType } from './WorkoutConfigSheet';

const { width } = Dimensions.get('window');

interface EmptyWorkoutStateProps {
  onWorkoutConfigured: (workouts: WorkoutType[]) => void;
  onOpenWorkoutConfig: () => void; // Prop para abrir o bottom sheet
}

export default function EmptyWorkoutState({ onWorkoutConfigured, onOpenWorkoutConfig }: EmptyWorkoutStateProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { hasWorkoutTypesConfigured } = useWorkouts();
  
  // Estado para forçar re-renderização quando o tema mudar
  const [, setForceUpdate] = useState({});
  
  // Efeito para forçar a re-renderização quando o tema mudar
  useEffect(() => {
    // Forçar re-renderização quando o tema mudar
    setForceUpdate({});
  }, [theme]);
  
  // Função para abrir o bottom sheet
  const openWorkoutConfig = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onOpenWorkoutConfig();
  };
  
  return (
    <>
      <MotiView
        key={`empty-workout-${theme}`}
        style={styles.container}
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', delay: 300 }}
      >
        <View style={styles.illustrationContainer}>
          <MotiView
            key={`illustration-${theme}`}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 400 }}
          >
            <Ionicons name="barbell-outline" size={80} color={colors.primary} />
          </MotiView>
        </View>
        
        <MotiView
          key={`title-${theme}`}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 500 }}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Configure seus Treinos
          </Text>
        </MotiView>
        
        <MotiView
          key={`description-${theme}`}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 600 }}
        >
          <Text style={[styles.description, { color: colors.text + '80' }]}>
            Personalize seus treinos para acompanhar seu progresso de forma eficiente.
          </Text>
        </MotiView>
        
        <MotiView
          key={`button-${theme}`}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 700 }}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={openWorkoutConfig}
            activeOpacity={0.8}
          >
            <LinearGradient
              key={`button-gradient-${theme}`}
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Configurar Treinos</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>
        
        <MotiView
          key={`tips-${theme}`}
          from={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ type: 'timing', duration: 500, delay: 800 }}
          style={styles.tipsContainer}
        >
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.text + '70' }]}>
              Organize seus treinos por grupos musculares
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.text + '70' }]}>
              Registre exercícios, séries e repetições
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.text + '70' }]}>
              Acompanhe sua evolução ao longo do tempo
            </Text>
          </View>
        </MotiView>
      </MotiView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  illustrationContainer: {
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 40,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  tipsContainer: {
    width: '100%',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    marginLeft: 8,
  },
}); 