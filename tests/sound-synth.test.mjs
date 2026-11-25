import test from 'node:test';
import assert from 'node:assert/strict';
import { SpaceSoundSynth, SOUND_MUTE_STORAGE_KEY } from '../src/audio/sound-synth.js';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

function createFakeAudioContext() {
  let oscCount = 0;
  return class FakeAudioContext {
    constructor() {
      this.currentTime = 0;
      this.state = 'running';
      this.destination = {};
    }
    createOscillator() {
      oscCount += 1;
      return {
        type: 'sine',
        frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
        start() {},
        stop() {},
      };
    }
    createGain() {
      return {
        gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
      };
    }
    static getOscCount() {
      return oscCount;
    }
  };
}

test('SpaceSoundSynth persists mute preference and safely no-ops without Web Audio', () => {
  const storage = createMemoryStorage();
  const synthNoAudio = new SpaceSoundSynth({ storage, AudioContextCtor: null });
  assert.equal(synthNoAudio.isMuted(), false);
  assert.equal(synthNoAudio.playStep(), false);

  synthNoAudio.setMuted(true);
  assert.equal(storage.getItem(SOUND_MUTE_STORAGE_KEY), 'true');

  const reloaded = new SpaceSoundSynth({ storage, AudioContextCtor: null });
  assert.equal(reloaded.isMuted(), true);
});

test('SpaceSoundSynth synthesizes tones when unmuted and suppresses when muted', () => {
  const storage = createMemoryStorage();
  const FakeAudio = createFakeAudioContext();
  const synth = new SpaceSoundSynth({ storage, AudioContextCtor: FakeAudio });

  assert.equal(synth.playStep(), true);
  assert.equal(synth.playCollect(), true);
  assert.equal(synth.playWin(), true);
  const countBeforeMute = FakeAudio.getOscCount();
  assert.ok(countBeforeMute >= 11);

  synth.toggleMute();
  assert.equal(synth.isMuted(), true);
  assert.equal(synth.playBump(), false);
  assert.equal(FakeAudio.getOscCount(), countBeforeMute);
});

test('SpaceSoundSynth exposes cinematic SFX (ice slide, crate curling, re-entry, new record)', () => {
  const storage = createMemoryStorage();
  const FakeAudio = createFakeAudioContext();
  const synth = new SpaceSoundSynth({ storage, AudioContextCtor: FakeAudio });

  assert.equal(synth.playIceSlide(), true);
  assert.equal(synth.playCratePush(true), true);
  assert.equal(synth.playReentry(), true);
  assert.equal(synth.playNewRecord(), true);
  assert.ok(FakeAudio.getOscCount() >= 10);
});
