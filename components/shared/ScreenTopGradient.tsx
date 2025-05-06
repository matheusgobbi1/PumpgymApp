import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import Colors from '../../constants/Colors';

const GRADIENT_EXTRA_HEIGHT = 20; // Altura adicional além da safe area

export default function ScreenTopGradient() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const gradientHeight = insets.top + GRADIENT_EXTRA_HEIGHT;

  // Retornar null para remover o gradiente - COMENTADO
  // return null;

  // Código original restaurado:
  return (
    <LinearGradient
      colors={[`${colors.background}`, `${colors.background}D0`, `${colors.background}00`]}
      style={[
        styles.gradient,
        { height: gradientHeight },
      ]}
      locations={[0, 0.7, 1]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1, // Reduzir zIndex para ficar atrás por padrão
  },
}); 