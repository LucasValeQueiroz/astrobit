/**
 * AstroBit Jigsaw Puzzle Workspace — Interlocking Scratch-style puzzle pieces,
 * 4-direction compass palette, drag-from-palette, drag-to-reorder, and pure AST helpers.
 */

let nextBlockSeq = 1;

export function createBlock(type) {
  const id = `b${nextBlockSeq++}`;
  if (type === 'repeat') {
    return { id, type: 'repeat', times: 3, body: [] };
  }
  return { id, type };
}

export function cloneBlocks(blocks = []) {
  return JSON.parse(JSON.stringify(blocks));
}

export function appendBlockToTarget(blocks, targetId, newBlock) {
  const copy = cloneBlocks(blocks);
  if (!targetId) {
    copy.push(newBlock);
    return copy;
  }

  const insertRecursive = (list) => {
    for (const item of list) {
      if (item.id === targetId && item.type === 'repeat') {
        item.body = Array.isArray(item.body) ? item.body : [];
        item.body.push(newBlock);
        return true;
      }
      if (item.type === 'repeat' && Array.isArray(item.body)) {
        if (insertRecursive(item.body)) return true;
      }
    }
    return false;
  };

  if (!insertRecursive(copy)) {
    copy.push(newBlock);
  }
  return copy;
}

/**
 * Inserts `newBlock` directly before or after `anchorBlockId` inside whichever list holds it.
 */
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
      if (item.type === 'repeat' && Array.isArray(item.body)) {
        if (insertRec(item.body)) return true;
      }
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
      if (item.type === 'repeat' && Array.isArray(item.body)) {
        if (removeRec(item.body)) return true;
      }
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
      if (item.type === 'repeat' && Array.isArray(item.body)) {
        if (moveRec(item.body)) return true;
      }
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
      if (item.type === 'repeat' && Array.isArray(item.body)) {
        if (updateRec(item.body)) return true;
      }
    }
    return false;
  };
  updateRec(copy);
  return copy;
}

export function findBlockById(blocks, blockId) {
  for (const b of blocks) {
    if (b.id === blockId) return b;
    if (b.type === 'repeat' && Array.isArray(b.body)) {
      const found = findBlockById(b.body, blockId);
      if (found) return found;
    }
  }
  return null;
}

export function findContainerExists(blocks, targetId) {
  if (!targetId) return true;
  for (const item of blocks) {
    if (item.id === targetId && item.type === 'repeat') return true;
    if (item.type === 'repeat' && Array.isArray(item.body)) {
      if (findContainerExists(item.body, targetId)) return true;
    }
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
};

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Renders the 4-direction visual Compass + Action/Loop puzzle palette.
 * Every piece can be clicked/tapped OR dragged directly onto the puzzle stack!
 */
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
 * Renders the interlocking Scratch-style jigsaw puzzle stack.
 * Zero confusing reorder arrows on the right — clean drag grip (⋮⋮), real jigsaw notches/tabs,
 * hover tile highlight, and drop-anywhere insertion!
 */
export function renderWorkspace(
  container,
  blocks,
  {
    lang,
    t,
    activeContainerId,
    runningBlockId,
    failedBlockId,
    newlyAddedId,
    onSelectContainer,
    onRemoveBlock,
    onChangeRepeat,
    onDropExisting,
    onDropNewFromPalette,
    onHoverBlock,
  }
) {
  if (!container) return;

  const renderList = (list, depth = 0) => {
    if (!list || list.length === 0) {
      return depth === 0
        ? `<div class="puzzle-slot-empty">${escapeHtml(t(lang, 'workspaceEmpty'))}</div>`
        : `<div class="puzzle-slot-empty inner">${escapeHtml(t(lang, 'repeatEmpty'))}</div>`;
    }

    return list
      .map((block) => {
        const meta = BLOCK_META[block.type] || { icon: '🧩', category: 'dir-right' };
        const label = t(lang, `blocks.${block.type}`);
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
          const isFocused = activeContainerId === block.id;
          return `
            <div
              class="puzzle-piece puzzle-repeat cat-control ${stateClass} ${isFocused ? 'container-focused' : ''}"
              data-block-id="${block.id}"
              draggable="true"
            >
              <div class="puzzle-repeat-top">
                <div class="puzzle-left">
                  <span class="drag-grip" aria-hidden="true">⋮⋮</span>
                  <span class="piece-icon">${meta.icon}</span>
                  <span>${escapeHtml(label)}</span>
                  <div class="repeat-stepper">
                    <button type="button" class="step-pill-btn" data-action="rep-dec" data-id="${block.id}" aria-label="-">−</button>
                    <span class="repeat-count">${block.times}×</span>
                    <button type="button" class="step-pill-btn" data-action="rep-inc" data-id="${block.id}" aria-label="+">+</button>
                  </div>
                </div>
                <button type="button" class="remove-pill-btn" data-action="remove" data-id="${block.id}" title="✕">✕</button>
              </div>
              <div class="puzzle-repeat-jaw">
                <div class="puzzle-spine" aria-hidden="true"></div>
                <div
                  class="puzzle-repeat-body ${isFocused ? 'body-focused' : ''}"
                  data-container-id="${block.id}"
                >
                  ${isFocused ? `<span class="focus-tag">✨ ${escapeHtml(t(lang, 'addingHere'))}</span>` : ''}
                  ${renderList(block.body, depth + 1)}
                </div>
              </div>
              <div class="puzzle-repeat-bottom"></div>
            </div>
          `;
        }

        return `
          <div
            class="puzzle-piece puzzle-cmd cat-${meta.category} ${stateClass}"
            data-block-id="${block.id}"
            draggable="true"
          >
            <div class="puzzle-left">
              <span class="drag-grip" aria-hidden="true">⋮⋮</span>
              <span class="piece-icon">${meta.icon}</span>
              <span>${escapeHtml(label)}</span>
            </div>
            <button type="button" class="remove-pill-btn" data-action="remove" data-id="${block.id}" title="✕">✕</button>
          </div>
        `;
      })
      .join('');
  };

  const rootFocused = activeContainerId === null;
  container.innerHTML = `
    <div class="puzzle-board ${rootFocused ? 'root-focused' : ''}" data-container-id="">
      <button type="button" class="puzzle-hat ${rootFocused ? 'hat-focused' : ''}" data-select-root="true">
        <span>🚩 ${escapeHtml(t(lang, 'hatStart'))}</span>
        ${rootFocused ? `<span class="hat-badge">✨ ${escapeHtml(t(lang, 'addingHere'))}</span>` : ''}
      </button>
      <div class="puzzle-stack" data-container-id="">
        ${renderList(blocks, 0)}
      </div>
    </div>
  `;

  container.onclick = (event) => {
    const actionBtn = event.target.closest('[data-action]');
    if (actionBtn) {
      event.stopPropagation();
      const { action, id } = actionBtn.dataset;
      if (action === 'remove') onRemoveBlock(id);
      else if (action === 'rep-inc') onChangeRepeat(id, 1);
      else if (action === 'rep-dec') onChangeRepeat(id, -1);
      return;
    }

    if (event.target.closest('[data-select-root]')) {
      onSelectContainer(null);
      return;
    }

    const repeatBody = event.target.closest('.puzzle-repeat-body');
    if (repeatBody) {
      event.stopPropagation();
      onSelectContainer(repeatBody.dataset.containerId || null);
      return;
    }

    if (event.target.closest('.puzzle-board') && !event.target.closest('.puzzle-repeat')) {
      onSelectContainer(null);
    }
  };

  // Hovering a puzzle piece highlights that step's destination tile on the Canvas!
  container.onmouseover = (event) => {
    const piece = event.target.closest('.puzzle-piece');
    onHoverBlock?.(piece?.dataset.blockId || null);
  };
  container.onmouseleave = () => {
    onHoverBlock?.(null);
  };

  // Full Drag-and-Drop (both from Palette AND reordering existing pieces!)
  let draggedExistingId = null;

  const clearDropMarkers = () => {
    container.querySelectorAll('.drop-before, .drop-after, .drop-inside').forEach((el) => {
      el.classList.remove('drop-before', 'drop-after', 'drop-inside');
    });
  };

  container.ondragstart = (event) => {
    const piece = event.target.closest('.puzzle-piece');
    if (!piece) return;
    event.stopPropagation();
    draggedExistingId = piece.dataset.blockId;
    piece.classList.add('dragging');
    event.dataTransfer?.setData('application/x-astrobit-existing', draggedExistingId);
    event.dataTransfer?.setData('text/plain', `existing:${draggedExistingId}`);
  };

  container.ondragend = (event) => {
    event.target.closest('.puzzle-piece')?.classList.remove('dragging');
    draggedExistingId = null;
    clearDropMarkers();
  };

  container.ondragover = (event) => {
    event.preventDefault();
    clearDropMarkers();

    const targetPiece = event.target.closest('.puzzle-piece');
    const targetRepeatBody = event.target.closest('.puzzle-repeat-body');

    if (targetRepeatBody && (!targetPiece || targetRepeatBody.contains(targetPiece))) {
      if (targetPiece && targetPiece.dataset.blockId !== draggedExistingId) {
        const rect = targetPiece.getBoundingClientRect();
        const isTop = event.clientY < rect.top + rect.height / 2;
        targetPiece.classList.add(isTop ? 'drop-before' : 'drop-after');
      } else {
        targetRepeatBody.classList.add('drop-inside');
      }
      return;
    }

    if (targetPiece && targetPiece.dataset.blockId !== draggedExistingId) {
      const rect = targetPiece.getBoundingClientRect();
      const isTop = event.clientY < rect.top + rect.height / 2;
      targetPiece.classList.add(isTop ? 'drop-before' : 'drop-after');
    } else if (targetRepeatBody) {
      targetRepeatBody.classList.add('drop-inside');
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
    const existingId =
      draggedExistingId ||
      event.dataTransfer?.getData('application/x-astrobit-existing') ||
      (raw.startsWith('existing:') ? raw.slice(9) : '');

    const targetPiece = event.target.closest('.puzzle-piece');
    const targetRepeatBody = event.target.closest('.puzzle-repeat-body');

    let dropMeta = { mode: 'append', containerId: null, anchorId: null, position: 'after' };
    if (targetPiece && targetPiece.dataset.blockId !== existingId) {
      const rect = targetPiece.getBoundingClientRect();
      const position = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
      dropMeta = { mode: 'relative', anchorId: targetPiece.dataset.blockId, position, containerId: null };
    } else if (targetRepeatBody) {
      dropMeta = { mode: 'append', containerId: targetRepeatBody.dataset.containerId || null };
    }

    clearDropMarkers();
    draggedExistingId = null;

    if (newType) {
      onDropNewFromPalette(newType, dropMeta);
    } else if (existingId) {
      onDropExisting(existingId, dropMeta);
    }
  };
}
