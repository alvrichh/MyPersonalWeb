'use strict'

const path = require('path')
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const miniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: { 
    script: ['./assets/js/script.js', './assets/js/header-controls-align.js', './assets/js/mobile-controls-cleanup.js', './assets/js/irish-language-option.js', './assets/js/planning-link-section.js', './assets/js/portfolio-flow-bkd-card.js', './assets/js/portfolio-ai-cards.js', './assets/js/portfolio-tech-cards.js', './assets/js/portfolio-card-visual-upgrade.js', './assets/css/header-controls.css', './assets/css/nav-tabs-polish.css', './assets/css/header-controls-balance.css', './assets/css/mobile-cta-row.css', './assets/css/language-menu-scroll.css', './assets/css/circular-profile-photo.css', './assets/css/sidebar-scroll-desktop.css'],
    gymLink: './assets/js/gym-link.js',
    mobilePolish: './assets/js/mobile-polish.js',
    navScrollFix: './assets/js/nav-scroll-fix.js',
    giraldaFix: './assets/js/giralda-fix.js',
    glassBackgroundPolish: './assets/js/glass-background-polish.js',
    gymPolish: './assets/js/gym-polish.js',
    gymViewFocus: './assets/js/gym-view-focus.js',
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
    new HtmlWebpackPlugin({filename:'planning.html', template: './planning.html', inject: false}),
    
    new miniCssExtractPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'assets/images', to: 'images'},
        { from: 'assets/cv', to: 'cv'},
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