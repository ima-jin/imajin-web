import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePhone,
  normalizeContact,
  validateContactInput,
} from '@/lib/contacts/validate-contact';

describe('Contact Validation & Normalization', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('admin@imajin.ca')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('notanemail')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user @example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should accept valid E.164 phone numbers', () => {
      expect(validatePhone('+14165551234')).toBe(true);
      expect(validatePhone('+442071838750')).toBe(true);
      expect(validatePhone('+61212345678')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('4165551234')).toBe(false); // Missing +
      expect(validatePhone('+1 416 555 1234')).toBe(false); // Has spaces
      expect(validatePhone('+0416555123')).toBe(false); // Starts with 0 after +
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('normalizeContact', () => {
    it('should normalize email addresses (lowercase, trim)', () => {
      expect(normalizeContact('email', 'USER@EXAMPLE.COM')).toBe('user@example.com');
      expect(normalizeContact('email', '  admin@imajin.ca  ')).toBe('admin@imajin.ca');
      expect(normalizeContact('email', 'Test.User@Domain.COM')).toBe('test.user@domain.com');
    });

    it('should preserve phone numbers in E.164 format', () => {
      expect(normalizeContact('phone', '+14165551234')).toBe('+14165551234');
      expect(normalizeContact('phone', '+442071838750')).toBe('+442071838750');
    });
  });

  describe('validateContactInput', () => {
    it('should accept valid email contact input', () => {
      const result = validateContactInput({
        kind: 'email',
        value: 'user@example.com',
        source: 'signup_form',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.normalized).toEqual({
        kind: 'email',
        value: 'user@example.com',
        source: 'signup_form',
      });
    });

    it('should reject invalid contact input with errors', () => {
      const result = validateContactInput({
        kind: 'email',
        value: 'notanemail',
        source: 'signup_form',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });
  });
});
