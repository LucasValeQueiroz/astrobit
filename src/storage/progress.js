/**
 * AstroBit Local Progress Store (localStorage-backed, injectable for unit tests).
 */

export const PROGRESS_STORAGE_KEY = 'astrobit-progress-v1';

export function createDefaultProgress() {
  return {
    starsByLevel: {},
    currentLevelId: 'w1-1',
    skinId: 'explorer',
    droneId: 'spark',
    lang: 'pt',
    speed: 'normal', // 'slow' | 'normal' | 'fast'
    codeLang: 'js',  // 'js' | 'python'
    seenIntro: false,
    seenWorlds: {},
    seenEnding: false,
    customLevels: [],
    unlockedBadges: [],
    dailyCompletedDates: [],
    labMasteredTopics: [],
    arcadeBestScore: 0,
    arcadeBestRound: 0,
    ghostsByLevel: {},
    musicMuted: false,
  };
}

export function loadProgress(storage = globalThis.localStorage) {
  const fallback = createDefaultProgress();
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      ...parsed,
      starsByLevel:
        parsed?.starsByLevel && typeof parsed.starsByLevel === 'object'
          ? { ...parsed.starsByLevel }
          : {},
      seenWorlds:
        parsed?.seenWorlds && typeof parsed.seenWorlds === 'object'
          ? { ...parsed.seenWorlds }
          : {},
      customLevels: Array.isArray(parsed?.customLevels) ? [...parsed.customLevels] : [],
      unlockedBadges: Array.isArray(parsed?.unlockedBadges) ? [...parsed.unlockedBadges] : [],
      dailyCompletedDates: Array.isArray(parsed?.dailyCompletedDates)
        ? [...parsed.dailyCompletedDates]
        : [],
      labMasteredTopics: Array.isArray(parsed?.labMasteredTopics)
        ? [...parsed.labMasteredTopics]
        : [],
      arcadeBestScore: Math.max(0, Math.floor(Number(parsed?.arcadeBestScore) || 0)),
      arcadeBestRound: Math.max(0, Math.floor(Number(parsed?.arcadeBestRound) || 0)),
      ghostsByLevel:
        parsed?.ghostsByLevel && typeof parsed.ghostsByLevel === 'object'
          ? { ...parsed.ghostsByLevel }
          : {},
      musicMuted: Boolean(parsed?.musicMuted),
    };
  } catch {
    return fallback;
  }
}

export function saveProgress(progress, storage = globalThis.localStorage) {
  if (!storage) return;
  try {
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore private browsing quota errors
  }
}

export function recordLevelCompletion(progress, levelId, stars) {
  const safeStars = Math.max(0, Math.min(3, Math.floor(Number(stars) || 0)));
  const prev = Number(progress?.starsByLevel?.[levelId] || 0);
  const best = Math.max(prev, safeStars);
  return {
    ...progress,
    starsByLevel: {
      ...(progress?.starsByLevel || {}),
      [levelId]: best,
    },
  };
}

export function getTotalStars(progress) {
  const map = progress?.starsByLevel || {};
  return Object.values(map).reduce((sum, val) => sum + (Number(val) || 0), 0);
}
