import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns 200 status code", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it("returns proper JSON structure", async () => {
    const response = await GET();
    const json = await response.json();

    // Verify standardized response structure
    expect(json).toHaveProperty("success");
    expect(json).toHaveProperty("data");
    expect(json).toHaveProperty("meta");
    expect(json.success).toBe(true);

    // Verify data structure
    expect(json.data).toHaveProperty("status");
    expect(json.data).toHaveProperty("timestamp");
    expect(json.data).toHaveProperty("database");
  });

  it("reports database as connected", async () => {
    const response = await GET();
    const json = await response.json();

    expect(json.data.status).toBe("healthy");
    expect(json.data.database).toBe("connected");
  });

  it("includes valid timestamp", async () => {
    const response = await GET();
    const json = await response.json();

    // Verify timestamp is valid ISO string
    const timestamp = new Date(json.data.timestamp);
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
});
