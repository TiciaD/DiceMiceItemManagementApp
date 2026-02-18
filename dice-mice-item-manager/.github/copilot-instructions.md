# Dice Mice Item Manager - AI Coding Guide

## Architecture Overview

This is a Next.js 15 D&D item management app using **TursoDB (SQLite)** + **Drizzle ORM** + **NextAuth (Discord OAuth)** + **Tailwind CSS**.

### Key Components
- **Database**: TursoDB (libSQL/SQLite). Schema in [src/db/schema.ts](../src/db/schema.ts) defines all tables with Drizzle ORM
- **Authentication**: NextAuth v4 with Discord provider. Custom adapter in [src/lib/auth.ts](../src/lib/auth.ts) uses `createId()` from `@paralleldrive/cuid2` for all IDs
- **API Routes**: Next.js App Router pattern in `src/app/api/*/route.ts`. All routes use `getServerSession(authOptions)` for auth
- **Services**: Business logic in `src/lib/*-service.ts` files (e.g., [potion-service.ts](../src/lib/potion-service.ts)) - NOT in API routes

## Critical Patterns

### Database & IDs
- **Always use CUID2**: All tables use `text('id').primaryKey().$defaultFn(() => createId())` - never auto-increment
- **Database client**: Import `db()` as a function from `@/db/client` - it returns a client instance
- **Schema conventions**: 
  - Junction tables for many-to-many (e.g., `userPotions`, `userScrolls`, `characterSkills`)
  - Template pattern: `potionTemplates` → `potions`, `spellTemplates` → `scrolls`
  - Use `references()` with explicit `onDelete` behavior

### Environment & Configuration
- **Dual environment setup**: `.env.local` (dev) and `.env.production` (prod)
- **Environment loader**: [src/lib/env.ts](../src/lib/env.ts) validates required vars on module load
- **Required vars**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- **Drizzle config**: [drizzle.config.ts](../drizzle.config.ts) switches env files based on `NODE_ENV`

### API Route Pattern
```typescript
// src/app/api/example/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Call service layer, not direct DB access here
  const data = await someService(session.user.id);
  return NextResponse.json(data);
}
```

### Testing Strategy
- **Unit tests**: `__tests__/**/*.test.ts(x)` using Jest + React Testing Library
- **E2E tests**: `e2e/**/*.spec.ts` using Playwright
- **Mock database completely**: See [__tests__/api/potions.test.ts](../__tests__/api/potions.test.ts) - mock `@/db/client` with chainable methods
- **Mock NextAuth**: Always mock `next-auth` and `next-auth/react` in [jest.setup.ts](../jest.setup.ts)
- **Test data factories**: Create reusable factories for users, houses, potions, etc. in test files

## Developer Workflows

### Database Operations
```bash
# Generate migrations (dev)
npm run db:generate

# Generate migrations (prod - uses .env.production)
npm run db:generate:production

# Run migrations
npm run db:migrate  # dev
npm run db:migrate:production  # prod

# Database studio
npm run db:studio
```

### Running & Testing
```bash
npm run dev              # Next.js dev server
npm run test             # Jest unit tests
npm run test:watch       # Jest in watch mode
npm run test:e2e         # Playwright E2E tests
npm run test:all         # All tests (unit + E2E)
npm run test:ci          # CI pipeline (lint + test + build)
```

### Deployment
- **Production deployment**: `npm run deploy:production` runs [deploy-production.sh](../deploy-production.sh)
- **Vercel**: Environment variables set in Vercel dashboard (not `.env.production` in prod)

## Domain-Specific Patterns

### Character & House System
- **Hierarchy**: Users → Houses → Characters
- **County affinity**: Houses belong to a county (affects character stats)
- **Mastery tracking**: Characters earn mastery points from crafting potions/scrolls
- **Skills system**: Character skills stored in `characterSkills` junction table with levels/proficiency

### Item Management (Potions & Scrolls)
- **Template → Instance**: Templates define item types, instances are crafted items
- **Ownership**: Junction tables `userPotions`/`userScrolls` link users to items
- **Consumption tracking**: `consumedBy`, `consumedAt`, partial consumption via `remainingAmount`
- **Grunt work**: Potions can be crafted under supervision (`isGruntWork`, `supervisorCharacterId`)

### JSON Storage
- Use `text('field_name')` columns for JSON data (e.g., `propsJson` in `potionTemplates`)
- Parse with `JSON.parse()` in service layer, never store objects directly

## Common Gotchas

1. **Database client is a function**: `db()` not `db` - returns a fresh client each call
2. **Session types**: Extend types in [src/types/next-auth.d.ts](../src/types/next-auth.d.ts) to add custom fields like `role`
3. **Migration order**: Always `db:generate` before `db:migrate`
4. **Test isolation**: Mock entire `@/db/client` module - don't rely on test databases
5. **Route handlers**: Use `NextRequest`/`NextResponse` from `next/server`, not Express-style
6. **Environment switching**: Use `cross-env NODE_ENV=production` prefix for production scripts

## File Structure Conventions

- `src/app/api/*/route.ts` - API route handlers (thin, call services)
- `src/lib/*-service.ts` - Business logic and database queries
- `src/lib/*-utils.ts` - Pure utility functions (no DB access)
- `src/components/` - React components by feature (character-creation, compendium, my-items, tools)
- `src/types/` - TypeScript type definitions
- `__tests__/` - Unit tests mirroring src structure
- `e2e/` - Playwright E2E test specs
