import {
  sqliteTable,
  integer,
  text,
  real,
  primaryKey,
} from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

export const users = sqliteTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: integer('emailVerified', { mode: 'timestamp_ms' }),
  image: text('image'),
  role: text('role').$type<'BASIC' | 'DM'>().notNull().default('BASIC'),
});

export const houses = sqliteTable('house', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  motto: text('motto'),
  bio: text('bio'),
  gold: integer('gold').notNull().default(0),
});

export const accounts = sqliteTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<'oauth' | 'oidc' | 'email'>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = sqliteTable('session', {
  sessionToken: text('sessionToken').notNull().primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
});

export const verificationTokens = sqliteTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// Potion Templates - Static definitions for different types of potions
export const potionTemplates = sqliteTable('potion_templates', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  level: integer('level').notNull(),
  school: text('school').notNull(),
  rarity: text('rarity')
    .$type<
      'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'artifact'
    >()
    .notNull(),
  potencyFailEffect: text('potency_fail_effect').notNull(),
  potencySuccessEffect: text('potency_success_effect').notNull(),
  potencyCriticalSuccessEffect: text(
    'potency_critical_success_effect'
  ).notNull(),
  description: text('description'),
  cost: integer('cost').notNull(),
  splitAmount: text('split_amount'),
  specialIngredient: text('special_ingredient'),
  isDiscovered: integer('is_discovered', { mode: 'boolean' })
    .notNull()
    .default(false),
  // JSON field for additional properties like tags, filters, etc.
  propsJson: text('props_json'), // Store as JSON string
});

// Actual Potions - Instances created from templates
export const potions = sqliteTable('potions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  customId: text('custom_id').notNull(), // Reference to Excel sheet ID
  potionTemplateId: text('potion_template_id')
    .notNull()
    .references(() => potionTemplates.id, { onDelete: 'cascade' }),
  craftedPotency: text('crafted_potency')
    .$type<'fail' | 'success' | 'critical_success' | 'success_unknown'>()
    .notNull(),
  consumedBy: text('consumed_by'), // User ID or character name
  consumedAt: integer('consumed_at', { mode: 'timestamp_ms' }), // When consumed
  craftedBy: text('crafted_by').notNull(), // User ID or character name
  craftedAt: integer('crafted_at', { mode: 'timestamp_ms' }).$defaultFn(
    () => new Date()
  ), // When crafted
  weight: real('weight').notNull(),
  specialIngredientDetails: text('special_ingredient_details'), // Specific details about the special ingredient used (e.g., "Bird" for Bane potion, "Perception" for Talent potion)
  // Partial consumption tracking
  usedAmount: text('used_amount'), // Amount consumed (e.g., "1 Dose", "1 die+1", "1 Turn")
  remainingAmount: text('remaining_amount'), // Amount remaining (e.g., "2 Doses", "4 die+1", "3 Turns")
  isFullyConsumed: integer('is_fully_consumed', { mode: 'boolean' })
    .notNull()
    .default(false), // Whether the potion is completely used up
});

// Junction table for user-potion ownership
export const userPotions = sqliteTable(
  'user_potions',
  {
    potionId: text('potion_id')
      .notNull()
      .references(() => potions.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    // Compound primary key to ensure a user can't own the same potion twice
    pk: primaryKey({
      columns: [table.userId, table.potionId],
    }),
  })
);

// Spell Templates - Static definitions for different types of spells
export const spellTemplates = sqliteTable('spell_templates', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  school: text('school').notNull(),
  level: integer('level').notNull(),
  baseEffect: text('base_effect').notNull(), // Stored as markdown
  associatedSkill: text('associated_skill'),
  inversionEffect: text('inversion_effect'), // Stored as markdown
  masteryEffect: text('mastery_effect'),
  isInvertable: integer('is_invertable', { mode: 'boolean' })
    .notNull()
    .default(false),
  isDiscovered: integer('is_discovered', { mode: 'boolean' })
    .notNull()
    .default(false),
  isInversionPublic: integer('is_inversion_public', { mode: 'boolean' })
    .notNull()
    .default(false),
  // JSON field for additional properties like tags, filters, etc.
  propsJson: text('props_json'), // Store as JSON string
});

// Actual Scrolls - Instances created from spell templates
export const scrolls = sqliteTable('scrolls', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  spellTemplateId: text('spell_template_id')
    .notNull()
    .references(() => spellTemplates.id, { onDelete: 'cascade' }),
  material: text('material').notNull().default('paper'), // e.g. paper, vellum, etc.
  consumedBy: text('consumed_by'), // User ID or character name
  consumedAt: integer('consumed_at', { mode: 'timestamp_ms' }), // When consumed
  craftedBy: text('crafted_by').notNull(), // User ID or character name
  craftedAt: integer('crafted_at', { mode: 'timestamp_ms' }).$defaultFn(
    () => new Date()
  ), // When crafted
  weight: real('weight').notNull(),
});

// Junction table for user-scroll ownership
export const userScrolls = sqliteTable(
  'user_scrolls',
  {
    scrollId: text('scroll_id')
      .notNull()
      .references(() => scrolls.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    // Compound primary key to ensure a user can't own the same scroll twice
    pk: primaryKey({
      columns: [table.userId, table.scrollId],
    }),
  })
);
