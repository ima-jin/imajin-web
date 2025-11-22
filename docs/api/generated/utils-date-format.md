# utils/date-format

**Consistent date formatting** for the Imajin platform. Converts ISO 8601 date strings into human-readable formats using browser-native internationalization.

## Purpose

The `date-format` module standardizes how dates appear throughout the platform—from order confirmations to product launch dates. Instead of wrestling with date libraries or inconsistent formatting, this utility provides a single function that handles locale-aware date presentation using the browser's built-in `Intl.DateTimeFormat` API.

**Problem it solves:** Eliminates date formatting inconsistencies across components while respecting user locale preferences without external dependencies.

## Functions Reference

### formatDate

**Converts ISO 8601 date strings into readable, locale-aware format.**

#### Purpose

Takes machine-readable date strings (like those stored in databases or received from APIs) and formats them for human consumption. Uses the browser's native internationalization to automatically adapt to user locale preferences.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `isoDate` | `string` | ISO 8601 date string in YYYY-MM-DD format |

#### Returns

`string` - Formatted date string using long month names (e.g., "November 1, 2025")

#### Example

```typescript
import { formatDate } from '@/lib/utils/date-format';

// Order confirmation dates
const orderDate = formatDate('2025-11-01');
console.log(orderDate); // "November 1, 2025"

// Product launch dates
const launchDate = formatDate('2025-12-15');
console.log(launchDate); // "December 15, 2025"

// Dynamic content
const events = [
  { name: 'Founder Edition Launch', date: '2025-01-15' },
  { name: 'Pre-sale Ends', date: '2025-02-28' }
];

events.forEach(event => {
  console.log(`${event.name}: ${formatDate(event.date)}`);
});
// "Founder Edition Launch: January 15, 2025"
// "Pre-sale Ends: February 28, 2025"
```

#### Error Handling

**Invalid date strings** will cause the underlying `Date` constructor to return an invalid date, which `Intl.DateTimeFormat` will format as "Invalid Date". Always validate your ISO date strings at the source.

```typescript
// This will output "Invalid Date"
const badDate = formatDate('not-a-date');

// Validate before formatting
function safeFormatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) {
    return 'Date unavailable';
  }
  return formatDate(isoDate);
}
```

#### Implementation Notes

**Locale detection:** Uses the browser's default locale (`navigator.language`) automatically. No manual locale configuration needed—users see dates in their preferred format.

**Format specification:** Hard-coded to long format (full month names, numeric day/year) for consistency across the platform. This creates a uniform look while still respecting locale-specific ordering and language preferences.

**Performance:** Leverages native browser APIs instead of external libraries. The `Intl.DateTimeFormat` API is well-optimized and eliminates bundle size concerns.

## Common Patterns

### Order History Display

```typescript
// Display order dates consistently
const OrderItem = ({ order }: { order: Order }) => (
  <div className="order-item">
    <h3>Order #{order.id}</h3>
    <p className="text-muted">Placed on {formatDate(order.created_at)}</p>
  </div>
);
```

### Product Launch Timelines

```typescript
// Show launch dates for upcoming products
const ProductCard = ({ product }: { product: Product }) => (
  <div className="product-card">
    <h2>{product.name}</h2>
    {product.launch_date && (
      <div className="launch-info">
        Available {formatDate(product.launch_date)}
      </div>
    )}
  </div>
);
```

### Event Scheduling

```typescript
// Format dates for community events or announcements
const AnnouncementList = ({ announcements }: { announcements: Announcement[] }) => (
  <div>
    {announcements.map(item => (
      <article key={item.id}>
        <time dateTime={item.publish_date}>
          {formatDate(item.publish_date)}
        </time>
        <h3>{item.title}</h3>
      </article>
    ))}
  </div>
);
```

## Best Practices

**Store ISO dates:** Always store dates in ISO 8601 format in your database. Format only at display time.

**Semantic HTML:** When displaying dates, use the `<time>` element with the ISO date in the `dateTime` attribute for accessibility and SEO.

**Validation at source:** Validate date strings when they enter your system (API endpoints, form submissions) rather than at format time.

## Things to Watch Out For

**Time zone assumptions:** This utility formats dates only—it doesn't handle time zones. ISO date strings without time components are interpreted as local dates.

**Input format dependency:** Expects YYYY-MM-DD format specifically. Other ISO 8601 variants (with times, time zones) will work but may produce unexpected results for display purposes.

**Locale changes:** Date format updates automatically if the user changes their browser locale, but existing rendered dates won't update until the component re-renders.

## Related Modules

**Database schemas:** Order dates, product launch dates, and user timestamps all use ISO 8601 strings that work with this formatter.

**Component system:** Used throughout the design system for consistent date presentation in cards, lists, and detail views.

**API responses:** All date fields in API responses follow the same ISO 8601 format expected by this utility.