import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Star, Clock, ArrowRight, RotateCcw, Home, Sparkles } from 'lucide-react';

interface Props {
  levelNumber: number;
  score: number;
  timeSeconds: number;
  coins: number;
  starCoins: number[];
  onNextLevel: () => void;
  onRetry: () => void;
  onReturnToMap: () => void;
}

export const LevelClearModal: React.FC<Props> = ({
  levelNumber,
  score,
  timeSeconds,
  coins,
  starCoins,
  onNextLevel,
  onRetry,
  onReturnToMap,
}) => {
  useEffect(() => {
    // Trigger confetti explosion
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#ffffff'],
      });
    } catch (e) {
      // safe fallback
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in zoom-in-95">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-yellow-400 rounded-3xl shadow-2xl overflow-hidden text-slate-100 p-6 sm:p-8 space-y-6 text-center">
        {/* Banner */}
        <div>
          <div className="inline-flex p-3.5 bg-gradient-to-tr from-yellow-500 to-amber-400 rounded-2xl text-slate-950 shadow-lg shadow-yellow-500/30 mb-3 animate-bounce">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black font-tensura tracking-wider text-white tensura-gold-glow">
            STAGE CLEAR!
          </h2>
          <p className="text-xs font-tensura-sub uppercase tracking-widest text-amber-400 mt-1">
            DIMENSION LEVEL {levelNumber} CONQUERED
          </p>
        </div>

        {/* 3 Star Coins Big Display */}
        <div className="flex items-center justify-center gap-4 py-2">
          {[1, 2, 3].map(coinIdx => {
            const hasCollected = starCoins.includes(coinIdx);
            return (
              <div
                key={coinIdx}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition transform ${
                  hasCollected
                    ? 'bg-gradient-to-tr from-yellow-500 to-amber-300 border-yellow-200 text-slate-950 shadow-lg shadow-yellow-500/40 scale-110'
                    : 'bg-slate-950 border-slate-800 text-slate-700'
                }`}
              >
                <Star className={`w-7 h-7 ${hasCollected ? 'fill-slate-950' : 'text-slate-700'}`} />
              </div>
            );
          })}
        </div>

        {/* Stats Grid */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 grid grid-cols-3 gap-2 font-mono text-xs">
          <div>
            <div className="text-slate-400 mb-1 font-tensura-sub">TOTAL SCORE</div>
            <div className="text-lg font-black font-tensura text-amber-400">{score.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1 font-tensura-sub">CLEAR TIME</div>
            <div className="text-lg font-black font-tensura text-cyan-400">{timeSeconds}s</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1 font-tensura-sub">COINS</div>
            <div className="text-lg font-black font-tensura text-yellow-300">+{coins}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onNextLevel}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:from-red-500 hover:to-amber-400 text-white font-black font-tensura text-base tracking-wider rounded-2xl shadow-xl shadow-red-600/30 transition transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            NEXT DIMENSION (LEVEL {levelNumber + 1})
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onRetry}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold font-tensura-sub text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              RETRY STAGE
            </button>
            <button
              onClick={onReturnToMap}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold font-tensura-sub text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4" />
              WORLD MAP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
