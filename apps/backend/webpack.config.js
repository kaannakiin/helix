const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const webpack = require('webpack');

const i18nLocalesSource = require
  .resolve('@org/i18n/package.json')
  .replace('package.json', 'src/locales');

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  resolve: {
    conditionNames: ['@org/source', 'require', 'node', 'default'],
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      mergeExternals: true,
      buildLibsFromSource: true,
      assets: [
        './src/assets',
        {
          input: i18nLocalesSource,
          glob: '**/*.json',
          output: 'assets/i18n',
        },
      ],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /\.node$/,
      contextRegExp: /fsevents/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^class-transformer(\/.*)?$/,
      contextRegExp: /@nestjs\/mapped-types/,
    }),
  ],
};
