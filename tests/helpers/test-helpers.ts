import { faker } from "@faker-js/faker";

/**
 * Test helper utilities
 */

/**
 * Generate a random test email
 */
export function generateTestEmail(): string {
  return faker.internet.email();
}

/**
 * Generate a random test user
 */
export function generateTestUser() {
  return {
    email: faker.internet.email(),
    name: faker.person.fullName(),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    postal_code: faker.location.zipCode(),
  };
}

/**
 * Delay/sleep utility for tests
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock fetch responses
 */
export function mockFetchResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response);
}
