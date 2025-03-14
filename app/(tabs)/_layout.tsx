import { Tabs } from "expo-router";
import {
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
import React, { useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

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
  const { theme } = useTheme();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

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
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        closeMenu();
        // Navegar para a tela de treino com parâmetro na URL
        router.push("/training?openWorkoutConfig=true");
      },
    },
    {
      icon: "nutrition-outline" as const,
      label: "Nova Refeição",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        closeMenu();
        // Navegar para a tela de nutrição com parâmetro na URL
        router.push("/nutrition?openMealConfig=true");
      },
    },
    {
      icon: "restaurant-outline" as const,
      label: "Configuração de Dieta",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        closeMenu();
        // Navegar para a tela de perfil com parâmetro na URL
        router.push("/profile?openDietSettings=true");
      },
    },
    {
      icon: "water-outline" as const,
      label: "Registrar Água",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        closeMenu();
        // Navegar para a tela de nutrição com parâmetro na URL para abrir o WaterIntakeSheet
        router.push("/nutrition?openWaterIntake=true");
      },
    },
  ];

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
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: colors.tabIconDefault,
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            bottom: insets.bottom > 0 ? insets.bottom : 10,
            marginHorizontal: width * 0.1,
            width: width * 0.8,
            alignSelf: "center",
            elevation: 8,
            backgroundColor: colors.background,
            borderRadius: 40,
            height: 70,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 8,
            },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            paddingBottom: 10,
            paddingTop: 10,
            borderTopWidth: 0,
          },
          tabBarShowLabel: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Início",
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <TabBarIcon name="home" color={color} />
                {focused && <View style={styles.activeIndicator} />}
              </View>
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: () => {
              Haptics.selectionAsync();
            },
          })}
        />
        <Tabs.Screen
          name="nutrition"
          options={{
            title: "Nutrição",
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <TabBarIcon5 name="apple-alt" color={color} />
                {focused && <View style={styles.activeIndicator} />}
              </View>
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: () => {
              Haptics.selectionAsync();
            },
          })}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "Adicionar",
            tabBarIcon: ({ color }) => (
              <View style={styles.fabContainer}>
                <View style={styles.fabShadow}>
                  <View
                    style={[
                      styles.fabBackground,
                      { backgroundColor: colors.primary },
                    ]}
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
                  </View>
                </View>
                <View style={styles.fabRing} />
              </View>
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              openMenu();
            },
          })}
        />
        <Tabs.Screen
          name="training"
          options={{
            title: "Treino",
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <TabBarIcon5 name="dumbbell" color={color} />
                {focused && <View style={styles.activeIndicator} />}
              </View>
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: () => {
              Haptics.selectionAsync();
            },
          })}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <TabBarIcon name="user" color={color} />
                {focused && <View style={styles.activeIndicator} />}
              </View>
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: () => {
              Haptics.selectionAsync();
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
                    style={[
                      styles.gridCardTouchable,
                      { backgroundColor: colors.light },
                    ]}
                    activeOpacity={0.9}
                    onPress={option.onPress}
                  >
                    <View style={styles.gridCardContent}>
                      <View
                        style={[
                          styles.gridIconContainer,
                          { backgroundColor: colors.primary + "20" },
                        ]}
                      >
                        <Ionicons
                          name={option.icon}
                          size={32}
                          color={colors.primary}
                        />
                      </View>
                      <Text
                        style={[styles.gridCardText, { color: colors.text }]}
                      >
                        {option.label}
                      </Text>
                    </View>
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
                    style={[
                      styles.gridCardTouchable,
                      { backgroundColor: colors.light },
                    ]}
                    activeOpacity={0.9}
                    onPress={option.onPress}
                  >
                    <View style={styles.gridCardContent}>
                      <View
                        style={[
                          styles.gridIconContainer,
                          { backgroundColor: colors.primary + "20" },
                        ]}
                      >
                        <Ionicons
                          name={option.icon}
                          size={32}
                          color={colors.primary}
                        />
                      </View>
                      <Text
                        style={[styles.gridCardText, { color: colors.text }]}
                      >
                        {option.label}
                      </Text>
                    </View>
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
  container: {
    flex: 1,
  },
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
    backgroundColor: "#1c9abe",
  },
  fabContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    top: 5,
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
  fabBackground: {
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
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    overflow: "hidden",
  },
  gridCardTouchable: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    overflow: "hidden",
    padding: 15,
  },
  gridCardContent: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  gridIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  gridCardText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
