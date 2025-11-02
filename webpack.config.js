const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const CompressionPlugin = require("compression-webpack-plugin");

const examples = fs.readdirSync(path.resolve(__dirname, "public/example_templates"));
const templates = examples.map(
  (example) =>
    new HtmlWebpackPlugin({
      filename: `examples/${example}`,
      inject: "head",
      scriptLoading: "blocking",
      template: path.resolve(__dirname, `public/example_templates/${example}`),
    }),
);
const getMinimizers = (isProduction) => {
  const minimizers = [];
  if (isProduction) {
    minimizers.push(
      new TerserPlugin({
        extractComments: false,
        parallel: true,
        terserOptions: {
          compress: {
            passes: 3,
            dead_code: true,
            unused: true,
            toplevel: true,
            reduce_vars: true,
            collapse_vars: true,
            evaluate: true,
            conditionals: true,
            sequences: true,
            properties: true,
            booleans: true,
            if_return: true,
            join_vars: true,
            side_effects: true,
            negate_iife: true,
            hoist_funs: true,
            hoist_vars: false,
            pure_getters: true,
            unsafe: true,
            unsafe_comps: true,
            unsafe_Function: true,
            unsafe_math: true,
            unsafe_proto: true,
            unsafe_regexp: true,
            unsafe_undefined: true,
          },
          output: {
            comments: false,
            ascii_only: true,
          },
        },
      }),
    );
  }
  return minimizers;
};

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";
  const isDevelopment = !isProduction;

  return {
    entry: "./src/js/netjsongraph.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: isProduction
        ? "netjsongraph.[contenthash:8].min.js"
        : "netjsongraph.js",
      clean: true,
      publicPath: "/",
    },
    devtool: isDevelopment ? "eval-source-map" : "source-map",
    optimization: {
      minimize: isProduction,
      minimizer: getMinimizers(isProduction),
      usedExports: true,
      sideEffects: false,
      providedExports: true,
      concatenateModules: true,
      flagIncludedChunks: true,
      mangleExports: true,
      removeAvailableModules: true,
      removeEmptyChunks: true,
      mergeDuplicateChunks: true,
      innerGraph: true,
      moduleIds: "deterministic",
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
          type: "asset/resource",
          generator: {
            filename: "assets/[name].[hash:8][ext]",
          },
        },
      ],
    },
    devServer: {
      static: [
        {
          directory: path.join(__dirname, "/"),
          publicPath: "/",
        },
        {
          directory: path.join(__dirname, "dist"),
          publicPath: "/",
        },
      ],
      historyApiFallback: true,
      open: ["./index.html"],
      hot: true,
      client: {
        overlay: {
          errors: true,
          warnings: false,
          runtimeErrors: true,
        },
      },
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
      ...(isProduction
        ? [
            new CompressionPlugin({
              algorithm: "gzip",
              test: /\.(js|css|html|svg|json)$/,
              threshold: 1024,
              minRatio: 0.8,
              compressionOptions: {
                level: 9,
                chunkSize: 16384,
                windowBits: 15,
                memLevel: 8,
              },
            }),
            new CompressionPlugin({
              filename: "[path][base].br",
              algorithm: "brotliCompress",
              test: /\.(js|css|html|svg|json)$/,
              compressionOptions: {
                params: {
                  [require("zlib").constants.BROTLI_PARAM_QUALITY]: 11,
                  [require("zlib").constants.BROTLI_PARAM_SIZE_HINT]: 0,
                  [require("zlib").constants.BROTLI_PARAM_MODE]:
                    require("zlib").constants.BROTLI_MODE_TEXT,
                  [require("zlib").constants.BROTLI_PARAM_LGWIN]: 22,
                  [require("zlib").constants.BROTLI_PARAM_LGBLOCK]: 0,
                },
              },
              threshold: 1024,
              minRatio: 0.8,
            }),
          ]
        : []),
      ...(process.env.ANALYZE ? [new BundleAnalyzerPlugin()] : []),
    ],
    performance: {
      hints: isProduction ? "warning" : false,
      maxEntrypointSize: 400000,
      maxAssetSize: 300000,
    },
    resolve: {
      extensions: [".js", ".json"],
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
      mainFields: ["browser", "module", "main"],
      preferRelative: true,
    },
  };
};
