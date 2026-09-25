import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Clock, Star, X, RefreshCw, Sparkles, UserCheck } from 'lucide-react';
import { LeaderboardRecord } from '../types/game';

interface Props {
  onClose: () => void;
}

export const LeaderboardModal: React.FC<Props> = ({ onClose }) => {
  const [entries, setEntries] = useState<LeaderboardRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'score' | 'speed' | 'level'>('score');

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.success && data.entries) {
        setEntries(data.entries);
      }
    } catch (e) {
      console.warn('Failed to fetch leaderboard:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const sortedEntries = [...entries].sort((a, b) => {
    if (filterMode === 'score') return b.score - a.score;
    if (filterMode === 'level') return b.level - a.level;
    return a.timeSeconds - b.timeSeconds;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600/20 border border-amber-500/40 rounded-xl text-amber-400">
              <Trophy className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-tensura tracking-wider text-white flex items-center gap-2 tensura-gold-glow">
                SUPER BOY SEKAI: HALL OF FAME
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                  CLOUD SYNCHRONIZED
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-tensura-sub">
                Real-time world rankings across all 1001 dimensions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLeaderboard}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Refresh Leaderboard"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setFilterMode('score')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-tensura-sub tracking-wider transition ${
              filterMode === 'score'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            HIGHEST SCORES
          </button>
          <button
            onClick={() => setFilterMode('level')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-tensura-sub tracking-wider transition ${
              filterMode === 'level'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            HIGHEST LEVEL
          </button>
          <button
            onClick={() => setFilterMode('speed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-tensura-sub tracking-wider transition ${
              filterMode === 'speed'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            SPEEDRUN CLOCKS
          </button>
        </div>

        {/* Leaderboard Table */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading && entries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-mono text-sm">
              Connecting to real-time cloud database...
            </div>
          ) : (
            <div className="space-y-2">
              {sortedEntries.map((rec, idx) => {
                const isTop3 = idx < 3;
                const medalColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];

                return (
                  <div
                    key={rec.id || idx}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                      isTop3
                        ? 'bg-gradient-to-r from-amber-950/30 via-slate-950 to-slate-900 border-amber-500/40 shadow'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 text-center font-black font-cyber text-lg flex items-center justify-center">
                        {isTop3 ? (
                          <Medal className={`w-6 h-6 ${medalColors[idx]}`} />
                        ) : (
                          <span className="text-slate-500">#{idx + 1}</span>
                        )}
                      </div>

                      <div>
                        <div className="font-bold font-cyber text-white text-base flex items-center gap-2">
                          {rec.playerName}
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {rec.characterTitle}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-3 mt-0.5">
                          <span>Level: {rec.level} / 1001</span>
                          <span>•</span>
                          <span>Device: {rec.deviceTier}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:justify-end">
                      <div className="text-right">
                        <div className="text-lg font-black font-cyber text-amber-400">
                          {rec.score.toLocaleString()} <span className="text-xs font-normal text-slate-400">PTS</span>
                        </div>
                        <div className="text-xs font-mono text-slate-400 flex items-center gap-2 justify-end">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            {rec.timeSeconds}s
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            {rec.starCoins || 3}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold font-cyber rounded-xl transition"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
