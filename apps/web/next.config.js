//@ts-check

const path = require('path');
const fs = require('fs');
const { composePlugins, withNx } = require('@nx/next');
const createNextIntlPlugin = require('next-intl/plugin');

// next-intl requires a relative path (Turbopack doesn't support absolute).
// When Nx evaluates this config from the repo root, './core/i18n/request.ts'
// doesn't resolve. We detect that and prepend the app prefix.
const i18nRelative = './core/i18n/request.ts';
const i18nPath = fs.existsSync(i18nRelative)
  ? i18nRelative
  : './apps/web/core/i18n/request.ts';

// @ts-ignore
const withNextIntl = createNextIntlPlugin(i18nPath);

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {},
  transpilePackages: ['@org/i18n', '@org/ui', '@org/constants'],
  webpack(config) {
    config.resolve.conditionNames = [
      '@org/source',
      ...(config.resolve.conditionNames ?? []),
    ];
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${
          process.env.BACKEND_URL || 'http://localhost:3001'
        }/api/:path*`,
      },
    ];
  },
};

const plugins = [withNx, withNextIntl];

module.exports = composePlugins(...plugins)(nextConfig);
