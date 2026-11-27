/**
 * AstroBit Block-to-Code Transpiler (JavaScript & Python).
 * Produces clean, idiomatic code with a 1-based `blockToLine` map so the UI can
 * highlight the exact line of real code while the robot executes step by step.
 */

import { normalizeProgram } from './interpreter.js';

const JS_SENSORS = {
  path_clear: 'robot.isPathClear()',
  path_blocked: 'robot.isPathBlocked()',
  crystal_here: 'robot.hasCrystalHere()',
  crystal_ahead: 'robot.hasCrystalAhead()',
  laser_ahead: 'robot.hasLaserAhead()',
  button_here: 'robot.isOnButton()',
};

const PY_SENSORS = {
  path_clear: 'robot.is_path_clear()',
  path_blocked: 'robot.is_path_blocked()',
  crystal_here: 'robot.has_crystal_here()',
  crystal_ahead: 'robot.has_crystal_ahead()',
  laser_ahead: 'robot.has_laser_ahead()',
  button_here: 'robot.is_on_button()',
};

const JS_SIMPLE = {
  up: 'robot.moveUp();',
  down: 'robot.moveDown();',
  move_left: 'robot.moveLeft();',
  move_right: 'robot.moveRight();',
  forward: 'robot.moveForward();',
  left: 'robot.turnLeft();',
  right: 'robot.turnRight();',
  collect: 'robot.collect();',
};

const PY_SIMPLE = {
  up: 'robot.move_up()',
  down: 'robot.move_down()',
  move_left: 'robot.move_left()',
  move_right: 'robot.move_right()',
  forward: 'robot.move_forward()',
  left: 'robot.turn_left()',
  right: 'robot.turn_right()',
  collect: 'robot.collect()',
};

/**
 * Transpiles an AstroBit block AST into JavaScript or Python source code.
 * @param {object|Array} program
 * @param {{ lang?: 'js'|'python' }} [options]
 */
export function transpileProgram(program, { lang = 'js' } = {}) {
  const isPy = lang === 'python';
  const norm = normalizeProgram(program);
  const lines = [];
  const blockToLine = {};

  const pushLine = (text, blockId = null) => {
    lines.push(text);
    if (blockId) {
      blockToLine[blockId] = lines.length; // 1-based line number
    }
  };

  const emitBlocks = (blocks, indent, loopDepth) => {
    const pad = '  '.repeat(indent);
    if (!blocks || blocks.length === 0) {
      pushLine(`${pad}${isPy ? 'pass' : '// vazio'}`);
      return;
    }

    for (const block of blocks) {
      if (!block || typeof block !== 'object') continue;
      const id = block.id ?? null;

      if (JS_SIMPLE[block.type]) {
        pushLine(`${pad}${isPy ? PY_SIMPLE[block.type] : JS_SIMPLE[block.type]}`, id);
      } else if (block.type === 'wait') {
        const ch = block.channel ? String(block.channel) : '';
        const stmt = isPy
          ? ch
            ? `robot.wait_for_signal('${ch}')`
            : 'robot.wait()'
          : ch
            ? `await robot.waitForSignal('${ch}');`
            : 'await robot.wait();';
        pushLine(`${pad}${stmt}`, id);
      } else if (block.type === 'repeat') {
        const times = Math.max(0, Math.min(99, Math.floor(Number(block.times) || 0)));
        if (isPy) {
          pushLine(`${pad}for _ in range(${times}):`, id);
          emitBlocks(block.body, indent + 1, loopDepth + 1);
        } else {
          const idxVar = loopDepth === 0 ? 'i' : loopDepth === 1 ? 'j' : `k${loopDepth}`;
          pushLine(`${pad}for (let ${idxVar} = 0; ${idxVar} < ${times}; ${idxVar}++) {`, id);
          emitBlocks(block.body, indent + 1, loopDepth + 1);
          pushLine(`${pad}}`);
        }
      } else if (block.type === 'if') {
        const cond = (isPy ? PY_SENSORS : JS_SENSORS)[block.sensor] || 'true';
        const hasElse = Array.isArray(block.else) && block.else.length > 0;
        if (isPy) {
          pushLine(`${pad}if ${cond}:`, id);
          emitBlocks(block.then, indent + 1, loopDepth);
          if (hasElse) {
            pushLine(`${pad}else:`);
            emitBlocks(block.else, indent + 1, loopDepth);
          }
        } else {
          pushLine(`${pad}if (${cond}) {`, id);
          emitBlocks(block.then, indent + 1, loopDepth);
          if (hasElse) {
            pushLine(`${pad}} else {`);
            emitBlocks(block.else, indent + 1, loopDepth);
          }
          pushLine(`${pad}}`);
        }
      } else if (block.type === 'call') {
        const fnName = String(block.fn || 'F1').toLowerCase();
        pushLine(`${pad}${fnName}()${isPy ? '' : ';'}`, id);
      }
    }
  };

  for (const fnKey of ['F1', 'F2']) {
    const fnBlocks = norm.functions[fnKey];
    if (fnBlocks && fnBlocks.length > 0) {
      const fnName = fnKey.toLowerCase();
      if (isPy) {
        pushLine(`def ${fnName}():`);
        emitBlocks(fnBlocks, 1, 0);
      } else {
        pushLine(`function ${fnName}() {`);
        emitBlocks(fnBlocks, 1, 0);
        pushLine('}');
      }
      pushLine('');
    }
  }

  if (norm.main.length === 0 && lines.length === 0) {
    pushLine(isPy ? '# Adicione blocos para começar!' : '// Adicione blocos para começar!');
  } else {
    emitBlocks(norm.main, 0, 0);
  }

  return {
    lang: isPy ? 'python' : 'js',
    code: lines.join('\n'),
    lines,
    blockToLine,
  };
}
