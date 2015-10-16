module.exports = {
  entry: "./view/content/scripts/index.js",
  output: {
    path: "./view/content/scripts/",
    filename: "bundle.js"
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: "style!css" }
    ]
  }
};
