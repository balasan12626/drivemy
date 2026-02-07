import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('4000'),
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_SESSION_TOKEN: z.string().optional(),
  AWS_S3_BUCKET: z.string().min(3),
  MAX_BUCKET_CAPACITY_GB: z.string().default('1000'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  PORT: Number(parsed.data.PORT),
  MAX_BUCKET_CAPACITY_GB: Number(parsed.data.MAX_BUCKET_CAPACITY_GB)
};
