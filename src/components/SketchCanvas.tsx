'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ColorSwatch } from '@/types';
import { sounds } from '@/lib/soundEffects';
import { RotateCcw, Trash2, Check, Eraser, PenTool, Brush, Palette } from 'lucide-react';

interface SketchCanvasProps {
  palette: ColorSwatch[];
  targetColor: ColorSwatch;
  onSaveSketch: (dataUrl: string) => void;
}

export function SketchCanvas({ palette, targetColor, onSaveSketch }: SketchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState<string>(targetColor.hex);
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [tool, setTool] = useState<'pencil' | 'brush' | 'wash' | 'eraser'>('pencil');
  const [history, setHistory] = useState<ImageData[]>([]);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-12), data]);
  }, []);

  // Setup canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // High DPI sizing
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Warm ivory parchment background
    ctx.fillStyle = '#181b22';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Subtle botanical grid / paper grain
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < rect.width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    for (let y = 0; y < rect.height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // Save initial state to history
    saveState();
  }, [saveState]);

  const handleUndo = () => {
    if (history.length <= 1) return;
    sounds.playPop();
    const newHistory = [...history];
    newHistory.pop(); // discard current
    const previous = newHistory[newHistory.length - 1];
    setHistory(newHistory);

    const canvas = canvasRef.current;
    if (!canvas || !previous) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.putImageData(previous, 0, 0);
  };

  const handleClear = () => {
    sounds.playPop();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#181b22';
    ctx.fillRect(0, 0, rect.width, rect.height);
    saveState();
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === 'eraser') {
      ctx.strokeStyle = '#181b22';
      ctx.lineWidth = strokeWidth * 3;
      ctx.globalAlpha = 1.0;
      ctx.lineCap = 'round';
    } else if (tool === 'pencil') {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = strokeWidth;
      ctx.globalAlpha = 0.9;
      ctx.lineCap = 'round';
    } else if (tool === 'brush') {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = strokeWidth * 2;
      ctx.globalAlpha = 0.65;
      ctx.lineCap = 'round';
    } else if (tool === 'wash') {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = strokeWidth * 5;
      ctx.globalAlpha = 0.22;
      ctx.lineCap = 'round';
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveState();
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    sounds.playPop();
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    onSaveSketch(dataUrl);
  };

  // Curated color swatches: Quest target + Extracted palette + standard naturalist drawing pigments
  const availableColors = [
    targetColor.hex,
    ...palette.map((p) => p.hex),
    '#FFFFFF',
    '#2D6A4F',
    '#D97724',
    '#6F4E37',
    '#222222',
  ];
  // Remove duplicates
  const uniqueColors = Array.from(new Set(availableColors));

  return (
    <div style={{
      background: 'var(--bg-2)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px',
    }}>
      {/* Tool & Color Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {/* Drawing Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => { setTool('pencil'); sounds.playPop(); }}
            className={`cw-btn cw-btn-sm ${tool === 'pencil' ? 'cw-btn-active' : 'cw-btn-secondary'}`}
            title="Pencil (fine contour hatching)"
          >
            <PenTool size={13} />
            <span>Pencil</span>
          </button>

          <button
            onClick={() => { setTool('brush'); sounds.playPop(); }}
            className={`cw-btn cw-btn-sm ${tool === 'brush' ? 'cw-btn-active' : 'cw-btn-secondary'}`}
            title="Medium Botanical Brush"
          >
            <Brush size={13} />
            <span>Brush</span>
          </button>

          <button
            onClick={() => { setTool('wash'); sounds.playPop(); }}
            className={`cw-btn cw-btn-sm ${tool === 'wash' ? 'cw-btn-active' : 'cw-btn-secondary'}`}
            title="Watercolor Wash (semi-transparent)"
          >
            <Palette size={13} />
            <span>Wash</span>
          </button>

          <button
            onClick={() => { setTool('eraser'); sounds.playPop(); }}
            className={`cw-btn cw-btn-sm ${tool === 'eraser' ? 'cw-btn-active' : 'cw-btn-secondary'}`}
            title="Eraser"
          >
            <Eraser size={13} />
            <span>Eraser</span>
          </button>
        </div>

        {/* Stroke Width Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="cw-label" style={{ fontSize: '0.68rem' }}>Width:</span>
          {[2, 4, 8, 16].map((w) => (
            <button
              key={w}
              onClick={() => setStrokeWidth(w)}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: strokeWidth === w ? 'var(--accent)' : 'var(--bg-1)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <span style={{
                width: Math.min(14, w * 1.5),
                height: Math.min(14, w * 1.5),
                borderRadius: '50%',
                background: strokeWidth === w ? '#07080a' : 'var(--text-secondary)',
              }} />
            </button>
          ))}
        </div>

        {/* Undo / Clear Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleUndo}
            disabled={history.length <= 1}
            className="cw-btn cw-btn-ghost cw-btn-sm"
            title="Undo stroke"
          >
            <RotateCcw size={13} />
            <span>Undo</span>
          </button>
          <button
            onClick={handleClear}
            className="cw-btn cw-btn-ghost cw-btn-sm"
            title="Clear canvas"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Pigment Swatches Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        overflowX: 'auto',
        paddingBottom: 4,
      }}>
        <span className="cw-label" style={{ fontSize: '0.68rem', flexShrink: 0 }}>Pigments:</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {uniqueColors.map((hex, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentColor(hex);
                if (tool === 'eraser') setTool('pencil');
                sounds.playPop();
              }}
              style={{
                width: 26,
                height: 26,
                borderRadius: 'var(--radius-xs)',
                backgroundColor: hex,
                border: currentColor === hex && tool !== 'eraser'
                  ? '2px solid #ffffff'
                  : '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: currentColor === hex ? '0 0 8px rgba(255, 255, 255, 0.4)' : 'none',
                cursor: 'pointer',
                transform: currentColor === hex ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.1s ease',
              }}
              title={hex}
            />
          ))}
        </div>
      </div>

      {/* The Drawing Canvas */}
      <div style={{
        position: 'relative',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-default)',
        background: '#181b22',
        boxShadow: 'var(--shadow-inset)',
      }}>
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          style={{
            width: '100%',
            height: 320,
            display: 'block',
            cursor: tool === 'eraser' ? 'cell' : 'crosshair',
            touchAction: 'none',
          }}
        />
        <div style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          pointerEvents: 'none',
          fontSize: '0.68rem',
          fontFamily: 'var(--font-mono)',
          color: 'rgba(255, 255, 255, 0.3)',
        }}>
          Sketch
        </div>
      </div>

      {/* Apply Sketch Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: 12,
      }}>
        <button
          onClick={handleApply}
          className="cw-btn cw-btn-primary cw-btn-sm"
        >
          <Check size={14} />
          <span>Use This Drawing</span>
        </button>
      </div>
    </div>
  );
}
