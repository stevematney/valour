require('babel-polyfill');
var path = require('path');

module.exports = {
  entry: './src/valour.js',
  output: {
    path: path.join(__dirname, 'lib'),
    filename: 'valour.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        query: {
          // https://github.com/babel/babel-loader#options
          cacheDirectory: true,
          presets: ['es2015', 'stage-2'],
          plugins: ['add-module-exports', 'array-includes']
        }
      }
    ]
  }
};
