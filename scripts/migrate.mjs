import { config } from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error('Configure DATABASE_URL in .env.local first');
const client = postgres(url, { max: 1, connect_timeout: 15 });
try {
  await migrate(drizzle(client), { migrationsFolder: './migrations' });
  console.log('Database migrations applied.');
} finally {
  await client.end({ timeout: 5 });
}
