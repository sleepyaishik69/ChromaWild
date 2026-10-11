export interface ColorSwatch {
  hex: string;
  rgb: [number, number, number];
  name?: string;
  percentage?: number;
}

export interface Quest {
  id: string;
  title: string;
  colorName: string;
  targetHex: string;
  targetRgb: [number, number, number];
  category: 'plants' | 'animals' | 'water' | 'sky' | 'architecture' | 'street' | 'transit' | 'public art' | 'playgrounds' | 'outdoor objects' | 'sports' | 'food' | 'other';
  difficulty: 'easy' | 'medium' | 'hard';
  outdoorHint: string;
  audioPrompt: string;
  season?: string;
  generatedBy?: string;
}

export interface SpecimenEntry {
  id: string;
  createdAt: string;
  questTitle: string;
  targetColor: ColorSwatch;
  matchedColor: ColorSwatch;
  matchScore: number; // 0 - 100%
  deltaE: number;
  palette: ColorSwatch[];
  specimenPhotoUrl: string; // Outdoor photo
  paperSketchPhotoUrl?: string; // Real physical notebook sketch photo
  locationName: string;
  weatherCondition: string;
  notes: string;
  botanicalLore?: string;
  sketchingPrompt?: string;
  matchVerdict?: string;
  matchCritique?: string;
}

export interface GemmaAnalysisResponse {
  commonName: string;
  latinName?: string;
  pigmentLore: string;
  sketchingAdvice: string;
  suggestedTags: string[];
  matchVerdict?: string;
  matchCritique?: string;
  paletteHarmony?: string;
  provider?: string;
}

export type GameStep = 'start' | 'quest' | 'match' | 'sketch' | 'library';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface PlayerStats {
  xp: number;
  level: number;
  rankTitle: string;
  questsCompleted: number;
  streak: number;
  unlockedBadgeIds: string[];
}
