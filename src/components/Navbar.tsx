'use client';

import React, { useState, useEffect } from 'react';
import { GameStep } from '@/types';
import { BookOpen, Leaf, Settings, Volume2, VolumeX } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';

interface NavbarProps {
  activeTab: GameStep;
  setActiveTab: (tab: GameStep) => void;
  entriesCount: number;
  hasActiveQuest: boolean;
  onOpenSettings: () => void;
}

const navigation: { id: GameStep; label: string }[] = [
  { id: 'start', label: 'Home' },
  { id: 'quest', label: 'Color' },
  { id: 'match', label: 'Find' },
  { id: 'sketch', label: 'Sketch' },
  { id: 'library', label: 'Journal' },
];

export function Navbar({ activeTab, setActiveTab, entriesCount, hasActiveQuest, onOpenSettings }: NavbarProps) {
  const [isSoundOn, setIsSoundOn] = useState(true);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsSoundOn(sounds.isEnabled()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleToggleSound = () => setIsSoundOn(sounds.toggle());
  const navigate = (tab: GameStep) => {
    if (tab !== activeTab) sounds.playPop();
    setActiveTab(tab);
  };

  return (
    <header className="site-header">
      <div className="cw-container site-header__inner">
        <button className="brand" onClick={() => navigate('start')} aria-label="ChromaWild home">
          <span className="brand__mark"><Leaf size={18} strokeWidth={2} /></span>
          <span className="brand__name">ChromaWild</span>
        </button>

        <nav className="site-nav" aria-label="Field journal">
          {navigation.map(({ id, label }) => (
            <button
              key={id}
              className="site-nav__item"
              onClick={() => navigate(id)}
              disabled={!hasActiveQuest && ['quest', 'match', 'sketch'].includes(id)}
              title={!hasActiveQuest && ['quest', 'match', 'sketch'].includes(id) ? 'Start a color walk to unlock these steps' : undefined}
              aria-current={activeTab === id ? 'page' : undefined}
            >
              {id === 'library' && <BookOpen size={15} />}
              <span>{label}</span>
              {id === 'library' && entriesCount > 0 && <span className="site-nav__count">{entriesCount}</span>}
            </button>
          ))}
        </nav>

        <div className="site-header__tools">
          <button
            className="icon-button"
            onClick={handleToggleSound}
            aria-label={isSoundOn ? 'Mute sound effects' : 'Turn on sound effects'}
            title={isSoundOn ? 'Mute sound effects' : 'Turn on sound effects'}
          >
            {isSoundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button className="icon-button" onClick={onOpenSettings} aria-label="Settings" title="Settings">
            <Settings size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
