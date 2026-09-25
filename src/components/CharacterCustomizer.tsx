import React from 'react';
import { X, Shield, Zap, Sparkles, Feather, Eye, Flame, Wind, ArrowUpCircle, Check, Lock } from 'lucide-react';
import { Accessory, Costume, Skill } from '../types/game';
import { ACCESSORIES, COSTUMES, SKILLS } from '../data/itemsData';

interface Props {
  equippedCostume: Costume;
  equippedAccessory: Accessory;
  equippedSkill: Skill;
  unlockedLevel: number;
  onEquipCostume: (c: Costume) => void;
  onEquipAccessory: (a: Accessory) => void;
  onEquipSkill: (s: Skill) => void;
  onClose: () => void;
}

export const CharacterCustomizer: React.FC<Props> = ({
  equippedCostume,
  equippedAccessory,
  equippedSkill,
  unlockedLevel,
  onEquipCostume,
  onEquipAccessory,
  onEquipSkill,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-pink-500/50 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-600/20 border border-sky-500/40 rounded-xl text-sky-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-tensura tracking-wider text-white tensura-text-glow">
                SUPER BOY SEKAI: HERO WARDROBE & SKILL FORGE
              </h2>
              <p className="text-xs text-slate-400 font-tensura-sub">
                Equip Super Boy Sekai hero longcoats, Otaku streetwear, Shinobi robes, and Dragon Katana skills
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8">
          {/* Costumes Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold font-tensura text-sky-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Hero Outfits & Longcoats
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {COSTUMES.map(c => {
                const isEquipped = equippedCostume.id === c.id;
                const isUnlocked = unlockedLevel >= c.unlockedAtLevel;

                return (
                  <button
                    key={c.id}
                    disabled={!isUnlocked}
                    onClick={() => onEquipCostume(c)}
                    className={`p-4 rounded-xl border text-left transition relative flex flex-col justify-between ${
                      isEquipped
                        ? 'bg-gradient-to-br from-sky-950/80 to-slate-900 border-sky-500 ring-2 ring-sky-500/40 shadow-lg'
                        : isUnlocked
                        ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        : 'bg-slate-950/40 border-slate-900 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {c.rarity}
                        </span>
                        {isEquipped && (
                          <span className="flex items-center gap-1 text-xs font-bold text-sky-400 font-tensura-sub">
                            <Check className="w-3.5 h-3.5" /> EQUIPPED
                          </span>
                        )}
                        {!isUnlocked && (
                          <span className="flex items-center gap-1 text-xs font-mono text-slate-500">
                            <Lock className="w-3.5 h-3.5" /> LVL {c.unlockedAtLevel}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold font-tensura text-white mt-2">{c.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 font-sans">{c.description}</p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] font-mono text-amber-300">
                      <span>Speed +{c.speedBonus}</span>
                      <span>•</span>
                      <span>Jump +{c.jumpBonus}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accessories Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold font-tensura text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Feather className="w-4 h-4" />
              Sekai Relics & Companions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ACCESSORIES.map(a => {
                const isEquipped = equippedAccessory.id === a.id;
                const isUnlocked = unlockedLevel >= a.unlockedAtLevel;

                return (
                  <button
                    key={a.id}
                    disabled={!isUnlocked}
                    onClick={() => onEquipAccessory(a)}
                    className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                      isEquipped
                        ? 'bg-gradient-to-br from-cyan-950/80 to-slate-900 border-cyan-500 ring-2 ring-cyan-500/40 shadow-lg'
                        : isUnlocked
                        ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        : 'bg-slate-950/40 border-slate-900 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {a.name}
                        </span>
                        {isEquipped && (
                          <span className="flex items-center gap-1 text-xs font-bold text-cyan-400 font-tensura-sub">
                            <Check className="w-3.5 h-3.5" /> ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-2 font-sans">{a.description}</p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-cyan-300">
                      {a.passiveBuff}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skills Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold font-tensura text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Hero Battle Skills & Jutsu
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SKILLS.map(s => {
                const isEquipped = equippedSkill.id === s.id;

                return (
                  <button
                    key={s.id}
                    onClick={() => onEquipSkill(s)}
                    className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                      isEquipped
                        ? 'bg-gradient-to-br from-amber-950/80 to-slate-900 border-amber-500 ring-2 ring-amber-500/40 shadow-lg'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold font-tensura text-white">{s.name}</h4>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300">
                          Key: {s.keybind}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-sans">{s.description}</p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-amber-300">
                      <span>Cooldown: {s.cooldown}s</span>
                      <span>Energy Cost: {s.energyCost} EP</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-amber-600 hover:from-sky-500 hover:to-amber-500 text-white font-bold font-tensura rounded-xl transition shadow-lg"
          >
            CONFIRM HERO LOADOUT
          </button>
        </div>
      </div>
    </div>
  );
};
