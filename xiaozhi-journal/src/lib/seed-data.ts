// Seed data stub
// Placeholder for initial data seeding

import type { Journal } from '@/types';

// Empty seed journals - no automatic seeding
export const SEED_JOURNALS: Journal[] = [];

export async function seedInitialData(userId: string): Promise<void> {
  // Stub - no actual seeding
  console.log('seedInitialData stub called for user:', userId);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function hasSeedData(_userId: string): boolean {
  return false;
}