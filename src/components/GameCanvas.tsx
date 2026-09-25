import React, { useRef, useEffect, useState } from 'react';
import { Heart, Star, Clock, Zap, Volume2, VolumeX, Pause, Play, Home, Sparkles, Sliders, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sword, Shield, Flame } from 'lucide-react';
import { ThreeRenderer } from '../engine/ThreeRenderer';
import { GameEngine } from '../engine/GameEngine';
import { generateLevel } from '../engine/levelGenerator';
import { Accessory, Costume, GraphicSettings, Skill } from '../types/game';
import { soundSynth } from '../utils/audioSynth';

interface Props {
  levelNumber: number;
  marathonMode: boolean;
  costume: Costume;
  accessory: Accessory;
  skill: Skill;
  graphicSettings: GraphicSettings;
  onLevelComplete: (stats: { score: number; time: number; coins: number; starCoins: number[] }) => void;
  onReturnToMap: () => void;
  onOpenSpecs: () => void;
}

export const GameCanvas: React.FC<Props> = ({
  levelNumber,
  marathonMode,
  costume,
  accessory,
  skill,
  graphicSettings,
  onLevelComplete,
  onReturnToMap,
  onOpenSpecs,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<ThreeRenderer | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [starCoins, setStarCoins] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [health, setHealth] = useState(3);
  const [energy, setEnergy] = useState(100);
  const [equippedPowerUp, setEquippedPowerUp] = useState<string | undefined>(undefined);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [greatSageDialogue, setGreatSageDialogue] = useState<string | null>('« Great Sage »: Dragon Katana & Slime Pet active. Ready for combat!');

  useEffect(() => {
    if (!containerRef.current) return;

    const generated = generateLevel(levelNumber, marathonMode);

    const renderer = new ThreeRenderer(containerRef.current, graphicSettings);
    rendererRef.current = renderer;

    const engine = new GameEngine(generated, costume, accessory, skill, {
      onComplete: stats => {
        onLevelComplete(stats);
      },
      onGameOver: () => {
        if (engineRef.current) {
          engineRef.current.player.x = generated.spawnX;
          engineRef.current.player.y = generated.spawnY;
          engineRef.current.player.vx = 0;
          engineRef.current.player.vy = 0;
          engineRef.current.player.isDead = false;
          engineRef.current.player.deathTimer = 0;
          engineRef.current.player.health = 3;
          engineRef.current.timeRemaining = generated.metadata.timeLimit;
        }
      },
      onDialogue: msg => {
        setGreatSageDialogue(msg);
        setTimeout(() => setGreatSageDialogue(null), 4000);
      },
    });
    engineRef.current = engine;

    soundSynth.startBGM(generated.metadata.theme);

    let lastTime = performance.now();
    let animId: number;

    const gameLoop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (engine && !engine.isPaused) {
        engine.update(dt);

        setScore(engine.player.score);
        setCoins(engine.player.coins);
        setStarCoins([...engine.player.starCoins]);
        setTimeRemaining(Math.ceil(engine.timeRemaining));
        setHealth(engine.player.health);
        setEnergy(Math.round(engine.player.energy));
        setEquippedPowerUp(engine.player.equippedPowerUp);

        renderer.syncBlocks(engine.level.blocks, engine.level.metadata.theme);
        renderer.syncEnemies(engine.level.enemies);
        renderer.syncItems(engine.level.items);
        renderer.syncProjectiles(engine.projectiles);
        renderer.syncHitSparks(engine.hitSparks);
        renderer.updatePlayer(engine.player, costume, accessory.id, engine.screenShakeTimer);
      }

      renderer.render();
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (engine.keys[e.code] !== undefined) {
        engine.keys[e.code] = true;
      }
      if (e.code === 'KeyP') {
        engine.isPaused = !engine.isPaused;
        setIsPaused(engine.isPaused);
      }
      if (e.code === 'KeyJ') {
        engine.performKatanaSlash();
      }
      if (e.code === 'KeyK') {
        engine.performHeavyPunch();
      }
      if (e.code === 'KeyU') {
        engine.performSlimeWaterBlade();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (engine.keys[e.code] !== undefined) {
        engine.keys[e.code] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const handleResize = () => {
      if (containerRef.current) {
        renderer.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      soundSynth.stopBGM();
      renderer.dispose();
    };
  }, [levelNumber, marathonMode, costume, accessory, skill]);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateGraphicSettings(graphicSettings);
    }
  }, [graphicSettings]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundSynth.setMuted(next);
  };

  const togglePause = () => {
    if (engineRef.current) {
      engineRef.current.isPaused = !engineRef.current.isPaused;
      setIsPaused(engineRef.current.isPaused);
    }
  };

  const handleButtonDown = (key: string) => {
    if (engineRef.current) {
      engineRef.current.keys[key] = true;
      if (key === 'KeyJ') engineRef.current.performKatanaSlash();
      if (key === 'KeyK') engineRef.current.performHeavyPunch();
      if (key === 'KeyU') engineRef.current.performSlimeWaterBlade();
    }
  };

  const handleButtonUp = (key: string) => {
    if (engineRef.current) {
      engineRef.current.keys[key] = false;
    }
  };

  return (
    <div className={`relative w-full h-full min-h-screen bg-slate-950 overflow-hidden select-none ${graphicSettings.crtFilter ? 'crt-overlay' : ''}`}>
      {/* 3D Three.js WebGL Canvas */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Top HUD Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 py-3 bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent flex items-center justify-between text-white font-tensura-sub pointer-events-none">
        {/* Left Stats */}
        <div className="flex items-center gap-4 sm:gap-6 pointer-events-auto">
          <div>
            <div className="text-[10px] text-sky-300 font-mono tracking-widest">SUPER BOY</div>
            <div className="text-xl font-black font-tensura text-amber-400 leading-none tensura-gold-glow">
              {score.toString().padStart(6, '0')}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-sky-300 font-mono tracking-widest">KOBAN</div>
            <div className="flex items-center gap-1 text-base font-bold font-tensura-sub text-yellow-300 leading-none">
              <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 inline-block shadow-sm" />
              ×{coins.toString().padStart(2, '0')}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-sky-300 font-mono tracking-widest">STAGE</div>
            <div className="text-base font-black font-tensura text-sky-300 leading-none">
              CH {levelNumber} <span className="text-xs text-slate-400 font-mono">/ 1001</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-sky-300 font-mono tracking-widest">TIME</div>
            <div className="flex items-center gap-1 text-base font-black font-tensura text-red-400 leading-none">
              <Clock className="w-3.5 h-3.5" />
              {timeRemaining}s
            </div>
          </div>
        </div>

        {/* Right HUD: HP, Star Coins, Actions */}
        <div className="flex items-center gap-3 sm:gap-4 pointer-events-auto">
          {/* Active Power-up Badge */}
          {equippedPowerUp && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-sky-500/20 border border-sky-400/40 rounded-xl text-sky-300 text-xs font-tensura-sub font-bold animate-pulse">
              <Sword className="w-3.5 h-3.5 text-amber-400" />
              {equippedPowerUp.toUpperCase()} ACTIVE
            </div>
          )}

          {/* 3 Star Coins */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 border border-slate-800 rounded-xl">
            {[1, 2, 3].map(coinIdx => (
              <Star
                key={coinIdx}
                className={`w-4 h-4 ${
                  starCoins.includes(coinIdx) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Player HP Hearts */}
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(h => (
              <Heart
                key={h}
                className={`w-5 h-5 ${
                  h <= health ? 'text-red-500 fill-red-500 animate-pulse' : 'text-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Quick Action Buttons */}
          <button
            onClick={toggleMute}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={togglePause}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 transition"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenSpecs}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-amber-400 transition"
            title="GPU Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={onReturnToMap}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-sky-400 transition"
            title="Exit to World Map"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sekai Guide Dialogue Balloon */}
      {greatSageDialogue && (
        <div className="absolute top-16 right-4 z-30 max-w-sm bg-gradient-to-br from-slate-900/95 via-sky-950/90 to-slate-900/95 border-2 border-sky-400/60 rounded-3xl p-3.5 shadow-2xl backdrop-blur-md text-xs text-sky-200 font-sans flex items-start gap-3 animate-in slide-in-from-top-2">
          <div className="w-7 h-7 rounded-xl bg-sky-500/30 border border-sky-400/50 flex items-center justify-center shrink-0 text-sky-300 text-xs">
            ⚔️
          </div>
          <div>
            <span className="font-bold text-amber-300 block mb-0.5 font-tensura tracking-wider">
              « SEKAI CHRONICLE / NAVI »:
            </span>
            {greatSageDialogue}
          </div>
        </div>
      )}

      {/* Attack & Controls Help Bottom Left */}
      <div className="absolute bottom-24 sm:bottom-6 left-4 z-20 pointer-events-none">
        <div className="bg-slate-950/85 border border-sky-500/40 rounded-2xl p-3 space-y-2 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 gap-4">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold font-tensura-sub">
              <Sword className="w-3.5 h-3.5" /> J: KATANA SLASH
            </span>
            <span className="text-cyan-400 font-bold font-tensura-sub">K: HEAVY PUNCH</span>
            <span className="text-sky-300 font-bold font-tensura-sub">U: WATER BLADE</span>
          </div>
          <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-amber-400 transition-all duration-150"
              style={{ width: `${energy}%` }}
            />
          </div>
        </div>
      </div>

      {/* On-Screen Touch Controls (Mobile / Tablet) */}
      <div className="absolute bottom-4 left-0 right-0 z-30 px-6 flex items-end justify-between pointer-events-none md:hidden">
        {/* D-PAD Left */}
        <div className="grid grid-cols-3 gap-1 pointer-events-auto bg-slate-950/80 p-2 rounded-3xl border border-sky-500/40 backdrop-blur-md">
          <div />
          <button
            onTouchStart={() => handleButtonDown('ArrowUp')}
            onTouchEnd={() => handleButtonUp('ArrowUp')}
            className="w-12 h-12 bg-slate-800 active:bg-sky-600 rounded-xl flex items-center justify-center text-white"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div />

          <button
            onTouchStart={() => handleButtonDown('ArrowLeft')}
            onTouchEnd={() => handleButtonUp('ArrowLeft')}
            className="w-12 h-12 bg-slate-800 active:bg-sky-600 rounded-xl flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-slate-900 rounded-xl" />
          <button
            onTouchStart={() => handleButtonDown('ArrowRight')}
            onTouchEnd={() => handleButtonUp('ArrowRight')}
            className="w-12 h-12 bg-slate-800 active:bg-sky-600 rounded-xl flex items-center justify-center text-white"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <div />
          <button
            onTouchStart={() => handleButtonDown('ArrowDown')}
            onTouchEnd={() => handleButtonUp('ArrowDown')}
            className="w-12 h-12 bg-slate-800 active:bg-sky-600 rounded-xl flex items-center justify-center text-white"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <div />
        </div>

        {/* Action Buttons Right (Slash, Punch, Slime Blade, Jump) */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-950/80 p-2 rounded-3xl border border-sky-500/40 backdrop-blur-md">
          <button
            onTouchStart={() => handleButtonDown('KeyU')}
            onTouchEnd={() => handleButtonUp('KeyU')}
            className="w-12 h-12 bg-sky-600 active:bg-sky-500 rounded-full flex flex-col items-center justify-center font-bold font-tensura-sub text-white text-[10px] shadow"
            title="Slime Water Blade"
          >
            SLIME
            <span className="text-[8px] font-mono">(U)</span>
          </button>

          <button
            onTouchStart={() => handleButtonDown('KeyK')}
            onTouchEnd={() => handleButtonUp('KeyK')}
            className="w-13 h-13 bg-amber-600 active:bg-amber-500 rounded-full flex flex-col items-center justify-center font-bold font-tensura-sub text-white text-xs shadow"
            title="Heavy Punch"
          >
            PUNCH
            <span className="text-[8px] font-mono">(K)</span>
          </button>

          <button
            onTouchStart={() => handleButtonDown('KeyJ')}
            onTouchEnd={() => handleButtonUp('KeyJ')}
            className="w-14 h-14 bg-gradient-to-tr from-sky-600 to-cyan-400 active:from-sky-500 active:to-cyan-300 rounded-full flex flex-col items-center justify-center font-black font-tensura-sub text-white text-xs shadow-lg"
            title="Katana Sword Slash"
          >
            SLASH
            <span className="text-[8px] font-mono">(J)</span>
          </button>

          <button
            onTouchStart={() => handleButtonDown('Space')}
            onTouchEnd={() => handleButtonUp('Space')}
            className="w-15 h-15 bg-gradient-to-tr from-red-600 to-amber-500 active:from-red-500 active:to-amber-400 rounded-full flex flex-col items-center justify-center font-black font-tensura-sub text-white text-sm shadow-xl"
            title="Jump / Double Jump"
          >
            JUMP
            <span className="text-[8px] font-mono">(Space)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
