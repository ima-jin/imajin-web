import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/checkout/deposit/route';
import { NextRequest } from 'next/server';
import * as stripeService from '@/lib/services/stripe-service';
import * as productService from '@/lib/services/product-service';

// Mock services
vi.mock('@/lib/services/stripe-service');
vi.mock('@/lib/services/product-service');

describe('POST /api/checkout/deposit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('creates deposit checkout session', async () => {
      const mockProduct = {
        id: 'test-product',
        name: 'Test Product',
        sellStatus: 'pre-sale',
        presaleDepositPrice: 25000,
      };

      vi.mocked(productService.getProductById).mockResolvedValueOnce(mockProduct as any);
      vi.mocked(stripeService.createDepositCheckoutSession).mockResolvedValueOnce({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      } as any);

      const request = new NextRequest('http://localhost/api/checkout/deposit', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'test-product',
          email: 'test@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.url).toBe('https://checkout.stripe.com/test');
      expect(stripeService.createDepositCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'test-product',
          customerEmail: 'test@example.com',
          depositAmount: 25000,
        })
      );
    });

    it('returns Stripe session URL', async () => {
      const mockProduct = {
        id: 'test-product',
        name: 'Test Product',
        sellStatus: 'pre-sale',
        presaleDepositPrice: 25000,
      };

      vi.mocked(productService.getProductById).mockResolvedValueOnce(mockProduct as any);
      vi.mocked(stripeService.createDepositCheckoutSession).mockResolvedValueOnce({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test-session',
      } as any);

      const request = new NextRequest('http://localhost/api/checkout/deposit', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'test-product',
          email: 'customer@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data).toHaveProperty('url');
      expect(data.data.url).toMatch(/^https:\/\/checkout\.stripe\.com/);
    });

    it('handles variant deposits', async () => {
      const mockProduct = {
        id: 'test-product',
        name: 'Test Product',
        sellStatus: 'pre-sale',
        presaleDepositPrice: 25000,
      };

      vi.mocked(productService.getProductById).mockResolvedValueOnce(mockProduct as any);
      vi.mocked(stripeService.createDepositCheckoutSession).mockResolvedValueOnce({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      } as any);

      const request = new NextRequest('http://localhost/api/checkout/deposit', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'test-product',
          variantId: 'variant-black',
          email: 'test@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(stripeService.createDepositCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          variantId: 'variant-black',
        })
      );
    });

    it('sets correct metadata', async () => {
      const mockProduct = {
        id: 'test-product',
        name: 'Test Product',
        sellStatus: 'pre-sale',
        presaleDepositPrice: 25000,
      };

      vi.mocked(productService.getProductById).mockResolvedValueOnce(mockProduct as any);
      vi.mocked(stripeService.createDepositCheckoutSession).mockResolvedValueOnce({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      } as any);

      const request = new NextRequest('http://localhost/api/checkout/deposit', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'test-product',
          email: 'test@example.com',
        }),
      });

      await POST(request);

      expect(stripeService.createDepositCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'test-product',
        })
      );
    });
  });

  describe('Validation Errors', () => {
    it('validates request body (productId, email required)', async () => {
      const request = new NextRequest('http://localhost/api/checkout/deposit', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('handles invalid productId', async () => {
      vi.mocked(productService.getProductById).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/checkout/deposit', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'invalid-product',
          email: 'test@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
      expect(data.error.message).toContain('Product not found');
    });

    it('handles invalid email', async () => {
      const request = new NextRequest('http://localhost/api/checkout/deposit', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'test-product',
          email: 'invalid-email',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Error Handling', () => {
    it('handles Stripe API failures', async () => {
      const mockProduct = {
        id: 'test-product',
        name: 'Test Product',
        sellStatus: 'pre-sale',
        presaleDepositPrice: 25000,
      };

      vi.mocked(productService.getProductById).mockResolvedValueOnce(mockProduct as any);
      vi.mocked(stripeService.createDepositCheckoutSession).mockRejectedValueOnce(
        new Error('Stripe API error')
      );

      const request = new NextRequest('http://localhost/api/checkout/deposit', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'test-product',
          email: 'test@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
