import { SpecimenEntry, PlayerStats, Badge } from '@/types';

const STORAGE_KEY = 'chromawild_field_entries_v1';
const PLAYER_STATS_KEY = 'chromawild_player_stats_v1';

export const ALL_BADGES: Badge[] = [
  {
    id: 'FIRST_HUNT',
    title: 'First Field Bloom',
    description: 'Completed your very first nature color scavenger hunt.',
    icon: '🌱',
  },
  {
    id: 'EAGLE_EYE',
    title: 'Eagle Eye Naturalist',
    description: 'Achieved an outstanding 85%+ color match accuracy.',
    icon: '🦅',
  },
  {
    id: 'BOTANICAL_ARTIST',
    title: 'Field Sketcher',
    description: 'Archived a custom drawing or field notebook sketch.',
    icon: '🎨',
  },
  {
    id: 'PERFECT_CHROMATIC',
    title: 'True Chromatographer',
    description: 'Scored 95%+ color match with perceptual precision.',
    icon: '🎯',
  },
  {
    id: 'GEMMA_SCHOLAR',
    title: 'Gemma 2 Scholar',
    description: 'Synthesized dynamic quests powered by Gemma 2 AI.',
    icon: '🧠',
  },
  {
    id: 'MASTER_FORAGER',
    title: 'Master Naturalist',
    description: 'Completed 5 nature quests and filled your field journal.',
    icon: '👑',
  },
];

export function getRankTitle(level: number): string {
  if (level <= 1) return 'Novice Sprout';
  if (level === 2) return 'Field Scout';
  if (level === 3) return 'Botanical Forager';
  if (level === 4) return 'Chromatographic Ranger';
  return 'Master Naturalist';
}

export function getXpForNextLevel(level: number): number {
  return level * 500;
}

export function getPlayerStats(): PlayerStats {
  if (typeof window === 'undefined') {
    return {
      xp: 0,
      level: 1,
      rankTitle: 'Novice Sprout',
      questsCompleted: 0,
      streak: 1,
      unlockedBadgeIds: [],
    };
  }

  try {
    const raw = localStorage.getItem(PLAYER_STATS_KEY);
    if (!raw) {
      const initial: PlayerStats = {
        xp: 0,
        level: 1,
        rankTitle: 'Novice Sprout',
        questsCompleted: 0,
        streak: 1,
        unlockedBadgeIds: [],
      };
      localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as PlayerStats;
    parsed.rankTitle = getRankTitle(parsed.level);
    return parsed;
  } catch (err) {
    console.error('Failed to load player stats', err);
    return {
      xp: 0,
      level: 1,
      rankTitle: 'Novice Sprout',
      questsCompleted: 0,
      streak: 1,
      unlockedBadgeIds: [],
    };
  }
}

export function savePlayerStats(stats: PlayerStats): void {
  if (typeof window === 'undefined') return;
  try {
    stats.rankTitle = getRankTitle(stats.level);
    localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save player stats', err);
  }
}

export function recordQuestCompletion(matchScore: number, hasSketch: boolean = true): {
  stats: PlayerStats;
  xpAwarded: number;
  leveledUp: boolean;
  newBadges: Badge[];
} {
  const current = getPlayerStats();

  // Base XP 200 + bonus proportional to match precision
  const xpAwarded = Math.round(200 + matchScore * 3.5);
  const newXp = current.xp + xpAwarded;
  let newLevel = current.level;
  let leveledUp = false;

  // Level up check
  while (newXp >= getXpForNextLevel(newLevel)) {
    newLevel += 1;
    leveledUp = true;
  }

  const newCompletedCount = current.questsCompleted + 1;
  const unlocked = new Set<string>(current.unlockedBadgeIds);
  const newlyAwardedBadges: Badge[] = [];

  // Check Badge conditions
  if (newCompletedCount >= 1 && !unlocked.has('FIRST_HUNT')) {
    unlocked.add('FIRST_HUNT');
    const b = ALL_BADGES.find(x => x.id === 'FIRST_HUNT');
    if (b) newlyAwardedBadges.push(b);
  }

  if (matchScore >= 85 && !unlocked.has('EAGLE_EYE')) {
    unlocked.add('EAGLE_EYE');
    const b = ALL_BADGES.find(x => x.id === 'EAGLE_EYE');
    if (b) newlyAwardedBadges.push(b);
  }

  if (matchScore >= 95 && !unlocked.has('PERFECT_CHROMATIC')) {
    unlocked.add('PERFECT_CHROMATIC');
    const b = ALL_BADGES.find(x => x.id === 'PERFECT_CHROMATIC');
    if (b) newlyAwardedBadges.push(b);
  }

  if (hasSketch && !unlocked.has('BOTANICAL_ARTIST')) {
    unlocked.add('BOTANICAL_ARTIST');
    const b = ALL_BADGES.find(x => x.id === 'BOTANICAL_ARTIST');
    if (b) newlyAwardedBadges.push(b);
  }

  if (newCompletedCount >= 5 && !unlocked.has('MASTER_FORAGER')) {
    unlocked.add('MASTER_FORAGER');
    const b = ALL_BADGES.find(x => x.id === 'MASTER_FORAGER');
    if (b) newlyAwardedBadges.push(b);
  }

  const updatedStats: PlayerStats = {
    xp: newXp,
    level: newLevel,
    rankTitle: getRankTitle(newLevel),
    questsCompleted: newCompletedCount,
    streak: Math.max(1, current.streak + 1),
    unlockedBadgeIds: Array.from(unlocked),
  };

  savePlayerStats(updatedStats);

  return {
    stats: updatedStats,
    xpAwarded,
    leveledUp,
    newBadges: newlyAwardedBadges,
  };
}

export function getSavedEntries(): SpecimenEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SpecimenEntry[];
  } catch (err) {
    console.error('Failed to load field entries from localStorage', err);
    return [];
  }
}

export function saveEntry(entry: SpecimenEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const entries = getSavedEntries();
    const updated = [entry, ...entries.filter(e => e.id !== entry.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save field entry', err);
  }
}

export function deleteEntry(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const entries = getSavedEntries();
    const filtered = entries.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete field entry', err);
  }
}
