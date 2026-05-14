const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// 1. Force Metro to ONLY look in the local node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// 2. STOP Metro from looking at parent directories for modules
config.resolver.disableHierarchicalLookup = true;

// 3. Ensure we only watch the project folder
config.watchFolders = [projectRoot, path.resolve(projectRoot, '../shared')];

config.resolver.sourceExts.push('mjs');
config.resolver.sourceExts.push('cjs');

module.exports = config;
