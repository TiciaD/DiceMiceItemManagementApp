import dotenv from 'dotenv';

// Load the appropriate environment file based on NODE_ENV
function loadEnvConfig() {
  const environment = process.env.NODE_ENV || 'development';

  // Only load from .env files in development/local environments
  // In production (Vercel), environment variables are set in the dashboard
  if (environment !== 'production') {
    const envFile = '.env.local';
    dotenv.config({ path: envFile });
    console.log(`✅ Environment loaded from: ${envFile}`);
  } else {
    console.log(`✅ Environment loaded from: Vercel dashboard (production)`);
  }

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
    console.error(
      `❌ Missing required environment variables: ${missingVars.join(', ')}`
    );
    // In production, log what variables we do have (without values)
    if (environment === 'production') {
      const availableVars = requiredVars.filter(
        (varName) => !!process.env[varName]
      );
      console.log(`✅ Available variables: ${availableVars.join(', ')}`);
    }
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
}

// Load config when this module is imported
loadEnvConfig();

export { loadEnvConfig };
