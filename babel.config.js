module.exports = {
  presets: [
    '@babel/env',
    {
      useBuiltIns: 'usage'
    },
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
