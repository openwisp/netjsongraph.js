const path = require('path');

module.exports = (env, argv) => ({
  entry: './src/js/netjsongraph.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'netjsongraph.min.js',
  },

  devServer: {
    contentBase: './',
    historyApiFallback: true,
    inline: true,
    open: true,
    openPage: './examples/index.html',
  },

  performance: {
    hints: false,
  },
});
