const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const swcJestConfig = JSON.parse(readFileSync(join(__dirname, '../../../.spec.swcrc'), 'utf-8'));
swcJestConfig.swcrc = false;

module.exports = {
  displayName: '@lidercap-apps/shared-utils',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: 'test-output/jest/coverage',
};
