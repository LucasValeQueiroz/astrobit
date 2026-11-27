import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('PWA manifest.webmanifest is valid JSON with standalone display and valid icon path', () => {
  const raw = readFileSync('manifest.webmanifest', 'utf8');
  const manifest = JSON.parse(raw);

  assert.equal(manifest.short_name, 'AstroBit');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 1);
  assert.equal(existsSync(manifest.icons[0].src), true, 'PWA icon file must exist');
});

test('Offline Service Worker sw.js exists and bypasses external API origins', () => {
  assert.equal(existsSync('sw.js'), true);
  const swSrc = readFileSync('sw.js', 'utf8');
  assert.match(swSrc, /self\.addEventListener\('install'/);
  assert.match(swSrc, /self\.addEventListener\('fetch'/);
  assert.match(swSrc, /url\.origin !== self\.location\.origin/);
});
