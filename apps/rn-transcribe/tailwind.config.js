const { buildConfig } = require('../../libs/ui/utils/src/tailwind.config')

module.exports = {
  ...buildConfig(__dirname),
  presets: [require('nativewind/preset')],
}
