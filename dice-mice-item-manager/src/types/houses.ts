import { houses } from '@/db/schema';

export type House = typeof houses.$inferSelect;
export type NewHouse = typeof houses.$inferInsert;
