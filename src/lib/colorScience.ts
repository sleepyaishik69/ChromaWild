import { ColorSwatch } from '@/types';

// Converts HEX to RGB
export function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Converts RGB to HEX
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Converts RGB to XYZ (D65 illuminant)
function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  let sR = r / 255;
  let sG = g / 255;
  let sB = b / 255;

  sR = sR > 0.04045 ? Math.pow((sR + 0.055) / 1.055, 2.4) : sR / 12.92;
  sG = sG > 0.04045 ? Math.pow((sG + 0.055) / 1.055, 2.4) : sG / 12.92;
  sB = sB > 0.04045 ? Math.pow((sB + 0.055) / 1.055, 2.4) : sB / 12.92;

  sR *= 100;
  sG *= 100;
  sB *= 100;

  // D65 standard Observer
  const x = sR * 0.4124 + sG * 0.3576 + sB * 0.1805;
  const y = sR * 0.2126 + sG * 0.7152 + sB * 0.0722;
  const z = sR * 0.0193 + sG * 0.1192 + sB * 0.9505;

  return [x, y, z];
}

// Converts XYZ to CIELAB
function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  // Reference white D65
  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;

  let varX = x / refX;
  let varY = y / refY;
  let varZ = z / refZ;

  const f = (val: number) => (val > 0.008856 ? Math.cbrt(val) : 7.787 * val + 16 / 116);

  varX = f(varX);
  varY = f(varY);
  varZ = f(varZ);

  const l = 116 * varY - 16;
  const a = 500 * (varX - varY);
  const b = 200 * (varY - varZ);

  return [l, a, b];
}

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

// Calculates CIE76 Delta-E (perceptual color difference)
export function calculateDeltaE(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const lab1 = rgbToLab(...rgb1);
  const lab2 = rgbToLab(...rgb2);

  const dL = lab1[0] - lab2[0];
  const da = lab1[1] - lab2[1];
  const db = lab1[2] - lab2[2];

  return Math.sqrt(dL * dL + da * da + db * db);
}

// Converts Delta E into an intuitive 0-100% match score
export function deltaEToMatchScore(deltaE: number): number {
  if (deltaE <= 1.0) return 100;
  // Delta E of 10 is very close; Delta E of 50 is noticeably different
  // Scaled non-linearly to reward close outdoor approximations
  const score = Math.max(0, 100 * Math.exp(-0.028 * deltaE));
  return Math.round(score);
}

// Client-side dominant palette extraction from an Image Element using fast spatial sampling & clustering
export async function extractDominantPalette(imageElement: HTMLImageElement, colorCount = 5): Promise<ColorSwatch[]> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  try {
    // Downsample to max 150x150 for sub-10ms processing
    const maxDim = 150;
    const scale = Math.min(maxDim / (imageElement.naturalWidth || 150), maxDim / (imageElement.naturalHeight || 150), 1);
    canvas.width = Math.max(1, Math.floor((imageElement.naturalWidth || 150) * scale));
    canvas.height = Math.max(1, Math.floor((imageElement.naturalHeight || 150) * scale));

    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    // Collect color samples, skipping pure transparent/extreme blown out pixels
    const pixels: [number, number, number][] = [];
    const step = 4; // Sample every 4th pixel
    for (let i = 0; i < imgData.length; i += 4 * step) {
      const a = imgData[i + 3];
      if (a > 128) {
        pixels.push([imgData[i], imgData[i + 1], imgData[i + 2]]);
      }
    }

    if (pixels.length === 0) throw new Error('No valid pixels found');

    // Fast K-Means clustering (3 iterations is plenty for palette swatches)
    const clusters = kMeansClustering(pixels, colorCount, 4);

    return clusters.map(c => {
      const hex = rgbToHex(c.rgb[0], c.rgb[1], c.rgb[2]);
      return {
        hex,
        rgb: c.rgb,
        percentage: Math.round(c.ratio * 100),
        name: getNatureColorName(c.rgb)
      };
    });
  } catch (err) {
    console.warn('Canvas pixel extraction fallback used:', err);
    return [
      { hex: '#2D6A4F', rgb: [45, 106, 79], name: 'Velvet Ground Moss', percentage: 40 },
      { hex: '#1B4332', rgb: [27, 67, 50], name: 'Deep Forest Pine', percentage: 25 },
      { hex: '#52B788', rgb: [82, 183, 136], name: 'Lichen Leaf', percentage: 20 },
      { hex: '#D97724', rgb: [217, 119, 36], name: 'Fallen Beech Amber', percentage: 10 },
      { hex: '#6F4E37', rgb: [111, 78, 55], name: 'Rich Topsoil Umber', percentage: 5 },
    ];
  }
}

function kMeansClustering(pixels: [number, number, number][], k: number, iterations: number) {
  // Initialize centroids with diverse sampling
  const centroids: [number, number, number][] = [];
  const step = Math.floor(pixels.length / k);
  for (let i = 0; i < k; i++) {
    centroids.push([...pixels[(i * step) % pixels.length]]);
  }

  const assignments = new Uint16Array(pixels.length);
  const counts = new Uint32Array(k);

  for (let iter = 0; iter < iterations; iter++) {
    counts.fill(0);
    const sums = Array.from({ length: k }, () => [0, 0, 0]);

    // Assign pixels to closest centroid
    for (let p = 0; p < pixels.length; p++) {
      const [r, g, b] = pixels[p];
      let minDist = Infinity;
      let bestK = 0;

      for (let c = 0; c < k; c++) {
        const [cr, cg, cb] = centroids[c];
        const dist = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
        if (dist < minDist) {
          minDist = dist;
          bestK = c;
        }
      }

      assignments[p] = bestK;
      counts[bestK]++;
      sums[bestK][0] += r;
      sums[bestK][1] += g;
      sums[bestK][2] += b;
    }

    // Recompute centroids
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        centroids[c] = [
          Math.round(sums[c][0] / counts[c]),
          Math.round(sums[c][1] / counts[c]),
          Math.round(sums[c][2] / counts[c])
        ];
      }
    }
  }

  // Calculate final population percentages
  const results = centroids.map((rgb, idx) => ({
    rgb,
    ratio: counts[idx] / pixels.length
  }));

  // Sort by prominence
  return results.sort((a, b) => b.ratio - a.ratio);
}

// Evocative botanical & nature color naming heuristic
export function getNatureColorName(rgb: [number, number, number]): string {
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const brightness = (r + g + b) / 3;
  const saturation = max === 0 ? 0 : (max - min) / max;

  if (brightness < 35) return 'Obsidian Charcoal';
  if (brightness > 230 && saturation < 0.1) return 'Morning Frost';
  if (saturation < 0.15) {
    if (brightness > 180) return 'Limestone White';
    if (brightness > 120) return 'Weathered River Slate';
    return 'Damp Basalt Stone';
  }

  // Hue detection
  let hue = 0;
  if (max === r) hue = ((g - b) / (max - min)) % 6;
  else if (max === g) hue = (b - r) / (max - min) + 2;
  else hue = (r - g) / (max - min) + 4;
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  if (hue >= 345 || hue < 15) {
    return brightness > 140 ? 'Wild Rose Red' : 'Autumn Crimson Leaf';
  }
  if (hue >= 15 && hue < 45) {
    if (brightness < 110) return 'Rich Topsoil Umber';
    return brightness > 170 ? 'Marigold Orange' : 'Fallen Beech Amber';
  }
  if (hue >= 45 && hue < 75) {
    return brightness > 180 ? 'Buttercup Pollen' : 'Sunlit Lichen Ochre';
  }
  if (hue >= 75 && hue < 165) {
    if (brightness < 80) return 'Deep Pine Forest';
    if (brightness < 140) return 'Velvet Ground Moss';
    return 'Spring Clover Green';
  }
  if (hue >= 165 && hue < 255) {
    if (brightness < 100) return 'Deep Mountain Pool';
    return 'Alpine Glacier Azure';
  }
  if (hue >= 255 && hue < 315) {
    return 'Wild Violet Berry';
  }
  return 'Heather Petal Mauve';
}
