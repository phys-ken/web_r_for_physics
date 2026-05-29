import { defineConfig } from "@playwright/test";

const rawBaseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173";
const baseURL = rawBaseURL.endsWith("/") ? rawBaseURL : `${rawBaseURL}/`;
const useLocalServer = baseURL.startsWith("http://127.0.0.1:4173") || baseURL.startsWith("http://localhost:4173");

export default defineConfig({
  testDir: "./tests",
  timeout: 240000,
  expect: {
    timeout: 30000,
  },
  fullyParallel: false,
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure",
    launchOptions: {
      args: ["--no-sandbox"],
    },
  },
  webServer: useLocalServer
    ? {
        command: "npm start",
        url: "http://127.0.0.1:4173",
        reuseExistingServer: true,
        timeout: 120000,
      }
    : undefined,
  projects: [
    {
      name: "chrome",
      use: {
        channel: "chrome",
      },
    },
  ],
});
