import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";

const { width } = Dimensions.get("window");

interface ProfileStat {
  label: string;
  value: string;
  icon: string;
}

interface ProfileHeaderProps {
  user: {
    displayName: string;
    photoURL?: string;
    email: string;
  };
  stats: ProfileStat[];
  onEditProfile: () => void;
  onChangePhoto: () => void;
}

export default function ProfileHeader({
  user,
  stats,
  onEditProfile,
  onChangePhoto,
}: ProfileHeaderProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(400)}>
      <MotiView
        style={[
          styles.container,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 400 }}
      >
        <LinearGradient
          colors={[colors.primary + "40", colors.primary + "10"]}
          style={styles.headerBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Foto de perfil e informações */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.photoContainer}
            onPress={onChangePhoto}
            activeOpacity={0.8}
          >
            {user.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                style={styles.profilePhoto}
              />
            ) : (
              <View
                style={[
                  styles.profilePhoto,
                  styles.defaultPhoto,
                  { backgroundColor: colors.primary + "30" },
                ]}
              >
                <Ionicons name="person" size={50} color={colors.primary} />
              </View>
            )}
            <View
              style={[
                styles.changePhotoButton,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="camera" size={14} color="white" />
            </View>
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user.displayName}
            </Text>
            <Text style={[styles.userEmail, { color: colors.secondary }]}>
              {user.email}
            </Text>

            <TouchableOpacity
              style={[styles.editButton, { borderColor: colors.primary }]}
              onPress={onEditProfile}
            >
              <Text style={[styles.editButtonText, { color: colors.primary }]}>
                Editar Perfil
              </Text>
              <Ionicons
                name="create-outline"
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Estatísticas do usuário */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View
              key={`stat-${index}`}
              style={[
                styles.statItem,
                index < stats.length - 1 && {
                  borderRightWidth: 1,
                  borderRightColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Ionicons
                  name={stat.icon as any}
                  size={18}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.secondary }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
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
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  profileSection: {
    flexDirection: "row",
    padding: 16,
    paddingTop: 24,
    alignItems: "center",
  },
  photoContainer: {
    position: "relative",
    marginRight: 16,
  },
  profilePhoto: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  defaultPhoto: {
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  statsContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingVertical: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
});
