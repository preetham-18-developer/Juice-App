const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Senior Engineer Fix: Force-injects Kotlin version at the buildscript root.
 * This is the most robust way to override the 1.9.25 fallback in EAS.
 */
const withKotlinFix = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'gradle') {
      // We inject into the ext block at the very top of the buildscript
      if (!config.modResults.contents.includes("ext.kotlinVersion = '1.9.24'")) {
        config.modResults.contents = config.modResults.contents.replace(
          /buildscript \{/,
          "buildscript {\n    ext.kotlinVersion = '1.9.24'"
        );
      }
    }
    return config;
  });
};

module.exports = withKotlinFix;
