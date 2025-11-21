/**
 * Contact validation and normalization utilities
 * Validates email addresses, phone numbers, and normalizes contact data
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Validates an email address format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email);
}

/**
 * Validates a phone number in E.164 format (+1234567890)
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  return E164_PHONE_REGEX.test(phone);
}

/**
 * Normalizes contact values
 * - Emails: lowercase and trim
 * - Phones: preserve E.164 format
 */
export function normalizeContact(kind: 'email' | 'phone', value: string): string {
  if (kind === 'email') {
    return value.toLowerCase().trim();
  }
  if (kind === 'phone') {
    return value; // Phone numbers should already be in E.164 format
  }
  return value;
}

export interface ContactInput {
  kind: 'email' | 'phone';
  value: string;
  source: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  normalized?: ContactInput;
}

/**
 * Validates contact input and returns normalized data
 */
export function validateContactInput(data: ContactInput): ValidationResult {
  const errors: string[] = [];

  // Validate kind
  if (!data.kind) {
    errors.push('Contact kind is required');
  } else if (data.kind !== 'email' && data.kind !== 'phone') {
    errors.push('Contact kind must be "email" or "phone"');
  }

  // Validate value
  if (!data.value) {
    errors.push('Contact value is required');
  } else if (data.kind === 'email' && !validateEmail(data.value)) {
    errors.push('Invalid email format');
  } else if (data.kind === 'phone' && !validatePhone(data.value)) {
    errors.push('Invalid phone format (must be E.164 format like +1234567890)');
  }

  // Validate source
  if (!data.source) {
    errors.push('Contact source is required');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  // Return normalized data
  return {
    valid: true,
    errors: [],
    normalized: {
      kind: data.kind,
      value: normalizeContact(data.kind, data.value),
      source: data.source,
    },
  };
}
