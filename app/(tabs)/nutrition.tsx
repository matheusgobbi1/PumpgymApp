import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import Colors from "../../constants/Colors";

export default function NutritionScreen() {
  const colorScheme = useColorScheme() ?? "light";

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: Colors[colorScheme].text }]}>
          Nutrição
        </Text>
        <Text style={[styles.subtitle, { color: Colors[colorScheme].text }]}>
          Aqui você encontrará informações sobre sua dieta e planos
          nutricionais.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
});
