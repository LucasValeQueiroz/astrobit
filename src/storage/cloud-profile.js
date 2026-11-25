/**
 * AstroBit Pilot Profile, Match History & Smart Cloud Merge Engine.
 * 100% pure, deterministic, DOM-free — powers both instant local backups (.json)
 * and conflict-free Local <-> Google/Firestore progress synchronization!
 */

import { createDefaultProgress } from './progress.js';

export const MAX_HISTORY_ENTRIES = 50;

/**
 * Appends a completed mission record to `progress.matchHistory` (newest first, capped at 50).
 */
export function appendHistoryEntry(progress, entry = {}) {
  const prev = Array.isArray(progress?.matchHistory) ? progress.matchHistory : [];
  const record = {
    id: String(entry.id || `m-${Date.now()}`),
    levelId: String(entry.levelId || 'w1-1'),
    mode: entry.mode || 'campaign', // 'campaign' | 'daily' | 'arcade' | 'custom'
    title: String(entry.title || 'Missão Espacial').slice(0, 48),
    world: Math.max(1, Math.min(7, Number(entry.world) || 1)),
    stars: Math.max(0, Math.min(3, Math.floor(Number(entry.stars) || 0))),
    blocks: Math.max(0, Math.floor(Number(entry.blocks) || 0)),
    xpGained: Math.max(0, Math.floor(Number(entry.xpGained) || 0)),
    timestamp: entry.timestamp || new Date().toISOString(),
  };

  return {
    ...progress,
    matchHistory: [record, ...prev].slice(0, MAX_HISTORY_ENTRIES),
  };
}

/**
 * Conflict-free union merge of two progress objects (e.g. localStorage + Google Firestore).
 * Always preserves the highest stars per level, highest XP & Arcade records,
 * optimal Ghost Replays (fewest blocks), union of medals/quests/dates, and deduplicated history.
 */
export function mergeProgressSnapshots(localRaw, remoteRaw) {
  const base = createDefaultProgress();
  const a = { ...base, ...(localRaw || {}) };
  const b = { ...base, ...(remoteRaw || {}) };

  // Stars: keep maximum per level
  const starsByLevel = { ...(a.starsByLevel || {}) };
  for (const [lvlId, val] of Object.entries(b.starsByLevel || {})) {
    starsByLevel[lvlId] = Math.max(Number(starsByLevel[lvlId] || 0), Number(val || 0));
  }

  // Ghosts: keep optimal (fewest blocks, then fewest steps)
  const ghostsByLevel = { ...(a.ghostsByLevel || {}) };
  for (const [lvlId, g] of Object.entries(b.ghostsByLevel || {})) {
    const cur = ghostsByLevel[lvlId];
    if (!cur || g.blocks < cur.blocks || (g.blocks === cur.blocks && g.steps < cur.steps)) {
      ghostsByLevel[lvlId] = g;
    }
  }

  // Quest progress: keep max per quest
  const questProgress = { ...(a.questProgress || {}) };
  for (const [qId, val] of Object.entries(b.questProgress || {})) {
    questProgress[qId] = Math.max(Number(questProgress[qId] || 0), Number(val || 0));
  }

  // Set unions
  const union = (arr1, arr2) => [...new Set([...(Array.isArray(arr1) ? arr1 : []), ...(Array.isArray(arr2) ? arr2 : [])])];

  // Match history: deduplicate by (timestamp + levelId + blocks) and sort newest first
  const seenHist = new Set();
  const mergedHistory = [...(Array.isArray(a.matchHistory) ? a.matchHistory : []), ...(Array.isArray(b.matchHistory) ? b.matchHistory : [])]
    .filter((item) => {
      if (!item || typeof item !== 'object') return false;
      const sig = `${item.timestamp}|${item.levelId}|${item.blocks}`;
      if (seenHist.has(sig)) return false;
      seenHist.add(sig);
      return true;
    })
    .sort((x, y) => String(y.timestamp || '').localeCompare(String(x.timestamp || '')))
    .slice(0, MAX_HISTORY_ENTRIES);

  return {
    ...a,
    starsByLevel,
    ghostsByLevel,
    questProgress,
    unlockedBadges: union(a.unlockedBadges, b.unlockedBadges),
    dailyCompletedDates: union(a.dailyCompletedDates, b.dailyCompletedDates),
    labMasteredTopics: union(a.labMasteredTopics, b.labMasteredTopics),
    completedQuests: union(a.completedQuests, b.completedQuests),
    xp: Math.max(Number(a.xp || 0), Number(b.xp || 0)),
    arcadeBestScore: Math.max(Number(a.arcadeBestScore || 0), Number(b.arcadeBestScore || 0)),
    arcadeBestRound: Math.max(Number(a.arcadeBestRound || 0), Number(b.arcadeBestRound || 0)),
    pilotName: a.pilotName || b.pilotName || '',
    seenIntro: Boolean(a.seenIntro || b.seenIntro),
    seenEnding: Boolean(a.seenEnding || b.seenEnding),
    seenWorlds: { ...(a.seenWorlds || {}), ...(b.seenWorlds || {}) },
    matchHistory: mergedHistory,
  };
}

/**
 * Serializes progress into a versioned JSON backup file string.
 */
export function exportProgressBackup(progress) {
  return JSON.stringify(
    {
      schema: 'astrobit-backup-v1',
      exportedAt: new Date().toISOString(),
      progress,
    },
    null,
    2
  );
}

/**
 * Safely parses and validates a JSON backup string, returning the progress object or null.
 */
export function parseProgressBackup(rawText) {
  if (!rawText || typeof rawText !== 'string' || rawText.length > 500_000) return null;
  try {
    const parsed = JSON.parse(rawText);
    const payload = parsed?.schema === 'astrobit-backup-v1' ? parsed.progress : parsed;
    if (!payload || typeof payload !== 'object' || typeof payload.starsByLevel !== 'object') {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
