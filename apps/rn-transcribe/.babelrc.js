module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['@babel/preset-typescript', ['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    assumptions: {
      enumerableModuleMeta: true,
    },
    plugins: ['@babel/plugin-transform-class-static-block'],
    ignore: [/node_modules/],
  }
}
