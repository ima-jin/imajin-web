import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { POST } from '@/app/api/cart/validate/route';
import { NextRequest } from 'next/server';
import { db } from '@/db';
import { products, variants, productDependencies } from '@/db/schema';
import { eq } from 'drizzle-orm';

describe('POST /api/cart/validate', () => {
  // Setup test data
  beforeAll(async () => {
    // Clean up test data
    await db.delete(productDependencies);
    await db.delete(variants);
    await db.delete(products).where(eq(products.id, 'test-control-5v'));
    await db.delete(products).where(eq(products.id, 'test-control-24v'));
    await db.delete(products).where(eq(products.id, 'test-unavailable'));
    await db.delete(products).where(eq(products.id, 'test-founder'));

    // Insert test products
    await db.insert(products).values([
      {
        id: 'test-control-5v',
        name: 'Test Control 5V',
        category: 'controls',
        basePrice: 15000,
        devStatus: 5,
      },
      {
        id: 'test-control-24v',
        name: 'Test Control 24V',
        category: 'controls',
        basePrice: 25000,
        devStatus: 5,
      },
      {
        id: 'test-unavailable',
        name: 'Test Unavailable',
        category: 'materials',
        basePrice: 10000,
        devStatus: 3, // Not ready for sale
      },
      {
        id: 'test-founder',
        name: 'Test Founder Edition',
        category: 'kits',
        basePrice: 50000,
        devStatus: 5,
        hasVariants: true,
      },
    ]);

    // Insert test variant
    await db.insert(variants).values({
      id: 'test-variant-black',
      productId: 'test-founder',
      stripeProductId: 'price_test_variant',
      variantType: 'color',
      variantValue: 'BLACK',
      priceModifier: 0,
      isLimitedEdition: true,
      maxQuantity: 100,
      soldQuantity: 95, // 5 remaining (low stock)
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(productDependencies);
    await db.delete(variants).where(eq(variants.id, 'test-variant-black'));
    await db.delete(products).where(eq(products.id, 'test-control-5v'));
    await db.delete(products).where(eq(products.id, 'test-control-24v'));
    await db.delete(products).where(eq(products.id, 'test-unavailable'));
    await db.delete(products).where(eq(products.id, 'test-founder'));
  });

  it('validates empty cart as valid', async () => {
    const request = new NextRequest('http://localhost:3000/api/cart/validate', {
      method: 'POST',
      body: JSON.stringify({ items: [] }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      valid: true,
      errors: [],
      warnings: [],
    });
  });

  it('detects unavailable products', async () => {
    const request = new NextRequest('http://localhost:3000/api/cart/validate', {
      method: 'POST',
      body: JSON.stringify({
        items: [
          {
            productId: 'test-unavailable',
            name: 'Test Unavailable',
            price: 10000,
            image: '/test.jpg',
            quantity: 1,
          },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0]).toMatchObject({
      productId: 'test-unavailable',
      type: 'unavailable',
    });
  });

  it('detects voltage mismatch', async () => {
    const request = new NextRequest('http://localhost:3000/api/cart/validate', {
      method: 'POST',
      body: JSON.stringify({
        items: [
          {
            productId: 'test-control-5v',
            name: 'Test Control 5V',
            price: 15000,
            image: '/test.jpg',
            quantity: 1,
            voltage: '5v',
          },
          {
            productId: 'test-control-24v',
            name: 'Test Control 24V',
            price: 25000,
            image: '/test.jpg',
            quantity: 1,
            voltage: '24v',
          },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0]).toMatchObject({
      type: 'voltage_mismatch',
    });
  });

  it('allows cart with only 5v components', async () => {
    const request = new NextRequest('http://localhost:3000/api/cart/validate', {
      method: 'POST',
      body: JSON.stringify({
        items: [
          {
            productId: 'test-control-5v',
            name: 'Test Control 5V',
            price: 15000,
            image: '/test.jpg',
            quantity: 1,
            voltage: '5v',
          },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.errors).toHaveLength(0);
  });

  it('warns about low stock', async () => {
    const request = new NextRequest('http://localhost:3000/api/cart/validate', {
      method: 'POST',
      body: JSON.stringify({
        items: [
          {
            productId: 'test-founder',
            variantId: 'test-variant-black',
            name: 'Test Founder Edition - BLACK',
            price: 50000,
            image: '/test.jpg',
            quantity: 1,
            isLimitedEdition: true,
          },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.warnings).toHaveLength(1);
    expect(data.warnings[0]).toMatchObject({
      type: 'low_stock',
    });
  });

  it('detects sold out products', async () => {
    const request = new NextRequest('http://localhost:3000/api/cart/validate', {
      method: 'POST',
      body: JSON.stringify({
        items: [
          {
            productId: 'test-founder',
            variantId: 'test-variant-black',
            name: 'Test Founder Edition - BLACK',
            price: 50000,
            image: '/test.jpg',
            quantity: 10, // More than available
            isLimitedEdition: true,
          },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0]).toMatchObject({
      type: 'out_of_stock',
    });
  });

  it('handles invalid request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/cart/validate', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
  });
});
