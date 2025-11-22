# Contact Validation Module

The `contacts/validate-contact` module provides validation and normalization for email addresses and phone numbers. It enforces consistent data quality across the platform while handling real-world input variations.

## Module Overview

### Purpose

Contact validation sits at the intersection of user experience and data integrity. Users enter contact information in various formats—emails with mixed case, phone numbers with parentheses and dashes—but your database needs clean, consistent data.

This module handles the transformation: validate format correctness, normalize for storage, and provide clear error feedback when something's wrong.

### When to Use

- **Form validation** - Before accepting user input
- **Data import** - When processing contact lists or external data
- **API endpoints** - Server-side validation for contact-related operations
- **Data cleanup** - Normalizing existing contact data

---

## Functions Reference

### validateEmail

**Validates an email address format using RFC-compliant regex patterns.**

#### Purpose

Checks if an email string matches valid email format patterns. Uses a practical regex approach that catches common errors (missing @, invalid domains) while allowing legitimate variations like subdomain addresses and international domains.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `email` | `string` | Email address to validate |

#### Returns

`boolean` - `true` if the email format is valid, `false` otherwise

#### Example

```typescript
import { validateEmail } from '@/lib/contacts/validate-contact';

// Valid emails
validateEmail('user@example.com');        // true
validateEmail('test.user@subdomain.co');  // true
validateEmail('user+tag@domain.org');     // true

// Invalid emails
validateEmail('not-an-email');           // false
validateEmail('@missing-user.com');      // false
validateEmail('user@');                  // false
```

#### Implementation Notes

The validation uses a pragmatic regex that balances strictness with usability. It accepts most legitimate email formats while rejecting obvious errors. For edge cases requiring stricter validation, consider additional verification steps like email confirmation workflows.

---

### validatePhone

**Validates a phone number in E.164 international format (+1234567890).**

#### Purpose

Ensures phone numbers conform to E.164 standard, which provides global uniqueness and consistent formatting. This standardization is essential for SMS delivery, international calling, and database deduplication.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `phone` | `string` | Phone number in E.164 format |

#### Returns

`boolean` - `true` if the phone matches E.164 format, `false` otherwise

#### Example

```typescript
import { validatePhone } from '@/lib/contacts/validate-contact';

// Valid E.164 format
validatePhone('+14155552671');    // true (US)
validatePhone('+442071838750');   // true (UK)
validatePhone('+81312345678');    // true (Japan)

// Invalid formats
validatePhone('4155552671');      // false (missing +)
validatePhone('(415) 555-2671');  // false (formatted)
validatePhone('+1 415 555 2671'); // false (spaces)
```

#### Error Handling

Returns `false` for any format that doesn't match E.164. The function expects normalized input—use `normalizeContact` first if you need to handle user-friendly formats like `(415) 555-2671`.

#### Implementation Notes

E.164 format is strict by design: plus sign, country code, and national number with no separators. This consistency enables reliable SMS delivery and prevents phone number duplication with different formatting.

---

### normalizeContact

**Normalizes contact values for consistent storage and comparison.**

#### Purpose

Transforms contact information into standardized formats. Email normalization handles case sensitivity and whitespace. Phone normalization preserves E.164 format while potentially handling format conversion in future versions.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `kind` | `'email' \| 'phone'` | Type of contact information |
| `value` | `string` | Contact value to normalize |

#### Returns

`string` - Normalized contact value

#### Example

```typescript
import { normalizeContact } from '@/lib/contacts/validate-contact';

// Email normalization
normalizeContact('email', '  USER@EXAMPLE.COM  '); // 'user@example.com'
normalizeContact('email', 'Test.User@Domain.Org'); // 'test.user@domain.org'

// Phone normalization (preserves E.164)
normalizeContact('phone', '+14155552671'); // '+14155552671'
```

#### Implementation Notes

Currently, phone normalization is pass-through for E.164 format. Future versions may add intelligent format conversion from common patterns like `(415) 555-2671` to `+14155552671`.

---

### validateContactInput

**Validates contact input and returns comprehensive validation results with normalized data.**

#### Purpose

The main validation function that orchestrates format checking, normalization, and error reporting. This is your primary interface for contact validation workflows—it handles the complexity of validation logic while providing detailed feedback for error handling.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `ContactInput` | Contact information object |

#### ContactInput Interface

```typescript
interface ContactInput {
  kind: 'email' | 'phone';
  value: string;
  source: string; // Context identifier (form name, import batch, etc.)
}
```

#### Returns

`ValidationResult` - Comprehensive validation outcome

#### ValidationResult Interface

```typescript
interface ValidationResult {
  valid: boolean;                    // Overall validation status
  errors: string[];                 // Specific error messages
  normalized?: ContactInput;        // Cleaned data (only if valid)
}
```

#### Example

```typescript
import { validateContactInput } from '@/lib/contacts/validate-contact';

// Valid email validation
const emailResult = validateContactInput({
  kind: 'email',
  value: '  USER@example.com  ',
  source: 'contact-form'
});

console.log(emailResult);
// {
//   valid: true,
//   errors: [],
//   normalized: {
//     kind: 'email',
//     value: 'user@example.com',
//     source: 'contact-form'
//   }
// }

// Invalid phone validation
const phoneResult = validateContactInput({
  kind: 'phone',
  value: '(415) 555-2671',
  source: 'signup-form'
});

console.log(phoneResult);
// {
//   valid: false,
//   errors: ['Invalid phone format. Use E.164 format (+1234567890)'],
//   // no normalized property
// }
```

#### Error Handling

The function returns validation state rather than throwing exceptions. Check the `valid` property before using `normalized` data. The `errors` array provides specific feedback for user-facing error messages.

**Error scenarios:**
- **Invalid email format** - Returns format guidance
- **Invalid phone format** - Explains E.164 requirement
- **Empty values** - Treated as invalid with descriptive errors

#### Implementation Notes

The `source` field enables tracking validation context, which is valuable for analytics and debugging. For example, you can identify which forms produce the most validation errors or track data quality by import source.

---

## Common Patterns

### Form Validation Workflow

```typescript
import { validateContactInput } from '@/lib/contacts/validate-contact';

function validateForm(formData: FormData) {
  const emailResult = validateContactInput({
    kind: 'email',
    value: formData.get('email') as string,
    source: 'contact-form'
  });

  const phoneResult = validateContactInput({
    kind: 'phone',
    value: formData.get('phone') as string,
    source: 'contact-form'
  });

  if (!emailResult.valid || !phoneResult.valid) {
    return {
      success: false,
      errors: [...emailResult.errors, ...phoneResult.errors]
    };
  }

  // Use normalized data for database storage
  return {
    success: true,
    data: {
      email: emailResult.normalized!.value,
      phone: phoneResult.normalized!.value
    }
  };
}
```

### Bulk Data Processing

```typescript
function processContactList(contacts: Array<{email?: string, phone?: string}>) {
  const results = contacts.map(contact => {
    const validated: Array<{type: string, result: ValidationResult}> = [];
    
    if (contact.email) {
      validated.push({
        type: 'email',
        result: validateContactInput({
          kind: 'email',
          value: contact.email,
          source: 'bulk-import'
        })
      });
    }
    
    if (contact.phone) {
      validated.push({
        type: 'phone',
        result: validateContactInput({
          kind: 'phone',
          value: contact.phone,
          source: 'bulk-import'
        })
      });
    }
    
    return validated;
  });
  
  return results;
}
```

## Best Practices

### Always Normalize Valid Data

Use the `normalized` property from validation results for database storage. Never store the original input—normalization prevents duplicate contacts and ensures consistent formatting.

### Validate on Both Client and Server

Client-side validation provides immediate feedback, but server-side validation is essential for data integrity. This module works in both environments.

### Handle Empty Values Appropriately

The module treats empty strings as invalid. If your application allows optional contact fields, check for empty values before validation:

```typescript
const email = formData.get('email') as string;
if (email && email.trim()) {
  const result = validateContactInput({
    kind: 'email',
    value: email,
    source: 'form'
  });
  // Handle validation...
}
```

## Related Modules

- **Database Models** - Contact validation integrates with user and order models
- **Form Components** - UI components use this module for real-time validation feedback
- **API Routes** - Server endpoints validate contact data before database operations
- **Email Services** - Normalized email addresses ensure reliable delivery