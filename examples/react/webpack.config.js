module.exports = {
  entry: "./view/content/src/index.js",
  output: {
    path: "./view/content/scripts/",
    filename: "bundle.js"
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: "style!css" },
      {
        test: /\.jsx?$/,
        exclude: /(node_modules)/,
        loader: 'babel'
      }
    ]
  }
};
