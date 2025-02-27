import { StyleSheet, Text, View, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import Colors from "../../constants/Colors";

// Dados de exemplo para treinos
const trainingData = [
  { id: "1", name: "Treino A - Peito e Tríceps", day: "Segunda-feira" },
  { id: "2", name: "Treino B - Costas e Bíceps", day: "Terça-feira" },
  { id: "3", name: "Treino C - Pernas", day: "Quarta-feira" },
  { id: "4", name: "Treino D - Ombros e Abdômen", day: "Quinta-feira" },
  { id: "5", name: "Treino E - Full Body", day: "Sexta-feira" },
];

export default function TrainingScreen() {
  const colorScheme = useColorScheme() ?? "light";

  const renderTrainingItem = ({ item }) => (
    <View
      style={[
        styles.trainingItem,
        { backgroundColor: Colors[colorScheme].card },
      ]}
    >
      <Text style={[styles.trainingName, { color: Colors[colorScheme].text }]}>
        {item.name}
      </Text>
      <Text
        style={[
          styles.trainingDay,
          { color: Colors[colorScheme].tabIconDefault },
        ]}
      >
        {item.day}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: Colors[colorScheme].text }]}>
          Meus Treinos
        </Text>

        <FlatList
          data={trainingData}
          renderItem={renderTrainingItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
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
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  list: {
    flex: 1,
  },
  trainingItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  trainingName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  trainingDay: {
    fontSize: 14,
  },
});
