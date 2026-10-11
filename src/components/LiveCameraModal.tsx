'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, SwitchCamera, AlertCircle, Upload } from 'lucide-react';

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  title?: string;
  targetHex?: string;
}

export function LiveCameraModal({
  isOpen,
  onClose,
  onCapture,
  title = 'Live Camera Viewfinder',
  targetHex,
}: LiveCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    setIsStarting(true);
    setErrorMsg(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.warn('Live camera error:', error);
      const cameraError = error instanceof Error ? error : null;
      setErrorMsg(
        cameraError?.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera permissions or upload an image.'
          : cameraError?.message || 'Could not start camera.'
      );
    } finally {
      setIsStarting(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    const startTimer = window.setTimeout(() => void startCamera(facingMode), 0);
    return () => {
      window.clearTimeout(startTimer);
      stopCamera();
    };
  }, [isOpen, facingMode, startCamera, stopCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    stopCamera();
    onCapture(dataUrl);
    onClose();
  };

  const handleSwitchFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onCapture(dataUrl);
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(7, 8, 10, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: 16,
    }}>
      <div className="cw-card" style={{
        maxWidth: 680,
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera size={16} color="var(--accent)" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              {title}
            </span>
          </div>

          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="cw-btn cw-btn-ghost cw-btn-sm"
            style={{ padding: '4px 6px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Viewfinder Window */}
        <div style={{
          position: 'relative',
          backgroundColor: '#000',
          aspectRatio: '4/3',
          maxHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {errorMsg ? (
            <div style={{ padding: 24, textAlign: 'center', maxWidth: 400 }}>
              <AlertCircle size={32} color="var(--accent)" style={{ margin: '0 auto 10px' }} />
              <p style={{ color: 'var(--text-primary)', fontSize: '0.88rem', marginBottom: 14 }}>
                {errorMsg}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="cw-btn cw-btn-primary cw-btn-sm"
              >
                <Upload size={14} />
                <span>Choose From Files</span>
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />

              {/* Viewfinder Reticle */}
              <div style={{
                position: 'absolute',
                width: 80,
                height: 80,
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '50%',
                pointerEvents: 'none',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.25)',
              }} />

              {/* Target Swatch Pill */}
              {targetHex && (
                <div style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  background: 'rgba(7, 8, 10, 0.75)',
                  backdropFilter: 'blur(4px)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <span style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: targetHex,
                    display: 'inline-block',
                    border: '1px solid #fff',
                  }} />
                  <span className="cw-mono">{targetHex}</span>
                </div>
              )}
            </>
          )}

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFallbackFile}
            style={{ display: 'none' }}
          />
        </div>

        {/* Shutter Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'var(--bg-1)',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <button
            onClick={handleSwitchFacing}
            disabled={!!errorMsg || isStarting}
            className="cw-btn cw-btn-secondary cw-btn-sm"
          >
            <SwitchCamera size={14} />
            <span>Switch</span>
          </button>

          {/* Precision Circular Shutter */}
          <button
            onClick={handleCapture}
            disabled={!!errorMsg || isStarting}
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              backgroundColor: '#fff',
              border: '4px solid var(--accent)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--accent-glow)',
              transition: 'transform var(--transition-fast)',
            }}
            title="Snap Specimen Photo"
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
            }} />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="cw-btn cw-btn-ghost cw-btn-sm"
          >
            <Upload size={14} />
            <span>Files</span>
          </button>
        </div>
      </div>
    </div>
  );
}
