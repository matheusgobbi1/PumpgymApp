import React, {
  useCallback,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  InteractionManager,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import HomeHeader from "../../components/home/HomeHeader";
import ProfileInfoCard from "../../components/profile/ProfileInfoCard";
import NutritionSummaryCard from "../../components/profile/NutritionSummaryCard";
import ProfileOptionsCard from "../../components/profile/ProfileOptionsCard";
import { useRouter } from "expo-router";
import { useNutrition } from "../../context/NutritionContext";
import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import ScreenTopGradient from "../../components/shared/ScreenTopGradient";

export default function Profile() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { nutritionInfo } = useNutrition();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const headerWrapperRef = useRef<View>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const [isUIReady, setIsUIReady] = useState(false);

  const screenTitle = t("profile.header.title");

  const handleHeaderLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== headerHeight) {
      setHeaderHeight(height);
    }
  };

  const scrollViewPaddingTop =
    headerHeight > 0 ? headerHeight : insets.top + 100;

  useEffect(() => {
    if (isUIReady) return;
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => setIsUIReady(true), 100);
    });
  }, [isUIReady]);

  const handleEditProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/onboarding");
  };

  const handleThemeToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTheme();
  };

  const handleAboutPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/about-modal");
  };

  useFocusEffect(
    useCallback(() => {
      // Lógica de foco aqui se necessário
    }, [])
  );

  const renderScreenContent = () => {
    if (!isUIReady) {
      return (
        <View style={styles.loadingContainer}>{/* Loading indicator */}</View>
      );
    }

    return (
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: scrollViewPaddingTop },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsContainer}>
          <ProfileInfoCard onEditPress={handleEditProfilePress} />
          <NutritionSummaryCard scrollViewRef={scrollViewRef} />
          <ProfileOptionsCard
            onThemeToggle={handleThemeToggle}
            onAboutPress={handleAboutPress}
          />
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenTopGradient />
      <View
        ref={headerWrapperRef}
        style={styles.headerWrapper}
        onLayout={handleHeaderLayout}
      >
        <HomeHeader title={screenTitle} />
      </View>
      {renderScreenContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  cardsContainer: {
    marginVertical: 0,
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  bottomPadding: {
    height: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
