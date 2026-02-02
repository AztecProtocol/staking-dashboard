/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
      }
    }],
  },
  moduleNameMapper: {
    '^ponder:schema$': '<rootDir>/tests/__mocks__/ponder-schema.ts',
    '^ponder:api$': '<rootDir>/tests/__mocks__/ponder-api.ts',
    '^ponder:registry$': '<rootDir>/tests/__mocks__/ponder-registry.ts',
    '^ponder$': '<rootDir>/tests/__mocks__/ponder.ts',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/api/index.ts',
    '!src/events/**/*.ts', // Event handlers are tested by Ponder itself
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  silent: false,
  verbose: true,
};
