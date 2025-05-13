import "dotenv/config";

export default {
  name: "FitFolio",
  slug: "fitfolio",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "fitfolio",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: false,
    bundleIdentifier: "app.matheus.fitfolio",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSMotionUsageDescription:
        "O app usa o pedômetro para contar seus passos diários e monitorar sua atividade física.",

    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.fitfolio.app",
    permissions: ["android.permission.ACTIVITY_RECOGNITION"],
  },
  web: {
    favicon: "./assets/images/favicon.png",
  },
  plugins: ["expo-router", "expo-sensors", "expo-localization"],
  extra: {
    EDAMAM_APP_ID: process.env.EXPO_PUBLIC_EDAMAM_APP_ID,
    EDAMAM_APP_KEY: process.env.EXPO_PUBLIC_EDAMAM_APP_KEY,
    FATSECRET_CLIENT_ID: process.env.EXPO_PUBLIC_FATSECRET_CLIENT_ID,
    FATSECRET_CLIENT_SECRET: process.env.EXPO_PUBLIC_FATSECRET_CLIENT_SECRET,
    FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
    GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    REVENUECAT_IOS_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    REVENUECAT_ANDROID_API_KEY:
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,

    eas: {
      projectId: "1831e653-eb5e-45fc-a600-7a202c73cea9",
    },
  },
  updates: {
    url: "https://u.expo.dev/1831e653-eb5e-45fc-a600-7a202c73cea9",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
};
