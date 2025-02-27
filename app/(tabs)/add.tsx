import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import Colors from "../../constants/Colors";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AddScreen() {
  const colorScheme = useColorScheme() ?? "light";

  // Esta tela não deve ser visível diretamente, mas podemos redirecioná-la
  // ou mostrar um modal de opções

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: Colors[colorScheme].text }]}>
          Adicionar
        </Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.option,
              { backgroundColor: Colors[colorScheme].tint },
            ]}
            onPress={() => {
              // Navegar para adicionar treino
              router.push("/training/new");
            }}
          >
            <Ionicons name="barbell-outline" size={32} color="white" />
            <Text style={styles.optionText}>Novo Treino</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, { backgroundColor: "#4CAF50" }]}
            onPress={() => {
              // Navegar para adicionar refeição
              router.push("/nutrition/new");
            }}
          >
            <Ionicons name="nutrition-outline" size={32} color="white" />
            <Text style={styles.optionText}>Nova Refeição</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, { backgroundColor: "#FF9800" }]}
            onPress={() => {
              // Navegar para adicionar progresso
              router.push("/progress/new");
            }}
          >
            <Ionicons name="trending-up-outline" size={32} color="white" />
            <Text style={styles.optionText}>Registrar Progresso</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            // Voltar para a tela anterior
            router.back();
          }}
        >
          <Text
            style={[
              styles.closeButtonText,
              { color: Colors[colorScheme].text },
            ]}
          >
            Fechar
          </Text>
        </TouchableOpacity>
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
    marginBottom: 30,
  },
  optionsContainer: {
    width: "100%",
    flexDirection: "column",
    justifyContent: "center",
    gap: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 15,
  },
  closeButton: {
    marginTop: 40,
    padding: 15,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
