import React, { useEffect } from "react";
import { StyleSheet, View, Text, Dimensions, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
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
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  // Valores animados
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const pulseValue = useSharedValue(1);
  const rotateValue = useSharedValue(0);
  const progressValue = useSharedValue(0);

  useEffect(() => {
    // Animação de entrada do logo
    logoScale.value = withTiming(1, {
      duration: 800,
      easing: Easing.elastic(1.2),
    });
    logoOpacity.value = withTiming(1, { duration: 600 });

    // Animação de pulsação contínua
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Animação de rotação do ícone de engrenagem
    rotateValue.value = withRepeat(
      withTiming(360, {
        duration: 3000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Animação de entrada do título com atraso
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));

    // Animação de entrada do subtítulo com atraso maior
    subtitleOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));

    // Animação da barra de progresso
    progressValue.value = withDelay(
      1200,
      withTiming(1, {
        duration: 2000,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
  }, []);

  // Estilos animados
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: logoScale.value },
        { rotate: `${interpolate(rotateValue.value, [0, 360], [0, 360])}deg` },
      ],
      opacity: logoOpacity.value,
    };
  });

  const pulseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseValue.value }],
    };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
      transform: [
        {
          translateY: interpolate(
            titleOpacity.value,
            [0, 1],
            [20, 0],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const subtitleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: subtitleOpacity.value,
      transform: [
        {
          translateY: interpolate(
            subtitleOpacity.value,
            [0, 1],
            [20, 0],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${interpolate(
        progressValue.value,
        [0, 1],
        [5, 100],
        Extrapolate.CLAMP
      )}%`,
    };
  });

  const progressTextAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: progressValue.value,
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      {/* Elementos de fundo */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ type: "timing", duration: 2000 }}
        style={[styles.backgroundCircle, styles.circle1]}
      />
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ type: "timing", duration: 2000, delay: 200 }}
        style={[styles.backgroundCircle, styles.circle2]}
      />

      <View style={styles.contentContainer}>
        {/* Logo animado */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Animated.View style={[styles.pulseContainer, pulseAnimatedStyle]}>
            <LinearGradient
              colors={[colors.primary, "#6C63FF"]}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="fitness" size={60} color="#fff" />
            </LinearGradient>
          </Animated.View>

          {/* Ícones orbitando */}
          <MotiView
            from={{ opacity: 0, rotate: "0deg" }}
            animate={{ opacity: 1, rotate: "360deg" }}
            transition={{
              type: "timing",
              duration: 20000,
              loop: true,
              repeatReverse: false,
            }}
            style={styles.orbitContainer}
          >
            <View style={styles.orbitIconContainer}>
              <Ionicons
                name="nutrition-outline"
                size={24}
                color={colors.primary}
              />
            </View>
          </MotiView>

          <MotiView
            from={{ opacity: 0, rotate: "0deg" }}
            animate={{ opacity: 1, rotate: "-360deg" }}
            transition={{
              type: "timing",
              duration: 15000,
              loop: true,
              repeatReverse: false,
            }}
            style={[styles.orbitContainer, styles.orbit2]}
          >
            <View style={styles.orbitIconContainer}>
              <Ionicons name="barbell-outline" size={24} color="#FF6B6B" />
            </View>
          </MotiView>

          <MotiView
            from={{ opacity: 0, rotate: "0deg" }}
            animate={{ opacity: 1, rotate: "360deg" }}
            transition={{
              type: "timing",
              duration: 25000,
              loop: true,
              repeatReverse: false,
            }}
            style={[styles.orbitContainer, styles.orbit3]}
          >
            <View style={styles.orbitIconContainer}>
              <Ionicons name="water" size={24} color="#4ECDC4" />
            </View>
          </MotiView>
        </Animated.View>

        {/* Título e subtítulo */}
        <Animated.Text
          style={[styles.title, { color: colors.primary }, titleAnimatedStyle]}
        >
          PumpGym
        </Animated.Text>

        <Animated.Text
          style={[
            styles.subtitle,
            { color: colors.text },
            subtitleAnimatedStyle,
          ]}
        >
          Transforme seu corpo, transforme sua vida
        </Animated.Text>

        {/* Barra de progresso */}
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

        <Animated.Text
          style={[
            styles.progressText,
            { color: colors.text + "99" },
            progressTextAnimatedStyle,
          ]}
        >
          Carregando seu plano personalizado...
        </Animated.Text>
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
  backgroundCircle: {
    position: "absolute",
    borderRadius: 1000,
  },
  circle1: {
    width: width * 1.5,
    height: width * 1.5,
    backgroundColor: "#6C63FF",
    top: -width * 0.5,
    left: -width * 0.25,
    opacity: 0.1,
  },
  circle2: {
    width: width * 1.2,
    height: width * 1.2,
    backgroundColor: "#FF6B6B",
    bottom: -width * 0.4,
    right: -width * 0.3,
    opacity: 0.1,
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    width: 120,
    height: 120,
  },
  pulseContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  orbitContainer: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: "rgba(108, 99, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  orbit2: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderColor: "rgba(255, 107, 107, 0.2)",
  },
  orbit3: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderColor: "rgba(78, 205, 196, 0.2)",
  },
  orbitIconContainer: {
    position: "absolute",
    top: 0,
    left: "50%",
    width: 40,
    height: 40,
    marginLeft: -20,
    borderRadius: 20,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 40,
    opacity: 0.8,
  },
  progressContainer: {
    width: width * 0.7,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: "center",
  },
});
