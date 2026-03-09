//@ts-check

const fs = require('fs');
const { composePlugins, withNx } = require('@nx/next');
const createNextIntlPlugin = require('next-intl/plugin');

const i18nRelative = './core/i18n/request.ts';
const i18nPath = fs.existsSync(i18nRelative)
  ? i18nRelative
  : './apps/b2c-storefront/core/i18n/request.ts';

// @ts-ignore
const withNextIntl = createNextIntlPlugin(i18nPath);

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {},
  output: 'standalone',
  compress: false,
  transpilePackages: ['@org/i18n', '@org/constants', '@org/utils', '@org/hooks'],
  webpack(config) {
    config.resolve.conditionNames = [
      '@org/source',
      ...(config.resolve.conditionNames ?? []),
    ];
    return config;
  },
};

const plugins = [withNx, withNextIntl];

module.exports = composePlugins(...plugins)(nextConfig);
