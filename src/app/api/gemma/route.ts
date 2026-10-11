import { NextRequest, NextResponse } from 'next/server';
import { getLocalNaturalistLore } from '@/lib/naturalistLore';
import { Quest } from '@/types';

export const maxDuration = 60; // Allow sufficient time for local LLM inference

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      colorName,
      hex,
      rgb,
      targetColor,
      matchedColor,
      palette,
      deltaE,
      matchScore,
      userNotes,
      customApiKey,
      customProvider,
      customOllamaUrl
    } = body;

    const configuredOllamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

    // -------------------------------------------------------------
    // ACTION: Generate a fresh outdoor color quest with the configured LLM.
    // -------------------------------------------------------------
    if (action === 'generate_quest') {
      const customBase = typeof customOllamaUrl === 'string' ? customOllamaUrl.trim() : '';
      let ollamaUrl = configuredOllamaUrl;
      if (customBase) {
        try {
          const parsedUrl = new URL(customBase);
          if (
            !['http:', 'https:'].includes(parsedUrl.protocol) ||
            !['localhost', '127.0.0.1', '[::1]', '::1'].includes(parsedUrl.hostname) ||
            parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash
          ) {
            return NextResponse.json({ error: 'Ollama must use a local address.' }, { status: 400 });
          }
          ollamaUrl = parsedUrl.toString().replace(/\/$/, '');
        } catch {
          return NextResponse.json({ error: 'Enter a valid local Ollama URL in Settings.' }, { status: 400 });
        }
      }

      const variationSeed = Math.floor(Math.random() * 2_147_483_647);
      const categories = ['plants', 'animals', 'water', 'sky', 'architecture', 'street', 'transit', 'public art', 'playgrounds', 'outdoor objects', 'sports', 'food', 'other'] as const;
      const prompt = `<start_of_turn>user
Create one original color-finding prompt for accessible public or everyday outdoor spaces. Invent the color and a specific, recognizable real-world subject from scratch; don't use a preset color list or default to green plants. Vary the setting and subject: public parks, sidewalks, street fixtures, building materials, transit, playgrounds, sports areas, outdoor objects, public art, food stalls, water, sky, animals, and plants are all possible. Don't assume wilderness, a forest, or a private garden. Choose something safe to observe without touching, picking, trespassing, or approaching traffic.
The title, color name, category, and outdoor hint must all describe the same subject. Use a familiar object or material instead of made-up terminology, and make its named color and hex agree. Choose exactly one category that best fits the subject from: ${categories.join(', ')}.
Return valid JSON only with these string fields: title, colorName, targetHex, category, outdoorHint, audioPrompt, season. targetHex must be exactly six hex digits prefixed by #. Keep title under 60 characters, colorName under 40, outdoorHint to one practical sentence naming where to look, audioPrompt to one short spoken sentence, and season to a real season or All year. Use variation seed ${variationSeed} to make this a fresh choice.
<end_of_turn>
<start_of_turn>model
`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
      let ollamaRes: Response;
      try {
        ollamaRes = await fetch(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: process.env.OLLAMA_MODEL || 'gemma2:2b',
            prompt,
            stream: false,
            format: 'json',
            options: { num_predict: 256, temperature: 0.9, top_p: 0.95, seed: variationSeed },
          }),
          signal: controller.signal,
        });
      } catch (error) {
        const timedOut = error instanceof Error && error.name === 'AbortError';
        return NextResponse.json({
          error: timedOut
            ? 'Color generation timed out. Try again or check that Ollama is ready.'
            : 'Could not reach Ollama. Start Ollama and make sure the configured model is installed.',
        }, { status: timedOut ? 504 : 503 });
      } finally {
        clearTimeout(timeout);
      }

      if (!ollamaRes.ok) {
        return NextResponse.json({ error: `Ollama returned ${ollamaRes.status}. Check the model in Settings and try again.` }, { status: 502 });
      }

      try {
        const data = await ollamaRes.json();
        const generated = JSON.parse(data.response || '{}') as Record<string, unknown>;
        const requiredText = ['title', 'colorName', 'outdoorHint', 'audioPrompt', 'season'];
        if (requiredText.some((key) => typeof generated[key] !== 'string' || !(generated[key] as string).trim())) {
          throw new Error('The model returned incomplete prompt fields.');
        }
        const hex = typeof generated.targetHex === 'string' ? generated.targetHex.trim() : '';
        if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error('The model returned an invalid color.');
        const targetRgb: [number, number, number] = [
          Number.parseInt(hex.slice(1, 3), 16),
          Number.parseInt(hex.slice(3, 5), 16),
          Number.parseInt(hex.slice(5, 7), 16),
        ];
        const category = categories.find((item) => item === generated.category) || 'other';
        const quest: Quest = {
          id: `quest-${crypto.randomUUID()}`,
          title: (generated.title as string).trim().slice(0, 60),
          colorName: (generated.colorName as string).trim().slice(0, 40),
          targetHex: hex.toUpperCase(),
          targetRgb,
          category,
          difficulty: 'medium',
          outdoorHint: (generated.outdoorHint as string).trim().slice(0, 240),
          audioPrompt: (generated.audioPrompt as string).trim().slice(0, 180),
          season: (generated.season as string).trim().slice(0, 32),
          generatedBy: process.env.OLLAMA_MODEL || 'Gemma 2 (Local Ollama)',
        };
        return NextResponse.json({ quest, provider: `ollama-${process.env.OLLAMA_MODEL || 'gemma2:2b'}` });
      } catch (error) {
        console.warn('Ollama returned an invalid color quest:', error);
        return NextResponse.json({ error: 'The model returned an incomplete color prompt. Try generating another.' }, { status: 502 });
      }
    }

    // -------------------------------------------------------------
    // ACTION: Evaluate an outdoor color match and write field notes.
    // -------------------------------------------------------------
    const ollamaUrl = configuredOllamaUrl;
    const targetHexVal = targetColor?.hex || hex || '#2D6A4F';
    const targetNameVal = targetColor?.name || 'Target Specimen';
    const extractedHexVal = matchedColor?.hex || hex || '#2D6A4F';
    const extractedNameVal = matchedColor?.name || colorName || 'Natural Specimen';
    const scoreVal = typeof matchScore === 'number' ? matchScore : 85;
    const deltaEVal = typeof deltaE === 'number' ? deltaE : 5.0;
    const rgbArray: [number, number, number] = rgb || matchedColor?.rgb || [100, 100, 100];

    const paletteStr = Array.isArray(palette)
      ? palette.map(p => `${p.hex} (${p.percentage || 0}%)`).join(', ')
      : extractedHexVal;

    const leanEvaluationPrompt = `You are an outdoor color observer and field-note editor.
Target: "${targetNameVal}" (${targetHexVal}).
Outdoor subject: "${extractedNameVal}" (${extractedHexVal}), CIE76 Delta-E: ${deltaEVal.toFixed(1)}, Match: ${scoreVal}%.
5-Swatch Palette: ${paletteStr}.
User notes: "${userNotes || 'Observed outdoors'}". The subject may be a plant, animal, sky, water, building, street fixture, vehicle, public art, or any other object outside.

Evaluate the color match and give accurate, concise observations. Never invent species, Latin names, or biological pigments for inanimate subjects. Return raw JSON only:
{
  "commonName": "short name for the subject or material",
  "latinName": "include only if the subject is clearly an identifiable living species; otherwise omit or use an empty string",
  "matchVerdict": "CLOSE MATCH or FIELD VARIATION",
  "matchCritique": "2 sentences explaining how light, wear, shade, distance, or material affects this color match",
  "paletteHarmony": "1 sentence on how the surrounding colors work together",
  "pigmentLore": "2 sentences about the visible color, surface, pigment, or reflected light; avoid biology unless relevant",
  "sketchingAdvice": "2 sentences of tactile instructions for drawing this in a PHYSICAL paper notebook (pencils, shading, watercolors)",
  "suggestedTags": ["#fieldnotes", "#colorstudy", "#outside"]
}`;

    // 1. Try Groq if key provided
    const groqKey = customApiKey || process.env.GROQ_API_KEY;
    if (groqKey && (customProvider === 'groq' || !customProvider)) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: 'gemma2-9b-it',
            messages: [{ role: 'user', content: leanEvaluationPrompt }],
            response_format: { type: 'json_object' },
            temperature: 0.4,
          })
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            return NextResponse.json({ ...parsed, provider: 'groq-gemma2-9b-it' });
          }
        }
      } catch (e) {
        console.warn('Groq Gemma call failed:', e);
      }
    }

    // 2. Try Local Ollama (gemma2:2b) with 45s timeout and num_predict limit
    try {
      const ollamaController = new AbortController();
      const timeout = setTimeout(() => ollamaController.abort(), 45000);

      const prompt = `<start_of_turn>user\n${leanEvaluationPrompt}<end_of_turn>\n<start_of_turn>model\n`;

      const ollamaRes = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma2:2b',
          prompt,
          stream: false,
          format: 'json',
          options: {
            num_predict: 140,
            temperature: 0.4,
          }
        }),
        signal: ollamaController.signal
      });
      clearTimeout(timeout);

      if (ollamaRes.ok) {
        const data = await ollamaRes.json();
        if (data.response) {
          const parsed = JSON.parse(data.response);
          return NextResponse.json({ ...parsed, provider: 'gemma2:2b (Local Ollama)' });
        }
      }
    } catch {
      // Fallback cleanly
    }

    // 3. Fallback to built-in naturalist engine
    const fallback = getLocalNaturalistLore(
      extractedNameVal,
      extractedHexVal,
      rgbArray,
      scoreVal,
      deltaEVal,
      targetNameVal
    );

    return NextResponse.json({
      ...fallback,
      provider: 'built-in-gemma-naturalist-engine'
    });

  } catch (error) {
    console.error('Gemma API route error:', error);
    return NextResponse.json({
      error: 'Failed to process naturalist lore',
      fallback: getLocalNaturalistLore('Nature', '#2D6A4F', [45, 106, 79])
    }, { status: 500 });
  }
}
