import { counties } from '@/db/schema';

export type County = typeof counties.$inferSelect;
export type NewCounty = typeof counties.$inferInsert;

// Extended house type that includes county information
export interface HouseWithCounty {
  id: string;
  name: string;
  userId: string;
  countyId: string;
  motto: string | null;
  bio: string | null;
  gold: number;
  county: County;
}
