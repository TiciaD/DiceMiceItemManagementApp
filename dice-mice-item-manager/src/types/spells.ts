import { spellTemplates, scrolls, userScrolls } from '@/db/schema';

// Type definitions for our spell templates and instances
export type SpellTemplate = typeof spellTemplates.$inferSelect;
export type Scroll = typeof scrolls.$inferSelect;
export type UserScroll = typeof userScrolls.$inferSelect;

// Extended types for UI components
export type SpellTemplateWithDetails = SpellTemplate & {
  propsData?: {
    tags?: string[];
    [key: string]: any;
  };
};

export type ScrollWithTemplate = Scroll & {
  template: SpellTemplateWithDetails;
};

// Spell schools for UI
export const schoolColors = {
  abjuration: 'bg-blue-100 text-blue-800 border-blue-300',
  conjuration: 'bg-purple-100 text-purple-800 border-purple-300',
  divination: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  enchantment: 'bg-pink-100 text-pink-800 border-pink-300',
  evocation: 'bg-red-100 text-red-800 border-red-300',
  illusion: 'bg-violet-100 text-violet-800 border-violet-300',
  necromancy: 'bg-gray-100 text-gray-800 border-gray-300',
  transmutation: 'bg-green-100 text-green-800 border-green-300',
} as const;

// Material types
export type MaterialType = 'paper' | 'vellum' | 'parchment' | 'skin' | 'cloth';

// Material display names
export const materialDisplayNames = {
  paper: 'Paper',
  vellum: 'Vellum',
  parchment: 'Parchment',
  skin: 'Skin',
  cloth: 'Cloth',
} as const;

// Material colors for UI
export const materialColors = {
  paper: 'bg-gray-100 text-gray-800 border-gray-300',
  vellum: 'bg-amber-100 text-amber-800 border-amber-300',
  parchment: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  skin: 'bg-orange-100 text-orange-800 border-orange-300',
  cloth: 'bg-blue-100 text-blue-800 border-blue-300',
} as const;

// Form data for creating a new scroll instance
export interface CreateScrollFormData {
  spellTemplateId: string;
  material: MaterialType;
  craftedBy: string;
  craftedAt: Date;
  weight: number;
}

// Spell level colors
export const spellLevelColors = {
  0: 'bg-gray-100 text-gray-800 border-gray-300',
  1: 'bg-blue-100 text-blue-800 border-blue-300',
  2: 'bg-green-100 text-green-800 border-green-300',
  3: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  4: 'bg-orange-100 text-orange-800 border-orange-300',
  5: 'bg-red-100 text-red-800 border-red-300',
  6: 'bg-purple-100 text-purple-800 border-purple-300',
  7: 'bg-pink-100 text-pink-800 border-pink-300',
  8: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  9: 'bg-violet-100 text-violet-800 border-violet-300',
} as const;

// D&D schools list for validation
export const spellSchools = [
  'abjuration',
  'conjuration',
  'divination',
  'enchantment',
  'evocation',
  'illusion',
  'necromancy',
  'transmutation',
] as const;

export type SpellSchool = (typeof spellSchools)[number];
