'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Loader2, Sparkles } from 'lucide-react';

interface AudioPlayerProps {
  text: string;
  label?: string;
}

export function AudioPlayer({ text, label = 'Audio Prompt' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioSource, setAudioSource] = useState<'elevenlabs' | 'browser' | null>(null);

  const handleToggleSpeak = async () => {
    if (isPlaying) {
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      const savedKey = typeof window !== 'undefined'
        ? localStorage.getItem('chromawild_elevenlabs_key')
        : null;

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          customApiKey: savedKey || undefined
        }),
      });

      const contentType = res.headers.get('content-type');

      if (res.ok && contentType && contentType.includes('audio')) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        setIsLoading(false);
        setIsPlaying(true);
        setAudioSource('elevenlabs');

        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setIsPlaying(false);
          fallbackBrowserSpeech();
        };

        await audio.play();
        return;
      }

      setIsLoading(false);
      fallbackBrowserSpeech();
    } catch {
      setIsLoading(false);
      fallbackBrowserSpeech();
    }
  };

  const fallbackBrowserSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setAudioSource('browser');
    };
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="cw-audio-container">
      <button
        onClick={handleToggleSpeak}
        disabled={isLoading}
        className={`cw-btn cw-btn-secondary cw-btn-sm ${isPlaying ? 'cw-btn-active' : ''}`}
        title="Listen to hands-free outdoor voice cue"
      >
        {isLoading ? (
          <Loader2 size={13} className="cw-spin" />
        ) : isPlaying ? (
          <VolumeX size={13} color="var(--accent)" />
        ) : (
          <Volume2 size={13} />
        )}
        <span>{isPlaying ? 'Mute' : label}</span>
      </button>

      {audioSource === 'elevenlabs' && isPlaying && (
        <span className="cw-badge cw-badge-accent" title="Streaming from ElevenLabs Neural Voice">
          <Sparkles size={10} />
          ElevenLabs
        </span>
      )}
    </div>
  );
}
