'use client';

import React, { useEffect, useRef } from 'react';
import { SpecimenEntry, Badge, PlayerStats } from '@/types';
import confetti from 'canvas-confetti';
import { sounds } from '@/lib/soundEffects';
import { Sparkles, Leaf, BookOpen } from 'lucide-react';

interface QuestCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: SpecimenEntry;
  xpAwarded: number;
  leveledUp: boolean;
  newBadges: Badge[];
  playerStats: PlayerStats;
  onGoToLibrary: () => void;
  onStartAnotherQuest: () => void;
}

export function QuestCompleteModal({
  isOpen,
  onClose,
  entry,
  xpAwarded,
  leveledUp,
  newBadges,
  playerStats,
  onGoToLibrary,
  onStartAnotherQuest,
}: QuestCompleteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      sounds.playQuestComplete();
      // Victory confetti burst
      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.5 },
        colors: [entry.targetColor.hex, entry.matchedColor.hex, '#ff7849', '#22c55e']
      });
    }
  }, [isOpen, entry]);

  if (!isOpen) return null;

  return (
    <dialog ref={dialogRef} className="app-dialog" aria-labelledby="completion-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === dialogRef.current) onClose(); }}>
      <div className="cw-card" style={{
        maxWidth: 520,
        width: '100%',
        padding: '28px 24px',
        textAlign: 'center',
        background: 'var(--bg-1)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
      }}>
        {/* Animated Trophy Icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--accent)',
          color: '#07080a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: 'var(--accent-glow)',
        }}>
          <Leaf size={30} />
        </div>

        <span className="cw-badge cw-badge-accent" style={{ marginBottom: 8 }}>
          Field note saved
        </span>

        <h2 className="cw-h2" id="completion-title" style={{ fontSize: '1.65rem', marginBottom: 4 }}>
          A color worth remembering.
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
          {entry.questTitle} is now in your field journal.
        </p>

        {/* Rewards Box */}
        <div style={{
          background: 'var(--bg-1)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}>
          <div>
            <span className="cw-label" style={{ fontSize: '0.65rem', display: 'block', marginBottom: 2 }}>
              Color match
            </span>
            <span className="cw-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
              {entry.matchScore}%
            </span>
          </div>

          <div style={{ width: 1, height: 32, background: 'var(--border-subtle)' }} />

          <div>
            <span className="cw-label" style={{ fontSize: '0.65rem', display: 'block', marginBottom: 2 }}>
              Points earned
            </span>
            <span className="cw-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>
              +{xpAwarded} XP
            </span>
          </div>

          <div style={{ width: 1, height: 32, background: 'var(--border-subtle)' }} />

          <div>
            <span className="cw-label" style={{ fontSize: '0.65rem', display: 'block', marginBottom: 2 }}>
              Naturalist level
            </span>
            <span className="cw-mono" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Lv.{playerStats.level}
            </span>
          </div>
        </div>

        {/* Level up announcement */}
        {leveledUp && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            marginBottom: 16,
            color: 'var(--success)',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}>
            <Sparkles size={16} />
            <span>Level up — you’re now a {playerStats.rankTitle}.</span>
          </div>
        )}

        {/* Newly Unlocked Badges */}
        {newBadges.length > 0 && (
          <div style={{
            background: 'rgba(255, 120, 73, 0.08)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            marginBottom: 20,
            textAlign: 'left',
          }}>
            <span className="cw-label" style={{ color: 'var(--accent)', marginBottom: 6 }}>
              New badges
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {newBadges.map((badge) => (
                <div key={badge.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>{badge.icon}</span>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{badge.title}</strong>
                    <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>{badge.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              onClose();
              onGoToLibrary();
            }}
            className="cw-btn cw-btn-primary cw-btn-md"
            style={{ flex: 1, minWidth: 160 }}
          >
            <BookOpen size={15} />
            <span>Open journal</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onStartAnotherQuest();
            }}
            className="cw-btn cw-btn-secondary cw-btn-md"
            style={{ flex: 1, minWidth: 160 }}
          >
            <Sparkles size={15} />
            <span>Find another color</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
