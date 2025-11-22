# API Response Utilities

**Standardized response builders for Next.js API routes** - Ensures consistent response shapes, error handling, and HTTP status codes across the Imajin platform.

## Purpose

Every API endpoint needs consistent response formatting. This module eliminates response shape inconsistencies, handles errors gracefully, and provides type-safe response builders. Instead of manually crafting `NextResponse` objects with varying structures, these utilities enforce a standardized contract between backend and frontend.

**Problem solved:** Inconsistent API responses lead to brittle frontend code and debugging headaches. These utilities ensure every API response follows the same shape, whether it's success or failure.

## Response Types

### ApiSuccessResponse<T>

All successful API responses follow this structure:

```typescript
interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}
```

### ApiErrorResponse

All error responses follow this structure:

```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    timestamp: string;
  };
}
```

## Functions Reference

### successResponse

**Creates a standardized success response**

Wraps your data in the standard success response shape and returns a properly typed NextResponse object.

**Parameters:**
- `data` (T) - The response payload (strongly typed)
- `status` (number) - HTTP status code (default: 200)

**Returns:**
NextResponse<ApiSuccessResponse<T>> - Ready to return from API route handlers

**Example:**
```typescript
import { successResponse } from '@/lib/utils/api-response';

export async function GET() {
  const products = await getProducts();
  
  return successResponse(products, 200);
  // Returns: { success: true, data: products, meta: { timestamp: "..." } }
}

// Type inference works automatically
const userResponse = successResponse({ id: 1, name: 'Alice' });
// userResponse is typed as NextResponse<ApiSuccessResponse<{ id: number; name: string }>>
```

**Implementation Notes:**
Automatically includes metadata with timestamp. The `meta.requestId` field is reserved for future request tracing but not currently populated.

---

### errorResponse

**Creates a standardized error response**

Builds error responses with consistent structure and appropriate HTTP status codes. Uses the ErrorCode enum for consistent error categorization.

**Parameters:**
- `code` (ErrorCode) - Standardized error code from the ErrorCode enum
- `message` (string) - Human-readable error description
- `status` (number) - HTTP status code (default: 500)
- `details` (unknown, optional) - Additional error context (validation errors, stack traces, etc.)

**Returns:**
NextResponse<ApiErrorResponse> - Ready to return from API route handlers

**Example:**
```typescript
import { errorResponse } from '@/lib/utils/api-response';
import { ErrorCode } from '@/lib/config/api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Process request...
  } catch (error) {
    return errorResponse(
      ErrorCode.VALIDATION_ERROR,
      'Invalid request body',
      400,
      { originalError: error.message }
    );
  }
}
```

**Error Handling:**
This function never throws. If error serialization fails, it falls back to a generic server error response.

---

### validationErrorResponse

**Handles Zod validation errors**

Specialized error handler for Zod schema validation failures. Transforms Zod error objects into standardized API error responses with detailed field-level validation messages.

**Parameters:**
- `error` (ZodError) - Zod validation error object

**Returns:**
NextResponse<ApiErrorResponse> - 400 Bad Request with validation details

**Example:**
```typescript
import { validationErrorResponse } from '@/lib/utils/api-response';
import { z } from 'zod';

const CreateProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = CreateProductSchema.parse(body);
    // Process valid data...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error);
    }
    throw error; // Re-throw non-validation errors
  }
}
```

**Implementation Notes:**
Extracts field-level validation errors from Zod's error structure and includes them in the response details. Frontend code can use these details to highlight specific form fields.

---

### handleUnknownError

**Handles unknown errors with safe fallback**

Safely processes unknown error types that might be thrown by third-party libraries, database connections, or unexpected runtime conditions. Never throws, always returns a valid error response.

**Parameters:**
- `error` (unknown) - The caught error (could be anything)
- `context` (string) - Contextual description of where the error occurred (default: 'Unknown error')

**Returns:**
NextResponse<ApiErrorResponse> - 500 Internal Server Error with safe error details

**Example:**
```typescript
import { handleUnknownError } from '@/lib/utils/api-response';

export async function GET() {
  try {
    // Database query, external API call, etc.
    const data = await someUnpredictableOperation();
    return successResponse(data);
  } catch (error) {
    // Could be network error, database timeout, JSON parsing failure, etc.
    return handleUnknownError(error, 'Failed to fetch product data');
  }
}
```

**Error Handling:**
Safely extracts error messages from Error objects, handles non-Error throws, and prevents sensitive information leakage. In development, includes more details; in production, sanitizes error information.

---

### notFoundResponse

**Creates a 404 Not Found response**

Standardized response for missing resources. Consistent messaging helps frontend code handle 404s uniformly.

**Parameters:**
- `resource` (string) - Description of the resource that wasn't found

**Returns:**
NextResponse<ApiErrorResponse> - 404 Not Found response

**Example:**
```typescript
import { notFoundResponse } from '@/lib/utils/api-response';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const product = await getProductById(params.id);
  
  if (!product) {
    return notFoundResponse(`Product with ID ${params.id}`);
  }
  
  return successResponse(product);
}
```

---

### badRequestResponse

**Creates a 400 Bad Request response**

Standardized response for client-side errors like malformed requests, missing headers, or invalid parameters.

**Parameters:**
- `message` (string) - Description of what's wrong with the request

**Returns:**
NextResponse<ApiErrorResponse> - 400 Bad Request response

**Example:**
```typescript
import { badRequestResponse } from '@/lib/utils/api-response';

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type');
  
  if (!contentType?.includes('application/json')) {
    return badRequestResponse('Content-Type must be application/json');
  }
  
  // Process JSON request...
}
```

---

### isApiError

**Type guard for error responses**

Runtime type checking to differentiate between success and error responses. Useful when handling API responses on the client side.

**Parameters:**
- `response` (unknown) - API response to check

**Returns:**
boolean - True if response is an ApiErrorResponse (also narrows TypeScript type)

**Example:**
```typescript
import { isApiError } from '@/lib/utils/api-response';

async function createProduct(data: ProductData) {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result = await response.json();
  
  if (isApiError(result)) {
    // TypeScript knows result is ApiErrorResponse
    console.error('API Error:', result.error.code, result.error.message);
    return null;
  }
  
  // TypeScript knows result is ApiSuccessResponse
  return result.data;
}
```

## Common Patterns

### Standard API Route Structure

Most API routes follow this pattern:

```typescript
import { 
  successResponse, 
  validationErrorResponse, 
  handleUnknownError 
} from '@/lib/utils/api-response';
import { z } from 'zod';

const RequestSchema = z.object({
  // Define your schema
});

export async function POST(request: Request) {
  try {
    // 1. Parse and validate input
    const body = await request.json();
    const validatedData = RequestSchema.parse(body);
    
    // 2. Business logic
    const result = await performBusinessLogic(validatedData);
    
    // 3. Success response
    return successResponse(result, 201);
    
  } catch (error) {
    // 4. Handle known error types
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error);
    }
    
    // 5. Handle unknown errors
    return handleUnknownError(error, 'Product creation failed');
  }
}
```

### Client-Side Response Handling

```typescript
import { isApiError } from '@/lib/utils/api-response';

async function apiCall() {
  const response = await fetch('/api/endpoint');
  const data = await response.json();
  
  if (isApiError(data)) {
    // Handle error case
    throw new Error(data.error.message);
  }
  
  // Handle success case
  return data.data;
}
```

### Error Boundary Integration

```typescript
// Custom hook for API calls with error handling
function useApiCall<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const call = async () => {
    try {
      const response = await fetch(endpoint);
      const result = await response.json();
      
      if (isApiError(result)) {
        setError(result.error.message);
        return;
      }
      
      setData(result.data);
    } catch (err) {
      setError('Network error');
    }
  };
  
  return { data, error, call };
}
```

## Best Practices

**Always use these utilities** instead of creating raw NextResponse objects. Consistency matters more than flexibility here.

**Type your success responses** by passing generic parameters to `successResponse<YourDataType>()`. TypeScript inference usually handles this automatically.

**Use appropriate HTTP status codes** - Don't return 200 for everything. Use 201 for created resources, 400 for client errors, 404 for missing resources.

**Include context in error messages** - "Product creation failed" is better than "Database error". Help developers debug without exposing internals.

**Handle Zod errors specifically** - Use `validationErrorResponse()` for schema validation failures. The structured field errors help frontend code highlight problematic form fields.

## Things to Watch Out Of

**Never throw errors from error response functions** - They're designed to be the last line of defense. If `handleUnknownError` throws, your API route is broken.

**Don't include sensitive data in error details** - Error details are visible to clients. Never include database connection strings, API keys, or user data from other accounts.

**Avoid nested try-catch blocks** - Handle validation errors specifically, then use `handleUnknownError` for everything else. Complex error handling logic is hard to test and maintain.

**Status codes must match error types** - Don't return 500 for validation errors or 400 for server failures. Frontend code relies on status codes for behavior branching.

## Related Modules

**lib/config/api.ts** - Defines the ErrorCode enum used by error response functions. Contains HTTP_STATUS constants and API configuration.

**Database utilities** - Query functions that throw errors are typically wrapped with these response builders in API routes.

**Validation schemas** - Zod schemas work seamlessly with `validationErrorResponse()` for request validation.