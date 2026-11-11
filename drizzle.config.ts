import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/database/schema.ts',
  out: './migrations',
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '' },
  strict: true,
});
