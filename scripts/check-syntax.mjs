/**
 * Fast zero-dependency syntax checker for all JS/MJS modules in src/ and tests/.
 * Run via `npm run check` or `npm run verify`.
 */

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function collectJsFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      collectJsFiles(full, out);
    } else if (name.endsWith('.js') || name.endsWith('.mjs')) {
      out.push(full);
    }
  }
  return out;
}

const files = [...collectJsFiles('src'), ...collectJsFiles('tests')];
let failed = 0;

for (const file of files) {
  const res = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (res.status !== 0) {
    console.error(`Syntax error in ${file}:\n${res.stderr}`);
    failed += 1;
  }
}

if (failed > 0) {
  process.exit(1);
}
console.log(`✔ Syntax check passed for all ${files.length} JS/MJS files.`);
