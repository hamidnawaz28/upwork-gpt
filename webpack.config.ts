import CopyWebpackPlugin from 'copy-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import path from 'path'

const config = {
  entry: {
    background: '/src/background/index.ts',
    'content-script': '/src/content-script/index.tsx',
  },

  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.png$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192, // encode smaller files as data URLs
            },
          },
          {
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]',
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'code/[name].bundle.js',
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'style.css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'code' },
        { from: 'src/_locales', to: 'code/_locales' },
      ],
    }),
    // new ZipPlugin({
    //   path: 'build',
    //   filename: 'firefox.zip',
    //   extension: 'zip',
    //   fileOptions: {
    //     mtime: new Date(),
    //     mode: 0o100664,
    //     compress: true,
    //     forceZip64Format: false,
    //   },
    //   zipOptions: {
    //     forceZip64Format: false,
    //   },
    //   exclude: [/\.png$/, /\.html$/],
    // }),
  ],
  devServer: {
    static: path.join(__dirname, 'dist'),
    compress: true,
    port: 4000,
  },
  devtool: 'cheap-module-source-map',
}
export default config
