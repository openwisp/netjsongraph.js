const path = require("path");
const fs = require("fs");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const Dotenv = require("dotenv-webpack");

const examples = fs.readdirSync(
  path.resolve(__dirname, "public/example_templates"),
);
const templates = examples.map(
  (example) =>
    new HtmlWebpackPlugin({
      filename: `examples/${example}`,
      inject: "head",
      scriptLoading: "blocking",
      template: path.resolve(__dirname, `public/example_templates/${example}`),
    }),
);
const minimizer = [
  new TerserPlugin({
    extractComments: false,
  }),
];

const isTest = process.env.TEST === "true";

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
        test: /\.js$/,
        include: path.resolve(__dirname, "src/js"),
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            plugins: isTest ? ["istanbul"] : [],
          },
        },
      },
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
  plugins: [
    ...templates,
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "public/assets"),
          to: path.resolve(__dirname, "dist/assets"),
        },
        {
          from: path.resolve(__dirname, "lib"),
          to: path.resolve(__dirname, "dist/lib"),
        },
        {
          from: path.resolve(__dirname, "src/css"),
          to: path.resolve(__dirname, "dist/lib/css"),
        },
        {
          from: path.resolve(__dirname, "src/js/netjsonWorker.js"),
          to: path.resolve(__dirname, "dist/lib/js/netjsonWorker.js"),
        },
        {
          from: path.resolve(__dirname, "index.html"),
          to: path.resolve(__dirname, "dist"),
        },
      ],
    }),
    new Dotenv({systemvars: true}),
  ],
  performance: {
    hints: false,
  },
});
