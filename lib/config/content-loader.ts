import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

/**
 * Content Loader Utility
 * Loads and validates JSON configuration files with Zod schemas
 * Includes caching for performance optimization (server-side only)
 */

/**
 * Load and validate a JSON content file
 * @param filePath - Path relative to /config directory (e.g., 'content/navigation.json')
 * @param schema - Zod schema to validate against
 * @returns Parsed and validated content
 * @throws Error if file not found or validation fails
 */
export async function loadContent<T>(
  filePath: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const fullPath = path.join(process.cwd(), 'config', filePath);
    const fileContents = await fs.readFile(fullPath, 'utf-8');
    const json = JSON.parse(fileContents);
    return schema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`Content validation failed for ${filePath}:`, error.issues);
      throw new Error(`Invalid content structure in ${filePath}: ${error.message}`);
    }
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Content file not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * In-memory cache for loaded content (server-side only)
 * Cache is disabled in development mode for hot reloading
 */
const contentCache = new Map<string, unknown>();
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Load and validate a JSON content file with caching
 * Cache is automatically disabled in development mode
 * @param filePath - Path relative to /config directory
 * @param schema - Zod schema to validate against
 * @returns Parsed and validated content
 */
export async function loadContentCached<T>(
  filePath: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  const cacheKey = filePath;

  // Skip cache in development for hot reloading
  if (isDevelopment) {
    return loadContent(filePath, schema);
  }

  if (contentCache.has(cacheKey)) {
    return contentCache.get(cacheKey) as T;
  }

  const content = await loadContent(filePath, schema);
  contentCache.set(cacheKey, content);
  return content;
}

/**
 * Clear the content cache
 * Useful for testing or manual cache invalidation
 */
export function clearContentCache() {
  contentCache.clear();
}

/**
 * Get cache statistics
 * Useful for debugging and monitoring
 */
export function getCacheStats() {
  return {
    size: contentCache.size,
    keys: Array.from(contentCache.keys()),
    isDevelopment,
  };
}
