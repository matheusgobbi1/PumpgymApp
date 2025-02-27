// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Desativar o Watchman para evitar problemas de SHA-1
  watchFolders: [],
});

// Adiciona resolução para assets do expo-router
config.resolver.assetExts.push("png");

// Adiciona resolução para módulos problemáticos
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];

// Desativar o uso do Watchman
config.watchFolders = [path.resolve(__dirname)];
config.resolver.useWatchman = false;

// Configuração adicional para resolver problemas de módulos
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Deixar o Metro resolver outros módulos normalmente
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
