import 'dotenv/config';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');

dotenv.config({ path: envPath });

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(64),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().default(3001),
});

const config = envSchema.parse(process.env);

export default config;