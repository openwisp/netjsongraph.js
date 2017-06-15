const path = require('path');
const SRC = path.join(__dirname, 'src', 'refactor');
const EXAMPLE = path.join(__dirname, 'examples', 'refactor');

module.exports = {
  entry: {
    html: path.join(EXAMPLE, 'index.html'),
    js: path.join(SRC, 'netjsongraph.three.js')
  },
  output: {
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
  postcss: function () {
    return [
      require('precss'),
      require('autoprefixer')
    ];
  }
};
