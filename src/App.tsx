import React, { useState, useEffect } from 'react';
import { WorldMap } from './components/WorldMap';
import { GameCanvas } from './components/GameCanvas';
import { HardwareSpecsModal } from './components/HardwareSpecsModal';
import { CharacterCustomizer } from './components/CharacterCustomizer';
import { LeaderboardModal } from './components/LeaderboardModal';
import { LevelClearModal } from './components/LevelClearModal';
import { detectDeviceHardware, getDefaultGraphicSettings } from './utils/hardwareDetection';
import { Accessory, Costume, DeviceInfo, GraphicSettings, Skill } from './types/game';
import { ACCESSORIES, COSTUMES, SKILLS } from './data/itemsData';

export default function App() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => detectDeviceHardware());
  const [graphicSettings, setGraphicSettings] = useState<GraphicSettings>(() =>
    getDefaultGraphicSettings(deviceInfo.tier)
  );

  const [gameState, setGameState] = useState<'map' | 'playing'>('map');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [marathonMode, setMarathonMode] = useState<boolean>(false);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(() => {
    const saved = localStorage.getItem('mario_anime_unlocked_level');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [totalCoins, setTotalCoins] = useState<number>(() => {
    const saved = localStorage.getItem('mario_anime_coins');
    return saved ? parseInt(saved, 10) : 100;
  });
  const [totalStars, setTotalStars] = useState<number>(() => {
    const saved = localStorage.getItem('mario_anime_stars');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [equippedCostume, setEquippedCostume] = useState<Costume>(COSTUMES[0]);
  const [equippedAccessory, setEquippedAccessory] = useState<Accessory>(ACCESSORIES[0]);
  const [equippedSkill, setEquippedSkill] = useState<Skill>(SKILLS[0]);

  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [clearModalStats, setClearModalStats] = useState<{
    levelNumber: number;
    score: number;
    timeSeconds: number;
    coins: number;
    starCoins: number[];
  } | null>(null);

  useEffect(() => {
    const detected = detectDeviceHardware();
    setDeviceInfo(detected);
    const initialSettings = getDefaultGraphicSettings(detected.tier);
    setGraphicSettings(initialSettings);
  }, []);

  const handleSelectLevel = (levelNum: number, marathon: boolean) => {
    setCurrentLevel(levelNum);
    setMarathonMode(marathon);
    setGameState('playing');
    setClearModalStats(null);
  };

  const handleLevelComplete = async (stats: {
    score: number;
    time: number;
    coins: number;
    starCoins: number[];
  }) => {
    const nextUnlocked = Math.max(unlockedLevel, currentLevel + 1);
    setUnlockedLevel(nextUnlocked);
    localStorage.setItem('mario_anime_unlocked_level', nextUnlocked.toString());

    const newCoins = totalCoins + stats.coins;
    setTotalCoins(newCoins);
    localStorage.setItem('mario_anime_coins', newCoins.toString());

    const newStars = totalStars + stats.starCoins.length;
    setTotalStars(newStars);
    localStorage.setItem('mario_anime_stars', newStars.toString());

    try {
      await fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: 'Super Boy Ren',
          characterTitle: `${equippedCostume.name}`,
          level: currentLevel,
          score: stats.score,
          timeSeconds: stats.time,
          coins: stats.coins,
          starCoins: stats.starCoins.length,
          equippedCostume: equippedCostume.id,
          equippedSkill: equippedSkill.id,
          deviceTier: deviceInfo.tier,
        }),
      });
    } catch (e) {
      console.warn('Leaderboard submit fallback:', e);
    }

    setClearModalStats({
      levelNumber: currentLevel,
      score: stats.score,
      timeSeconds: stats.time,
      coins: stats.coins,
      starCoins: stats.starCoins,
    });
  };

  const handleNextLevel = () => {
    const next = Math.min(1001, currentLevel + 1);
    setCurrentLevel(next);
    setClearModalStats(null);
    setGameState('playing');
  };

  const handleRetry = () => {
    setClearModalStats(null);
    setGameState('playing');
  };

  const handleReturnToMap = () => {
    setClearModalStats(null);
    setGameState('map');
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 font-sans text-white">
      {gameState === 'map' ? (
        <WorldMap
          unlockedLevel={unlockedLevel}
          selectedLevel={currentLevel}
          onSelectLevel={handleSelectLevel}
          onOpenCustomizer={() => setIsCustomizerOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenSpecs={() => setIsSpecsModalOpen(true)}
          totalCoins={totalCoins}
          totalStars={totalStars}
        />
      ) : (
        <GameCanvas
          levelNumber={currentLevel}
          marathonMode={marathonMode}
          costume={equippedCostume}
          accessory={equippedAccessory}
          skill={equippedSkill}
          graphicSettings={graphicSettings}
          onLevelComplete={handleLevelComplete}
          onReturnToMap={handleReturnToMap}
          onOpenSpecs={() => setIsSpecsModalOpen(true)}
        />
      )}

      {/* Hardware Specs & RTX Settings Modal */}
      {isSpecsModalOpen && (
        <HardwareSpecsModal
          deviceInfo={deviceInfo}
          settings={graphicSettings}
          onUpdateSettings={setGraphicSettings}
          onClose={() => setIsSpecsModalOpen(false)}
        />
      )}

      {/* Character Wardrobe & Skills Customizer */}
      {isCustomizerOpen && (
        <CharacterCustomizer
          equippedCostume={equippedCostume}
          equippedAccessory={equippedAccessory}
          equippedSkill={equippedSkill}
          unlockedLevel={unlockedLevel}
          onEquipCostume={setEquippedCostume}
          onEquipAccessory={setEquippedAccessory}
          onEquipSkill={setEquippedSkill}
          onClose={() => setIsCustomizerOpen(false)}
        />
      )}

      {/* Real-time Global Leaderboard */}
      {isLeaderboardOpen && (
        <LeaderboardModal onClose={() => setIsLeaderboardOpen(false)} />
      )}

      {/* Stage Clear Victory Fanfare */}
      {clearModalStats && (
        <LevelClearModal
          levelNumber={clearModalStats.levelNumber}
          score={clearModalStats.score}
          timeSeconds={clearModalStats.timeSeconds}
          coins={clearModalStats.coins}
          starCoins={clearModalStats.starCoins}
          onNextLevel={handleNextLevel}
          onRetry={handleRetry}
          onReturnToMap={handleReturnToMap}
        />
      )}
    </div>
  );
}
