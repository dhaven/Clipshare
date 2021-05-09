const path = require('path');
const webpack = require('webpack');

module.exports = (env) => {
  return {
    entry: './main.js',
    output: {
        path: path.resolve(__dirname, 'addon/popup'),
        filename: 'app.bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.js?$/,
          exclude: /node_modules/,
          include: [
            path.resolve(__dirname, 'src/js/videojs'),
            path.resolve(__dirname, 'src/js/components'),
          ],
          use: {
            loader: "babel-loader",
            options: {
              presets: ['@babel/preset-env']
            }
          }
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        NODE_ENV: JSON.stringify(env.NODE_ENV),
      }),
    ],
  }
}
