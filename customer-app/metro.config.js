const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace root
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force resolve react and react-native to local versions to avoid conflicts with React 19 in root
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    return context.resolveRequest(context, path.resolve(projectRoot, 'node_modules', moduleName), platform);
  }
  if (moduleName === 'react-native' || moduleName.startsWith('react-native/')) {
    return context.resolveRequest(context, path.resolve(projectRoot, 'node_modules', moduleName), platform);
  }
  // Optionally force react-dom as well for web
  if (moduleName === 'react-dom' || moduleName.startsWith('react-dom/')) {
    return context.resolveRequest(context, path.resolve(projectRoot, 'node_modules', moduleName), platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Add support for modern ESM packages like framer-motion
config.resolver.sourceExts.push('mjs');
config.resolver.sourceExts.push('cjs');

module.exports = config;
