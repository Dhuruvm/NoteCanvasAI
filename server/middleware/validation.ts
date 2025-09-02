import { z } from 'zod';

/**
 * Data validation middleware for API endpoints
 */
export function validateData<T extends Record<string, z.ZodType>>(
  schemas: T,
  data: any
): { [K in keyof T]: z.infer<T[K]> } {
  const result: any = {};
  
  for (const [key, schema] of Object.entries(schemas)) {
    try {
      result[key] = schema.parse(data[key]);
    } catch (error) {
      throw new Error(`Validation failed for ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return result;
}