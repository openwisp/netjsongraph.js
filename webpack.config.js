const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = (env, argv) => ({
  entry: "./src/js/netjsongraph.js",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "netjsongraph.min.js",
  },
  devtool:
    argv.mode === "development" ? "cheap-module-source-map" : "source-map",
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  devServer: {
    static: "./",
    historyApiFallback: true,
    open: ["./index.html"],
  },
  performance: {
    hints: false,
  },
});
