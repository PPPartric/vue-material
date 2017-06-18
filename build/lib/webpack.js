import webpack from 'webpack'
import merge from 'webpack-merge'
import autoprefixer from 'autoprefixer'
import mediaPacker from 'css-mqpacker'
import cssnano from 'cssnano'
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import OptimizeJsPlugin from 'optimize-js-plugin';
import OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import { config, resolvePath, pack } from '../config'
import banner from './banner'

function toUpperCase (_, c) {
  return c ? c.toUpperCase() : ''
}

function classify (str) {
  return str.replace(/(?:^|[-_/])(\w)/g, toUpperCase)
}

const moduleName = classify(pack.name)

export default entry => {
  let webpackConfig = {
    stats: 'errors-only',
    entry: {
      [pack.name]: './src/index'
    },
    output: {
      filename: entry.filename,
      path: resolvePath(config.dist),
      library: moduleName,
      libraryTarget: entry.libraryTarget
    },
    resolve: {
      extensions: config.resolve,
      alias: config.alias
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/
        }
      ]
    },
    externals: {
      vue: {
        [entry.libraryTarget]: 'vue'
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(entry.env || 'production')
        }
      })
    ]
  }

  if (entry.env === 'production') {
    webpackConfig = merge({
      plugins: [
        new webpack.LoaderOptionsPlugin({
          minimize: true,
          debug: false
        }),
        new webpack.optimize.UglifyJsPlugin({
          compress: {
            warnings: false
          },
          output: {
            comments: false
          },
          sourceMap: false
        }),
        new OptimizeJsPlugin({
          sourceMap: false
        })
      ]
    }, webpackConfig)
  }

  if (entry.css) {
    webpackConfig = merge({
      plugins: [
        new ExtractTextPlugin('[name].min.css'),
        new OptimizeCssAssetsPlugin()
      ],
      module: {
        rules: [
          {
            test: /\.vue$/,
            loader: 'vue-loader',
            options: {
              loaders: {
                css: ExtractTextPlugin.extract({
                  use: 'css-loader',
                  fallback: 'vue-style-loader'
                }),
                scss: ExtractTextPlugin.extract({
                  use: 'css-loader!sass-loader',
                  fallback: 'vue-style-loader'
                })
              },
              postcss: [
                autoprefixer(),
                mediaPacker(),
                cssnano()
              ]
            }
          },
          {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract({
              use: 'css-loader',
              fallback: 'vue-style-loader'
            })
          },
          {
            test: /\.scss$/,
            loader: ExtractTextPlugin.extract({
              use: 'css-loader!sass-loader',
              fallback: 'vue-style-loader'
            })
          }
        ]
      }
    }, webpackConfig)
  } else {
    webpackConfig = merge({
      module: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            loaders: {
              css: 'vue-style-loader!css-loader',
              scss: 'vue-style-loader!css-loader!sass-loader?outputStyle=compressed',
            }
          }
        },
        {
          test: /\.css$/,
          use: ['vue-style-loader', 'css-loader']
        },
        {
          test: /\.scss$/,
          use: ['vue-style-loader', 'css-loader', 'sass-loader']
        }
      ]
    }, webpackConfig)
  }

  webpackConfig = merge({
    plugins: [
      new webpack.BannerPlugin({
        banner: banner,
        raw: true,
        entryOnly: true
      })
    ]
  }, webpackConfig)

  return webpackConfig
}
