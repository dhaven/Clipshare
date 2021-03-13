const path = require('path');
const webpack = require('webpack');

module.exports = (env) => {
  return {
    entry: './background-script.js',
    output: {
        path: path.resolve(__dirname, 'addon/background_scripts'),
        filename: 'background-script.bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.js?$/,
          exclude: /node_modules/,
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
