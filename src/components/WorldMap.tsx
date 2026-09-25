import React, { useState } from 'react';
import { Play, Sparkles, Star, Trophy, Clock, Flame, Shield, Compass, Swords, Scroll, BookOpen, Crown, Zap } from 'lucide-react';
import { WORLD_DEFINITIONS, getLevelWorldInfo } from '../engine/levelGenerator';

interface Props {
  unlockedLevel: number;
  selectedLevel: number;
  onSelectLevel: (lvl: number, marathon: boolean) => void;
  onOpenCustomizer: () => void;
  onOpenLeaderboard: () => void;
  onOpenSpecs: () => void;
  totalCoins: number;
  totalStars: number;
}

export const WorldMap: React.FC<Props> = ({
  unlockedLevel,
  selectedLevel,
  onSelectLevel,
  onOpenCustomizer,
  onOpenLeaderboard,
  onOpenSpecs,
  totalCoins,
  totalStars,
}) => {
  const [activeWorld, setActiveWorld] = useState(getLevelWorldInfo(selectedLevel).worldNum);
  const [targetLevelInput, setTargetLevelInput] = useState(selectedLevel.toString());
  const [marathonMode, setMarathonMode] = useState(false);
  const [aiLevelData, setAiLevelData] = useState<{ title: string; lore: string; modifier?: string } | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const curWorldInfo = WORLD_DEFINITIONS[activeWorld - 1];

  const handleInspectLevel = async (lvl: number) => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/generate-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          levelNumber: lvl,
          worldId: curWorldInfo.name,
          theme: curWorldInfo.theme,
          difficulty: lvl > 800 ? 'Godly' : lvl > 400 ? 'Extreme' : 'Normal',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiLevelData(data.data);
      }
    } catch (e) {
      console.warn('AI fetch error:', e);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleStartGame = (lvl: number) => {
    onSelectLevel(lvl, marathonMode);
  };

  const handleJumpToLevel = (e: React.FormEvent) => {
    e.preventDefault();
    const lvl = parseInt(targetLevelInput, 10);
    if (!isNaN(lvl) && lvl >= 1 && lvl <= 1001) {
      const wInfo = getLevelWorldInfo(lvl);
      setActiveWorld(wInfo.worldNum);
      handleInspectLevel(lvl);
    }
  };

  const startLvl = (activeWorld - 1) * 100 + 1;
  const endLvl = activeWorld === 10 ? 1001 : activeWorld * 100;
  const worldLevels = [];
  for (let i = startLvl; i <= endLvl; i++) {
    worldLevels.push(i);
  }

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none overflow-y-auto font-sans">
      {/* Tensura Storybook Parchment Animated Background */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 bg-cover bg-center"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)`
        }}
      />

      {/* Top Header - Tensura Font Style */}
      <header className="sticky top-0 z-30 px-4 py-3 bg-slate-900/95 backdrop-blur-md border-b border-sky-500/30 flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-sky-950/40">
        <div className="flex items-center gap-3">
          {/* Super Boy Sekai Mascot Badge */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 via-cyan-400 to-amber-400 flex items-center justify-center shadow-lg shadow-sky-500/40 border-2 border-sky-200 text-slate-950 text-xl font-black relative overflow-hidden animate-pulse">
            <span className="text-xl">⚔️</span>
          </div>
          <div>
            <h1 className="text-xl font-black font-tensura tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-cyan-300 flex items-center gap-2 tensura-gold-glow">
              SUPER BOY SEKAI
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 font-mono flex items-center gap-1 font-sans">
                <Crown className="w-3 h-3 text-amber-400" /> 1001 DIMENSIONS
              </span>
            </h1>
            <p className="text-xs text-sky-300/80 font-tensura-sub">「スーパーボーイ・セカイ」 • 2.5D Anime Platformer Odyssey</p>
          </div>
        </div>

        {/* Currency & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 border border-amber-500/30 rounded-xl" title="Japanese Koban Gold Coins">
            <span className="w-4 h-4 rounded-full bg-amber-400 inline-block shadow-sm" />
            <span className="font-tensura-sub font-bold text-amber-300 text-sm">{totalCoins} Koban</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 border border-yellow-500/30 rounded-xl" title="Dimensional Star Relics">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="font-tensura-sub font-bold text-yellow-300 text-sm">{totalStars}</span>
          </div>

          <button
            onClick={onOpenCustomizer}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-sky-500/40 rounded-xl text-xs font-bold font-tensura-sub tracking-wider transition flex items-center gap-1.5 text-sky-300"
          >
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            HERO WARDROBE
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold font-tensura-sub tracking-wider transition flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            HALL OF FAME
          </button>

          <button
            onClick={onOpenSpecs}
            className="px-3 py-1.5 bg-gradient-to-r from-sky-600 via-cyan-500 to-amber-500 hover:from-sky-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold font-tensura-sub tracking-wider shadow-lg shadow-sky-500/20 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            RTX & GPU
          </button>
        </div>
      </header>

      {/* Sekai Guide / Chronicle AI Dialogue Banner */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="p-3 bg-gradient-to-r from-sky-950/80 via-slate-900 to-sky-950/80 border border-sky-500/40 rounded-2xl flex items-center gap-3 shadow-md">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0 text-sky-300 text-sm">
            <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div className="text-xs text-sky-200 font-mono">
            <span className="font-bold text-amber-300 font-tensura mr-2">« SEKAI CHRONICLE NOTIFICATION »:</span>
            Super Boy Ren is attuned to the 1001 Dimensional Leylines. Armed with Dragon Katana & Super Slime Aura. Ready for adventure!
          </div>
        </div>
      </div>

      {/* Main Storybook Map Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kingdom Territories & Story Nodes */}
        <div className="lg:col-span-8 space-y-5">
          {/* Animatic Realm Nav Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {WORLD_DEFINITIONS.map(w => (
              <button
                key={w.worldNum}
                onClick={() => {
                  setActiveWorld(w.worldNum);
                  handleInspectLevel((w.worldNum - 1) * 100 + 1);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold font-tensura-sub uppercase tracking-wider whitespace-nowrap transition border ${
                  activeWorld === w.worldNum
                    ? 'bg-sky-600 border-sky-400 text-white shadow-lg shadow-sky-600/40 ring-2 ring-sky-400/40'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Realm {w.worldNum}: {w.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Animatic Illustrated Territory Banner */}
          <div
            className="p-6 rounded-3xl border-2 border-sky-500/40 relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950 shadow-2xl"
            style={{ borderLeft: `8px solid ${curWorldInfo.color}` }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Scroll className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono uppercase tracking-widest text-sky-400 font-bold">
                    STORYBOOK REALM {curWorldInfo.worldNum} OF 10
                  </span>
                </div>
                <h2 className="text-2xl font-black font-tensura text-white tracking-wide tensura-text-glow">{curWorldInfo.name}</h2>
                <p className="text-xs text-slate-300 mt-1 max-w-xl font-sans">{curWorldInfo.desc}</p>
              </div>

              {/* Quick Warp Input */}
              <form onSubmit={handleJumpToLevel} className="flex items-center gap-2 bg-slate-950/90 p-2 rounded-2xl border border-sky-500/30 shadow-inner">
                <input
                  type="number"
                  min="1"
                  max="1001"
                  value={targetLevelInput}
                  onChange={e => setTargetLevelInput(e.target.value)}
                  className="w-20 bg-transparent px-2 py-1 text-sm font-mono text-center text-white focus:outline-none"
                  placeholder="1-1001"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-xs font-bold font-tensura-sub rounded-xl text-white transition shadow"
                >
                  WARP
                </button>
              </form>
            </div>
          </div>

          {/* 100 Level Storybook Node Grid */}
          <div className="bg-slate-900/70 border-2 border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-tensura text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" />
                Select Storybook Stage ({startLvl} - {endLvl})
              </h3>
              <span className="text-xs text-slate-400 font-mono">1001 Animatic Stages</span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {worldLevels.map(lvl => {
                const isSelected = selectedLevel === lvl;
                const isBossLevel = lvl % 5 === 0;

                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      handleInspectLevel(lvl);
                    }}
                    className={`h-12 rounded-2xl flex flex-col items-center justify-center text-xs font-bold font-mono transition border relative ${
                      isSelected
                        ? 'bg-gradient-to-tr from-sky-600 via-cyan-500 to-amber-500 border-yellow-300 text-white shadow-xl shadow-sky-500/40 scale-105 z-10 ring-2 ring-yellow-400'
                        : isBossLevel
                        ? 'bg-red-950/50 border-red-500/50 text-red-200 hover:bg-red-900/60'
                        : 'bg-slate-950/80 border-slate-800/80 text-slate-300 hover:bg-slate-800 hover:border-sky-500/50'
                    }`}
                  >
                    <span>{lvl}</span>
                    {isBossLevel && (
                      <Swords className="w-3 h-3 text-amber-400 absolute bottom-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Level Inspection & Adventure Launch */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-slate-900 border-2 border-sky-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-sky-400 font-bold">
                  CHAPTER {selectedLevel} / 1001
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                  {selectedLevel > 800 ? 'GODLY TIER' : selectedLevel > 400 ? 'EXTREME' : 'NORMAL'}
                </span>
              </div>
              <h2 className="text-xl font-black font-tensura text-white mt-1 tensura-gold-glow">
                {aiLevelData?.title || `Stage ${selectedLevel}: ${curWorldInfo.name}`}
              </h2>
            </div>

            {/* AI Lore Box */}
            <div className="p-4 bg-slate-950/90 border border-sky-500/30 rounded-2xl space-y-2">
              <div className="text-xs font-bold font-tensura text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                SEKAI CHRONICLE LORE
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans italic">
                {isLoadingAi
                  ? 'Sekai Chronicle analyzing dimensional frequency...'
                  : aiLevelData?.lore ||
                    `Super Boy Ren equips his Dragon Slayer Katana and leaps into Chapter ${selectedLevel}. Slash through destructible barriers, defeat monsters, and ring the Torii Bell!` }
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-xs font-bold font-tensura-sub text-white">11-MINUTE MARATHON</div>
                    <div className="text-[10px] text-slate-400 font-mono">660s long distance pilgrimage</div>
                  </div>
                </div>
                <button
                  onClick={() => setMarathonMode(!marathonMode)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition ${
                    marathonMode ? 'bg-sky-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow" />
                </button>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold font-tensura-sub text-white">STAGE POWER MODIFIER</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {aiLevelData?.modifier || 'Dragon Katana Slash + Super Slime Aura Enabled'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Launch Play Button */}
            <button
              onClick={() => handleStartGame(selectedLevel)}
              className="w-full py-4 bg-gradient-to-r from-sky-600 via-cyan-500 to-amber-500 hover:from-sky-500 hover:to-amber-400 text-white font-black font-tensura text-lg tracking-wider rounded-2xl shadow-xl shadow-sky-600/40 transition transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-white" />
              COMMENCE ADVENTURE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
