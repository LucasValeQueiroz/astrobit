/**
 * AstroBit Space Passport & Certificate Data Engine — 100% pure, DOM-free.
 * Computes bilingual pilot rank, sanitizes pilot names, and packages all stats
 * for client-side Canvas 2D PNG certificate generation.
 */

import { getTotalStars } from '../storage/progress.js';
import { getSkinById } from '../renderer/robot-skins.js';
import { getDroneById } from './companions-and-hints.js';

export function sanitizePilotName(rawName, lang = 'pt') {
  const cleaned = String(rawName ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, 28);
  if (cleaned.length > 0) return cleaned;
  return lang === 'en' ? 'Space Explorer' : 'Explorador Espacial';
}

export function computePilotRank({ stars = 0, badges = 0, labMastered = 0 } = {}) {
  if (stars >= 115 && labMastered >= 7) {
    return {
      id: 'aaa-legend',
      icon: '👑',
      titlePt: 'Lenda AAA do Universo',
      titleEn: 'AAA Universe Legend',
      color: '#facc15',
    };
  }
  if (stars >= 90 || badges >= 11) {
    return {
      id: 'galaxy-commander',
      icon: '🌌',
      titlePt: 'Comandante da Galáxia',
      titleEn: 'Galaxy Commander',
      color: '#c084fc',
    };
  }
  if (stars >= 54 || badges >= 7) {
    return {
      id: 'quantum-engineer',
      icon: '⚡',
      titlePt: 'Engenheiro Quântico',
      titleEn: 'Quantum Engineer',
      color: '#38bdf8',
    };
  }
  if (stars >= 18 || badges >= 3) {
    return {
      id: 'orbit-pilot',
      icon: '🚀',
      titlePt: 'Piloto de Órbita',
      titleEn: 'Orbit Pilot',
      color: '#34d399',
    };
  }
  return {
    id: 'space-cadet',
    icon: '🛰️',
    titlePt: 'Cadete Espacial',
    titleEn: 'Space Cadet',
    color: '#94a3b8',
  };
}

export function buildPassportSummary(
  progress,
  { lang = 'pt', totalMaxStars = 126, totalBadges = 15, dailyStreak = 0 } = {}
) {
  const stars = getTotalStars(progress);
  const badges = Array.isArray(progress?.unlockedBadges) ? progress.unlockedBadges.length : 0;
  const labMastered = Array.isArray(progress?.labMasteredTopics)
    ? progress.labMasteredTopics.length
    : 0;
  const arcadeBestScore = Math.max(0, Math.floor(Number(progress?.arcadeBestScore) || 0));
  const arcadeBestRound = Math.max(0, Math.floor(Number(progress?.arcadeBestRound) || 0));
  const rank = computePilotRank({ stars, badges, labMastered });
  const skin = getSkinById(progress?.skinId);
  const drone = getDroneById(progress?.droneId);

  return {
    pilotName: sanitizePilotName(progress?.pilotName, lang),
    rank,
    stars,
    totalMaxStars,
    badges,
    totalBadges,
    labMastered,
    isAaaCertified: labMastered >= 7,
    dailyStreak: Math.max(0, Math.floor(Number(dailyStreak) || 0)),
    arcadeBestScore,
    arcadeBestRound,
    skin,
    drone,
  };
}
