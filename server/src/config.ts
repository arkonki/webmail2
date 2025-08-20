import 'dotenv/config';
import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string(),
  ENCRYPTION_KEY: z.string().length(32, 'Encryption key must be 32 characters long'),
});

const parsedConfig = configSchema.safeParse(process.env);

if (!parsedConfig.success) {
  console.error('❌ Invalid environment variables:', parsedConfig.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const config = parsedConfig.data;
