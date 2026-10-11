'use client';

import React, { useState, useRef } from 'react';
import { ColorSwatch, GemmaAnalysisResponse, SpecimenEntry } from '@/types';
import { Camera, Upload, BookOpen, Check, PenTool, ArrowLeft, Palette } from 'lucide-react';
import { generateProceduralNotebookSketchSample } from '@/lib/sampleImages';
import { LiveCameraModal } from './LiveCameraModal';
import { SketchCanvas } from './SketchCanvas';
import { sounds } from '@/lib/soundEffects';

interface PaperSketchUploaderProps {
  questTitle: string;
  targetColor: ColorSwatch;
  matchedColor: ColorSwatch;
  palette: ColorSwatch[];
  matchScore: number;
  deltaE: number;
  specimenPhotoUrl: string;
  botanicalLore: GemmaAnalysisResponse;
  onEntryComplete: (entry: SpecimenEntry) => void;
  onBackToMatch: () => void;
}

export function PaperSketchUploader({
  questTitle,
  targetColor,
  matchedColor,
  palette,
  matchScore,
  deltaE,
  specimenPhotoUrl,
  botanicalLore,
  onEntryComplete,
  onBackToMatch,
}: PaperSketchUploaderProps) {
  const [sketchPhotoUrl, setSketchPhotoUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [inputMode, setInputMode] = useState<'draw' | 'upload'>('draw');
  const [locationName, setLocationName] = useState('');
  const [weatherCondition, setWeatherCondition] = useState('');
  const [userNotes, setUserNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sounds.playCameraSnap();
      const reader = new FileReader();
      reader.onload = (event) => {
        setSketchPhotoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!sketchPhotoUrl) return;
    sounds.playPop();

    const newEntry: SpecimenEntry = {
      id: `entry-${Date.now()}`,
      createdAt: new Date().toISOString(),
      questTitle,
      targetColor,
      matchedColor,
      palette,
      matchScore,
      deltaE,
      specimenPhotoUrl,
      paperSketchPhotoUrl: sketchPhotoUrl,
      locationName,
      weatherCondition,
      notes: userNotes,
      botanicalLore: `${botanicalLore.latinName ? `[${botanicalLore.latinName}] ` : ''}${botanicalLore.pigmentLore}`,
      sketchingPrompt: botanicalLore.sketchingAdvice,
      matchVerdict: botanicalLore.matchVerdict,
      matchCritique: botanicalLore.matchCritique,
    };

    onEntryComplete(newEntry);
  };

  return (
    <div className="cw-card" style={{ maxWidth: 880, margin: '28px auto', padding: '24px', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-md)' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="cw-badge cw-badge-info">Field sketch</span>
          <span className="cw-badge cw-badge-accent">
            Match: {matchScore}%
          </span>
        </div>
        <h2 className="cw-h2" style={{ marginBottom: 4 }}>
          Add a sketch
        </h2>
        <p className="cw-subtitle" style={{ fontSize: '0.85rem' }}>
          Sketch the specimen on the canvas or add a photo of your paper journal.
        </p>
      </div>

      {/* Gemma Tactile Advice Banner */}
      <div style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <PenTool size={13} color="var(--accent)" />
          <span className="cw-label" style={{ color: 'var(--accent)' }}>
            A sketching tip
          </span>
        </div>
        <p style={{ color: 'var(--text-primary)', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: 12 }}>
          {botanicalLore.sketchingAdvice}
        </p>

        {/* Reference Swatches */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="cw-label" style={{ fontSize: '0.68rem' }}>Color palette</span>
          <div style={{ display: 'flex', gap: 5 }}>
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: targetColor.hex,
                display: 'inline-block',
                border: '2px solid #ffffff',
              }}
              title={`Target: ${targetColor.hex}`}
            />
            {palette.map((swatch, idx) => (
              <span
                key={idx}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: swatch.hex,
                  display: 'inline-block',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
                title={`Specimen: ${swatch.hex}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mode Switcher: Draw on Canvas vs Upload/Camera Paper Sketch */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
      }}>
        <button
          onClick={() => {
            sounds.playPop();
            setInputMode('draw');
          }}
          className={`cw-btn cw-btn-sm ${inputMode === 'draw' ? 'cw-btn-active' : 'cw-btn-secondary'}`}
        >
          <Palette size={13} />
          <span>Draw</span>
        </button>

        <button
          onClick={() => {
            sounds.playPop();
            setInputMode('upload');
          }}
          className={`cw-btn cw-btn-sm ${inputMode === 'upload' ? 'cw-btn-active' : 'cw-btn-secondary'}`}
        >
          <Camera size={13} />
          <span>Add a photo</span>
        </button>
      </div>

      {/* MODE 1: Interactive Canvas */}
      {inputMode === 'draw' && (
        <div style={{ marginBottom: 20 }}>
          <SketchCanvas
            palette={palette}
            targetColor={targetColor}
            onSaveSketch={(dataUrl) => {
              setSketchPhotoUrl(dataUrl);
            }}
          />
        </div>
      )}

      {/* MODE 2: Upload or Camera for Physical Paper Notebook */}
      {inputMode === 'upload' && (
        <div style={{ marginBottom: 20 }}>
          {!sketchPhotoUrl ? (
            <div style={{
              border: '1px dashed var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px 20px',
              textAlign: 'center',
              background: 'var(--bg-2)',
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-muted)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                boxShadow: 'var(--accent-glow)',
              }}>
                <BookOpen size={24} />
              </div>

              <h3 className="cw-h3" style={{ marginBottom: 4 }}>
                Add a sketch photo
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.45 }}>
                Photograph your drawing in good light, or choose an image from your device.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    sounds.playPop();
                    setIsCameraOpen(true);
                  }}
                  className="cw-btn cw-btn-primary cw-btn-md"
                >
                  <Camera size={15} />
                  <span>Open Camera</span>
                </button>

                <button
                  onClick={() => {
                    sounds.playPop();
                    fileInputRef.current?.click();
                  }}
                  className="cw-btn cw-btn-secondary cw-btn-md"
                >
                  <Upload size={15} />
                  <span>Upload Photo</span>
                </button>
              </div>

              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => {
                    sounds.playPop();
                    setSketchPhotoUrl(generateProceduralNotebookSketchSample());
                  }}
                  className="cw-btn cw-btn-ghost cw-btn-sm"
                  style={{ fontSize: '0.78rem' }}
                >
                  <span>Try a sample</span>
                </button>
              </div>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--accent-border)',
              height: 260,
              background: '#000',
              position: 'relative',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sketchPhotoUrl}
                alt="Paper Sketch"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              <button
                onClick={() => setSketchPhotoUrl(null)}
                className="cw-btn cw-btn-secondary cw-btn-sm"
                style={{ position: 'absolute', top: 10, right: 10 }}
              >
                Retake
              </button>
            </div>
          )}
        </div>
      )}

      {/* Side-by-Side Review if sketch is set */}
      {sketchPhotoUrl && (
        <div style={{
          background: 'var(--bg-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: 20,
        }}>
          <span className="cw-label" style={{ marginBottom: 10, color: 'var(--success)' }}>
            Your field note
          </span>
          <div className="cw-grid-2">
            <div>
              <span className="cw-label" style={{ marginBottom: 4, fontSize: '0.68rem' }}>Specimen Photo</span>
              <div style={{ height: 160, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={specimenPhotoUrl} alt="Specimen" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
            <div>
              <span className="cw-label" style={{ marginBottom: 4, fontSize: '0.68rem', color: 'var(--accent)' }}>Your Sketch</span>
              <div style={{ height: 160, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--accent-border)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sketchPhotoUrl} alt="Sketch" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Field Note Inputs */}
      <div style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        marginBottom: 20,
      }}>
        <div className="cw-grid-2" style={{ marginBottom: 12 }}>
          <div>
            <label className="cw-label" style={{ marginBottom: 4 }}>
              Place
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="cw-input"
              placeholder="Park, trail, or nearby place"
              aria-label="Place"
            />
          </div>

          <div>
            <label className="cw-label" style={{ marginBottom: 4 }}>
              Conditions
            </label>
            <input
              type="text"
              value={weatherCondition}
              onChange={(e) => setWeatherCondition(e.target.value)}
              className="cw-input"
              placeholder="Weather or light"
              aria-label="Conditions"
            />
          </div>
        </div>

        <div>
          <label className="cw-label" style={{ marginBottom: 4 }}>
            What did you notice?
          </label>
          <input
            type="text"
            value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              className="cw-input"
              placeholder="A detail, texture, or moment to remember"
              aria-label="Field note"
          />
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => {
            sounds.playPop();
            onBackToMatch();
          }}
          className="cw-btn cw-btn-secondary cw-btn-md"
        >
          <ArrowLeft size={14} />
          <span>Back to Match</span>
        </button>

        <button
          onClick={handleSave}
          disabled={!sketchPhotoUrl}
          className="cw-btn cw-btn-primary cw-btn-md"
        >
          <Check size={16} />
          <span>Save field note</span>
        </button>
      </div>

      {/* Live Camera Viewfinder for physical sketch photo */}
      <LiveCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => {
          sounds.playCameraSnap();
          setSketchPhotoUrl(dataUrl);
        }}
        title="Add a sketch photo"
      />
    </div>
  );
}
