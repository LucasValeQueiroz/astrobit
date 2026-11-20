/**
 * AstroBit Jigsaw Puzzle Workspace — Interlocking Scratch-style puzzle pieces,
 * 4-direction compass palette, C-shaped Repeat & If-Sensor clamps, F1/F2 Function stacks,
 * drag-from-palette, drag-to-reorder, and pure AST helpers.
 */

let nextBlockSeq = 1;

export const SENSOR_OPTIONS = [
  'crystal_here',
  'button_here',
  'laser_ahead',
  'path_clear',
  'path_blocked',
];

export function createBlock(type) {
  const id = `b${nextBlockSeq++}`;
  if (type === 'repeat') {
    return { id, type: 'repeat', times: 3, body: [] };
  }
  if (type === 'if') {
    return { id, type: 'if', sensor: 'crystal_here', then: [] };
  }
  if (type === 'call_f1') {
    return { id, type: 'call', fn: 'F1' };
  }
  if (type === 'call_f2') {
    return { id, type: 'call', fn: 'F2' };
  }
  return { id, type };
}

export function cloneBlocks(blocks = []) {
  return JSON.parse(JSON.stringify(blocks));
}

function getChildList(item) {
  if (item.type === 'repeat') {
    item.body = Array.isArray(item.body) ? item.body : [];
    return item.body;
  }
  if (item.type === 'if') {
    item.then = Array.isArray(item.then) ? item.then : [];
    return item.then;
  }
  return null;
}

export function appendBlockToTarget(blocks, targetId, newBlock) {
  const copy = cloneBlocks(blocks);
  if (!targetId) {
    copy.push(newBlock);
    return copy;
  }

  const insertRecursive = (list) => {
    for (const item of list) {
      const children = getChildList(item);
      if (item.id === targetId && children) {
        children.push(newBlock);
        return true;
      }
      if (children && insertRecursive(children)) return true;
    }
    return false;
  };

  if (!insertRecursive(copy)) {
    copy.push(newBlock);
  }
  return copy;
}

export function insertBlockRelative(blocks, anchorBlockId, newBlock, position = 'after') {
  const copy = cloneBlocks(blocks);
  const insertRec = (list) => {
    const idx = list.findIndex((b) => b.id === anchorBlockId);
    if (idx !== -1) {
      const insertAt = position === 'before' ? idx : idx + 1;
      list.splice(insertAt, 0, newBlock);
      return true;
    }
    for (const item of list) {
      const children = getChildList(item);
      if (children && insertRec(children)) return true;
    }
    return false;
  };
  if (!insertRec(copy)) {
    copy.push(newBlock);
  }
  return copy;
}

export function removeBlockById(blocks, blockId) {
  const copy = cloneBlocks(blocks);
  const removeRec = (list) => {
    const idx = list.findIndex((b) => b.id === blockId);
    if (idx !== -1) {
      list.splice(idx, 1);
      return true;
    }
    for (const item of list) {
      const children = getChildList(item);
      if (children && removeRec(children)) return true;
    }
    return false;
  };
  removeRec(copy);
  return copy;
}

export function moveBlockInList(blocks, blockId, delta) {
  const copy = cloneBlocks(blocks);
  const moveRec = (list) => {
    const idx = list.findIndex((b) => b.id === blockId);
    if (idx !== -1) {
      const target = idx + delta;
      if (target >= 0 && target < list.length) {
        const [item] = list.splice(idx, 1);
        list.splice(target, 0, item);
      }
      return true;
    }
    for (const item of list) {
      const children = getChildList(item);
      if (children && moveRec(children)) return true;
    }
    return false;
  };
  moveRec(copy);
  return copy;
}

export function updateRepeatTimes(blocks, blockId, delta) {
  const copy = cloneBlocks(blocks);
  const updateRec = (list) => {
    for (const item of list) {
      if (item.id === blockId && item.type === 'repeat') {
        const current = Number(item.times) || 2;
        item.times = Math.max(2, Math.min(9, current + delta));
        return true;
      }
      const children = getChildList(item);
      if (children && updateRec(children)) return true;
    }
    return false;
  };
  updateRec(copy);
  return copy;
}

export function updateIfSensor(blocks, blockId, sensor) {
  const copy = cloneBlocks(blocks);
  const updateRec = (list) => {
    for (const item of list) {
      if (item.id === blockId && item.type === 'if') {
        item.sensor = SENSOR_OPTIONS.includes(sensor) ? sensor : SENSOR_OPTIONS[0];
        return true;
      }
      const children = getChildList(item);
      if (children && updateRec(children)) return true;
    }
    return false;
  };
  updateRec(copy);
  return copy;
}

export function findBlockById(blocks, blockId) {
  for (const b of blocks) {
    if (b.id === blockId) return b;
    const children = b.type === 'repeat' ? b.body : b.type === 'if' ? b.then : null;
    if (Array.isArray(children)) {
      const found = findBlockById(children, blockId);
      if (found) return found;
    }
  }
  return null;
}

export function findContainerExists(blocks, targetId) {
  if (!targetId) return true;
  for (const item of blocks) {
    if (item.id === targetId && (item.type === 'repeat' || item.type === 'if')) return true;
    const children = item.type === 'repeat' ? item.body : item.type === 'if' ? item.then : null;
    if (Array.isArray(children) && findContainerExists(children, targetId)) return true;
  }
  return false;
}

export const BLOCK_META = {
  up: { icon: '⬆️', category: 'dir-up' },
  down: { icon: '⬇️', category: 'dir-down' },
  move_left: { icon: '⬅️', category: 'dir-left' },
  move_right: { icon: '➡️', category: 'dir-right' },
  forward: { icon: '⬆️', category: 'dir-up' },
  left: { icon: '↩️', category: 'dir-left' },
  right: { icon: '↪️', category: 'dir-right' },
  collect: { icon: '💎', category: 'action' },
  repeat: { icon: '🔁', category: 'control' },
  if: { icon: '🔎', category: 'sensor' },
  call_f1: { icon: '⚡', category: 'fn' },
  call_f2: { icon: '🌟', category: 'fn' },
};

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderPalette(container, allowedBlocks, { lang, t, hintBlockType = null, onAddBlock }) {
  if (!container) return;

  const hasCompass = ['up', 'down', 'move_left', 'move_right'].every((b) => allowedBlocks.includes(b));
  const otherBlocks = allowedBlocks.filter(
    (b) => !['up', 'down', 'move_left', 'move_right'].includes(b) && BLOCK_META[b]
  );

  const pieceBtn = (type, extraClass = '') => {
    const meta = BLOCK_META[type];
    const label = t(lang, `blocks.${type}`);
    const glow = hintBlockType === type ? 'hint-glow' : '';
    return `
      <button
        type="button"
        class="palette-piece cat-${meta.category} ${extraClass} ${glow}"
        data-block-type="${type}"
        draggable="true"
      >
        <span class="piece-icon" aria-hidden="true">${meta.icon}</span>
        <span class="piece-label">${escapeHtml(label)}</span>
      </button>
    `;
  };

  let html = '';
  if (hasCompass) {
    html += `
      <div class="compass-pad" role="group" aria-label="4 Directions">
        <div class="compass-row">${pieceBtn('up', 'compass-btn')}</div>
        <div class="compass-row compass-mid">
          ${pieceBtn('move_left', 'compass-btn')}
          <div class="compass-center" aria-hidden="true">🧭</div>
          ${pieceBtn('move_right', 'compass-btn')}
        </div>
        <div class="compass-row">${pieceBtn('down', 'compass-btn')}</div>
      </div>
    `;
  } else {
    html += allowedBlocks
      .filter((b) => BLOCK_META[b])
      .map((b) => pieceBtn(b))
      .join('');
  }

  if (hasCompass && otherBlocks.length > 0) {
    html += `<div class="palette-extras">${otherBlocks.map((b) => pieceBtn(b, 'extra-btn')).join('')}</div>`;
  }

  container.innerHTML = html;

  container.onclick = (event) => {
    const btn = event.target.closest('.palette-piece');
    if (!btn) return;
    onAddBlock(btn.dataset.blockType);
  };

  container.ondragstart = (event) => {
    const btn = event.target.closest('.palette-piece');
    if (!btn) return;
    event.dataTransfer?.setData('application/x-astrobit-new', btn.dataset.blockType);
    event.dataTransfer?.setData('text/plain', `new:${btn.dataset.blockType}`);
    btn.classList.add('dragging');
  };

  container.ondragend = (event) => {
    event.target.closest('.palette-piece')?.classList.remove('dragging');
  };
}

/**
 * Renders the full interlocking jigsaw puzzle board supporting `main` plus optional `F1`/`F2`
 * function stacks, C-shaped `Repeat` and `If (sensor)` clamps, drag-and-drop, and live highlights.
 */
export function renderWorkspace(
  container,
  program,
  {
    lang,
    t,
    showFunctions = [],
    activeScope = 'main',
    activeContainerId = null,
    runningBlockId,
    failedBlockId,
    newlyAddedId,
    onSelectTarget,
    onRemoveBlock,
    onChangeRepeat,
    onChangeSensor,
    onDropExisting,
    onDropNewFromPalette,
    onHoverBlock,
  }
) {
  if (!container) return;

  const renderList = (list, scope, depth = 0, emptyKey = 'workspaceEmpty', emptyParams = {}) => {
    if (!list || list.length === 0) {
      return `<div class="puzzle-slot-empty ${depth > 0 ? 'inner' : ''}">${escapeHtml(
        t(lang, emptyKey, emptyParams)
      )}</div>`;
    }

    return list
      .map((block) => {
        const metaKey =
          block.type === 'call'
            ? block.fn === 'F2'
              ? 'call_f2'
              : 'call_f1'
            : block.type;
        const meta = BLOCK_META[metaKey] || { icon: '🧩', category: 'dir-right' };
        const label = t(lang, `blocks.${metaKey}`);
        const isRunning = runningBlockId && block.id === runningBlockId;
        const isFailed = failedBlockId && block.id === failedBlockId;
        const isNew = newlyAddedId && block.id === newlyAddedId;
        const stateClass = [
          isFailed ? 'block-error' : isRunning ? 'block-active' : '',
          isNew ? 'snap-pop' : '',
        ]
          .filter(Boolean)
          .join(' ');

        if (block.type === 'repeat') {
          const isFocused = activeScope === scope && activeContainerId === block.id;
          return `
            <div
              class="puzzle-piece puzzle-clamp clamp-repeat ${stateClass} ${isFocused ? 'container-focused' : ''}"
              data-block-id="${block.id}"
              data-scope="${scope}"
              draggable="true"
            >
              <div class="puzzle-clamp-top cat-control">
                <div class="puzzle-left">
                  <span class="drag-grip" aria-hidden="true">⋮⋮</span>
                  <span class="piece-icon">${meta.icon}</span>
                  <span>${escapeHtml(label)}</span>
                  <div class="repeat-stepper">
                    <button type="button" class="step-pill-btn" data-action="rep-dec" data-id="${block.id}" data-scope="${scope}" aria-label="-">−</button>
                    <span class="repeat-count">${block.times}×</span>
                    <button type="button" class="step-pill-btn" data-action="rep-inc" data-id="${block.id}" data-scope="${scope}" aria-label="+">+</button>
                  </div>
                </div>
                <button type="button" class="remove-pill-btn" data-action="remove" data-id="${block.id}" data-scope="${scope}" title="✕">✕</button>
              </div>
              <div class="puzzle-clamp-jaw">
                <div class="puzzle-spine spine-control" aria-hidden="true"></div>
                <div
                  class="puzzle-clamp-body ${isFocused ? 'body-focused' : ''}"
                  data-container-id="${block.id}"
                  data-scope="${scope}"
                >
                  ${isFocused ? `<span class="focus-tag">✨ ${escapeHtml(t(lang, 'addingHere'))}</span>` : ''}
                  ${renderList(block.body, scope, depth + 1, 'repeatEmpty')}
                </div>
              </div>
              <div class="puzzle-clamp-bottom bottom-control"></div>
            </div>
          `;
        }

        if (block.type === 'if') {
          const isFocused = activeScope === scope && activeContainerId === block.id;
          const sensorOptionsHtml = SENSOR_OPTIONS.map((s) => {
            const selected = block.sensor === s ? 'selected' : '';
            return `<option value="${s}" ${selected}>${escapeHtml(t(lang, `sensors.${s}`))}</option>`;
          }).join('');
          return `
            <div
              class="puzzle-piece puzzle-clamp clamp-if ${stateClass} ${isFocused ? 'container-focused' : ''}"
              data-block-id="${block.id}"
              data-scope="${scope}"
              draggable="true"
            >
              <div class="puzzle-clamp-top cat-sensor">
                <div class="puzzle-left">
                  <span class="drag-grip" aria-hidden="true">⋮⋮</span>
                  <span class="piece-icon">${meta.icon}</span>
                  <span>${escapeHtml(label)}</span>
                  <select class="sensor-select" data-sensor-id="${block.id}" data-scope="${scope}">
                    ${sensorOptionsHtml}
                  </select>
                </div>
                <button type="button" class="remove-pill-btn" data-action="remove" data-id="${block.id}" data-scope="${scope}" title="✕">✕</button>
              </div>
              <div class="puzzle-clamp-jaw">
                <div class="puzzle-spine spine-sensor" aria-hidden="true"></div>
                <div
                  class="puzzle-clamp-body ${isFocused ? 'body-focused' : ''}"
                  data-container-id="${block.id}"
                  data-scope="${scope}"
                >
                  ${isFocused ? `<span class="focus-tag">✨ ${escapeHtml(t(lang, 'addingHere'))}</span>` : ''}
                  ${renderList(block.then, scope, depth + 1, 'ifEmpty')}
                </div>
              </div>
              <div class="puzzle-clamp-bottom bottom-sensor"></div>
            </div>
          `;
        }

        return `
          <div
            class="puzzle-piece puzzle-cmd cat-${meta.category} ${stateClass}"
            data-block-id="${block.id}"
            data-scope="${scope}"
            draggable="true"
          >
            <div class="puzzle-left">
              <span class="drag-grip" aria-hidden="true">⋮⋮</span>
              <span class="piece-icon">${meta.icon}</span>
              <span>${escapeHtml(label)}</span>
            </div>
            <button type="button" class="remove-pill-btn" data-action="remove" data-id="${block.id}" data-scope="${scope}" title="✕">✕</button>
          </div>
        `;
      })
      .join('');
  };

  const renderSection = (scope, title, hatClass, blocks, emptyKey, emptyParams = {}) => {
    const isRootFocused = activeScope === scope && activeContainerId === null;
    return `
      <div class="puzzle-section" data-scope="${scope}">
        <button type="button" class="puzzle-hat ${hatClass} ${isRootFocused ? 'hat-focused' : ''}" data-select-scope="${scope}">
          <span>${title}</span>
          ${isRootFocused ? `<span class="hat-badge">✨ ${escapeHtml(t(lang, 'addingHere'))}</span>` : ''}
        </button>
        <div class="puzzle-stack" data-scope="${scope}" data-container-id="">
          ${renderList(blocks, scope, 0, emptyKey, emptyParams)}
        </div>
      </div>
    `;
  };

  let sectionsHtml = renderSection(
    'main',
    `🚩 ${escapeHtml(t(lang, 'hatStart'))}`,
    'hat-main',
    program.main,
    'workspaceEmpty'
  );

  for (const fnName of showFunctions) {
    const icon = fnName === 'F2' ? '🌟' : '⚡';
    sectionsHtml += renderSection(
      fnName,
      `${icon} ${escapeHtml(t(lang, 'hatFn', { fn: fnName }))}`,
      'hat-fn',
      program.functions?.[fnName] || [],
      'fnEmpty',
      { fn: fnName }
    );
  }

  container.innerHTML = `<div class="puzzle-board">${sectionsHtml}</div>`;

  container.onchange = (event) => {
    const sel = event.target.closest('.sensor-select');
    if (!sel) return;
    event.stopPropagation();
    onChangeSensor?.(sel.dataset.scope, sel.dataset.sensorId, sel.value);
  };

  container.onclick = (event) => {
    if (event.target.closest('.sensor-select')) {
      event.stopPropagation();
      return;
    }

    const actionBtn = event.target.closest('[data-action]');
    if (actionBtn) {
      event.stopPropagation();
      const { action, id, scope } = actionBtn.dataset;
      if (action === 'remove') onRemoveBlock(scope, id);
      else if (action === 'rep-inc') onChangeRepeat(scope, id, 1);
      else if (action === 'rep-dec') onChangeRepeat(scope, id, -1);
      return;
    }

    const hatBtn = event.target.closest('[data-select-scope]');
    if (hatBtn) {
      onSelectTarget(hatBtn.dataset.selectScope, null);
      return;
    }

    const clampBody = event.target.closest('.puzzle-clamp-body');
    if (clampBody) {
      event.stopPropagation();
      onSelectTarget(clampBody.dataset.scope, clampBody.dataset.containerId || null);
      return;
    }

    const section = event.target.closest('.puzzle-section');
    if (section && !event.target.closest('.puzzle-clamp')) {
      onSelectTarget(section.dataset.scope, null);
    }
  };

  container.onmouseover = (event) => {
    const piece = event.target.closest('.puzzle-piece');
    onHoverBlock?.(piece?.dataset.blockId || null);
  };
  container.onmouseleave = () => {
    onHoverBlock?.(null);
  };

  let draggedExisting = null;

  const clearDropMarkers = () => {
    container.querySelectorAll('.drop-before, .drop-after, .drop-inside').forEach((el) => {
      el.classList.remove('drop-before', 'drop-after', 'drop-inside');
    });
  };

  container.ondragstart = (event) => {
    if (event.target.closest('select, button')) {
      event.preventDefault();
      return;
    }
    const piece = event.target.closest('.puzzle-piece');
    if (!piece) return;
    event.stopPropagation();
    draggedExisting = { id: piece.dataset.blockId, scope: piece.dataset.scope };
    piece.classList.add('dragging');
    event.dataTransfer?.setData('application/x-astrobit-existing', JSON.stringify(draggedExisting));
    event.dataTransfer?.setData('text/plain', `existing:${piece.dataset.scope}:${piece.dataset.blockId}`);
  };

  container.ondragend = (event) => {
    event.target.closest('.puzzle-piece')?.classList.remove('dragging');
    draggedExisting = null;
    clearDropMarkers();
  };

  container.ondragover = (event) => {
    event.preventDefault();
    clearDropMarkers();

    const targetPiece = event.target.closest('.puzzle-piece');
    const targetClampBody = event.target.closest('.puzzle-clamp-body');
    const isChildPieceInClamp = Boolean(
      targetClampBody && targetPiece && targetClampBody.contains(targetPiece)
    );

    if (targetClampBody && !isChildPieceInClamp) {
      targetClampBody.classList.add('drop-inside');
      return;
    }

    if (targetPiece && targetPiece.dataset.blockId !== draggedExisting?.id) {
      const rect = targetPiece.getBoundingClientRect();
      targetPiece.classList.add(event.clientY < rect.top + rect.height / 2 ? 'drop-before' : 'drop-after');
    } else if (targetClampBody) {
      targetClampBody.classList.add('drop-inside');
    }
  };

  container.ondragleave = (event) => {
    if (!container.contains(event.relatedTarget)) {
      clearDropMarkers();
    }
  };

  container.ondrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const raw = event.dataTransfer?.getData('text/plain') || '';
    const newType =
      event.dataTransfer?.getData('application/x-astrobit-new') ||
      (raw.startsWith('new:') ? raw.slice(4) : '');

    let existing = draggedExisting;
    if (!existing) {
      const json = event.dataTransfer?.getData('application/x-astrobit-existing');
      if (json) {
        try {
          existing = JSON.parse(json);
        } catch {
          existing = null;
        }
      }
    }

    const targetPiece = event.target.closest('.puzzle-piece');
    const targetClampBody = event.target.closest('.puzzle-clamp-body');
    const targetSection = event.target.closest('.puzzle-section');
    const isChildPieceInClamp = Boolean(
      targetClampBody && targetPiece && targetClampBody.contains(targetPiece)
    );
    const targetScope =
      targetClampBody?.dataset.scope ||
      targetPiece?.dataset.scope ||
      targetSection?.dataset.scope ||
      'main';

    let dropMeta = { mode: 'append', scope: targetScope, containerId: null, anchorId: null, position: 'after' };
    if (targetClampBody && !isChildPieceInClamp) {
      dropMeta = {
        mode: 'append',
        scope: targetScope,
        containerId: targetClampBody.dataset.containerId || null,
      };
    } else if (targetPiece && targetPiece.dataset.blockId !== existing?.id) {
      const rect = targetPiece.getBoundingClientRect();
      const position = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
      dropMeta = {
        mode: 'relative',
        scope: targetScope,
        anchorId: targetPiece.dataset.blockId,
        position,
        containerId: null,
      };
    } else if (targetClampBody) {
      dropMeta = {
        mode: 'append',
        scope: targetScope,
        containerId: targetClampBody.dataset.containerId || null,
      };
    }

    clearDropMarkers();
    draggedExisting = null;

    if (newType) {
      onDropNewFromPalette(newType, dropMeta);
    } else if (existing?.id) {
      onDropExisting(existing, dropMeta);
    }
  };
}
