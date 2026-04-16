import { readFileSync } from 'fs';
import { join } from 'path';

const swcJestConfig = JSON.parse(readFileSync(join(__dirname, '../../../.spec.swcrc'), 'utf-8'));
swcJestConfig.swcrc = false;

module.exports = {
  displayName: '@nx-base-template/shared-utils',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: 'test-output/jest/coverage',
};
