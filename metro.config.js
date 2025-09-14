const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add CSS support
config.resolver.sourceExts = [...config.resolver.sourceExts, 'css'];

// Enable require context for better module resolution
config.transformer.unstable_allowRequireContext = true;

// Ensure proper asset handling
config.resolver.assetExts = [...config.resolver.assetExts, 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

module.exports = withNativeWind(config, { input: './global.css' });