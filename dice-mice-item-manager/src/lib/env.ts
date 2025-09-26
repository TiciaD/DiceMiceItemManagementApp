import dotenv from 'dotenv';

// Load the appropriate environment file based on NODE_ENV
function loadEnvConfig() {
  const environment = process.env.NODE_ENV || 'development';
  const envFile =
    environment === 'production' ? '.env.production' : '.env.local';

  // Load environment variables
  dotenv.config({ path: envFile });

  // Validate required environment variables
  const requiredVars = [
    'TURSO_DATABASE_URL',
    'TURSO_AUTH_TOKEN',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
        `Make sure to set them in ${envFile}`
    );
  }

  console.log(`✅ Environment loaded from: ${envFile}`);
}

// Load config when this module is imported
loadEnvConfig();

export { loadEnvConfig };
