'use client';

import React, { useState } from 'react';
import { SpecimenEntry, PlayerStats } from '@/types';
import { FieldPlate } from './FieldPlate';
import { sounds } from '@/lib/soundEffects';
import { Sparkles, Plus, BookOpen, Trophy } from 'lucide-react';

interface FieldLibraryProps {
  entries: SpecimenEntry[];
  playerStats?: PlayerStats;
  onStartNewQuest: () => void;
  onDeleteEntry: (id: string) => void;
}

export function FieldLibrary({
  entries,
  playerStats,
  onStartNewQuest,
  onDeleteEntry,
}: FieldLibraryProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [filterHighAccuracy, setFilterHighAccuracy] = useState(false);

  const avgMatch = entries.length > 0
    ? Math.round(entries.reduce((acc, curr) => acc + curr.matchScore, 0) / entries.length)
    : 0;

  const filteredEntries = entries.filter((entry) => {
    if (filterHighAccuracy && entry.matchScore < 85) return false;
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      const matchTitle = entry.questTitle.toLowerCase().includes(q);
      const matchLoc = entry.locationName.toLowerCase().includes(q);
      const matchHex = entry.targetColor.hex.toLowerCase().includes(q) || entry.matchedColor.hex.toLowerCase().includes(q);
      return matchTitle || matchLoc || matchHex;
    }
    return true;
  });

  return (
    <div className="cw-container" style={{ padding: '28px 20px 60px' }}>
      {/* Catalogue Header */}
      <div className="cw-card" style={{
        marginBottom: 24,
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        border: '1px solid var(--border-default)',
        background: 'linear-gradient(180deg, var(--bg-1) 0%, var(--bg-2) 100%)',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="cw-badge cw-badge-accent">
              Your journal
            </span>
            {playerStats && (
              <span className="cw-badge cw-badge-info">
                Lv.{playerStats.level} &bull; {playerStats.rankTitle}
              </span>
            )}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text-primary)', marginBottom: 3 }}>
            Field journal
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
            The colors, sketches, and places you’ve collected.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <span className="cw-label" style={{ fontSize: '0.65rem', display: 'block' }}>Field notes</span>
              <span className="cw-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{entries.length}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="cw-label" style={{ fontSize: '0.65rem', display: 'block' }}>Avg. match</span>
              <span className="cw-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>{avgMatch}%</span>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playPop();
              onStartNewQuest();
            }}
            className="cw-btn cw-btn-primary cw-btn-md"
          >
            <Plus size={15} />
            <span>New color walk</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (if has entries) */}
      {entries.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 360 }}>
            <input
              type="text"
              placeholder="Search by title, location, or #HEX..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="cw-input"
              style={{ fontSize: '0.82rem', padding: '7px 12px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                sounds.playPop();
                setFilterHighAccuracy(!filterHighAccuracy);
              }}
              className={`cw-btn cw-btn-sm ${filterHighAccuracy ? 'cw-btn-active' : 'cw-btn-secondary'}`}
            >
              <Trophy size={12} />
              <span>85%+ Accuracy Only</span>
            </button>
          </div>
        </div>
      )}

      {/* Entries List or Empty State */}
      {entries.length === 0 ? (
        <div className="cw-card" style={{
          textAlign: 'center',
          padding: '64px 20px',
          maxWidth: 520,
          margin: '0 auto',
          border: '1px solid var(--border-default)',
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-muted)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: 'var(--accent-glow)',
          }}>
            <BookOpen size={24} />
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Your journal starts outside.
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.5 }}>
            Take a color walk, find a match, and make your first field note.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                sounds.playPop();
                onStartNewQuest();
              }}
              className="cw-btn cw-btn-primary cw-btn-md"
            >
              <Sparkles size={15} />
              <span>Start a color walk</span>
            </button>
          </div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="cw-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
          <p>No plates matched your filter criteria.</p>
          <button
            onClick={() => {
              setFilterQuery('');
              setFilterHighAccuracy(false);
            }}
            className="cw-btn cw-btn-secondary cw-btn-sm"
            style={{ marginTop: 12 }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {filteredEntries.map((entry) => (
            <FieldPlate
              key={entry.id}
              entry={entry}
              onDelete={onDeleteEntry}
            />
          ))}
        </div>
      )}
    </div>
  );
}
