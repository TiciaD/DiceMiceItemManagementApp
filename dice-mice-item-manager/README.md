# Dice Mice Item Manager

A D&D item management application with Discord OAuth authentication.

## Setup Instructions

### 1. Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name (e.g., "Dice Mice Item Manager")
3. Go to the "OAuth2" section in the sidebar
4. Add a redirect URI: `http://localhost:3000/api/auth/callback/discord`
5. Copy the Client ID and Client Secret
6. Update your `.env.local` file with these values:

```bash
DISCORD_CLIENT_ID="your_actual_client_id_here"
DISCORD_CLIENT_SECRET="your_actual_client_secret_here"
```

### 2. Environment Variables

Your `.env.local` file should contain:

```bash
# TursoDB Configuration
TURSO_DATABASE_URL="your_turso_database_url"
TURSO_AUTH_TOKEN="your_turso_auth_token"

# Discord OAuth
DISCORD_CLIENT_ID="your_discord_client_id"
DISCORD_CLIENT_SECRET="your_discord_client_secret"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_generated_secret"
```

# Dice Mice Item Manager

A D&D item management application with Discord OAuth authentication.

## Setup Instructions

### 1. Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name (e.g., "Dice Mice Item Manager")
3. Go to the "OAuth2" section in the sidebar
4. Add redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/discord`
   - For production: `https://your-domain.com/api/auth/callback/discord`
5. Copy the Client ID and Client Secret
6. Update your environment files with these values

### 2. Environment Variables

#### Development (`.env.local`)

```bash
# TursoDB Configuration
TURSO_DATABASE_URL="your_dev_turso_database_url"
TURSO_AUTH_TOKEN="your_dev_turso_auth_token"

# Discord OAuth
DISCORD_CLIENT_ID="your_discord_client_id"
DISCORD_CLIENT_SECRET="your_discord_client_secret"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_generated_secret"
```

#### Production (`.env.production`)

```bash
# TursoDB Configuration
TURSO_DATABASE_URL="your_production_turso_database_url"
TURSO_AUTH_TOKEN="your_production_turso_auth_token"

# Discord OAuth
DISCORD_CLIENT_ID="your_production_discord_client_id"
DISCORD_CLIENT_SECRET="your_production_discord_client_secret"

# NextAuth
NEXTAUTH_URL="https://your-production-domain.com"
NEXTAUTH_SECRET="your_production_nextauth_secret"
```

**Important:** Always generate a new `NEXTAUTH_SECRET` for production using:

```bash
openssl rand -base64 32
```

### 3. Database Setup

#### Development Database

```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Open database studio
npm run db:studio
```

#### Production Database

```bash
# Generate migrations for production
npm run db:generate:production

# Run migrations on production database
npm run db:migrate:production

# Open production database studio
npm run db:studio:production
```

# Open production database studio

npm run db:studio:production

````

### 4. Development Workflow

```bash
# Start development server
npm run dev

# Run database migrations (development)
npm run db:migrate

# Generate new migrations after schema changes
npm run db:generate
````

### 5. Production Deployment

#### Prerequisites

1. Create a production TursoDB database
2. Set up production Discord OAuth application
3. Generate a secure `NEXTAUTH_SECRET`
4. Create `.env.production` with production values

#### Deployment Steps

```bash
# Deploy to production (runs migrations and builds)
npm run deploy:production

# Or manually:
npm run db:migrate:production  # Run production migrations
npm run build:production       # Build for production
npm start                      # Start production server
```

#### Platform-Specific Deployment

**Vercel:**

- Add environment variables in Vercel dashboard
- The build process will automatically use production environment variables

**Other Platforms:**

- Ensure `NODE_ENV=production` is set
- Copy `.env.production` to your server
- Run `npm run deploy:production`

Visit your production URL to see your application.

## Troubleshooting

### Vercel Build Errors with Turbopack

If you encounter errors like `Parsing ecmascript source code failed` with LICENSE files when deploying to Vercel:

1. **Use the standard build** (not Turbopack) for production:

   ```bash
   npm run build  # Instead of npm run build:turbo
   ```

2. **Vercel configuration** is included in `vercel.json` to use the standard build

3. **For local development**, you can still use Turbopack:
   ```bash
   npm run dev  # Uses Turbopack for faster dev builds
   ```

### Build Scripts Available

- `npm run build` - Standard Next.js build (recommended for production)
- `npm run build:turbo` - Turbopack build (faster, but may have issues with some packages)
- `npm run build:production` - Production build with environment variables

## Features

- ✅ Discord OAuth authentication
- ✅ TursoDB SQLite database integration
- ✅ NextAuth.js session management
- ✅ Drizzle ORM for database operations
- ✅ Tailwind CSS for styling
- ✅ TypeScript support
- ✅ Environment-specific configuration
- ✅ Production deployment workflow

## Database Schema

The application includes the following tables:

- `users` - User account information
- `accounts` - OAuth account linking
- `sessions` - User sessions
- `verificationTokens` - Email verification (if needed)

## Next Steps

1. Set up your Discord OAuth credentials
2. Test the authentication flow
3. Start building your item management features!

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: NextAuth.js v4 with Discord provider
- **Database**: TursoDB (SQLite)
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS
- **Language**: TypeScript
