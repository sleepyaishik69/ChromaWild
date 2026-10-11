'use client';

import React, { useState, useRef } from 'react';
import { Quest, ColorSwatch, GemmaAnalysisResponse } from '@/types';
import { extractDominantPalette, calculateDeltaE, deltaEToMatchScore, rgbToHex, getNatureColorName } from '@/lib/colorScience';
import confetti from 'canvas-confetti';
import { sounds } from '@/lib/soundEffects';
import { Camera, Upload, Pipette, Sparkles, ArrowRight, Loader2, RefreshCw, Cpu, CheckCircle2, ArrowLeft, Trophy } from 'lucide-react';
import { LiveCameraModal } from './LiveCameraModal';

interface SpecimenMatcherProps {
  quest: Quest;
  onSpecimenMatched: (data: {
    photoUrl: string;
    matchedColor: ColorSwatch;
    palette: ColorSwatch[];
    matchScore: number;
    deltaE: number;
    botanicalLore: GemmaAnalysisResponse;
  }) => void;
  onBackToPrompt?: () => void;
}

export function SpecimenMatcher({ quest, onSpecimenMatched, onBackToPrompt }: SpecimenMatcherProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [palette, setPalette] = useState<ColorSwatch[]>([]);
  const [selectedColor, setSelectedColor] = useState<ColorSwatch | null>(null);
  const [matchScore, setMatchScore] = useState<number>(0);
  const [deltaE, setDeltaE] = useState<number>(0);
  const [isAnalyzingGemma, setIsAnalyzingGemma] = useState(false);
  const [botanicalLore, setBotanicalLore] = useState<GemmaAnalysisResponse | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleImageLoaded = async () => {
    if (!imgRef.current) return;
    try {
      const extracted = await extractDominantPalette(imgRef.current, 5);
      setPalette(extracted);

      let bestSwatch = extracted[0];
      let lowestDeltaE = Infinity;

      for (const swatch of extracted) {
        const dE = calculateDeltaE(swatch.rgb, quest.targetRgb);
        if (dE < lowestDeltaE) {
          lowestDeltaE = dE;
          bestSwatch = swatch;
        }
      }

      setSelectedColor(bestSwatch);
      const score = deltaEToMatchScore(lowestDeltaE);
      setMatchScore(score);
      setDeltaE(lowestDeltaE);

      sounds.playMatchSuccess(score);

      if (score >= 75) {
        confetti({
          particleCount: 40,
          spread: 65,
          origin: { y: 0.6 },
          colors: [quest.targetHex, bestSwatch.hex, '#ff7849', '#22C55E']
        });
      }

      fetchGemmaMatchEvaluation(bestSwatch, extracted, score, lowestDeltaE);
    } catch (err) {
      console.error('Palette extraction error:', err);
    }
  };

  const fetchGemmaMatchEvaluation = async (
    swatch: ColorSwatch,
    currentPalette: ColorSwatch[],
    currentScore: number,
    currentDeltaE: number
  ) => {
    setIsAnalyzingGemma(true);
    try {
      const res = await fetch('/api/gemma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate_match',
          questTitle: quest.title,
          targetColor: {
            hex: quest.targetHex,
            name: quest.colorName,
            rgb: quest.targetRgb,
          },
          matchedColor: swatch,
          palette: currentPalette,
          deltaE: currentDeltaE,
          matchScore: currentScore,
          userNotes: 'Outdoor specimen photograph analyzed via client CIELAB colorimetry.',
        }),
      });
      const data = await res.json();
      setBotanicalLore(data);
    } catch (err) {
      console.error('Failed to get Gemma match analysis', err);
    } finally {
      setIsAnalyzingGemma(false);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = imgRef.current;
    if (!img) return;

    try {
      sounds.playPop();
      const rect = img.getBoundingClientRect();
      const xRatio = (e.clientX - rect.left) / rect.width;
      const yRatio = (e.clientY - rect.top) / rect.height;

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 600;
      canvas.height = img.naturalHeight || 450;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const pixelX = Math.floor(xRatio * canvas.width);
      const pixelY = Math.floor(yRatio * canvas.height);
      const p = ctx.getImageData(pixelX, pixelY, 1, 1).data;

      const sampledRgb: [number, number, number] = [p[0], p[1], p[2]];
      const sampledHex = rgbToHex(p[0], p[1], p[2]);
      const sampledSwatch: ColorSwatch = {
        hex: sampledHex,
        rgb: sampledRgb,
        name: getNatureColorName(sampledRgb),
      };

      setSelectedColor(sampledSwatch);
      const dE = calculateDeltaE(sampledRgb, quest.targetRgb);
      const score = deltaEToMatchScore(dE);
      setDeltaE(dE);
      setMatchScore(score);

      sounds.playMatchSuccess(score);

      if (score >= 80) {
        confetti({
          particleCount: 25,
          spread: 50,
          origin: { y: 0.6 },
          colors: [sampledHex, '#FF7849']
        });
      }

      fetchGemmaMatchEvaluation(sampledSwatch, palette, score, dE);
    } catch (err) {
      console.warn('Canvas sampling error:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sounds.playCameraSnap();
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProceed = () => {
    if (!imageSrc || !selectedColor || !botanicalLore) return;
    sounds.playPop();
    onSpecimenMatched({
      photoUrl: imageSrc,
      matchedColor: selectedColor,
      palette,
      matchScore,
      deltaE,
      botanicalLore,
    });
  };

  const xpPreview = Math.round(200 + matchScore * 3.5);

  return (
    <div className="cw-card" style={{ maxWidth: 880, margin: '28px auto', padding: '24px', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-md)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onBackToPrompt && (
            <button
              onClick={() => {
                sounds.playPop();
                onBackToPrompt();
              }}
              className="cw-btn cw-btn-ghost cw-btn-sm"
              title="Back to color"
              aria-label="Back to color"
            >
              <ArrowLeft size={14} />
            </button>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span className="cw-badge cw-badge-success">
                Find the color
              </span>
            </div>
            <h2 className="cw-h2" style={{ marginBottom: 2 }}>
              Match a field photo
            </h2>
            <p className="cw-subtitle" style={{ fontSize: '0.85rem' }}>
              Target: <span className="cw-mono" style={{ color: quest.targetHex, fontWeight: 700 }}>{quest.targetHex}</span> ({quest.colorName})
            </p>
          </div>
        </div>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {!imageSrc ? (
        /* Uncluttered Dropzone */
        <div style={{
          border: '1px dashed var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px 24px',
          textAlign: 'center',
          background: 'var(--bg-2)',
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
            <Camera size={26} />
          </div>

          <h3 className="cw-h3" style={{ marginBottom: 6 }}>
            Photograph an outdoor color
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.5 }}>
            Find any safe-to-observe outdoor subject that comes close to {quest.colorName}.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                sounds.playPop();
                setIsCameraOpen(true);
              }}
              className="cw-btn cw-btn-primary cw-btn-md"
            >
              <Camera size={16} />
              <span>Use camera</span>
            </button>

            <button
              onClick={() => {
                sounds.playPop();
                fileInputRef.current?.click();
              }}
              className="cw-btn cw-btn-secondary cw-btn-md"
            >
              <Upload size={16} />
              <span>Upload Photo</span>
            </button>
          </div>

        </div>
      ) : (
        /* Interactive Analysis Workbench */
        <div>
          <div className="cw-grid-2">
            {/* Left: Specimen image with interactive sampler */}
            <div>
              <div style={{
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-default)',
                background: '#000',
                cursor: 'crosshair',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Outdoor Specimen"
                  crossOrigin="anonymous"
                  onLoad={handleImageLoaded}
                  onClick={handleCanvasClick}
                  style={{ width: '100%', height: 270, objectFit: 'cover', display: 'block' }}
                />

                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  background: 'rgba(7, 8, 10, 0.85)',
                  backdropFilter: 'blur(6px)',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.74rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--text-secondary)'
                }}>
                  <Pipette size={12} color="var(--accent)" />
                  <span>Click image to sample custom pixel</span>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => {
                    sounds.playPop();
                    setImageSrc(null);
                    setPalette([]);
                    setSelectedColor(null);
                    setBotanicalLore(null);
                  }}
                  className="cw-btn cw-btn-ghost cw-btn-sm"
                >
                  <RefreshCw size={12} />
                  <span>Retake Photo</span>
                </button>
              </div>
            </div>

            {/* Right: Chromatographic metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Match Card */}
              <div style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="cw-label">Color match</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`cw-badge ${matchScore >= 80 ? 'cw-badge-success' : 'cw-badge-accent'}`} style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
                      {matchScore}% Match
                    </span>
                    <span className="cw-badge cw-badge-accent" style={{ fontSize: '0.75rem' }}>
                      <Trophy size={11} /> +{xpPreview} XP
                    </span>
                  </div>
                </div>

                {/* Side-by-side color disks */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: quest.targetHex,
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }} />
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', display: 'block' }}>Quest Target</span>
                      <span className="cw-mono" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{quest.targetHex}</span>
                    </div>
                  </div>

                  <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>&rarr;</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: selectedColor?.hex || '#000',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }} />
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', display: 'block' }}>Photo Match</span>
                      <span className="cw-mono" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{selectedColor?.hex || '---'}</span>
                    </div>
                  </div>
                </div>

                {/* Delta-E readout */}
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                  <span>CIE76 &Delta;E: {deltaE.toFixed(1)}</span>
                  <span>{deltaE < 6.0 ? 'Perceptually Accurate' : deltaE < 14 ? 'Close Field Variant' : 'Divergent Natural Tone'}</span>
                </div>
              </div>

              {/* Extracted 5-Swatch Palette */}
              <div>
                <span className="cw-label" style={{ display: 'block', marginBottom: 6 }}>
                  Extracted Specimen Palette
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {palette.map((swatch, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        sounds.playPop();
                        setSelectedColor(swatch);
                        const dE = calculateDeltaE(swatch.rgb, quest.targetRgb);
                        setDeltaE(dE);
                        const score = deltaEToMatchScore(dE);
                        setMatchScore(score);
                        sounds.playMatchSuccess(score);
                        fetchGemmaMatchEvaluation(swatch, palette, score, dE);
                      }}
                      style={{
                        flex: 1,
                        height: 36,
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: swatch.hex,
                        border: selectedColor?.hex === swatch.hex
                          ? '2px solid #ffffff'
                          : '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        transition: 'transform var(--transition-fast)',
                      }}
                      title={`${swatch.hex} (${swatch.name || 'Sample'})`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Gemma 2 Palette Verification & Botanical Verdict Panel */}
          <div style={{
            marginTop: 18,
            background: 'var(--bg-2)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '18px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              flexWrap: 'wrap',
              gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Sparkles size={15} color="var(--accent)" />
                <span className="cw-label" style={{ color: 'var(--accent)', fontSize: '0.78rem' }}>
                  Field notes
                </span>
                {isAnalyzingGemma && <Loader2 size={13} className="cw-spin" color="var(--accent)" />}
              </div>

              {botanicalLore?.provider && (
                <span className="cw-badge cw-badge-muted" style={{ fontSize: '0.68rem' }}>
                  <Cpu size={10} />
                  {botanicalLore.provider}
                </span>
              )}
            </div>

            {botanicalLore ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Match Verdict */}
                {botanicalLore.matchVerdict && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} color={matchScore >= 75 ? 'var(--success)' : 'var(--accent)'} />
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      fontFamily: 'var(--font-mono)',
                      color: matchScore >= 75 ? 'var(--success)' : 'var(--accent)',
                    }}>
                      {botanicalLore.matchVerdict}
                    </span>
                  </div>
                )}

                {/* Match Critique & Palette Harmony */}
                {botanicalLore.matchCritique && (
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {botanicalLore.matchCritique}
                  </p>
                )}

                {/* Pigment Lore */}
                <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', lineHeight: 1.45 }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Color notes:</strong> {botanicalLore.pigmentLore}
                </p>

                {/* Sketching Advice for Step 3 */}
                <div style={{
                  padding: '12px 14px',
                  background: 'var(--bg-1)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--accent-border)',
                }}>
                  <span className="cw-label" style={{ marginBottom: 4, color: 'var(--accent)' }}>
                    Sketching tip
                  </span>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {botanicalLore.sketchingAdvice}
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                Looking at the colors in your photo…
              </p>
            )}
          </div>

          {/* Action to Step 3 */}
          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleProceed}
              disabled={!botanicalLore}
              className="cw-btn cw-btn-primary cw-btn-md"
            >
              <span>Make a field sketch</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Live Camera Modal */}
      <LiveCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => {
          sounds.playCameraSnap();
          setImageSrc(dataUrl);
        }}
        targetHex={quest.targetHex}
        title="Capture Outdoor Specimen"
      />
    </div>
  );
}
