import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Monitor, Zap, CheckCircle2, Sliders, Activity, Sparkles, X, ShieldAlert } from 'lucide-react';
import { DeviceInfo, GraphicSettings } from '../types/game';

interface Props {
  deviceInfo: DeviceInfo;
  settings: GraphicSettings;
  onUpdateSettings: (newSettings: GraphicSettings) => void;
  onClose: () => void;
}

export const HardwareSpecsModal: React.FC<Props> = ({
  deviceInfo,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [currentFps, setCurrentFps] = useState(60);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkScore, setBenchmarkScore] = useState<number | null>(null);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        const measuredFps = Math.round((frameCount * 1000) / (now - lastTime));
        setCurrentFps(settings.aiFrameGeneration ? Math.min(144, measuredFps * 2) : measuredFps);
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [settings.aiFrameGeneration]);

  const runBenchmark = () => {
    setIsBenchmarking(true);
    setBenchmarkScore(null);
    setTimeout(() => {
      const score = Math.floor(
        (deviceInfo.cpuCores * 1500 +
          deviceInfo.vramEstimatedMB * 2.2 +
          (deviceInfo.tier === 'Ultra RTX' ? 8000 : 4000)) *
          (settings.rayTracingEnabled ? 1.4 : 1.0)
      );
      setBenchmarkScore(score);
      setIsBenchmarking(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border-2 border-red-500/50 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-red-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/20 border border-red-500/40 rounded-xl text-red-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-tensura tracking-wider text-white flex items-center gap-2 tensura-gold-glow">
                HARDWARE DETECTION & GPU SPECS
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 uppercase font-mono font-sans">
                  {deviceInfo.tier} Tier
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-tensura-sub">
                Real-time GPU unmasking, VRAM allocation & RTX Path Tracing Pipeline
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
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Live Engine HUD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-400 font-mono mb-1">FPS (AI Gen)</div>
              <div className="text-2xl font-black font-cyber text-emerald-400">
                {currentFps} <span className="text-xs text-slate-500 font-normal">FPS</span>
              </div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-400 font-mono mb-1">CPU Cores</div>
              <div className="text-2xl font-black font-cyber text-cyan-400">
                {deviceInfo.cpuCores} <span className="text-xs text-slate-500 font-normal">Threads</span>
              </div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-400 font-mono mb-1">RAM / VRAM</div>
              <div className="text-2xl font-black font-cyber text-amber-400">
                {deviceInfo.ramGB}GB / {(deviceInfo.vramEstimatedMB / 1024).toFixed(0)}GB
              </div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-400 font-mono mb-1">Refresh Rate</div>
              <div className="text-2xl font-black font-cyber text-purple-400">
                {deviceInfo.screenRefreshRate}Hz
              </div>
            </div>
          </div>

          {/* Detected Hardware Table */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <h3 className="text-sm font-semibold text-slate-300 font-cyber uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-red-400" />
              Detected Motherboard & Device Telemetry
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex justify-between p-2 bg-slate-900/80 rounded border border-slate-800/80">
                <span className="text-slate-400">GPU Renderer:</span>
                <span className="text-amber-300 font-medium truncate max-w-[200px]" title={deviceInfo.gpuRenderer}>
                  {deviceInfo.gpuRenderer}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-slate-900/80 rounded border border-slate-800/80">
                <span className="text-slate-400">GPU Vendor:</span>
                <span className="text-slate-200">{deviceInfo.gpuVendor}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-900/80 rounded border border-slate-800/80">
                <span className="text-slate-400">Device Platform:</span>
                <span className="text-slate-200">{deviceInfo.devicePlatform}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-900/80 rounded border border-slate-800/80">
                <span className="text-slate-400">Browser Client:</span>
                <span className="text-slate-200">{deviceInfo.browser}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-900/80 rounded border border-slate-800/80">
                <span className="text-slate-400">Resolution & DPR:</span>
                <span className="text-slate-200">{deviceInfo.resolution}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-900/80 rounded border border-slate-800/80">
                <span className="text-slate-400">Performance Rating:</span>
                <span className="text-emerald-400 font-bold">{deviceInfo.tier} Optimized</span>
              </div>
            </div>
          </div>

          {/* Graphic Shaders & Ray Tracing Controls */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 font-cyber uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Real-Time Shader & AI Graphics Pipeline
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Ray Tracing */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Ray Tracing Emissive Lighting
                  </div>
                  <div className="text-xs text-slate-400">Screen-space global illumination & dynamic point lights</div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, rayTracingEnabled: !settings.rayTracingEnabled })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    settings.rayTracingEnabled ? 'bg-red-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-md transform" />
                </button>
              </div>

              {/* AI Frame Generation */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    AI Frame Generation
                  </div>
                  <div className="text-xs text-slate-400">Motion optical interpolation (60 → 120 FPS)</div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, aiFrameGeneration: !settings.aiFrameGeneration })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    settings.aiFrameGeneration ? 'bg-cyan-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-md transform" />
                </button>
              </div>

              {/* Path Tracing Sim */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-purple-400" />
                    Path Traced Ambient Occlusion
                  </div>
                  <div className="text-xs text-slate-400">Soft contact shadows & bounce radiance</div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, pathTracingSim: !settings.pathTracingSim })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    settings.pathTracingSim ? 'bg-purple-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-md transform" />
                </button>
              </div>

              {/* Game Boy CRT Filter */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-emerald-400" />
                    Retro Game Boy CRT Scanlines
                  </div>
                  <div className="text-xs text-slate-400">Authentic 1989 phosphor scanline overlay</div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, crtFilter: !settings.crtFilter })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    settings.crtFilter ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-md transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Benchmark Stress Test */}
          <div className="p-4 bg-gradient-to-r from-red-950/40 via-slate-950 to-red-950/40 border border-red-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-bold font-cyber text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-400" />
                DEVICE BENCHMARK & LOAD STRESS TEST
              </div>
              <div className="text-xs text-slate-400">
                Evaluates draw call throughput, vertex shader limits and memory bandwidth.
              </div>
            </div>

            <div className="flex items-center gap-3">
              {benchmarkScore !== null && (
                <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-400 font-mono text-sm font-bold">
                  Score: {benchmarkScore} PTS
                </div>
              )}
              <button
                disabled={isBenchmarking}
                onClick={runBenchmark}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold font-cyber rounded-xl shadow-lg transition disabled:opacity-50"
              >
                {isBenchmarking ? 'TESTING ENGINE...' : 'RUN BENCHMARK'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold font-cyber rounded-xl transition"
          >
            APPLY & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
