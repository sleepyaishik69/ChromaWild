import { GemmaAnalysisResponse } from '@/types';

// Local fallback for field observations when the evaluation model is unavailable.
export function getLocalNaturalistLore(
  colorName: string,
  hex: string,
  rgb: [number, number, number],
  matchScore = 85,
  deltaE = 5,
  targetColorName = 'Target color',
): GemmaAnalysisResponse {
  const [red, green, blue] = rgb;
  const tone = red > green * 1.15 && red > blue * 1.15
    ? 'warm'
    : blue > red * 1.15 && blue > green * 1.05
      ? 'cool'
      : green > red * 1.08 && green > blue * 1.05
        ? 'green'
        : 'balanced';
  const verdict = matchScore >= 88
    ? `CLOSE MATCH (${matchScore}%)`
    : matchScore >= 72
      ? `FIELD VARIATION (${matchScore}%)`
      : `DIFFERENT TONE (${matchScore}%)`;

  return {
    commonName: `${colorName} field sample`,
    matchVerdict: verdict,
    matchCritique: `${colorName} (${hex}) is ${deltaE.toFixed(1)} Delta-E from ${targetColorName}. The ${tone} appearance can shift with daylight, shade, distance, and the surface itself.`,
    paletteHarmony: 'Compare the subject with nearby colors to notice how light and contrast change its appearance.',
    pigmentLore: `This sample reads as a ${tone} color. Its visible tone comes from the surface, its finish, and the light reflecting from it.`,
    sketchingAdvice: 'Draw the main outline lightly, then block in the largest light and shadow shapes. Add short marks that follow the surface texture, whether it is smooth, rough, or patterned.',
    suggestedTags: ['#fieldnotes', '#colorstudy', '#outside'],
    provider: 'built-in-field-notes',
  };
}
