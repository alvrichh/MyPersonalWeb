'use strict'

const path = require('path')
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const miniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: { 
    script: './assets/js/script.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 8080,
    hot: true
  },
  plugins: [
    new HtmlWebpackPlugin({filename:'index.html', template: './index.html'}),
    
    new miniCssExtractPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'assets/images', to: 'images'},
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(css)$/i,
        use: [
          {
            // Adds CSS to the DOM by injecting a `<style>` tag
            // loader: 'style-loader'
            // Extracts CSS for each JS file that includes CSS
            loader: miniCssExtractPlugin.loader
          },
          {
            // Interprets `@import` and `url()` like `import/require()` and will resolve them
            loader: 'css-loader'
          },
          {
            // Loader for webpack to process CSS with PostCSS
            loader: 'postcss-loader',
           /* options: {
              postcssOptions: {
                plugins: [
                  autoprefixer
                ]
              }
            }*/
          },
          {
            // Loads a SASS/SCSS file and compiles it to CSS
           loader: 'sass-loader'
          }
        ]
      }
    ]
  }
}