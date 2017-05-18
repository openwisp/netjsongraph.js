const path = require('path');
const SRC = path.join(__dirname, 'src');
const BUILD = path.join(__dirname, 'build');

module.exports = {
  entry: {
    js: path.join(SRC, 'index.js')
  },
  output: {
    path: BUILD,
    filename: 'bundle.js'
  },
  module: {
    loaders: [{
      test: /\.html$/,
      loader: 'file?name=[name].[ext]'
    }, {
      test: /\.js$/,
      exclude: /node_modules/,
      loaders: [
        'babel-loader',
        'eslint-loader'
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
  devtool: 'evil-source-map',
  devServer: {
    contentBase: SRC,
    inline: true,
    progress: true,
    stats: { color: true },
    port: 3000
  },
  resolve: {
    extensions: ['', '.js']
  },
  postcss: function () {
    return [
      require('precss'),
      require('autoprefixer')
    ];
  }
};
