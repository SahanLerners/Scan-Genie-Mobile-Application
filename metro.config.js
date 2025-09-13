const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Ensure CSS is properly handled
config.resolver.sourceExts.push('css');
config.transformer.unstable_allowRequireContext = true;

module.exports = withNativeWind(config, { input: './global.css' });