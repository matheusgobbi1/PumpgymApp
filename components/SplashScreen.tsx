import React from "react";
import { StyleSheet, View, Image, Text, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import Colors from "../constants/Colors";
import { useColorScheme } from "react-native";

export default function SplashScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.primary }]}>PumpGym</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Seu parceiro de treino e dieta
        </Text>

        <ActivityIndicator
          style={styles.loader}
          size="large"
          color={colors.primary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  },
});
