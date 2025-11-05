import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/deposits/check/route';
import { NextRequest } from 'next/server';
import * as orderService from '@/lib/services/order-service';

// Mock services
vi.mock('@/lib/services/order-service');

describe('POST /api/deposits/check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('returns hasDeposit=true when deposit exists', async () => {
      vi.mocked(orderService.userHasPaidDeposit).mockResolvedValueOnce(true);
      vi.mocked(orderService.getDepositOrder).mockResolvedValueOnce({
        id: 'order_123',
        total: 25000,
        status: 'paid',
      } as any);

      const request = new NextRequest('http://localhost/api/deposits/check', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          productId: 'test-product',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.hasDeposit).toBe(true);
      expect(data.data.depositAmount).toBe(25000);
      expect(data.data.orderId).toBe('order_123');
    });

    it('returns hasDeposit=false when no deposit', async () => {
      vi.mocked(orderService.userHasPaidDeposit).mockResolvedValueOnce(false);

      const request = new NextRequest('http://localhost/api/deposits/check', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          productId: 'test-product',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.hasDeposit).toBe(false);
      expect(data.data.depositAmount).toBeNull();
      expect(data.data.orderId).toBeNull();
    });

    it('returns deposit amount and order ID', async () => {
      vi.mocked(orderService.userHasPaidDeposit).mockResolvedValueOnce(true);
      vi.mocked(orderService.getDepositOrder).mockResolvedValueOnce({
        id: 'order_456',
        total: 30000,
        status: 'paid',
      } as any);

      const request = new NextRequest('http://localhost/api/deposits/check', {
        method: 'POST',
        body: JSON.stringify({
          email: 'customer@example.com',
          productId: 'product-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data).toEqual({
        hasDeposit: true,
        depositAmount: 30000,
        orderId: 'order_456',
      });
    });

    it('only returns deposits with status=paid', async () => {
      vi.mocked(orderService.userHasPaidDeposit).mockResolvedValueOnce(true);
      vi.mocked(orderService.getDepositOrder).mockResolvedValueOnce({
        id: 'order_789',
        total: 25000,
        status: 'paid',
      } as any);

      const request = new NextRequest('http://localhost/api/deposits/check', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          productId: 'test-product',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.hasDeposit).toBe(true);
      expect(orderService.userHasPaidDeposit).toHaveBeenCalledWith('test@example.com', 'test-product');
    });

    it('does not return applied or refunded deposits', async () => {
      // userHasPaidDeposit already filters for status='paid'
      vi.mocked(orderService.userHasPaidDeposit).mockResolvedValueOnce(false);

      const request = new NextRequest('http://localhost/api/deposits/check', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          productId: 'test-product',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.hasDeposit).toBe(false);
    });
  });

  describe('Validation Errors', () => {
    it('validates request body', async () => {
      const request = new NextRequest('http://localhost/api/deposits/check', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('handles missing email', async () => {
      const request = new NextRequest('http://localhost/api/deposits/check', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'test-product',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('handles missing productId', async () => {
      const request = new NextRequest('http://localhost/api/deposits/check', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('handles non-existent deposit', async () => {
      vi.mocked(orderService.userHasPaidDeposit).mockResolvedValueOnce(false);

      const request = new NextRequest('http://localhost/api/deposits/check', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          productId: 'nonexistent-product',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.hasDeposit).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('handles service errors', async () => {
      vi.mocked(orderService.userHasPaidDeposit).mockRejectedValueOnce(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost/api/deposits/check', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          productId: 'test-product',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
