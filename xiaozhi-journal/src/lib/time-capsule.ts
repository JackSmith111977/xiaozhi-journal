import type { Journal } from '@/types';
import { getMeta, setMeta } from '@/lib/db';

// Time capsule anchor configurations (priority ascending: lower = higher priority)
const ANCHOR_CONFIGS = [
  { key: 'year_ago',      months: 12, toleranceDays: 3, minDays: 365, priority: 1 },
  { key: 'half_year_ago', months: 6,  toleranceDays: 3, minDays: 180, priority: 2 },
  { key: 'quarter_ago',   months: 3,  toleranceDays: 2, minDays: 90,  priority: 3 },
] as const;

interface AnchorConfig {
  key: string;
  months: number;
  toleranceDays: number;
  minDays: number;
  priority: number;
}

interface TimeCapsuleResult {
  journal: Journal;
  diffDays: number;
  anchorKey: string;
  title: string;
}

// Frequency control state
interface CapsuleState {
  lastShownDate: string | null;
  cooldownJournalIds: string[]; // journal IDs in 30-day cooldown
  closeCount: number;
  closeCooldownUntil: string | null; // ISO date string, null means no cooldown
}

const STATE_KEY = 'capsuleState';
const CLOSE_COOLDOWN_DAYS = 7;
const CLOSE_COUNT_THRESHOLD = 3;

/**
 * Calculate the number of full calendar days between two timestamps.
 * Uses local date components to avoid DST issues.
 */
function diffInDays(a: Date, b: Date): number {
  const aDate = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bDate = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((aDate.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Generate dynamic title based on days difference.
 */
export function getCapsuleTitle(diffDays: number): string {
  if (diffDays >= 730) {
    const years = Math.floor(diffDays / 365);
    return `${years} 年前的今天，你也有过这样的感受`;
  }
  if (diffDays >= 365) {
    return '一年前的今天，你也这样想过';
  }
  if (diffDays >= 180) {
    return '大约半年前，你写下了这些';
  }
  return '几个月前的你，也在经历类似的时刻';
}

/**
 * Load capsule state from IndexedDB.
 */
async function loadState(): Promise<CapsuleState> {
  try {
    const raw = await getMeta(STATE_KEY);
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      return {
        lastShownDate: typeof obj.lastShownDate === 'string' ? obj.lastShownDate : null,
        cooldownJournalIds: Array.isArray(obj.cooldownJournalIds)
          ? (obj.cooldownJournalIds.filter((id): id is string => typeof id === 'string'))
          : [],
        closeCount: typeof obj.closeCount === 'number' ? obj.closeCount : 0,
        closeCooldownUntil: typeof obj.closeCooldownUntil === 'string' ? obj.closeCooldownUntil : null,
      };
    }
  } catch {
    // IndexedDB failure — return empty state
  }
  return { lastShownDate: null, cooldownJournalIds: [], closeCount: 0, closeCooldownUntil: null };
}

/**
 * Save capsule state to IndexedDB.
 */
async function saveState(state: CapsuleState): Promise<void> {
  await setMeta(STATE_KEY, state);
}

/**
 * Record that the user closed the capsule popup.
 * Returns whether the capsule should be suppressed due to consecutive closes.
 */
export async function recordClose(): Promise<boolean> {
  const state = await loadState();

  state.closeCount += 1;

  if (state.closeCount >= CLOSE_COUNT_THRESHOLD) {
    const until = new Date();
    until.setDate(until.getDate() + CLOSE_COOLDOWN_DAYS);
    state.closeCooldownUntil = until.toISOString();
    state.closeCount = 0;
  }

  await saveState(state);

  return state.closeCooldownUntil !== null && new Date(state.closeCooldownUntil) > new Date();
}

/**
 * Record that a capsule was shown (resets close count).
 */
export async function recordShown(journalId: string): Promise<void> {
  const state = await loadState();
  const today = new Date().toISOString().split('T')[0]!;

  state.lastShownDate = today;

  // Cap array size: keep last 100 entries to prevent unbounded growth
  if (state.cooldownJournalIds.length > 100) {
    state.cooldownJournalIds = state.cooldownJournalIds.slice(-100);
  }

  if (!state.cooldownJournalIds.includes(journalId)) {
    state.cooldownJournalIds.push(journalId);
  }

  // Reset close count
  state.closeCount = 0;

  await saveState(state);
}

/**
 * Check if frequency control allows showing a capsule today.
 */
function canShow(state: CapsuleState): boolean {
  const today = new Date().toISOString().split('T')[0]!;

  // Check 24h cooldown
  if (state.lastShownDate === today) return false;

  // Check close cooldown
  if (state.closeCooldownUntil && new Date(state.closeCooldownUntil) > new Date()) {
    return false;
  }

  return true;
}

/**
 * Check if a journal is in 30-day cooldown.
 */
function isInCooldown(state: CapsuleState, journalId: string): boolean {
  return state.cooldownJournalIds.includes(journalId);
}

/**
 * Find a matching historical journal for the time capsule.
 * Uses config-driven multi-anchor matching.
 */
export function findTimeCapsule(
  newJournal: Journal,
  allJournals: Journal[],
  state: CapsuleState,
): TimeCapsuleResult | null {
  if (!canShow(state)) return null;

  const newDate = new Date(newJournal.timestamp);

  // Sort configs by priority (ascending)
  const sortedConfigs = [...ANCHOR_CONFIGS].sort((a, b) => a.priority - b.priority);

  for (const config of sortedConfigs) {
    // Calculate target date by going back the configured months
    const targetDate = new Date(newDate);
    targetDate.setMonth(targetDate.getMonth() - config.months);

    // Find candidates in the tolerance window
    const candidates = allJournals.filter((j) => {
      if (j.id === newJournal.id) return false;
      if (isInCooldown(state, j.id)) return false;

      const jDate = new Date(j.timestamp);
      const diff = diffInDays(newDate, jDate);

      // Exclude future journals
      if (diff < 0) return false;

      // Must meet minimum days threshold
      if (diff < config.minDays) return false;

      // Check if within tolerance window of the target date
      const targetDiff = diffInDays(targetDate, jDate);
      return Math.abs(targetDiff) <= config.toleranceDays;
    });

    if (candidates.length > 0) {
      // Prefer mood-matched candidates
      const moodMatched = candidates.filter(
        (j) => Math.abs(j.mood - newJournal.mood) <= 1,
      );
      const pool = moodMatched.length > 0 ? moodMatched : candidates;
      const selected = pool[Math.floor(Math.random() * pool.length)]!;
      const diff = diffInDays(newDate, new Date(selected.timestamp));

      return {
        journal: selected,
        diffDays: diff,
        anchorKey: config.key,
        title: getCapsuleTitle(diff),
      };
    }
  }

  return null;
}

/**
 * Main entry point: load state, find capsule.
 * Does NOT record the shown journal — caller should call `commitCapsuleShown` after deciding to show.
 */
export async function checkTimeCapsule(
  newJournal: Journal,
  allJournals: Journal[],
): Promise<TimeCapsuleResult | null> {
  const state = await loadState();
  return findTimeCapsule(newJournal, allJournals, state);
}
