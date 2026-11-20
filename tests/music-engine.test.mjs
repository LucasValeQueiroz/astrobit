import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORLD_THEMES,
  getThemeForWorld,
  computeStepIntervalMs,
  SpaceMusicEngine,
} from '../src/audio/music-engine.js';

test('WORLD_THEMES covers all 6 planets and Turbo mode accelerates step tempo cleanly', () => {
  for (let w = 1; w <= 6; w++) {
    const theme = getThemeForWorld(w);
    assert.ok(theme.bpm >= 100, `World ${w} theme should have valid BPM`);
    assert.ok(theme.notes.length === 8, `World ${w} theme should have 8-step melody`);
    const normalMs = computeStepIntervalMs(w, { turbo: false, running: false });
    const turboMs = computeStepIntervalMs(w, { turbo: true, running: true });
    assert.ok(turboMs < normalMs, `World ${w} Turbo mode must play faster than normal`);
  }
  assert.equal(getThemeForWorld(99), WORLD_THEMES[1]);
});

test('SpaceMusicEngine toggles mute and safely no-ops without Web Audio', () => {
  const engine = new SpaceMusicEngine(true);
  assert.equal(engine.isMuted(), true);
  engine.unlockAndStart();
  assert.equal(engine.toggleMute(), false);
  engine.setWorld(6);
  engine.setTempoState({ turbo: true, running: true });
  engine.stop();
  assert.equal(engine.toggleMute(), true);
});
