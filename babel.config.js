module.exports = {
  presets: ['@babel/env', '@babel/typescript'],
  plugins: [
    'add-module-exports',
    'array-includes',
    '@babel/transform-runtime',
    '@babel/proposal-object-rest-spread'
  ]
};
