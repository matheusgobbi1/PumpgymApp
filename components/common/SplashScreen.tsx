import React, { useEffect } from "react";
import { StyleSheet, View, Text, Dimensions, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import Colors from "../../constants/Colors";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Valores animados
  const logoScale = useSharedValue(0.8);
  const progressValue = useSharedValue(0);
  const loadingDotOpacity = useSharedValue(0);

  useEffect(() => {
    // Animação de entrada do logo
    logoScale.value = withTiming(1, {
      duration: 1200,
      easing: Easing.elastic(1.1),
    });

    // Animação da barra de progresso
    progressValue.value = withDelay(
      400,
      withTiming(1, {
        duration: 1800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    // Animação dos pontos de carregamento
    loadingDotOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.3, { duration: 600 })
      ),
      -1,
      true
    );
  }, []);

  // Estilos animados
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
    };
  });

  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${interpolate(
        progressValue.value,
        [0, 1],
        [0, 100],
        Extrapolate.CLAMP
      )}%`,
    };
  });

  const loadingDotsStyle = useAnimatedStyle(() => {
    return {
      opacity: loadingDotOpacity.value,
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      {/* Elementos de fundo sutis */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ type: "timing", duration: 1500 }}
        style={[styles.backgroundElement, { backgroundColor: colors.primary }]}
      />

      <View style={styles.contentContainer}>
        {/* Logo animado */}
        <Animated.View 
          style={[styles.logoContainer, logoAnimatedStyle]}
          entering={FadeIn.duration(800)}
        >
          <LinearGradient
            colors={[colors.primary, colors.primary + "CC"]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="fitness" size={50} color="#fff" />
          </LinearGradient>
        </Animated.View>

        {/* Título e subtítulo */}
        <Animated.Text
          entering={FadeInDown.duration(800).delay(300)}
          style={[styles.title, { color: colors.text }]}
        >
          Fitfolio
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.duration(800).delay(500)}
          style={[styles.subtitle, { color: colors.text + "CC" }]}
        >
          Transforme seu corpo, transforme sua vida
        </Animated.Text>

        {/* Barra de progresso */}
        <View style={styles.progressSection}>
          <View
            style={[styles.progressContainer, { backgroundColor: colors.light }]}
          >
            <Animated.View
              style={[
                styles.progressBar,
                { backgroundColor: colors.primary },
                progressAnimatedStyle,
              ]}
            />
          </View>

          <View style={styles.loadingTextContainer}>
            <Text style={[styles.loadingText, { color: colors.text + "99" }]}>
              Carregando
            </Text>
            <Animated.Text 
              style={[styles.loadingDots, { color: colors.primary }, loadingDotsStyle]}
            >
              ...
            </Animated.Text>
          </View>
        </View>

        {/* Ícones de funcionalidades */}
        <View style={styles.featuresContainer}>
          <Animated.View 
            entering={FadeIn.duration(600).delay(800)}
            style={styles.featureIconWrapper}
          >
            <View style={[styles.featureIcon, { backgroundColor: colors.light }]}>
              <Ionicons name="barbell-outline" size={20} color={colors.primary} />
            </View>
          </Animated.View>
          
          <Animated.View 
            entering={FadeIn.duration(600).delay(1000)}
            style={styles.featureIconWrapper}
          >
            <View style={[styles.featureIcon, { backgroundColor: colors.light }]}>
              <Ionicons name="nutrition-outline" size={20} color={colors.primary} />
            </View>
          </Animated.View>
          
          <Animated.View 
            entering={FadeIn.duration(600).delay(1200)}
            style={styles.featureIconWrapper}
          >
            <View style={[styles.featureIcon, { backgroundColor: colors.light }]}>
              <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
            </View>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  backgroundElement: {
    position: "absolute",
    width: width * 2,
    height: width * 2,
    borderRadius: width,
    top: -width,
    transform: [{ translateX: -width / 2 }],
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoGradient: {
    width: 90,
    height: 90,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 48,
    letterSpacing: 0.3,
  },
  progressSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 48,
  },
  progressContainer: {
    width: width * 0.7,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  loadingTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
  },
  loadingDots: {
    fontSize: 14,
    fontWeight: "bold",
  },
  featuresContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  featureIconWrapper: {
    padding: 4,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});
