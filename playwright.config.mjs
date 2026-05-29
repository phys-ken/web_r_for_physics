import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 240000,
  expect: {
    timeout: 30000,
  },
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    trace: "retain-on-failure",
    launchOptions: {
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: "npm start",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: "chrome",
      use: {
        channel: "chrome",
      },
    },
  ],
});
