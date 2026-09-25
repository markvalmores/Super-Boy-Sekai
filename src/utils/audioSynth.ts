class SoundSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.35;
  private bgmGain: GainNode | null = null;
  private isBgmPlaying: boolean = false;
  private bgmInterval: number | null = null;
  private curBgmStep: number = 0;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(muted ? 0 : this.masterVolume * 0.35, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.bgmGain && this.ctx && !this.isMuted) {
      this.bgmGain.gain.setValueAtTime(this.masterVolume * 0.35, this.ctx.currentTime);
    }
  }

  // SWORD SLASH (Katana Arc Whoosh & Sharp Blade Cut)
  public playSwordSlash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

    gain.gain.setValueAtTime(this.masterVolume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // HEAVY PUNCH (Bass Punch Impact + Shockwave)
  public playHeavyPunch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.15);

    gain.gain.setValueAtTime(this.masterVolume * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // BLOCK / OBJECT DESTRUCTION SHATTER
  public playBlockShatter() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.14);

    gain.gain.setValueAtTime(this.masterVolume * 0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  // SLIME WATER BLADE / RIMURU WATER CUTTER
  public playSlimeWaterBlade() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.18);

    gain.gain.setValueAtTime(this.masterVolume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // TEKKEN FIGHTING GAME ELECTRIC HIT IMPACT SFX
  public playTekkenHitSpark(isCritical: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const punchOsc = this.ctx.createOscillator();
    const punchGain = this.ctx.createGain();
    punchOsc.type = 'triangle';
    punchOsc.frequency.setValueAtTime(isCritical ? 180 : 140, now);
    punchOsc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    punchGain.gain.setValueAtTime(this.masterVolume * 0.6, now);
    punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    punchOsc.connect(punchGain);
    punchGain.connect(this.ctx.destination);
    punchOsc.start(now);
    punchOsc.stop(now + 0.15);

    const electricOsc = this.ctx.createOscillator();
    const electricGain = this.ctx.createGain();
    electricOsc.type = 'sawtooth';
    electricOsc.frequency.setValueAtTime(isCritical ? 1200 : 850, now);
    electricOsc.frequency.exponentialRampToValueAtTime(150, now + 0.14);

    electricGain.gain.setValueAtTime(this.masterVolume * 0.5, now);
    electricGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    electricOsc.connect(electricGain);
    electricGain.connect(this.ctx.destination);
    electricOsc.start(now);
    electricOsc.stop(now + 0.16);
  }

  // TEKKEN KO IMPACT BURST
  public playKOBurst() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const rumbleOsc = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumbleOsc.type = 'sawtooth';
    rumbleOsc.frequency.setValueAtTime(260, now);
    rumbleOsc.frequency.exponentialRampToValueAtTime(35, now + 0.4);

    rumbleGain.gain.setValueAtTime(this.masterVolume * 0.65, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    rumbleOsc.connect(rumbleGain);
    rumbleGain.connect(this.ctx.destination);
    rumbleOsc.start(now);
    rumbleOsc.stop(now + 0.45);

    [523.25, 659.25, 783.99].forEach(freq => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(this.masterVolume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  // SFX: Jump
  public playJump(isSuper: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(isSuper ? 240 : 180, now);
    osc.frequency.exponentialRampToValueAtTime(isSuper ? 700 : 460, now + 0.15);

    gain.gain.setValueAtTime(this.masterVolume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // SFX: Coin
  public playCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now);
    osc.frequency.setValueAtTime(1318.51, now + 0.08);

    gain.gain.setValueAtTime(this.masterVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // SFX: Star Coin
  public playStarCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(this.masterVolume * 0.45, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  // SFX: Block Bump / Hit
  public playBlockBump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);

    gain.gain.setValueAtTime(this.masterVolume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // SFX: Powerup
  public playPowerup() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [330, 392, 659, 523, 587, 784];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.07;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(this.masterVolume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.08);
    });
  }

  // SFX: Flagpole & Victory
  public playFlagpole() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.8);

    gain.gain.setValueAtTime(this.masterVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.85);

    setTimeout(() => {
      this.playVictoryFanfare();
    }, 850);
  }

  public playVictoryFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const victoryNotes = [
      { f: 523.25, d: 0.12 },
      { f: 659.25, d: 0.12 },
      { f: 783.99, d: 0.12 },
      { f: 1046.50, d: 0.25 },
      { f: 880.00, d: 0.15 },
      { f: 1046.50, d: 0.5 }
    ];

    let t = now;
    victoryNotes.forEach(n => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(n.f, t);

      gain.gain.setValueAtTime(this.masterVolume * 0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + n.d);
      t += n.d + 0.03;
    });
  }

  public playHurt() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.playTekkenHitSpark(true);
  }

  // Background Music (Tensura & Anime Adventure Melody)
  public startBGM(theme: string = 'grassland') {
    if (this.isBgmPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume * 0.25, this.ctx.currentTime);
    this.bgmGain.connect(this.ctx.destination);

    // Dynamic Adventure & Tensura theme
    const melodyMap: Record<string, number[]> = {
      grassland: [523, 659, 784, 1046, 0, 880, 784, 659, 587, 659, 784, 880, 0, 784, 659, 523],
      cavern: [330, 392, 440, 494, 0, 440, 392, 330, 294, 330, 392, 440, 0, 392, 330, 262],
      volcano: [220, 246, 261, 293, 330, 293, 261, 246, 220, 0, 220, 330, 440, 0, 330, 220],
      sky: [784, 880, 988, 1046, 0, 988, 880, 784, 659, 784, 880, 988, 0, 880, 784, 523],
      celestial: [523, 659, 784, 1046, 1318, 1046, 784, 659, 587, 698, 880, 1174, 1396, 1174, 880, 698]
    };

    const notes = melodyMap[theme] || melodyMap.grassland;
    this.curBgmStep = 0;

    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || !this.bgmGain || this.isMuted) return;
      const freq = notes[this.curBgmStep % notes.length];
      this.curBgmStep++;

      if (freq > 0) {
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = theme === 'celestial' ? 'sine' : 'square';
        osc.frequency.setValueAtTime(freq, now);

        noteGain.gain.setValueAtTime(0.28, now);
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(noteGain);
        noteGain.connect(this.bgmGain);

        osc.start(now);
        osc.stop(now + 0.12);
      }
    }, 150);
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const soundSynth = new SoundSynth();
