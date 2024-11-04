const { withNxMetro } = require('@nx/expo')
const { getDefaultConfig } = require('@expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const { mergeConfig } = require('metro-config')

const defaultConfig = getDefaultConfig(__dirname)
const { assetExts, sourceExts } = defaultConfig.resolver

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const customConfig = {
  cacheVersion: 'rn-transcribe',
  transformer: {
    hermesParser: true,
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'cjs', 'mjs', 'svg'],
  },
}

module.exports = withNxMetro(mergeConfig(defaultConfig, withNativeWind(customConfig, { input: './src/global.css' })), {
  // Change this to true to see debugging info.
  // Useful if you have issues resolving modules
  debug: false,
  // all the file extensions used for imports other than 'ts', 'tsx', 'js', 'jsx', 'json'
  extensions: [],
  // Specify folders to watch, in addition to Nx defaults (workspace libraries and node_modules)
  watchFolders: [],
})
