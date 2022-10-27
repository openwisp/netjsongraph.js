const path = require("path");
const fs = require("fs");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const examples = fs.readdirSync(
  path.resolve(__dirname, "public/example_templates"),
);
const templates = examples.map((example) => {
  return new HtmlWebpackPlugin({
    filename: `examples/${example}`,
    inject: "head",
    scriptLoading: "blocking",
    template: path.resolve(__dirname, `public/example_templates/${example}`),
  });
});
const minimizer = [
  new TerserPlugin({
    extractComments: false,
  }),
];

module.exports = (env, argv) => ({
  entry: "./src/js/netjsongraph.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "netjsongraph.min.js",
  },
  devtool: argv.mode === "development" ? "eval-source-map" : "source-map",
  optimization: {
    minimize: true,
    minimizer: argv.mode === "production" ? minimizer : [],
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
    static: {
      directory: path.join(__dirname, "/"),
    },
    historyApiFallback: true,
    open: ["./index.html"],
    hot: true,
  },
  plugins: [...templates],
  performance: {
    hints: false,
  },
});
