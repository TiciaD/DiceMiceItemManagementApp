import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
// Import environment loader to ensure env vars are loaded
import '@/lib/env';

// Function to get environment variables with validation
function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

// Create client lazily to allow environment variables to be loaded
let _turso: ReturnType<typeof createClient> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getTurso() {
  if (!_turso) {
    _turso = createClient({
      url: getEnvVar('TURSO_DATABASE_URL'),
      authToken: getEnvVar('TURSO_AUTH_TOKEN'),
    });
  }
  return _turso;
}

function getDbInstance() {
  if (!_db) {
    _db = drizzle(getTurso());
  }
  return _db;
}

// Export getters instead of direct instances
export { getTurso as turso, getDbInstance as db };
