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
    gymLink: './assets/js/gym-link.js',
    mobilePolish: './assets/js/mobile-polish.js',
    navScrollFix: './assets/js/nav-scroll-fix.js',
    giraldaFix: './assets/js/giralda-fix.js',
    glassBackgroundPolish: './assets/js/glass-background-polish.js',
    gymPolish: './assets/js/gym-polish.js',
    cvDownloadSection: './assets/js/cv-download-section.js',
    scrollExperience: './assets/js/scroll-experience.js',
    verticalScrollProgress: './assets/js/vertical-scroll-progress.js',
    premiumScrollPolish: './assets/js/premium-scroll-polish.js',
    mobileVcardDrawer: './assets/js/mobile-vcard-drawer.js',
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
    new HtmlWebpackPlugin({filename:'index.html', template: './index.html'}),
    new HtmlWebpackPlugin({filename:'gym.html', template: './gym.html', inject: false}),
    
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