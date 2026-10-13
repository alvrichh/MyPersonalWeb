'use strict'

const path = require('path')
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const miniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    // Home and AI radar page share one script and one stylesheet.
    main: ['./assets/js/main.js', './assets/css/main.css', './assets/css/credentials.css'],
    // gym.html loads this bundle directly with a <script> tag.
    gymPolish: './assets/js/gym-polish.js',
    // Personal calendar: events, career, Bubble tasks and gym in one view.
    calendar: ['./assets/js/calendar.js', './assets/css/calendar.css'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 8080,
    hot: true
  },
  plugins: [
    new HtmlWebpackPlugin({filename:'index.html', template: './templates/index.html', chunks: ['main']}),
    new HtmlWebpackPlugin({filename:'ai-radar.html', template: './templates/ai-radar.html', chunks: ['main']}),
    new HtmlWebpackPlugin({filename:'gym.html', template: './gym.html', inject: false}),
    new HtmlWebpackPlugin({filename:'planning.html', template: './planning.html', inject: false}),
    new HtmlWebpackPlugin({filename:'calendar.html', template: './templates/calendar.html', chunks: ['calendar']}),
    
    new miniCssExtractPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'assets/images', to: 'images'},
        { from: 'assets/cv', to: 'cv'},
        { from: 'assets/data', to: 'data'},
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
            loader: 'postcss-loader'
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
