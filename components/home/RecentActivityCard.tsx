import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";

const { width } = Dimensions.get("window");

interface Activity {
  id: string;
  type: "workout" | "meal" | "weight" | "water" | "goal";
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
  onPress?: () => void;
}

interface RecentActivityCardProps {
  activities: Activity[];
  onPressViewAll: () => void;
}

export default function RecentActivityCard({
  activities,
  onPressViewAll,
}: RecentActivityCardProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Formatar o tempo relativo (ex: "há 5 minutos", "há 2 horas")
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) {
      return diffDay === 1 ? "há 1 dia" : `há ${diffDay} dias`;
    } else if (diffHour > 0) {
      return diffHour === 1 ? "há 1 hora" : `há ${diffHour} horas`;
    } else if (diffMin > 0) {
      return diffMin === 1 ? "há 1 minuto" : `há ${diffMin} minutos`;
    } else {
      return "agora mesmo";
    }
  };

  const renderActivityItem = ({ item }: { item: Activity }) => {
    return (
      <TouchableOpacity
        style={[styles.activityItem, { borderBottomColor: colors.border }]}
        onPress={item.onPress}
        activeOpacity={0.7}
        disabled={!item.onPress}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: item.color + "20" }]}
        >
          <Ionicons name={item.icon as any} size={20} color={item.color} />
        </View>
        <View style={styles.activityContent}>
          <Text style={[styles.activityTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          <Text
            style={[styles.activityDescription, { color: colors.secondary }]}
            numberOfLines={1}
          >
            {item.description}
          </Text>
        </View>
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: colors.secondary }]}>
            {formatRelativeTime(item.timestamp)}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.secondary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View entering={FadeInDown.delay(500).duration(400)}>
      <MotiView
        style={[
          styles.container,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 400 }}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Atividades Recentes
          </Text>
          <TouchableOpacity
            style={[styles.viewAllButton, { borderColor: colors.border }]}
            onPress={onPressViewAll}
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>
              Ver Todas
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.activitiesList}
        />
      </MotiView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  activitiesList: {
    paddingBottom: 8,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  timeText: {
    fontSize: 12,
    marginRight: 4,
  },
});
