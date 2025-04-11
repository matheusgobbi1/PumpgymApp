import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../constants/Colors";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

export default function AddScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Esta tela não deve ser visível diretamente, mas podemos redirecioná-la
  // ou mostrar um modal de opções

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Adicionar</Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.option, { backgroundColor: colors.light }]}
            onPress={() => {
              // Navegar para adicionar treino
              router.push("/training/new");
            }}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons
                name="barbell-outline"
                size={24}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.optionText, { color: colors.text }]}>
              Novo Treino
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, { backgroundColor: colors.light }]}
            onPress={() => {
              // Navegar para adicionar refeição
              router.push("/nutrition/new");
            }}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons
                name="nutrition-outline"
                size={24}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.optionText, { color: colors.text }]}>
              Nova Refeição
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, { backgroundColor: colors.light }]}
            onPress={() => {
              // Navegar para adicionar progresso
              router.push("/progress/new");
            }}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons
                name="trending-up-outline"
                size={24}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.optionText, { color: colors.text }]}>
              Registrar Progresso
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            // Voltar para a tela anterior
            router.back();
          }}
        >
          <Text style={[styles.closeButtonText, { color: colors.text }]}>
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
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
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
