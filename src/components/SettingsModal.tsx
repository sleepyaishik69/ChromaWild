'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Volume2, Cpu, Check, Loader2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [elevenLabsKey, setElevenLabsKey] = useState(() =>
    typeof window === 'undefined' ? '' : localStorage.getItem('chromawild_elevenlabs_key') || '',
  );
  const [ollamaUrl, setOllamaUrl] = useState(() =>
    typeof window === 'undefined' ? 'http://localhost:11434' : localStorage.getItem('chromawild_ollama_url') || 'http://localhost:11434',
  );
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [voiceTestStatus, setVoiceTestStatus] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (isOpen && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chromawild_elevenlabs_key', elevenLabsKey);
      localStorage.setItem('chromawild_ollama_url', ollamaUrl);
      setSavedMsg(true);
      setTimeout(() => {
        setSavedMsg(false);
        onClose();
      }, 800);
    }
  };

  const handleTestVoice = async () => {
    setIsTestingVoice(true);
    setVoiceTestStatus(null);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Welcome to ChromaWild. Let’s take a color walk.',
          customApiKey: elevenLabsKey || undefined
        }),
      });

      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('audio')) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setIsTestingVoice(false);
          setVoiceTestStatus('ElevenLabs voice verified!');
          URL.revokeObjectURL(audioUrl);
        };
        await audio.play();
      } else {
        setIsTestingVoice(false);
        setVoiceTestStatus('Using Browser Web Speech synthesis (no ElevenLabs key detected).');
      }
    } catch {
      setIsTestingVoice(false);
      setVoiceTestStatus('Audio test failed.');
    }
  };

  return (
    <dialog ref={dialogRef} className="app-dialog" aria-labelledby="settings-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === dialogRef.current) onClose(); }}>
      <div className="cw-card" style={{
        maxWidth: 500,
        width: '100%',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="cw-btn cw-btn-ghost cw-btn-sm"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            padding: '4px 6px',
          }}
          aria-label="Close settings"
        >
          <X size={16} />
        </button>

        <h3 className="cw-h3" id="settings-title" style={{ marginBottom: 2 }}>
          Settings
        </h3>
        <p className="cw-subtitle" style={{ fontSize: '0.82rem', marginBottom: 20 }}>
          Choose how color suggestions and audio work.
        </p>

        {/* Gemma Config */}
        <div style={{ marginBottom: 18 }}>
          <label className="cw-label" htmlFor="ollama-url" style={{ marginBottom: 4 }}>
            <Cpu size={13} color="var(--accent)" />
            Color suggestions
          </label>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>
            Ollama runs on your device. Leave the default address if it’s already set up.
          </p>
          <input
            type="text"
            id="ollama-url"
            aria-label="Ollama address"
            value={ollamaUrl}
            onChange={(e) => setOllamaUrl(e.target.value)}
            className="cw-input cw-mono"
            placeholder="http://localhost:11434"
          />
        </div>

        {/* ElevenLabs Config */}
        <div style={{ marginBottom: 20 }}>
          <label className="cw-label" htmlFor="elevenlabs-key" style={{ marginBottom: 4 }}>
            <Volume2 size={13} color="var(--accent)" />
            Spoken field notes
          </label>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>
            Optional ElevenLabs key for spoken prompts. Without a key, your browser reads them aloud.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              id="elevenlabs-key"
              value={elevenLabsKey}
              onChange={(e) => setElevenLabsKey(e.target.value)}
              className="cw-input cw-mono"
              placeholder="xi-api-key (optional)"
              style={{ flex: 1 }}
            />
            <button
              onClick={handleTestVoice}
              disabled={isTestingVoice}
              className="cw-btn cw-btn-secondary cw-btn-sm"
              style={{ flexShrink: 0 }}
            >
              {isTestingVoice ? <Loader2 size={12} className="cw-spin" /> : <Volume2 size={12} />}
              <span>Test Audio</span>
            </button>
          </div>
          {voiceTestStatus && (
            <p style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
              {voiceTestStatus}
            </p>
          )}
        </div>

        {/* Action Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} className="cw-btn cw-btn-ghost cw-btn-sm">
            Cancel
          </button>
          <button onClick={handleSave} className="cw-btn cw-btn-primary cw-btn-sm">
            {savedMsg ? <Check size={13} /> : null}
            <span>{savedMsg ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
