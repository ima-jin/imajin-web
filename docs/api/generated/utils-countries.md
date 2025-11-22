# Countries Module Reference

International shipping and address validation utilities for the Imajin LED Platform e-commerce system.

## Module Overview

The countries module provides standardized country and subdivision data for shipping address forms, validation, and international commerce. It includes complete postal code patterns, region-specific labeling (state vs province), and subdivision data for major markets.

### Purpose

Addresses the complexity of international shipping forms where each country has different requirements—some need states/provinces, others don't; postal codes have different formats and names (ZIP vs postal code). Rather than building forms that work for one region and break for others, this module provides the data structure to build adaptive, localized address forms.

### When to Use

- Building shipping address forms that adapt to selected countries
- Validating postal codes against country-specific patterns
- Populating dropdown menus for country/subdivision selection
- Storing standardized address data for international orders

## Types Reference

### Country

```typescript
interface Country {
  code: string;                    // ISO 3166-1 alpha-2 country code
  name: string;                    // Display name for UI
  subdivisionLabel: string;        // Localized label (State, Province, Region)
  subdivisions: Subdivision[];     // Available subdivisions
  postalCodeLabel: string;         // Localized label (ZIP Code, Postal Code)
  postalCodePattern?: string;      // Regex pattern for validation
}
```

The core data structure representing a country's address requirements. Each country defines its own subdivision terminology and postal code format.

### Subdivision

```typescript
interface Subdivision {
  code: string;    // Standard abbreviation (CA, ON, NSW)
  name: string;    // Full display name
}
```

Represents states, provinces, territories, or other administrative divisions within a country.

## Functions Reference

### getAllCountries()

**Returns all supported countries sorted alphabetically by name**

### Purpose

Provides the complete list of countries for dropdown menus and selection interfaces. Countries are pre-sorted alphabetically to avoid client-side sorting overhead.

### Returns

`Country[]` - Array of all supported countries, sorted by display name

### Example

```typescript
import { getAllCountries } from '@/lib/utils/countries';

function CountrySelect() {
  const countries = getAllCountries();
  
  return (
    <select name="country">
      {countries.map(country => (
        <option key={country.code} value={country.code}>
          {country.name}
        </option>
      ))}
    </select>
  );
}
```

### Implementation Notes

Returns a reference to the sorted COUNTRIES array—no filtering or transformation overhead. The underlying data is immutable, so direct array access is safe.

---

### getCountryByCode(code)

**Finds a country by its ISO 3166-1 alpha-2 country code**

### Purpose

Retrieves country data for a specific country code, typically when processing form submissions, validating addresses, or displaying country-specific UI elements. Handles the lookup logic for country-dependent form behavior.

### Parameters

- `code` (string) - ISO 3166-1 alpha-2 country code (e.g., 'US', 'CA', 'GB')

### Returns

`Country | undefined` - Country object if found, undefined if code is not supported

### Example

```typescript
import { getCountryByCode } from '@/lib/utils/countries';

function AddressForm({ countryCode }: { countryCode: string }) {
  const country = getCountryByCode(countryCode);
  
  if (!country) {
    return <div>Unsupported country: {countryCode}</div>;
  }
  
  return (
    <div>
      <label>
        {country.subdivisionLabel}
        <select name="subdivision">
          {country.subdivisions.map(sub => (
            <option key={sub.code} value={sub.code}>
              {sub.name}
            </option>
          ))}
        </select>
      </label>
      
      <label>
        {country.postalCodeLabel}
        <input 
          type="text" 
          name="postalCode"
          pattern={country.postalCodePattern}
          required
        />
      </label>
    </div>
  );
}
```

### Error Handling

Returns `undefined` for unknown country codes rather than throwing errors. Always check the return value before accessing country properties to avoid runtime errors.

### Implementation Notes

Uses simple array.find() lookup—no caching or indexing since the dataset is small (under 50 countries). For high-frequency lookups, consider memoization.

---

### hasSubdivisions(countryCode)

**Checks whether a country requires subdivision (state/province) selection**

### Purpose

Determines if subdivision fields should be shown in address forms. Some countries (like Vatican City or Monaco) don't use states/provinces, while others require them for proper addressing. Use this to conditionally render subdivision fields.

### Parameters

- `countryCode` (string) - ISO 3166-1 alpha-2 country code

### Returns

`boolean` - true if the country has subdivisions, false otherwise

### Example

```typescript
import { getCountryByCode, hasSubdivisions } from '@/lib/utils/countries';

function AdaptiveAddressForm({ countryCode }: { countryCode: string }) {
  const country = getCountryByCode(countryCode);
  const needsSubdivision = hasSubdivisions(countryCode);
  
  return (
    <div>
      <input type="text" name="address" placeholder="Street address" />
      <input type="text" name="city" placeholder="City" />
      
      {needsSubdivision && country && (
        <select name="subdivision">
          <option value="">Select {country.subdivisionLabel}</option>
          {country.subdivisions.map(sub => (
            <option key={sub.code} value={sub.code}>
              {sub.name}
            </option>
          ))}
        </select>
      )}
      
      <input 
        type="text" 
        name="postalCode" 
        placeholder={country?.postalCodeLabel || 'Postal Code'}
      />
    </div>
  );
}
```

### Error Handling

Returns `false` for unknown country codes, making forms gracefully degrade to basic address fields without subdivisions.

### Implementation Notes

This is a convenience function that internally calls `getCountryByCode()` and checks the subdivisions array length. More readable than inline checks, especially in JSX conditionals.

## Data Reference

### COUNTRIES

**Complete dataset of supported countries with subdivision and postal code information**

The master data structure containing all country information. Currently supports major markets where Imajin ships LED products:

- **North America**: United States, Canada
- **Europe**: United Kingdom, Germany, France, and other EU markets
- **Asia-Pacific**: Australia, Japan, Singapore
- **Additional markets**: Based on shipping partnerships and demand

Each country entry includes:
- Complete subdivision lists (all US states, Canadian provinces, etc.)
- Localized terminology (State vs Province vs Region)
- Postal code validation patterns
- Proper display names for international customers

### Usage Pattern

```typescript
import { COUNTRIES } from '@/lib/utils/countries';

// Direct access to the dataset
const usCountry = COUNTRIES.find(c => c.code === 'US');
const canadianProvinces = COUNTRIES.find(c => c.code === 'CA')?.subdivisions;

// Better to use helper functions for consistency
import { getCountryByCode } from '@/lib/utils/countries';
const country = getCountryByCode('US');
```

## Common Patterns

### Dynamic Address Forms

Build forms that adapt to the selected country's addressing requirements:

```typescript
function ShippingAddressForm() {
  const [selectedCountry, setSelectedCountry] = useState('');
  const country = getCountryByCode(selectedCountry);
  
  return (
    <form>
      <select 
        value={selectedCountry} 
        onChange={(e) => setSelectedCountry(e.target.value)}
      >
        <option value="">Select Country</option>
        {getAllCountries().map(c => (
          <option key={c.code} value={c.code}>{c.name}</option>
        ))}
      </select>
      
      {country && (
        <>
          {hasSubdivisions(selectedCountry) && (
            <select name="subdivision" required>
              <option value="">Select {country.subdivisionLabel}</option>
              {country.subdivisions.map(sub => (
                <option key={sub.code} value={sub.code}>
                  {sub.name}
                </option>
              ))}
            </select>
          )}
          
          <input
            type="text"
            name="postalCode"
            placeholder={country.postalCodeLabel}
            pattern={country.postalCodePattern}
            required
          />
        </>
      )}
    </form>
  );
}
```

### Address Validation

Validate postal codes against country-specific patterns:

```typescript
function validateAddress(address: {
  countryCode: string;
  postalCode: string;
  subdivision?: string;
}) {
  const country = getCountryByCode(address.countryCode);
  
  if (!country) {
    return { valid: false, error: 'Unsupported country' };
  }
  
  // Validate postal code format
  if (country.postalCodePattern) {
    const regex = new RegExp(country.postalCodePattern);
    if (!regex.test(address.postalCode)) {
      return { 
        valid: false, 
        error: `Invalid ${country.postalCodeLabel} format` 
      };
    }
  }
  
  // Validate subdivision requirement
  if (hasSubdivisions(address.countryCode) && !address.subdivision) {
    return { 
      valid: false, 
      error: `${country.subdivisionLabel} is required` 
    };
  }
  
  return { valid: true };
}
```

## Best Practices

### Form UX Considerations

- **Show subdivision field only after country selection** - Prevents confusion about what "State" means before context is established
- **Use country-specific labels** - "ZIP Code" for US, "Postal Code" for Canada, etc.
- **Validate postal codes client-side** - Immediate feedback using the provided regex patterns
- **Default to user's detected country** - But always allow selection change

### Data Integrity

- **Store subdivision codes, not names** - Names can change, codes are stable (mostly)
- **Always validate country codes** - Check `getCountryByCode()` return value before use
- **Handle missing subdivisions gracefully** - Not all countries use them

### Performance Notes

- **Dataset is small** - No need for complex indexing or caching strategies
- **Functions are lightweight** - Safe to call frequently in form handlers
- **Consider memoization** - For forms that re-render frequently with the same country

## Related Modules

This module integrates with the broader Imajin e-commerce system:

- **Checkout Process** - Powers the shipping address forms in Stripe checkout
- **Order Management** - Provides address validation for order processing  
- **Shipping Calculations** - Country/subdivision data used for rate calculations
- **User Profiles** - Default address storage using standardized country data

The country data structure aligns with Stripe's international requirements and major shipping carrier APIs, ensuring compatibility across the entire order fulfillment pipeline.