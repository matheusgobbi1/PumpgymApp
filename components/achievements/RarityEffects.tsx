import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface RarityEffectsProps {
  rarity: string;
  size: number;
  isUnlocked: boolean;
}

const RarityEffects: React.FC<RarityEffectsProps> = ({
  rarity,
  size,
  isUnlocked,
}) => {
  if (!isUnlocked) return null;

  // --- Epic Effect Animation ---
  const epicPulseAnim = useRef(new Animated.Value(0.7)).current; // Initial opacity

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (rarity === "epic" && isUnlocked) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(epicPulseAnim, {
            toValue: 0.9, // Fade in slightly more
            duration: 1200,
            useNativeDriver: true, // Use native driver for opacity
          }),
          Animated.timing(epicPulseAnim, {
            toValue: 0.6, // Fade out slightly more
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      // Reset animation if component updates and is no longer epic/unlocked
      epicPulseAnim.stopAnimation(); // Stop previous animation if running
      epicPulseAnim.setValue(0.7); // Reset to initial value
    }
    // Cleanup function to stop animation on unmount or when effect changes
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [rarity, isUnlocked, epicPulseAnim]);
  // --- End Epic Effect Animation ---

  const renderRareEffect = () => {
    return (
      <View
        style={[styles.rareContainer, { width: size + 8, height: size + 8 }]}
      >
        <View style={styles.sparkle} />
        <View style={[styles.sparkle, { transform: [{ rotate: "45deg" }] }]} />
        <View style={[styles.sparkle, { transform: [{ rotate: "90deg" }] }]} />
        <View style={[styles.sparkle, { transform: [{ rotate: "135deg" }] }]} />
      </View>
    );
  };

  const renderEpicEffect = () => {
    return (
      <Animated.View // Wrap LinearGradient in Animated.View
        style={{
          position: "absolute", // Required for Animated wrapper
          opacity: epicPulseAnim, // Apply animated opacity
          width: size + 10,
          height: size + 10,
          alignItems: "center", // Center the gradient inside
          justifyContent: "center",
        }}
      >
        <LinearGradient
          colors={[
            "rgba(167, 89, 216, 0.35)", // Slightly stronger start color
            "rgba(167, 89, 216, 0)",
            "rgba(167, 89, 216, 0.18)", // Slightly stronger end color
          ]}
          style={styles.epicAura} // Use style without size/position
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    );
  };

  const renderLegendaryEffect = () => {
    return (
      <>
        <LinearGradient
          colors={[
            "rgba(251, 166, 28, 0.25)",
            "rgba(251, 166, 28, 0)",
            "rgba(251, 166, 28, 0.12)",
          ]}
          style={[
            styles.legendaryAura,
            { width: size + 15, height: size + 15 },
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
        <View
          style={[
            styles.legendaryRays,
            { width: size + 18, height: size + 18 },
          ]}
        >
          {[...Array(8)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.legendaryRay,
                {
                  transform: [{ rotate: `${i * 45}deg` }],
                  width: 1,
                  height: size + 4,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.starsWrapper}>
          <View style={[styles.star, { top: -3, left: size / 2 - 5 }]}>
            <MaterialCommunityIcons
              name="star-four-points"
              size={10}
              color="#FFFFFF"
            />
          </View>

          <View style={[styles.star, { top: size / 2 - 5, right: -3 }]}>
            <MaterialCommunityIcons
              name="star-four-points"
              size={10}
              color="#FFFFFF"
            />
          </View>

          <View style={[styles.star, { bottom: -3, left: size / 2 - 5 }]}>
            <MaterialCommunityIcons
              name="star-four-points"
              size={10}
              color="#FFFFFF"
            />
          </View>

          <View style={[styles.star, { top: size / 2 - 5, left: -3 }]}>
            <MaterialCommunityIcons
              name="star-four-points"
              size={10}
              color="#FFFFFF"
            />
          </View>
        </View>
      </>
    );
  };

  switch (rarity) {
    case "rare":
      return renderRareEffect();
    case "epic":
      return renderEpicEffect();
    case "legendary":
      return renderLegendaryEffect();
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  rareContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  sparkle: {
    position: "absolute",
    width: 15,
    height: 1.5,
    backgroundColor: "rgba(83, 135, 223, 0.4)",
  },
  epicAura: {
    width: "100%", // Take full size of the Animated.View wrapper
    height: "100%",
    borderRadius: 100,
  },
  legendaryAura: {
    position: "absolute",
    borderRadius: 100,
    opacity: 0.8,
  },
  legendaryRays: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.5,
  },
  legendaryRay: {
    position: "absolute",
    backgroundColor: "rgba(255, 215, 0, 0.5)",
  },
  starsWrapper: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  star: {
    position: "absolute",
    zIndex: 1,
  },
});

export default React.memo(RarityEffects);
