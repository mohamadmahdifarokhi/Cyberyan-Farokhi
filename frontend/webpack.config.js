const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['@react-native-firebase'],
      },
    },
    argv
  );

  // Resolve Firebase modules for web
  config.resolve.alias = {
    ...config.resolve.alias,
    '@react-native-firebase/app': 'react-native-web',
    '@react-native-firebase/messaging': 'react-native-web',
  };

  // Ignore Firebase postinstall issues
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    path: false,
    crypto: false,
  };

  return config;
};
