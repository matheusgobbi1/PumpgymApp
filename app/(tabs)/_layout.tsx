import { Tabs } from "expo-router";
import {
  useColorScheme,
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Text,
  Dimensions,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

function TabBarIcon5(props: {
  name: React.ComponentProps<typeof FontAwesome5>["name"];
  color: string;
}) {
  return <FontAwesome5 size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Animações para o menu flutuante
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const menuAnimations = useRef(
    Array(4)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;

  // Opções do menu
  const menuOptions = [
    {
      icon: "barbell-outline" as const,
      label: "Novo Treino",
      gradient: ["#FF5722", "#FF9800"] as const,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        closeMenu();
        // Navegar para criar novo treino
      },
    },
    {
      icon: "nutrition-outline" as const,
      label: "Nova Refeição",
      gradient: ["#4CAF50", "#8BC34A"] as const,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        closeMenu();
        // Navegar para criar nova refeição
      },
    },
    {
      icon: "fitness-outline" as const,
      label: "Registrar Medidas",
      gradient: ["#2196F3", "#03A9F4"] as const,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        closeMenu();
        // Navegar para registrar medidas
      },
    },
    {
      icon: "water-outline" as const,
      label: "Registrar Água",
      gradient: ["#00BCD4", "#3F51B5"] as const,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        closeMenu();
        // Navegar para registrar consumo de água
      },
    },
  ];

  // Animação de pulso para o botão FAB
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Cores para o gradiente do botão
  const gradientColors = [
    colorScheme === "dark" ? Colors.dark.primary : Colors.light.primary,
    colorScheme === "dark" ? Colors.dark.accent : Colors.light.accent,
    colorScheme === "dark" ? Colors.dark.info : Colors.light.info,
  ] as const;

  const openMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsMenuOpen(true);

    // Animar o backdrop
    Animated.timing(backdropOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animar cada item do menu em sequência
    menuAnimations.forEach((anim, index) => {
      Animated.sequence([
        Animated.delay(index * 80), // Atraso em cascata
        Animated.spring(anim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const closeMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Animar o fechamento em ordem reversa
    [...menuAnimations].reverse().forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    });

    // Fechar o backdrop
    Animated.timing(backdropOpacity, {
      toValue: 0,
      duration: 300,
      delay: 100,
      useNativeDriver: true,
    }).start(() => {
      setIsMenuOpen(false);
    });
  };

  // Obter o estilo para cada item do menu - voltando à posição original
  const getMenuItemStyle = (index: number) => {
    const translateY = menuAnimations[index].interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });

    const scale = menuAnimations[index].interpolate({
      inputRange: [0, 0.7, 1],
      outputRange: [0.7, 1.1, 1],
    });

    const opacity = menuAnimations[index].interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0, 0.8, 1],
    });

    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme].tint,
          tabBarInactiveTintColor:
            Colors[colorScheme === "dark" ? "light" : "dark"].tabIconDefault,
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            bottom: insets.bottom + 10,
            left: 20,
            right: 20,
            elevation: 5,
            backgroundColor: Colors[colorScheme].background,
            borderRadius: 25,
            height: 70,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 5,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.5,
            paddingBottom: 10,
            paddingTop: 10,
            borderTopWidth: 0,
          },
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Início",
            tabBarIcon: ({ color, focused }) => (
              <Animated.View
                style={[
                  styles.iconContainer,
                  focused && { transform: [{ scale: scaleAnim }] },
                ]}
              >
                <TabBarIcon name="home" color={color} />
                {focused && <View style={styles.activeIndicator} />}
              </Animated.View>
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: () => {
              Haptics.selectionAsync();
              Animated.sequence([
                Animated.timing(scaleAnim, {
                  toValue: 1.3,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]).start();
            },
          })}
        />
        <Tabs.Screen
          name="nutrition"
          options={{
            title: "Nutrição",
            tabBarIcon: ({ color, focused }) => (
              <Animated.View
                style={[
                  styles.iconContainer,
                  focused && { transform: [{ scale: scaleAnim }] },
                ]}
              >
                <TabBarIcon5 name="apple-alt" color={color} />
                {focused && <View style={styles.activeIndicator} />}
              </Animated.View>
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: () => {
              Haptics.selectionAsync();
              Animated.sequence([
                Animated.timing(scaleAnim, {
                  toValue: 1.3,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]).start();
            },
          })}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "Adicionar",
            tabBarIcon: ({ color }) => (
              <View style={styles.fabContainer}>
                <Animated.View
                  style={[
                    styles.fabShadow,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <LinearGradient
                    colors={gradientColors}
                    style={styles.fabGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <TouchableOpacity
                      style={styles.fab}
                      activeOpacity={0.8}
                      onPress={openMenu}
                    >
                      <Ionicons
                        name={isMenuOpen ? "close" : "add"}
                        size={35}
                        color="white"
                      />
                    </TouchableOpacity>
                  </LinearGradient>
                </Animated.View>
                <View style={styles.fabRing} />
              </View>
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              // Animação ao pressionar
              Animated.sequence([
                Animated.timing(pulseAnim, {
                  toValue: 0.8,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                  toValue: 1.2,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                  toValue: 1,
                  duration: 100,
                  useNativeDriver: true,
                }),
              ]).start();

              openMenu();
            },
          })}
        />
        <Tabs.Screen
          name="training"
          options={{
            title: "Treino",
            tabBarIcon: ({ color, focused }) => (
              <Animated.View
                style={[
                  styles.iconContainer,
                  focused && { transform: [{ scale: scaleAnim }] },
                ]}
              >
                <TabBarIcon5 name="dumbbell" color={color} />
                {focused && <View style={styles.activeIndicator} />}
              </Animated.View>
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: () => {
              Haptics.selectionAsync();
              Animated.sequence([
                Animated.timing(scaleAnim, {
                  toValue: 1.3,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]).start();
            },
          })}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color, focused }) => (
              <Animated.View
                style={[
                  styles.iconContainer,
                  focused && { transform: [{ scale: scaleAnim }] },
                ]}
              >
                <TabBarIcon name="user" color={color} />
                {focused && <View style={styles.activeIndicator} />}
              </Animated.View>
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: () => {
              Haptics.selectionAsync();
              Animated.sequence([
                Animated.timing(scaleAnim, {
                  toValue: 1.3,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]).start();
            },
          })}
        />
      </Tabs>

      {/* Menu Grid */}
      {isMenuOpen && (
        <Animated.View
          style={[styles.menuBackdrop, { opacity: backdropOpacity }]}
          pointerEvents={isMenuOpen ? "auto" : "none"}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={closeMenu}
          />

          <View style={styles.gridMenuContainer}>
            <View style={styles.gridRow}>
              {menuOptions.slice(0, 2).map((option, index) => (
                <Animated.View
                  key={index}
                  style={[styles.gridCard, getMenuItemStyle(index)]}
                >
                  <TouchableOpacity
                    style={styles.gridCardTouchable}
                    activeOpacity={0.9}
                    onPress={option.onPress}
                  >
                    <LinearGradient
                      colors={option.gradient}
                      style={styles.gridCardGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.cardDecoration} />
                      <View style={styles.cardDecorationTwo} />
                      <View style={styles.gridCardContent}>
                        <View style={styles.gridIconContainer}>
                          <Ionicons
                            name={option.icon}
                            size={32}
                            color="white"
                          />
                        </View>
                        <Text style={styles.gridCardText}>{option.label}</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
            <View style={styles.gridRow}>
              {menuOptions.slice(2, 4).map((option, index) => (
                <Animated.View
                  key={index + 2}
                  style={[styles.gridCard, getMenuItemStyle(index + 2)]}
                >
                  <TouchableOpacity
                    style={styles.gridCardTouchable}
                    activeOpacity={0.9}
                    onPress={option.onPress}
                  >
                    <LinearGradient
                      colors={option.gradient}
                      style={styles.gridCardGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.cardDecoration} />
                      <View style={styles.cardDecorationTwo} />
                      <View style={styles.gridCardContent}>
                        <View style={styles.gridIconContainer}>
                          <Ionicons
                            name={option.icon}
                            size={32}
                            color="white"
                          />
                        </View>
                        <Text style={styles.gridCardText}>{option.label}</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
  activeIndicator: {
    position: "absolute",
    bottom: -10,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.light.tint,
  },
  fabContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    top: -25,
    width: 70,
    height: 70,
    zIndex: 10,
  },
  fabShadow: {
    width: 65,
    height: 65,
    borderRadius: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
  fabGradient: {
    width: 65,
    height: 65,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  fabRing: {
    position: "absolute",
    width: 75,
    height: 75,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    zIndex: -1,
  },
  menuBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 5,
  },
  backdropTouchable: {
    width: "100%",
    height: "100%",
  },
  gridMenuContainer: {
    position: "absolute",
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 15,
  },
  gridCard: {
    width: width * 0.42,
    height: width * 0.42,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    overflow: "hidden",
  },
  gridCardTouchable: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    overflow: "hidden",
  },
  gridCardGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    position: "relative",
    overflow: "hidden",
  },
  cardDecoration: {
    position: "absolute",
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    backgroundColor: "rgba(255,255,255,0.15)",
    top: -width * 0.15,
    right: -width * 0.15,
  },
  cardDecorationTwo: {
    position: "absolute",
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: width * 0.1,
    backgroundColor: "rgba(255,255,255,0.1)",
    bottom: -width * 0.1,
    left: -width * 0.1,
  },
  gridCardContent: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    zIndex: 2,
  },
  gridIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "rgba(0,0,0,0.3)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  gridCardText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
