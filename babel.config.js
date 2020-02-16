module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'usage',
        corejs: 3
      }
    ],
    '@babel/typescript'
  ],
  plugins: [
    'add-module-exports',
    'array-includes',
    '@babel/transform-runtime',
    '@babel/proposal-object-rest-spread',
    'lodash',
    'transform-class-properties'
  ]
};
