import "dotenv/config";

export default {
  name: "FitFolio",
  slug: "fitfolio",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.matheus.fitfolio",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.matheus.fitfolio",
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
  },
};
