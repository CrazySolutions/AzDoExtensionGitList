module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.jest.json'
    }
  },
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/tests/__mocks__/styleMock.js'
  },
  coverageThreshold: {
    global: {
      lines: 80
    }
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx'
  ],
  passWithNoTests: true
};
