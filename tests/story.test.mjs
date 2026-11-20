import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_LEVELS, CAMPAIGN_WORLDS } from '../src/levels/index.js';
import {
  INTRO_SCENES,
  ENDING_SCENES,
  WORLD_STORIES,
  LEVEL_STORIES,
  getWorldStory,
  getLevelStory,
} from '../src/story/campaign-story.js';
import { SpaceSoundSynth } from '../src/audio/sound-synth.js';
import { buildSmoothRoutePath } from '../src/ui/story-map.js';

test('campaign story covers intro, ending, all 5 worlds with 6 base coords, and all 30 levels in PT & EN', () => {
  assert.equal(INTRO_SCENES.length, 3);
  assert.equal(ENDING_SCENES.length, 3);

  for (const scene of [...INTRO_SCENES, ...ENDING_SCENES]) {
    assert.ok(scene.titlePt && scene.titleEn);
    assert.ok(scene.textPt && scene.textEn);
  }

  for (const w of CAMPAIGN_WORLDS) {
    const story = WORLD_STORIES[w.world];
    assert.ok(story, `Missing WORLD_STORIES entry for world ${w.world}`);
    assert.equal(story.baseCoords.length, w.levels.length);
    assert.ok(story.arrivalPt && story.arrivalEn);
    assert.ok(story.completedPt && story.completedEn);
    assert.equal(getWorldStory(w.world).world, w.world);
  }

  for (const lvl of ALL_LEVELS) {
    const entry = LEVEL_STORIES[lvl.id];
    assert.ok(entry, `Missing LEVEL_STORIES entry for level ${lvl.id}`);
    assert.ok(entry.briefPt && entry.briefEn);
    assert.ok(entry.winPt && entry.winEn);
    assert.equal(getLevelStory(lvl.id).briefPt, entry.briefPt);
  }
});

test('SpaceSoundSynth exposes rocket launch and fanfare cues cleanly without Web Audio', () => {
  const synth = new SpaceSoundSynth({ storage: null, AudioContextCtor: null });
  assert.equal(synth.playRocketLaunch(), false);
  assert.equal(synth.playFanfare(), false);
});

test('buildSmoothRoutePath constructs valid quadratic Bezier SVG routes for planet flight maps', () => {
  const d = buildSmoothRoutePath([
    { x: 80, y: 180 },
    { x: 200, y: 120 },
    { x: 320, y: 190 },
  ]);
  assert.ok(d.startsWith('M 80 180'));
  assert.ok(d.includes(' Q '));
  assert.ok(d.endsWith('320 190'));
  assert.equal(buildSmoothRoutePath([]), '');
});
