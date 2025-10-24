import { test, expect } from "@playwright/test";

test.describe("Phase 1: Foundation Smoke Tests", () => {
  test("database connection works via health endpoint", async ({ request }) => {
    const response = await request.get("/api/health");

    // Verify response
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.database).toBe("connected");
    expect(data.status).toBe("ok");
  });

  test("app serves homepage", async ({ page }) => {
    await page.goto("/");

    // Should not get error page
    await expect(page).not.toHaveTitle(/404|Error/i);

    // Page should load without errors
    const title = await page.title();
    expect(title).toBeDefined();
    expect(title.length).toBeGreaterThan(0);
  });

  test("environment variables load correctly", async ({ request }) => {
    const response = await request.get("/api/health");
    const data = await response.json();

    // Verify environment data is present
    expect(data.environment).toBeDefined();
    expect(data.environment.nodeEnv).toBeDefined();
    expect(data.environment.hasDatabaseUrl).toBe(true);
  });

  test("health endpoint returns valid timestamp", async ({ request }) => {
    const response = await request.get("/api/health");
    const data = await response.json();

    // Verify timestamp is valid
    expect(data.timestamp).toBeDefined();
    const timestamp = new Date(data.timestamp);
    expect(timestamp.toString()).not.toBe("Invalid Date");

    // Timestamp should be recent (within last 5 seconds)
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    expect(diff).toBeLessThan(5000);
  });

  test("docker containers are accessible", async ({ request }) => {
    // If we can connect to health endpoint and get database connected,
    // it means Docker containers (Next.js + PostgreSQL) are running
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.database).toBe("connected");
  });

  test("API responds with proper JSON content type", async ({ request }) => {
    const response = await request.get("/api/health");
    const contentType = response.headers()["content-type"];

    expect(contentType).toContain("application/json");
  });

  test("health endpoint includes version information", async ({ request }) => {
    const response = await request.get("/api/health");
    const data = await response.json();

    expect(data.version).toBeDefined();
    expect(typeof data.version).toBe("string");
  });
});
