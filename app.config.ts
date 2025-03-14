import "dotenv/config";

export default {
  name: "FitFolio",
  slug: "fitfolio",
  version: "1.0.0",
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
    supportsTablet: true,
    bundleIdentifier: "com.fitfolio.app",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.fitfolio.app",
  },
  web: {
    favicon: "./assets/images/favicon.png",
  },
  plugins: ["expo-router"],
  extra: {
    EDAMAM_APP_ID: process.env.EXPO_PUBLIC_EDAMAM_APP_ID,
    EDAMAM_APP_KEY: process.env.EXPO_PUBLIC_EDAMAM_APP_KEY,
    FATSECRET_CLIENT_ID: process.env.EXPO_PUBLIC_FATSECRET_CLIENT_ID,
    FATSECRET_CLIENT_SECRET: process.env.EXPO_PUBLIC_FATSECRET_CLIENT_SECRET,
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
