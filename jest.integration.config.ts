import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>"],
  testMatch: ["**/__tests__/integration/**/*.test.ts"],
  testTimeout: 120000,
  clearMocks: true,
  restoreMocks: true,
};

export default config;
