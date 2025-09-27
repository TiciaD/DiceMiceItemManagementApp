import { potionTemplates, potions, userPotions } from '@/db/schema';

// Type definitions for our potion templates and instances
export type PotionTemplate = typeof potionTemplates.$inferSelect;
export type Potion = typeof potions.$inferSelect;
export type UserPotion = typeof userPotions.$inferSelect;

// Extended types for UI components
export type PotionTemplateWithDetails = PotionTemplate & {
  propsData?: {
    tags?: string[];
    [key: string]: any;
  };
};

export type PotionWithTemplate = Potion & {
  template: PotionTemplateWithDetails;
};

// Rarity colors for UI
export const rarityColors = {
  common: 'bg-gray-100 text-gray-800 border-gray-300',
  uncommon: 'bg-green-100 text-green-800 border-green-300',
  rare: 'bg-blue-100 text-blue-800 border-blue-300',
  very_rare: 'bg-purple-100 text-purple-800 border-purple-300',
  legendary: 'bg-orange-100 text-orange-800 border-orange-300',
  artifact: 'bg-red-100 text-red-800 border-red-300',
} as const;

// Potency types
export type PotencyType =
  | 'critical_fail'
  | 'fail'
  | 'success'
  | 'critical_success'
  | 'success_unknown';

// Potency display names
export const potencyDisplayNames = {
  critical_fail: 'Critical Fail',
  fail: 'Fail',
  success: 'Success',
  critical_success: 'Critical Success',
  success_unknown: 'Success?',
} as const;

// Potency colors for UI
export const potencyColors = {
  critical_fail: 'bg-red-200 text-red-900 border-red-400',
  fail: 'bg-red-100 text-red-800 border-red-300',
  success: 'bg-green-100 text-green-800 border-green-300',
  critical_success: 'bg-blue-100 text-blue-800 border-blue-300',
  success_unknown: 'bg-yellow-100 text-yellow-800 border-yellow-300',
} as const;

// Form data for creating a new potion instance
export interface CreatePotionFormData {
  potionTemplateId: string;
  customId: string;
  hasCustomId: boolean;
  craftedBy: string;
  craftedAt: Date;
  craftedPotency: PotencyType;
  weight: number;
}
