const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolve Firebase modules for web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle Firebase modules on web platform
  if (platform === 'web') {
    if (moduleName.startsWith('@react-native-firebase/')) {
      // Return empty module for Firebase on web
      return {
        type: 'empty',
      };
    }
    
    // Handle Firebase util postinstall issue
    if (moduleName === './postinstall.mjs') {
      return {
        type: 'empty',
      };
    }
  }
  
  // Default resolver
  return context.resolveRequest(context, moduleName, platform);
};

// Ignore Firebase and problematic packages
config.resolver.blacklistRE = /(node_modules\/.*\/@react-native-firebase\/.*|node_modules\/.*\/postinstall\.mjs)$/;

module.exports = config;
