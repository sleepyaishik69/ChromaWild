import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voiceId, customApiKey } = body;

    const apiKey = customApiKey || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      // Graceful signal to the frontend to use Web Speech API in browser
      return NextResponse.json({
        useBrowserSpeech: true,
        message: 'No ELEVENLABS_API_KEY provided; falling back to browser speech synthesis.'
      });
    }

    // Default to a calming, warm naturalist voice (Rachel)
    const targetVoice = voiceId || '21m00Tcm4TlvDq8ikWAM';

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoice}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.65,
          similarity_boost: 0.8,
          style: 0.1,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('ElevenLabs API response not OK:', errText);
      return NextResponse.json({ useBrowserSpeech: true, error: errText });
    }

    const audioArrayBuffer = await response.arrayBuffer();

    return new Response(audioArrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      'Cache-Control': 'private, no-store',
        'X-Audio-Provider': 'elevenlabs',
      },
    });
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    return NextResponse.json({ useBrowserSpeech: true }, { status: 200 });
  }
}
