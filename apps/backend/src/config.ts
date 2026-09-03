import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3001),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
});

const result = environmentSchema.safeParse(process.env);
if (!result.success) {
  console.error('Invalid backend environment', result.error.flatten().fieldErrors);
  throw new Error('Invalid backend environment configuration');
}

export const config = result.data;
