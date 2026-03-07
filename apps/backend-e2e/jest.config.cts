/* eslint-disable */
const { readFileSync } = require('fs');

// Reading the SWC compilation config for the spec files
const swcJestConfig = JSON.parse(
  readFileSync(`${__dirname}/.spec.swcrc`, 'utf-8')
);

// Disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves
swcJestConfig.swcrc = false;

module.exports = {
  displayName: '@org/backend-e2e',
  preset: '../../jest.preset.js',
  globalSetup: '<rootDir>/src/support/global-setup.ts',
  globalTeardown: '<rootDir>/src/support/global-teardown.ts',
  setupFiles: ['<rootDir>/src/support/test-setup.ts'],
  testEnvironment: 'node',
  // E2E tests share a single database — run sequentially to avoid fixture conflicts
  maxWorkers: 1,
  transform: {
    '^.+\\.[tj]sx?$': ['@swc/jest', swcJestConfig],
    '^.+\\.mjs$': ['@swc/jest', swcJestConfig],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*axios-cookiejar-support|.*http-cookie-agent|@prisma/client)/)',
  ],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: 'test-output/jest/coverage',
};
