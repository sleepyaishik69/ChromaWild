'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { StartScreen } from '@/components/StartScreen';
import { QuestCard } from '@/components/QuestCard';
import { SpecimenMatcher } from '@/components/SpecimenMatcher';
import { PaperSketchUploader } from '@/components/PaperSketchUploader';
import { FieldLibrary } from '@/components/FieldLibrary';
import { QuestCompleteModal } from '@/components/QuestCompleteModal';
import { SettingsModal } from '@/components/SettingsModal';
import { getSavedEntries, saveEntry, deleteEntry, getPlayerStats, recordQuestCompletion } from '@/lib/storage';
import { Quest, SpecimenEntry, ColorSwatch, GemmaAnalysisResponse, GameStep, PlayerStats, Badge } from '@/types';
import { ArrowRight } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<GameStep>('start');
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [entries, setEntries] = useState<SpecimenEntry[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    xp: 0,
    level: 1,
    rankTitle: 'Novice Sprout',
    questsCompleted: 0,
    streak: 1,
    unlockedBadgeIds: [],
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Victory / Quest Completion modal state
  const [completionData, setCompletionData] = useState<{
    entry: SpecimenEntry;
    xpAwarded: number;
    leveledUp: boolean;
    newBadges: Badge[];
  } | null>(null);

  // Staged data from step 2 (specimen match) to carry over to step 3 (sketch)
  const [stagedMatch, setStagedMatch] = useState<{
    photoUrl: string;
    matchedColor: ColorSwatch;
    palette: ColorSwatch[];
    matchScore: number;
    deltaE: number;
    botanicalLore: GemmaAnalysisResponse;
  } | null>(null);

  // Load saved entries and player stats on client mount
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setEntries(getSavedEntries());
      setPlayerStats(getPlayerStats());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleStartQuestFromGameStart = (generatedQuest: Quest) => {
    setActiveQuest(generatedQuest);
    setStagedMatch(null);
    setActiveTab('quest');
  };

  const handleGemmaGenerateQuest = (newQuest: Quest) => {
    setActiveQuest(newQuest);
    setStagedMatch(null);
  };

  const handleSpecimenMatched = (data: {
    photoUrl: string;
    matchedColor: ColorSwatch;
    palette: ColorSwatch[];
    matchScore: number;
    deltaE: number;
    botanicalLore: GemmaAnalysisResponse;
  }) => {
    setStagedMatch(data);
    setActiveTab('sketch');
  };

  const handleEntryComplete = (newEntry: SpecimenEntry) => {
    saveEntry(newEntry);
    setEntries(prev => [newEntry, ...prev]);

    // Gamification reward
    const result = recordQuestCompletion(newEntry.matchScore, true);
    setPlayerStats(result.stats);

    // Open celebratory modal
    setCompletionData({
      entry: newEntry,
      xpAwarded: result.xpAwarded,
      leveledUp: result.leveledUp,
      newBadges: result.newBadges,
    });

    setStagedMatch(null);
  };

  const handleDeleteEntry = (id: string) => {
    deleteEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        entriesCount={entries.length}
        hasActiveQuest={!!activeQuest}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main style={{ flex: 1, paddingBottom: 64 }}>
        {activeTab === 'start' && (
          <StartScreen
            playerStats={playerStats}
            entriesCount={entries.length}
            onStartQuest={handleStartQuestFromGameStart}
            onOpenLibrary={() => setActiveTab('library')}
          />
        )}

        {activeTab === 'quest' && activeQuest && (
          <div className="cw-container">
            <QuestCard
              quest={activeQuest}
              onGemmaGenerateQuest={handleGemmaGenerateQuest}
              onStartMatch={() => setActiveTab('match')}
              onBackToStart={() => setActiveTab('start')}
            />
          </div>
        )}

        {activeTab === 'match' && activeQuest && (
          <div className="cw-container">
            <SpecimenMatcher
              quest={activeQuest}
              onSpecimenMatched={handleSpecimenMatched}
              onBackToPrompt={() => setActiveTab('quest')}
            />
          </div>
        )}

        {activeTab === 'sketch' && activeQuest && (
          <div className="cw-container">
            {stagedMatch ? (
              <PaperSketchUploader
                questTitle={activeQuest.title}
                targetColor={{
                  hex: activeQuest.targetHex,
                  rgb: activeQuest.targetRgb,
                  name: activeQuest.colorName,
                }}
                matchedColor={stagedMatch.matchedColor}
                palette={stagedMatch.palette}
                matchScore={stagedMatch.matchScore}
                deltaE={stagedMatch.deltaE}
                specimenPhotoUrl={stagedMatch.photoUrl}
                botanicalLore={stagedMatch.botanicalLore}
                onEntryComplete={handleEntryComplete}
                onBackToMatch={() => setActiveTab('match')}
              />
            ) : (
              <div className="cw-card" style={{ maxWidth: 580, margin: '60px auto', textAlign: 'center', padding: '40px 24px' }}>
                <h3 className="cw-h3" style={{ marginBottom: 8 }}>
                  Start with a field photo
                </h3>
                <p className="cw-subtitle" style={{ fontSize: '0.88rem', marginBottom: 20 }}>
                  Photograph something outdoors first. Your match and notes will be ready here.
                </p>
                <button
                  onClick={() => {
                    sounds.playPop();
                    setActiveTab('match');
                  }}
                  className="cw-btn cw-btn-primary cw-btn-md"
                >
                  <span>Take a field photo</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'library' && (
          <FieldLibrary
            entries={entries}
            playerStats={playerStats}
            onStartNewQuest={() => {
              setActiveTab('start');
            }}
            onDeleteEntry={handleDeleteEntry}
          />
        )}
      </main>

      {/* Victory / Quest Clear Celebration Modal */}
      {completionData && (
        <QuestCompleteModal
          isOpen={!!completionData}
          onClose={() => setCompletionData(null)}
          entry={completionData.entry}
          xpAwarded={completionData.xpAwarded}
          leveledUp={completionData.leveledUp}
          newBadges={completionData.newBadges}
          playerStats={playerStats}
          onGoToLibrary={() => {
            setCompletionData(null);
            setActiveTab('library');
          }}
          onStartAnotherQuest={() => {
            setCompletionData(null);
            setActiveTab('start');
          }}
        />
      )}

      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '20px 0',
        textAlign: 'center',
      }}>
        <div className="cw-container">
          <p>
            Made for slower walks and closer looking.
          </p>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
