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
  countyId: text('county_id')
    .notNull()
    .references(() => counties.id, { onDelete: 'restrict' })
    .default('t1i7dfmcoaycjux7fz7njd1n'),
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

// Counties - Geographic regions that houses and characters originate from
export const counties = sqliteTable('county', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description').notNull(),
  associatedStat: text('associated_stat').notNull(), // e.g. STR, CON, INT, DEX, WIS, CON
  associatedSkills: text('associated_skills'), // Comma-separated skill text i.e. "Endurance, Any Defensive Saving Throw"
});

// Skills - Core skills available in the game
export const skills = sqliteTable('skill', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description').notNull(),
  associatedStat: text('associated_stat').notNull(), // e.g. STR, CON, INT, DEX, WIS, CON
});

// Skill Abilities - Abilities granted by skills at different levels
export const skillAbilities = sqliteTable('skill_ability', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description').notNull(),
  level: integer('level').notNull(),
  skillId: text('skill_id')
    .notNull()
    .references(() => skills.id, { onDelete: 'cascade' }),
});

// Classes - Character classes available in the game
export const classes = sqliteTable('class', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description').notNull(),
  prerequisiteStat1: text('prerequisite_stat_1').notNull(), // e.g. STR, CON, INT, DEX, WIS, CON
  prerequisiteStat2: text('prerequisite_stat_2'), // Optional second prerequisite stat
  isAvailable: integer('is_available', { mode: 'boolean' })
    .notNull()
    .default(true),
  willpowerProgression: text('willpower_progression').notNull(), // e.g. even_levels, all_levels, none
  hitDie: text('hit_die').notNull(), // e.g. 1d6
});

// Class Abilities - Abilities granted by classes at different levels
export const classAbilities = sqliteTable('class_ability', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description').notNull(),
  level: integer('level').notNull(),
  classId: text('class_id')
    .notNull()
    .references(() => classes.id, { onDelete: 'cascade' }),
});

// Class-Skill junction table - Which skills are available to which classes
export const classSkills = sqliteTable(
  'class_skill',
  {
    classId: text('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    skillId: text('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    // Compound primary key to ensure a class-skill pair is only defined once
    pk: primaryKey({
      columns: [table.classId, table.skillId],
    }),
  })
);

// Class Base Attributes - Base stats for classes at different levels
export const classBaseAttributes = sqliteTable('class_base_attribute', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  classId: text('class_id')
    .notNull()
    .references(() => classes.id, { onDelete: 'cascade' }),
  level: integer('level').notNull(),
  attack: integer('attack').notNull(),
  spellAttack: integer('spell_attack').notNull(),
  ac: integer('ac').notNull(),
  fortitude: integer('fortitude').notNull(),
  reflex: integer('reflex').notNull(),
  will: integer('will').notNull(),
  damageBonus: text('damage_bonus').notNull(),
  leadership: integer('leadership').notNull(),
  skillRanks: integer('skill_ranks').notNull(),
  slayer: text('slayer'), // Optional
  rage: text('rage'), // Optional
  brutalAdvantage: integer('brutal_advantage'), // Optional
});
