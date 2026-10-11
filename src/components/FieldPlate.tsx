'use client';

import React, { useState } from 'react';
import { SpecimenEntry } from '@/types';
import { Calendar, MapPin, Copy, Check, Trash2 } from 'lucide-react';

interface FieldPlateProps {
  entry: SpecimenEntry;
  onDelete?: (id: string) => void;
}

export function FieldPlate({ entry, onDelete }: FieldPlateProps) {
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleCopyDevMarkdown = () => {
    const md = `
## ${entry.questTitle}
**Color:** \`${entry.targetColor.hex}\` → \`${entry.matchedColor.hex}\` (${entry.matchScore}% match)
**Place:** ${entry.locationName} | **Date:** ${formattedDate}

**Color notes:**
${entry.botanicalLore || 'Natural pigment observation.'}

**Field notes:**
*${entry.notes}*

Palette: ${entry.palette.map((p) => `\`${p.hex}\``).join(' ')}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="cw-card" style={{ maxWidth: 840, margin: '20px auto', padding: '24px' }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: 14,
        marginBottom: 18,
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            {entry.questTitle}
          </h3>
          <span className="cw-badge cw-badge-success">
            {entry.matchScore}% match
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={12} /> {formattedDate}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} /> {entry.locationName}
          </span>
        </div>
      </div>

      {/* 2-Column Showcase */}
      <div className="cw-grid-2" style={{ gap: 20, marginBottom: 18 }}>
        {/* Left: Specimen Photo & Palette */}
        <div>
          <div style={{
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
            height: 220,
            marginBottom: 10,
            backgroundColor: '#000',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.specimenPhotoUrl}
              alt="Outdoor Specimen"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>

          {/* Palette row */}
          <div style={{ display: 'flex', gap: 6 }}>
            {entry.palette.map((swatch, idx) => (
              <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  height: 20,
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: swatch.hex,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: 2,
                }} />
                <span className="cw-mono" style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                  {swatch.hex}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Paper Sketch & Notes */}
        <div>
          {entry.paperSketchPhotoUrl && (
            <div style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
              height: 220,
              marginBottom: 10,
              backgroundColor: '#000',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.paperSketchPhotoUrl}
                alt="Paper Sketch"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}

          <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontStyle: 'italic', marginBottom: 10, lineHeight: 1.45 }}>
            &ldquo;{entry.notes}&rdquo;
          </p>

          {entry.botanicalLore && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              <strong style={{ color: 'var(--accent)' }}>Color notes:</strong> {entry.botanicalLore}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <button
          onClick={handleCopyDevMarkdown}
          className="cw-btn cw-btn-secondary cw-btn-sm"
        >
          {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy field note'}</span>
        </button>

        {onDelete && (
          <button
            onClick={() => onDelete(entry.id)}
            className="cw-btn cw-btn-ghost cw-btn-sm"
            style={{ color: 'var(--text-disabled)', fontSize: '0.75rem' }}
          >
            <Trash2 size={12} />
            <span>Remove</span>
          </button>
        )}
      </div>
    </div>
  );
}
