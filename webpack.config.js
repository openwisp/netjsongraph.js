const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const SRC = path.join(__dirname, 'src');
const BUILD = path.join(__dirname, 'build');
const EXAMPLE = path.join(__dirname, 'examples');

module.exports = {
  entry: {
    html: path.join(EXAMPLE, 'refactor', 'performance', 'index.html'),
    js: [
      path.join(SRC, 'refactor', 'netjsongraph.three.js'),
      path.join(EXAMPLE, 'refactor', 'performance', 'index.js')
    ]
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
      test: /\.json$/,
      loader: 'json-loader'
    }, {
      test: /\.(png|jpg|svg)$/,
      loader: 'url?limit=80000'
    }, {
      test: require.resolve('sigma'),
      loader: 'imports?this=>window'
    }]
  },
  resolve: {
    extensions: ['', '.js']
  },
  devtool: 'evil-source-map',
  devServer: {
    contentBase: EXAMPLE,
    inline: true,
    progress: true,
    stats: { color: true },
    port: 3000
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: path.join(EXAMPLE, 'data/netjson.json'), to: 'data/netjson.json' },
    ])
  ],
  postcss: function () {
    return [
      require('precss'),
      require('autoprefixer')
    ];
  }
};
