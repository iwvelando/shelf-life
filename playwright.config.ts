import { defineConfig, devices } from "@playwright/test";

// BASE_URL points the tests at a deployed site instead of a local preview build.
const remote = process.env.BASE_URL;
// WEBKIT=1 adds Safari's engine for tests/webkit.spec.ts (`make test-webkit`).
// It is opt-in so ordinary runs need only Chromium installed.
const webkit = /webkit\.spec\.ts$/;
// Phone-sized checks run in their own project; see tests/layout.spec.ts.
const phone = /layout\.spec\.ts$/;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  use: {
    baseURL: remote ?? "http://127.0.0.1:4173",
    viewport: { width: 1440, height: 1000 },
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
      testIgnore: webkit,
    },
    {
      name: "phone",
      // A small Android phone: narrower than any iPhone in use.
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 360, height: 760 },
        browserName: "chromium",
      },
      testMatch: phone,
    },
    ...(process.env.WEBKIT
      ? [
          {
            name: "webkit",
            use: { ...devices["iPhone 15"], browserName: "webkit" as const },
            testMatch: webkit,
          },
        ]
      : []),
  ],
  webServer: remote
    ? undefined
    : {
        command: "npm run preview -- --port 4173 --strictPort",
        url: "http://127.0.0.1:4173",
        reuseExistingServer: !process.env.CI,
      },
});
