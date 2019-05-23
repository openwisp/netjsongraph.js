const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
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
    //独立打包css
    new ExtractTextPlugin('css/[name].css'),
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.css$/,
      cssProcessor: require('cssnano'),
      cssProcessorPluginOptions: {
        preset: ['default', { discardComments: { removeAll: true } }],
      },
      canPrint: true
    }),

    //对html模板进行处理，生成对应的html,引入需要的资源模块
    // new HtmlWebpackPlugin({
    //   template:'./examples/netjson.html',//模板文件
    //   filename:'index.html',//目标文件
    //   inject:true,//资源加入到底部
    //   hash:false,//加入版本号
    //   // chunks:['move'],
    // }),
  ],

  //本地服务器配置
  devServer: {
    contentBase: "./",//本地服务器所加载的页面所在的目录
    historyApiFallback: true,//不跳转
    inline: true, //实时刷新
    open: true //是否运行成功后直接打开页面
  },

  //不显示警告
  performance: {
    hints: false
  }
})