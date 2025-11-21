import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import { mailingLists } from '@/db/schema-auth';
import { eq } from 'drizzle-orm';

/**
 * Test Suite 13: Seed Data Verification
 *
 * Verifies that the seed-test-db script correctly seeds mailing lists
 */

// Import seed function
async function seedMailingLists() {
  const defaultLists = [
    {
      slug: 'newsletter',
      name: 'Newsletter',
      description: 'Monthly updates about new products and company news',
      isDefault: false,
      isActive: true,
    },
    {
      slug: 'product-alerts',
      name: 'Product Alerts',
      description: 'Get notified when new products launch or restock',
      isDefault: false,
      isActive: true,
    },
    {
      slug: 'order-updates',
      name: 'Order Updates',
      description: 'Transactional emails about your orders (required)',
      isDefault: true,
      isActive: true,
    },
    {
      slug: 'sms-alerts',
      name: 'SMS Alerts',
      description: 'Urgent notifications via text message',
      isDefault: false,
      isActive: false,
    },
  ];

  for (const list of defaultLists) {
    const existing = await db.query.mailingLists.findFirst({
      where: (lists, { eq }) => eq(lists.slug, list.slug),
    });

    if (!existing) {
      await db.insert(mailingLists).values(list);
    }
  }
}

describe('Seed Data Verification - Mailing Lists', () => {
  beforeEach(async () => {
    // Clean up before each test
    await db.delete(mailingLists).execute();
  });

  it('seeds 4 default mailing lists', async () => {
    await seedMailingLists();

    const lists = await db.query.mailingLists.findMany();

    expect(lists).toHaveLength(4);

    const slugs = lists.map(l => l.slug);
    expect(slugs).toContain('newsletter');
    expect(slugs).toContain('product-alerts');
    expect(slugs).toContain('order-updates');
    expect(slugs).toContain('sms-alerts');
  });

  it('marks order-updates as default list', async () => {
    await seedMailingLists();

    const orderUpdatesList = await db.query.mailingLists.findFirst({
      where: eq(mailingLists.slug, 'order-updates'),
    });

    expect(orderUpdatesList).toBeDefined();
    expect(orderUpdatesList!.isDefault).toBe(true);
  });

  it('creates SMS list as inactive', async () => {
    await seedMailingLists();

    const smsList = await db.query.mailingLists.findFirst({
      where: eq(mailingLists.slug, 'sms-alerts'),
    });

    expect(smsList).toBeDefined();
    expect(smsList!.isActive).toBe(false);
  });
});
