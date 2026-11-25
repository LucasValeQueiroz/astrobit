/**
 * AstroBit Global Galaxy Leaderboard Engine — 100% pure, DOM-free, kid-safe.
 * Builds privacy-safe public pilot cards (never exposes email or PII) and ranks
 * pilots deterministically by XP -> Stars -> Arcade Record.
 */

import { getTotalStars } from '../storage/progress.js';
import { computeXpLevel } from './xp-and-quests.js';
import { sanitizePilotName } from './space-passport.js';
import { getDroneById } from './companions-and-hints.js';

/**
 * Creates a privacy-safe public leaderboard entry (nickname, level, XP, stars, arcade best, drone).
 */
export function buildLeaderboardEntry(uid, progress, lang = 'pt') {
  const stars = getTotalStars(progress);
  const xpInfo = computeXpLevel(progress?.xp || 0);
  const drone = getDroneById(progress?.droneId);
  return {
    uid: String(uid || 'local'),
    pilotName: sanitizePilotName(progress?.pilotName, lang),
    level: xpInfo.level,
    xp: xpInfo.totalXp,
    stars,
    arcadeBestScore: Math.max(0, Math.floor(Number(progress?.arcadeBestScore) || 0)),
    droneIcon: drone.icon,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Sorts leaderboard entries by XP desc -> Stars desc -> Arcade Best desc,
 * assigns 1-based rank + podium medal, and marks `isSelf` for `currentUid`.
 */
export function rankLeaderboardEntries(entries = [], currentUid = null) {
  const safe = Array.isArray(entries) ? entries.filter((e) => e && typeof e === 'object') : [];
  const sorted = [...safe].sort((a, b) => {
    const xpDiff = (Number(b.xp) || 0) - (Number(a.xp) || 0);
    if (xpDiff !== 0) return xpDiff;
    const starDiff = (Number(b.stars) || 0) - (Number(a.stars) || 0);
    if (starDiff !== 0) return starDiff;
    return (Number(b.arcadeBestScore) || 0) - (Number(a.arcadeBestScore) || 0);
  });

  return sorted.slice(0, 20).map((entry, idx) => {
    const rank = idx + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
    return {
      ...entry,
      rank,
      medal,
      isSelf: Boolean(currentUid && entry.uid === currentUid),
    };
  });
}
