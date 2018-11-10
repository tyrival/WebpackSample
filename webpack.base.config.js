/** 通用的webpack配置 */
const ArcGISPlugin = require("@arcgis/webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path');
const webpack = require('webpack');

// 配置常量
// 源码的根目录
const SRC_PATH = path.resolve('./src');
// 资源文件的根目录
const ASSETS_PUBLIC_PATH = path.resolve('./src/assets');
// 编译后的文件目录
const ASSETS_BUILD_PATH = path.resolve('./dist');

module.exports = {
  // 入口文件配置
  entry: {
    main: './src/main.js',
    home: './src/js/home.js',
    resource: './src/js/resource.js',
    app: './src/js/app.js',
    citysign:'./src/js/citysign.js'
  },
  // 输出文件配置
  output: {
    filename: 'js/[name]-[chunkhash].js',
    path: ASSETS_BUILD_PATH,
    publicPath: ''
  },

  module: {
    rules: [
      {test: /\.html$/ , loader: 'html-withimg-loader', exclude: /node_modules/},
      {test: /\.css$/, use: ['style-loader','css-loader?importLoaders=1','postcss-loader']},
      {test: /\.(png|jpg|jpeg|gif|svg)$/, loaders: ['url-loader?limit=1&name=assets/[name]-[hash:5].[ext]', 'image-webpack-loader'] },
      {test: /\.(woff|svg|eot|ttf|otf)\??.*$/, loaders: ['url-loader?name=fonts/[name].[md5:hash:hex:7].[ext]'] }
    ]
  },
  plugins: [
    // 删除dist等编译后的文件夹
    new CleanWebpackPlugin([ASSETS_BUILD_PATH]),

    // 设置全局的jquery等第三方库，各js中不再需要通过【import $ from 'jquery'】来引入jquery
    // new webpack.ProvidePlugin({
    //   '$': 'jquery',
    //   'window.$': 'jquery'
    // }),
    new webpack.DefinePlugin({
      //生产环境接口地址
       BASE_URL :JSON.stringify('http://10.68.129.223'),
      //开发环境接口地址
      //BASE_URL : JSON.stringify('http://localhost:8801')
    }),

    new ArcGISPlugin(),

    /* 静态资源直接复制 */
    new CopyWebpackPlugin([{
      from: 'src/static',
      to: 'static'
    }]),

    /* 模板 */
    new HtmlWebPackPlugin({
      filename: "index.html",
      template: "index.html",
      chunks: ["main", "index"],
      chunksSortMode: "none",
      inject: "head",
      title: "市情平台"
    }),

    /* 首页 */
    new HtmlWebPackPlugin({
      filename: "home.html",
      template: "./src/views/home.html",
      chunks: ["home"],
      chunksSortMode: "none",
      inject: "body",
      title: "市情平台"
    }),
    /* 地图模块 */
    new HtmlWebPackPlugin({
      filename: "resource.html",
      template: "./src/views/resource.html",
      chunks: ["resource"],
      chunksSortMode: "none",
      inject: "body",
      inlineSource: ".(css)$",
      title: "市情平台"
    }),
    /* 主题模块：bi生成 */
    new HtmlWebPackPlugin({
      filename: "charthome.html",
      template: "./src/views/charthome.html",
      chunks: ["charthome"],
      chunksSortMode: "none",
      inject: "body",
      inlineSource: ".(css)$",
      title: "市情平台"
    }),
    /* 主题模块：地图生成 */
    new HtmlWebPackPlugin({
      filename: "maphome.html",
      template: "./src/views/maphome.html",
      chunks: ["maphome"],
      chunksSortMode: "none",
      inject: "body",
      inlineSource: ".(css)$",
      title: "市情平台"
    }),
    /* 主题模块：主题生成 */
    new HtmlWebPackPlugin({
      filename: "layout.html",
      template: "./src/views/layout.html",
      chunks: ["layout"],
      chunksSortMode: "none",
      inject: "body",
      inlineSource: ".(css)$",
      title: "市情平台"
    }),
    /* 主题模块：数据管理 */
    new HtmlWebPackPlugin({
      filename: "manage.html",
      template: "./src/views/manage.html",
      chunks: ["manage"],
      chunksSortMode: "none",
      inject: "body",
      inlineSource: ".(css)$",
      title: "市情平台"
    }),
    /* 应用中心 */
    new HtmlWebPackPlugin({
      filename: "app.html",
      template: "./src/views/app.html",
      chunks: ["app"],
      chunksSortMode: "none",
      inject: "body",
      inlineSource: ".(css)$",
      title: "市情平台"
    }),
    /* 城市体征 */
    new HtmlWebPackPlugin({
      filename: "citysign.html",
      template: "./src/views/citysign.html",
      chunks: ["citysign"],
      chunksSortMode: "none",
      inject: "body",
      inlineSource: ".(css)$",
      title: "市情平台"
    })
  ],
  resolve: {
    modules: [
      path.resolve(__dirname, "/src"),
      path.resolve(__dirname, "node_modules/")
    ],
    extensions: [".js", ".less", ".css"]
  },
  node: {
    process: false,
    global: false,
    fs: "empty"
  }
};