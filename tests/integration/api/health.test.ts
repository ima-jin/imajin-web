import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns 200 status code", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it("returns proper JSON structure", async () => {
    const response = await GET();
    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("database");
    expect(data).toHaveProperty("environment");
    expect(data).toHaveProperty("version");
  });

  it("reports database as connected", async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe("ok");
    expect(data.database).toBe("connected");
  });

  it("includes environment information", async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.environment).toHaveProperty("nodeEnv");
    expect(data.environment).toHaveProperty("publicEnv");
    expect(data.environment).toHaveProperty("hasDatabaseUrl");

    // Should have at least node environment set
    expect(data.environment.nodeEnv).toBeDefined();
  });

  it("includes valid timestamp", async () => {
    const response = await GET();
    const data = await response.json();

    // Verify timestamp is valid ISO string
    const timestamp = new Date(data.timestamp);
    expect(timestamp.toString()).not.toBe("Invalid Date");

    // Timestamp should be recent (within last minute)
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    expect(diff).toBeLessThan(60000); // Less than 1 minute
  });

  it("returns correct content type", async () => {
    const response = await GET();
    const contentType = response.headers.get("content-type");

    expect(contentType).toContain("application/json");
  });

  it("includes version number", async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.version).toBeDefined();
    expect(typeof data.version).toBe("string");
    expect(data.version).toMatch(/^\d+\.\d+\.\d+$/); // Matches semver pattern
  });
});
