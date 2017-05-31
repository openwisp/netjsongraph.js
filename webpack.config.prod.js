const webpack = require('webpack');
const path = require('path');
const SRC = path.join(__dirname, 'src');
const DIST = path.join(__dirname, 'dist');

module.exports = {
  entry: {
    js: path.join(SRC, 'netjsongraph.js')
  },
  output: {
    path: DIST,
    filename: 'netjsongraph.min.js'
  },
  module: {
    loaders: [{
      test: /\.html$/,
      loader: 'file?name=[name].[ext]'
    }, {
      test: /\.js$/,
      exclude: /node_modules/,
      loaders: [
        'babel-loader'
      ]
    }, {
      test: /\.css$/,
      loaders: [
        'style-loader',
        'css-loader?importLoaders=1',
        'postcss-loader'
      ]
    }, {
      test: /\.json/,
      loader: 'json-loader'
    }, {
      test: /\.(png|jpg|svg)$/,
      loader: 'url?limit=80000'
    }]
  },
  resolve: {
    extensions: ['', '.js']
  },
  postcss: function () {
    return [
      require('precss'),
      require('autoprefixer')
    ];
  },
  plugins: [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.AggressiveMergingPlugin()
  ]
};
