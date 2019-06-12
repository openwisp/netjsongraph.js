const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = (env, argv) => ({
  entry: ['./src/js/netjsongraph.render.js', './src/js/netjsongraph.core.js'],
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'netjsongraph.min.js'
  },
  module:{
    rules:[
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader",
        })
      },     
    ]
  },

  plugins:[
    new ExtractTextPlugin('css/[name].css'),
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.css$/,
      cssProcessor: require('cssnano'),
      cssProcessorPluginOptions: {
        preset: ['default', { discardComments: { removeAll: true } }],
      },
      canPrint: true
    }),
  ],

  devServer: {
    contentBase: "./",
    historyApiFallback: true,
    inline: true, 
    open: true,
    openPage: './examples/netjsongraph.html'
  },

  performance: {
    hints: false
  }
})
