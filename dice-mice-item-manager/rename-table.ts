import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function renameTable() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  try {
    console.log('Renaming users table to user...');
    await client.execute('ALTER TABLE `users` RENAME TO `user`;');
    console.log('Table renamed successfully!');
  } catch (error) {
    console.error('Error renaming table:', error);
  }
}

renameTable();
