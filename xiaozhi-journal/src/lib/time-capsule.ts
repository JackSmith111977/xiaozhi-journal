// Time capsule functionality stub
// Placeholder for time capsule matching feature

import type { Journal } from '@/types';

export interface TimeCapsuleMatchResult {
  journal: Journal;
  title: string;
}

export interface TimeCapsule {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  openAt: Date;
  opened: boolean;
}

export async function createCapsule(content: string, openAt: Date): Promise<TimeCapsule> {
  return {
    id: 'stub-id',
    userId: 'stub-user',
    content,
    createdAt: new Date(),
    openAt,
    opened: false,
  };
}

export async function getAvailableCapsules(userId: string): Promise<TimeCapsule[]> {
  return [];
}

export async function openCapsule(capsuleId: string): Promise<TimeCapsule | null> {
  return null;
}

export async function checkTimeCapsule(
  latest: Journal,
  journals: Journal[]
): Promise<TimeCapsuleMatchResult | null> {
  // Stub - no matching logic
  console.log('checkTimeCapsule stub called for:', latest.id);
  return null;
}

export function recordShown(journalId: string): void {
  // Stub - record that capsule was shown
  console.log('recordShown stub called for:', journalId);
}

export function recordClose(capsuleId?: string): void {
  // Stub - record that capsule popup was closed
  console.log('recordClose stub called for:', capsuleId || 'unknown');
}