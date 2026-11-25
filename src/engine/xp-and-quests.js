/**
 * AstroBit Space XP, Pilot Leveling (Lv. 1 -> Lv. 25) & Space Quests Engine.
 * 100% pure, deterministic, DOM-free gamification loop that rewards every win,
 * perfect first-try clear, crystal grab, X-Ray inspection, and Arcade run!
 */

export const SPACE_QUESTS = [
  {
    id: 'quest-crystals-5',
    icon: '💎',
    target: 5,
    xpReward: 100,
    titlePt: 'Colete 5 Cristais Espaciais',
    titleEn: 'Collect 5 Space Crystals',
  },
  {
    id: 'quest-3star-2',
    icon: '🌟',
    target: 2,
    xpReward: 140,
    titlePt: 'Conquiste 3★ em 2 missões',
    titleEn: 'Earn 3★ on 2 missions',
  },
  {
    id: 'quest-loop-win',
    icon: '🔁',
    target: 1,
    xpReward: 120,
    titlePt: 'Vença 1 fase usando 🔁 Repetir',
    titleEn: 'Win 1 level using 🔁 Repeat',
  },
  {
    id: 'quest-xray-inspect',
    icon: '⚡',
    target: 1,
    xpReward: 80,
    titlePt: 'Ative o ⚡ Raio-X AAA no tabuleiro',
    titleEn: 'Activate ⚡ AAA X-Ray on the board',
  },
  {
    id: 'quest-ice-physics',
    icon: '🧊',
    target: 1,
    xpReward: 130,
    titlePt: 'Patine no gelo ou faça Curling no Mundo 7',
    titleEn: 'Glide on ice or Curl a crate in World 7',
  },
  {
    id: 'quest-arcade-run',
    icon: '🕹️',
    target: 1,
    xpReward: 150,
    titlePt: 'Vença 1 fase no Modo Arcade Infinito',
    titleEn: 'Clear 1 stage in Endless Arcade Mode',
  },
];

/**
 * Computes Pilot Level (1..25), XP inside current level, and XP required for next level.
 * Smooth kid-friendly curve: Lv.1->2 needs 120 XP, growing by +45 XP per level.
 */
export function computeXpLevel(totalXp = 0) {
  let remaining = Math.max(0, Math.floor(Number(totalXp) || 0));
  let level = 1;
  const maxLevel = 25;

  while (level < maxLevel) {
    const needed = 120 + (level - 1) * 45;
    if (remaining < needed) {
      return {
        level,
        totalXp: Math.max(0, Math.floor(Number(totalXp) || 0)),
        currentLevelXp: remaining,
        nextLevelXp: needed,
        pct: Math.min(100, Math.round((remaining / needed) * 100)),
        isMax: false,
      };
    }
    remaining -= needed;
    level += 1;
  }

  return {
    level: maxLevel,
    totalXp: Math.max(0, Math.floor(Number(totalXp) || 0)),
    currentLevelXp: 1,
    nextLevelXp: 1,
    pct: 100,
    isMax: true,
  };
}

export function computeWinXp({ stars = 1, firstTry = false, isDaily = false, isArcade = false, arcadeMultiplier = 1 } = {}) {
  const safeStars = Math.max(1, Math.min(3, Math.floor(Number(stars) || 1)));
  let xp = safeStars === 3 ? 120 : safeStars === 2 ? 80 : 50;
  if (firstTry) xp += 40;
  if (isDaily) xp += 90;
  if (isArcade) xp += Math.max(1, Math.floor(Number(arcadeMultiplier) || 1)) * 35;
  return xp;
}

function programUsesType(blocks = [], target) {
  if (!Array.isArray(blocks)) return false;
  for (const b of blocks) {
    if (!b || typeof b !== 'object') continue;
    if (b.type === target) return true;
    if (b.type === 'repeat' && programUsesType(b.body, target)) return true;
    if (b.type === 'if' && (programUsesType(b.then, target) || programUsesType(b.else, target))) return true;
  }
  return false;
}

/**
 * Applies XP & updates Space Quest progress immutably.
 * Returns `{ progress, xpGained, leveledUp, newLevel, completedQuests }`.
 */
export function applyGameplayRewards(progress, event = {}) {
  const prevXp = Math.max(0, Math.floor(Number(progress?.xp) || 0));
  const prevLvl = computeXpLevel(prevXp).level;
  const questProg = { ...(progress?.questProgress || {}) };
  const completedSet = new Set(Array.isArray(progress?.completedQuests) ? progress.completedQuests : []);

  let xpGained = Math.max(0, Math.floor(Number(event.baseXp) || 0));

  const bumpQuest = (id, delta = 1) => {
    if (completedSet.has(id) || delta <= 0) return;
    const q = SPACE_QUESTS.find((item) => item.id === id);
    if (!q) return;
    questProg[id] = Math.min(q.target, (Number(questProg[id]) || 0) + delta);
  };

  if (event.type === 'xray_toggle') {
    bumpQuest('quest-xray-inspect', 1);
  } else if (event.type === 'level_win') {
    const crystalsCollected = Array.isArray(event.events)
      ? event.events.filter((e) => e.type === 'collect').length
      : 0;
    if (crystalsCollected > 0) bumpQuest('quest-crystals-5', crystalsCollected);
    if (Number(event.stars) >= 3) bumpQuest('quest-3star-2', 1);

    const main = event.program?.main || [];
    const f1 = event.program?.functions?.F1 || [];
    const f2 = event.program?.functions?.F2 || [];
    if (programUsesType(main, 'repeat') || programUsesType(f1, 'repeat') || programUsesType(f2, 'repeat')) {
      bumpQuest('quest-loop-win', 1);
    }

    if (Array.isArray(event.events) && event.events.some((e) => e.type === 'slide' || e.type === 'push_crate')) {
      bumpQuest('quest-ice-physics', 1);
    }

    if (event.isArcade) {
      bumpQuest('quest-arcade-run', 1);
    }
  }

  // Auto-claim newly completed quests and award their bonus XP!
  const completedQuests = [];
  for (const q of SPACE_QUESTS) {
    if (!completedSet.has(q.id) && (Number(questProg[q.id]) || 0) >= q.target) {
      completedSet.add(q.id);
      completedQuests.push(q);
      xpGained += q.xpReward;
    }
  }

  const nextXp = prevXp + xpGained;
  const nextLvlInfo = computeXpLevel(nextXp);

  return {
    xpGained,
    leveledUp: nextLvlInfo.level > prevLvl,
    newLevel: nextLvlInfo.level,
    completedQuests,
    progress: {
      ...progress,
      xp: nextXp,
      questProgress: questProg,
      completedQuests: [...completedSet],
    },
  };
}
