/**
 * AstroBit Interactive Procedural Space Soundtrack (100% zero-asset Web Audio API).
 * Features 6 distinct musical themes (1 per planet/world), adapts BPM automatically
 * in Turbo mode, and adds an upbeat bass pulse while AstroBit is executing a program!
 */

export const WORLD_THEMES = {
  // World 1: Moon of Crystals — dreamy C major pentatonic arpeggio
  1: {
    bpm: 108,
    wave: 'triangle',
    notes: [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 587.33, 659.25],
    bass: [130.81, 0, 196.0, 0, 146.83, 0, 196.0, 0],
  },
  // World 2: Gear Planet — bouncy playful chiptune (G major)
  2: {
    bpm: 122,
    wave: 'square',
    notes: [392.0, 493.88, 587.33, 783.99, 659.25, 587.33, 493.88, 587.33],
    bass: [196.0, 0, 146.83, 0, 164.81, 0, 146.83, 0],
  },
  // World 3: Laser Belt — cool synthwave minor pulse (A minor)
  3: {
    bpm: 126,
    wave: 'sawtooth',
    notes: [440.0, 523.25, 659.25, 523.25, 392.0, 493.88, 587.33, 493.88],
    bass: [110.0, 110.0, 130.81, 0, 98.0, 98.0, 123.47, 0],
  },
  // World 4: Function Station — crisp sci-fi precision (D major)
  4: {
    bpm: 118,
    wave: 'triangle',
    notes: [587.33, 739.99, 880.0, 1174.66, 880.0, 739.99, 659.25, 739.99],
    bass: [146.83, 0, 220.0, 0, 164.81, 0, 220.0, 0],
  },
  // World 5: Engineer Nebula — heroic cosmic anthem (E minor / G major)
  5: {
    bpm: 132,
    wave: 'triangle',
    notes: [659.25, 783.99, 987.77, 1318.51, 987.77, 880.0, 783.99, 987.77],
    bass: [164.81, 0, 196.0, 0, 146.83, 0, 196.0, 0],
  },
  // World 6: Wormhole Dimension — hypnotic quantum shimmer (F# minor / Lydian)
  6: {
    bpm: 136,
    wave: 'sine',
    notes: [739.99, 880.0, 1108.73, 1479.98, 1108.73, 987.77, 880.0, 1108.73],
    bass: [185.0, 0, 146.83, 0, 164.81, 0, 185.0, 0],
  },
  // World 7: Frozen Planet — crystalline polar bells (C# / E shimmer)
  7: {
    bpm: 120,
    wave: 'sine',
    notes: [659.25, 830.61, 987.77, 1318.51, 1174.66, 987.77, 830.61, 987.77],
    bass: [164.81, 0, 207.65, 0, 146.83, 0, 196.0, 0],
  },
};

export function getThemeForWorld(worldNumber = 1) {
  return WORLD_THEMES[worldNumber] || WORLD_THEMES[1];
}

export function computeStepIntervalMs(worldNumber = 1, { turbo = false, running = false } = {}) {
  const theme = getThemeForWorld(worldNumber);
  const mult = (turbo ? 1.32 : 1.0) * (running ? 1.08 : 1.0);
  const effectiveBpm = theme.bpm * mult;
  // Eighth-note step interval in ms
  return Math.max(95, Math.round((60_000 / effectiveBpm) / 2));
}

export class SpaceMusicEngine {
  constructor(initialMuted = false) {
    this._muted = Boolean(initialMuted);
    this._world = 1;
    this._turbo = false;
    this._running = false;
    this._step = 0;
    this._timer = null;
    this._ctx = null;
    this._started = false;
  }

  isMuted() {
    return this._muted;
  }

  setMuted(muted) {
    this._muted = Boolean(muted);
    if (this._muted) {
      this.stop();
    } else if (this._started) {
      this._scheduleNext();
    }
  }

  toggleMute() {
    this.setMuted(!this._muted);
    if (!this._muted) {
      this.unlockAndStart();
    }
    return this._muted;
  }

  setWorld(worldNumber) {
    this._world = Number(worldNumber) || 1;
  }

  setTempoState({ turbo, running } = {}) {
    if (typeof turbo === 'boolean') this._turbo = turbo;
    if (typeof running === 'boolean') this._running = running;
  }

  unlockAndStart() {
    this._started = true;
    if (this._muted) return;
    if (!this._ensureContext()) return;
    if (!this._timer) {
      this._scheduleNext();
    }
  }

  stop() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  _ensureContext() {
    const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this._ctx) {
      try {
        this._ctx = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (this._ctx.state === 'suspended') {
      this._ctx.resume?.().catch?.(() => {});
    }
    return this._ctx;
  }

  _scheduleNext() {
    if (this._muted) return;
    this._playStep();
    const delay = computeStepIntervalMs(this._world, {
      turbo: this._turbo,
      running: this._running,
    });
    this._timer = setTimeout(() => {
      this._timer = null;
      this._scheduleNext();
    }, delay);
  }

  _playStep() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const theme = getThemeForWorld(this._world);
    const idx = this._step % theme.notes.length;
    this._step += 1;

    const now = ctx.currentTime;
    const leadFreq = theme.notes[idx];
    if (leadFreq > 0) {
      this._tone(ctx, leadFreq, theme.wave, now, 0.14, theme.wave === 'sawtooth' || theme.wave === 'square' ? 0.022 : 0.045);
    }

    const bassFreq = theme.bass[idx];
    if (bassFreq > 0) {
      const bassGain = this._running ? 0.055 : 0.032;
      this._tone(ctx, bassFreq, 'triangle', now, 0.19, bassGain);
    }
  }

  _tone(ctx, freq, type, startTime, duration, peakGain) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);
    } catch {
      // Safe no-op in headless/unsupported contexts
    }
  }
}
