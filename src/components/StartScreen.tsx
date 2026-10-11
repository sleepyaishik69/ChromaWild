'use client';

import React, { useState } from 'react';
import { Quest, PlayerStats } from '@/types';
import { sounds } from '@/lib/soundEffects';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';

interface StartScreenProps {
  playerStats: PlayerStats;
  entriesCount: number;
  onStartQuest: (generatedQuest: Quest) => void;
  onOpenLibrary: () => void;
}

export function StartScreen({ playerStats, entriesCount, onStartQuest, onOpenLibrary }: StartScreenProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [generationError, setGenerationError] = useState('');

  const handleStart = async () => {
    if (isConnecting) return;
    sounds.playPop();
    setIsConnecting(true);
    setGenerationError('');
    sounds.playGemmaConnect();
    try {
      const response = await fetch('/api/gemma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_quest',
          customOllamaUrl: localStorage.getItem('chromawild_ollama_url') || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not generate a field prompt. Try again.');
      if (!data.quest) throw new Error('No field prompt returned');
      sounds.playGameStart();
      onStartQuest(data.quest);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Could not generate a color prompt. Try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="cw-container start-screen">
      <section className="start-hero" aria-labelledby="home-title">
        <div className="start-hero__copy">
          <span className="cw-kicker">A field journal for curious eyes</span>
          <h1 className="cw-h1" id="home-title">Find the colors hidden in <em>plain sight.</em></h1>
          <p className="cw-subtitle">
            Get a fresh color prompt, find it somewhere outside, and save what you notice.
          </p>
          <div className="start-hero__actions">
            {isConnecting ? (
              <div className="cw-card start-loading" role="status" aria-live="polite">
                <div className="cw-hstack"><Loader2 size={17} className="cw-spin" /><span>Finding your first color…</span></div>
              </div>
            ) : (
              <button onClick={handleStart} className="cw-btn cw-btn-primary cw-btn-lg">
                Start a color walk <ArrowRight size={17} />
              </button>
            )}
            <button onClick={() => { sounds.playPop(); onOpenLibrary(); }} className="cw-btn cw-btn-secondary cw-btn-lg">
              <BookOpen size={17} /> Open journal
            </button>
          </div>
          {generationError && <p className="start-error" role="alert">{generationError}</p>}
          <div className="start-hero__meta" aria-label="Journal progress">
            <div><strong>{entriesCount}</strong> field notes</div>
            <div><strong>{playerStats.questsCompleted}</strong> colors found</div>
            <div><strong>Level {playerStats.level}</strong> naturalist</div>
          </div>
        </div>

        <div className="start-art" aria-label="A city park in daylight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="start-art__image" src="https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=85" alt="A public park with trees and a walking path" />
          <div className="start-art__note">
            <div><small>Look beyond the walls</small><strong>Outside, in color</strong></div>
          </div>
        </div>
      </section>

      <section className="start-steps" aria-labelledby="how-title">
        <div className="start-steps__head">
          <div><span className="cw-kicker">A simple ritual</span><h2 className="cw-h2" id="how-title">Look, find, remember.</h2></div>
        </div>
        <div className="start-steps__grid">
          <article className="start-step"><span className="start-step__number">01</span><div><h3>Choose a color</h3><p>Get a field prompt and a place to start looking.</p></div></article>
          <article className="start-step"><span className="start-step__number">02</span><div><h3>Find it outside</h3><p>Photograph an outdoor match and compare its colors.</p></div></article>
          <article className="start-step"><span className="start-step__number">03</span><div><h3>Keep a field note</h3><p>Sketch what you found and add it to your journal.</p></div></article>
        </div>
      </section>
    </div>
  );
}
