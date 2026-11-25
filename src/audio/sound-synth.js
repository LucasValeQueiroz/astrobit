/**
 * AstroBit Web Audio Space Sound Synthesizer — Zero binary assets, 100% MIT.
 * Synthesizes friendly, kid-safe musical space feedback with mute persistence.
 */

export const SOUND_MUTE_STORAGE_KEY = 'astrobit-muted';

export class SpaceSoundSynth {
  /**
   * @param {{ storage?: Storage, AudioContextCtor?: typeof AudioContext }} [options]
   */
  constructor(options = {}) {
    this.storage = options.storage ?? (typeof globalThis.localStorage !== 'undefined' ? globalThis.localStorage : null);
    this.AudioContextCtor =
      options.AudioContextCtor ??
      (typeof globalThis.AudioContext !== 'undefined'
        ? globalThis.AudioContext
        : typeof globalThis.webkitAudioContext !== 'undefined'
        ? globalThis.webkitAudioContext
        : null);
    this.ctx = null;
    this.muted = this._loadMutePref();
  }

  _loadMutePref() {
    if (!this.storage) return false;
    try {
      return this.storage.getItem(SOUND_MUTE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  isMuted() {
    return this.muted;
  }

  setMuted(value) {
    this.muted = Boolean(value);
    if (this.storage) {
      try {
        this.storage.setItem(SOUND_MUTE_STORAGE_KEY, String(this.muted));
      } catch {
        // Ignore private browsing storage restrictions
      }
    }
    return this.muted;
  }

  toggleMute() {
    return this.setMuted(!this.muted);
  }

  _ensureContext() {
    if (this.muted || !this.AudioContextCtor) return null;
    if (!this.ctx) {
      this.ctx = new this.AudioContextCtor();
    }
    if (this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  _tone({ freq = 440, endFreq = null, duration = 0.12, delay = 0, type = 'sine', gain = 0.14 }) {
    const ctx = this._ensureContext();
    if (!ctx) return false;

    const start = ctx.currentTime + delay;
    const stop = start + duration;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), stop);
    }

    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.linearRampToValueAtTime(gain, start + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, stop);

    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(start);
    osc.stop(stop + 0.01);
    return true;
  }

  playClick() {
    return this._tone({ freq: 520, endFreq: 680, duration: 0.05, type: 'triangle', gain: 0.09 });
  }

  playSnap() {
    // Crisp tactile jigsaw/LEGO click-clack snap
    this._tone({ freq: 420, endFreq: 760, duration: 0.055, type: 'triangle', gain: 0.13 });
    this._tone({ freq: 880, endFreq: 1120, duration: 0.045, delay: 0.035, type: 'sine', gain: 0.09 });
    return !this.muted && Boolean(this.AudioContextCtor);
  }

  playRemove() {
    return this._tone({ freq: 420, endFreq: 220, duration: 0.075, type: 'sine', gain: 0.09 });
  }

  playGiggle() {
    // Playful R2-D2 style happy robot chirp when poked
    const notes = [620, 840, 720, 1020];
    notes.forEach((freq, idx) => {
      this._tone({ freq, endFreq: freq * 1.12, duration: 0.065, delay: idx * 0.055, type: 'sine', gain: 0.11 });
    });
    return !this.muted && Boolean(this.AudioContextCtor);
  }

  playStep() {
    return this._tone({ freq: 280, endFreq: 340, duration: 0.08, type: 'triangle', gain: 0.11 });
  }

  playTurn() {
    return this._tone({ freq: 380, endFreq: 480, duration: 0.07, type: 'sine', gain: 0.09 });
  }

  playCollect(combo = 1) {
    const mult = Math.min(1.5, 1 + Math.max(0, Number(combo) - 1) * 0.09);
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      this._tone({ freq: freq * mult, duration: 0.13, delay: idx * 0.055, type: 'triangle', gain: 0.14 });
    });
    return !this.muted && Boolean(this.AudioContextCtor);
  }

  playToggle() {
    this._tone({ freq: 440, endFreq: 660, duration: 0.11, type: 'square', gain: 0.07 });
    this._tone({ freq: 660, endFreq: 880, duration: 0.12, delay: 0.08, type: 'sine', gain: 0.1 });
    return !this.muted && Boolean(this.AudioContextCtor);
  }

  playTeleport() {
    this._tone({ freq: 320, endFreq: 960, duration: 0.16, type: 'sine', gain: 0.12 });
    this._tone({ freq: 960, endFreq: 480, duration: 0.14, delay: 0.12, type: 'triangle', gain: 0.1 });
    return !this.muted && Boolean(this.AudioContextCtor);
  }

  playBump() {
    // Playful cartoon spring boing — never harsh or scary
    this._tone({ freq: 240, endFreq: 130, duration: 0.14, type: 'triangle', gain: 0.15 });
    this._tone({ freq: 160, endFreq: 210, duration: 0.12, delay: 0.11, type: 'sine', gain: 0.11 });
    return !this.muted && Boolean(this.AudioContextCtor);
  }

  playWin() {
    const melody = [
      { freq: 523.25, delay: 0, duration: 0.13 },
      { freq: 659.25, delay: 0.1, duration: 0.13 },
      { freq: 783.99, delay: 0.2, duration: 0.13 },
      { freq: 1046.5, delay: 0.32, duration: 0.28 },
      { freq: 783.99, delay: 0.56, duration: 0.12 },
      { freq: 1046.5, delay: 0.68, duration: 0.36 },
    ];
    for (const note of melody) {
      this._tone({ ...note, type: 'triangle', gain: 0.15 });
    }
    return !this.muted && Boolean(this.AudioContextCtor);
  }

  playRocketLaunch() {
    // Playful ascending spaceship whoosh when flying between planet bases
    this._tone({ freq: 140, endFreq: 520, duration: 0.34, delay: 0, type: 'sawtooth', gain: 0.06 });
    this._tone({ freq: 260, endFreq: 880, duration: 0.3, delay: 0.06, type: 'sine', gain: 0.1 });
    return !this.muted && Boolean(this.AudioContextCtor);
  }

  playIceSlide() {
    // Shimmering crystalline glide tone when skating on frozen planet ice
    this._tone({ freq: 740, endFreq: 1180, duration: 0.14, type: 'sine', gain: 0.09 });
    this._tone({ freq: 1120, endFreq: 1480, duration: 0.1, delay: 0.04, type: 'triangle', gain: 0.06 });
    return !this.muted && Boolean(this.AudioContextCtor);
  }

  playCratePush(slid = false) {
    // Tactile metallic push thud + ice curling shimmer when sliding
    this._tone({ freq: 185, endFreq: 120, duration: 0.11, type: 'triangle', gain: 0.14 });
    if (slid) {
      this._tone({ freq: 520, endFreq: 980, duration: 0.18, delay: 0.05, type: 'sine', gain: 0.08 });
    }
    return !this.muted && Boolean(this.AudioContextCtor);
  }

  playReentry() {
    // Atmospheric plasma descent swoosh when diving into a planet
    this._tone({ freq: 620, endFreq: 190, duration: 0.42, type: 'sawtooth', gain: 0.05 });
    this._tone({ freq: 440, endFreq: 220, duration: 0.36, delay: 0.06, type: 'sine', gain: 0.09 });
    return !this.muted && Boolean(this.AudioContextCtor);
  }

  playNewRecord() {
    // Bright arcade/ghost personal-best arpeggio
    const notes = [587.33, 739.99, 880.0, 1174.66];
    notes.forEach((freq, idx) => {
      this._tone({ freq, duration: 0.12, delay: idx * 0.065, type: 'triangle', gain: 0.13 });
    });
    return !this.muted && Boolean(this.AudioContextCtor);
  }

  playFanfare() {
    // Heroic space-saving celebration chord progression (world completion / ending)
    const notes = [
      { freq: 392.0, delay: 0, duration: 0.14 },
      { freq: 523.25, delay: 0.11, duration: 0.14 },
      { freq: 659.25, delay: 0.22, duration: 0.14 },
      { freq: 783.99, delay: 0.33, duration: 0.18 },
      { freq: 1046.5, delay: 0.48, duration: 0.45 },
      { freq: 1318.5, delay: 0.56, duration: 0.42 },
    ];
    for (const note of notes) {
      this._tone({ ...note, type: 'triangle', gain: 0.14 });
    }
    return !this.muted && Boolean(this.AudioContextCtor);
  }
}
