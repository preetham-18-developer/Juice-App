const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for modern ESM packages like framer-motion
config.resolver.sourceExts.push('mjs');
config.resolver.sourceExts.push('cjs');

module.exports = config;
