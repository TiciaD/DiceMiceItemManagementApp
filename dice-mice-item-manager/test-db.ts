import * as dotenv from 'dotenv';

// Load environment variables first
const result = dotenv.config({ path: '.env.local' });
console.log('Dotenv result:', result);
console.log(
  'All env vars:',
  Object.keys(process.env).filter(
    (key) =>
      key.startsWith('TURSO') ||
      key.startsWith('DISCORD') ||
      key.startsWith('NEXTAUTH')
  )
);

import { db } from './src/db/client';
import { sql } from 'drizzle-orm';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log(
      'TURSO_DATABASE_URL:',
      process.env.TURSO_DATABASE_URL ? 'Set' : 'Not set'
    );
    console.log(
      'TURSO_AUTH_TOKEN:',
      process.env.TURSO_AUTH_TOKEN ? 'Set' : 'Not set'
    );

    // Test a simple query using the function call
    const dbInstance = db();
    const result = await dbInstance.run(sql`SELECT 1 as test`);
    console.log('Database connection successful:', result);

    // Check if tables exist
    const tables = await dbInstance.run(
      sql`SELECT name FROM sqlite_master WHERE type='table'`
    );
    console.log('Tables in database:', tables);
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

testConnection();

testConnection();
