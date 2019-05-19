const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = (env, argv) => ({
  entry:{
    move: './src/netjsongraph.js',
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'js/[name].js'
  },
  module:{
    rules:[
      {
        test: /\.css$/,
        // use: ["style-loader", "css-loader"],
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader",
          // publicPath: "../"
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

    new HtmlWebpackPlugin({
      template:'./examples/index.html',
      filename:'index.html',
      inject:true,
      hash:false,
      // chunks:['move'],
    }),
  ],

  devServer: {
    contentBase: "./",
    historyApiFallback: true,
    inline: true, 
    open: true,
    openPage: './examples/index.html'
  },

  performance: {
    hints: false
  }
})