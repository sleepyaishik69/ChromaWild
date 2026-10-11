'use client';

import React, { useState } from 'react';
import { Quest } from '@/types';
import { AudioPlayer } from './AudioPlayer';
import { sounds } from '@/lib/soundEffects';
import { ArrowRight, MapPin, Sparkles, Loader2, Camera, ArrowLeft } from 'lucide-react';

interface QuestCardProps {
  quest: Quest;
  onGemmaGenerateQuest?: (newQuest: Quest) => void;
  onStartMatch: () => void;
  onBackToStart?: () => void;
}

export function QuestCard({
  quest,
  onGemmaGenerateQuest,
  onStartMatch,
  onBackToStart,
}: QuestCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  const handleGenerateAIQuest = async () => {
    sounds.playPop();
    setIsGenerating(true);
    setGenerationError('');
    sounds.playGemmaConnect();
    try {
      const res = await fetch('/api/gemma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_quest',
          customOllamaUrl: localStorage.getItem('chromawild_ollama_url') || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate a new color. Try again.');
      if (!data.quest) throw new Error('The model returned no color prompt. Try again.');
      if (onGemmaGenerateQuest) {
        sounds.playGameStart();
        onGemmaGenerateQuest(data.quest);
      }
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Could not generate a new color. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="cw-card" style={{
      maxWidth: 680,
      margin: '28px auto',
      padding: '28px 24px',
      position: 'relative',
      border: '1px solid var(--border-default)',
      boxShadow: 'var(--shadow-md)',
    }}>
      {/* Step Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="cw-badge cw-badge-accent">
            Your color
          </span>
          <span className="cw-badge cw-badge-muted">
            {quest.category}
          </span>
          {quest.season && (
            <span className="cw-badge cw-badge-info">
              {quest.season}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={handleGenerateAIQuest}
            disabled={isGenerating}
            className="cw-btn cw-btn-secondary cw-btn-sm"
            title="Ask the model for a new outdoor color"
          >
            {isGenerating ? (
              <Loader2 size={13} className="cw-spin" />
            ) : (
              <Sparkles size={13} color="var(--accent)" />
            )}
            <span>Ask for another color</span>
          </button>
        </div>
      </div>

      {generationError && <p role="alert" style={{ color: 'var(--danger, #d65b4a)', margin: '0 0 16px', fontSize: '0.85rem' }}>{generationError}</p>}

      {/* Target Colorimeter Display */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '12px 0 24px',
      }}>
        {/* Precision Color Disc */}
        <div style={{
          position: 'relative',
          width: 140,
          height: 140,
          borderRadius: '50%',
          backgroundColor: quest.targetHex,
          border: '4px solid var(--bg-1)',
          boxShadow: `0 0 0 1px var(--border-default), 0 12px 40px ${quest.targetHex}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 18,
          transition: 'all 0.3s ease',
        }}>
          {/* Hex badge */}
          <span className="cw-mono" style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#ffffff',
            backgroundColor: 'rgba(7, 8, 10, 0.78)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}>
            {quest.targetHex}
          </span>
        </div>

        <h2 className="cw-h2" style={{ fontSize: '1.5rem', marginBottom: 4 }}>
          {quest.colorName}
        </h2>

        <p style={{
          fontSize: '0.92rem',
          color: 'var(--text-secondary)',
          maxWidth: 480,
          marginBottom: 12,
        }}>
          {quest.title}
        </p>

        {/* Tabular Coordinates Strip */}
        <div style={{
          display: 'inline-flex',
          gap: 12,
          padding: '5px 14px',
          background: 'var(--bg-2)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
        }}>
          <span>{quest.category}</span>
          <span>&bull;</span>
          <span>{quest.difficulty} walk</span>
        </div>
      </div>

      {/* Outdoor Clue Card */}
      <div style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        <MapPin size={18} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          <span className="cw-label" style={{ marginBottom: 4, color: 'var(--accent)' }}>
            Where to look
          </span>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {quest.outdoorHint}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingTop: 16,
        borderTop: '1px solid var(--border-subtle)',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onBackToStart && (
            <button
              onClick={() => {
                sounds.playPop();
                onBackToStart();
              }}
              className="cw-btn cw-btn-ghost cw-btn-sm"
            >
              <ArrowLeft size={13} />
            <span>Back</span>
            </button>
          )}
          <AudioPlayer text={quest.audioPrompt} label="Field Voice Cue" />
        </div>

        <button
          onClick={() => {
            sounds.playPop();
            onStartMatch();
          }}
          className="cw-btn cw-btn-primary cw-btn-md"
        >
          <Camera size={16} />
          <span>Find this color</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
